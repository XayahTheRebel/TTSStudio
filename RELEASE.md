# Lipex-TTS 发布说明

## v0.1.2 — macOS 支持

- **安装包**：`Lipex-TTS-0.1.2-arm64.dmg`（Apple Silicon）/ `Lipex-TTS-0.1.2-x64.dmg`（Intel）
- **平台**：macOS（Apple Silicon 自动使用 MPS 加速，Intel 使用 CPU）

### macOS 安装步骤

1. 下载对应芯片的 dmg，拖动 `Lipex-TTS` 到「应用程序」
2. 安装包未经 Apple 公证，首次打开请**右键点击应用 → 打开**（或在「系统设置 → 隐私与安全性」中允许）
3. macOS 版不需要安装后端运行时，但需要本机有 Python 3 及依赖：

   ```bash
   pip3 install voxcpm modelscope funasr datasets simplejson sortedcontainers
   ```

4. 首次启动会自动下载 VoxCPM2 模型（约 4.6 GB）到用户数据目录，随后自动加载
5. 界面语言可在中文 / English / 日本語 之间切换

---

# Lipex-TTS v0.1.0 发布说明

## 下载

- **安装包**：`release/Lipex-TTS Setup 0.1.0.exe`
- **版本**：0.1.0
- **平台**：Windows 10/11 x64

---

## 系统要求

- Windows 10/11（64 位）
- 首次启动需要联网（用于下载后端 Python 运行时）
- 可选：NVIDIA GPU（用于 CUDA 加速）

---

## 安装步骤

1. 双击运行 `Lipex-TTS Setup 0.1.0.exe`
2. 按安装向导完成安装
3. 首次启动时，应用会检测你的 GPU 并提示安装后端运行环境
4. 选择 **CUDA 版**（推荐，需 NVIDIA 显卡）或 **CPU 版**（兼容所有设备）
5. 等待后端环境安装完成（约 3~4GB 下载）

---

## 准备模型

安装包不包含模型权重。请将 `VoxCPM2` 模型文件放到安装目录的 `models/VoxCPM2-HF/` 下：

```text
Lipex-TTS/
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

### v0.1.0

- 初始版本
- 支持 Auto / Design / Clone 三种模式
- 支持 NVIDIA CUDA 加速
- 支持首次启动自动安装后端运行时
