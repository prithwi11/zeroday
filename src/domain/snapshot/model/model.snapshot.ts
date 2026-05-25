import { DataTypes } from "sequelize";
import { Model } from "../../../model";
import { SnapshotQueryModel } from "./model.snapshot_query";

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

    public assocWithSnapshotQueriesModel() {
        const snapshotQueriesModel = new SnapshotQueryModel();
        this.Model.hasMany(snapshotQueriesModel.Model, {
            foreignKey: 'fk_snapshot_id',
            sourceKey: 'snapshot_id'
        });
        return snapshotQueriesModel;
    }
}
