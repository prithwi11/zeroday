import { Response } from "express";
import { AuthRequest } from "../../../middlewares/common_middleware";
import { DatabaseModel } from "../../database/model/database_model";
import { SnapshotModel } from "../../snapshot/model/model.snapshot";
import { SnapshotQueryModel } from "../../snapshot/model/model.snapshot_query";
import { ExplainAnalyzeModel } from "../../snapshot/model/model.explain_analyze";
import { AppError } from "../../../errors/AppError";

export class DashboardController {
    private _databaseModel = new DatabaseModel();
    private _snapshotModel = new SnapshotModel();
    private _snapshotQueryModel = new SnapshotQueryModel();
    private _explainAnalyzeModel = new ExplainAnalyzeModel();

    dashboard = async(req: AuthRequest, res: Response) => {
        const user_id = req.user.user_id;
        const findDatabase: any = await this._databaseModel.findByAnyOne({
            attributes: ['database_id'],
            where: {
                fk_user_id: user_id
            }
        });
        if (!findDatabase) {
            throw AppError.badRequest('No Database found')
        }

        const database_id = findDatabase.database_id;

        const findSnapshot: any = await this._snapshotModel.findAllByAny({
            attributes: ['snapshot_id', 'captured_at'],
            where: {
                fk_database_id: database_id
            },
            order: [['captured_at', 'DESC']],
            limit: 2
        });
        const snapshot_arr: object[] = [];
        if (!findSnapshot || findSnapshot.length == 0) {
            return res.status(200).json({ success: true, message: 'data fetched successfully', data: snapshot_arr });
        }
        const lastTwoSnapshotIds: number[] = findSnapshot ? findSnapshot.map((snap: any) => snap.snapshot_id): [];
        if (lastTwoSnapshotIds.length < 2) {
            throw AppError.badRequest('Not enough data produced to show dashboard, Please trigger first');
        }

        const snapshot_data: any = await this._snapshotQueryModel.fetchDashboard(lastTwoSnapshotIds);
        console.log("snapshot_data", snapshot_data);
        if (snapshot_data.length > 0) {
            const enriched = await Promise.all(
                snapshot_data.map(async (snapshot: any) => {
                    const regression = await this.detectRegression(database_id, snapshot.pg_stat_queryId, parseFloat(snapshot.avg_time_in_window), lastTwoSnapshotIds[0]);
                    return { ...snapshot, regression }
                })
            )
            return res.status(200).json({ success: true, message: 'data fetched successfully', data: enriched });
        }
        return res.status(200).json({ success: true, message: 'data fetched successfully', data: snapshot_data });
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
}