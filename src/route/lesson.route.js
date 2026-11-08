import { Router } from "express";
import * as lessonController from "../controller/lesson.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  requireClassMentor,
  requireLessonMentor,
} from "../middleware/classMentor.middleware.js";

const router = Router();

router.use(authenticateToken);

router.post(
  "/classes/:classId/lessons",
  requireClassMentor,
  lessonController.createLesson,
);

router.get("/classes/:classId/lessons", lessonController.getLessonsByClass);

router.get("/classes/:classId/progress", lessonController.getClassProgress);

router.get("/lessons/:lessonId", lessonController.getLessonById);

router.patch(
  "/lessons/:lessonId",
  requireLessonMentor,
  lessonController.updateLesson,
);

router.delete(
  "/lessons/:lessonId",
  requireLessonMentor,
  lessonController.deleteLesson,
);

router.post("/lessons/:lessonId/complete", lessonController.completeLesson);

export default router;
