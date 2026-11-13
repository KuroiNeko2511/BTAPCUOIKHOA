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

export const userIdParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("User ID is required")
    .custom((value) => parsePositiveInt(value, "User ID"))
    .withMessage("User ID must be a positive integer"),
];

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

export const validateClassStatus = (status) => {
  if (status === undefined) {
    return status;
  }

  const allowedStatuses = [
    "UPCOMING",
    "ONGOING",
    "COMPLETED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new BadRequestError(
      "status must be UPCOMING, ONGOING, or COMPLETED.",
    );
  }

  return status;
};
// validateLessonOrderIndex: kiểm tra số nguyên dương 32-bit của bài học
export const validateLessonOrderIndex = (orderIndex) => {
  if (orderIndex === undefined) {
    return undefined;
  }

  if (
    !Number.isInteger(orderIndex) ||
    orderIndex <= 0 ||
    orderIndex > 2147483647
  ) {
    throw new BadRequestError(
      "orderIndex must be a positive 32-bit integer.",
    );
  }

  return orderIndex;
};

export const validateLessonTitle = (title) => {
  if (typeof title !== "string") {
    throw new BadRequestError("title must be a string.");
  }

  const normalizedTitle = title.trim();

  if (normalizedTitle.length === 0 || normalizedTitle.length > 200) {
    throw new BadRequestError(
      "title must contain between 1 and 200 characters.",
    );
  }

  return normalizedTitle;
};

export const validateLessonContent = (content) => {
  if (content === undefined || content === null) {
    return content;
  }

  if (typeof content !== "string") {
    throw new BadRequestError(
      "content must be a string or null.",
    );
  }

  return content;
};