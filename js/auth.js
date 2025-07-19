import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const rememberCheckbox = document.getElementById('remember');

// Login
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = loginForm.email.value;
    const pw = loginForm.password.value;
    const persistence = rememberCheckbox.checked
      ? 'local'   // bleibt angemeldet
      : 'session';// bis Tab geschlossen
    await auth.setPersistence(
      persistence === 'local'
        ? firebase.auth.Auth.Persistence.LOCAL
        : firebase.auth.Auth.Persistence.SESSION
    );
    await signInWithEmailAndPassword(auth, email, pw);
    location.replace('index.html');
  });
}

// Registrierung
if (signupForm) {
  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    await createUserWithEmailAndPassword(
      auth,
      signupForm.email.value,
      signupForm.password.value
    );
    alert('Registrierung erfolgreich! Bitte einloggen.');
    location.reload();
  });
}

// Logout auf allen Seiten
const logoutBtn = document.getElementById('logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    location.replace('login.html');
  });
}
