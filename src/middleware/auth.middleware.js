import { UnauthorizedError } from "../core/error.response.js";
import { verifyToken } from "../utils/jwt.helper.js";
import * as userRepository from "../repository/user.repository.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const match =
      typeof authHeader === "string"
        ? /^Bearer\s+(\S+)$/i.exec(authHeader)
        : null;

    if (!match) {
      throw new UnauthorizedError("Vui lòng cung cấp Bearer token");
    }

    let decoded;

    try {
      decoded = verifyToken(match[1]);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedError("Token đã hết hạn");
      }

      throw new UnauthorizedError("Token không hợp lệ");
    }

    const id = Number(decoded?.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new UnauthorizedError("Token không có user ID hợp lệ");
    }

    const user = await userRepository.findById(id);

    if (!user || !user.is_active) {
      throw new UnauthorizedError("Tài khoản không còn hoạt động");
    }

    // Dùng role mới nhất trong database.
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};