export interface IDatabase {
    database_id?: number;
    database_name: string;
    db_connection: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
    };
    fk_user_id: number;
    added_timestamp?: Date;
}