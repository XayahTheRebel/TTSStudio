const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { PythonShell } = require("python-shell");

const ROOT_DIR = path.resolve(__dirname, "..");
const RENDERER_DIR = path.join(ROOT_DIR, "renderer");
const MODEL_REPO_ID = "openbmb/VoxCPM2";
const CONDA_PY311 = path.join(
  process.env.USERPROFILE || "C:\\Users\\24509",
  "anaconda3",
  "envs",
  "tts-backend-py311",
  "python.exe"
);

function isPackagedApp() {
  return app.isPackaged;
}

function getBackendDir() {
  return isPackagedApp()
    ? path.join(process.resourcesPath, "app-assets", "backend")
    : path.join(ROOT_DIR, "backend");
}

function getBundledSourceDir() {
  return isPackagedApp()
    ? path.join(process.resourcesPath, "app-assets", "voxcpm-src")
    : path.join(ROOT_DIR, "models", "VoxCPM", "src");
}

function getRuntimeRootDir() {
  return path.join(app.getPath("userData"), "backend-runtime");
}

function getBundledPythonPath() {
  if (!isPackagedApp()) {
    return "";
  }
  return path.join(getRuntimeRootDir(), "python", "python.exe");
}

function getDefaultModelDir() {
  return isPackagedApp()
    ? path.join(app.getPath("userData"), "models", "VoxCPM2-HF")
    : path.join(ROOT_DIR, "models", "VoxCPM2-HF");
}

function getDefaultOutputDir() {
  return isPackagedApp() ? path.join(app.getPath("userData"), "outputs") : path.join(ROOT_DIR, "outputs");
}

function getDefaultSettings() {
  return {
    pythonPath: "",
    modelDir: getDefaultModelDir(),
    sourceDir: getBundledSourceDir(),
    outputDir: getDefaultOutputDir(),
    devicePreference: "auto"
  };
}

function getVoiceLibraryDir() {
  return path.join(app.getPath("userData"), "voices");
}

function getPreviewOutputDir() {
  return path.join(app.getPath("userData"), "preview-output");
}

function getVoiceLibraryIndexPath() {
  return path.join(getVoiceLibraryDir(), "voices.json");
}

function getSettingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function getRuntimeMetaPath() {
  return path.join(getRuntimeRootDir(), "runtime.json");
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

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function isRuntimeReady() {
  return fs.existsSync(getBundledPythonPath()) && fs.existsSync(getRuntimeMetaPath());
}

function readRuntimeMeta() {
  if (!fs.existsSync(getRuntimeMetaPath())) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(getRuntimeMetaPath(), "utf8"));
  } catch {
    return null;
  }
}

function isModelDirectoryReady(modelDir) {
  if (!modelDir || !fs.existsSync(modelDir) || !fs.statSync(modelDir).isDirectory()) {
    return false;
  }

  const requiredFiles = ["config.json", "model.safetensors"];
  return requiredFiles.every((fileName) => fs.existsSync(path.join(modelDir, fileName)));
}

function migrateSettings(rawSettings) {
  const defaults = getDefaultSettings();
  const next = { ...defaults, ...(rawSettings || {}) };
  let changed = false;

  const legacyModelDir =
    typeof next.modelDir === "string" &&
    (next.modelDir.includes("VoxCPM1.5") ||
      next.modelDir.includes("VoxCPM-0.5B") ||
      next.modelDir.includes("OmniVoice-HF"));
  if (legacyModelDir) {
    next.modelDir = defaults.modelDir;
    changed = true;
  }

  const legacySourceDir = typeof next.sourceDir === "string" && next.sourceDir.includes("OmniVoice");
  if (legacySourceDir || !fs.existsSync(next.sourceDir)) {
    next.sourceDir = defaults.sourceDir;
    changed = true;
  }

  if (isPackagedApp()) {
    if (!next.modelDir || next.modelDir.startsWith(ROOT_DIR)) {
      next.modelDir = defaults.modelDir;
      changed = true;
    }
    if (!next.outputDir || next.outputDir.startsWith(ROOT_DIR)) {
      next.outputDir = defaults.outputDir;
      changed = true;
    }
  }

  if ("modelPreset" in next) {
    delete next.modelPreset;
    changed = true;
  }

  return { settings: next, changed };
}

