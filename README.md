# Image Gallery with Re-encoding

This application provides a web interface for browsing and re-encoding images using JXL format for images. The application consists of a Node.js Express backend and a Next.js React frontend.

## Features

- Browse images from your local filesystem using a native folder picker
- View image details like file size and type
- Re-encode images to JPEG XL (JXL) format for better compression
- Visual indication of which images have been re-encoded
- Image viewer modal with original/encoded status indicator

## Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)
- For Linux users: `zenity` for the folder picker dialog
- `cjxl` and `djxl` for JXL encoding/decoding
- `ffmpeg` with libvmaf for video processing and quality assessment

### Installing Prerequisites on Ubuntu/Debian

```bash
# Install zenity for folder selection dialog
sudo apt-get install zenity

# Install JPEG XL tools
sudo apt-get install libjxl-tools

# Install FFmpeg with VMAF support
sudo apt-get install ffmpeg
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm run install-all
```

## Running the Application

Start both the backend and frontend with a single command:

```bash
npm start
```

This will start:
- The Express backend on http://localhost:3001
- The Next.js frontend on http://localhost:3000

## How It Works

1. The application allows you to select a folder using your operating system's native folder picker
2. The backend reads the contents of the folder and sends information about the images to the frontend
3. Images are displayed in a grid with information about file size and encoding status
4. You can click on an image to view it in a larger modal
5. Click the "Reencode" button to process all images in the folder to the JXL format
6. Re-encoded images are stored in a "reencoded" subfolder within the selected folder

## Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: Next.js with React and TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Tailwind CSS
- **Media Processing**: FFmpeg and JPEG XL tools

## Limitations

- Re-encoding large files can take a significant amount of time
- The application needs to be run on the same machine where the files are located
