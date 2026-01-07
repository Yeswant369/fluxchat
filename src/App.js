import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc
} from "firebase/firestore";

function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const user = auth.currentUser;
  const roomId = user?.uid; // 🔐 private room per user

  useEffect(() => {
    if (!roomId) return;

    // Ensure room exists
    setDoc(
      doc(db, "rooms", roomId),
      {
        owner: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => d.data()));
    });

    return unsub;
  }, [roomId, user]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "rooms", roomId, "messages"), {
      text,
      senderId: user.uid,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>🔒 Private Room</h2>

      <div
        style={{
          height: 300,
          border: "1px solid #ddd",
          padding: 10,
          overflowY: "auto",
          marginBottom: 10,
        }}
      >
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.senderId === user.uid ? "You" : "Other"}:</b> {m.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: 1, padding: 8 }}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
