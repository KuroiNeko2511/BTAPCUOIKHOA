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

router.get("/", userController.getAllUsers); //đã
router.get("/:id", validate(userIdParamRules), userController.getUserById); //đã
router.post("/", validate(createUserRules), userController.createUser); //đã
router.patch(
  "/:id",
  validate([...userIdParamRules, ...updateUserRules]),
  userController.updateUser,
); //đã
router.delete("/:id", validate(userIdParamRules), userController.deleteUser); //đã

export default router;
