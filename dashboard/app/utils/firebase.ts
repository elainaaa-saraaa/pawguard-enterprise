// dashboard/app/utils/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC5p38JGNesl7EWXDv5e6ONkV8ZjZ1MfNw",
  authDomain: "pawguard-enterprise.firebaseapp.com",
  projectId: "pawguard-enterprise",
  storageBucket: "pawguard-enterprise.firebasestorage.app",
  messagingSenderId: "769092698609",
  appId: "1:769092698609:web:4497043429c06567af8450",
  measurementId: "G-NMY2PGMT95"
};

// Protect the app from breaking during hot-reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };