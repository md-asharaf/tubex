import { ApiResponse } from "./api-response.js"
import { logger } from "./logger.js";

const errorHandler = (err, req, res,next) => {
    logger.error("API ERROR: ", err);
    const status = (err.errorInfo || err.name === "TokenExpiredError") ? 401 : (err.status || 500);
    const message = (err.errorInfo || err.name === "TokenExpiredError") ? "Your session has expired. Please log in again to continue." : (err.message || "internal server error");
    return res.status(status).json(new ApiResponse(status, null, message))
}

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      logger.error("API ERROR: ", err);
      next(err);
    });
  };
};

export { asyncHandler, errorHandler };