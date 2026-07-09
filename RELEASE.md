# TTSStudio v0.1.1 发布说明

## 下载

- **安装包**：`release/TTSStudio Setup 0.1.1.exe`
- **版本**：0.1.1
- **平台**：Windows 10/11 x64

---

## 系统要求

- Windows 10/11（64 位）
- 首次启动需要联网（用于下载后端 Python 运行时）
- 可选：NVIDIA GPU（用于 CUDA 加速）

---

## 安装步骤

1. 双击运行 `TTSStudio Setup 0.1.1.exe`
2. 按安装向导完成安装
3. 首次启动时，应用会检测你的 GPU 并提示安装后端运行环境
4. 选择 **CUDA 版**（推荐，需 NVIDIA 显卡）或 **CPU 版**（兼容所有设备）
5. 等待后端环境安装完成（约 3~4GB 下载）

---

## 准备模型

安装包不包含模型权重。请将 `VoxCPM2` 模型文件放到安装目录的 `models/VoxCPM2-HF/` 下：

```text
TTSStudio/
├── models/
│   └── VoxCPM2-HF/
│       ├── config.json
│       ├── model.safetensors
│       ├── audiovae.pth
│       ├── tokenizer.json
│       └── ...
```

或者通过应用内的模型下载功能获取。

---

## 首次使用

1. 打开应用
2. 点击 **检查环境**
3. 点击 **加载模型**，等待「模型已就绪」
4. 切换到 **Auto** 模式，输入文本
5. 点击 **生成**

---

## 功能特性

- **Auto 模式**：输入文本直接生成语音
- **Design 模式**：用自然语言描述音色
- **Clone 模式**：上传参考音频克隆声音（实验性）
- **多语言 UI**：支持中文、英文、日文界面切换
- **跨平台代码**：已完成 Windows / macOS / Linux 适配

---

## 已知问题

- **Clone 模式** 已接入但稳定性仍在验证，建议优先使用 Auto 模式
- 参考音频仅支持 `wav` / `flac` 格式
- 首次启动必须联网下载后端运行时

---

## 技术栈

- Electron
- Node.js
- Python 3.11
- PyTorch
- VoxCPM2

---

## 更新日志

### v0.1.1

- 新增 macOS / Linux 平台适配
- 新增 UI 语言切换（中/英/日）
- 新增日文 README
- 修复开发模式下窗口图标不显示的问题
- 优化运行时安装进度条显示
- 改进生成结果自动保存逻辑
- 更新 .gitignore 规则

### v0.1.0

- 初始版本
- 支持 Auto / Design / Clone 三种模式
- 支持 NVIDIA CUDA 加速
- 支持首次启动自动安装后端运行时
