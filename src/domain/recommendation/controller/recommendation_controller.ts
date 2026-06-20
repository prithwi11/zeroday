import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/common_middleware';
import { Client } from 'pg';
import { ExplainAnalyzeModel } from '../../snapshot/model/model.explain_analyze';
import { SnapshotQueryModel } from '../../snapshot/model/model.snapshot_query';
import { SnapshotModel } from '../../snapshot/model/model.snapshot';
import { AppError } from '../../../errors/AppError';

export class RecommendationController {
    private _explainAnalyzeModel = new ExplainAnalyzeModel();
    private _snapshotModel = new SnapshotModel();
    private _snapshotQueriesModel = new SnapshotQueryModel();

    recommendation = async(req: AuthRequest, res: Response) => {
        if (!req.body.queryId) {
            throw AppError.badRequest("PLease provide queryId")
        }

        const nodes: any = await this._explainAnalyzeModel.findAllByAny({
            where: { fk_snapshot_query_id: req.body.queryId }
        });

        if (!nodes || nodes.length === 0) {
            return res.status(200).json({ success: true, message: 'No plan data found', data: [] });
        }

        const nodeMap = new Map();
        nodes.forEach((node: any) => nodeMap.set(String(node.id), node));

        const flags: any[] = [];

        for (const node of nodes) {
            const wastefulScan = this.checkWastefulScan(node);
            if (wastefulScan) flags.push(wastefulScan);

            const badCardinality = this.checkBadCardinalityEstimate(node);
            if (badCardinality) flags.push(badCardinality);

            const expensiveRepeated = this.checkExpensiveRepeatedWork(node, nodeMap);
            if (expensiveRepeated) flags.push(expensiveRepeated);
        }

        const timeSink = this.checkTotalTime(nodes);
        if (timeSink) flags.push(timeSink);

        return res.status(200).json({ success: true, message: 'Recommendation fetched successfully', data: flags });
    
    }

    /**
     * Utility Functions for checking patterns
     */
    
    // Wasteful Scan
    checkWastefulScan = (node: any) => {
        const rows_removed_by_filter = Number(node.rows_removed_by_filter) || 0;
        const actual_rows = Number(node.actual_rows) || 0;
        const totalExamined = rows_removed_by_filter + actual_rows;

        if (totalExamined < 10000) return null;

        const rejectionRatio = rows_removed_by_filter / totalExamined;
        if (rejectionRatio <= 0.9) return null;

        return {
            node_id: node.id,
            pattern: 'wasteful_scan',
            message: `${node.node_type} examined ${totalExamined} rows but kept only ${actual_rows} — consider adding an index to avoid scanning unnecessary rows.`
        };
    }

    // Bad cardinality estimate
    checkBadCardinalityEstimate = (node: any) => {
        const actual_rows = Number(node.actual_rows) || 0;
        const estimated_rows = Number(node.estimated_rows) || 0;

        if (actual_rows < 1000) return null;
        if (estimated_rows === 0) return null;

        const ratio = actual_rows / estimated_rows;
        if (ratio < 10 && ratio > 0.1) return null;

        return {
            node_id: node.id,
            pattern: 'bad_cardinality_estimate',
            message: `${node.node_type} estimated ${estimated_rows} rows but actually processed ${actual_rows} — table statistics may be stale, consider running ANALYZE.`
        };
    }

    // Check expensive repeated work
    checkExpensiveRepeatedWork = (node: any, nodeMap: Map<string, any>) => {
        if (node.node_type !== 'Seq Scan') return null;

        const parent: any = nodeMap.get(String(node.parent_id));
        if (!parent) return null;
        if (parent.node_type !== 'Nested Loop') return null;

        const loopThreshold = 100;
        if (parent.loops <= loopThreshold) return null;

        return {
            node_id: node.id,
            pattern: 'expensive_repeated_scan',
            message: `Sequential scan running ${parent.loops} times inside a Nested Loop — consider adding an index to avoid repeated full table scans.`
        };
    }

    // Check total time concentration
    checkTotalTime = (nodes: any[]) => {
        const total_time = nodes.reduce((sum: number, node: any) => sum + Number(node.execution_time), 0);
        if (total_time === 0) return null;

        let maxNode = nodes[0];
        for (const node of nodes) {
            if (Number(node.execution_time) > Number(maxNode.execution_time)) {
                maxNode = node;
            }
        }

        const share = Number(maxNode.execution_time) / total_time;
        if (share <= 0.6) return null;

        return {
            node_id: maxNode.id,
            pattern: 'dominant_time_sink',
            message: `${maxNode.node_type} consumed ${(share * 100).toFixed(0)}% of total query time (${maxNode.execution_time}ms) — this is the primary bottleneck.`
        };
    }


}