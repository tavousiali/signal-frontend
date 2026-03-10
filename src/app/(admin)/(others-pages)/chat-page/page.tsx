"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";

type Message = { role: string; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------
  // ۱. تابع ارسال پیام
  // -------------------------------------------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    // حالت اولیه
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "user", content: input }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-oss:20b",
        messages: [{ role: "user", content: input }],
        stream: true,
      }),
    });

    // در صورت خطا در درخواست، خروجی
    if (!res.ok) {
      console.error("API error", res.statusText);
      setIsStreaming(false);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder("utf-8");
    let assistantText = "";

    // حلقه‌ی خواندن بسته‌های stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break; // سرور بسته‌ی نهایی را بسته بود
      const chunk = decoder.decode(value, { stream: true });

      // ۱. جدا کردن خطوط ( newline‑delimited JSON )
      const lines = chunk.split("\n").filter((l) => l.trim() !== "");

      for (const rawLine of lines) {
        // اگر پیشوند "data:" وجود داشت، آن را برش می‌دهیم
        const line = rawLine.startsWith("data: ")
          ? rawLine.slice("data: ".length)
          : rawLine;

        // ۲. پارس JSON
        try {
          const obj = JSON.parse(line);

          // ۳. متن را از فیلد content اضافه می‌کنیم
          const part = obj.message.content ?? "";
          assistantText += part;

          // ۴. نمایش به صورت live
          if (outputRef.current) {
            outputRef.current.textContent = assistantText;
          }
        } catch (e) {
          console.warn("خطای JSON در دریافت stream:", e);
        }
      }
    }

    // ۵. افزودن پیام نهایی به آرایه‌ی `messages`
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: assistantText },
    ]);

    setIsStreaming(false);
    setInput(""); // پاک کردن textarea
  };

  // -------------------------------------------------------------------
  // ۲. UI
  // -------------------------------------------------------------------
  return (
    <div className={styles.container}>
      <div className={styles.chatWindow}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "assistant" ? styles.assistant : styles.user}
          >
            <strong>{m.role === "assistant" ? "🤖" : "🧑"}:</strong> {m.content}
          </div>
        ))}

        {/* متن در حال streaming */}
        {isStreaming && <div ref={outputRef} className={styles.streaming} />}
        <div ref={scrollRef} />
      </div>

      <div className={styles.inputArea}>
        <textarea
          className={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          rows={3}
        />
        <button
          className={styles.sendBtn}
          onClick={sendMessage}
          disabled={isStreaming}
        >
          {isStreaming ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
