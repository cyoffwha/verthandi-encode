// server.js (Node.js Local Service)
const express = require('express');
const { exec } = require('child_process'); // For executing system commands
const fs = require('fs/promises'); // Use fs.promises for async/await file operations
const path = require('path'); // Node.js path module
const app = express();
const port = 3001; // This must match the port in your HTML app!

// Middleware to parse JSON request bodies
app.use(express.json());

// Enable CORS for development: Allows your HTML file to fetch from this server.
// IMPORTANT: In a production environment, replace '*' with the specific origin(s) of your frontend application
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

/**
 * Endpoint to launch a native folder selection dialog on the server's OS.
 * The full path will be captured and processed on the server-side.
 */
app.post('/launch-folder-selector', (req, res) => {
    let command; // Command to execute based on OS

    // Determine the appropriate command-line tool for folder selection
    switch (process.platform) {
        case 'darwin': // macOS
            command = `osascript -e 'tell application "Finder" to choose folder as alias'`;
            break;
        case 'win32': // Windows
            command = `powershell -command "Add-Type -AssemblyName System.Windows.Forms; $folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog; $folderBrowser.Description = 'Select a folder'; if ($folderBrowser.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $folderBrowser.SelectedPath }"`;
            break;
        case 'linux': // Linux
            command = `zenity --file-selection --directory`;
            break;
        default:
            return res.status(500).json({ message: 'Unsupported operating system for native dialog.' });
    }

    console.log(`Node.js: Attempting to launch native folder selector using command: ${command}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Node.js: Error executing command: ${error.message}`);
            return res.status(500).json({
                message: 'Failed to launch folder selector or user cancelled.',
                detail: stderr.trim() || error.message
            });
        }
        if (stderr) {
            console.warn(`Node.js: Stderr from folder selector: ${stderr.trim()}`);
        }

        const fullPath = stdout.trim();
        console.log(`Node.js: Successfully received full path: "${fullPath}"`);

        res.status(200).json({
            message: `Folder selected on the server!`,
            folderName: fullPath || 'Unknown Folder', // Sending the full path directly
            fullPath: fullPath || '' // Still providing fullPath separately
        });
    });
});

/**
 * New endpoint to list files in a given folder path.
 * Receives the full folder path from the frontend and returns file details.
 */
app.post('/list-files', async (req, res) => {
    const { folderPath } = req.body;

    if (!folderPath) {
        return res.status(400).json({ message: 'folderPath is required in the request body.' });
    }

    console.log(`Node.js: Attempting to list files in folder: "${folderPath}"`);

    try {
        const dirents = await fs.readdir(folderPath, { withFileTypes: true });
        const filesInfo = [];

        for (const dirent of dirents) {
            try {
                const fullItemPath = path.join(folderPath, dirent.name);
                const stats = await fs.stat(fullItemPath);

                filesInfo.push({
                    name: dirent.name,
                    type: dirent.isDirectory() ? 'folder' : 'file',
                    size: dirent.isDirectory() ? 'N/A' : stats.size // Size in bytes for files, N/A for folders
                });
            } catch (statError) {
                console.warn(`Node.js: Could not get stats for ${dirent.name}: ${statError.message}`);
                filesInfo.push({
                    name: dirent.name,
                    type: dirent.isDirectory() ? 'folder' : 'unknown',
                    size: 'Error'
                });
            }
        }
        res.status(200).json({ files: filesInfo });
    } catch (error) {
        console.error(`Node.js: Error listing files in "${folderPath}":`, error.message);
        if (error.code === 'ENOENT') {
            res.status(404).json({ message: `Folder not found: "${folderPath}"` });
        } else if (error.code === 'EACCES') {
            res.status(403).json({ message: `Permission denied to access folder: "${folderPath}"` });
        } else {
            res.status(500).json({ message: `Failed to read folder contents: ${error.message}` });
        }
    }
});

app.get('/get-image/:folderPath/:fileName', (req, res) => {
    const { folderPath, fileName } = req.params;
    const decodedFolderPath = decodeURIComponent(folderPath);
    const imagePath = path.join(decodedFolderPath, fileName);
    res.sendFile(imagePath);
});

