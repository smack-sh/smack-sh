#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Set environment variables for better performance
export PYTORCH_ENABLE_MPS_FALLBACK=1
export TOKENIZERS_PARALLELISM=false
export PYTORCH_NO_CUDA_MEMORY_CACHING=1

# Increase file descriptor limits
ulimit -n 100000
ulimit -Sn 100000
ulimit -Hn 100000

# Set Python memory limits (adjust based on your system)
export OMP_NUM_THREADS=1

echo "Starting server with the following settings:"
python --version
pip list | grep -E 'torch|transformers|safetensors|accelerate'

# Start the server with increased timeout and memory limits
echo "Starting server..."
PYTHONPATH=$PYTHONPATH:. python smack-server/main.py
