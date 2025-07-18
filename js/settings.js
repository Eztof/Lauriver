// settings.js
import { initNav, initAuthGuard, initLogout, auth } from "./common.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

initNav();
initAuthGuard();
initLogout();

const db = getFirestore();
const toggle = document.getElementById("toggle-dark");
const btnBack = document.getElementById("btn-back");

async function load() {
  const snap = await getDoc(doc(db,"users",auth.currentUser.uid));
  const dark = snap.data()?.settings?.dark || false;
  toggle.checked = dark;
  document.body.classList.toggle("dark",dark);
}
toggle.addEventListener("change", async ()=>{
  const dark = toggle.checked;
  document.body.classList.toggle("dark",dark);
  await setDoc(doc(db,"users",auth.currentUser.uid),{settings:{dark}}, {merge:true});
});
btnBack.addEventListener("click", ()=> location.href="dashboard.html");

load();
