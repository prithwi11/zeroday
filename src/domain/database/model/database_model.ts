import { DataTypes } from "sequelize";
import { Model } from "../../../model";

export class DatabaseModel extends Model {
    constructor() {
        super(
            'databases',
            {
                database_id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                database_name: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                },
                db_connection: {
                    type: DataTypes.JSONB,
                    allowNull: false,
                    defaultValue: {}
                },
                fk_user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false
                },
                added_timestamp: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW
                },
                modified_timestamp: {
                    type: DataTypes.DATE,
                    allowNull: true
                }
            },
            {
                timestamps: false,
                freezeTableName: true,
                tableName: "databases",
                schema: "main"
            }
        );
    }
}
