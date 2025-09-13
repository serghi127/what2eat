#!/bin/bash
# Quick activation script for the what2eat project
cd "$(dirname "$0")"
source .venv/bin/activate
echo "✅ Virtual environment activated for what2eat project"
echo "📍 Current directory: $(pwd)"
echo "🐍 Python version: $(python --version)"
echo "📦 You can now run: python test_scraper.py"
