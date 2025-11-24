import { useState, useEffect, useRef } from "react";
import "./Chat.css";

export default function Chat({ username }) {
  const [receiver, setReceiver] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let ws;
    let shouldReconnect = true;

    function connect() {
      ws = new WebSocket(`wss://python-chatapp-xiny.onrender.com/ws/${username}`);
      socketRef.current = ws;

      ws.onopen = () => console.log("WS Connected");

      ws.onclose = () => {
        if (!shouldReconnect) return;
        console.log("WS Disconnected, retrying...");
        setTimeout(connect, 1500);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "online_users") {
          setOnlineUsers(data.users.filter(u => u !== username));
        }

        if (data.type === "message") {
          setMessages(prev => [...prev, data]);
        }

        if (data.type === "status" || data.type === "seen") {
          setMessages(prev =>
            prev.map(msg => msg.id === data.id ? { ...msg, status: data.status || "seen" } : msg)
          );
        }
      };
    }

    connect();

    return () => {
      shouldReconnect = false;
      socketRef.current?.close();
    };
  }, [username]);


  useEffect(() => {
    if (!receiver || !socketRef.current) return;

    const unseenMessages = messages.filter(
      m => m.sender === receiver && m.status !== "seen"
    );

    if (!unseenMessages.length) return;

    const timer = setTimeout(() => {
      unseenMessages.forEach(msg => {
        socketRef.current?.send(JSON.stringify({
          type: "seen",
          id: msg.id,
          sender: receiver,
          receiver: username,
        }));
      });
    }, 400); // small debounce

    return () => clearTimeout(timer);
  }, [receiver, messages, username]);


  const sendMessage = () => {
    if (!message.trim() || !receiver.trim()) return;

    const msgId = Date.now().toString();

    socketRef.current.send(JSON.stringify({
      type: "message",
      id: msgId,
      text: message,
      sender: username,
      receiver,
    }));

    setMessages(prev => [...prev, {
      id: msgId,
      sender: username,
      text: message,
      receiver,
      status: "sending"
    }]);

    setMessage("");
  };

  return (
    <div className="chat-wrapper">
      {/* Sidebar: Online Users */}
      <div className="sidebar">
        <h3>Online Users</h3>
        {onlineUsers.map(user => (
          <div
            key={user}
            className={`user-item ${user === receiver ? "active" : ""}`}
            onClick={() => {
              if (receiver !== user) setReceiver(user);
            }}
          >
            <span className="dot"></span>
            {user}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="chat-container">
        <div className="chat-header">
          <span>{receiver ? receiver : "Select user to chat"}</span>

          <button
            className="toggle-users-btn"
            onClick={() => {
              document.querySelector(".sidebar").classList.toggle("open");
            }}
          >
            ☰
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>


        <div className="messages">
          {messages
            .filter(
              m =>
                (m.sender === username && m.receiver === receiver) ||
                (m.sender === receiver && m.receiver === username)
            )
            .map(msg => (
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
                      <span style={{ color: "#0084ff" }}>✓✓</span>
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
    </div>
  );
}
