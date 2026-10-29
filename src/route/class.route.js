import { Router } from "express";
import * as classController from "../controller/class.controller.js";
import * as classMemberController from "../controller/classMember.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { authorizeAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.get("/", authenticateToken, classController.getClasses);

router.post(
  "/",
  authenticateToken,
  authorizeAdmin,
  classController.createClass,
);

router.post(
  "/:id/members",
  authenticateToken,
  authorizeAdmin,
  classMemberController.addMember,
);

router.get("/:id/members", authenticateToken, classMemberController.getMembers);

router.delete(
  "/:id/members/:memberId",
  authenticateToken,
  authorizeAdmin,
  classMemberController.removeMember,
);

export default router;
