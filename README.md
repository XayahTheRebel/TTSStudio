# VoxCPM Studio

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

如果你只是想快速跑起来，先测 `Auto` 模式最稳。

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

项目默认优先使用下面这个 Python：

`C:\Users\24509\anaconda3\envs\tts-backend-py311\python.exe`

如果它不存在，则会按下面顺序回退：

1. `./.venv/Scripts/python.exe`
2. 系统 `python`

当前 Electron 主进程里的默认路径配置在 [electron/main.js](/x:/TTSStudio/electron/main.js)。

## 安装

先安装 Node 依赖：

```powershell
npm.cmd install
```

再安装后端依赖：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backend.ps1
```

如果你希望只装 CPU 版 Torch：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backend.ps1 -TorchTarget cpu
```

## 启动

直接启动桌面应用：

```powershell
npm.cmd start
```

或者：

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

```powershell
python backend/worker.py --doctor
```

如果你想显式使用当前推荐 Python：

```powershell
& 'C:\Users\24509\anaconda3\envs\tts-backend-py311\python.exe' backend/worker.py --doctor
```

## 音频格式说明

当前参考音频选择器只开放：

- `wav`
- `flac`

这是为了绕开当前环境里对 `mp3` 解码链的不确定性。系统级 `ffmpeg` 目前没有作为这个项目的默认依赖。

## 已验证结果

项目里已经有几份本地烟雾测试输出：

- `outputs/smoke-auto.wav`
- `outputs/voxcpm-smoke.wav`
- `outputs/voxcpm-worker-smoke.wav`

这些文件可以作为“模型已成功生成过音频”的快速佐证。

## 已知问题

- `Clone` 模式还需要继续验证，当前不能宣称完全稳定
- 项目里还保留了早期 OmniVoice 相关模型目录，它们不是当前主流程的一部分
- `electron/main.js` 里的服务类名仍叫 `OmniVoiceService`，只是命名遗留，不影响当前运行

## 交接文档

更完整的接力信息、风险和下一步建议见：

- [docs/HANDOFF.md](/x:/TTSStudio/docs/HANDOFF.md)
