import { DataTypes } from "sequelize";
import { Model } from "../../../model";

export class ExplainAnalyzeModel extends Model {
    constructor() {
        super(
            'explain_analyze',
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                fk_snapshot_query_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false
                },
                parent_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                    references: {
                        model: 'explain_analyze',
                        key: 'id'
                    }
                },
                node_type: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                },
                estimated_rows: {
                    type: DataTypes.BIGINT,
                    allowNull: true
                },
                actual_rows: {
                    type: DataTypes.BIGINT,
                    allowNull: true
                },
                startup_time: {
                    type: DataTypes.DECIMAL,
                    allowNull: true
                },
                execution_time: {
                    type: DataTypes.DECIMAL,
                    allowNull: true
                },
                rows_removed_by_filter: {
                    type: DataTypes.BIGINT,
                    allowNull: true
                },
                loops: {
                    type: DataTypes.INTEGER,
                    allowNull: true
                },
                shared_read_blocks: {
                    type: DataTypes.BIGINT,
                    allowNull: true
                },
                shared_hit_blocks: {
                    type: DataTypes.BIGINT,
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
                tableName: "explain_analyze",
                schema: "main"
            }
        );
    }   
}