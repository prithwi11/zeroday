import { DataTypes } from "sequelize";
import { Model } from "../../../model";

export class SnapshotModel extends Model {
    constructor() {
        super(
            'snapshots',
            {
                snapshot_id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                unique_snapshot_id: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                },
                fk_database_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false
                },
                captured_at: {
                    type: DataTypes.DATE,
                    allowNull: false
                },
                captured_by: {
                    type: DataTypes.BIGINT,
                    allowNull: false
                }
            },
            {
                timestamps: false,
                freezeTableName: true,
                tableName: "snapshots",
                schema: "main"
            }
        );
    }
}
