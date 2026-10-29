

import { UnauthorizedError } from "../core/error.response.js";

export const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    throw new UnauthorizedError("Quyền truy cập bị từ chối! Chỉ Admin mới có thể thực hiện thao tác này.");
  }
  next();
};