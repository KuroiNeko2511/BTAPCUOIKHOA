import * as classMemberService from "../service/classMember.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const addMember = catchAsync(async (req, res) => {
  const { id: classId } = req.params;
  const { memberId } = req.body;

  if (!memberId) {
    return res
      .status(400)
      .json({ success: false, message: "memberId is required" });
  }

  const result = await classMemberService.addMemberToClass(classId, memberId);
  return sendSuccess(res, 201, result, "Member added to class successfully");
});

export const getMembers = catchAsync(async (req, res) => {
  const { id: classId } = req.params;
  const members = await classMemberService.getMembersOfClass(classId);
  return sendSuccess(res, 200, members, "Get class members successfully");
});

export const removeMember = catchAsync(async (req, res) => {
  const { id: classId, memberId } = req.params;
  const result = await classMemberService.removeMemberFromClass(
    classId,
    memberId,
  );
  return sendSuccess(res, 200, result, "Member removed successfully");
});