app.post('/reencode-media', async (req, res) => {
    const { folderPath } = req.body;

    if (!folderPath) {
        return res.status(400).json({ message: 'folderPath is required' });
    }

    const outputFolder = path.join(folderPath, 'reencoded');
    try {
        await fs.mkdir(outputFolder, { recursive: true });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create output folder' });
    }

    const files = await fs.readdir(folderPath);
    const results = [];

    for (const file of files) {
        const fullPath = path.join(folderPath, file);
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) continue;

        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext);
        let command;
        let outputPath;

        if (['.mp4', '.mkv', '.avi', '.mov'].includes(ext)) {
            outputPath = path.join(outputFolder, `${baseName}.mkv`);
            command = `ffmpeg -i \"${fullPath}\" -c:v libsvtav1 -crf 28 -preset 9 -c:a copy \"${outputPath}\"`;
        } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
            outputPath = path.join(outputFolder, `${baseName}.jxl`);
            command = `cjxl \"${fullPath}\" \"${outputPath}\" -d 1.0  --lossless_jpeg=0  --effort=7`;
        } else {
            continue;
        }

        try {
            await new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error re-encoding ${file}: ${stderr}`);
                        results.push({ file, status: 'failed', error: stderr });
                        reject(error);
                    } else {
                        results.push({ file, status: 'success', outputPath });
                        resolve(stdout);
                    }
                });
            });

            // Post-processing
            if (results.find(r => r.file === file && r.status === 'success')) {
                const oldStats = await fs.stat(fullPath);
                const newStats = await fs.stat(outputPath);
                const result = results.find(r => r.file === file);
                result.oldSize = oldStats.size;
                result.newSize = newStats.size;

                console.log(`Size comparison for ${file}: Original: ${(oldStats.size / 1024 / 1024).toFixed(2)} MB, Re-encoded: ${(newStats.size / 1024 / 1024).toFixed(2)} MB`);

                if (['.mp4', '.mkv', '.avi', '.mov'].includes(ext)) {
                    const vmafCommand = `ffmpeg -i \"${outputPath}\" -i \"${fullPath}\" -lavfi libvmaf -f null -`;
                    await new Promise((resolve, reject) => {
                        exec(vmafCommand, (error, stdout, stderr) => {
                            if (error) {
                                console.error(`Error calculating VMAF for ${file}: ${stderr}`);
                                reject(error);
                            } else {
                                const vmafMatch = stderr.match(/VMAF score: ([\d\.]+)/);
                                if (vmafMatch && vmafMatch[1]) {
                                    console.log(`VMAF score for ${file}: ${vmafMatch[1]}`);
                                }
                                resolve(stdout);
                            }
                        });
                    });
                } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
                    const decodedPath = path.join(outputFolder, `${baseName}_decoded.png`);
                    const decodeCommand = `djxl \"${outputPath}\" \"${decodedPath}\"`;
                    await new Promise((resolve, reject) => {
                        exec(decodeCommand, (error, stdout, stderr) => {
                            if (error) {
                                console.error(`Error decoding ${outputPath}: ${stderr}`);
                                reject(error);
                            } else {
                                resolve(stdout);
                            }
                        });
                    });

                    const vmafCommand = `ffmpeg -i \"${fullPath}\" -i \"${decodedPath}\" -lavfi libvmaf -f null -`;
                    await new Promise((resolve, reject) => {
                        exec(vmafCommand, (error, stdout, stderr) => {
                            if (error) {
                                console.error(`Error calculating VMAF for ${file}: ${stderr}`);
                                reject(error);
                            } else {
                                const vmafMatch = stderr.match(/VMAF score: ([\d\.]+)/);
                                if (vmafMatch && vmafMatch[1]) {
                                    console.log(`VMAF score for ${file}: ${vmafMatch[1]}`);
                                }
                                resolve(stdout);
                            }
                        });
                    });
                    await fs.unlink(decodedPath);
                }
            }
        } catch (error) {
            // error already handled
        }
    }

    res.status(200).json({ message: 'Re-encoding process completed', results });
});


// Start the Node.js server
app.listen(port, () => {
    console.log(`Node.js local service listening on http://localhost:${port}`);
    console.log('\nTo run this service:');
    console.log('1. Save this code as `server.js` in a new directory.');
    console.log('2. Open your terminal in that directory.');
    console.log('3. Run `npm install express`');
    console.log('4. Run `node server.js`');
    console.log('\nNote for Linux users: Ensure `zenity` is installed (`sudo apt-get install zenity` on Debian/Ubuntu).');
});
