<p align="center">
  <img src="icon.png" alt="VoxCPM Studio logo" width="128" />
</p>

# VoxCPM Studio

[English](README.en.md) | 简体中文

`VoxCPM Studio` 是一个本地桌面 TTS 应用，使用 `Electron + Node.js + python-shell + Python worker` 调用本地 `VoxCPM2` 模型。

当前项目已经从 OmniVoice 切换到 `OpenBMB/VoxCPM`，默认使用以下本地资源：

- 源码目录：`models/VoxCPM/src`
- 模型目录：`models/VoxCPM2-HF`
- 输出目录：`outputs`

## 当前状态

- `Auto` 模式：已实测可用
- `Design` 模式：前后端已接通，UI 已支持
- `Clone` 模式：前后端已接入，但本地烟雾测试还没有稳定跑通，需要继续验证
- 桌面应用：可启动，可加载本地模型，可生成并保存音频
- 生成的音频会自动保存到 `outputs` 目录
- 音频生成过程中界面会实时显示进度条

如果你只是想快速跑起来，先测 `Auto` 模式最稳。

## 平台支持

应用同时支持 **Windows** 和 **macOS**：

- **Windows**：CUDA（NVIDIA 显卡）或 CPU
- **macOS**：Apple Silicon 自动使用 **MPS** 加速，Intel Mac 回退到 CPU

设备选择是自动的：`cuda → mps → cpu`。

## 项目结构

- `electron/`
  - `main.js`：Electron 主进程、Python worker 生命周期、IPC
  - `preload.js`：向渲染层暴露 `studioApi`
- `renderer/`
  - `index.html`：桌面界面
  - `app.js`：页面逻辑、表单状态、调用 `studioApi`
  - `styles.css`：样式
- `backend/`
  - `worker.py`：常驻 Python 推理进程，和 Node 通过 JSON 协议通信
- `scripts/`
  - `install-backend.ps1`：安装后端 Python 依赖
  - `start-app.ps1`：安装 Node 依赖并启动应用
- `models/`
  - `VoxCPM/`：官方源码仓库
  - `VoxCPM2-HF/`：本地 Hugging Face 模型权重
- `outputs/`
  - 生成后的音频输出目录

## 环境约定

应用按下面顺序解析 Python 解释器：

1. 应用设置里保存的 `pythonPath`
2. 项目虚拟环境：`.venv/Scripts/python.exe`（Windows）或 `.venv/bin/python3`（macOS/Linux）
3. 名为 `tts-backend-py311` 的 conda 环境（如果存在）
4. 系统 `python`（Windows）或 `python3`（macOS/Linux）

当前 Electron 主进程里的默认路径配置在 [electron/main.js](electron/main.js)。

## 安装

先安装 Node 依赖：

```bash
npm install
```

### 后端依赖 — Windows

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backend.ps1
```

如果你希望只装 CPU 版 Torch：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backend.ps1 -TorchTarget cpu
```

### 后端依赖 — macOS

```bash
pip3 install voxcpm modelscope funasr datasets simplejson sortedcontainers
```

然后检查环境：

```bash
python3 backend/worker.py --doctor
```

输出里 `allCoreDepsReady: true` 表示后端就绪。

### 模型权重

首次启动时应用会自动把 `openbmb/VoxCPM2`（约 4.6 GB）下载到 `models/VoxCPM2-HF`，优先走 `hf-mirror.com` 镜像，失败后回退官方源。也可以手动下载：

```bash
python3 backend/download_model.py --repo-id openbmb/VoxCPM2 --local-dir models/VoxCPM2-HF --endpoint https://hf-mirror.com
```

## 启动

```bash
npm start
```

Windows 上也可以：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\start-app.ps1
```

## 使用顺序

首次打开应用后，建议按这个顺序测试：

1. 点击“检查环境”
2. 点击“加载模型”
3. 等待状态变成“模型已就绪”
4. 先使用 `Auto` 模式生成一条音频

推荐的首测文本：

```text
Hello world from VoxCPM Studio.
```

## 模式说明

### Auto

最直接的文本转语音模式，只需要填文本和语言。

### Design

通过自然语言描述音色，例如：

```text
A young woman, gentle and sweet voice, slightly smiling, British accent
```

### Clone

上传参考音频进行声音克隆。

更稳的方式是同时填写参考文本：

- 填了 `ref_text`：更接近 ultimate cloning
- 不填 `ref_text`：走参考音频驱动的 cloning 路径

## 可用命令

检查后端环境：

```bash
python3 backend/worker.py --doctor
```

## 音频格式说明

当前参考音频选择器只开放：

- `wav`
- `flac`

这是为了绕开当前环境里对 `mp3` 解码链的不确定性。系统级 `ffmpeg` 目前没有作为这个项目的默认依赖。

## 输出行为

- 每次生成的音频会**自动保存**到 `outputs` 目录，文件名带时间戳
- 生成按钮下方会实时显示生成进度条；应用初始化时会用一段短样例校准本机推理速度，按“语音单位”（中文字、英文词、数字、停顿分别加权）估算每次生成的真实进度和预计耗时，并在每次生成后自适应修正校准值
- 结果菜单里的“另存为”仍可把音频额外导出到任意位置

## 已知问题

- `Clone` 模式还需要继续验证，当前不能宣称完全稳定
- 项目里还保留了早期 OmniVoice 相关模型目录，它们不是当前主流程的一部分
- `electron/main.js` 里的服务类名仍叫 `OmniVoiceService`，只是命名遗留，不影响当前运行

## 交接文档

更完整的接力信息、风险和下一步建议见：

- [docs/HANDOFF.md](docs/HANDOFF.md)
