import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const formattedErrors = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
      value: e.value,
    }));

    next(new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', formattedErrors));
  };
};
