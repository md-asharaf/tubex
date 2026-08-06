import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import { postController } from "../controllers/post.js";
import { limiter } from "../utils/rate-limiter.js";

const router = Router();

router.get("/all-posts/:username", postController.getUserPosts);
router.post("/create-post", limiter(10), verifyJWT, postController.createPost);
router.get("/:postId", postController.getPostById);

router.use(verifyJWT);
router.patch("/update-post/:postId", postController.updatePost);
router.delete("/delete-post/:postId", postController.deletePost);

export const postRoutes = router;