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
} from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);

  const [newRoomName, setNewRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) setUser(u);
    });
    return unsub;
  }, []);

  /* ================= LOAD MY ROOMS ================= */
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "rooms"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => r.members?.includes(user.uid));
      setRooms(list);
    });
  }, [user]);

  /* ================= LOAD MESSAGES ================= */
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

  /* ================= CREATE ROOM ================= */
  const createRoom = async () => {
    if (!newRoomName || !user) return;

    const roomRef = doc(collection(db, "rooms"));
    await setDoc(roomRef, {
      name: newRoomName,
      owner: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
    });

    setNewRoomName("");
  };

  /* ================= JOIN ROOM ================= */
  const joinRoom = async () => {
    if (!joinRoomId || !user) return;

    const roomRef = doc(db, "rooms", joinRoomId);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
      alert("Room not found");
      return;
    }

    const data = snap.data();
    if (!data.members.includes(user.uid)) {
      await setDoc(
        roomRef,
        { members: [...data.members, user.uid] },
        { merge: true }
      );
    }

    setJoinRoomId("");
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text || !activeRoom) return;

    await addDoc(collection(db, "rooms", activeRoom.id, "messages"), {
      text,
      sender: user.uid,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  /* ================= UI ================= */
  if (!user) return <p>Loading...</p>;

  return (
    <div className="flex h-screen font-sans">
      {/* ===== LEFT : ROOMS LIST ===== */}
      <div className="w-1/3 border-r p-3">
        <h2 className="text-xl font-bold mb-2">FluxChat</h2>

        <p className="text-xs mb-2 break-all">
          <b>Your UID:</b> {user.uid}
        </p>

        <input
          placeholder="New room name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          className="border w-full mb-2 p-1"
        />
        <button onClick={createRoom} className="w-full mb-3 bg-black text-white">
          + Create Room
        </button>

        <input
          placeholder="Join with Room ID"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
          className="border w-full mb-2 p-1"
        />
        <button onClick={joinRoom} className="w-full mb-3 border">
          Join
        </button>

        {rooms.map((r) => (
          <div
            key={r.id}
            onClick={() => setActiveRoom(r)}
            className={`p-2 cursor-pointer ${
              activeRoom?.id === r.id ? "bg-gray-200" : ""
            }`}
          >
            <b>{r.name}</b>
            <p className="text-xs">Tap to open</p>
          </div>
        ))}
      </div>

      {/* ===== RIGHT : CHAT ===== */}
      <div className="flex-1 flex flex-col">
        {!activeRoom ? (
          <p className="m-auto text-gray-400">Select a room</p>
        ) : (
          <>
            <div className="border-b p-2 font-bold">
              {activeRoom.name}
              <p className="text-xs break-all">Room ID: {activeRoom.id}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {messages.map((m, i) => (
                <p key={i}>
                  <b>{m.sender === user.uid ? "You" : "Friend"}:</b> {m.text}
                </p>
              ))}
            </div>

            <div className="flex border-t p-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type message"
                className="flex-1 border p-1"
              />
              <button onClick={sendMessage} className="ml-2 border px-3">
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
