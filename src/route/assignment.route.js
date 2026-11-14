import { Router } from "express";
import * as controller from "../controller/assignment.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  validate,
  idParamRules,
  createAssignmentRules,
  updateAssignmentRules,
  submitAssignmentRules,
  reviewSubmissionRules,
} from "../middleware/validate.js";

const router = Router();
router.use(authenticateToken);

router.get(
  "/classes/:classId/assignments",
  validate(idParamRules("classId", "Class ID")),
  controller.listAssignments,
);
router.post(
  "/classes/:classId/assignments",
  validate([...idParamRules("classId", "Class ID"), ...createAssignmentRules]),
  controller.createAssignment,
);

router.get(
  "/assignments/:id",
  validate(idParamRules("id", "Assignment ID")),
  controller.readAssignment,
);
router.patch(
  "/assignments/:id",
  validate([...idParamRules("id", "Assignment ID"), ...updateAssignmentRules]),
  controller.updateAssignment,
);
router.delete(
  "/assignments/:id",
  validate(idParamRules("id", "Assignment ID")),
  controller.deleteAssignment,
);

router.post(
  "/assignments/:assignmentId/submissions",
  validate([
    ...idParamRules("assignmentId", "Assignment ID"),
    ...submitAssignmentRules,
  ]),
  controller.submitAssignment,
);
router.get(
  "/assignments/:assignmentId/submissions",
  validate(idParamRules("assignmentId", "Assignment ID")),
  controller.listSubmissions,
);

router.get(
  "/submissions/:id",
  validate(idParamRules("id", "Submission ID")),
  controller.readSubmission,
);
router.patch(
  "/submissions/:id/review",
  validate([...idParamRules("id", "Submission ID"), ...reviewSubmissionRules]),
  controller.reviewSubmission,
);

export default router;
