// js/pages/login.js
import { html, mount } from "../ui.js";
import { signIn, signUp } from "../auth.js";
import { go } from "../router.js";

export async function LoginPage() {
  // 1) UI bauen
  const content = html`
    <section class="grid">
      <div class="card">
        <h2>Einloggen</h2>
        <div class="col">
          <input id="login-email" class="input" type="email" placeholder="E-Mail" />
          <div style="height:8px"></div>
          <input id="login-pass" class="input" type="password" placeholder="Passwort" />
          <div style="height:12px"></div>
          <button id="btn-login" class="btn accent">Einloggen</button>
        </div>
      </div>

      <div class="card">
        <h2>Registrieren</h2>
        <div class="col">
          <input id="reg-name" class="input" placeholder="Anzeigename (optional)" />
          <div style="height:8px"></div>
          <input id="reg-email" class="input" type="email" placeholder="E-Mail" />
          <div style="height:8px"></div>
          <input id="reg-pass" class="input" type="password" placeholder="Passwort" />
          <div style="height:12px"></div>
          <button id="btn-reg" class="btn">Registrieren</button>
        </div>
        <p class="small">Du bekommst ggf. eine Bestätigungs-Mail von Supabase.</p>
      </div>
    </section>
  `;

  // 2) Mounten (verschiebt die Knoten ins echte DOM)
  const app = document.getElementById("app");
  mount(content, app);

  // 3) Danach DOM-Elemente referenzieren
  const loginEmail = document.getElementById("login-email");
  const loginPass  = document.getElementById("login-pass");
  const btnLogin   = document.getElementById("btn-login");

  const regName  = document.getElementById("reg-name");
  const regEmail = document.getElementById("reg-email");
  const regPass  = document.getElementById("reg-pass");
  const btnReg   = document.getElementById("btn-reg");

  // 4) Events
  btnLogin.addEventListener("click", async () => {
    try {
      const email = loginEmail.value.trim();
      const password = loginPass.value;
      if (!email || !password) return alert("Bitte E-Mail und Passwort eingeben.");
      await signIn({ email, password });
      go("/home");
    } catch (e) {
      alert(e.message || "Login fehlgeschlagen");
    }
  });

  btnReg.addEventListener("click", async () => {
    try {
      const email = regEmail.value.trim();
      const password = regPass.value;
      const displayName = regName.value.trim();
      if (!email || !password) return alert("Bitte E-Mail und Passwort eingeben.");
      await signUp({ email, password, displayName });
      go("/home");
    } catch (e) {
      alert(e.message || "Registrierung fehlgeschlagen");
    }
  });
}
