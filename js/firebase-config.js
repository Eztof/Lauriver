// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyA0WC5gDtcq4znUZxqvGn5j1BPodnsgg9E",
  authDomain: "lauriver-31a6f.firebaseapp.com",
  projectId: "lauriver-31a6f",
  storageBucket: "lauriver-31a6f.firebasestorage.app",
  messagingSenderId: "508140835438",
  appId: "1:508140835438:web:4326ed6b40c01037e64c7f",
  databaseURL: "https://lauriver-31a6f-default-rtdb.firebaseio.com/"
};

// Initialisieren
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
