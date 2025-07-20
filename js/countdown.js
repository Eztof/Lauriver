let intervalId;
function startCounter() {
  const target = new Date('2025-01-25T00:00:00Z');
  const el     = document.getElementById('counter');
  clearInterval(intervalId);
  function update() {
    const now  = new Date();
    let diff   = now - target;
    if (diff < 0) diff = 0;
    const days  = Math.floor(diff / 86400000);
    diff       %= 86400000;
    const hours = Math.floor(diff / 3600000);
    diff       %= 3600000;
    const mins  = Math.floor(diff / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);
    el.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
  }
  update();
  intervalId = setInterval(update, 1000);
}
