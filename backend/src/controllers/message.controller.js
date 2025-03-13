import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId ,io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";


export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessageForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // If the user already deleted it, don't add again
    if (message.deletedBy.includes(userId)) {
      return res.status(400).json({ error: "Message already deleted for you" });
    }

    await Message.findByIdAndUpdate(messageId, { $push: { deletedBy: userId } });

    res.status(200).json({ message: "Message deleted for you" });
  } catch (error) {
    console.error("Error deleting message for user:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const deleteMessageForEveryone = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages for everyone" });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted for everyone" });
  } catch (error) {
    console.error("Error deleting message for everyone:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const clearChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatWith } = req.params;

    await Message.updateMany(
      { $or: [{ senderId: userId, receiverId: chatWith }, { senderId: chatWith, receiverId: userId }] },
      { $push: { deletedBy: userId } }
    );

    res.status(200).json({ message: "Chat cleared for you" });
  } catch (error) {
    console.error("Error clearing chat:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};