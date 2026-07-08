const state = {
  settings: null,
  capabilities: null,
  modelMeta: null,
  runtimeStatus: null,
  runtimeRecommendation: null,
  isInitializing: false,
  isDownloadingModel: false,
  isInstallingRuntime: false,
  isGenerating: false,
  latestResultPath: "",
  latestResultTemporary: false,
  voices: [],
  selectedVoiceId: "auto",
  voicePendingDeleteId: "",
  pendingVoicePath: "",
  pendingVoiceBytes: null,
  pendingVoicePreviewUrl: "",
  recorder: null
};

const refs = {};

// ---------------------------------------------------------------------------
// UI internationalization (zh / en / ja)
// ---------------------------------------------------------------------------
const UI_STRINGS = {
  zh: {
    "section.device": "设备信息",
    "section.language": "语言",
    "section.tts": "文本转语音",
    "section.emotion": "情绪描述",
    "section.settings": "更多设置",
    "section.result": "输出结果",
    "section.voice": "音色选择",
    "pill.uninitialized": "未初始化",
    "pill.deviceUnknown": "设备待检测",
    "pill.waitingStart": "等待启动",
    "btn.openOutput": "打开输出目录",
    "diagnostic.summary": "诊断与日志",
    "diagnostic.copy": "自动启动失败时，再到这里查看路径、依赖和运行日志。",
    "label.modelDir": "模型目录",
    "label.sourceDir": "源码目录",
    "label.outputDir": "输出目录",
    "text.detecting": "检测中...",
    "btn.redetect": "重新检测环境",
    "btn.reloadModel": "重新加载模型",
    "btn.clearLog": "清空日志",
    "placeholder.text": "请输入想要朗读的文本内容",
    "placeholder.emotion": "描述这段文本的情绪、语气或状态。留空时将使用默认高质量风格描述。",
    "label.speechSpeed": "语速调节",
    "label.audioSpeed": "音频速度调节",
    "btn.generate": "生成音频",
    "btn.generating": "生成中...",
    "btn.generatingPct": "生成中 {percent}%",
    "btn.loading": "加载中...",
    "btn.downloadingModel": "下载模型...",
    "btn.downloadingPct": "下载中 {percent}%",
    "btn.waitingRuntime": "等待安装后端",
    "btn.installing": "安装中...",
    "menu.saveAs": "另存为",
    "state.ready": "模型已就绪",
    "state.loadingModel": "模型加载中",
    "state.inferring": "推理中",
    "state.inferringPct": "推理中 {percent}%",
    "state.generateFailed": "生成失败",
    "state.loadFailed": "加载失败",
    "state.stopped": "已停止",
    "state.checking": "环境检查中",
    "state.pendingInit": "待初始化",
    "state.checkFailed": "检查失败",
    "state.downloading": "模型下载中",
    "state.downloadFailed": "模型下载失败",
    "badge.starting": "启动中",
    "badge.checking": "检查中",
    "badge.checkPassed": "检查通过",
    "badge.needsDiagnosis": "需要诊断",
    "badge.loading": "加载中",
    "badge.stopped": "已停止",
    "badge.downloadFailed": "下载失败",
    "badge.downloading": "下载中",
    "badge.downloadingPct": "下载 {percent}%",
    "voice.auto": "自动音色",
    "voice.new": "新建音色",
    "voice.newHint": "上传或录制音频",
    "voice.sourceRecording": "来源：录音",
    "voice.sourceUpload": "来源：上传音频",
    "voice.deleteAria": "删除音色 {name}",
    "modal.addVoice": "添加音色",
    "modal.voiceName": "音色名称",
    "placeholder.voiceName": "例如：我的音色1",
    "btn.upload": "上传音频",
    "btn.record": "开始录音",
    "btn.stopRecord": "停止录音",
    "btn.clearSource": "清空来源",
    "modal.voiceStatus": "请选择一段音频（支持 WAV、FLAC、MP3、OGG、M4A），或者录制一段新的音频。",
    "btn.cancel": "取消",
    "btn.confirmAdd": "确认添加",
    "modal.deleteVoice": "删除音色",
    "modal.deleteVoiceMsg": "确认要删除这个音色吗？删除后不可恢复。",
    "modal.deleteVoiceMsgNamed": "确认删除音色“{name}”吗？删除后不可恢复。",
    "btn.confirmDelete": "确认删除",
    "modal.runtimeTitle": "安装后端环境",
    "modal.runtimeMessage": "首次启动需要先安装后端运行环境，安装完成后才可以下载模型并生成音频。",
    "modal.runtimeHint": "正在检测显卡环境并准备推荐安装方案...",
    "btn.installCuda": "安装 CUDA 版",
    "btn.installCpu": "安装 CPU 版",
    "modal.runtimeProgress": "请选择要安装的后端环境。",
    "voiceStatus.uploaded": "已选择上传音频，确认后会加入音色列表。",
    "voiceStatus.recording": "正在录音，完成后点击“停止录音”。",
    "voiceStatus.recordReady": "录音已准备好，确认后会加入音色列表。",
    "voiceStatus.empty": "没有录到有效音频，请重试。",
    "voiceStatus.nameRequired": "请先输入音色名称。",
    "voiceStatus.nameTooLong": "音色名称请控制在 6 个字以内。",
    "voiceStatus.sourceRequired": "请先上传音频或录制一段音频。",
    "voiceStatus.recordFailed": "录音失败：{message}",
    "voiceStatus.processFailed": "录音处理失败：{message}",
    "voiceStatus.addFailed": "添加失败：{message}",
    "deleteVoice.failed": "删除失败：{message}",
    "log.savedTo": "生成完成，已自动保存到：{path}",
    "log.loadModelFirst": "请先加载模型。",
    "speed.1": "语速很慢",
    "speed.2": "语速较慢",
    "speed.3": "语速中等",
    "speed.4": "语速较快",
    "speed.5": "语速很快",
    "speed.multiplier": "{rate}倍速"
  },
  en: {
    "section.device": "Device",
    "section.language": "Language",
    "section.tts": "Text to Speech",
    "section.emotion": "Emotion & Style",
    "section.settings": "More Settings",
    "section.result": "Output",
    "section.voice": "Voices",
    "pill.uninitialized": "Not initialized",
    "pill.deviceUnknown": "Detecting device",
    "pill.waitingStart": "Waiting to start",
    "btn.openOutput": "Open output folder",
    "diagnostic.summary": "Diagnostics & Logs",
    "diagnostic.copy": "If auto-start fails, check paths, dependencies and runtime logs here.",
    "label.modelDir": "Model dir",
    "label.sourceDir": "Source dir",
    "label.outputDir": "Output dir",
    "text.detecting": "Detecting...",
    "btn.redetect": "Re-check environment",
    "btn.reloadModel": "Reload model",
    "btn.clearLog": "Clear logs",
    "placeholder.text": "Enter the text you want to read aloud",
    "placeholder.emotion": "Describe the emotion, tone or delivery. Leave empty to use the default high-quality style.",
    "label.speechSpeed": "Speaking pace",
    "label.audioSpeed": "Playback speed",
    "btn.generate": "Generate",
    "btn.generating": "Generating...",
    "btn.generatingPct": "Generating {percent}%",
    "btn.loading": "Loading...",
    "btn.downloadingModel": "Downloading...",
    "btn.downloadingPct": "Downloading {percent}%",
    "btn.waitingRuntime": "Waiting for runtime",
    "btn.installing": "Installing...",
    "menu.saveAs": "Save as...",
    "state.ready": "Model ready",
    "state.loadingModel": "Loading model",
    "state.inferring": "Generating",
    "state.inferringPct": "Generating {percent}%",
    "state.generateFailed": "Generation failed",
    "state.loadFailed": "Load failed",
    "state.stopped": "Stopped",
    "state.checking": "Checking environment",
    "state.pendingInit": "Awaiting initialization",
    "state.checkFailed": "Check failed",
    "state.downloading": "Downloading model",
    "state.downloadFailed": "Download failed",
    "badge.starting": "Starting",
    "badge.checking": "Checking",
    "badge.checkPassed": "Check passed",
    "badge.needsDiagnosis": "Needs diagnosis",
    "badge.loading": "Loading",
    "badge.stopped": "Stopped",
    "badge.downloadFailed": "Download failed",
    "badge.downloading": "Downloading",
    "badge.downloadingPct": "Downloading {percent}%",
    "voice.auto": "Auto voice",
    "voice.new": "New voice",
    "voice.newHint": "Upload or record audio",
    "voice.sourceRecording": "Source: recording",
    "voice.sourceUpload": "Source: uploaded audio",
    "voice.deleteAria": "Delete voice {name}",
    "modal.addVoice": "Add Voice",
    "modal.voiceName": "Voice name",
    "placeholder.voiceName": "e.g. MyVoice1",
    "btn.upload": "Upload audio",
    "btn.record": "Start recording",
    "btn.stopRecord": "Stop recording",
    "btn.clearSource": "Clear source",
    "modal.voiceStatus": "Choose an audio file (WAV, FLAC, MP3, OGG, M4A) or record a new one.",
    "btn.cancel": "Cancel",
    "btn.confirmAdd": "Add",
    "modal.deleteVoice": "Delete Voice",
    "modal.deleteVoiceMsg": "Delete this voice? This cannot be undone.",
    "modal.deleteVoiceMsgNamed": "Delete voice “{name}”? This cannot be undone.",
    "btn.confirmDelete": "Delete",
    "modal.runtimeTitle": "Install Backend Runtime",
    "modal.runtimeMessage": "On first launch the backend runtime must be installed before the model can be downloaded and audio generated.",
    "modal.runtimeHint": "Detecting GPU environment and preparing a recommendation...",
    "btn.installCuda": "Install CUDA build",
    "btn.installCpu": "Install CPU build",
    "modal.runtimeProgress": "Choose which backend runtime to install.",
    "voiceStatus.uploaded": "Audio selected. Confirm to add it to the voice list.",
    "voiceStatus.recording": "Recording... click “Stop recording” when done.",
    "voiceStatus.recordReady": "Recording ready. Confirm to add it to the voice list.",
    "voiceStatus.empty": "No valid audio captured. Please try again.",
    "voiceStatus.nameRequired": "Please enter a voice name first.",
    "voiceStatus.nameTooLong": "Keep the voice name within 6 characters.",
    "voiceStatus.sourceRequired": "Please upload or record audio first.",
    "voiceStatus.recordFailed": "Recording failed: {message}",
    "voiceStatus.processFailed": "Failed to process recording: {message}",
    "voiceStatus.addFailed": "Failed to add: {message}",
    "deleteVoice.failed": "Failed to delete: {message}",
    "log.savedTo": "Done. Saved automatically to: {path}",
    "log.loadModelFirst": "Please load the model first.",
    "speed.1": "Very slow",
    "speed.2": "Slow",
    "speed.3": "Normal pace",
    "speed.4": "Fast",
    "speed.5": "Very fast",
    "speed.multiplier": "{rate}×"
  },
  ja: {
    "section.device": "デバイス情報",
    "section.language": "言語",
    "section.tts": "テキスト読み上げ",
    "section.emotion": "感情・スタイル",
    "section.settings": "詳細設定",
    "section.result": "出力結果",
    "section.voice": "ボイス選択",
    "pill.uninitialized": "未初期化",
    "pill.deviceUnknown": "デバイス検出中",
    "pill.waitingStart": "起動待ち",
    "btn.openOutput": "出力フォルダを開く",
    "diagnostic.summary": "診断とログ",
    "diagnostic.copy": "自動起動に失敗した場合は、ここでパス・依存関係・ログを確認してください。",
    "label.modelDir": "モデル",
    "label.sourceDir": "ソース",
    "label.outputDir": "出力先",
    "text.detecting": "検出中...",
    "btn.redetect": "環境を再チェック",
    "btn.reloadModel": "モデルを再読み込み",
    "btn.clearLog": "ログをクリア",
    "placeholder.text": "読み上げたいテキストを入力してください",
    "placeholder.emotion": "感情・口調・話し方を記述してください。空欄の場合は既定の高品質スタイルを使用します。",
    "label.speechSpeed": "話す速さ",
    "label.audioSpeed": "再生速度",
    "btn.generate": "音声を生成",
    "btn.generating": "生成中...",
    "btn.generatingPct": "生成中 {percent}%",
    "btn.loading": "読み込み中...",
    "btn.downloadingModel": "ダウンロード中...",
    "btn.downloadingPct": "ダウンロード {percent}%",
    "btn.waitingRuntime": "ランタイム待ち",
    "btn.installing": "インストール中...",
    "menu.saveAs": "名前を付けて保存",
    "state.ready": "モデル準備完了",
    "state.loadingModel": "モデル読み込み中",
    "state.inferring": "推論中",
    "state.inferringPct": "推論中 {percent}%",
    "state.generateFailed": "生成失敗",
    "state.loadFailed": "読み込み失敗",
    "state.stopped": "停止済み",
    "state.checking": "環境チェック中",
    "state.pendingInit": "初期化待ち",
    "state.checkFailed": "チェック失敗",
    "state.downloading": "モデルダウンロード中",
    "state.downloadFailed": "ダウンロード失敗",
    "badge.starting": "起動中",
    "badge.checking": "チェック中",
    "badge.checkPassed": "チェック合格",
    "badge.needsDiagnosis": "要診断",
    "badge.loading": "読み込み中",
    "badge.stopped": "停止済み",
    "badge.downloadFailed": "DL失敗",
    "badge.downloading": "DL中",
    "badge.downloadingPct": "DL {percent}%",
    "voice.auto": "自動ボイス",
    "voice.new": "新規ボイス",
    "voice.newHint": "アップロードまたは録音",
    "voice.sourceRecording": "ソース：録音",
    "voice.sourceUpload": "ソース：アップロード",
    "voice.deleteAria": "ボイス {name} を削除",
    "modal.addVoice": "ボイスを追加",
    "modal.voiceName": "ボイス名",
    "placeholder.voiceName": "例：マイボイス1",
    "btn.upload": "音声をアップロード",
    "btn.record": "録音開始",
    "btn.stopRecord": "録音停止",
    "btn.clearSource": "ソースをクリア",
    "modal.voiceStatus": "音声ファイル（WAV・FLAC・MP3・OGG・M4A）を選択するか、新しく録音してください。",
    "btn.cancel": "キャンセル",
    "btn.confirmAdd": "追加する",
    "modal.deleteVoice": "ボイスを削除",
    "modal.deleteVoiceMsg": "このボイスを削除しますか？元に戻せません。",
    "modal.deleteVoiceMsgNamed": "ボイス「{name}」を削除しますか？元に戻せません。",
    "btn.confirmDelete": "削除する",
    "modal.runtimeTitle": "バックエンド環境のインストール",
    "modal.runtimeMessage": "初回起動時はバックエンド環境をインストールしてから、モデルのダウンロードと音声生成が可能になります。",
    "modal.runtimeHint": "GPU 環境を検出し、推奨インストール構成を準備しています...",
    "btn.installCuda": "CUDA 版をインストール",
    "btn.installCpu": "CPU 版をインストール",
    "modal.runtimeProgress": "インストールするバックエンド環境を選択してください。",
    "voiceStatus.uploaded": "音声を選択しました。確認後にボイスリストへ追加されます。",
    "voiceStatus.recording": "録音中です。終わったら「録音停止」を押してください。",
    "voiceStatus.recordReady": "録音の準備ができました。確認後にリストへ追加されます。",
    "voiceStatus.empty": "有効な音声が録れませんでした。もう一度お試しください。",
    "voiceStatus.nameRequired": "先にボイス名を入力してください。",
    "voiceStatus.nameTooLong": "ボイス名は6文字以内にしてください。",
    "voiceStatus.sourceRequired": "先に音声をアップロードまたは録音してください。",
    "voiceStatus.recordFailed": "録音失敗：{message}",
    "voiceStatus.processFailed": "録音の処理に失敗：{message}",
    "voiceStatus.addFailed": "追加失敗：{message}",
    "deleteVoice.failed": "削除失敗：{message}",
    "log.savedTo": "生成完了。自動保存先：{path}",
    "log.loadModelFirst": "先にモデルを読み込んでください。",
    "speed.1": "とても遅い",
    "speed.2": "やや遅い",
    "speed.3": "ふつう",
    "speed.4": "やや速い",
    "speed.5": "とても速い",
    "speed.multiplier": "{rate}倍速"
  }
};

