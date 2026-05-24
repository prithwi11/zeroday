import { DataTypes } from "sequelize";
import { Model } from "../../../model";

export class UserModel extends Model {
    constructor() {
        super(
            'users',
            {
                user_id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                first_name: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                },
                email: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                },
                password: {
                    type: DataTypes.TEXT,
                    allowNull: false
                },
                added_timestamp: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW
                },
                modified_timestamp: {
                    type: DataTypes.DATE,
                    allowNull: true
                },
                is_deleted: {
                    type: DataTypes.SMALLINT,
                    allowNull: true
                }
            },
            {
                timestamps: false,
                freezeTableName: true,
                tableName: "users",
                schema: "main"
            }
        );
    }
}
