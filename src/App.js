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

const ROOM_ID = "private-room-1"; // locked room

export default function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const user = auth.currentUser;

  // Create room ONCE
  useEffect(() => {
    if (!user) return;

    const roomRef = doc(db, "rooms", ROOM_ID);

    setDoc(roomRef, {
      name: "Private Chat",
      ownerId: user.uid,
      members: {
        [user.uid]: true
      },
      createdAt: serverTimestamp()
    }, { merge: true });

  }, [user]);

  // Listen to messages
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "rooms", ROOM_ID, "messages"),
      orderBy("createdAt")
    );

    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => d.data()));
    });
  }, [user]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(
      collection(db, "rooms", ROOM_ID, "messages"),
      {
        text,
        senderId: user.uid,
        senderName: "User",
        createdAt: serverTimestamp()
      }
    );

    setText("");
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="font-bold text-xl mb-4">🔒 Private Room</h2>

      <div className="border h-80 overflow-y-auto p-2 mb-2">
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.senderName}:</b> {m.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border flex-1 p-2"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4"
        >
          Send
        </button>
      </div>
    </div>
  );
}
