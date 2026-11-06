import * as classService from '../service/class.service.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/responseHelper.js';
import { parsePositiveInt } from "../utils/validators.js";

const pickClassFields = (body = {}) => {
  const fields = {
    name: body.name,
    description: body.description,
    mentor_id: body.mentor_id ?? body.mentorId,
    start_date: body.start_date ?? body.startDate,
    end_date: body.end_date ?? body.endDate,
  };

  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
};

export const createClass = catchAsync(async (req, res) => {
  const result = await classService.createNewClass(req.body);
  return sendSuccess(res, 201, 'Class created successfully!', result);
});

export const getClasses = catchAsync(async (req, res) => {
  const result = await classService.getClassesByRole(req.user);
  return sendSuccess(res, 200, 'Classes retrieved successfully!', result);
});

export const getClassById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await classService.getClassDetail(id, req.user);
  return sendSuccess(res, 200, 'Class detail retrieved successfully!', result);
});

export const updateClass = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await classService.updateExistingClass(id, req.body);
  return sendSuccess(res, 200, 'Class updated successfully!', result);
});

export const deleteClass = catchAsync(async (req, res) => {
  const { id } = req.params;
  await classService.deleteClassById(id);
  return sendSuccess(res, 200, 'Class deleted successfully!');
});