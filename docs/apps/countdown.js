// countdown.js
export function getDaysSince() {
  const start = new Date('2025-01-25T00:00:00+01:00').getTime();
  const diff  = Date.now() - start;
  return diff > 0 ? Math.floor(diff / 86400000) : 0;
}

export function render(container) {
  container.innerHTML = `
    <button onclick="history.back()">← Zurück</button>
    <h2>Countdown seit 25.01.2025</h2>
    <div style="font-size:2rem; margin:1rem 0;">
      <span id="cd-days">0</span>:
      <span id="cd-hours">00</span>:
      <span id="cd-minutes">00</span>:
      <span id="cd-seconds">00</span>
    </div>`;
  const start = new Date('2025-01-25T00:00:00+01:00').getTime();
  function update() {
    let d = Date.now() - start;
    if (d < 0) d = 0;
    const days = Math.floor(d / 86400000);
    const hrs  = String(Math.floor((d % 86400000) / 3600000)).padStart(2,'0');
    const mins = String(Math.floor((d % 3600000) / 60000)).padStart(2,'0');
    const secs = String(Math.floor((d % 60000) / 1000)).padStart(2,'0');
    container.querySelector('#cd-days').textContent    = days;
    container.querySelector('#cd-hours').textContent   = hrs;
    container.querySelector('#cd-minutes').textContent = mins;
    container.querySelector('#cd-seconds').textContent = secs;
  }
  update();
  setInterval(update, 1000);
}
