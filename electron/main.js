const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { PythonShell } = require("python-shell");

const ROOT_DIR = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT_DIR, "backend");
const RENDERER_DIR = path.join(ROOT_DIR, "renderer");
const OUTPUT_DIR = path.join(ROOT_DIR, "outputs");
const CONDA_PY311 = path.join(
  process.env.USERPROFILE || "C:\\Users\\24509",
  "anaconda3",
  "envs",
  "tts-backend-py311",
  "python.exe"
);
const DEFAULT_SETTINGS = {
  pythonPath: "",
  modelDir: path.join(ROOT_DIR, "models", "VoxCPM2-HF"),
  sourceDir: path.join(ROOT_DIR, "models", "VoxCPM", "src"),
  outputDir: OUTPUT_DIR,
  devicePreference: "auto"
};

function getVoiceLibraryDir() {
  return path.join(app.getPath("userData"), "voices");
}

function getVoiceLibraryIndexPath() {
  return path.join(getVoiceLibraryDir(), "voices.json");
}

function safeExt(filePath, fallback = ".wav") {
  const ext = path.extname(filePath || "").toLowerCase();
  return ext || fallback;
}

function sanitizeName(value, fallback = "voice") {
  const base = String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || fallback;
}

function readVoiceLibrary() {
  const indexPath = getVoiceLibraryIndexPath();
  if (!fs.existsSync(indexPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => item && typeof item === "object");
  } catch {
    return [];
  }
}

function writeVoiceLibrary(voices) {
  const libraryDir = getVoiceLibraryDir();
  ensureDir(libraryDir);
  fs.writeFileSync(getVoiceLibraryIndexPath(), JSON.stringify(voices, null, 2), "utf8");
}

function getVoices() {
  return readVoiceLibrary().filter((voice) => fs.existsSync(voice.audioPath || ""));
}

