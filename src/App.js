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

  /* ---------- USER ROOMS (SAFE) ---------- */
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "users", user.uid, "rooms");

    return onSnapshot(ref, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const roomSnap = await getDoc(doc(db, "rooms", d.id));
          return roomSnap.exists()
            ? { id: d.id, ...roomSnap.data() }
            : null;
        })
      );

      setRooms(list.filter(Boolean));
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

    try {
      const roomId = crypto.randomUUID().slice(0, 8);

      await setDoc(doc(db, "rooms", roomId), {
        name: roomName,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
      });

      // user room index
      await setDoc(doc(db, "users", user.uid, "rooms", roomId), {
        joinedAt: serverTimestamp(),
      });

      setRoomName("");
    } catch (e) {
      alert("Create failed: " + e.message);
    }
  };

  /* ---------- JOIN ROOM ---------- */
  const joinRoom = async () => {
    if (!joinRoomId.trim()) return;

    try {
      const ref = doc(db, "rooms", joinRoomId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert("Room not found");
        return;
      }

      await updateDoc(ref, {
        members: arrayUnion(user.uid),
      });

      await setDoc(doc(db, "users", user.uid, "rooms", joinRoomId), {
        joinedAt: serverTimestamp(),
      });

      setJoinRoomId("");
    } catch (e) {
      alert("Join failed: " + e.message);
    }
  };

  /* ---------- SEND MESSAGE ---------- */
  const sendMessage = async () => {
    if (!text.trim() || !activeRoom) return;

    try {
      await addDoc(collection(db, "rooms", activeRoom.id, "messages"), {
        text,
        sender: user.uid,
        createdAt: serverTimestamp(),
      });

      setText("");
    } catch (e) {
      alert("Send failed: " + e.message);
    }
  };

  if (!user) return null;

  return (
    <div className="h-screen bg-gray-100 flex flex-col max-w-md mx-auto">

      {/* HEADER */}
      <div className="bg-white p-4 shadow flex items-center">
        {activeRoom ? (
          <>
            <button onClick={() => setActiveRoom(null)} className="mr-3 text-xl">
              ←
            </button>
            <div className="font-semibold">{activeRoom.name}</div>
          </>
        ) : (
          <>
            <div className="text-xl font-bold">FluxChat</div>
            <div className="ml-2 text-xs text-gray-500 truncate">
              UID: {user.uid}
            </div>
          </>
        )}
      </div>

      {/* ROOMS */}
      {!activeRoom && (
        <div className="flex-1 overflow-y-auto p-2">
          {rooms.map((r) => (
            <div
              key={r.id}
              onClick={() => setActiveRoom(r)}
              className="bg-white p-4 mb-2 rounded-xl shadow flex items-center"
            >
              <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">
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
              className={`px-4 py-2 rounded-2xl max-w-[75%] ${
                m.sender === user.uid
                  ? "bg-blue-500 text-white ml-auto"
                  : "bg-white"
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
            className="flex-1 border rounded-full px-4 py-2"
            placeholder="Message"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 rounded-full"
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
