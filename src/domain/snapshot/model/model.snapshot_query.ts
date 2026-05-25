import { DataTypes, QueryTypes, col } from "sequelize";
import { Model } from "../../../model";
import { SnapshotModel } from "./model.snapshot";

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

    public assocWithSnapshotModel() {
        const snapshotModel = new SnapshotModel();
        this.Model.belongsTo(snapshotModel.Model, {
            foreignKey: 'fk_snapshot_id',
            targetKey: 'snapshot_id'
        });
        return snapshotModel;
    }

    /* public fetchDashboard(database_id: number) {
        const assocWithSnapshotModel = this.assocWithSnapshotModel();
        return this.Model.findAll({
            attributes : ['query_id', 'query_text', 'pg_stat_queryId', 'calls', 'total_exec_time', 'mean_exec_time', 'added_timestamp',
                [col('snapshot.captured_at'), 'snapshot_captured_at'],
                [col('snapshot.snapshot_id'), 'snapshot_id']
            ],
            include: [
                {
                    model: assocWithSnapshotModel.Model,
                    attributes: [],
                    where: {
                        fk_database_id: database_id
                    },
                    require: true
                }
            ]
        })
    } */

    public fetchDashboard(lastTwoSnapshotIds: number[]) {
        const results = this.Model.sequelize.query(
            `SELECT
                sq2.query_text,
                sq2.calls - sq1.calls as calls_in_window,
                sq2.total_exec_time - sq1.total_exec_time as total_time_in_window,
                CASE
                    WHEN (sq2.calls - sq1.calls) = 0 THEN 0
                    ELSE (sq2.total_exec_time - sq1.total_exec_time) / (sq2.calls - sq1.calls)
                END as avg_time_in_window,
                s1.captured_at as window_from,
                s2.captured_at as window_to 
             FROM main.snapshot_queries sq1 
             JOIN main.snapshot_queries sq2 ON sq1."pg_stat_queryId" = sq2."pg_stat_queryId" 
             JOIN main.snapshots s1 ON sq1.fk_snapshot_id = s1.snapshot_id 
             JOIN main.snapshots s2 ON sq2.fk_snapshot_id = s2.snapshot_id 
             WHERE s1.snapshot_id = :snapshot1  
             AND s2.snapshot_id = :snapshot2  
             AND sq2.calls > sq1.calls 
             ORDER BY total_time_in_window DESC`,
            {
                replacements: {
                    snapshot1: lastTwoSnapshotIds[0],
                    snapshot2: lastTwoSnapshotIds[1]
                },
                type: QueryTypes.SELECT
            }
        );

        return results;
    }
}
