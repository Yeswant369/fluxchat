import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  where,
} from "firebase/firestore";

export default function App() {
  const [uid, setUid] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [newRoomName, setNewRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");

  // 🔐 Auth
  useEffect(() => {
    return auth.onAuthStateChanged((u) => u && setUid(u.uid));
  }, []);

  // 📂 Load rooms
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "rooms"),
      where("members", "array-contains", uid)
    );
    return onSnapshot(q, (snap) =>
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [uid]);

  // 💬 Load messages
  useEffect(() => {
    if (!activeRoom) return;
    const q = query(
      collection(db, "rooms", activeRoom.id, "messages"),
      orderBy("createdAt")
    );
    return onSnapshot(q, (snap) =>
      setMessages(snap.docs.map((d) => d.data()))
    );
  }, [activeRoom]);

  // ➕ Create room
  const createRoom = async () => {
    if (!newRoomName) return;
    const roomId = crypto.randomUUID().slice(0, 8);
    await setDoc(doc(db, "rooms", roomId), {
      name: newRoomName,
      members: [uid],
      createdAt: serverTimestamp(),
    });
    alert(`Room ID: ${roomId}`);
    setNewRoomName("");
  };

  // 🔑 Join room
  const joinRoom = async () => {
    if (!joinRoomId) return;
    await setDoc(
      doc(db, "rooms", joinRoomId),
      { members: [uid] },
      { merge: true }
    );
    setJoinRoomId("");
  };

  // ✉️ Send
  const sendMessage = async () => {
    if (!text) return;
    await addDoc(collection(db, "rooms", activeRoom.id, "messages"), {
      text,
      sender: uid,
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  /* ---------------- UI ---------------- */

  // 🟢 CHAT SCREEN
  if (activeRoom) {
    return (
      <div className="chat-screen">
        <div className="chat-header">
          <button onClick={() => setActiveRoom(null)}>←</button>
          <h3>{activeRoom.name}</h3>
        </div>

        <div className="messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.sender === uid ? "bubble me" : "bubble other"}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="input-bar">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    );
  }

  // 🟢 ROOMS LIST (DEFAULT)
  return (
    <div className="rooms-screen">
      <div className="top-bar">
        <h2>FluxChat</h2>
        <button onClick={createRoom}>＋</button>
      </div>

      <input
        placeholder="New room name"
        value={newRoomName}
        onChange={(e) => setNewRoomName(e.target.value)}
      />

      <input
        placeholder="Join with Room ID"
        value={joinRoomId}
        onChange={(e) => setJoinRoomId(e.target.value)}
      />
      <button onClick={joinRoom}>Join</button>

      <div className="room-list">
        {rooms.map((r) => (
          <div
            key={r.id}
            className="room-item"
            onClick={() => setActiveRoom(r)}
          >
            <div className="avatar" />
            <div>
              <b>{r.name}</b>
              <p>Tap to open</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
