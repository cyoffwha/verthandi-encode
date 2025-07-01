#!/bin/bash

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check for required tools
echo "Checking for required tools..."

# Check for zenity (Linux only)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if ! command -v zenity &> /dev/null
    then
        echo "Warning: zenity is not installed. The folder selection dialog will not work."
        echo "Install zenity with: sudo apt-get install zenity"
    else
        echo "✓ zenity found"
    fi
fi

# Check for cjxl and djxl
if ! command -v cjxl &> /dev/null
then
    echo "Warning: cjxl is not installed. Image re-encoding will not work."
    echo "Install JPEG XL tools with: sudo apt-get install libjxl-tools"
else
    echo "✓ JPEG XL tools found"
fi

# Check for ffmpeg
if ! command -v ffmpeg &> /dev/null
then
    echo "Warning: ffmpeg is not installed. Video processing will not work."
    echo "Install ffmpeg with: sudo apt-get install ffmpeg"
else
    echo "✓ ffmpeg found"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd front && npm install
cd ..

echo "Setup complete! Run the application with: npm start"
