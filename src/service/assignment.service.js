import * as repo from "../repository/assignment.repository.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "../core/error.response.js";
import { ROLES } from "../core/constants.js";
import { parsePositiveInt } from "../utils/validators.js";

const getClass = async (id) => {
  const classInfo = await repo.findClass(parsePositiveInt(id, "class ID"));
  if (!classInfo) throw new NotFoundError("Class not found.");
  return classInfo;
};

const getAssignment = async (id) => {
  const assignment = await repo.findAssignment(
    parsePositiveInt(id, "assignment ID"),
  );
  if (!assignment) throw new NotFoundError("Assignment not found.");
  return assignment;
};

const getSubmission = async (id) => {
  const submission = await repo.findSubmission(
    parsePositiveInt(id, "submission ID"),
  );
  if (!submission) throw new NotFoundError("Submission not found.");
  return submission;
};
//hàm isMentor: Returns true if the user is the mentor of the class
const isMentor = (classInfo, user) =>
  Number(classInfo.mentor_id) === Number(user.id);
//hàm requireMentor: quy định chỉ mentor mới được làm
const requireMentor = (classInfo, user) => {
  if (!isMentor(classInfo, user)) {
    throw new ForbiddenError(
      "Access denied. You are not the mentor of this class.",
    );
  }
};
const requireMember = async (classId, user) => {
  const enrolled = await repo.isClassMember(classId, user.id);

  if (user.role !== ROLES.MEMBER || !enrolled) {
    throw new ForbiddenError(
      "Access denied. You are not a member of this class.",
    );
  }
};
//hàm requireViewer: quy định chỉ admin hoặc mentor mới được xem
const requireViewer = async (classInfo, user) => {
  if (user.role === ROLES.ADMIN || isMentor(classInfo, user)) return;
  await requireMember(classInfo.id, user);
};

const checkBody = (body, allowedFields) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BadRequestError("Request body must be a {}.");
  }

  const keys = Object.keys(body);

  if (keys.length === 0) {
    throw new BadRequestError("Request body must not be empty.");
  }

  const unsupported = keys.filter((key) => !allowedFields.includes(key));

  if (unsupported.length > 0) {
    throw new BadRequestError(
      `Unsupported field(s): ${unsupported.join(", ")}.`
    );
  }
};
// hàm text: để kiểm tra chuỗi
const text = (value, field, maxLength, required = false) => {
  if (value === undefined || value === null) {
    if (required) {
      throw new BadRequestError(`${field} is required.`);
    }
    return null;
  }

  if (typeof value !== "string") {
    throw new BadRequestError(`${field} must be a string.`);
  }

  const result = value.trim();

  if ((required && !result) || result.length > maxLength) {
    throw new BadRequestError(`${field} is empty or too long.`);
  }

  return result || null;
};
// hàm decimal: để kiểm tra số thập phân
const decimal = (value, field, min, max) => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    Math.abs(value * 100 - Math.round(value * 100)) > 0.000001
  ) {
    throw new BadRequestError(
      `${field} must be a number between ${min} and ${max}, with a maximum of 2 decimal places`,
    );
  }

  return value;
};

const ISO_8601 =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

const deadline = (value) => {
  if (value === null) return null;

  if (typeof value !== "string") {
    throw new BadRequestError("deadline must be a string or null.");
  }
  const match = ISO_8601.exec(value);
  if (!match) {
    throw new BadRequestError(
      "check deadline time format",
    );
  }
  const [year, month, day, hour, minute, second] = match
    .slice(1, 7)
    .map(Number);

  const check = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  if (
    year < 1000 ||
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    check.getUTCHours() !== hour ||
    check.getUTCMinutes() !== minute ||
    check.getUTCSeconds() !== second
  ) {
    throw new BadRequestError("deadline is not a valid date and time.");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError("deadline has an invalid timezone offset.");
  }

  return date.toISOString(); 
};
//assigmentData: để kiểm tra dữ liệu bài tập
const assignmentData = (body, current = null) => {
  checkBody(body, ["title", "description", "deadline", "maximumScore"]);

  return {
    title:
      body.title !== undefined
        ? text(body.title, "title", 200, true)
        : current
          ? current.title
          : text(undefined, "title", 200, true),

    description:
      body.description !== undefined
        ? text(body.description, "description", 10000)
        : (current?.description ?? null),

    deadline:
      body.deadline !== undefined
        ? deadline(body.deadline)
        : (current?.deadline ?? null),

    maximumScore:
      body.maximumScore !== undefined
        ? decimal(body.maximumScore, "maximumScore", 0.01, 999.99)
        : Number(current?.maximum_score ?? 10),
  };
};

