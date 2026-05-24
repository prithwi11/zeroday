import { DataTypes } from "sequelize";
import { Model } from "../../../model";

export class SnapshotQueryModel extends Model {
    constructor() {
        super(
            'snapshot_queries',
            {
                query_id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                query_text: {
                    type: DataTypes.TEXT,
                    allowNull: false
                },
                pg_stat_queryId: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                fk_snapshot_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false
                },
                calls: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    defaultValue: 0
                },
                total_exec_time: {
                    type: DataTypes.DECIMAL,
                    allowNull: true
                },
                mean_exec_time: {
                    type: DataTypes.DECIMAL,
                    allowNull: true
                },
                added_timestamp: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW
                }
            },
            {
                timestamps: false,
                freezeTableName: true,
                tableName: "snapshot_queries",
                schema: "main"
            }
        );
    }
}
