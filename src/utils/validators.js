import { BadRequestError } from "../core/error.response.js";

export const parsePositiveInt = (value, fieldName = "ID") => {
  const validString = typeof value === "string" && /^[1-9]\d*$/.test(value);

  const validNumber =
    typeof value === "number" && Number.isSafeInteger(value) && value > 0;

  if (!validString && !validNumber) {
    throw new BadRequestError(`${fieldName} must be a positive integer.`);
  }

  const result = Number(value);

  if (!Number.isSafeInteger(result)) {
    throw new BadRequestError(
      `${fieldName} exceeds the supported integer range.`,
    );
  }

  return result;
};

export const parseDateOnly = (value, fieldName) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestError(
      `${fieldName} must use YYYY-MM-DD format.`,
    );
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestError(`${fieldName} is not a valid date.`);
  }

  return value;
};