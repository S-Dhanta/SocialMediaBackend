import express from 'express';
import {getAllPosts, createPost, updatePost, getPost, removePost, likePost, unlikePost, addComment, editComment, removeComment} from "../controllers/FeedControllers";
import { authenticateToken } from '../service/auth';


const postRouter = express.Router();

postRouter.get("/", auhtenticateToken, getAllPosts);
postRouter.post("/", authenticateToken, createPost);
postRouter.put("/:id", authenticateToken, updatePost);
postRouter.get("/:id", authenticateToken, getPost);
postRouter.delete("/:id", authenticateToken, removePost);

postRouter.post("/:id/like", authenticateToken, likePost);
postRouter.delete("/:id/like", authenticateToken, unlikePost);

postRouter.post("/:id/comment", authenticateToken, addComment);
postRouter.put("/:id/comment/:cid", authenticateToken, editComment);
postRouter.delete("/:id/comment/:cid", authenticateToken, removeComment);

export default postRouter;