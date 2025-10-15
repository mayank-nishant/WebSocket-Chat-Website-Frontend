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
  const [roomId, setRoomId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinRoom = () => {
    if (!username.trim()) return alert("Please enter a username!");
    if (!roomId.trim()) return alert("Please enter a room ID!");
    if (wsRef.current) return;

    const ws = new WebSocket(import.meta.env.VITE_WS_URL);

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

    ws.onclose = () => {
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          payload: `${username} has left the room.`,
        },
      ]);
    };

    wsRef.current = ws;
  };

  const sendMessage = () => {
    const message = inputRef.current?.value?.trim();
    if (!message || !wsRef.current) return;

    wsRef.current.send(
      JSON.stringify({
        type: "chat",
        payload: { username, message, roomId },
      })
    );

    if (inputRef.current) inputRef.current.value = "";
  };

  const leaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: "leave",
          payload: { username, roomId },
        })
      );
      wsRef.current.close();
      wsRef.current = null;
      setJoined(false);
      setMessages([]);
    }
  };

  if (!joined) {
    return (
      <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center text-white">
        <h1 className="text-4xl font-extrabold mb-8 text-center drop-shadow-md">💬 Join a Chat Room</h1>
        <div className="flex flex-col gap-4 bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-purple-700/30 w-80">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" className="p-3 rounded-xl bg-white/10 border border-purple-500 text-white text-center outline-none focus:ring-2 focus:ring-purple-400 transition-all" />
          <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Enter room ID" className="p-3 rounded-xl bg-white/10 border border-purple-500 text-white text-center outline-none focus:ring-2 focus:ring-purple-400 transition-all" />
          <button onClick={joinRoom} className="bg-purple-600 hover:bg-purple-700 active:scale-95 px-6 py-3 rounded-xl font-semibold shadow-md transition-all">
            Join Room
          </button>
        </div>
        <p className="mt-6 text-sm text-gray-400">Create or join an existing room by entering a room ID.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-950 via-purple-950 to-black text-white">
      <header className="p-4 text-center font-semibold text-lg border-b border-purple-700/40 shadow-md flex justify-between items-center">
        <div>
          Room: <span className="text-purple-400">{roomId}</span> | You: <span className="text-purple-300">{username}</span>
        </div>
        <button onClick={leaveRoom} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-medium shadow-md transition-all">
          Leave
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-700 scrollbar-track-transparent">
        {messages.map((msg, i) => {
          if (msg.type === "system") {
            return (
              <div key={i} className="text-center text-gray-400 text-sm italic tracking-wide">
                {msg.payload}
              </div>
            );
          }

          const isSelf = msg.payload.username === username;
          return (
            <div key={i} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl shadow-md backdrop-blur-md transition-all ${isSelf ? "bg-purple-600 text-white rounded-br-none" : "bg-white/10 text-gray-100 rounded-bl-none"}`}>
                <div className={`text-xs mb-1 ${isSelf ? "text-purple-200" : "text-purple-300"}`}>{msg.payload.username}</div>
                {msg.payload.message}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef}></div>
      </main>

      <footer className="bg-black/60 border-t border-purple-700/40 backdrop-blur-lg p-3 flex items-center gap-2">
        <input ref={inputRef} id="message" type="text" placeholder="Type your message..." className="flex-1 p-3 rounded-xl bg-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500 transition-all" onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
        <button onClick={sendMessage} className="bg-purple-600 hover:bg-purple-700 active:scale-95 px-5 py-3 rounded-xl font-medium shadow-md transition-all">
          Send
        </button>
      </footer>
    </div>
  );
}

export default App;
