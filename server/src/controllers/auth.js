import { User } from "../models/user.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/handler.js";
import jwt from "jsonwebtoken";
class AuthController {
  googleSignIn = asyncHandler(async (req, res) => {
    const { email, fullname, avatar, idToken } = req.body;
    if (!email || !idToken) {
      throw new ApiError(400, "Email and idToken is required")
    }
    let user;
    user = await User.findOne({ email })
    if (user) {
      user.idToken = idToken;
      await user.save({ validateBeforeSave: false });
    }
    else {
      if (!fullname || !avatar) {
        throw new ApiError(400, "Fullname and avatar is required");
      }
      user = await User.create({
        email,
        fullname,
        username: email.split("@")[0],
        avatar,
        idToken
      })
    }
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none"
    }
    return res.status(200).cookie("idToken", idToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, { user }, "User logged in successfully"))
  })
  registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullname } = req.body;
    if (
      [username, email, password, fullname].some((field) => field?.trim() === "")
    ) {
      throw new ApiError(400, "All fields are required");
    }
    const existedUser = await User.findOne({
      $or: [{ username }, { email }]
    })
    if (existedUser) {
      throw new ApiError(400, "User already exists")
    }
    const user = await User.create({
      email,
      password,
      fullname,
      username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id)?.select("-refreshToken");
    if (!createdUser) {
      throw new ApiError(500, "Failed to create user");
    }
    return res.status(201).json(
      new ApiResponse(200, { createdUser }, "User created successfully")
    )
  })
  loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      throw new ApiError(400, "email is required")
    }
    if (!password) {
      throw new ApiError(400, "password is required")
    }
    const existedUser = await User.findOne({ email });
    if (!existedUser) {
      throw new ApiError(400, "invalid email")
    }
    const isPasswordCorrect = await existedUser.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      throw new ApiError(400, "invalid password")
    }
    const accessToken = await existedUser.generateAccessToken();
    const refreshToken = await existedUser.generateRefreshToken();
    const loggedInUser = await User.findById(existedUser._id).select("-refreshToken");
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none"
    };
    return res
      .cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, { user: loggedInUser }, "user logged in successfully"))
  })
  logoutUser = asyncHandler(async (req, res) => {
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none"
    };
    return res.status(200).clearCookie("idToken", options).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, null, "User logged out successfully"))
  })
  refreshTokens = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new ApiError(401, "Refresh token is required");
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }
    const { _id } = decoded;
    if (!_id) {
      throw new ApiError(401, "Invalid refresh token");
    }
    const user = await User.findById(_id);
    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }
    const newAccessToken = await user.generateAccessToken();
    const newRefreshToken = await user.generateRefreshToken();
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await User.findById(_id).select("-refreshToken");
    const options = { httpOnly: true, secure: true, sameSite: "none" };
    res.cookie("accessToken", newAccessToken, options);
    res.cookie("refreshToken", newRefreshToken, options);

    return res.status(200).json(new ApiResponse(200, { user: loggedInUser }, "Tokens refreshed successfully"));
  })
}
export const authController = new AuthController();