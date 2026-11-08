import { ForbiddenError, UnauthorizedError } from "../core/error.response.js";
import { ROLES } from "../core/constants.js";

export const authorizeAdmin = (req, _res, next) => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required.");
  }

  if (req.user.role !== ROLES.ADMIN) {
    throw new ForbiddenError("Access denied. Administrator privileges required.");
  }
  next();
};