// ---------- Assignment ----------

export const listAssignments = async (classId, user) => {
  const classInfo = await getClass(classId);
  await requireViewer(classInfo, user);
  return repo.listAssignments(classInfo.id);
};

export const readAssignment = async (id, user) => {
  const assignment = await getAssignment(id);
  const classInfo = await getClass(assignment.class_id);
  await requireViewer(classInfo, user);
  return assignment;
};

export const createAssignment = async (classId, body, user) => {
  const classInfo = await getClass(classId);
  requireMentor(classInfo, user);
  return repo.createAssignment(classInfo.id, assignmentData(body));
};

export const updateAssignment = async (id, body, user) => {
  const assignment = await getAssignment(id);
  const classInfo = await getClass(assignment.class_id);
  requireMentor(classInfo, user);
  const data = assignmentData(body, assignment);

  if (
    data.maximumScore !== Number(assignment.maximum_score) &&
    (await repo.hasSubmissions(assignment.id))
  ) {
    throw new ConflictError("Cannot change maximumScore because there are existing submissions.");
  }

  return repo.updateAssignment(assignment.id, data);
};

export const deleteAssignment = async (id, user) => {
  const assignment = await getAssignment(id);
  const classInfo = await getClass(assignment.class_id);
  requireMentor(classInfo, user);
  await repo.deleteAssignment(assignment.id);
  return { id: assignment.id };
};

export const submitAssignment = async (assignmentId, body, user) => {
  const assignment = await getAssignment(assignmentId);

  await requireMember(assignment.class_id, user);

  if (assignment.is_closed === true) {
    throw new BadRequestError("Cannot submit assignment because the deadline has passed.");
  }

  checkBody(body, ["content", "repositoryUrl"]);

  const content = text(body.content, "content", 10000);
  const repositoryUrl = text(body.repositoryUrl, "repositoryUrl", 500);
// kiểm tra nếu cả content và repositoryUrl đều không có thì ném lỗi
  if (!content && !repositoryUrl) {
    throw new BadRequestError("At least one of content or repositoryUrl must be provided.");
  }
// repositoryUrl phải là một URL hợp lệ và phải sử dụng HTTP hoặc HTTPS
  if (repositoryUrl) {
    let url;

    try {
      url = new URL(repositoryUrl);
    } catch {
      throw new BadRequestError("repositoryUrl is not a valid URL.");
    }

    if (!["https:", "http:"].includes(url.protocol)) {
      throw new BadRequestError("repositoryUrl must use HTTP or HTTPS protocol.");
    }
  }

  try {
    return await repo.createSubmission(assignment.id, user.id, {
      content,
      repositoryUrl,
    });
  } catch (error) {
    if (
      error.code === "23505" &&
      error.constraint === "uq_assignment_member_submission"
    ) {
      throw new ConflictError("You have already submitted this assignment.");
    }

    throw error;
  }
};

export const listSubmissions = async (assignmentId, user) => {
  const assignment = await getAssignment(assignmentId);
  const classInfo = await getClass(assignment.class_id);

  await requireViewer(classInfo, user);

  const memberId =
    user.role === "ADMIN" || isMentor(classInfo, user) ? null : user.id;

  return repo.listSubmissions(assignment.id, memberId);
};

export const readSubmission = async (id, user) => {
  const submission = await getSubmission(id);
  const assignment = await getAssignment(submission.assignment_id);
  const classInfo = await getClass(assignment.class_id);

  await requireViewer(classInfo, user);

  if (
    user.role !== "ADMIN" &&
    !isMentor(classInfo, user) &&
    Number(submission.member_id) !== Number(user.id)
  ) {
    throw new ForbiddenError("Access denied. You do not have permission to view this submission.");
  }

  return submission;
};

export const reviewSubmission = async (id, body, user) => {
  const submission = await getSubmission(id);
  const assignment = await getAssignment(submission.assignment_id);
  const classInfo = await getClass(assignment.class_id);

  requireMentor(classInfo, user);

  if (Number(submission.member_id) === Number(user.id)) {
    throw new ForbiddenError("Access denied. You cannot review your own submission.");
  }

  checkBody(body, ["score", "feedback"]);

  const score = decimal(
    body.score,
    "score",
    0,
    Number(assignment.maximum_score),
  );

  const feedback = text(body.feedback, "feedback", 10000);

  return repo.reviewSubmission(submission.id, user.id, {
    score,
    feedback,
  });
};
