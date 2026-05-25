import { Router } from 'express';
import { DatabaseController } from '../controller/database_controller';
import { CommonMiddleware } from '../../../middlewares/common_middleware';

const databaseController = new DatabaseController();
const router = Router();

const common_middleware = new CommonMiddleware();

let middlewares = [
    common_middleware.authMiddleware
]
router
    .route("/addDatabase")
    .post(middlewares, databaseController.addDatabase)

router
    .route("/listDatabase")
    .post(middlewares, databaseController.listDatabases)

router
    .route("/connect")
    .post(middlewares, databaseController.connectToDatabase)

export const database_router = router;