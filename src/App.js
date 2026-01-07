import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // 🔐 CHANGE THIS LATER WITH FRIEND UID
  const roomId = "LqWYxaN4jMUorQ90amP4Cz3dl893";

  // Wait for auth to be ready
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsub();
  }, []);

  // Listen for messages
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => doc.data()));
    });

    return () => unsub();
  }, [user]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    await addDoc(collection(db, "rooms", roomId, "messages"), {
      text: message,
      senderId: user.uid,
      createdAt: serverTimestamp()
    });

    setMessage("");
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>🔐 Private Room</h2>

      {/* ✅ UID DISPLAY (THIS IS WHAT YOU ASKED) */}
      <p style={{ color: "gray", fontSize: 14 }}>
        Your UID: <b>{user.uid}</b>
      </p>

      <div
        style={{
          border: "1px solid #ccc",
          height: 300,
          overflowY: "auto",
          padding: 10,
          marginBottom: 10
        }}
      >
        {messages.map((m, i) => (
          <p key={i}>
            <b>{m.senderId === user.uid ? "You" : "Friend"}:</b> {m.text}
          </p>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message"
        style={{ width: "70%" }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
