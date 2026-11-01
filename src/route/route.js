// src/route/route.js
import { Router } from 'express';
import userRouter from './users.route.js';
import authRouter from './auth.route.js';
import classRoute from './class.route.js';
import assignmentRouter from "./assignment.route.js";

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/classes', classRoute);
router.use("/", assignmentRouter);

export default router;