function readSettings() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    return getDefaultSettings();
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    return migrateSettings(parsed).settings;
  } catch {
    return getDefaultSettings();
  }
}

function saveSettings(nextSettings) {
  const settingsPath = getSettingsPath();
  ensureDir(path.dirname(settingsPath));
  fs.writeFileSync(settingsPath, JSON.stringify(nextSettings, null, 2), "utf8");
}

function resolvePythonPath(storedPath) {
  const bundledPython = getBundledPythonPath();
  if (bundledPython && fs.existsSync(bundledPython)) {
    return bundledPython;
  }

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
  ensureDir(getVoiceLibraryDir());
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

function clearPreviewOutputs() {
  const previewDir = getPreviewOutputDir();
  if (!fs.existsSync(previewDir)) {
    return;
  }

  for (const entry of fs.readdirSync(previewDir)) {
    const entryPath = path.join(previewDir, entry);
    fs.rmSync(entryPath, { recursive: true, force: true });
  }
}

function runPowerShell(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
      {
        windowsHide: true,
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8"
        }
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `PowerShell command failed with exit code ${code}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function detectRuntimeRecommendation() {
  try {
    const output = await runPowerShell(
      "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"
    );
    const names = output
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    const hasNvidia = names.some((name) => /nvidia|geforce|rtx|quadro/i.test(name));
    return {
      recommendedTarget: hasNvidia ? "cuda" : "cpu",
      gpuNames: names,
      reason: hasNvidia
        ? "检测到 NVIDIA 显卡，推荐安装 CUDA 加速版。"
        : "未检测到可用的 NVIDIA CUDA 显卡，推荐安装 CPU 兼容版。"
    };
  } catch (error) {
    return {
      recommendedTarget: "cpu",
      gpuNames: [],
      reason: `未能自动检测显卡环境，推荐先安装 CPU 兼容版。${error.message ? ` (${error.message})` : ""}`
    };
  }
}

class OmniVoiceService {
  constructor() {
    this.shell = null;
    this.pending = new Map();
    this.nextId = 1;
    this.window = null;
    const migrated = migrateSettings(readSettings());
    this.settings = migrated.settings;
    if (migrated.changed || !fs.existsSync(getSettingsPath())) {
      saveSettings(this.settings);
    }
    this.modelDownloadProcess = null;
    this.modelDownloadPromise = null;
    this.runtimeInstallProcess = null;
    this.runtimeInstallPromise = null;
  }

  bindWindow(window) {
    this.window = window;
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

  async startWorker() {
    if (this.shell) {
      return;
    }

    ensureDir(this.settings.outputDir || getDefaultOutputDir());

    const pythonPath = resolvePythonPath(this.settings.pythonPath);
    const workerPath = path.join(getBackendDir(), "worker.py");
    this.shell = new PythonShell(workerPath, {
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

  async request(command, payload = {}) {
    await this.startWorker();
    const id = `req_${this.nextId++}`;
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.shell.send({ id, command, payload });
    return promise;
  }

  getSettings() {
    return {
      ...this.settings,
      pythonPath: resolvePythonPath(this.settings.pythonPath)
    };
  }

  updateSettings(patch) {
    const next = migrateSettings({ ...this.settings, ...(patch || {}) }).settings;
    this.settings = next;
    ensureDir(this.settings.outputDir || getDefaultOutputDir());
    saveSettings(this.settings);
    return this.getSettings();
  }

  getModelStatus() {
    return {
      repoId: MODEL_REPO_ID,
      modelDir: this.settings.modelDir,
      sourceDir: this.settings.sourceDir,
      exists: isModelDirectoryReady(this.settings.modelDir),
      downloading: Boolean(this.modelDownloadPromise)
    };
  }

  getRuntimeStatus() {
    const meta = readRuntimeMeta();
    return {
      runtimeDir: getRuntimeRootDir(),
      pythonPath: isRuntimeReady() ? getBundledPythonPath() : "",
      exists: isRuntimeReady(),
      packagedApp: isPackagedApp(),
      installing: Boolean(this.runtimeInstallPromise),
      runtime: meta
    };
  }

  async detectRuntimeRecommendation() {
    return detectRuntimeRecommendation();
  }

  async installBackendRuntime(target = "cpu") {
    if (!isPackagedApp()) {
      return {
        ...this.getRuntimeStatus(),
        skipped: true
      };
    }

    if (target !== "cpu" && target !== "cuda") {
      throw new Error("Unsupported runtime target.");
    }

    if (this.runtimeInstallPromise) {
      return this.runtimeInstallPromise;
    }

    const scriptPath = path.join(getBackendDir(), "install_runtime.ps1");
    const runtimeDir = getRuntimeRootDir();
    ensureDir(path.dirname(runtimeDir));

    this.pushEvent("runtime-install", {
      state: "preparing",
      message: `正在准备安装${target === "cuda" ? " CUDA" : " CPU"}后端运行时...`,
      target
    });

    this.runtimeInstallPromise = new Promise((resolve, reject) => {
      const child = spawn(
        "powershell.exe",
        [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          scriptPath,
          "-TargetDir",
          runtimeDir,
          "-TorchTarget",
          target
        ],
        {
          windowsHide: true,
          env: {
            ...process.env,
            PYTHONIOENCODING: "utf-8"
          }
        }
      );

      this.runtimeInstallProcess = child;

      const forwardJsonLines = (buffer, channel, fallbackLevel = "info") => {
        let pending = "";
        buffer.on("data", (chunk) => {
          pending += chunk.toString("utf8");
          const lines = pending.split(/\r?\n/);
          pending = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
              continue;
            }
            try {
              const payload = JSON.parse(trimmed);
              if (channel === "runtime-install") {
                this.pushEvent("runtime-install", payload);
              } else {
                this.pushEvent(channel, payload);
              }
            } catch {
              this.pushEvent("log", {
                level: fallbackLevel,
                message: trimmed
              });
            }
          }
        });
      };

      forwardJsonLines(child.stdout, "runtime-install", "info");
      forwardJsonLines(child.stderr, "log", "error");

      child.on("error", (error) => {
        this.runtimeInstallProcess = null;
        this.runtimeInstallPromise = null;
        this.pushEvent("runtime-install", {
          state: "error",
          message: error.message,
          target
        });
        reject(error);
      });

      child.on("close", (code) => {
        this.runtimeInstallProcess = null;
        const success = code === 0 && isRuntimeReady();
        this.runtimeInstallPromise = null;

        if (!success) {
          const error = new Error("Backend runtime installation failed.");
          this.pushEvent("runtime-install", {
            state: "error",
            message: "后端运行时安装失败，请检查网络或稍后重试。",
            target
          });
          reject(error);
          return;
        }

        this.pushEvent("runtime-install", {
          state: "complete",
          message: "后端运行时安装完成。",
          target
        });
        resolve({
          ...this.getRuntimeStatus(),
          installed: true
        });
      });
    });

    return this.runtimeInstallPromise;
  }

  async ensureModelAssets(force = false) {
    if (!force && isModelDirectoryReady(this.settings.modelDir)) {
      return {
        ...this.getModelStatus(),
        downloaded: false
      };
    }

    if (this.modelDownloadPromise) {
      return this.modelDownloadPromise;
    }

    ensureDir(path.dirname(this.settings.modelDir));
    ensureDir(this.settings.modelDir);

    const pythonPath = resolvePythonPath(this.settings.pythonPath);
    const scriptPath = path.join(getBackendDir(), "download_model.py");
    const args = [scriptPath, "--repo-id", MODEL_REPO_ID, "--local-dir", this.settings.modelDir];

    this.pushEvent("model-download", {
      state: "preparing",
      message: "正在准备下载 VoxCPM2 模型..."
    });

    this.modelDownloadPromise = new Promise((resolve, reject) => {
      const child = spawn(pythonPath, args, {
        cwd: getBackendDir(),
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8"
        },
        windowsHide: true
      });
      this.modelDownloadProcess = child;

      const forwardJsonLines = (buffer, channel, fallbackLevel = "info") => {
        let pending = "";
        buffer.on("data", (chunk) => {
          pending += chunk.toString("utf8");
          const lines = pending.split(/\r?\n/);
          pending = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
              continue;
            }
            try {
              const payload = JSON.parse(trimmed);
              if (channel === "model-download") {
                this.pushEvent("model-download", payload);
              } else {
                this.pushEvent(channel, payload);
              }
            } catch {
              this.pushEvent("log", {
                level: fallbackLevel,
                message: trimmed
              });
            }
          }
        });
      };

      forwardJsonLines(child.stdout, "model-download", "info");
      forwardJsonLines(child.stderr, "log", "error");

      child.on("error", (error) => {
        this.modelDownloadProcess = null;
        this.modelDownloadPromise = null;
        this.pushEvent("model-download", {
          state: "error",
          message: error.message
        });
        reject(error);
      });

      child.on("close", (code) => {
        this.modelDownloadProcess = null;
        const success = code === 0 && isModelDirectoryReady(this.settings.modelDir);
        this.modelDownloadPromise = null;

        if (!success) {
          const error = new Error("Model download failed.");
          this.pushEvent("model-download", {
            state: "error",
            message: "模型下载失败，请检查网络或 Python 环境。"
          });
          reject(error);
          return;
        }

        this.pushEvent("model-download", {
          state: "complete",
          message: "模型下载完成。"
        });
        resolve({
          ...this.getModelStatus(),
          downloaded: true
        });
      });
    });

    return this.modelDownloadPromise;
  }

  async doctor() {
    return this.request("doctor", this.settings);
  }

  async initialize() {
    await this.ensureModelAssets(false);
    return this.request("init", this.settings);
  }

  async generate(payload) {
    const previewDir = getPreviewOutputDir();
    ensureDir(previewDir);
    clearPreviewOutputs();

    return this.request("generate", {
      ...payload,
      runtimeSettings: {
        ...this.settings,
        previewOutputDir: previewDir
      }
    });
  }

  async getCapabilities() {
    return this.request("capabilities", {});
  }

  async stop() {
    if (this.modelDownloadProcess) {
      this.modelDownloadProcess.kill();
      this.modelDownloadProcess = null;
      this.modelDownloadPromise = null;
    }

    if (this.runtimeInstallProcess) {
      this.runtimeInstallProcess.kill();
      this.runtimeInstallProcess = null;
      this.runtimeInstallPromise = null;
    }

    if (this.shell) {
      try {
        await this.request("shutdown", {});
      } catch {
        // Ignore shutdown races.
      }
      this.shell = null;
    }

    clearPreviewOutputs();
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
  ensureDir(service.settings.outputDir || getDefaultOutputDir());
  ensureDir(getPreviewOutputDir());
  clearPreviewOutputs();
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
ipcMain.handle("studio:update-settings", async (_event, patch) => service.updateSettings(patch || {}));
ipcMain.handle("studio:get-runtime-status", async () => service.getRuntimeStatus());
ipcMain.handle("studio:detect-runtime-recommendation", async () => service.detectRuntimeRecommendation());
ipcMain.handle("studio:install-backend-runtime", async (_event, payload) =>
  service.installBackendRuntime(payload?.target || "cpu")
);
ipcMain.handle("studio:get-model-status", async () => service.getModelStatus());
ipcMain.handle("studio:ensure-model-assets", async (_event, payload) =>
  service.ensureModelAssets(Boolean(payload?.force))
);
ipcMain.handle("studio:doctor", async () => service.doctor());
ipcMain.handle("studio:initialize", async () => service.initialize());
ipcMain.handle("studio:capabilities", async () => service.getCapabilities());
ipcMain.handle("studio:generate", async (_event, payload) => service.generate(payload || {}));
ipcMain.handle("studio:pick-ref-audio", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Audio",
        extensions: ["wav", "flac", "mp3", "ogg", "m4a"]
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
ipcMain.handle("studio:import-voice", async (_event, payload) => importVoiceFromFile(payload || {}));
ipcMain.handle("studio:save-recorded-voice", async (_event, payload) => saveRecordedVoice(payload || {}));
ipcMain.handle("studio:delete-voice", async (_event, payload) => deleteVoiceById(payload || {}));
ipcMain.handle("studio:save-audio-as", async (_event, payload) => saveAudioAs(payload || {}));
