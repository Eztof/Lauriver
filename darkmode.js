// Lädt Dark Mode je nach Benutzereinstellung
(function(){
  const firebase = window.firebase;
  firebase.auth().onAuthStateChanged(user => {
    if (!user) return;
    firebase.firestore()
      .collection('users')
      .doc(user.uid)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().settings?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      });
  });
})();