const EMOTION_PRESETS_I18N = {
  zh: [
    { label: "温柔", text: "温柔、轻缓、亲切，声音柔和细腻，带安抚感和耐心，说话轻轻落下，自然不生硬。" },
    { label: "开心活泼", text: "轻快、明亮、活泼，声音有笑意和弹性，情绪外放自然，带明显的愉悦感和亲和力。" },
    { label: "冷静克制", text: "冷静、克制、稳定，声音平稳清晰，起伏收敛，措辞理性，表达有分寸，不过度渲染情绪。" },
    { label: "伤感", text: "低落、失落、压抑，声音偏轻偏弱，尾音微微下沉，带一点鼻音和隐忍感，像在努力压住情绪。" },
    { label: "紧张", text: "紧张、谨慎、不安，声音微微发紧，呼吸略急，语句之间带一点停顿和迟疑，像在强撑着保持镇定。" },
    { label: "惊讶", text: "明显惊讶，声音瞬间抬高，反应直接，语气里带突然被触动的起伏感，但整体仍保持自然真实。" },
    { label: "严肃", text: "严肃、郑重、认真，声音清晰有力，节奏稳定，表达明确克制，带一点正式感和压迫感。" },
    { label: "受伤", text: "极度痛苦、虚弱、恐惧、带哭腔，说话断断续续，夹杂明显的受伤喘息和压抑的哭声。" }
  ],
  en: [
    { label: "Gentle", text: "Gentle, soft and warm, a tender soothing voice with patience, landing lightly and naturally, never stiff." },
    { label: "Cheerful", text: "Light, bright and lively, a voice with a smile and bounce, openly joyful, friendly and engaging." },
    { label: "Calm", text: "Calm, restrained and steady, a clear even voice with controlled dynamics, rational wording, measured without dramatizing." },
    { label: "Sad", text: "Low and dejected, a soft weak voice with slightly sinking tail notes and a hint of nasal restraint, as if holding back emotion." },
    { label: "Nervous", text: "Nervous, cautious and uneasy, a slightly tight voice with quicker breathing, small pauses and hesitations while trying to stay composed." },
    { label: "Surprised", text: "Clearly surprised, the voice lifts suddenly with direct reactions and a startled rise and fall, yet stays natural and real." },
    { label: "Serious", text: "Serious, solemn and earnest, a clear firm voice with steady rhythm, precise restrained delivery and a formal edge." },
    { label: "Hurt", text: "In great pain, weak and fearful with a sobbing tone, speaking in broken phrases mixed with hurt gasps and suppressed crying." }
  ],
  ja: [
    { label: "優しい", text: "優しく、ゆっくりと、親しみを込めて。柔らかく繊細な声で、安心感と忍耐を持って、自然に軽く語りかける。" },
    { label: "明るい", text: "軽快で明るく、活発。笑いを含んだ弾む声で、素直に喜びが表れ、親しみやすい。" },
    { label: "冷静", text: "冷静で抑制的、安定した声。起伏を抑え、理性的な言葉遣いで、感情を誇張せず節度を持って表現する。" },
    { label: "悲しい", text: "沈んで落ち込んだ、弱く小さな声。語尾がわずかに沈み、少し鼻にかかった抑えた響きで、感情をこらえているよう。" },
    { label: "緊張", text: "緊張して慎重、不安げ。声がわずかにこわばり、呼吸が少し速く、言葉の間に小さな間やためらいがあり、平静を装っている。" },
    { label: "驚き", text: "明らかな驚き。声が瞬間的に高くなり、率直な反応で、突然心を動かされた起伏を持ちながらも自然で真実味がある。" },
    { label: "真剣", text: "真剣で厳粛、誠実。はっきりと力強い声、安定したリズム、正確で抑制された表現に、フォーマルな緊張感を添えて。" },
    { label: "苦痛", text: "極度の苦痛、弱々しく、恐怖と泣き声混じり。途切れ途切れに話し、傷ついた喘ぎと抑えた泣き声が混じる。" }
  ]
};

