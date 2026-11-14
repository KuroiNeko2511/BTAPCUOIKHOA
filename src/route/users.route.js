import { Router } from "express";
import * as userController from "../controller/users.controller.js";
import {
  validate,
  createUserRules,
  updateUserRules,
  idParamRules,
} from "../middleware/validate.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { authorizeAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticateToken, authorizeAdmin);

router.get("/", userController.getAllUsers);
router.get("/:id", validate(idParamRules("id", "User ID")), userController.getUserById);
router.post("/", validate(createUserRules), userController.createUser);
router.patch(
  "/:id",
  validate([...idParamRules("id", "User ID"), ...updateUserRules]),
  userController.updateUser
);
router.delete("/:id", validate(idParamRules("id", "User ID")), userController.deleteUser);

export default router;