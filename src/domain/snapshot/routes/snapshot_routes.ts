import { Router } from 'express';
import { CommonMiddleware } from '../../../middlewares/common_middleware';
import { SnapshotController } from '../controller/snapshot_controller';

const snapshotController = new SnapshotController();
const router = Router();

const common_middleware = new CommonMiddleware();

let middlewares = [
    common_middleware.authMiddleware
]
router
    .route("/trigger")
    .post(middlewares, snapshotController.trigger)

export const snapshot_router = router;