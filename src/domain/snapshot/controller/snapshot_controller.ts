import { Response } from "express";
import { AuthRequest } from "../../../middlewares/common_middleware";
import { DatabaseModel } from "../../database/model/database_model";
import { SnapshotModel } from "../model/model.snapshot";
import { SnapshotQueryModel } from "../model/model.snapshot_query";
import { Client } from "pg";
import { ExplainAnalyzeModel } from "../model/model.explain_analyze";

export class SnapshotController {
    private _databaseModel = new DatabaseModel();
    private _snapshotModel = new SnapshotModel();
    private _snapshotQueryModel = new SnapshotQueryModel();
    private _explainAnalyzeModel = new ExplainAnalyzeModel();

    trigger = async(req: AuthRequest, res: Response) => {
        try {
            const { database_id } = req.body;
            if (!database_id) {
                return res.status(400).json({ success: false, message: 'Please provide database_id' });
            }
    
            const user_id = req.user.user_id;
    
            const findDatabase: any = await this._databaseModel.findByAnyOne({
                attributes: ['database_name', 'db_connection', 'type'],
                where: { database_id: database_id }
            });
            if (!findDatabase) {
                return res.status(400).json({ success: false, message: 'No database found' });
            }
    
            let client: any;
            if (findDatabase.type == 1) {
                client = new Client({
                    user: findDatabase.db_connection.user,
                    host: findDatabase.db_connection.host,
                    database: findDatabase.database_name,
                    password: findDatabase.db_connection.password,
                    port: 5432
                });
            }
            if (!client) {
                return res.status(400).json({ success: false, message: "Something went wrong, Please try again later" });
            }
    
            try {
                await client.connect();
                await client.query("CREATE EXTENSION IF NOT EXISTS pg_stat_statements;");
    
                const performanceQuery = `
                    SELECT pss.* 
                    FROM main.pg_stat_statements pss
                    JOIN pg_database pd ON pd.oid = pss.dbid
                    WHERE pd.datname = current_database()
                    ORDER BY total_exec_time DESC 
                    LIMIT 50;
                `;
                const result = await client.query(performanceQuery);
    
                // Step 1 — Save current snapshot
                const snapshot_data: any = {
                    unique_snapshot_id: global.Helpers.generateUniqueCode('S', 6),
                    fk_database_id: database_id,
                    captured_at: new Date(),
                    captured_by: user_id
                }
                const addSnapshot: any = await this._snapshotModel.addNewRecord(snapshot_data);
                const snapshot_id = addSnapshot.snapshot_id;
    
                if (!snapshot_id) {
                    return res.status(500).json({ success: false, message: "Failed to create snapshot" });
                }
    
                // Step 2 — Fetch previous snapshot queries
                const previousSnapshot: any = await this._snapshotModel.findByAnyOne({
                    attributes: ['snapshot_id'],
                    where: { fk_database_id: database_id },
                    order: [['captured_at', 'DESC']],
                    offset: 1,
                    limit: 1
                });
    
                let previousQueriesMap: Map<string, any> = new Map();
                if (previousSnapshot) {
                    const previousQueries: any[] = await this._snapshotQueryModel.findAllByAny({
                        where: { fk_snapshot_id: previousSnapshot.snapshot_id }
                    });
                    previousQueries.forEach((q: any) => {
                        previousQueriesMap.set(String(q.pg_stat_queryId), q);
                    });
                }
    
                // Step 3 — Bulk insert current snapshot queries
                let snapshot_query: any[] = result.rows.map((row: any) => ({
                    query_text: row.query,
                    pg_stat_queryId: row.queryid,
                    fk_snapshot_id: snapshot_id,
                    calls: row.calls,
                    total_exec_time: row.total_exec_time,
                    mean_exec_time: row.mean_exec_time
                }));
    
                await this._snapshotQueryModel.bulkInsert(snapshot_query);
    
                // Step 4 — Fetch inserted snapshot queries to get their IDs
                const insertedQueries: any[] = await this._snapshotQueryModel.findAllByAny({
                    where: { fk_snapshot_id: snapshot_id }
                });
                const insertedQueriesMap: Map<string, any> = new Map();
                insertedQueries.forEach((q: any) => {
                    insertedQueriesMap.set(String(q.pg_stat_queryId), q);
                });
    
                // Step 5 — Detect regression and capture EXPLAIN ANALYZE
                for (const row of result.rows) {
                    const prevQuery = previousQueriesMap.get(String(row.queryid));
                    if (!prevQuery) continue;
    
                    const callsDelta = row.calls - prevQuery.calls;
                    const timeDelta = row.total_exec_time - prevQuery.total_exec_time;
                    if (callsDelta <= 0 || timeDelta <= 0) continue;
    
                    const current_avg = timeDelta / callsDelta;
    
                    const regression = await this.detectRegression(
                        database_id,
                        String(row.queryid),
                        current_avg,
                        snapshot_id
                    );

                    console.log("Regression ===================> ", regression)
    
                    if (regression.detected) {
                        const insertedQuery = insertedQueriesMap.get(String(row.queryid));
                        if (!insertedQuery) continue;
                    
                        const trimmedQuery = row.query.trim().toUpperCase();
                        if (!trimmedQuery.startsWith('SELECT')) continue;
                    
                        try {
                            const sanitizedQuery = row.query.replace(/\$\d+/g, 'NULL');
                            const explainResult = await client.query(
                                `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sanitizedQuery}`
                            );
                            const plan = explainResult.rows[0]['QUERY PLAN'];
                            await this.insertIntoExplain(plan, insertedQuery.query_id);
                        } catch(explainError: any) {
                            console.log('EXPLAIN failed for query:', row.queryid, explainError.message);
                        }
                    }
                }
    
                return res.status(200).json({ success: true, message: "Data fetched successfully" });
            }
            catch (errorDB: any) {
                console.log(errorDB);
                return res.status(400).json({ success: false, message: 'Error connecting to the database' });
            }
        }
        catch (error: any) {
            console.log(error, error.stack);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
    
    insertPlanNodes = async(node: any, fk_snapshot_query_id: number, parent_id: number | null): Promise<void> => {
        const inserted: any = await this._explainAnalyzeModel.addNewRecord({
            fk_snapshot_query_id: fk_snapshot_query_id,
            parent_id: parent_id,
            node_type: node['Node Type'],
            estimated_rows: node['Plan Rows'] ?? null,
            actual_rows: node['Actual Rows'] ?? null,
            startup_time: node['Actual Startup Time'] ?? null,
            execution_time: node['Actual Total Time'] ?? null,
            rows_removed_by_filter: node['Rows Removed by Filter'] ?? null,
            loops: node['Actual Loops'] ?? null,
            shared_read_blocks: node['Shared Read Blocks'] ?? null,
            shared_hit_blocks: node['Shared Hit Blocks'] ?? null,
        });
    
        if (node['Plans'] && node['Plans'].length > 0) {
            for (const childNode of node['Plans']) {
                await this.insertPlanNodes(childNode, fk_snapshot_query_id, inserted.id);
            }
        }
    }

    detectRegression = async(database_id: number, queryId: string, current_avg: number, latestSnapshotId: any) => {
        const historicalWindows: any[] = await this._snapshotQueryModel.getHistoricalWindows(database_id, queryId, 7, latestSnapshotId);
        if (historicalWindows.length < 3) {
            return {
                detected: false,
                reason: 'insufficient_history',
                windows_compared: historicalWindows.length
            }
        }

        const values: number[] = historicalWindows.map((w: any) => parseFloat(w.avg_time_in_window));

        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const stddev = Math.sqrt(variance);

        if (stddev  < 0.0001) {
            return {
                detected: false,
                reason: 'no_variance',
                windows_compared: historicalWindows.length
            }
        }

        const zScore = (current_avg - mean) / stddev;

        return {
            detected: zScore > 2,
            z_score: parseFloat(zScore.toFixed(2)),
            historical_mean: parseFloat(mean.toFixed(2)),
            historical_stddev: parseFloat(stddev.toFixed(2)),
            windows_compared: historicalWindows.length,
            severity: zScore > 3 ? 'high' : 'low'
        }
    }

    insertIntoExplain = async(explainJson: any, fk_snapshot_query_id: number) => {
        try {
            const rootPlan = explainJson[0]?.Plan;
            if (!rootPlan) return;
                
            const processNode = async(nodeData: any, parentId: number | null) => {
                const insertObj: any = {
                    fk_snapshot_query_id: fk_snapshot_query_id,
                    parent_id: parentId,
                    node_type: nodeData['Node Type'],
                    estimated_rows: nodeData['Plan Rows'] !== undefined ? BigInt(nodeData['Plan Rows']) : null,
                    actual_rows: nodeData['Actual Rows'] !== undefined ? BigInt(nodeData['Actual Rows']) : null,
                    startup_time: nodeData['Actual Startup Time'] !== undefined ? nodeData['Actual Startup Time'] : null,
                    execution_time: nodeData['Actual Total Time'] !== undefined ? nodeData['Actual Total Time'] : null,
                    rows_removed_by_filter: nodeData['Rows Removed by Filter'] !== undefined ? BigInt(nodeData['Rows Removed by Filter']) : null,
                    loops: nodeData['Actual Loops'] !== undefined ? parseInt(nodeData['Actual Loops'], 10) : null,
                    shared_read_blocks: nodeData['Shared Read Blocks'] !== undefined ? BigInt(nodeData['Shared Read Blocks']) : null,
                    shared_hit_blocks: nodeData['Shared Hit Blocks'] !== undefined ? BigInt(nodeData['Shared Hit Blocks']) : null
                };

                let insertExplain: any = await this._explainAnalyzeModel.addNewRecord(insertObj);
                let currentNodeId: number = insertExplain.id;
                if (nodeData.Plans && Array.isArray(nodeData.Plans)) {
                    for (const childPlan of nodeData.Plans) {
                        await processNode(childPlan, currentNodeId);
                    }
                }
            }
            await processNode(rootPlan, null);
            
        }
        catch(error: any) {
            console.log(error, error.stack);
            return { status: false, success: false, 'message' : 'Something went wrong, Please try again later!' };
        }
    }
}