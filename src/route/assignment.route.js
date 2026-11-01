import { Router } from "express";
import * as controller from "../controller/assignment.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticateToken);

router.get(
  "/classes/:classId/assignments",
  controller.listAssignments,
);

router.post(
  "/classes/:classId/assignments",
  controller.createAssignment,
);

router.get("/assignments/:id", controller.readAssignment);
router.patch("/assignments/:id", controller.updateAssignment);
router.delete("/assignments/:id", controller.deleteAssignment);

router.post(
  "/assignments/:assignmentId/submissions",
  controller.submitAssignment,
);

router.get(
  "/assignments/:assignmentId/submissions",
  controller.listSubmissions,
);

router.get("/submissions/:id", controller.readSubmission);

router.patch(
  "/submissions/:id/review",
  controller.reviewSubmission,
);

export default router;