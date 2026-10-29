// src/route/auth.route.js
import { Router } from "express";
import * as authController from "../controller/auth.controller.js";
import { validate, registerRules, loginRules } from "../middleware/validate.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes:
router.post("/register", validate(registerRules), authController.register);
router.post("/login", validate(loginRules), authController.login);

// Protected route:
router.get("/me", authenticateToken, authController.getMe);

export default router;