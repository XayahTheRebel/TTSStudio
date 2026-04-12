const state = {
  settings: null,
  capabilities: null,
  modelMeta: null,
  isInitializing: false,
  isGenerating: false,
  voices: [],
  selectedVoiceId: "auto",
  voicePendingDeleteId: "",
  pendingVoicePath: "",
  pendingVoiceBytes: null,
  pendingVoicePreviewUrl: "",
  recorder: null
};

const refs = {};
const EMOTION_PRESETS = [
  "温柔",
  "开心活泼",
  "冷静克制",
  "伤感",
  "紧张",
  "惊讶",
  "严肃",
  "放慢语速",
  "年轻女性",
  "成熟男性"
];

function $(id) {
  return document.getElementById(id);
}

function collectRefs() {
  [
    "workerState",
    "deviceBadge",
    "startupBadge",
    "pythonPathText",
    "modelDirText",
    "sourceDirText",
    "outputDirText",
    "diagnosticPanel",
    "doctorBtn",
    "initializeBtn",
    "openOutputBtn",
    "clearLogBtn",
    "logConsole",
    "textInput",
    "emotionInput",
    "emotionPresetBar",
    "voiceList",
    "generateBtn",
    "resultAudio",
    "voiceModal",
    "voiceNameInput",
    "voiceUploadBtn",
    "voiceRecordBtn",
    "voiceStopBtn",
    "voiceClearBtn",
    "voiceSourceStatus",
    "voicePreviewAudio",
    "voiceCancelBtn",
    "voiceConfirmBtn",
    "deleteVoiceModal",
    "deleteVoiceMessage",
    "deleteVoiceCancelBtn",
    "deleteVoiceConfirmBtn"
  ].forEach((id) => {
    refs[id] = $(id);
  });
}

function addLog(message, level = "info") {
  const entry = document.createElement("article");
  entry.className = "log-entry";
  entry.dataset.level = level;
  const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  entry.innerHTML = `<strong>${now}</strong><div>${message}</div>`;
  refs.logConsole.prepend(entry);
}

function setWorkerState(text, variant = "idle") {
  refs.workerState.textContent = text;
  refs.workerState.className = `pill pill-${variant}`;
}

function setDiagnosticPanel(visible, open = visible) {
  refs.diagnosticPanel.classList.toggle("hidden", !visible);
  refs.diagnosticPanel.open = visible && open;
}

function setStartupState(_title, _description, badgeText, variant = "idle") {
  refs.startupBadge.textContent = badgeText;
  refs.startupBadge.className = `pill pill-${variant}`;
}

function setSettingsUI(settings) {
  state.settings = settings;
  refs.pythonPathText.textContent = settings.pythonPath || "python";
  refs.modelDirText.textContent = settings.modelDir;
  refs.sourceDirText.textContent = settings.sourceDir;
  refs.outputDirText.textContent = settings.outputDir;
}

function getDefaultVoice() {
  return {
    id: "auto",
    name: "自动音色",
    description: "",
    kind: "auto"
  };
}

function getSelectedVoice() {
  return state.voices.find((voice) => voice.id === state.selectedVoiceId) || getDefaultVoice();
}