let uiLanguage = (() => {
  try {
    const stored = localStorage.getItem("uiLanguage");
    return UI_STRINGS[stored] ? stored : "zh";
  } catch {
    return "zh";
  }
})();

function t(key, vars) {
  const table = UI_STRINGS[uiLanguage] || UI_STRINGS.zh;
  let text = table[key] ?? UI_STRINGS.zh[key] ?? key;
  if (vars) {
    text = text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] !== undefined ? vars[name] : ""));
  }
  return text;
}

function getEmotionPresets() {
  return EMOTION_PRESETS_I18N[uiLanguage] || EMOTION_PRESETS_I18N.zh;
}

function applyUiLanguage(lang) {
  uiLanguage = UI_STRINGS[lang] ? lang : "zh";
  try {
    localStorage.setItem("uiLanguage", uiLanguage);
  } catch {
    // localStorage may be unavailable; language just won't persist.
  }
  document.documentElement.lang = uiLanguage === "zh" ? "zh-CN" : uiLanguage;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
  });
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.classList.toggle("lang-btn-active", button.dataset.lang === uiLanguage);
  });

  // Restore dynamic values that the static pass above just reset.
  if (state.settings) {
    setSettingsUI(state.settings);
  }
  if (state.modelMeta) {
    refs.deviceBadge.textContent = `${state.modelMeta.device} / ${state.modelMeta.dtype}`;
  }
  if (refs.emotionPresetBar) {
    renderEmotionPresets();
  }
  if (refs.voiceList) {
    renderVoiceList();
  }
  if (refs.speechSpeedValue) {
    refs.speechSpeedValue.textContent = formatSpeechSpeedValue(refs.speechSpeedInput.value);
  }
  if (refs.audioSpeedValue) {
    refs.audioSpeedValue.textContent = formatSpeedValue(refs.audioSpeedInput.value);
  }
  if (state.lastWorkerState) {
    setWorkerState(state.lastWorkerState.key, state.lastWorkerState.variant, state.lastWorkerState.vars);
  }
  if (state.lastStartupBadge) {
    setStartupState("", "", state.lastStartupBadge.key, state.lastStartupBadge.variant, state.lastStartupBadge.vars);
  }
  if (state.lastGenerateBtn) {
    setGenerateButtonText(state.lastGenerateBtn.key, state.lastGenerateBtn.vars);
  }
  if (state.lastInitializeBtn) {
    setInitializeButtonText(state.lastInitializeBtn.key, state.lastInitializeBtn.vars);
  }
}

