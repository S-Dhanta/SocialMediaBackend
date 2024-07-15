import express from 'express';
import { signup , login, followUser} from '../controllers/UserControllers';
import { authenticateToken } from '../service/auth';

const router = express.Router();

// router.post("/users", findAll);

router.post("/signup", signup);
router.post("/login", login);
router.post("/follow/:id", authenticateToken,followUser)

export default router;