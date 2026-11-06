import * as classRepository from "../repository/class.repository.js";
import { ForbiddenError, NotFoundError } from "../core/error.response.js";
import { ROLES } from "../core/constants.js";
import catchAsync from "../utils/catchAsync.js";
import { parsePositiveInt } from "../utils/validators.js";

// hàm này kiểm tra xem người dùng có phải là thành viên hoặc mentor của lớp học hay không
export const authorizeClassMember = async (req, classId) => {
  const currentClass = await classRepository.findById(classId);
  if (!currentClass) {
    throw new NotFoundError("Class not found.");
  }

  if (req.user.role !== ROLES.ADMIN) {
    const allowed = await classRepository.isMemberOrMentorOfClass(
      classId,
      req.user.id,
    );
    if (!allowed) {
      throw new ForbiddenError(
        "Access denied. You do not have access to this class.",
      );
    }
  }

  req.classId = classId;
};
// Hàm này xác định quyền truy cập dựa trên vai trò
export const requireClassMember = catchAsync(async (req, _res, next) => {
  const classId = parsePositiveInt(
    req.params.classId ?? req.params.id,
    "class ID",
  );
  await authorizeClassMember(req, classId);
  next();
});