const LANGUAGE_LABELS = {
  Arabic: "阿拉伯语",
  Burmese: "缅甸语",
  Chinese: "中文",
  Danish: "丹麦语",
  Dutch: "荷兰语",
  English: "英语",
  Finnish: "芬兰语",
  French: "法语",
  German: "德语",
  Greek: "希腊语",
  Hebrew: "希伯来语",
  Hindi: "印地语",
  Indonesian: "印尼语",
  Italian: "意大利语",
  Japanese: "日语",
  Khmer: "高棉语",
  Korean: "韩语",
  Lao: "老挝语",
  Malay: "马来语",
  Norwegian: "挪威语",
  Polish: "波兰语",
  Portuguese: "葡萄牙语",
  Russian: "俄语",
  Spanish: "西班牙语",
  Swahili: "斯瓦希里语",
  Swedish: "瑞典语",
  Tagalog: "他加禄语",
  Thai: "泰语",
  Turkish: "土耳其语",
  Vietnamese: "越南语"
};
const LANGUAGE_OPTIONS = [
  "Arabic",
  "Burmese",
  "Chinese",
  "Danish",
  "Dutch",
  "English",
  "Finnish",
  "French",
  "German",
  "Greek",
  "Hebrew",
  "Hindi",
  "Indonesian",
  "Italian",
  "Japanese",
  "Khmer",
  "Korean",
  "Lao",
  "Malay",
  "Norwegian",
  "Polish",
  "Portuguese",
  "Russian",
  "Spanish",
  "Swahili",
  "Swedish",
  "Tagalog",
  "Thai",
  "Turkish",
  "Vietnamese"
];
const SPEECH_SPEED_PRESETS = [
  { value: "1", labelKey: "speed.1", prompt: "very slow speaking pace" },
  { value: "2", labelKey: "speed.2", prompt: "slightly slow speaking pace" },
  { value: "3", labelKey: "speed.3", prompt: "moderate speaking pace" },
  { value: "4", labelKey: "speed.4", prompt: "slightly fast speaking pace" },
  { value: "5", labelKey: "speed.5", prompt: "very fast speaking pace" }
];

const DEFAULT_STYLE_DESCRIPTION = [
  "clear and professional voice",
  "warm and calm tone",
  "relaxed and natural expression"
].join(", ");

const DEFAULT_RUNTIME_SPEED_TEXT = "Network: waiting for download activity...";

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
    "speechSpeedInput",
    "speechSpeedValue",
    "audioSpeedInput",
    "audioSpeedValue",
    "voiceList",
    "generateBtn",
    "generateProgress",
    "generateProgressFill",
    "resultAudio",
    "resultMenuBtn",
    "resultMenu",
    "saveAudioBtn",
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
    "runtimeSetupModal",
    "runtimeSetupMessage",
    "runtimeSetupHint",
    "runtimeInstallCudaBtn",
    "runtimeInstallCpuBtn",
    "runtimeSetupProgress",
    "deleteVoiceModal",
    "deleteVoiceMessage",
    "deleteVoiceCancelBtn",
    "deleteVoiceConfirmBtn"
  ].forEach((id) => {
    refs[id] = $(id);
  });

  ensureRuntimeSpeedNode();
}

function ensureRuntimeSpeedNode() {
  let speedNode = $("runtimeSetupSpeed");
  if (!speedNode) {
    speedNode = document.createElement("div");
    speedNode.id = "runtimeSetupSpeed";
    speedNode.className = "runtime-speed-copy";
    speedNode.textContent = DEFAULT_RUNTIME_SPEED_TEXT;
    refs.runtimeSetupProgress.insertAdjacentElement("afterend", speedNode);
  }
  refs.runtimeSetupSpeed = speedNode;
}

function addLog(message, level = "info") {
  const entry = document.createElement("article");
  entry.className = "log-entry";
  entry.dataset.level = level;
  const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  entry.innerHTML = `<strong>${now}</strong><div>${message}</div>`;
  refs.logConsole.prepend(entry);
}

function setWorkerState(key, variant = "idle", vars) {
  state.lastWorkerState = { key, variant, vars };
  refs.workerState.textContent = t(key, vars);
  refs.workerState.className = `pill pill-${variant}`;
}

function setGenerateButtonText(key, vars) {
  state.lastGenerateBtn = { key, vars };
  refs.generateBtn.textContent = t(key, vars);
}

function setInitializeButtonText(key, vars) {
  state.lastInitializeBtn = { key, vars };
  refs.initializeBtn.textContent = t(key, vars);
}

function setDiagnosticPanel(visible, open = visible) {
  refs.diagnosticPanel.classList.toggle("hidden", !visible);
  refs.diagnosticPanel.open = visible && open;
}

function setStartupState(_title, _description, badgeKey, variant = "idle", vars) {
  state.lastStartupBadge = { key: badgeKey, variant, vars };
  refs.startupBadge.textContent = t(badgeKey, vars);
  refs.startupBadge.className = `pill pill-${variant}`;
}

function setGenerateButtonBusy(isBusy) {
  refs.generateBtn.classList.toggle("generate-btn-busy", isBusy);
}

