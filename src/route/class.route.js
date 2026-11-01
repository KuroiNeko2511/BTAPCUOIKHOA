import { Router } from"express";
import * as classController from"../controller/class.controller.js";
import * as classMemberController from"../controller/classMember.controller.js";
import { authenticateToken } from"../middleware/auth.middleware.js";
import { authorizeAdmin } from"../middleware/role.middleware.js";
import * as lessonController from"../controller/lesson.controller.js";
import { requireClassMentor } from"../middleware/classMentor.middleware.js";

const router = Router();

router.get("/",  authenticateToken, classController.getClasses);
router.post("/",  authenticateToken, authorizeAdmin, classController.createClass);
router.get("/:id",  authenticateToken, classController.getClassById);
router.patch("/:id",  authenticateToken, authorizeAdmin, classController.updateClass);
router.delete("/:id",  authenticateToken, authorizeAdmin, classController.deleteClass);


router.get("/:id/members",  authenticateToken, classMemberController.getMembers);
router.post("/:id/members",  authenticateToken, authorizeAdmin, classMemberController.addMember);
router.delete("/:id/members/:memberId",  authenticateToken, authorizeAdmin, classMemberController.removeMember);

// lessons qua class
router.post("/:id/lessons",  authenticateToken, requireClassMentor, lessonController.createLesson);
router.get("/:id/lessons",  authenticateToken, lessonController.getLessonsByClass,);
router.get("/:id/progress",  authenticateToken, lessonController.getClassProgress,);

export default router;
