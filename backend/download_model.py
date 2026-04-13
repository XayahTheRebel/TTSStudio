import argparse
import json
from pathlib import Path


def emit(payload: dict) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Download VoxCPM2 model files to a local directory.")
    parser.add_argument("--repo-id", required=True)
    parser.add_argument("--local-dir", required=True)
    args = parser.parse_args()

    from huggingface_hub import HfApi, hf_hub_download

    target_dir = Path(args.local_dir).expanduser().resolve()
    target_dir.mkdir(parents=True, exist_ok=True)

    emit(
      {
          "state": "downloading",
          "message": f"开始下载模型到 {target_dir}",
          "progress": 0,
      }
    )

    api = HfApi()
    info = api.model_info(args.repo_id)
    siblings = [item.rfilename for item in info.siblings if item.rfilename]
    total = len(siblings)

    for index, filename in enumerate(siblings, start=1):
        hf_hub_download(
            repo_id=args.repo_id,
            filename=filename,
            local_dir=str(target_dir),
            resume_download=True,
        )
        emit(
            {
                "state": "downloading",
                "message": f"已下载 {filename}",
                "progress": round(index / max(total, 1) * 100, 1),
                "downloadedFiles": index,
                "totalFiles": total,
            }
        )

    emit(
        {
            "state": "complete",
            "message": "模型文件下载完成。",
            "progress": 100,
            "downloadedFiles": total,
            "totalFiles": total,
        }
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
