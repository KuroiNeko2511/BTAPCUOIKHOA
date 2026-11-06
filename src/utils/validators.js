import { BadRequestError } from "../core/error.response.js";

export const parsePositiveInt = (value, fieldName = "ID") => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new BadRequestError(`Invalid ${fieldName}.`);
  }
  return parsed;
};
