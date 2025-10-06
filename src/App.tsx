import { useEffect, useRef, useState } from "react";
import "./App.css";
import "./index.css";

interface Message {
  type: "chat" | "system";
  payload: any;
}

function App() {
  const [username, setUsername] = useState<string>("");
  const [joined, setJoined] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>("red");
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinRoom = () => {
    if (!username.trim()) return alert("Enter a username first!");
    if (wsRef.current) return;
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          payload: { roomId, username },
        })
      );
      setJoined(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    wsRef.current = ws;
  };

  const sendMessage = () => {
    const message = inputRef.current?.value?.trim();
    if (!message || !wsRef.current) return;

    wsRef.current.send(
      JSON.stringify({
        type: "chat",
        payload: { username, message },
      })
    );

    if (inputRef.current) inputRef.current.value = "";
  };

  if (!joined) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-bold mb-6">💬 Join the Chat</h1>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter a username" className="p-3 rounded-xl bg-white/10 border border-purple-600 text-white outline-none focus:ring-2 focus:ring-purple-400 w-64 mb-4 text-center" />
        <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Room ID" className="p-3 rounded-xl bg-white/10 border border-purple-600 text-white outline-none focus:ring-2 focus:ring-purple-400 w-64 mb-4 text-center" />
        <button onClick={joinRoom} className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold shadow-md transition-all">
          Join Room
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <header className="p-4 text-center font-semibold text-lg border-b border-purple-700/40">
        Room: <span className="text-purple-400">{roomId}</span> | You: <span className="text-purple-300">{username}</span>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-700 scrollbar-track-transparent">
        {messages.map((msg, i) => {
          if (msg.type === "system") {
            return (
              <div key={i} className="text-center text-gray-400 text-sm italic">
                {msg.payload}
              </div>
            );
          }

          const isSelf = msg.payload.username === username;
          return (
            <div key={i} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] p-3 rounded-2xl shadow-md backdrop-blur-md ${isSelf ? "bg-purple-600 text-white rounded-br-none" : "bg-white/10 text-gray-100 rounded-bl-none"}`}>
                {!isSelf && <div className="text-xs text-purple-300 mb-1">{msg.payload.username}</div>}
                {msg.payload.message}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef}></div>
      </main>

      <footer className="bg-black/60 border-t border-purple-700/40 backdrop-blur-lg p-3 flex items-center gap-2">
        <input ref={inputRef} id="message" type="text" placeholder="Type a message..." className="flex-1 p-3 rounded-xl bg-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500 transition-all" onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
        <button onClick={sendMessage} className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl font-medium shadow-md transition-all">
          Send
        </button>
      </footer>
    </div>
  );
}

export default App;
