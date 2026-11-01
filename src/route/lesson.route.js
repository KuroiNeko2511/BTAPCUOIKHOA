import express from "express";
import * as lessonController from "../controller/lesson.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requireClassMentor } from "../middleware/classMentor.middleware.js";

const router = express.Router();

// Các API thao tác trên lesson
router.get("/:id",  authenticateToken, lessonController.getLessonById);
router.patch("/:id",  authenticateToken, requireClassMentor, lessonController.updateLesson);
router.delete("/:id",  authenticateToken, requireClassMentor, lessonController.deleteLesson);
router.post("/:id/complete",  authenticateToken, lessonController.completeLesson);

export default router;