// src/route/route.js
import { Router } from 'express';
import userRouter from './users.route.js';
import authRouter from './auth.route.js';
import classRoute from './class.route.js';
import lessonRouter from "./lesson.route.js";

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/classes', classRoute);
router.use("/lessons", lessonRouter);

export default router;