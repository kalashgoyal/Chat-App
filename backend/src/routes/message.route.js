import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {getMessages,getUsersForSidebar,sendMessage,deleteMessageForMe,deleteMessageForEveryone,clearChat} from "../controllers/message.controller.js";

const router = express.Router();


router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.delete("/delete-for-me/:messageId", protectRoute, deleteMessageForMe);
router.delete("/delete-for-everyone/:messageId", protectRoute, deleteMessageForEveryone);
router.delete("/clear-chat/:chatWith", protectRoute, clearChat);

export default router;
