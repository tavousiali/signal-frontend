"use client";
import ChatMessage, { ChatMessageProp } from "@/components/chat/chat-message";
import TextArea from "@/components/form/input/TextArea";
import React, { useState } from "react";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageProp[]>([]);
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e,
  ) => {
    if (e.code === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setMessages((prev) => [
        ...prev,
        { type: "user", message, date: new Date() },
      ]);
      setMessage("");
      getAiResponse();
    }
  };

  const getAiResponse = () => {
    //TODO: Should be show a loading icon
    //TODO: Should show a timer for duration
    //TODO: should be get from ollama
    //generate random response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { type: "ai", message: "پاسخ اتفاقی", date: new Date() },
      ]);
    }, 4000);
  };

  return (
    <>
      <div
        style={{ height: "70vh", overflowY: "auto" }}
        className="rounded-xl border border-gray-200 bg-white px-3 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div className="w-full text-center">
          {messages.map((item) => (
            <ChatMessage
              type={item.type}
              message={item.message}
              date={item.date}
              key={item.date.getTime().toString()}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="relative mt-4">
          <TextArea
            rows={2}
            value={message}
            onChange={(value) => setMessage(value)}
            onKeyDown={handleKeyDown}
            placeholder="با من حرف بزن"
          />
        </div>
      </div>
    </>
  );
};

export default Chat;
