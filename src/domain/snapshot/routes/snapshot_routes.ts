import { Router } from 'express';
import { CommonMiddleware } from '../../../middlewares/common_middleware';
import { SnapshotController } from '../controller/snapshot_controller';
import { validateSchema } from '../../../middlewares/schema_validator';
import { databaseIdSchema } from '../../../schemas/database.schema';

const snapshotController = new SnapshotController();
const router = Router();

const common_middleware = new CommonMiddleware();

let middlewares = [
    common_middleware.authMiddleware,
    validateSchema(databaseIdSchema, 'body')
]
router
    .route("/trigger")
    .post(middlewares, snapshotController.trigger)

export const snapshot_router = router;