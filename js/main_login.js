// /js/main_login.js
import { $, show, hide, setError } from "./ui.js";
import { signUp, signIn } from "./auth.js";
import { pickClient } from "./supabaseClient.js";

const tabLogin = $("#tab-login");
const tabRegister = $("#tab-register");
const formLogin = $("#form-login");
const formRegister = $("#form-register");

tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  show(formLogin);
  hide(formRegister);
});

tabRegister.addEventListener("click", () => {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  show(formRegister);
  hide(formLogin);
});

// Wenn schon eingeloggt → direkt in die App
(async () => {
  const { client } = await pickClient();
  if (client) window.location.href = "./app.html";
})();

// LOGIN
formLogin.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  setError(document.getElementById("login-error"), "");
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const remember = document.getElementById("login-remember").checked;
  try {
    await signIn({ username, password, remember });
    window.location.href = "./app.html";
  } catch (e) {
    setError(document.getElementById("login-error"), e.message || String(e));
  }
});

// REGISTER
formRegister.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  setError(document.getElementById("register-error"), "");
  const username = document.getElementById("reg-username").value.trim();
  const pw1 = document.getElementById("reg-password").value;
  const pw2 = document.getElementById("reg-password-2").value;
  const remember = document.getElementById("reg-remember").checked;
  if (pw1 !== pw2) {
    setError(document.getElementById("register-error"), "Passwörter stimmen nicht überein.");
    return;
  }
  try {
    await signUp({ username, password: pw1, remember });
    window.location.href = "./app.html";
  } catch (e) {
    // Häufige Fälle: Nutzername bereits vergeben → unique violation
    setError(document.getElementById("register-error"), e.message || String(e));
  }
});