function showGenerateProgress(percent) {
  refs.generateProgress.classList.remove("hidden");
  refs.generateProgressFill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function hideGenerateProgress() {
  refs.generateProgress.classList.add("hidden");
  refs.generateProgressFill.style.width = "0%";
}

function handleGenerateProgressEvent(payload = {}) {
  if (!state.isGenerating || !Number.isFinite(payload.percent)) {
    return;
  }
  const percent = Math.round(payload.percent);
  showGenerateProgress(percent);
  setGenerateButtonText("btn.generatingPct", { percent });
  setWorkerState("state.inferringPct", "busy", { percent });
}

function setRuntimeSpeedText(speedText = "") {
  const hasSpeed = Boolean(speedText);
  refs.runtimeSetupSpeed.textContent = hasSpeed ? `Network: ${speedText}` : DEFAULT_RUNTIME_SPEED_TEXT;
  refs.runtimeSetupSpeed.dataset.active = hasSpeed ? "true" : "false";
}

function handleModelDownloadEvent(payload = {}) {
  const downloadState = payload.state || "";
  const hasProgress = Number.isFinite(payload.progress);
  const percent = hasProgress ? Math.round(payload.progress) : 0;

  if (downloadState === "preparing" || downloadState === "downloading") {
    state.isDownloadingModel = true;
    refs.generateBtn.disabled = true;
    setGenerateButtonText("btn.loading");
    setGenerateButtonBusy(true);
    refs.initializeBtn.disabled = true;
    if (hasProgress) {
      setInitializeButtonText("btn.downloadingPct", { percent });
    } else {
      setInitializeButtonText("btn.downloadingModel");
    }
    setWorkerState("state.downloading", "busy");
    if (hasProgress) {
      setStartupState("", "", "badge.downloadingPct", "busy", { percent });
    } else {
      setStartupState("", "", "badge.downloading", "busy");
    }
    return;
  }

  if (downloadState === "complete") {
    state.isDownloadingModel = false;
    refs.initializeBtn.disabled = false;
    setInitializeButtonText("btn.reloadModel");
    addLog(payload.message || "模型下载完成。", "success");
    return;
  }

  if (downloadState === "error") {
    state.isDownloadingModel = false;
    refs.initializeBtn.disabled = false;
    setInitializeButtonText("btn.reloadModel");
    refs.generateBtn.disabled = true;
    setGenerateButtonText("btn.loading");
    setGenerateButtonBusy(true);
    setWorkerState("state.downloadFailed", "error");
    setStartupState("", "", "badge.downloadFailed", "error");
    addLog(payload.message || "模型下载失败。", "error");
  }
}

async function ensureModelAssetsReady(force = false) {
  const result = await window.studioApi.ensureModelAssets({ force });
  const settings = await window.studioApi.getSettings();
  setSettingsUI(settings);
  return result;
}

function setRuntimeSetupVisible(visible) {
  refs.runtimeSetupModal.classList.toggle("hidden", !visible);
}

function getRuntimeTargetButtons() {
  return [
    { target: "cuda", label: "CUDA", button: refs.runtimeInstallCudaBtn },
    { target: "cpu", label: "CPU", button: refs.runtimeInstallCpuBtn }
  ].filter((item) => item.button);
}

function setRuntimeInstallButtonsDisabled(disabled) {
  getRuntimeTargetButtons().forEach(({ button }) => {
    button.disabled = disabled;
  });
}

function updateRuntimeTargetButtonLabels(recommendedTarget) {
  getRuntimeTargetButtons().forEach(({ target, label, button }) => {
    const isRecommended = target === "cuda" ? recommendedTarget.startsWith("cuda") : target === recommendedTarget;
    button.textContent = isRecommended ? `${label} (Recommended)` : label;
  });
}

function updateRuntimeSetupUI() {
  const recommendation = state.runtimeRecommendation;
  const recommendedTarget = recommendation?.recommendedTarget || "cpu";
  refs.runtimeInstallCudaBtn.textContent =
    recommendedTarget === "cuda" ? "安装 CUDA 版（推荐）" : "安装 CUDA 版";
  refs.runtimeInstallCpuBtn.textContent =
    recommendedTarget === "cpu" ? "安装 CPU 版（推荐）" : "安装 CPU 版";
  refs.runtimeSetupHint.textContent =
    recommendation?.reason || "可根据你的设备环境选择 CUDA 加速版或 CPU 兼容版。";
}

async function showRuntimeSetup() {
  state.runtimeStatus = await window.studioApi.getRuntimeStatus();
  if (!state.runtimeStatus?.packagedApp || state.runtimeStatus?.exists) {
    setRuntimeSetupVisible(false);
    return false;
  }

  state.runtimeRecommendation = await window.studioApi.detectRuntimeRecommendation();
  updateRuntimeSetupUI();
  updateRuntimeTargetButtonLabels(state.runtimeRecommendation?.recommendedTarget || "cpu");
  setRuntimeSpeedText("");
  refs.runtimeSetupMessage.textContent =
    "首次启动需要先安装后端运行环境。安装完成后，程序会继续下载模型并自动初始化。";
  refs.runtimeSetupProgress.textContent = "请选择要安装的后端环境。";
  refs.initializeBtn.disabled = true;
  setInitializeButtonText("btn.waitingRuntime");
  refs.generateBtn.disabled = true;
  setGenerateButtonText("btn.loading");
  setGenerateButtonBusy(true);
  setWorkerState("btn.waitingRuntime", "busy");
  setStartupState("等待安装后端环境", state.runtimeRecommendation.reason, "待安装", "busy");
  setRuntimeSetupVisible(true);
  return true;
}

function handleRuntimeInstallEvent(payload = {}) {
  const installState = payload.state || "";
  const hasProgress = Number.isFinite(payload.progress);
  const networkSpeed = typeof payload.networkSpeed === "string" ? payload.networkSpeed.trim() : "";
  if (networkSpeed) {
    setRuntimeSpeedText(networkSpeed);
  }
  const progressText = hasProgress ? `安装 ${Math.round(payload.progress)}%` : "安装中";

  if (installState === "preparing" || installState === "downloading" || installState === "extracting" || installState === "installing") {
    state.isInstallingRuntime = true;
    refs.runtimeInstallCudaBtn.disabled = true;
    refs.runtimeInstallCpuBtn.disabled = true;
    setRuntimeInstallButtonsDisabled(true);
    refs.initializeBtn.disabled = true;
    setInitializeButtonText("btn.installing");
    refs.runtimeSetupProgress.textContent = payload.message || "正在安装后端运行环境...";
    refs.generateBtn.disabled = true;
    setGenerateButtonText("btn.loading");
    setGenerateButtonBusy(true);
    setWorkerState("安装后端中", "busy");
    setStartupState("正在安装后端环境", payload.message || "正在安装后端运行环境...", progressText, "busy");
    return;
  }

  if (installState === "complete") {
    state.isInstallingRuntime = false;
    setRuntimeSpeedText("");
    refs.initializeBtn.disabled = false;
    setInitializeButtonText("btn.reloadModel");
    refs.runtimeSetupProgress.textContent = payload.message || "后端运行环境安装完成。";
    addLog(payload.message || "后端运行环境安装完成。", "success");
    return;
  }

  if (installState === "error") {
    state.isInstallingRuntime = false;
    setRuntimeSpeedText("");
    refs.runtimeInstallCudaBtn.disabled = false;
    refs.runtimeInstallCpuBtn.disabled = false;
    setRuntimeInstallButtonsDisabled(false);
    refs.initializeBtn.disabled = false;
    setInitializeButtonText("btn.reloadModel");
    refs.runtimeSetupProgress.textContent = payload.message || "后端运行环境安装失败，请重试。";
    setWorkerState("安装后端失败", "error");
    setStartupState("后端环境安装失败", payload.message || "后端运行环境安装失败，请检查网络后重试。", "失败", "error");
    addLog(payload.message || "后端运行环境安装失败。", "error");
  }
}

async function installBackendRuntime(target) {
  if (state.isInstallingRuntime) {
    return;
  }

  try {
    state.isInstallingRuntime = true;
    await window.studioApi.installBackendRuntime({ target });
    state.runtimeStatus = await window.studioApi.getRuntimeStatus();
    setRuntimeSetupVisible(false);
    refs.runtimeInstallCudaBtn.disabled = false;
    refs.runtimeInstallCpuBtn.disabled = false;
    setRuntimeInstallButtonsDisabled(false);
    await continueStartupAfterRuntimeReady();
  } catch (error) {
    state.isInstallingRuntime = false;
    refs.runtimeInstallCudaBtn.disabled = false;
    refs.runtimeInstallCpuBtn.disabled = false;
    setRuntimeInstallButtonsDisabled(false);
    refs.runtimeSetupProgress.textContent = error.message;
    setRuntimeSpeedText("");
    addLog(error.message, "error");
  }
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

    const displayName = voice.id === "auto" ? t("voice.auto") : voice.name;
    const displayDesc = voice.kind === "custom" ? describeVoice(voice) : "";
    const content = document.createElement("div");
    content.className = "voice-card-content";
    content.innerHTML = displayDesc
      ? `
        <strong>${displayName}</strong>
        <span>${displayDesc}</span>
      `
      : `
        <strong>${displayName}</strong>
      `;
    button.appendChild(content);

    if (voice.kind === "custom") {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "voice-delete-btn";
      deleteButton.setAttribute("aria-label", t("voice.deleteAria", { name: voice.name }));
      deleteButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9zm1 12c-1.1 0-2-.9-2-2V8h12v11c0 1.1-.9 2-2 2H8z"></path>
        </svg>
      `;
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        state.voicePendingDeleteId = voice.id;
        refs.deleteVoiceMessage.textContent = t("modal.deleteVoiceMsgNamed", { name: voice.name });
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
      <strong>${t("voice.new")}</strong>
      <span>${t("voice.newHint")}</span>
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
          refs.voiceSourceStatus.textContent = t("voiceStatus.empty");
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
        refs.voiceSourceStatus.textContent = t("voiceStatus.recordReady");
        refs.voiceRecordBtn.disabled = false;
        refs.voiceStopBtn.disabled = true;
        syncVoiceConfirmState();
        resolve();
      } catch (error) {
        refs.voiceSourceStatus.textContent = t("voiceStatus.processFailed", { message: error.message });
        refs.voiceRecordBtn.disabled = false;
        refs.voiceStopBtn.disabled = true;
        reject(error);
      }
    };

    activeRecorder.mediaRecorder.onerror = (event) => {
      activeRecorder.stream.getTracks().forEach((track) => track.stop());
      refs.voiceSourceStatus.textContent = t("voiceStatus.recordFailed", { message: event.error?.message || "unknown error" });
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

function formatSpeedValue(value) {
  const rate = getAudioPlaybackRate(value);
  const roundedRate = Math.round(rate * 10) / 10;
  const rateText = Number.isInteger(roundedRate) ? `${roundedRate}` : roundedRate.toFixed(1);
  return t("speed.multiplier", { rate: rateText });
}

function getAudioPlaybackRate(value) {
  const sliderValue = Number.parseFloat(value);
  if (!Number.isFinite(sliderValue)) {
    return 1;
  }

  if (sliderValue <= 50) {
    return 0.5 + (sliderValue / 50) * 0.5;
  }

  return 1 + ((sliderValue - 50) / 50) * 1;
}

function renderLanguageOptions(languages = LANGUAGE_OPTIONS) {
  const options = Array.isArray(languages) && languages.length ? languages : LANGUAGE_OPTIONS;
  const currentValue = refs.languageSelect.value;
  refs.languageSelect.innerHTML = '<option value="">自动识别</option>';

  options.forEach((language) => {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = LANGUAGE_LABELS[language] || language;
    refs.languageSelect.appendChild(option);
  });

  refs.languageSelect.value = options.includes(currentValue) ? currentValue : "";
}

function updateMeta(meta) {
  state.modelMeta = meta;
  refs.deviceBadge.textContent = `${meta.device} / ${meta.dtype}`;
  renderLanguageOptions(meta.languages);
}

function applyResult(result) {
  state.latestResultPath = result.outputPath;
  refs.resultAudio.src = window.studioApi.toFileUrl(result.outputPath);
}

function setResultMenuOpen(open) {
  refs.resultMenu.classList.toggle("hidden", !open);
}

function buildGeneratePayload() {
  const emotion = refs.emotionInput.value.trim();
  const selectedVoice = getSelectedVoice();
  const speedRatio = Number.parseFloat(refs.speedInput.value || "1");
  const language = refs.languageSelect.value || "";

  if (selectedVoice.kind === "custom") {
    return {
      mode: "clone",
      text: refs.textInput.value.trim(),
      language,
      refAudio: selectedVoice.audioPath,
      refText: "",
      instruct: "",
      cloneStyle: emotion,
      fileStem: "",
      settings: {},
      speedRatio
    };
  }

  return {
    mode: emotion ? "design" : "auto",
    text: refs.textInput.value.trim(),
    language,
    refAudio: "",
    refText: "",
    instruct: emotion,
    cloneStyle: "",
    fileStem: "",
    settings: {},
    speedRatio
  };
}

function getDefaultVoice() {
  return {
    id: "auto",
    name: "自动音色",
    description: "",
    kind: "auto"
  };
}

function describeVoice(voice) {
  if (voice.source === "recording") {
    return t("voice.sourceRecording");
  }
  return t("voice.sourceUpload");
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

    const displayName = voice.id === "auto" ? t("voice.auto") : voice.name;
    const displayDesc = voice.kind === "custom" ? describeVoice(voice) : "";
    const content = document.createElement("div");
    content.className = "voice-card-content";
    content.innerHTML = displayDesc
      ? `
        <strong>${displayName}</strong>
        <span>${displayDesc}</span>
      `
      : `
        <strong>${displayName}</strong>
      `;
    button.appendChild(content);

    if (voice.kind === "custom") {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "voice-delete-btn";
      deleteButton.setAttribute("aria-label", t("voice.deleteAria", { name: voice.name }));
      deleteButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9zm1 12c-1.1 0-2-.9-2-2V8h12v11c0 1.1-.9 2-2 2H8z"></path>
        </svg>
      `;
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        state.voicePendingDeleteId = voice.id;
        refs.deleteVoiceMessage.textContent = t("modal.deleteVoiceMsgNamed", { name: voice.name });
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
      <strong>${t("voice.new")}</strong>
      <span>${t("voice.newHint")}</span>
    </div>
    <span class="voice-add-icon" aria-hidden="true">+</span>
  `;
  addButton.addEventListener("click", openVoiceModal);
  refs.voiceList.appendChild(addButton);
}

function resetVoiceDraft() {
  state.pendingVoicePath = "";
  state.pendingVoiceBytes = null;
  revokePendingPreviewUrl();
  refs.voicePreviewAudio.removeAttribute("src");
  refs.voicePreviewAudio.load();
  refs.voiceSourceStatus.textContent = t("modal.voiceStatus");
  refs.voiceConfirmBtn.disabled = true;
}

function syncVoiceConfirmState() {
  const hasName = refs.voiceNameInput.value.trim().length > 0;
  const hasSource = Boolean(state.pendingVoicePath || state.pendingVoiceBytes);
  refs.voiceConfirmBtn.disabled = !(hasName && hasSource);
}

function appendEmotionPreset(preset) {
  const presetText = preset.text || preset;
  refs.emotionInput.value = presetText;
}

function renderEmotionPresets() {
  refs.emotionPresetBar.innerHTML = "";
  getEmotionPresets().forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-btn";
    button.textContent = preset.label || preset;
    button.addEventListener("click", () => appendEmotionPreset(preset));
    refs.emotionPresetBar.appendChild(button);
  });
}

function getSpeechSpeedPreset(value) {
  return (
    SPEECH_SPEED_PRESETS.find((preset) => preset.value === String(value)) ||
    SPEECH_SPEED_PRESETS[2]
  );
}

function formatSpeechSpeedValue(value) {
  return t(getSpeechSpeedPreset(value).labelKey);
}

function buildStyleInstruction(...parts) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

function renderLanguageOptions(_languages = LANGUAGE_OPTIONS) {}

function updateMeta(meta) {
  state.modelMeta = meta;
  refs.deviceBadge.textContent = `${meta.device} / ${meta.dtype}`;
  refs.generateBtn.disabled = false;
  setGenerateButtonText("btn.generate");
  setGenerateButtonBusy(false);
}

function applyResult(result) {
  state.latestResultPath = result.outputPath;
  state.latestResultTemporary = Boolean(result.isTemporary);
  refs.resultAudio.src = window.studioApi.toFileUrl(result.outputPath);
  refs.resultAudio.playbackRate = getAudioPlaybackRate(refs.audioSpeedInput.value);
}

function buildGeneratePayload() {
  const emotion = refs.emotionInput.value.trim();
  const selectedVoice = getSelectedVoice();
  const speechSpeedPrompt = getSpeechSpeedPreset(refs.speechSpeedInput.value).prompt;
  const baseStyleInstruction = emotion || DEFAULT_STYLE_DESCRIPTION;
  const styleInstruction = buildStyleInstruction(baseStyleInstruction, speechSpeedPrompt);

  if (selectedVoice.kind === "custom") {
    return {
      mode: "clone",
      text: refs.textInput.value.trim(),
      language: "",
      refAudio: selectedVoice.audioPath,
      refText: "",
      instruct: "",
      cloneStyle: styleInstruction,
      fileStem: "",
      settings: {},
      speedRatio: 1
    };
  }

  return {
    mode: styleInstruction ? "design" : "auto",
    text: refs.textInput.value.trim(),
    language: "",
    refAudio: "",
    refText: "",
    instruct: styleInstruction,
    cloneStyle: "",
    fileStem: "",
    settings: {},
    speedRatio: 1
  };
}

async function runDoctor() {
  try {
    setWorkerState("state.checking", "busy");
    setStartupState("", "", "badge.checking", "busy");
    const result = await window.studioApi.doctor();
    setWorkerState("state.pendingInit", "idle");

    const missing = Object.entries(result.modules)
      .filter(([, info]) => !info.ok)
      .map(([name]) => name);

    if (missing.length === 0) {
      addLog("环境检查通过，VoxCPM2 依赖已就绪。", "success");
      setStartupState("", "", "badge.checkPassed", "idle");
      setDiagnosticPanel(false);
    } else {
      addLog(`环境检查发现缺少依赖：${missing.join(", ")}`, "error");
      setStartupState("", "", "badge.needsDiagnosis", "error");
      setDiagnosticPanel(true);
    }

    return {
      ok: missing.length === 0,
      missing,
      result
    };
  } catch (error) {
    setWorkerState("state.checkFailed", "error");
    addLog(error.message, "error");
    setStartupState("", "", "badge.needsDiagnosis", "error");
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
  renderLanguageOptions();
  refs.speedValue.textContent = formatSpeedValue(refs.speedInput.value);

  refs.doctorBtn.addEventListener("click", runDoctor);
  refs.initializeBtn.addEventListener("click", initializeModel);
  refs.generateBtn.addEventListener("click", generateAudio);
  refs.resultMenuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setResultMenuOpen(refs.resultMenu.classList.contains("hidden"));
  });
  refs.saveAudioBtn.addEventListener("click", async () => {
    if (!state.latestResultPath) {
      addLog("当前还没有可保存的音频。", "error");
      setResultMenuOpen(false);
      return;
    }

    try {
      const result = await window.studioApi.saveAudioAs({ sourcePath: state.latestResultPath });
      if (result?.saved) {
        addLog(`音频已另存为：${result.filePath}`, "success");
      }
    } catch (error) {
      addLog(error.message, "error");
    } finally {
      setResultMenuOpen(false);
    }
  });
  refs.openAudioFolderBtn.addEventListener("click", async () => {
    if (!state.latestResultPath) {
      addLog("当前还没有可定位的音频。", "error");
      setResultMenuOpen(false);
      return;
    }

    try {
      await window.studioApi.showItemInFolder(state.latestResultPath);
    } finally {
      setResultMenuOpen(false);
    }
  });
  refs.speedInput.addEventListener("input", () => {
    refs.speedValue.textContent = formatSpeedValue(refs.speedInput.value);
  });
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
    document.addEventListener("click", () => setResultMenuOpen(false));

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

function mapCustomVoices(customVoices) {
  return [getDefaultVoice()].concat(
    customVoices.map((voice) => ({
      ...voice,
      kind: "custom",
      description: describeVoice(voice)
    }))
  );
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
          refs.voiceSourceStatus.textContent = t("voiceStatus.empty");
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
        refs.voiceSourceStatus.textContent = t("voiceStatus.recordReady");
        refs.voiceRecordBtn.disabled = false;
        refs.voiceStopBtn.disabled = true;
        syncVoiceConfirmState();
        resolve();
      } catch (error) {
        refs.voiceSourceStatus.textContent = t("voiceStatus.processFailed", { message: error.message });
        refs.voiceRecordBtn.disabled = false;
        refs.voiceStopBtn.disabled = true;
        reject(error);
      }
    };

    activeRecorder.mediaRecorder.onerror = (event) => {
      activeRecorder.stream.getTracks().forEach((track) => track.stop());
      refs.voiceSourceStatus.textContent = t("voiceStatus.recordFailed", { message: event.error?.message || "unknown error" });
      refs.voiceRecordBtn.disabled = false;
      refs.voiceStopBtn.disabled = true;
      reject(event.error || new Error("Recording failed."));
    };

    activeRecorder.mediaRecorder.stop();
  });
}

async function runDoctor() {
  try {
    setWorkerState("state.checking", "busy");
    setStartupState("", "", "badge.checking", "busy");
    const result = await window.studioApi.doctor();
    setWorkerState("state.pendingInit", "idle");

    const missing = Object.entries(result.modules)
      .filter(([, info]) => !info.ok)
      .map(([name]) => name);

    if (missing.length === 0) {
      addLog("环境检查通过，VoxCPM2 依赖已就绪。", "success");
      setStartupState("", "", "badge.checkPassed", "idle");
      setDiagnosticPanel(false);
    } else {
      addLog(`环境检查发现缺少依赖：${missing.join(", ")}`, "error");
      setStartupState("", "", "badge.needsDiagnosis", "error");
      setDiagnosticPanel(true);
    }

    return {
      ok: missing.length === 0,
      missing,
      result
    };
  } catch (error) {
    setWorkerState("state.checkFailed", "error");
    addLog(error.message, "error");
    setStartupState("", "", "badge.needsDiagnosis", "error");
    setDiagnosticPanel(true);
    return {
      ok: false,
      missing: [],
      error
    };
  }
}

async function initializeModel() {
  if (state.isInitializing || state.isDownloadingModel) {
    return;
  }

  try {
    state.isInitializing = true;
    refs.initializeBtn.disabled = true;
    setInitializeButtonText("btn.loading");
    refs.generateBtn.disabled = true;
    setGenerateButtonText("btn.loading");
    setGenerateButtonBusy(true);
    setWorkerState("state.loadingModel", "busy");
    setStartupState("", "", "badge.loading", "busy");

    await ensureModelAssetsReady(false);

    const settings = await window.studioApi.updateSettings({
      devicePreference: "auto"
    });
    setSettingsUI(settings);

    const meta = await window.studioApi.initialize();
    updateMeta(meta);
    setWorkerState("state.ready", "ready");
    addLog(`VoxCPM2 加载完成，设备 ${meta.device}，耗时 ${meta.loadSeconds}s`, "success");
    setStartupState("", "", meta.device.toUpperCase(), "ready");
    setDiagnosticPanel(false);
  } catch (error) {
    setWorkerState("state.loadFailed", "error");
    addLog(error.message, "error");
    setStartupState("", "", "badge.needsDiagnosis", "error");
    setDiagnosticPanel(true);
    refs.generateBtn.disabled = true;
    setGenerateButtonText("btn.loading");
    setGenerateButtonBusy(true);
  } finally {
    state.isInitializing = false;
    refs.initializeBtn.disabled = false;
    setInitializeButtonText("btn.reloadModel");
  }
}

async function generateAudio() {
  if (state.isGenerating) {
    return;
  }

  if (!state.modelMeta?.ready) {
    addLog(t("log.loadModelFirst"), "error");
    return;
  }

  try {
    state.isGenerating = true;
    refs.generateBtn.disabled = true;
    setGenerateButtonText("btn.generating");
    setGenerateButtonBusy(true);
    showGenerateProgress(0);
    setWorkerState("state.inferring", "busy");

    const result = await window.studioApi.generate(buildGeneratePayload());
    applyResult(result);
    setWorkerState("state.ready", "ready");
    addLog(t("log.savedTo", { path: result.outputPath }), "success");
  } catch (error) {
    setWorkerState("state.generateFailed", "error");
    addLog(error.message, "error");
  } finally {
    state.isGenerating = false;
    refs.generateBtn.disabled = false;
    setGenerateButtonText("btn.generate");
    setGenerateButtonBusy(false);
    hideGenerateProgress();
  }
}

async function autoInitializeOnStartup() {
  addLog("启动完成，开始自动检查环境。", "info");
  setStartupState("", "", "badge.starting", "busy");

  try {
    await ensureModelAssetsReady(false);
  } catch (error) {
    setWorkerState("state.downloadFailed", "error");
    addLog(error.message, "error");
    setStartupState("", "", "badge.downloadFailed", "error");
    return;
  }

  const doctor = await runDoctor();
  if (!doctor?.ok) {
    return;
  }

  addLog("环境检查通过，开始自动加载模型。", "info");
  await initializeModel();
}

async function continueStartupAfterRuntimeReady() {
  const capabilities = await window.studioApi.capabilities();
  state.capabilities = capabilities;
  addLog("前端已准备完毕。", "success");
  await autoInitializeOnStartup();
}

async function bootstrap() {
  collectRefs();
  applyUiLanguage(uiLanguage);
  setDiagnosticPanel(false);
  setStartupState("", "", "badge.starting", "busy");
  renderEmotionPresets();
  refs.generateBtn.disabled = true;
  setGenerateButtonText("btn.loading");
  setGenerateButtonBusy(true);
  refs.speechSpeedValue.textContent = formatSpeechSpeedValue(refs.speechSpeedInput.value);
  refs.audioSpeedValue.textContent = formatSpeedValue(refs.audioSpeedInput.value);
  refs.resultAudio.playbackRate = getAudioPlaybackRate(refs.audioSpeedInput.value);

  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", () => applyUiLanguage(button.dataset.lang));
  });
  refs.doctorBtn.addEventListener("click", runDoctor);
  refs.initializeBtn.addEventListener("click", initializeModel);
  refs.generateBtn.addEventListener("click", generateAudio);
  refs.resultMenuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setResultMenuOpen(refs.resultMenu.classList.contains("hidden"));
  });
  refs.saveAudioBtn.addEventListener("click", async () => {
    if (!state.latestResultPath) {
      addLog("当前还没有可保存的音频。", "error");
      setResultMenuOpen(false);
      return;
    }

    try {
      const result = await window.studioApi.saveAudioAs({ sourcePath: state.latestResultPath });
      if (result?.saved) {
        state.latestResultTemporary = false;
        addLog(`音频已另存为：${result.filePath}`, "success");
      }
    } catch (error) {
      addLog(error.message, "error");
    } finally {
      setResultMenuOpen(false);
    }
  });
  refs.speechSpeedInput.addEventListener("input", () => {
    refs.speechSpeedValue.textContent = formatSpeechSpeedValue(refs.speechSpeedInput.value);
  });
  refs.audioSpeedInput.addEventListener("input", () => {
    refs.audioSpeedValue.textContent = formatSpeedValue(refs.audioSpeedInput.value);
    refs.resultAudio.playbackRate = getAudioPlaybackRate(refs.audioSpeedInput.value);
  });
  refs.runtimeInstallCudaBtn.addEventListener("click", () => installBackendRuntime("cuda"));
  refs.runtimeInstallCpuBtn.addEventListener("click", () => installBackendRuntime("cpu"));
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
    refs.voiceSourceStatus.textContent = t("voiceStatus.uploaded");
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
      refs.voiceSourceStatus.textContent = t("voiceStatus.recording");
      syncVoiceConfirmState();
    } catch (error) {
      refs.voiceSourceStatus.textContent = t("voiceStatus.recordFailed", { message: error.message });
    }
  });
  refs.voiceStopBtn.addEventListener("click", stopActiveRecording);
  refs.voiceConfirmBtn.addEventListener("click", async () => {
    const name = refs.voiceNameInput.value.trim();
    if (!name) {
      refs.voiceSourceStatus.textContent = t("voiceStatus.nameRequired");
      return;
    }
    if (Array.from(name).length > 6) {
      refs.voiceSourceStatus.textContent = t("voiceStatus.nameTooLong");
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
        refs.voiceSourceStatus.textContent = t("voiceStatus.sourceRequired");
        return;
      }

      const customVoices = await window.studioApi.getVoices();
      state.voices = mapCustomVoices(customVoices);
      state.selectedVoiceId = record.id;
      renderVoiceList();
      refs.voiceModal.classList.add("hidden");
      resetVoiceDraft();
    } catch (error) {
      refs.voiceSourceStatus.textContent = t("voiceStatus.addFailed", { message: error.message });
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
      state.voices = mapCustomVoices(customVoices);
      if (state.selectedVoiceId === deletedId) {
        state.selectedVoiceId = "auto";
      }
      renderVoiceList();
    } catch (error) {
      refs.deleteVoiceMessage.textContent = t("deleteVoice.failed", { message: error.message });
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

    if (event.name === "model-download") {
      handleModelDownloadEvent(event.payload);
    }

    if (event.name === "runtime-install") {
      handleRuntimeInstallEvent(event.payload);
    }

    if (event.name === "progress") {
      handleGenerateProgressEvent(event.payload);
    }

    if (event.name === "generate-plan") {
      if (state.isGenerating && Number.isFinite(event.payload?.estimatedSeconds)) {
        showGenerateProgress(0);
        addLog(`本次预计生成时长约 ${event.payload.estimatedSeconds}s（基于启动时的速度校准）`, "info");
      }
    }

    if (event.name === "status") {
      if (event.payload.state === "ready") {
        setWorkerState("state.ready", "ready");
        refs.generateBtn.disabled = false;
        setGenerateButtonText("btn.generate");
        setGenerateButtonBusy(false);
      } else if (event.payload.state === "loading") {
        setWorkerState("state.loadingModel", "busy");
        setStartupState("", "", "badge.loading", "busy");
        refs.generateBtn.disabled = true;
        setGenerateButtonText("btn.loading");
        setGenerateButtonBusy(true);
      } else if (event.payload.state === "stopped") {
        setWorkerState("state.stopped", "idle");
        setStartupState("", "", "badge.stopped", "idle");
        refs.generateBtn.disabled = true;
        setGenerateButtonText("btn.loading");
        setGenerateButtonBusy(true);
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
    document.addEventListener("click", () => setResultMenuOpen(false));

    const settings = await window.studioApi.getSettings();
    setSettingsUI(settings);

    const customVoices = await window.studioApi.getVoices();
    state.voices = mapCustomVoices(customVoices);
    renderVoiceList();

    const runtimeSetupShown = await showRuntimeSetup();
    if (runtimeSetupShown) {
      return;
    }

    await continueStartupAfterRuntimeReady();
  } catch (error) {
    addLog(`启动阶段出现问题：${error.message}`, "error");
  }
}

window.addEventListener("DOMContentLoaded", bootstrap);
