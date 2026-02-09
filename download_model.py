import os
import requests
from tqdm import tqdm
from pathlib import Path

MODEL_NAME = "smack-7b"
MODEL_FILES = [
    "config.json",
    "generation_config.json",
    "model-00001-of-00002.safetensors",
    "model-00002-of-00002.safetensors",
    "model.safetensors.index.json",
    "pytorch_model-00001-of-00003.bin",
    "pytorch_model-00002-of-00003.bin",
    "pytorch_model-00003-of-00003.bin",
    "pytorch_model.bin.index.json",
    "special_tokens_map.json",
    "tokenizer_config.json",
    "tokenizer.json",
    "tokenizer.model"
]

BASE_URL = f"https://huggingface.co/collections/ibm/smack-7b-6541f6b4a6e7e6e9b7f8c7b7"
MODEL_DIR = Path("smack-model") / MODEL_NAME
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def download_file(url, destination):
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    total_size = int(response.headers.get('content-length', 0))
    block_size = 1024 * 1024  # 1MB
    
    with open(destination, 'wb') as f, tqdm(
        desc=destination.name,
        total=total_size,
        unit='B',
        unit_scale=True,
        unit_divisor=1024,
    ) as pbar:
        for data in response.iter_content(block_size):
            f.write(data)
            pbar.update(len(data))

def main():
    print(f"Downloading {MODEL_NAME} model files...")
    
    for file in MODEL_FILES:
        dest = MODEL_DIR / file
        if dest.exists():
            print(f"Skipping {file} - already exists")
            continue
            
        print(f"Downloading {file}...")
        url = f"{BASE_URL}/resolve/main/{file}"
        try:
            download_file(url, dest)
        except Exception as e:
            print(f"Failed to download {file}: {e}")
            if dest.exists():
                dest.unlink()

if __name__ == "__main__":
    main()
