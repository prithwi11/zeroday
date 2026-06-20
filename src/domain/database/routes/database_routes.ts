import { Router } from 'express';
import { DatabaseController } from '../controller/database_controller';
import { CommonMiddleware } from '../../../middlewares/common_middleware';
import { validateSchema } from '../../../middlewares/schema_validator';
import { CreateDatabaseInput, createDatabaseSchema, databaseIdSchema } from '../../../schemas/database.schema';

const databaseController = new DatabaseController();
const router = Router();

const common_middleware = new CommonMiddleware();

let middlewares = [
    common_middleware.authMiddleware,
    validateSchema(createDatabaseSchema, 'body')
]
router
    .route("/addDatabase")
    .post(middlewares, databaseController.addDatabase)

router
    .route("/listDatabase")
    .post(middlewares, databaseController.listDatabases)

middlewares = [
    common_middleware.authMiddleware,
    validateSchema(databaseIdSchema, 'body')
]

router
    .route("/connect")
    .post(middlewares, databaseController.connectToDatabase)

export const database_router = router;