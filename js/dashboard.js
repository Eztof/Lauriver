import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
// Füge hier deine Firebase‑Config ein
const firebaseConfig = { /* ... */ };
initializeApp(firebaseConfig);

const auth = getAuth();
const btnLogout = document.getElementById("btn-logout");
btnLogout.onclick = ()=> signOut(auth);

onAuthStateChanged(auth, user=>{
  if (!user) location.href = "login.html";
});

let interval;
function startCounter() {
  const start = new Date("2025-01-25T18:00:00");
  function tick(){
    const diff = Date.now() - start.getTime();
    const days = Math.floor(diff/86400000);
    const hms  = new Date(diff%86400000).toISOString().substr(11,8);
    document.getElementById("counter").textContent = `${days} Tage ${hms}`;
  }
  tick();
  interval = setInterval(tick,1000);
}
startCounter();
