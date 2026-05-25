import { Response } from "express";
import { AuthRequest } from "../../../middlewares/common_middleware";
import { DatabaseModel } from "../../database/model/database_model";
import { SnapshotModel } from "../model/model.snapshot";
import { SnapshotQueryModel } from "../model/model.snapshot_query";
import { Client } from "pg";

export class SnapshotController {
    private _databaseModel = new DatabaseModel();
    private _snapshotModel = new SnapshotModel();
    private _snapshotQueryModel = new SnapshotQueryModel();

    trigger = async(req: AuthRequest, res: Response) => {
        try {
            const { database_id } = req.body;
            if (!database_id) {
                return res.status(400).json({ success: false, message: 'Please provide database_id' });
            }

            const user_id = req.user.user_id;

            const findDatabase: any = await this._databaseModel.findByAnyOne({
                attributes: ['database_name', 'db_connection', 'type'],
                where: {
                    database_id: database_id
                }
            });
            if (!findDatabase) {
                return res.status(400).json({ success: false, message: 'No database found' });
            }

            let client: any;
            if (findDatabase.type == 1) {
                const db_host: any = findDatabase.db_connection.host;
                const db_name = findDatabase.database_name;
                const user = findDatabase.db_connection.user;
                const password = findDatabase.db_connection.password;
                
                client = new Client({
                    user: user,
                    host: db_host,
                    database: db_name,
                    password: password,
                    port: 5432
                });
            }
            if (!client) {
                return res.status(400).json({ success: false, message: "Something went wrong, Please try again later" });   
            }

            try {
                //Establish the connection database
                await client.connect();

                await client.query("CREATE EXTENSION IF NOT EXISTS pg_stat_statements;")
                //Run the performance query
                const performanceQuery = " SELECT * FROM main.pg_stat_statements ORDER BY total_exec_time DESC LIMIT 50;";

                const result = await client.query(performanceQuery);

                // Add Data into snapshot table
                const snapshot_data: any = {
                    unique_snapshot_id: global.Helpers.generateUniqueCode('S', 6),
                    fk_database_id: database_id,
                    captured_at: new Date(),
                    captured_by: user_id
                }

                const addSnapshot: any = await this._snapshotModel.addNewRecord(snapshot_data);
                const snapshot_id = addSnapshot.snapshot_id;

                if (snapshot_id) {
                    let query_results: any = result.rows;
                    let snapshot_query: any[] = [];
                    query_results.forEach((result: any) => {
                        
                        snapshot_query.push({
                            query_text: result.query,
                            pg_stat_queryId: result.queryid,
                            fk_snapshot_id: snapshot_id,
                            calls: result.calls,
                            total_exec_time: result.total_exec_time,
                            mean_exec_time: result.mean_exec_time
                        });
                    });
                    const addSnapshotQuery: any = await this._snapshotQueryModel.bulkInsert(snapshot_query);

                    return res.status(200).json({ success: true, message: "Data fetched successfully", data: result.rows });
                }

                // Add data into snapshot queries table
            }
            catch (errorDB: any) {
                console.log(errorDB)
                return res.status(400).json({ success: false, message: 'Error connecting to the database'});
            }

        }
        catch (error: any) {
            console.log(error, error.stack);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}