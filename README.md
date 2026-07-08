# Lipex-TTS / VoxCPM Studio

一个基于 **Electron + Node.js + Python Worker** 的本地桌面 TTS 应用，调用本地 `OpenBMB/VoxCPM2` 模型完成文本转语音、音色设计与声音克隆。

---

## 功能特性

- **Auto 模式**：直接输入文本与语言，快速生成语音
- **Design 模式**：用自然语言描述音色（如 "A young woman, gentle and sweet voice, British accent"）
- **Clone 模式**：上传参考音频进行声音克隆，支持带/不带参考文本两种路径
- **本地推理**：所有模型与数据均在本地运行，无需联网即可生成
- **GPU 加速**：支持 NVIDIA CUDA，自动根据硬件选择推理设备

---

## 系统要求

- Windows 10/11（x64）
- [Node.js](https://nodejs.org/)（推荐 LTS）
- Python 3.11（推荐通过 Anaconda 创建 `tts-backend-py311` 环境）
- 可选：NVIDIA GPU + CUDA（用于 GPU 加速）

---

## 项目结构

```
TTSStudio/
├── electron/                 # Electron 主进程
│   ├── main.js               # 窗口、IPC、Python worker 生命周期
│   └── preload.js            # 渲染进程 API 桥接
├── renderer/                 # 前端界面
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── backend/                  # Python 后端
│   ├── worker.py             # 常驻推理进程（JSON 行协议通信）
│   ├── download_model.py     # 模型下载脚本
│   └── install_runtime.ps1   # 运行时安装脚本
├── scripts/                  # 构建与安装脚本
│   ├── install-backend.ps1
│   ├── start-app.ps1
│   └── after-pack-win-icon.cjs
├── models/                   # 本地模型目录（不提交到 Git）
│   ├── VoxCPM/               # VoxCPM 官方源码
│   └── VoxCPM2-HF/           # VoxCPM2 本地模型权重
├── outputs/                  # 生成音频输出目录
├── build/                    # 构建资源（卸载图标等）
├── release/                  # electron-builder 输出目录
├── package.json
└── README.md
```

---

## 安装

### 1. 克隆仓库

```powershell
git clone <your-repo-url>
cd TTSStudio
```

### 2. 安装 Node 依赖

```powershell
npm install
```

### 3. 安装后端 Python 依赖

推荐使用项目自带的安装脚本，它会自动创建或复用 `tts-backend-py311` conda 环境：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backend.ps1
```

如果需要仅安装 CPU 版本 PyTorch：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backend.ps1 -TorchTarget cpu
```

支持的 CUDA 目标：`cuda121`、`cuda124`、`cuda126`、`cuda128`、`cuda129`、`cuda130`。

### 4. 准备模型

将 `VoxCPM2` 模型权重放到：

```text
models/VoxCPM2-HF/
```

目录中应至少包含：

```text
models/VoxCPM2-HF/
├── config.json
├── model.safetensors
├── audiovae.pth
├── tokenizer.json
├── tokenizer_config.json
└── ...
```

如未下载模型，可在应用内通过 Hugging Face 镜像或官方源下载。

---

## 启动

```powershell
npm start
```

或者：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\start-app.ps1
```

---

## 首次使用流程

1. 打开应用后，先点击 **检查环境**
2. 确认 Python 路径指向 `tts-backend-py311`（或你配置的环境）
3. 点击 **加载模型**，等待状态变为「模型已就绪」
4. 切换到 **Auto** 模式，输入文本并选择语言
5. 点击 **生成**，等待音频生成完成

推荐首测文本：

```text
Hello world from VoxCPM Studio.
```

---

## 模式说明

### Auto 模式

最基础的文本转语音模式，只需输入：

- 文本内容
- 目标语言

### Design 模式

通过自然语言描述目标音色，例如：

```text
A young woman, gentle and sweet voice, slightly smiling, British accent
```

### Clone 模式

上传参考音频进行声音克隆。

- **带 `ref_text`**：更接近 ultimate cloning，稳定性更好
- **不带 `ref_text`**：走参考音频驱动的 cloning 路径

> ⚠️ Clone 模式已前后端接通，但目前稳定性还在验证中，建议优先使用 Auto 模式。

---

## 后端环境检查

命令行方式检查后端依赖：

```powershell
python backend/worker.py --doctor
```

如果需要显式使用 conda 环境：

```powershell
C:\Users\%USERNAME%\anaconda3\envs\tts-backend-py311\python.exe backend/worker.py --doctor
```

---

## 打包桌面安装程序

```powershell
# 仅打包目录，不生成安装包
npm run desktop:pack

# 生成 NSIS 安装包
npm run desktop:build
```

打包后的安装程序位于 `release/` 目录。

---

## Python 路径选择逻辑

应用启动 Python worker 时，按以下优先级选择解释器：

1. 用户在应用内设置的 `pythonPath`
2. 项目根目录下的 `.venv/Scripts/python.exe`
3. `C:\Users\%USERNAME%\anaconda3\envs\tts-backend-py311\python.exe`
4. 系统 `python`

推荐始终使用 `tts-backend-py311` conda 环境，以避免依赖冲突。

---

## 音频格式说明

当前参考音频选择器仅支持：

- `wav`
- `flac`

这是为了绕开当前环境中对 `mp3` 解码链的不确定性。系统级 `ffmpeg` 未作为默认依赖。

输出音频默认保存为 WAV 格式。

---

## 已知问题

- **Clone 模式**：前后端已接入，但本地烟雾测试尚未完全稳定，需要继续验证
- **命名遗留**：`electron/main.js` 中的服务类名仍叫 `OmniVoiceService`，不影响当前运行
- **旧模型目录**：项目中可能仍保留早期 OmniVoice 相关目录，不是当前主流程

---

## 开发计划

### 稳定性优先

- 彻底跑通 Clone 模式
- 补充固定测试样本
- 统一错误提示与失败处理

### 体验优先

- 重新设计桌面 UI
- 参数预设保存
- 生成历史与结果复播
- 更完整的生成进度反馈

---

## 技术栈

- [Electron](https://www.electronjs.org/)
- [Node.js](https://nodejs.org/)
- [python-shell](https://www.npmjs.com/package/python-shell)
- [PyTorch](https://pytorch.org/)
- [Transformers](https://huggingface.co/docs/transformers/)
- [VoxCPM2](https://huggingface.co/openbmb/VoxCPM2)

---

## License

MIT
