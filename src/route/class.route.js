import { Router } from "express";
import * as classController from "../controller/class.controller.js";
import * as classMemberController from "../controller/classMember.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { authorizeAdmin } from "../middleware/role.middleware.js";
import * as lessonController from "../controller/lesson.controller.js";
import { requireClassMentor } from "../middleware/classMentor.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/", classController.getClasses);
router.post("/", authorizeAdmin, classController.createClass);
router.get("/:id", classController.getClassById);
router.patch("/:id", authorizeAdmin, classController.updateClass);
router.delete("/:id", authorizeAdmin, classController.deleteClass);

router.get("/:id/members", classMemberController.getMembers);
router.post("/:id/members", authorizeAdmin, classMemberController.addMember);
router.delete("/:id/members/:memberId", authorizeAdmin, classMemberController.removeMember);

export default router;
