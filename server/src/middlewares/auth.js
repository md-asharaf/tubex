import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/handler.js";
export const validateAccessToken = async (accessToken) => {
  try {
    const { _id, email, fullname, username } = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    return await User.findOne({ _id, email, fullname, username });
  } catch (error) {
    throw error;
  }
};
export const verifyJWT = asyncHandler(async (req, res, next) => {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    throw new ApiError(401, "You are not authorized to perform this action. Please log in and try again.");
  }
  let user = null;
  if (accessToken) {
    try {
      user = await validateAccessToken(accessToken);
    } catch (error) {
      user = null;
    }
  }
  if (!user) {
    throw new ApiError(401, "Your session has expired");
  }
  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    return next();
  }
  try {
    const user = await validateAccessToken(accessToken);
    req.user = user;
  } catch (error) {
  }
  next();
});

