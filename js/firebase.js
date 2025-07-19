import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "lauriver-31a6f.firebaseapp.com",
  projectId: "lauriver-31a6f",
  storageBucket: "lauriver-31a6f.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Auth-State & Redirect-Logik
onAuthStateChanged(auth, user => {
  const path = location.pathname.split("/").pop();
  const publicPages = ["login.html", "signup.html"];
  if (!user && !publicPages.includes(path)) {
    console.log("[Firebase] User not logged in → redirect to login");
    location.replace("login.html");
  }
  if (user && path === "signup.html") {
    console.log("[Firebase] Already logged in → redirect to home");
    location.replace("index.html");
  }
});
