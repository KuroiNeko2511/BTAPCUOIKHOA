import { ForbiddenError } from "../core/error.response.js";

export const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    throw new ForbiddenError("Chỉ Admin được thực hiện thao tác này");
  }

  next();
};