function renderVoiceList() {
  refs.voiceList.innerHTML = "";

  state.voices.forEach((voice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `voice-card${state.selectedVoiceId === voice.id ? " voice-card-active" : ""}`;
    button.addEventListener("click", () => {
      state.selectedVoiceId = voice.id;
      renderVoiceList();
    });

    const content = document.createElement("div");
    content.className = "voice-card-content";
    content.innerHTML = voice.description
      ? `
        <strong>${voice.name}</strong>
        <span>${voice.description}</span>
      `
      : `
        <strong>${voice.name}</strong>
      `;
    button.appendChild(content);

    if (voice.kind === "custom") {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "voice-delete-btn";
      deleteButton.setAttribute("aria-label", `删除音色 ${voice.name}`);
      deleteButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9zm1 12c-1.1 0-2-.9-2-2V8h12v11c0 1.1-.9 2-2 2H8z"></path>
        </svg>
      `;
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        state.voicePendingDeleteId = voice.id;
        refs.deleteVoiceMessage.textContent = `确认删除音色“${voice.name}”吗？删除后不可恢复。`;
        refs.deleteVoiceModal.classList.remove("hidden");
      });
      button.appendChild(deleteButton);
    }

    refs.voiceList.appendChild(button);
  });

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "voice-card voice-card-placeholder";
  addButton.innerHTML = `
    <div class="voice-card-content">
      <strong>新建音色</strong>
      <span>上传或录制音频</span>
    </div>
    <span class="voice-add-icon" aria-hidden="true">+</span>
  `;
  addButton.addEventListener("click", openVoiceModal);
  refs.voiceList.appendChild(addButton);
}

function revokePendingPreviewUrl() {
  if (state.pendingVoicePreviewUrl) {
    URL.revokeObjectURL(state.pendingVoicePreviewUrl);
    state.pendingVoicePreviewUrl = "";
  }
}

function resetVoiceDraft() {
  state.pendingVoicePath = "";
  state.pendingVoiceBytes = null;
  revokePendingPreviewUrl();
  refs.voicePreviewAudio.removeAttribute("src");
  refs.voicePreviewAudio.load();
  refs.voiceSourceStatus.textContent = "请选择一段音频，或者录制一段新的音频。";
  refs.voiceConfirmBtn.disabled = true;
}

function syncVoiceConfirmState() {
  const hasName = refs.voiceNameInput.value.trim().length > 0;
  const hasSource = Boolean(state.pendingVoicePath || state.pendingVoiceBytes);
  refs.voiceConfirmBtn.disabled = !(hasName && hasSource);
}

function openVoiceModal() {
  refs.voiceModal.classList.remove("hidden");
  refs.voiceNameInput.value = "";
  resetVoiceDraft();
}

function closeDeleteVoiceModal() {
  state.voicePendingDeleteId = "";
  refs.deleteVoiceModal.classList.add("hidden");
}

function pickRecordingMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus"
  ];

  return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
}

function downmixToMono(audioBuffer) {
  const { numberOfChannels, length } = audioBuffer;
  if (numberOfChannels <= 1) {
    return audioBuffer.getChannelData(0).slice();
  }

  const mono = new Float32Array(length);
  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      mono[index] += data[index] / numberOfChannels;
    }
  }
  return mono;
}

async function convertBlobToWavBytes(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const context = new AudioCtx();

  try {
    const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
    const mono = downmixToMono(decoded);
    return Array.from(new Uint8Array(encodeWav(mono, decoded.sampleRate)));
  } finally {
    await context.close();
  }
}

async function stopActiveRecording() {
  if (!state.recorder) {
    return;
  }

  const activeRecorder = state.recorder;
  state.recorder = null;

  if (activeRecorder.mediaRecorder.state === "inactive") {
    return;
  }

  refs.voiceRecordBtn.disabled = true;
  refs.voiceStopBtn.disabled = true;

  await new Promise((resolve, reject) => {
    activeRecorder.mediaRecorder.onstop = async () => {
      try {
        activeRecorder.stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(activeRecorder.chunks, {
          type: activeRecorder.mimeType || "audio/webm"
        });
        if (!blob.size) {
          refs.voiceSourceStatus.textContent = "没有录到有效音频，请重试。";
          refs.voiceRecordBtn.disabled = false;
          refs.voiceStopBtn.disabled = true;
          resolve();
          return;
        }

        state.pendingVoiceBytes = await convertBlobToWavBytes(blob);
        state.pendingVoicePath = "";
        revokePendingPreviewUrl();
        const wavPreviewBlob = new Blob([Uint8Array.from(state.pendingVoiceBytes)], {
          type: "audio/wav"
        });
        state.pendingVoicePreviewUrl = URL.createObjectURL(wavPreviewBlob);
        refs.voicePreviewAudio.src = state.pendingVoicePreviewUrl;
        refs.voicePreviewAudio.load();
        refs.voiceSourceStatus.textContent = "录音已准备好，确认后会加入音色列表。";
        refs.voiceRecordBtn.disabled = false;
        refs.voiceStopBtn.disabled = true;
        syncVoiceConfirmState();
        resolve();
      } catch (error) {
        refs.voiceSourceStatus.textContent = `录音处理失败：${error.message}`;
        refs.voiceRecordBtn.disabled = false;
        refs.voiceStopBtn.disabled = true;
        reject(error);
      }
    };

    activeRecorder.mediaRecorder.onerror = (event) => {
      activeRecorder.stream.getTracks().forEach((track) => track.stop());
      refs.voiceSourceStatus.textContent = `录音失败：${event.error?.message || "未知错误"}`;
      refs.voiceRecordBtn.disabled = false;
      refs.voiceStopBtn.disabled = true;
      reject(event.error || new Error("Recording failed."));
    };

    activeRecorder.mediaRecorder.stop();
  });
}

function writeWavString(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeWavString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeWavString(view, 8, "WAVE");
  writeWavString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeWavString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  samples.forEach((sample) => {
    const value = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
    offset += 2;
  });

  return buffer;
}

function appendEmotionPreset(preset) {
  const current = refs.emotionInput.value.trim();
  if (!current) {
    refs.emotionInput.value = preset;
    return;
  }

  const parts = current
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.includes(preset)) {
    return;
  }

  refs.emotionInput.value = `${current}，${preset}`;
}

function renderEmotionPresets() {
  refs.emotionPresetBar.innerHTML = "";
  EMOTION_PRESETS.forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-btn";
    button.textContent = preset;
    button.addEventListener("click", () => appendEmotionPreset(preset));
    refs.emotionPresetBar.appendChild(button);
  });
}

function updateMeta(meta) {
  state.modelMeta = meta;
  refs.deviceBadge.textContent = `${meta.device} / ${meta.dtype}`;
}

function applyResult(result) {
  refs.resultAudio.src = window.studioApi.toFileUrl(result.outputPath);
}

function buildGeneratePayload() {
  const emotion = refs.emotionInput.value.trim();
  const selectedVoice = getSelectedVoice();

  if (selectedVoice.kind === "custom") {
    return {
      mode: "clone",
      text: refs.textInput.value.trim(),
      language: "",
      refAudio: selectedVoice.audioPath,
      refText: "",
      instruct: "",
      cloneStyle: emotion,
      fileStem: "",
      settings: {}
    };
  }

  return {
    mode: emotion ? "design" : "auto",
    text: refs.textInput.value.trim(),
    language: "",
    refAudio: "",
    refText: "",
    instruct: emotion,
    cloneStyle: "",
    fileStem: "",
    settings: {}
  };
}

async function runDoctor() {
  try {
    setWorkerState("环境检查中", "busy");
    setStartupState("正在检查运行环境", "正在确认依赖、模型目录和 Python worker 是否就绪。", "检查中", "busy");
    const result = await window.studioApi.doctor();
    setWorkerState("待初始化", "idle");

    const missing = Object.entries(result.modules)
      .filter(([, info]) => !info.ok)
      .map(([name]) => name);

    if (missing.length === 0) {
      addLog("环境检查通过，VoxCPM2 依赖已就绪。", "success");
      setStartupState("环境检查通过", "依赖和路径都已就绪，接下来会自动选择设备并加载模型。", "检查通过", "idle");
      setDiagnosticPanel(false);
    } else {
      addLog(`环境检查发现缺少依赖：${missing.join(", ")}`, "error");
      setStartupState("自动启动失败", `检测到缺少依赖：${missing.join(", ")}。请展开诊断详情查看。`, "需要诊断", "error");
      setDiagnosticPanel(true);
    }

    return {
      ok: missing.length === 0,
      missing,
      result
    };
  } catch (error) {
    setWorkerState("检查失败", "error");
    addLog(error.message, "error");
    setStartupState("自动启动失败", error.message, "需要诊断", "error");
    setDiagnosticPanel(true);
    return {
      ok: false,
      missing: [],
      error
    };
  }
}

async function initializeModel() {
  if (state.isInitializing) {
    return;
  }

  try {
    state.isInitializing = true;
    refs.initializeBtn.disabled = true;
    refs.initializeBtn.textContent = "加载中...";
    setWorkerState("模型加载中", "busy");
    setStartupState("正在加载模型", "正在自动选择 CUDA 或 CPU，并初始化 VoxCPM2。", "加载中", "busy");
    const settings = await window.studioApi.updateSettings({
      devicePreference: "auto"
    });
    setSettingsUI(settings);

    const meta = await window.studioApi.initialize();
    updateMeta(meta);
    setWorkerState("模型已就绪", "ready");
    addLog(`VoxCPM2 加载完成，设备 ${meta.device}，耗时 ${meta.loadSeconds}s`, "success");
    setStartupState(
      "模型已就绪",
      meta.device === "cuda"
        ? `已自动检测到 CUDA，并完成 VoxCPM2 加载。`
        : `当前未使用 CUDA，已自动回退到 ${meta.device.toUpperCase()} 并完成加载。`,
      meta.device.toUpperCase(),
      "ready"
    );
    setDiagnosticPanel(false);
  } catch (error) {
    setWorkerState("加载失败", "error");
    addLog(error.message, "error");
    setStartupState("模型加载失败", error.message, "需要诊断", "error");
    setDiagnosticPanel(true);
  } finally {
    state.isInitializing = false;
    refs.initializeBtn.disabled = false;
    refs.initializeBtn.textContent = "重新加载模型";
  }
}

async function generateAudio() {
  if (state.isGenerating) {
    return;
  }

  if (!state.modelMeta?.ready) {
    addLog("请先加载模型。", "error");
    return;
  }

  try {
    state.isGenerating = true;
    refs.generateBtn.disabled = true;
    refs.generateBtn.textContent = "生成中...";
    setWorkerState("推理中", "busy");

    const result = await window.studioApi.generate(buildGeneratePayload());
    applyResult(result);
    setWorkerState("模型已就绪", "ready");
    addLog(`生成完成：${result.outputPath}`, "success");
  } catch (error) {
    setWorkerState("生成失败", "error");
    addLog(error.message, "error");
  } finally {
    state.isGenerating = false;
    refs.generateBtn.disabled = false;
    refs.generateBtn.textContent = "开始生成";
  }
}

async function autoInitializeOnStartup() {
  addLog("启动完成，开始自动检查环境。", "info");
  setStartupState("正在准备模型环境", "应用会自动检测设备并尝试加载 VoxCPM2。", "启动中", "busy");

  const doctor = await runDoctor();
  if (!doctor?.ok) {
    return;
  }

  addLog("环境检查通过，开始自动加载模型。", "info");
  await initializeModel();
}

async function bootstrap() {
  collectRefs();
  setDiagnosticPanel(false);
  setStartupState("正在准备模型环境", "应用会自动检测设备并尝试加载 VoxCPM2。", "启动中", "busy");
  renderEmotionPresets();

  refs.doctorBtn.addEventListener("click", runDoctor);
  refs.initializeBtn.addEventListener("click", initializeModel);
  refs.generateBtn.addEventListener("click", generateAudio);
  refs.voiceNameInput.addEventListener("input", syncVoiceConfirmState);
  refs.voiceCancelBtn.addEventListener("click", async () => {
    await stopActiveRecording();
    refs.voiceModal.classList.add("hidden");
    resetVoiceDraft();
  });
  refs.deleteVoiceCancelBtn.addEventListener("click", closeDeleteVoiceModal);
  refs.voiceClearBtn.addEventListener("click", async () => {
    await stopActiveRecording();
    resetVoiceDraft();
  });
  refs.voiceUploadBtn.addEventListener("click", async () => {
    const filePath = await window.studioApi.pickReferenceAudio();
    if (!filePath) {
      return;
    }
    await stopActiveRecording();
    state.pendingVoicePath = filePath;
    state.pendingVoiceBytes = null;
    revokePendingPreviewUrl();
    refs.voicePreviewAudio.src = window.studioApi.toFileUrl(filePath);
    refs.voicePreviewAudio.load();
    refs.voiceSourceStatus.textContent = "已选择上传音频，确认后会加入音色列表。";
    syncVoiceConfirmState();
  });
  refs.voiceRecordBtn.addEventListener("click", async () => {
    if (state.recorder) {
      return;
    }
    try {
      revokePendingPreviewUrl();
      refs.voicePreviewAudio.removeAttribute("src");
      refs.voicePreviewAudio.load();
      state.pendingVoicePath = "";
      state.pendingVoiceBytes = null;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecordingMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      state.recorder = {
        stream,
        mediaRecorder,
        chunks,
        mimeType
      };
      mediaRecorder.start();
      refs.voiceRecordBtn.disabled = true;
      refs.voiceStopBtn.disabled = false;
      refs.voiceSourceStatus.textContent = "正在录音，完成后点击“停止录音”。";
      syncVoiceConfirmState();
    } catch (error) {
      refs.voiceSourceStatus.textContent = `录音失败：${error.message}`;
    }
  });
  refs.voiceStopBtn.addEventListener("click", stopActiveRecording);
  refs.voiceConfirmBtn.addEventListener("click", async () => {
    const name = refs.voiceNameInput.value.trim();
    if (!name) {
      refs.voiceSourceStatus.textContent = "请先输入音色名称。";
      return;
    }
    if (Array.from(name).length > 6) {
      refs.voiceSourceStatus.textContent = "音色名称请控制在 6 个字以内。";
      return;
    }

    try {
      let record;
      if (state.pendingVoicePath) {
        record = await window.studioApi.importVoice({
          name,
          sourcePath: state.pendingVoicePath
        });
      } else if (state.pendingVoiceBytes) {
        record = await window.studioApi.saveRecordedVoice({
          name,
          audioBytes: state.pendingVoiceBytes
        });
      } else {
        refs.voiceSourceStatus.textContent = "请先上传音频或录制一段音频。";
        return;
      }

      const customVoices = await window.studioApi.getVoices();
      state.voices = [getDefaultVoice()].concat(
        customVoices.map((voice) => ({
          ...voice,
          kind: "custom",
          description: `来源：${voice.source === "recording" ? "录音" : "上传音频"}`
        }))
      );
      state.selectedVoiceId = record.id;
      renderVoiceList();
      refs.voiceModal.classList.add("hidden");
      resetVoiceDraft();
    } catch (error) {
      refs.voiceSourceStatus.textContent = `添加失败：${error.message}`;
    }
  });
  refs.deleteVoiceConfirmBtn.addEventListener("click", async () => {
    if (!state.voicePendingDeleteId) {
      closeDeleteVoiceModal();
      return;
    }

    try {
      await window.studioApi.deleteVoice({ id: state.voicePendingDeleteId });
      const deletedId = state.voicePendingDeleteId;
      closeDeleteVoiceModal();
      const customVoices = await window.studioApi.getVoices();
      state.voices = [getDefaultVoice()].concat(
        customVoices.map((voice) => ({
          ...voice,
          kind: "custom",
          description: `来源：${voice.source === "recording" ? "录音" : "上传音频"}`
        }))
      );
      if (state.selectedVoiceId === deletedId) {
        state.selectedVoiceId = "auto";
      }
      renderVoiceList();
    } catch (error) {
      refs.deleteVoiceMessage.textContent = `删除失败：${error.message}`;
    }
  });

  refs.openOutputBtn.addEventListener("click", () => {
    if (state.settings?.outputDir) {
      window.studioApi.openPath(state.settings.outputDir);
    }
  });

  refs.clearLogBtn.addEventListener("click", () => {
    refs.logConsole.innerHTML = "";
  });

  window.studioApi.onBackendEvent((event) => {
    if (event.name === "log") {
      addLog(event.payload.message, event.payload.level || "info");
    }

    if (event.name === "status") {
      if (event.payload.state === "ready") {
        setWorkerState("模型已就绪", "ready");
      } else if (event.payload.state === "loading") {
        setWorkerState("模型加载中", "busy");
        setStartupState("正在加载模型", event.payload.message || "正在初始化 VoxCPM2。", "加载中", "busy");
      } else if (event.payload.state === "stopped") {
        setWorkerState("已停止", "idle");
        setStartupState("服务已停止", "Python worker 已停止运行。", "已停止", "idle");
      }
      if (event.payload.message) {
        addLog(event.payload.message, "info");
      }
    }

    if (event.name === "stderr") {
      addLog(event.payload.line, "info");
    }

    if (event.name === "error") {
      addLog(event.payload.message, "error");
    }
  });

  try {
    const settings = await window.studioApi.getSettings();
    setSettingsUI(settings);

    const customVoices = await window.studioApi.getVoices();
    state.voices = [getDefaultVoice()].concat(
      customVoices.map((voice) => ({
        ...voice,
        kind: "custom",
        description: `来源：${voice.source === "recording" ? "录音" : "上传音频"}`
      }))
    );
    renderVoiceList();

    const capabilities = await window.studioApi.capabilities();
    state.capabilities = capabilities;
    addLog("前端已准备完毕。", "success");
    await autoInitializeOnStartup();
  } catch (error) {
    addLog(`启动阶段出现问题：${error.message}`, "error");
  }
}

window.addEventListener("DOMContentLoaded", bootstrap);
