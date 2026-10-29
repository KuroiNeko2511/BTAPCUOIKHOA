class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name; // Gắn tên class làm tên lỗi
    }
}

// 400 - Dữ liệu gửi lên không hợp lệ
export class BadRequestError extends ApiError {
    constructor(message = 'Bad Request') {
        super(400, message);
    }
}

// 401 - Chưa xác thực (chưa đăng nhập)
export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}

// 403 - Đã đăng nhập nhưng không có quyền
export class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(403, message);
    }
}

// 404 - Không tìm thấy tài nguyên
export class NotFoundError extends ApiError {
    constructor(message = 'Not Found') {
        super(404, message);
    }
}

// 409 - Xung đột dữ liệu (ví dụ: email đã tồn tại)
export class ConflictError extends ApiError {
    constructor(message = 'Conflict') {
        super(409, message);
    }
}

export default ApiError;
