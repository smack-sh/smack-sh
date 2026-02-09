from huggingface_hub import snapshot_download
import os

# Model repository ID on Hugging Face
REPO_ID = "ibm/smack-7b"

# Local directory to save the model
LOCAL_DIR = "smack-model/smack-7b"

def main():
    print(f"Downloading {REPO_ID} model...")
    
    # Create directory if it doesn't exist
    os.makedirs(LOCAL_DIR, exist_ok=True)
    
    try:
        # Download the model files
        snapshot_download(
            repo_id=REPO_ID,
            local_dir=LOCAL_DIR,
            local_dir_use_symlinks=False,
            resume_download=True,
            allow_patterns=["*.json", "*.model", "*.safetensors", "*.bin", "*.md", "LICENSE", "*.txt"]
        )
        print("Model downloaded successfully!")
    except Exception as e:
        print(f"Error downloading model: {e}")
        raise

if __name__ == "__main__":
    main()
