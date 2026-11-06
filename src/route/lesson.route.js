import express from "express";
import * as lessonController from "../controller/lesson.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requireClassMentor } from "../middleware/classMentor.middleware.js";

const router = express.Router();
router.use(authenticateToken);

router.post("/:id/lessons", authenticateToken, requireClassMentor, lessonController.createLesson);
router.get("/:id", lessonController.getLessonById);
router.get("/:id/lessons", authenticateToken, lessonController.getLessonsByClass);
router.patch("/:id", requireClassMentor, lessonController.updateLesson);
router.delete("/:id", requireClassMentor, lessonController.deleteLesson);
router.post("/:id/complete", lessonController.completeLesson);
router.get("/:id/progress", authenticateToken, lessonController.getClassProgress);

export default router;