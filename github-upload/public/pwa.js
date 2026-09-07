// Register the offline shell only on secure deployments or localhost.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.warn("PWA service worker registration failed:", error);
    });
  });
}
