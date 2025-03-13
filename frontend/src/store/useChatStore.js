import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  /** ✅ Fetch users */
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /** ✅ Fetch messages for selected user */
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  /** ✅ Send a message */
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  /** ✅ Delete a message for yourself */
  deleteMessageForMe: async (messageId) => {
    try {
      const res = await axiosInstance.delete(`/messages/delete-for-me/${messageId}`);
      if (res.status === 200) {
        set((state) => ({
          messages: state.messages.filter((msg) => msg._id !== messageId),
        }));
        toast.success("Message deleted for you");
      }
    } catch (error) {
      console.error("Delete error:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Failed to delete message");
    }
  },

  /** ✅ Delete a message for everyone */
  deleteMessageForEveryone: async (messageId) => {
    try {
      const res = await axiosInstance.delete(`/messages/delete-for-everyone/${messageId}`);
      if (res.status === 200) {
        set((state) => ({
          messages: state.messages.filter((msg) => msg._id !== messageId),
        }));

        // Emit socket event to remove message for others
        const socket = useAuthStore.getState().socket;
        socket.emit("messageDeleted", messageId);

        toast.success("Message deleted for everyone");
      }
    } catch (error) {
      console.error("Delete error:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Failed to delete message for everyone");
    }
  },

  /** ✅ Clear chat for yourself */
  clearChat: async () => {
    const { selectedUser } = get();
    try {
      await axiosInstance.delete(`/messages/clear-chat/${selectedUser._id}`);
      set({ messages: [] });
      toast.success("Chat cleared");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clear chat");
    }
  },

  /** ✅ Subscribe to real-time messages */
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id) {
        set((state) => ({ messages: [...state.messages, newMessage] }));
      }
    });

    socket.on("messageDeleted", (messageId) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
    });
  },

  /** ✅ Unsubscribe from messages */
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageDeleted");
  },

  /** ✅ Set selected user */
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
