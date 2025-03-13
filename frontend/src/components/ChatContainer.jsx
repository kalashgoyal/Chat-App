import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import { Trash2, XCircle } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessageForMe,
    deleteMessageForEveryone,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (!selectedUser) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!selectedUser) {
    return <div className="flex-1 flex items-center justify-center">Select a user to start chatting</div>;
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isSender = message.senderId === authUser._id;
          
          return (
            <div
              key={message._id}
              className={`chat ${isSender ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              {/* Profile Image */}
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={isSender ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"}
                    alt="profile pic"
                  />
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500 mb-1 px-1">
                {formatMessageTime(message.createdAt)}
              </div>

              {/* Message Bubble with Delete Buttons */}
              <div className="relative chat-bubble flex flex-col group">
                {/* Delete Buttons (appear on hover) */}
                <div className="absolute top-1 right-2 hidden group-hover:flex gap-2">
                  {/* Delete for Me */}
                  <button
                    onClick={() => deleteMessageForMe(message._id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Delete for Me"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Delete for Everyone (Only if Sent by Current User) */}
                  {isSender && (
                    <button
                      onClick={() => deleteMessageForEveryone(message._id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete for Everyone"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>

                {/* Message Content */}
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
