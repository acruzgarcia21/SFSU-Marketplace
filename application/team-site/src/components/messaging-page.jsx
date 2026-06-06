import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/messaging-page.css";

const sampleChats = [
  {
    id: 1,
    name: "Jordan Lee",
    listingTitle: "Calculus Textbook",
    avatar: "J",
    unread: true,
    messages: [
      {
        id: 1,
        sender: "Jordan Lee",
        text: "Is this still available?",
        time: "2h ago",
      },
      {
        id: 2,
        sender: "me",
        text: "Yes it is!",
        time: "1h ago",
      },
    ],
  },
  {
    id: 2,
    name: "Maya Chen",
    listingTitle: "Desk Lamp",
    avatar: "M",
    unread: true,
    messages: [
      {
        id: 1,
        sender: "Maya Chen",
        text: "Can you meet tomorrow on campus?",
        time: "5h ago",
      },
    ],
  },
];

export default function MessagingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialChatId = location.state?.chatId || sampleChats[0].id;

  const [chats, setChats] = useState(sampleChats);
  const [selectedChatId, setSelectedChatId] = useState(initialChatId);
  const [newMessage, setNewMessage] = useState("");

  const selectedChat =
    chats.find((chat) => chat.id === selectedChatId) || chats[0];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const updatedChats = chats.map((chat) => {
      if (chat.id === selectedChatId) {
        return {
          ...chat,
          messages: [
            ...chat.messages,
            {
              id: chat.messages.length + 1,
              sender: "me",
              text: newMessage,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ],
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setNewMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="messaging-page">
      <aside className="chat-sidebar">
        <div className="sidebar-header">Messages</div>

        <div className="chat-list">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-list-item ${
                selectedChatId === chat.id ? "active" : ""
              }`}
              onClick={() => setSelectedChatId(chat.id)}
            >
              <div className="chat-avatar">{chat.avatar}</div>

              <div className="chat-info">
                <div className="chat-name-row">
                  <span className="chat-name">{chat.name}</span>
                  {chat.unread && <span className="unread-dot"></span>}
                </div>

                <div className="chat-listing">About: {chat.listingTitle}</div>

                <div className="chat-preview">
                  {chat.messages[chat.messages.length - 1]?.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-panel">
        <div className="chat-header">
          <button className="back-button" onClick={handleBack}>
            ← Back
          </button>

          <div className="chat-header-avatar">{selectedChat.avatar}</div>

          <div className="chat-header-text">
            <div className="chat-header-name">{selectedChat.name}</div>
            <div className="chat-header-listing">
              About: {selectedChat.listingTitle}
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {selectedChat.messages.map((message) => (
            <div
              key={message.id}
              className={`message-row ${
                message.sender === "me" ? "my-message-row" : "their-message-row"
              }`}
            >
              <div
                className={`message-bubble ${
                  message.sender === "me" ? "my-message" : "their-message"
                }`}
              >
                <div className="message-text">{message.text}</div>
                <div className="message-time">{message.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            placeholder={`Message ${selectedChat.name}`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </main>
    </div>
  );
}
