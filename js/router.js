// js/router.js
// Simpler Hash-Router. Seiten registrieren sich mit { path, mount }


const routes = new Map();


export function defineRoute(path, mount) {
routes.set(path, mount);
}


export function go(path) {
if (location.hash !== `#${path}`) location.hash = `#${path}`;
else render();
}


export function currentPath() {
return location.hash.replace(/^#/, "") || "/";
}


export async function render() {
const path = currentPath();
const mount = routes.get(path) || routes.get("/404");
if (mount) await mount();
}


window.addEventListener("hashchange", render);