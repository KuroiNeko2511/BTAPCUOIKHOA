import { UnauthorizedError } from "../core/error.response.js";
import { verifyToken } from "../utils/jwt.helper.js";
import * as userRepository from "../repository/user.repository.js";

const BEARER_REGEX = /^Bearer\s+(\S+)$/i;
const INVALID_TOKEN_ERRORS = new Set(["JsonWebTokenError", "NotBeforeError"]);
const extractBearerToken = (authHeader) => {
  if (typeof authHeader !== "string") return null;

  const match = BEARER_REGEX.exec(authHeader);
  return match ? match[1] : null;
};

export const authenticateToken = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedError(
        "Authentication required. Please provide a valid Bearer token."
      );
    }

    let decoded;

    try {
      decoded = verifyToken(token);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedError("Access token has expired.");
      }

      if (INVALID_TOKEN_ERRORS.has(error.name)) {
        throw new UnauthorizedError("Invalid access token.");
      }
      throw error;
    }

    const id = Number(decoded?.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new UnauthorizedError("Access token does not contain a valid user ID.");
    }

    const user = await userRepository.findById(id);

    if (!user || !user.is_active) {
      throw new UnauthorizedError("User account is inactive or no longer exists.");
    }

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