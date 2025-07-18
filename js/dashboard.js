// dashboard.js
import { initNav, initAuthGuard, initLogout, auth } from "./common.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

initNav();
initAuthGuard();
initLogout();

const counterEl = document.getElementById("counter");

function startCounter() {
  const start = new Date("2025-01-25T18:00:00");
  function tick(){
    const diff = Date.now() - start.getTime();
    const days = Math.floor(diff/86400000);
    const hms  = new Date(diff%86400000).toISOString().substr(11,8);
    counterEl.textContent = `${days} Tage ${hms}`;
  }
  tick();
  setInterval(tick,1000);
}

onAuthStateChanged(auth,user=>{
  if (user) startCounter();
});
