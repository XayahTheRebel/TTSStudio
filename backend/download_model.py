import argparse
import json
import os
from pathlib import Path


OFFICIAL_ENDPOINT = "https://huggingface.co"


def emit(payload: dict) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def normalize_endpoints(values: list[str]) -> list[str]:
    candidates = [item.strip().rstrip("/") for item in values if item and item.strip()]
    env_endpoint = os.environ.get("HF_ENDPOINT", "").strip().rstrip("/")
    if env_endpoint:
        candidates.append(env_endpoint)
    candidates.append(OFFICIAL_ENDPOINT)

    endpoints = []
    seen = set()
    for endpoint in candidates:
        if endpoint and endpoint not in seen:
            endpoints.append(endpoint)
            seen.add(endpoint)
    return endpoints


def download_from_endpoint(repo_id: str, target_dir: Path, endpoint: str) -> int:
    from huggingface_hub import HfApi, hf_hub_download

    emit(
        {
            "state": "downloading",
            "message": f"Using model download source: {endpoint}",
            "progress": 0,
            "endpoint": endpoint,
        }
    )

    api = HfApi(endpoint=endpoint)
    info = api.model_info(repo_id)
    siblings = [item.rfilename for item in info.siblings if item.rfilename]
    total = len(siblings)

    for index, filename in enumerate(siblings, start=1):
        hf_hub_download(
            repo_id=repo_id,
            filename=filename,
            local_dir=str(target_dir),
            resume_download=True,
            endpoint=endpoint,
        )
        emit(
            {
                "state": "downloading",
                "message": f"Downloaded {filename}",
                "progress": round(index / max(total, 1) * 100, 1),
                "downloadedFiles": index,
                "totalFiles": total,
                "endpoint": endpoint,
            }
        )

    return total


def main() -> int:
    parser = argparse.ArgumentParser(description="Download VoxCPM2 model files to a local directory.")
    parser.add_argument("--repo-id", required=True)
    parser.add_argument("--local-dir", required=True)
    parser.add_argument(
        "--endpoint",
        action="append",
        default=[],
        help="Hugging Face endpoint to try. Can be provided multiple times in priority order.",
    )
    args = parser.parse_args()

    target_dir = Path(args.local_dir).expanduser().resolve()
    target_dir.mkdir(parents=True, exist_ok=True)
    endpoints = normalize_endpoints(args.endpoint)

    emit(
        {
            "state": "downloading",
            "message": f"Downloading model files to {target_dir}",
            "progress": 0,
            "endpoints": endpoints,
        }
    )

    last_error = None
    for index, endpoint in enumerate(endpoints):
        try:
            total = download_from_endpoint(args.repo_id, target_dir, endpoint)
            emit(
                {
                    "state": "complete",
                    "message": f"Model download complete from {endpoint}.",
                    "progress": 100,
                    "downloadedFiles": total,
                    "totalFiles": total,
                    "endpoint": endpoint,
                }
            )
            return 0
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            has_next_endpoint = index < len(endpoints) - 1
            emit(
                {
                    "state": "downloading" if has_next_endpoint else "error",
                    "message": f"Download source failed: {endpoint}. {exc}",
                    "progress": 0,
                    "endpoint": endpoint,
                    "willRetry": has_next_endpoint,
                }
            )

    raise RuntimeError(f"All model download sources failed. Last error: {last_error}")


if __name__ == "__main__":
    raise SystemExit(main())
