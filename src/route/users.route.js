import { Router } from "express";
import * as userController from "../controller/users.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { authorizeAdmin } from"../middleware/role.middleware.js";
import {
  validate,
  createUserRules,
  updateUserRules,
  userIdParamRules,
} from "../middleware/validate.js";

const router = Router();

router.get("/",  authenticateToken,  authorizeAdmin, userController.getAllUsers);
router.get("/:id",  authenticateToken,  authorizeAdmin, validate(userIdParamRules), userController.getUserById);
router.post("/",  authenticateToken,  authorizeAdmin, validate(createUserRules), userController.createUser);
router.patch("/:id",  authenticateToken,  authorizeAdmin, validate([...userIdParamRules, ...updateUserRules]), userController.updateUser);
router.delete("/:id",  authenticateToken,  authorizeAdmin, validate(userIdParamRules), userController.deleteUser); 

export default router;