import { Response } from "express";
import { AuthRequest } from "../../../middlewares/common_middleware";
import { DatabaseModel } from "../../database/model/database_model";
import { SnapshotModel } from "../../snapshot/model/model.snapshot";
import { SnapshotQueryModel } from "../../snapshot/model/model.snapshot_query";

export class DashboardController {
    private _databaseModel = new DatabaseModel();
    private _snapshotModel = new SnapshotModel();
    private _snapshotQueryModel = new SnapshotQueryModel();

    dashboard = async(req: AuthRequest, res: Response) => {
        try {
            const user_id = req.user.user_id;
            const findDatabase: any = await this._databaseModel.findByAnyOne({
                attributes: ['database_id'],
                where: {
                    fk_user_id: user_id
                }
            });
            if (!findDatabase) {
                return res.status(400).json({ success: false, 'message': 'No Database found' })
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
                return res.status(400).json({ success: false, message: 'Not enough data produced to show dashboard, Please trigger first' });
            }

            const snapshot_data: any = await this._snapshotQueryModel.fetchDashboard(lastTwoSnapshotIds);
            console.log("snapshot_data", snapshot_data);
            return res.status(200).json({ success: true, message: 'data fetched successfully', data: snapshot_data });
        }
        catch (error: any) {
            console.log(error.stack, error);
            return res.status(500).json({ success: false, 'message' : 'Something went wrong, Please try again later!' });
        }
    }
}