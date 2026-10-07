import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAckk6pMvqKmMHVWUdxYkMMJWNu8woQXqo",
  authDomain: "ujtaskhub-cf6b0.firebaseapp.com",
  projectId: "ujtaskhub-cf6b0",
  storageBucket: "ujtaskhub-cf6b0.firebasestorage.app",
  messagingSenderId: "128259148816",
  appId: "1:128259148816:web:c8845cdb6785c78936ce95"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };