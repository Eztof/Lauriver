// Elemente
const regSection   = document.getElementById('register-section');
const loginSection = document.getElementById('login-section');
const dashSection  = document.getElementById('dashboard');

// Umschalten Login/Register
document.getElementById('show-register').addEventListener('click', e => {
  e.preventDefault();
  loginSection.classList.add('hidden');
  regSection.classList.remove('hidden');
});
document.getElementById('show-login').addEventListener('click', e => {
  e.preventDefault();
  regSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
});

// Helper: Persistence
function setPersistence(remember) {
  const mode = remember
    ? firebase.auth.Auth.Persistence.LOCAL
    : firebase.auth.Auth.Persistence.SESSION;
  return auth.setPersistence(mode);
}

// Registrierung
document.getElementById('btn-register').addEventListener('click', () => {
  const u   = document.getElementById('reg-username').value.trim();
  const p   = document.getElementById('reg-password').value;
  const rem = document.getElementById('reg-remember').checked;
  if (!u || !p) return alert('Bitte Benutzername und Passwort eingeben.');

  setPersistence(rem)
    .then(() => auth.createUserWithEmailAndPassword(`${u}@lauriver.local`, p))
    .then(cred => setupUserData(cred.user, u))
    .catch(err => alert(err.message));
});

// Login
document.getElementById('btn-login').addEventListener('click', () => {
  const u   = document.getElementById('login-username').value.trim();
  const p   = document.getElementById('login-password').value;
  const rem = document.getElementById('login-remember').checked;
  if (!u || !p) return alert('Bitte Benutzername und Passwort eingeben.');

  setPersistence(rem)
    .then(() => auth.signInWithEmailAndPassword(`${u}@lauriver.local`, p))
    .catch(err => alert(err.message));
});

// User-Daten in Firestore anlegen oder updaten
function setupUserData(user, username) {
  const docRef = firestore.collection('users').doc(user.uid);
  const now = Date.now();

  docRef.get().then(docSnap => {
    if (!docSnap.exists) {
      // Neu anlegen
      docRef.set({
        username,
        createdAt: now,
        lastLogin: now,
        settings: {},
        usage: {}
      });
    } else {
      // Nur letztes Login updaten
      docRef.update({ lastLogin: now });
    }
  });
}

// Auth-State Listener
auth.onAuthStateChanged(user => {
  if (user) {
    loginSection.classList.add('hidden');
    regSection.classList.add('hidden');
    dashSection.classList.remove('hidden');
    startCounter();
  } else {
    dashSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
  }
});

// Logout
document.getElementById('btn-logout').addEventListener('click', () => {
  auth.signOut();
});
