import { Router } from 'express';
import { UserController } from '../controller/user_controller';


const userController = new UserController();
const router = Router();

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

export const user_router = router;