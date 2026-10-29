import { validationResult, body, param } from 'express-validator';
import { BadRequestError } from '../core/error.response.js';

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
        const error = new BadRequestError('Validation failed');
        error.errors = formattedErrors;
        return next(error);
    };
};

export const userIdParamRules = [
    param('id')
        .trim()
        .notEmpty().withMessage('User ID is required')
        .isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
];

export const createUserRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email is not valid')
        .normalizeEmail(),

    body('age')
        .optional()
        .isInt({ min: 1, max: 120 }).withMessage('Age must be an integer between 1 and 120'),
];

export const updateUserRules = [
    body()
    .custom((value, { req }) => {
        const allowedFields = ['name', 'email', 'age'];
        const hasAllowedField = Object.keys(req.body).some((key) => allowedFields.includes(key));
        if (!hasAllowedField) {
            throw new Error('At least one field (name, email, age) must be provided for update');
        }
        return true;
    }),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Email must be valid')
        .normalizeEmail(),

    body('age')
        .optional()
        .isInt({ min: 1, max: 120 }).withMessage('Age must be an integer between 1 and 120'),
];
3


export const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Tên không được để trống")
    .isLength({ min: 2, max: 50 }).withMessage("Tên phải từ 2 đến 50 ký tự"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email không được để trống")
    .isEmail().withMessage("Email không đúng định dạng")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty().withMessage("Mật khẩu không được để trống")
    .isLength({ min: 6 }).withMessage("Mật khẩu phải có tối thiểu 6 ký tự"),

  body("age")
    .optional()
    .isInt({ min: 1, max: 120 }).withMessage("Tuổi phải là số nguyên từ 1 đến 120"),
];

export const loginRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email không được để trống")
    .isEmail().withMessage("Email không đúng định dạng")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty().withMessage("Mật khẩu không được để trống"),
];