function createVoiceRecord({ name, audioPath, source }) {
  return {
    id: `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: String(name || "").trim(),
    audioPath,
    source,
    createdAt: new Date().toISOString()
  };
}

function importVoiceFromFile({ name, sourcePath }) {
  if (!name || !String(name).trim()) {
    throw new Error("Voice name is required.");
  }
  if (Array.from(String(name).trim()).length > 6) {
    throw new Error("Voice name must be 6 characters or fewer.");
  }
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throw new Error("Source audio file not found.");
  }

  const libraryDir = getVoiceLibraryDir();
  ensureDir(libraryDir);

  const fileName = `${Date.now()}-${sanitizeName(name)}${safeExt(sourcePath, ".wav")}`;
  const targetPath = path.join(libraryDir, fileName);
  fs.copyFileSync(sourcePath, targetPath);

  const voices = getVoices();
  const record = createVoiceRecord({
    name,
    audioPath: targetPath,
    source: "upload"
  });
  voices.push(record);
  writeVoiceLibrary(voices);
  return record;
}

function saveRecordedVoice({ name, audioBytes }) {
  if (!name || !String(name).trim()) {
    throw new Error("Voice name is required.");
  }
  if (Array.from(String(name).trim()).length > 6) {
    throw new Error("Voice name must be 6 characters or fewer.");
  }
  if (!Array.isArray(audioBytes) || audioBytes.length === 0) {
    throw new Error("Recorded audio is empty.");
  }

  const libraryDir = getVoiceLibraryDir();
  ensureDir(libraryDir);

  const fileName = `${Date.now()}-${sanitizeName(name)}.wav`;
  const targetPath = path.join(libraryDir, fileName);
  fs.writeFileSync(targetPath, Buffer.from(audioBytes));

  const voices = getVoices();
  const record = createVoiceRecord({
    name,
    audioPath: targetPath,
    source: "recording"
  });
  voices.push(record);
  writeVoiceLibrary(voices);
  return record;
}

function deleteVoiceById({ id }) {
  if (!id || id === "auto") {
    throw new Error("This voice cannot be deleted.");
  }

  const voices = getVoices();
  const record = voices.find((voice) => voice.id === id);
  if (!record) {
    throw new Error("Voice not found.");
  }

  const next = voices.filter((voice) => voice.id !== id);
  writeVoiceLibrary(next);

  if (record.audioPath && fs.existsSync(record.audioPath)) {
    fs.rmSync(record.audioPath, { force: true });
  }

  return { ok: true, id };
}

function saveAudioAs({ sourcePath }) {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throw new Error("Generated audio file not found.");
  }

  const defaultFileName = path.basename(sourcePath);
  return dialog
    .showSaveDialog({
      title: "另存为",
      defaultPath: defaultFileName,
      filters: [
        {
          name: "Audio",
          extensions: [path.extname(defaultFileName).replace(/^\./, "") || "wav"]
        }
      ]
    })
    .then((result) => {
      if (result.canceled || !result.filePath) {
        return { saved: false, filePath: "" };
      }

      fs.copyFileSync(sourcePath, result.filePath);
      return { saved: true, filePath: result.filePath };
    });
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getSettingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function readSettings() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    const next = { ...DEFAULT_SETTINGS, ...parsed };
    if (
      typeof next.modelDir === "string" &&
      next.modelDir.includes("OmniVoice-HF")
    ) {
      next.modelDir = DEFAULT_SETTINGS.modelDir;
    }
    if (
      typeof next.sourceDir === "string" &&
      next.sourceDir.includes("OmniVoice")
    ) {
      next.sourceDir = DEFAULT_SETTINGS.sourceDir;
    }
    return next;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(nextSettings) {
  const settingsPath = getSettingsPath();
  ensureDir(path.dirname(settingsPath));
  fs.writeFileSync(settingsPath, JSON.stringify(nextSettings, null, 2), "utf8");
}

function resolvePythonPath(storedPath) {
  if (storedPath && fs.existsSync(storedPath)) {
    return storedPath;
  }

  const venvPython = path.join(ROOT_DIR, ".venv", "Scripts", "python.exe");
  if (fs.existsSync(venvPython)) {
    return venvPython;
  }

  if (fs.existsSync(CONDA_PY311)) {
    return CONDA_PY311;
  }

  return "python";
}

class OmniVoiceService {
  constructor() {
    this.shell = null;
    this.pending = new Map();
    this.nextId = 1;
    this.window = null;
    this.settings = readSettings();
  }

  bindWindow(window) {
    this.window = window;
  }

  async startWorker() {
    if (this.shell) {
      return;
    }

    ensureDir(this.settings.outputDir || OUTPUT_DIR);

    const pythonPath = resolvePythonPath(this.settings.pythonPath);
    this.shell = new PythonShell(path.join(BACKEND_DIR, "worker.py"), {
      mode: "text",
      formatter: "json",
      parser: "text",
      pythonPath,
      pythonOptions: ["-u"],
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8"
      },
      stderrParser: (line) => line
    });

    this.shell.on("message", (message) => this.handleMessage(message));
    this.shell.on("stderr", (line) => this.pushEvent("stderr", { line }));
    this.shell.on("error", (error) => {
      this.pushEvent("error", { message: error.message });
      this.rejectAllPending(error);
      this.shell = null;
    });
    this.shell.on("close", () => {
      this.pushEvent("status", { state: "stopped" });
      this.rejectAllPending(new Error("Python worker closed."));
      this.shell = null;
    });
  }

  rejectAllPending(error) {
    for (const entry of this.pending.values()) {
      entry.reject(error);
    }
    this.pending.clear();
  }

  handleMessage(message) {
    if (typeof message !== "string") {
      return;
    }

    const raw = message.trim();
    if (!raw) {
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.pushEvent("log", {
        level: "info",
        message: `[python] ${raw}`
      });
      return;
    }

    if (!parsed || typeof parsed !== "object") {
      return;
    }

    if (parsed.type === "event") {
      this.pushEvent(parsed.name, parsed.payload || {});
      return;
    }

    if (parsed.type !== "response") {
      return;
    }

    const request = this.pending.get(parsed.id);
    if (!request) {
      return;
    }

    this.pending.delete(parsed.id);
    if (parsed.ok) {
      request.resolve(parsed.data);
    } else {
      request.reject(new Error(parsed.error || "Unknown Python worker error."));
    }
  }

  pushEvent(name, payload) {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }
    this.window.webContents.send("backend:event", {
      name,
      payload,
      at: new Date().toISOString()
    });
  }

  async request(command, payload = {}) {
    await this.startWorker();
    const id = `req_${this.nextId++}`;
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.shell.send({ id, command, payload });
    return promise;
  }

  async doctor() {
    return this.request("doctor", this.settings);
  }

  async initialize() {
    return this.request("init", this.settings);
  }

  async generate(payload) {
    return this.request("generate", {
      ...payload,
      runtimeSettings: this.settings
    });
  }

  async getCapabilities() {
    return this.request("capabilities", {});
  }

  async stop() {
    if (!this.shell) {
      return;
    }
    try {
      await this.request("shutdown", {});
    } catch {
      // Ignore shutdown races.
    }
    this.shell = null;
  }

  getSettings() {
    return {
      ...this.settings,
      pythonPath: resolvePythonPath(this.settings.pythonPath)
    };
  }

  updateSettings(patch) {
    this.settings = { ...this.settings, ...patch };
    saveSettings(this.settings);
    return this.getSettings();
  }
}

const service = new OmniVoiceService();

function createWindow() {
  const window = new BrowserWindow({
    width: 1540,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#0b0f17",
    title: "VoxCPM Studio",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  service.bindWindow(window);
  window.loadFile(path.join(RENDERER_DIR, "index.html"));
}

app.whenReady().then(() => {
  ensureDir(OUTPUT_DIR);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", async () => {
  await service.stop();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("studio:get-settings", async () => service.getSettings());
ipcMain.handle("studio:update-settings", async (_event, patch) =>
  service.updateSettings(patch || {})
);
ipcMain.handle("studio:doctor", async () => service.doctor());
ipcMain.handle("studio:initialize", async () => service.initialize());
ipcMain.handle("studio:capabilities", async () => service.getCapabilities());
ipcMain.handle("studio:generate", async (_event, payload) =>
  service.generate(payload || {})
);
ipcMain.handle("studio:pick-ref-audio", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Audio",
        extensions: ["wav", "flac"]
      }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return "";
  }
  return result.filePaths[0];
});
ipcMain.handle("studio:pick-output-dir", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return "";
  }
  return result.filePaths[0];
});
ipcMain.handle("studio:open-path", async (_event, targetPath) => {
  if (!targetPath) {
    return false;
  }
  await shell.openPath(targetPath);
  return true;
});
ipcMain.handle("studio:show-item-in-folder", async (_event, targetPath) => {
  if (!targetPath) {
    return false;
  }
  shell.showItemInFolder(targetPath);
  return true;
});
ipcMain.handle("studio:get-voices", async () => getVoices());
ipcMain.handle("studio:import-voice", async (_event, payload) =>
  importVoiceFromFile(payload || {})
);
ipcMain.handle("studio:save-recorded-voice", async (_event, payload) =>
  saveRecordedVoice(payload || {})
);
ipcMain.handle("studio:delete-voice", async (_event, payload) =>
  deleteVoiceById(payload || {})
);
ipcMain.handle("studio:save-audio-as", async (_event, payload) =>
  saveAudioAs(payload || {})
);
