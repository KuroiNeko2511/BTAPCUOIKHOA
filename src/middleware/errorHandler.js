import ApiError from '../core/error.response.js';

// error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.name}: ${err.message}`);

    // Nếu là lỗi do chúng ta tự throw (ApiError hoặc các class con)
    if (err instanceof ApiError) {
        const response = {
            success: false,
            message: err.message,
        };
        // Đính kèm danh sách lỗi chi tiết nếu có (từ validate middleware)
        if (err.errors) response.errors = err.errors;
        return res.status(err.statusCode).json(response);
    }

    // Với mọi lỗi không mong muốn khác (lỗi hệ thống, DB, ...)
    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
    });
};

export default errorHandler;
