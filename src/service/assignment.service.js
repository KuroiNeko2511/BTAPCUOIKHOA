import * as repo from "../repository/assignment.repository.js";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "../core/error.response.js";

const parseId = (value) => {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new BadRequestError("ID phải là số nguyên dương");
  }

  return id;
};

const getActor = async (tokenUser) => {
  const user = await repo.findActiveUser(parseId(tokenUser.id));

  if (!user) {
    throw new UnauthorizedError("Tài khoản không còn hoạt động");
  }

  return user;
};

const getClass = async (id) => {
  const classInfo = await repo.findClass(parseId(id));

  if (!classInfo) {
    throw new NotFoundError("Không tìm thấy lớp học");
  }

  return classInfo;
};

const getAssignment = async (id) => {
  const assignment = await repo.findAssignment(parseId(id));

  if (!assignment) {
    throw new NotFoundError("Không tìm thấy assignment");
  }

  return assignment;
};

const getSubmission = async (id) => {
  const submission = await repo.findSubmission(parseId(id));

  if (!submission) {
    throw new NotFoundError("Không tìm thấy bài nộp");
  }

  return submission;
};

const isMentor = (classInfo, user) =>
  Number(classInfo.mentor_id) === Number(user.id);

const requireMentor = (classInfo, user) => {
  if (!isMentor(classInfo, user)) {
    throw new ForbiddenError("Bạn không phải mentor của lớp này");
  }
};

const requireMember = async (classId, user) => {
  const enrolled = await repo.isClassMember(classId, user.id);

  if (user.role !== "MEMBER" || !enrolled) {
    throw new ForbiddenError("Bạn không phải member của lớp này");
  }
};

const requireViewer = async (classInfo, user) => {
  if (user.role === "ADMIN" || isMentor(classInfo, user)) {
    return;
  }

  await requireMember(classInfo.id, user);
};

const checkBody = (body, allowedFields) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BadRequestError("Body phải là JSON object");
  }

  const keys = Object.keys(body);

  if (!keys.length || keys.some((key) => !allowedFields.includes(key))) {
    throw new BadRequestError("Body rỗng hoặc chứa trường không được hỗ trợ");
  }
};

const text = (value, field, maxLength, required = false) => {
  if (value === undefined || value === null) {
    if (required) {
      throw new BadRequestError(`${field} là bắt buộc`);
    }
    return null;
  }

  if (typeof value !== "string") {
    throw new BadRequestError(`${field} phải là chuỗi`);
  }

  const result = value.trim();

  if ((required && !result) || result.length > maxLength) {
    throw new BadRequestError(`${field} rỗng hoặc quá dài`);
  }

  return result || null;
};

const decimal = (value, field, min, max) => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    Math.abs(value * 100 - Math.round(value * 100)) > 0.000001
  ) {
    throw new BadRequestError(
      `${field} phải từ ${min} đến ${max}, tối đa 2 chữ số thập phân`,
    );
  }

  return value;
};

const deadline = (value) => {
  if (value === null) return null;

  if (typeof value !== "string") {
    throw new BadRequestError("deadline phải là chuỗi hoặc null");
  }

  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    throw new BadRequestError("deadline phải có dạng YYYY-MM-DD HH:mm:ss");
  }

  const [, year, month, day, hour, minute, second] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  if (
    year < 1000 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second
  ) {
    throw new BadRequestError("deadline không phải ngày giờ hợp lệ");
  }

  return `${value.replace(" ", "T")}+07:00`;
};

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

export const listAssignments = async (classId, tokenUser) => {
  const user = await getActor(tokenUser);
  const classInfo = await getClass(classId);

  await requireViewer(classInfo, user);

  return repo.listAssignments(classInfo.id);
};

export const readAssignment = async (id, tokenUser) => {
  const user = await getActor(tokenUser);
  const assignment = await getAssignment(id);
  const classInfo = await getClass(assignment.class_id);

  await requireViewer(classInfo, user);

  return assignment;
};

export const createAssignment = async (classId, body, tokenUser) => {
  const user = await getActor(tokenUser);
  const classInfo = await getClass(classId);

  requireMentor(classInfo, user);

  return repo.createAssignment(classInfo.id, assignmentData(body));
};

export const updateAssignment = async (id, body, tokenUser) => {
  const user = await getActor(tokenUser);
  const assignment = await getAssignment(id);
  const classInfo = await getClass(assignment.class_id);

  requireMentor(classInfo, user);

  const data = assignmentData(body, assignment);

  if (
    data.maximumScore !== Number(assignment.maximum_score) &&
    (await repo.hasSubmissions(assignment.id))
  ) {
    throw new ConflictError("Không thể đổi maximumScore khi đã có bài nộp");
  }

  return repo.updateAssignment(assignment.id, data);
};

export const deleteAssignment = async (id, tokenUser) => {
  const user = await getActor(tokenUser);
  const assignment = await getAssignment(id);
  const classInfo = await getClass(assignment.class_id);

  requireMentor(classInfo, user);

  await repo.deleteAssignment(assignment.id);

  return { id: assignment.id };
};

export const submitAssignment = async (assignmentId, body, tokenUser) => {
  const user = await getActor(tokenUser);
  const assignment = await getAssignment(assignmentId);

  await requireMember(assignment.class_id, user);

  if (assignment.is_closed === true) {
    throw new BadRequestError("Assignment đã hết hạn nộp");
  }

  checkBody(body, ["content", "repositoryUrl"]);

  const content = text(body.content, "content", 10000);
  const repositoryUrl = text(body.repositoryUrl, "repositoryUrl", 500);

  if (!content && !repositoryUrl) {
    throw new BadRequestError("Cần có content hoặc repositoryUrl");
  }

  if (repositoryUrl) {
    let url;

    try {
      url = new URL(repositoryUrl);
    } catch {
      throw new BadRequestError("repositoryUrl không hợp lệ");
    }

    if (!["https:", "http:"].includes(url.protocol)) {
      throw new BadRequestError("repositoryUrl phải dùng HTTP hoặc HTTPS");
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
      throw new ConflictError("Bạn đã nộp assignment này");
    }

    throw error;
  }
};

export const listSubmissions = async (assignmentId, tokenUser) => {
  const user = await getActor(tokenUser);
  const assignment = await getAssignment(assignmentId);
  const classInfo = await getClass(assignment.class_id);

  await requireViewer(classInfo, user);

  const memberId =
    user.role === "ADMIN" || isMentor(classInfo, user) ? null : user.id;

  return repo.listSubmissions(assignment.id, memberId);
};

export const readSubmission = async (id, tokenUser) => {
  const user = await getActor(tokenUser);
  const submission = await getSubmission(id);
  const assignment = await getAssignment(submission.assignment_id);
  const classInfo = await getClass(assignment.class_id);

  await requireViewer(classInfo, user);

  if (
    user.role !== "ADMIN" &&
    !isMentor(classInfo, user) &&
    Number(submission.member_id) !== Number(user.id)
  ) {
    throw new ForbiddenError("Bạn không được xem bài nộp của người khác");
  }

  return submission;
};

export const reviewSubmission = async (id, body, tokenUser) => {
  const user = await getActor(tokenUser);
  const submission = await getSubmission(id);
  const assignment = await getAssignment(submission.assignment_id);
  const classInfo = await getClass(assignment.class_id);

  requireMentor(classInfo, user);

  if (Number(submission.member_id) === Number(user.id)) {
    throw new ForbiddenError("Không được tự chấm bài của mình");
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
