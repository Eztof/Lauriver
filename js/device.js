// js/device.js
export function getDeviceId() {
  let id = localStorage.getItem("lauriver_device_id");
  if (!id) {
    if (crypto && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    localStorage.setItem("lauriver_device_id", id);
  }
  return id;
}
