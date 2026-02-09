#!/bin/bash

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip and install requirements
pip install --upgrade pip
pip install numpy==1.26.4  # Specific version compatible with PyTorch 2.1.2
pip install -r smack-server/requirements.txt

# Install additional required packages
pip install safetensors==0.4.1  # Specific version known to work with transformers 4.36.2

# Verify installations
pip list | grep -E 'torch|numpy|transformers|safetensors'
