import { useState, useEffect, useRef } from "react";
import "./Chat.css";

export default function Chat({ username }) {
  const [receiver, setReceiver] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let ws;

    function connect() {
      ws = new WebSocket(`wss://https://python-chatapp-xiny.onrender.com/ws/${username}`);

      ws.onopen = () => console.log("WS Connected");

      ws.onclose = () => {
        console.log("WS Disconnected, retrying...");
        setTimeout(connect, 1000);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          setMessages((prev) => [
            ...prev,
            {
              id: data.id,
              text: data.text,
              sender: data.sender,
              receiver: data.receiver,
              status: data.status || "sent",
            },
          ]);
        }

        if (data.type === "status") {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.id ? { ...msg, status: data.status } : msg
            )
          );
        }

        if (data.type === "seen") {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.id ? { ...msg, status: "seen" } : msg
            )
          );
        }
      };

      socketRef.current = ws;
    }

    connect();
    return () => ws?.close();
  }, [username]);

  useEffect(() => {
    if (!receiver || !socketRef.current) return;

    const unseen = messages.filter(
      (m) => m.sender === receiver && m.status !== "seen"
    );

    unseen.forEach((msg) => {
      socketRef.current.send(
        JSON.stringify({
          type: "seen",
          id: msg.id,
          sender: receiver,
          receiver: username,
        })
      );
    });
  }, [receiver, messages, username]);

  const sendMessage = () => {
    if (!message.trim() || !receiver.trim()) return;

    const msgId = Date.now().toString();

    socketRef.current.send(
      JSON.stringify({
        type: "message",
        id: msgId,
        text: message,
        sender: username,
        receiver,
      })
    );

    setMessages((prev) => [
      ...prev,
      {
        id: msgId,
        sender: username,
        text: message,
        receiver,
        status: "sending",
      },
    ]);

    setMessage("");
  };

  return (
    <div className="chat-container">
      <div className="receiver-row">
        <input
          className="receiver-input"
          placeholder="Receiver username"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
        />
      </div>

      <div className="messages">
        {messages
          .filter(
            (m) =>
              (m.sender === username && m.receiver === receiver) ||
              (m.sender === receiver && m.receiver === username)
          )
          .map((msg) => (
            <div
              key={msg.id}
              className={`message-bubble ${
                msg.sender === username ? "sent" : "received"
              }`}
            >
              <div>{msg.text}</div>
              {msg.sender === username && (
                <div className={`msg-status ${msg.status}`}>
                  {msg.status === "sending" && "⏳"}
                  {msg.status === "sent" && "✓"}
                  {msg.status === "delivered" && "✓✓"}
                  {msg.status === "seen" && (
                    <span style={{ color: "#e01e4eff" }}>✓✓</span>
                  )}
                </div>
              )}
            </div>
          ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
