import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import { authController } from "../controllers/auth.js";
import { userController } from "../controllers/user.js";
import { limiter } from "../utils/rate-limiter.js";
const router = Router();

router.get("/logout", authController.logoutUser);
router.get("/get-users", userController.getUsers)
router.get("/search-channels", userController.searchChannels)
router.get("/refresh-tokens", authController.refreshTokens);
router.post("/login", authController.loginUser);
router.post("/register", limiter(2), authController.registerUser);
router.post("/google-login", authController.googleSignIn);
router.post("/forget-password", userController.forgetPassword);
router.patch('/reset-password', userController.resetPassword)
router.get("/channel/:username", userController.getUserChannel)
router.use(verifyJWT)
router.get("/watch-later", userController.getWatchLater)
router.get("/watch-history", userController.getWatchHistory)
router.get("/current-user", userController.getCurrentUser);
router.get("/is-saved-to-watch-later", userController.isSavedToWatchLater)
router.post("/save-to-watch-later", userController.saveToWatchLater)
router.post("/add-to-watch-history", userController.addToWatchHistory)
router.patch("/remove-from-watch-later", userController.removeFromWatchLater)
router.patch("/change-password", userController.changeCurrentPassword);
router.patch("/update-account-details", userController.updateAccountDetails);
router.delete("/clear-watch-history", userController.clearWatchHistory)
router.delete("/remove-from-watch-history", userController.removeFromWatchHistory)

export const userRoutes = router;