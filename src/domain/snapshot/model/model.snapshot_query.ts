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
                sq2."pg_stat_queryId" as "pg_stat_queryId",
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
             AND sq2.total_exec_time > sq1.total_exec_time
             ORDER BY total_time_in_window DESC`,
            {
                replacements: {
                    snapshot1: lastTwoSnapshotIds[1],
                    snapshot2: lastTwoSnapshotIds[0]
                },
                type: QueryTypes.SELECT
            }
        );

        return results;
    }

    public async getHistoricalWindows(database_id: number, queryId: string, n: number, latestSnapshotId: number) {
        const results = await this.Model.sequelize.query(
            `
            SELECT
                windowed.snapshot_id,
                windowed.captured_at,
                (windowed.total_exec_time - prev_total_exec_time)/(NULLIF(windowed.calls - prev_calls, 0)) as avg_time_in_window
                FROM(
                    SELECT 
                        s.snapshot_id,
                        s.captured_at,
                        sq.total_exec_time,
                        LAG(sq.total_exec_time) OVER (ORDER BY s.captured_at) AS prev_total_exec_time,
                        sq.calls,
                        LAG(sq.calls) OVER (ORDER BY s.captured_at) AS prev_calls
                    FROM main.snapshot_queries sq
                    JOIN main.snapshots s ON sq.fk_snapshot_id = s.snapshot_id
                    WHERE s.fk_database_id = :database_id
                    AND s.snapshot_id != :latestSnapshotId
                    AND sq."pg_stat_queryId" = :queryId
                ) windowed
            WHERE prev_total_exec_time IS NOT NULL
            ORDER BY captured_at DESC
            LIMIT :n
            `,
            {
                replacements: {
                    database_id: database_id,
                    queryId: queryId,
                    n: n,
                    latestSnapshotId: latestSnapshotId
                },
                type: QueryTypes.SELECT
            }
        );
        return results;
    }
}
