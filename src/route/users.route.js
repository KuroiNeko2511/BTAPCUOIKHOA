import { Router } from "express";
import * as userController from "../controller/users.controller.js";

import {
  validate,
  createUserRules,
  updateUserRules,
  userIdParamRules,
} from "../middleware/validate.js";

import { authenticateToken } from "../middleware/auth.middleware.js";
import { authorizeAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticateToken, authorizeAdmin);

router.get("/", userController.getAllUsers);
router.get("/:id", validate(userIdParamRules), userController.getUserById);
router.post("/", validate(createUserRules), userController.createUser);
router.patch(
  "/:id",
  validate([...userIdParamRules, ...updateUserRules]),
  userController.updateUser,
);
router.delete("/:id", validate(userIdParamRules), userController.deleteUser);

export default router;
