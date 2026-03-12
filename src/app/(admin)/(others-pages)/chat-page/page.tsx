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

  /* ------------------------------ */
  /* 1. تابع ارسال پیام           */
  /* ------------------------------ */
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

    if (!res.ok) {
      console.error("API error", res.statusText);
      setIsStreaming(false);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder("utf-8");
    let assistantText = "";

    /* ------------------------------ */
    /* 2. خواندن stream              */
    /* ------------------------------ */
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      /* 2.1 جدا کردن خطوط (newline‑delimited JSON) */
      const lines = chunk.split("\n").filter((l) => l.trim() !== "");

      for (const rawLine of lines) {
        const line = rawLine.startsWith("data: ")
          ? rawLine.slice("data: ".length)
          : rawLine;

        try {
          const obj = JSON.parse(line);
          const part = obj.message.content ?? "";
          assistantText += part;

          /* 2.2 نمایش به صورت live – تبدیل Markdown به HTML */
          if (outputRef.current) {
            outputRef.current.innerHTML = markdownToHtml(assistantText);
          }
        } catch {
          /* ignore parse errors */
        }
      }
    }

    /* ------------------------------ */
    /* 3. پایان stream               */
    /* ------------------------------ */
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: assistantText },
    ]);

    setIsStreaming(false);
    setInput("");
  };

  /* ------------------------------ */
  /* 4. UI                          */
  /* ------------------------------ */
  return (
    <div className={styles.container}>
      <div className={styles.chatWindow}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "assistant" ? styles.assistant : styles.user}
          >
            <strong>{m.role === "assistant" ? "🤖" : "🧑"}:</strong>{" "}
            {/* در اینجا می‌توانیم هم‌زمان به Markdown و HTML تبدیل کنیم */}
            <span
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(m.content),
              }}
            />
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

/* ------------------------------ */
/* 5. تبدیل Markdown به HTML     */
/* ------------------------------ */
function markdownToHtml(md: string): string {
  /* 1. escape HTML */
  md = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* 2. بلوک‌های کد (به‌صورت ***پس از escape کردن backtick***) */
  md = md.replace(
    /`{3}(\w+)?\n([\s\S]*?)\n`{3}/g,
    (_, lang = "", code) =>
      `<pre class="code-block"><code${lang ? ' class="language-' + lang + '"' : ""}>${code}</code></pre>`,
  );

  /* 3. سرفصل‌ها – فاصله اختیاری */
  const heads = [
    [/^######\s*(.*)$/gm, "<h6>$1</h6>"],
    [/^#####\s*(.*)$/gm, "<h5>$1</h5>"],
    [/^####\s*(.*)$/gm, "<h4>$1</h4>"],
    [/^###\s*(.*)$/gm, "<h3>$1</h3>"],
    [/^##\s*(.*)$/gm, "<h2>$1</h2>"],
    [/^#\s*(.*)$/gm, "<h1>$1</h1>"],
  ];
  heads.forEach(([re, rep]) => {
    md = md.replace(re, rep);
  });

  /* 4. خط‌کش افقی */
  md = md.replace(/^---$/gm, "<hr>");

  /* 5. بولد */
  md = md.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  md = md.replace(/__(.+?)__/g, "<strong>$1</strong>");

  /* 6. ایتالیک */
  md = md.replace(/\*(.+?)\*/g, "<em>$1</em>");
  md = md.replace(/_(.+?)_/g, "<em>$1</em>");

  /* 7. لینک */
  md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  /* 8. لیست‌های ترتیب‌دار (یک <ol> برای تمام آیتم‌ها) */
  const ol = md.match(/^(\s*\d+\.\s+.*)$/gm);
  if (ol) {
    const items = ol
      .map((x) => `<li>${x.replace(/^\s*\d+\.\s+/, "")}</li>`)
      .join("");
    md = md.replace(ol.join("\n"), `<ol>${items}</ol>`);
  }

  /* 9. لیست‌های بدون ترتیب (یک <ul> برای تمام آیتم‌ها) */
  const ul = md.match(/^(\s*[-+*]\s+.*)$/gm);
  if (ul) {
    const items = ul
      .map((x) => `<li>${x.replace(/^\s*[-+*]\s+/, "")}</li>`)
      .join("");
    md = md.replace(ul.join("\n"), `<ul>${items}</ul>`);
  }

  /* 10. پاراگراف‌ها (تنها خطوطی که در پیش از این تبدیل نشده‌اند) */
  md = md.replace(/^\s*(.+?)\s*$/gm, (m, line) => {
    if (/<(h[1-6]|pre|code|ul|ol|li|hr)>/.test(line)) return line;
    return `<p>${line}</p>`;
  });

  return md;
}
