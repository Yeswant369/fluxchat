import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import {
  MessageCircle,
  Send,
  Hash,
  User,
  LogOut,
  Users,
  ArrowLeft,
  Plus,
  X
} from 'lucide-react';

/* =========================
   🔥 FIREBASE CONFIG
   =========================
   Replace these values with
   YOUR Firebase project config
*/
const firebaseConfig = {
  apiKey: "AIzaSyCY2qB4sbPs_7BIz355cQiQkDDqK-S_z4I",
  authDomain: "flux-chat-b9cb2.firebaseapp.com",
  projectId: "flux-chat-b9cb2",
  storageBucket: "flux-chat-b9cb2.firebasestorage.app",
  messagingSenderId: "887456585588",
  appId: "1:887456585588:web:7a0689fb9feacc9dcebe21",
  measurementId: "G-F2YD85CE35"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Fixed app ID for Firestore paths
const appId = "fluxchat";

export default function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [showProfileSetup, setShowProfileSetup] = useState(true);

  const [rooms, setRooms] = useState(['General']);
  const [currentRoom, setCurrentRoom] = useState('General');

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  /* =========================
     AUTH (Anonymous)
     ========================= */
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);

    return onAuthStateChanged(auth, (u) => {
      if (!u) return;
      setUser(u);

      const stored = localStorage.getItem(`fluxchat_name_${u.uid}`);
      if (stored) {
        setUsername(stored);
        setShowProfileSetup(false);
      }
    });
  }, []);

  /* =========================
     ROOMS LIST
     ========================= */
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, 'artifacts', appId, 'public', 'data', 'rooms_list');
    return onSnapshot(ref, (snap) => {
      const r = ['General'];
      snap.forEach(d => d.data().name && r.push(d.data().name));
      setRooms([...new Set(r)]);
    });
  }, [user]);

  /* =========================
     MESSAGES
     ========================= */
  useEffect(() => {
    if (!user) return;

    const ref = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      `messages_${currentRoom}`
    );

    const q = query(ref, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
  }, [user, currentRoom]);

  /* =========================
     ACTIONS
     ========================= */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await addDoc(
      collection(db, 'artifacts', appId, 'public', 'data', `messages_${currentRoom}`),
      {
        text: newMessage,
        senderId: user.uid,
        senderName: username,
        createdAt: serverTimestamp()
      }
    );
    setNewMessage('');
  };

  const saveName = (e) => {
    e.preventDefault();
    localStorage.setItem(`fluxchat_name_${user.uid}`, username);
    setShowProfileSetup(false);
  };

  const createRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    await addDoc(
      collection(db, 'artifacts', appId, 'public', 'data', 'rooms_list'),
      { name: newRoomName.trim(), createdAt: serverTimestamp() }
    );

    setCurrentRoom(newRoomName.trim());
    setNewRoomName('');
    setShowRoomModal(false);
  };

  /* =========================
     UI
     ========================= */
  if (showProfileSetup) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <form onSubmit={saveName} className="bg-white p-8 rounded-xl w-80">
          <h2 className="font-bold text-xl mb-4">Enter your name</h2>
          <input
            required
            className="border w-full p-2 mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button className="w-full bg-indigo-600 text-white py-2 rounded">
            Start Chat
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className={`bg-white border-r ${isSidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="p-4 font-bold text-indigo-600 flex justify-between">
          FluxChat
          <button onClick={() => setShowRoomModal(true)}>
            <Plus size={16} />
          </button>
        </div>

        {rooms.map(r => (
          <button
            key={r}
            className={`block w-full text-left px-4 py-2 ${
              r === currentRoom ? 'bg-indigo-100' : ''
            }`}
            onClick={() => setCurrentRoom(r)}
          >
            #{r}
          </button>
        ))}
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b flex items-center gap-2">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <ArrowLeft size={18} />
          </button>
          <Hash size={16} />
          <b>{currentRoom}</b>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(m => (
            <div key={m.id} className="mb-2">
              <b>{m.senderName}</b>: {m.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
          <input
            className="flex-1 border p-2"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
          />
          <button className="bg-indigo-600 text-white px-4 rounded">
            <Send size={16} />
          </button>
        </form>
      </main>

      {/* Create Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <form onSubmit={createRoom} className="bg-white p-6 rounded w-72">
            <div className="flex justify-between mb-2">
              <b>Create Room</b>
              <X onClick={() => setShowRoomModal(false)} />
            </div>
            <input
              className="border w-full p-2 mb-3"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
            />
            <button className="w-full bg-indigo-600 text-white py-2 rounded">
              Create
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
