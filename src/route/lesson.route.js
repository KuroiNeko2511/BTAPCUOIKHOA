import { Router } from "express";
import * as lessonController from "../controller/lesson.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requireClassMentor, requireLessonMentor } from "../middleware/classMentor.middleware.js";
import {
  validate,
  idParamRules,
  createLessonRules,
  updateLessonRules,
} from "../middleware/validate.js";

const router = Router();
router.use(authenticateToken);

router.post(
  "/classes/:classId/lessons",
  validate([...idParamRules("classId", "Class ID"), ...createLessonRules]),
  requireClassMentor,
  lessonController.createLesson
);

router.get("/classes/:classId/lessons", validate(idParamRules("classId", "Class ID")), lessonController.getLessonsByClass);
router.get("/classes/:classId/progress", validate(idParamRules("classId", "Class ID")), lessonController.getClassProgress);
router.get("/lessons/:lessonId", validate(idParamRules("lessonId", "Lesson ID")), lessonController.getLessonById);

router.patch(
  "/lessons/:lessonId",
  validate([...idParamRules("lessonId", "Lesson ID"), ...updateLessonRules]),
  requireLessonMentor,
  lessonController.updateLesson
);

router.delete("/lessons/:lessonId", validate(idParamRules("lessonId", "Lesson ID")), requireLessonMentor, lessonController.deleteLesson);
router.post("/lessons/:lessonId/complete", validate(idParamRules("lessonId", "Lesson ID")), lessonController.completeLesson);

export default router;