import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export const auth = getAuth(app);
export const db = getFirestore(app);

// Auto anonymous login
signInAnonymously(auth);
