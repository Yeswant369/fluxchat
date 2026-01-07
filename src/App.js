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
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");

  /* ---------- AUTH ---------- */
  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      if (u) setUser(u);
    });
  }, []);

  /* ---------- ROOMS LIST ---------- */
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "rooms"), (snap) => {
      setRooms(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((r) => r.members?.includes(user.uid))
      );
    });
  }, [user]);

  /* ---------- MESSAGES ---------- */
  useEffect(() => {
    if (!activeRoom) return;
    const q = query(
      collection(db, "rooms", activeRoom.id, "messages"),
      orderBy("createdAt")
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => d.data()));
    });
  }, [activeRoom]);

  /* ---------- CREATE ROOM ---------- */
  const createRoom = async () => {
    if (!roomName.trim()) return;

    const roomId = crypto.randomUUID().slice(0, 8);

    await setDoc(doc(db, "rooms", roomId), {
      name: roomName,
      ownerId: user.uid,            // 🔴 REQUIRED
      members: [user.uid],           // 🔴 REQUIRED
      createdAt: serverTimestamp(),
    });

    setRoomName("");
  };

  /* ---------- JOIN ROOM ---------- */
  const joinRoom = async () => {
    if (!joinRoomId.trim()) return;

    const ref = doc(db, "rooms", joinRoomId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Room not found");
      return;
    }

    const data = snap.data();

    if (!data.members.includes(user.uid)) {
      await updateDoc(ref, {
        members: arrayUnion(user.uid), // 🔴 CRITICAL FIX
      });
    }

    setJoinRoomId("");
  };

  /* ---------- SEND MESSAGE ---------- */
  const sendMessage = async () => {
    if (!text.trim() || !activeRoom) return;

    await addDoc(collection(db, "rooms", activeRoom.id, "messages"), {
      text,
      sender: user.uid,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  if (!user) return null;

  return (
    <div className="h-screen bg-gray-100 flex flex-col max-w-md mx-auto">

      {/* HEADER */}
      <div className="bg-white p-4 shadow flex items-center justify-between">
        {activeRoom ? (
          <>
            <button
              onClick={() => setActiveRoom(null)}
              className="text-blue-600 text-xl"
            >
              ←
            </button>
            <div className="font-semibold">{activeRoom.name}</div>
            <div />
          </>
        ) : (
          <>
            <div className="text-xl font-bold">FluxChat</div>
            <div className="text-xs text-gray-500 truncate ml-2">
              UID: {user.uid}
            </div>
          </>
        )}
      </div>

      {/* CHAT LIST */}
      {!activeRoom && (
        <div className="flex-1 overflow-y-auto p-2">
          {rooms.map((r) => (
            <div
              key={r.id}
              onClick={() => setActiveRoom(r)}
              className="bg-white rounded-xl p-4 mb-2 flex items-center shadow"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                {r.name[0]}
              </div>
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-gray-500">Tap to open</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MESSAGES */}
      {activeRoom && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                m.sender === user.uid
                  ? "bg-blue-500 text-white ml-auto"
                  : "bg-white text-black"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
      )}

      {/* INPUT */}
      {activeRoom && (
        <div className="bg-white p-2 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message"
            className="flex-1 border rounded-full px-4 py-2"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-full"
          >
            Send
          </button>
        </div>
      )}

      {/* CREATE / JOIN */}
      {!activeRoom && (
        <div className="p-3 bg-white border-t space-y-2">
          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="New room name"
            className="w-full border rounded-lg px-3 py-2"
          />
          <button
            onClick={createRoom}
            className="w-full bg-blue-500 text-white py-2 rounded-lg"
          >
            ➕ Create Room
          </button>

          <div className="flex gap-2">
            <input
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Join with Room ID"
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <button
              onClick={joinRoom}
              className="bg-green-500 text-white px-4 rounded-lg"
            >
              Join
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
