const { contextBridge, ipcRenderer } = require("electron");
const { pathToFileURL } = require("url");

function toFileUrl(targetPath) {
  if (!targetPath) {
    return "";
  }

  if (typeof pathToFileURL === "function") {
    return pathToFileURL(targetPath).href;
  }

  const normalized = String(targetPath).replace(/\\/g, "/");
  const prefixed = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return encodeURI(`file://${prefixed}`);
}

contextBridge.exposeInMainWorld("studioApi", {
  getSettings: () => ipcRenderer.invoke("studio:get-settings"),
  updateSettings: (patch) => ipcRenderer.invoke("studio:update-settings", patch),
  getRuntimeStatus: () => ipcRenderer.invoke("studio:get-runtime-status"),
  detectRuntimeRecommendation: () => ipcRenderer.invoke("studio:detect-runtime-recommendation"),
  installBackendRuntime: (payload) => ipcRenderer.invoke("studio:install-backend-runtime", payload),
  getModelStatus: () => ipcRenderer.invoke("studio:get-model-status"),
  ensureModelAssets: (payload) => ipcRenderer.invoke("studio:ensure-model-assets", payload),
  doctor: () => ipcRenderer.invoke("studio:doctor"),
  initialize: () => ipcRenderer.invoke("studio:initialize"),
  capabilities: () => ipcRenderer.invoke("studio:capabilities"),
  generate: (payload) => ipcRenderer.invoke("studio:generate", payload),
  pickReferenceAudio: () => ipcRenderer.invoke("studio:pick-ref-audio"),
  pickOutputDir: () => ipcRenderer.invoke("studio:pick-output-dir"),
  getVoices: () => ipcRenderer.invoke("studio:get-voices"),
  importVoice: (payload) => ipcRenderer.invoke("studio:import-voice", payload),
  saveRecordedVoice: (payload) => ipcRenderer.invoke("studio:save-recorded-voice", payload),
  deleteVoice: (payload) => ipcRenderer.invoke("studio:delete-voice", payload),
  saveAudioAs: (payload) => ipcRenderer.invoke("studio:save-audio-as", payload),
  openPath: (targetPath) => ipcRenderer.invoke("studio:open-path", targetPath),
  showItemInFolder: (targetPath) => ipcRenderer.invoke("studio:show-item-in-folder", targetPath),
  toFileUrl,
  onBackendEvent: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on("backend:event", wrapped);
    return () => ipcRenderer.removeListener("backend:event", wrapped);
  }
});
