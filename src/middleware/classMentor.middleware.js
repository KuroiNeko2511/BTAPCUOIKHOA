import * as lessonRepository from "../repository/lesson.repository.js";
import * as classRepository from "../repository/class.repository.js";
import { ForbiddenError, NotFoundError } from "../core/error.response.js";
import catchAsync from "../utils/catchAsync.js";

export const requireClassMentor = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  // Admin luôn có quyền
  if (userRole === "ADMIN") return next();

  let classId = req.params.classId || req.params.id || req.body.classId;

  // Nếu route là /lessons/:id thì tìm classId thông qua lesson
  if (req.baseUrl.includes("/lessons") && req.params.id) {
    const lesson = await lessonRepository.findLessonById(req.params.id);
    if (!lesson) {
      throw new NotFoundError("Không tìm thấy bài học!");
    }
    classId = lesson.class_id;
  }

  const currentClass = await classRepository.findById(classId);
  if (!currentClass) {
    throw new NotFoundError("Không tìm thấy lớp học!");
  }

  // 4. Kiểm tra user có phải Mentor phụ trách lớp này không
  if (currentClass.mentor_id !== userId) {
    throw new ForbiddenError("Bạn không phải Mentor phụ trách lớp học này!");
  }

  req.classId = classId;
  next();
});
