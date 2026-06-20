import { Response } from 'express';
import { DatabaseModel } from '../model/database_model';
import { AuthRequest } from '../../../middlewares/common_middleware';
import { Client } from 'pg';
import parse from "pg-connection-string";
import { AppError } from '../../../errors/AppError';

export class DatabaseController {
    private _databaseModel = new DatabaseModel();

    addDatabase = async (req: AuthRequest, res: Response) => {
        const { database_name, db_connection, type } = req.body;
        const user_id = req.user.user_id;
        console.log(req.user)
        if (!database_name || !db_connection) {
            throw AppError.badRequest('All fields are required');
        }

        const db = await this._databaseModel.addNewRecord({ database_name, db_connection, fk_user_id: user_id });

        return res.status(201).json({ success: true, message: 'Database registered successfully', data: db });
    };
    
    listDatabases = async (req: AuthRequest, res: Response) => {
        const user_id = req.user.user_id;
        const databases = await this._databaseModel.findByAnyOne({
            attributes: ['database_id', 'database_name'],
            where: {
                fk_user_id: user_id
            }
        });

        return res.status(200).json({ success: true, data: databases });
    };

    connectToDatabase = async(req: AuthRequest, res: Response) => {
        const { database_id } = req.body;
        const database_data: any = await this._databaseModel.findByAnyOne({
            attributes: ['database_name', 'db_connection', 'type'],
            where: {
                database_id: database_id
            }
        });
        console.log("database_data ========> ", database_data);
        if (!database_data) {
            throw AppError.badRequest('No Database records found');
        }
        
        let client: any;

        if (database_data.type == 1) {
            const db_host: any = database_data.db_connection.host;
            const db_name = database_data.database_name;
            const user = database_data.db_connection.user;
            const password = database_data.db_connection.password;
            
            client = new Client({
                user: user,
                host: db_host,
                database: db_name,
                password: password,
                port: 5432
            });
        }
        else {
            const connection_string: any = database_data.db_connection.connection_string;
            const configOptions: any = parse.parse(connection_string);
            /* client = new Client({
                connectionString: connection_string,
                ssl: { rejectUnauthorized: true },
                connectionTimeoutMillis: 20000, 
            }); */
            client = new Client({
                host: configOptions.host,
                user: configOptions.user,
                password: configOptions.password,
                database: configOptions.database,
                port: 5432,
                ssl: {
                    rejectUnauthorized: true
                }
            });
        }

        const connection = await client.connect();
        console.log("Connection established to : ");
        return res.status(400).json({ success: true, message: "Connected to database" });
    }
}
