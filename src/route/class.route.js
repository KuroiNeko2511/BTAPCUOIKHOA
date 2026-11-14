import { Router } from "express";
import * as classController from "../controller/class.controller.js";
import * as classMemberController from "../controller/classMember.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { authorizeAdmin } from "../middleware/role.middleware.js";
import {
  validate,
  idParamRules,
  createClassRules,
  updateClassRules,
  addClassMemberRules,
} from "../middleware/validate.js";

const router = Router();
router.use(authenticateToken);

router.get("/", classController.getClasses);
router.post("/", authorizeAdmin, validate(createClassRules), classController.createClass);
router.get("/:id", validate(idParamRules("id", "Class ID")), classController.getClassById);
router.patch("/:id", authorizeAdmin, validate([...idParamRules("id", "Class ID"), ...updateClassRules]), classController.updateClass);
router.delete("/:id", authorizeAdmin, validate(idParamRules("id", "Class ID")), classController.deleteClass);

router.get("/:id/members", validate(idParamRules("id", "Class ID")), classMemberController.getMembers);
router.post("/:id/members", authorizeAdmin, validate([...idParamRules("id", "Class ID"), ...addClassMemberRules]), classMemberController.addMember);
router.delete("/:id/members/:memberId", authorizeAdmin, validate([...idParamRules("id", "Class ID"), ...idParamRules("memberId", "Member ID")]), classMemberController.removeMember);

export default router;