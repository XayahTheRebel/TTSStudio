<p align="center">
  <img src="icon.png" alt="VoxCPM Studio logo" width="128" />
</p>

# VoxCPM Studio

[English](README.en.md) | [简体中文](README.md) | 日本語

`VoxCPM Studio` は、`Electron + Node.js + python-shell + Python ワーカー` で構築されたローカルデスクトップ TTS アプリで、ローカルの `VoxCPM2` モデルを実行します。

本プロジェクトは OmniVoice から `OpenBMB/VoxCPM` に移行済みで、既定では以下のローカルリソースを使用します：

- ソースディレクトリ：`models/VoxCPM/src`
- モデルディレクトリ：`models/VoxCPM2-HF`
- 出力ディレクトリ：`outputs`

## 現在のステータス

- `Auto` モード：動作確認済み
- `Design` モード：フロントエンドとバックエンドが接続済み、UI 対応済み
- `Clone` モード：接続済みだが、ローカルスモークテストはまだ安定していない
- デスクトップアプリ：起動、ローカルモデルの読み込み、音声の生成・保存が可能
- 生成された音声は `outputs` ディレクトリに自動保存される
- 音声生成中はプログレスバーがリアルタイムで表示される
- UI 言語は中国語・英語・日本語を切り替え可能（デバイス情報の右側の「言語」パネル）

まず手軽に試したい場合は、最も安定している `Auto` モードから始めてください。

## プラットフォーム対応

**Windows** と **macOS** の両方で動作します：

- **Windows**：CUDA（NVIDIA GPU）または CPU
- **macOS**：Apple Silicon は自動的に **MPS** バックエンドを使用、Intel Mac は CPU にフォールバック

デバイス選択は自動です：`cuda → mps → cpu`。

## プロジェクト構成

- `electron/`
  - `main.js`：Electron メインプロセス、Python ワーカーのライフサイクル、IPC
  - `preload.js`：レンダラーに `studioApi` を公開
- `renderer/`
  - `index.html`：デスクトップ UI
  - `app.js`：ページロジック、フォーム状態、`studioApi` の呼び出し
  - `styles.css`：スタイル
- `backend/`
  - `worker.py`：常駐 Python 推論プロセス、JSON プロトコルで Node と通信
- `scripts/`
  - `install-backend.ps1`：バックエンド Python 依存関係のインストール（Windows）
  - `start-app.ps1`：Node 依存関係のインストールとアプリ起動（Windows）
- `models/`
  - `VoxCPM/`：公式ソースリポジトリ
  - `VoxCPM2-HF`：ローカル Hugging Face モデル重み
- `outputs/`
  - 生成された音声の出力ディレクトリ

## Python 環境

アプリは以下の順で Python インタープリタを解決します：

1. アプリ設定に保存された `pythonPath`
2. プロジェクトの仮想環境：`.venv/Scripts/python.exe`（Windows）または `.venv/bin/python3`（macOS/Linux）
3. `tts-backend-py311` という名前の conda 環境（存在する場合）
4. システムの `python`（Windows）または `python3`（macOS/Linux）

## インストール

Node 依存関係のインストール：

```bash
npm install
```

### バックエンド依存関係 — Windows

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backend.ps1
```

CPU 版 Torch のみをインストールする場合：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-backend.ps1 -TorchTarget cpu
```

### バックエンド依存関係 — macOS

```bash
pip3 install voxcpm modelscope funasr datasets simplejson sortedcontainers
```

環境の確認：

```bash
python3 backend/worker.py --doctor
```

出力の `allCoreDepsReady: true` はバックエンドの準備完了を意味します。

### モデル重み

初回起動時に `openbmb/VoxCPM2`（約 4.6 GB）が自動的に `models/VoxCPM2-HF` にダウンロードされます。`hf-mirror.com` を優先し、失敗時は `huggingface.co` にフォールバックします。手動ダウンロードも可能です：

```bash
python3 backend/download_model.py --repo-id openbmb/VoxCPM2 --local-dir models/VoxCPM2-HF --endpoint https://hf-mirror.com
```

## 起動

```bash
npm start
```

## 初回実行の推奨手順

1. 自動の環境チェックとモデル読み込みを待つ（「モデル準備完了」表示）
2. まず `Auto` モードで 1 クリップ生成する

最初のテストテキストの例：

```text
Hello world from VoxCPM Studio.
```

## モード説明

### Auto

テキストを入力するだけのシンプルな読み上げモード。

### Design

自然言語で声質を記述します。例：

```text
A young woman, gentle and sweet voice, slightly smiling, British accent
```

### Clone

参照音声をアップロードして声をクローンします。

参照テキストも併せて入力するとより安定します：

- `ref_text` あり：アルティメットクローンに近い動作
- `ref_text` なし：参照音声駆動のクローンパス

## 便利なコマンド

バックエンド環境の確認：

```bash
python3 backend/worker.py --doctor
```

## 音声フォーマットについて

参照音声のファイル選択は現在以下のみ対応：

- `wav`
- `flac`

これは `mp3` デコードチェーンの不確実性を避けるためで、システムの `ffmpeg` は本プロジェクトの既定依存関係ではありません。

## 出力の動作

- 生成されたクリップはすべてタイムスタンプ付きファイル名で `outputs` ディレクトリに**自動保存**されます
- 生成ボタンの下のプログレスバーが進捗をリアルタイム表示します。起動時に短いサンプルで端末の推論速度を校正し、「音声単位」（漢字・かな、英単語、数字、ポーズを重み付け）で各生成の実進捗と所要時間を推定、生成のたびに校正値を自動補正します
- 結果メニューの「名前を付けて保存」で任意の場所にコピーをエクスポートできます

## 既知の問題

- `Clone` モードはさらなる検証が必要で、完全に安定しているとは言えません
- プロジェクト内に初期の OmniVoice 関連モデルディレクトリが残っている場合がありますが、現在のパイプラインの一部ではありません
- `electron/main.js` のサービスクラス名は依然 `OmniVoiceService` ですが、命名上の名残であり動作には影響しません

## 引き継ぎドキュメント

より詳しい引き継ぎ情報・リスク・次のステップは以下を参照：

- [docs/HANDOFF.md](docs/HANDOFF.md)
