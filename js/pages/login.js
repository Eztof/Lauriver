// js/pages/login.js
import { html, mount } from "../ui.js";
import { signIn, signUp } from "../auth.js";
import { go } from "../router.js";


export async function LoginPage() {
const node = html`
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


node.getElementById("btn-login").addEventListener("click", async () => {
const email = node.getElementById("login-email").value.trim();
const password = node.getElementById("login-pass").value;
try {
await signIn({ email, password });
go("/home");
} catch (e) { alert(e.message); }
});


node.getElementById("btn-reg").addEventListener("click", async () => {
const email = node.getElementById("reg-email").value.trim();
const password = node.getElementById("reg-pass").value;
const displayName = node.getElementById("reg-name").value.trim();
try {
await signUp({ email, password, displayName });
go("/home");
} catch (e) { alert(e.message); }
});


mount(node, document.getElementById("app"));
}