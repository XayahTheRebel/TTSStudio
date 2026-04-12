# 项目交接文档

最后整理时间：`2026-04-12`

这份文档的目标不是介绍项目“理想上应该是什么”，而是记录它“现在真实是什么状态”，方便下次继续接力。

## 1. 项目目标

这是一个本地桌面应用，用 Electron 做 UI，用 Node.js 通过 `python-shell` 和常驻 Python worker 通信，再由 Python 调用本地 `VoxCPM2` 模型完成语音生成。

当前主目标：

- 本地加载 `VoxCPM2`
- 支持 `Auto / Design / Clone`
- 在桌面端完成输入、生成、试听、打开输出目录

## 2. 模型现状

项目最早是围绕 OmniVoice 做的，但现在已经切换到 VoxCPM。

当前主流程使用：

- 源码：`models/VoxCPM/src`
- 权重：`models/VoxCPM2-HF`

旧目录仍可能存在：

- `models/OmniVoice`
- `models/OmniVoice-HF`

它们现在不是默认路径，也不是当前应用的主推理链路。

## 3. 当前已完成

### 运行链路

- Electron 主窗口可正常启动
- `preload` 桥接已接好
- Node 可启动 Python worker
- Python worker 可加载本地 VoxCPM2
- 生成结果可保存到本地 `outputs`

### 后端

- `doctor` 已实现
- `init` 已实现
- `capabilities` 已实现
- `generate` 已实现
- `shutdown` 已实现

### 前端

- 已有基础可用 UI
- 支持模式切换
- 支持环境检查、模型加载、结果展示
- 已做过一轮中文文案与结构整理

## 4. 已实测通过的部分

这些是“已经实际跑过”的，不是只接了代码：

- `backend/worker.py` 可成功加载 VoxCPM2
- `Auto` 模式可生成音频
- Worker JSON 通信链路可正常返回结果

已确认生成过的样例文件：

- `outputs/voxcpm-smoke.wav`
- `outputs/voxcpm-worker-smoke.wav`
- `outputs/smoke-auto.wav`

## 5. 未完全确认的部分

### Clone

`Clone` 模式前后端都已经接进去了，但使用仓库自带参考音频做本地烟雾测试时，没有在预期时间内稳定返回。

因此当前应该用下面这句话描述项目状态：

`Auto 已实测通过，Clone 已接入但仍需继续验证。`

不要把当前状态写成“Clone 已稳定可用”，那会误导后续接手的人。

## 6. 默认运行方式

项目根目录：

`X:\TTSStudio`

启动桌面应用：

```powershell
npm.cmd start
```

安装后端依赖：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backend.ps1
```

检查后端环境：

```powershell
python backend/worker.py --doctor
```

## 7. Python 选择逻辑

当前默认优先级在 [electron/main.js](/x:/TTSStudio/electron/main.js) 里已经写好：

1. 用户设置里保存的 `pythonPath`
2. `./.venv/Scripts/python.exe`
3. `C:\Users\24509\anaconda3\envs\tts-backend-py311\python.exe`
4. 系统 `python`

已知当前机器上更靠谱的是：

`C:\Users\24509\anaconda3\envs\tts-backend-py311\python.exe`

## 8. 关键文件地图

- [electron/main.js](/x:/TTSStudio/electron/main.js)
  - Electron 主进程
  - 负责窗口创建、IPC、Python worker 生命周期
  - 默认路径配置也在这里

- [electron/preload.js](/x:/TTSStudio/electron/preload.js)
  - 暴露 `studioApi`
  - 包含 `toFileUrl` 兼容修复
  - 已处理过 `pathToFileURL is not a function`

- [backend/worker.py](/x:/TTSStudio/backend/worker.py)
  - 核心推理入口
  - `doctor/init/capabilities/generate/shutdown`
  - 使用 JSON 行协议和 Node 通信

- [renderer/index.html](/x:/TTSStudio/renderer/index.html)
  - 页面结构

- [renderer/app.js](/x:/TTSStudio/renderer/app.js)
  - 前端状态和交互逻辑

- [renderer/styles.css](/x:/TTSStudio/renderer/styles.css)
  - 当前桌面 UI 样式

- [scripts/install-backend.ps1](/x:/TTSStudio/scripts/install-backend.ps1)
  - 安装后端 Python 依赖

## 9. 当前默认路径

- 模型路径：`X:\TTSStudio\models\VoxCPM2-HF`
- 源码路径：`X:\TTSStudio\models\VoxCPM\src`
- 输出路径：`X:\TTSStudio\outputs`

如果用户本地配置里还残留了 OmniVoice 路径，主进程里已经做了迁移兜底，会自动改回 VoxCPM 默认路径。

## 10. 已知技术决策

### 为什么参考音频目前只开放 WAV/FLAC

当前文件选择器只允许：

- `wav`
- `flac`

原因不是模型理论上不能吃 `mp3`，而是当前环境下没有把系统级 `ffmpeg` 作为默认依赖，为了减少音频解码不稳定因素，先把输入格式收紧了。

### 为什么保存链路用 soundfile

之前为避免部分音频编解码依赖问题，输出保存已经改成走 `soundfile.write()`，而不是依赖更复杂的额外编解码链。

## 11. 当前风险和遗留问题

- `Clone` 路径还需要继续验证
- 前端虽然已经可用，但还没做更深一层的产品化打磨
- 项目里仍有 OmniVoice 遗留目录，容易让新接手的人误以为现在还在用 OmniVoice
- `OmniVoiceService` 这个类名还没改名，属于历史遗留命名
- README 之外，以前缺少系统化接力文档，这份文档就是为了解决这个问题

## 12. 推荐的下次工作顺序

如果下次继续开发，建议按这个顺序推进：

1. 先复测当前可用链路
   - `npm.cmd start`
   - 应用内点“检查环境”
   - 点“加载模型”
   - 用 `Auto` 生成一条音频

2. 单独验证 `Clone`
   - 用一段更短、更干净的真实参考音频
   - 优先测试“带 `ref_text` 的 ultimate cloning”
   - 记录是否卡在模型推理、音频预处理，还是参数路径

3. 再继续前端打磨
   - 结果历史
   - 一键复用上次参数
   - 更明确的模式提示和错误提示
   - 更完整的生成进度反馈

4. 最后再考虑扩展格式支持
   - `mp3`
   - `m4a`
   - `ogg`

## 13. 适合继续追的两个方向

### 方向 A：稳定性优先

- 彻底跑通 `Clone`
- 补几组固定测试样本
- 统一错误提示
- 整理模型加载失败和参数失败的报错

### 方向 B：产品体验优先

- 重新设计桌面 UI
- 做参数预设保存
- 做生成历史和结果复播
- 做更明显的状态流和引导

## 14. 一句话总结

这个项目已经不是“从零开始”的阶段了。

现在的真实状态是：

`VoxCPM2 已接入，桌面应用可启动，Auto 已跑通，Clone 还需要继续攻。`
