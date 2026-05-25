import { Router } from 'express';
import { CommonMiddleware } from '../../../middlewares/common_middleware';
import { DashboardController } from '../controller/dashboard_controller';

const dashboardController = new DashboardController();
const router = Router();

const common_middleware = new CommonMiddleware();

let middlewares = [
    common_middleware.authMiddleware
]
router
    .route("/dashboard")
    .post(middlewares, dashboardController.dashboard)

export const dashboard_router = router;