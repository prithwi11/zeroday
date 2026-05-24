import { Response } from 'express';
import { DatabaseModel } from '../model/database_model';
import { AuthRequest } from '../../../middlewares/common_middleware';

export class DatabaseController {
    private _databaseModel = new DatabaseModel();

    addDatabase = async (req: AuthRequest, res: Response) => {
        try {
            const { database_name, db_connection } = req.body;
            const user_id = req.user.user_id;
            console.log(req.user)
            if (!database_name || !db_connection) {
                return res.status(400).json({ success: false, message: 'All fields are required' });
            }
    
            const db = await this._databaseModel.addNewRecord({ database_name, db_connection, fk_user_id: user_id });
    
            return res.status(201).json({ success: true, message: 'Database registered successfully', data: db });
        } catch (error) {
            console.log(error)
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };
    
    listDatabases = async (req: AuthRequest, res: Response) => {
        try {
            const user_id = req.user.user_id;
            const databases = await this._databaseModel.findByAnyOne({
                attributes: ['database_id', 'database_name'],
                where: {
                    fk_user_id: user_id
                }
            });
    
            return res.status(200).json({ success: true, data: databases });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };
}
