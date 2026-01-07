import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

function App() {
  const [myUid, setMyUid] = useState(null);
  const [friendUid, setFriendUid] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) setMyUid(user.uid);
    });
    return unsub;
  }, []);

  // Generate SAME room for both users
  const startChat = () => {
    if (!friendUid || !myUid) return;
    const id = [myUid, friendUid].sort().join("_");
    setRoomId(id);
  };

  // Listen to messages
  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt")
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => d.data()));
    });
  }, [roomId]);

  const sendMessage = async () => {
    if (!text || !roomId) return;
    await addDoc(collection(db, "rooms", roomId, "messages"), {
      text,
      sender: myUid,
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🔒 Private Room</h2>

      {myUid && <p><b>Your UID:</b> {myUid}</p>}

      {!roomId && (
        <>
          <input
            placeholder="Paste friend's UID"
            value={friendUid}
            onChange={(e) => setFriendUid(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <button onClick={startChat}>Start Chat</button>
        </>
      )}

      {roomId && (
        <>
          <div style={{ height: 300, border: "1px solid #ccc", marginTop: 10 }}>
            {messages.map((m, i) => (
              <p key={i}>
                <b>{m.sender === myUid ? "You" : "Friend"}:</b> {m.text}
              </p>
            ))}
          </div>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message"
          />
          <button onClick={sendMessage}>Send</button>
        </>
      )}
    </div>
  );
}

export default App;

