import { validationResult, body, param } from "express-validator";
import { BadRequestError } from "../core/error.response.js";

export const validate = (rules) => {
  return async (req, res, next) => {
    // Chạy tuần tự từng rule
    for (const rule of rules) {
      await rule.run(req);
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Gộp tất cả lỗi thành mảng { field, message }
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    // Ném BadRequestError kèm danh sách lỗi chi tiết
    const error = new BadRequestError("Validation failed");
    error.errors = formattedErrors;
    return next(error);
  };
};

export const parsePositiveInt = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new BadRequestError(`Invalid ${fieldName}.`);
  }

  return number;
};

export const createUserRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not valid")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Password phải là chuỗi")
    .bail()
    .isLength({ min: 6, max: 72 })
    .withMessage("Password phải từ 6 đến 72 ký tự"),

  body("role")
    .optional()
    .isIn(["ADMIN", "MEMBER"])
    .withMessage("Role phải là ADMIN hoặc MEMBER"),
];

export const updateUserRules = [
  body().custom((value, { req }) => {
    const allowedFields = ["name", "email", "age"];
    const hasAllowedField = Object.keys(req.body).some((key) =>
      allowedFields.includes(key),
    );
    if (!hasAllowedField) {
      throw new Error(
        "At least one field (name, email, age) must be provided for update",
      );
    }
    return true;
  }),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
];

export const registerRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Tên không được để trống")
    .isLength({ min: 2, max: 50 })
    .withMessage("Tên phải từ 2 đến 50 ký tự"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Mật khẩu không được để trống")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có tối thiểu 6 ký tự"),
];

export const loginRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Mật khẩu không được để trống"),
];

export const validateClassDescription = (description) => {
  if (description === undefined || description === null) {
    return description;
  }

  if (typeof description !== "string") {
    throw new BadRequestError(
      "description must be a string or null.",
    );
  }

  return description.trim();
};

// 1. PARAMS RULES (Kiểm tra ID trên URL cho tất cả route)
export const idParamRules = (paramName = "id", label = "ID") => [
  param(paramName)
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .custom((value) => parsePositiveInt(value, label)),
];

// 2. CLASS & CLASS MEMBER RULES
export const createClassRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Class name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Class name must be between 2 and 150 characters"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string"),

  body("startDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("startDate must be a valid date (YYYY-MM-DD)"),

  body("endDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("endDate must be a valid date (YYYY-MM-DD)")
    .custom((endDate, { req }) => {
      if (req.body.startDate && new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error("endDate must be greater than or equal to startDate");
      }
      return true;
    }),

  body("mentorId")
    .notEmpty()
    .withMessage("mentorId is required")
    .custom((value) => parsePositiveInt(value, "mentorId")),
];

export const updateClassRules = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Class name cannot be empty")
    .isLength({ min: 2, max: 150 })
    .withMessage("Class name must be between 2 and 150 characters"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string"),

  body("status")
    .optional()
    .isIn(["UPCOMING", "ONGOING", "COMPLETED"])
    .withMessage("status must be UPCOMING, ONGOING, or COMPLETED"),

  body("startDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("startDate must be a valid date"),

  body("endDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("endDate must be a valid date"),

  body("mentorId")
    .optional()
    .custom((value) => parsePositiveInt(value, "mentorId")),
];

export const addClassMemberRules = [
  body("memberId")
    .notEmpty()
    .withMessage("memberId is required")
    .custom((value) => parsePositiveInt(value, "memberId")),
];

// 3. LESSON RULES
export const createLessonRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Lesson title is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),

  body("content")
    .optional({ nullable: true })
    .isString()
    .withMessage("Content must be a string"),

  body("orderIndex")
    .optional()
    .isInt({ min: 1, max: 2147483647 })
    .withMessage("orderIndex must be a positive integer"),
];

export const updateLessonRules = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Lesson title cannot be empty")
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),

  body("content")
    .optional({ nullable: true })
    .isString()
    .withMessage("Content must be a string"),

  body("orderIndex")
    .optional()
    .isInt({ min: 1, max: 2147483647 })
    .withMessage("orderIndex must be a positive integer"),
];

// 4. ASSIGNMENT & SUBMISSION RULES (Bắt buộc có Score Validation)
export const createAssignmentRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Assignment title is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string"),

  body("deadline")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Deadline must be a valid ISO 8601 datetime"),

  body("maximumScore")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("maximumScore must be greater than 0"),
];

export const updateAssignmentRules = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Assignment title cannot be empty")
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string"),

  body("deadline")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Deadline must be a valid ISO 8601 datetime"),

  body("maximumScore")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("maximumScore must be greater than 0"),
];

export const submitAssignmentRules = [
  body().custom((value, { req }) => {
    const hasContent = req.body.content && String(req.body.content).trim().length > 0;
    const hasRepoUrl = req.body.repositoryUrl && String(req.body.repositoryUrl).trim().length > 0;
    if (!hasContent && !hasRepoUrl) {
      throw new Error("Either content or repositoryUrl must be provided");
    }
    return true;
  }),

  body("content")
    .optional({ nullable: true })
    .isString()
    .withMessage("Content must be a string"),

  body("repositoryUrl")
    .optional({ nullable: true })
    .trim()
    .isURL()
    .withMessage("repositoryUrl must be a valid URL"),
];

export const reviewSubmissionRules = [
  body("score")
    .notEmpty()
    .withMessage("Score is required")
    .isFloat({ min: 0 })
    .withMessage("Score must be a number greater than or equal to 0"),

  body("feedback")
    .optional({ nullable: true })
    .isString()
    .withMessage("Feedback must be a string"),
];