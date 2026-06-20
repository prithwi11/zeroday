import { Router } from 'express';
import { CommonMiddleware } from '../../../middlewares/common_middleware';
import { RecommendationController } from '../controller/recommendation_controller';

const recommendationController = new RecommendationController
const router = Router();

const common_middleware = new CommonMiddleware();

let middlewares = [
    common_middleware.authMiddleware
]
router
    .route("/recommendations")
    .post([], recommendationController.recommendation)

export const recommendation_router = router;