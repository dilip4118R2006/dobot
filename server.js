const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the demo-magician-python-64-master directory
app.use(express.static(path.join(__dirname, 'demo-magician-python-64-master')));

// Store running processes
const runningProcesses = new Map();

// Utility function to get the correct Python executable
function getPythonExecutable() {
    // Try different Python executables
    const pythonCommands = ['python', 'python3', 'py'];
    
    for (const cmd of pythonCommands) {
        try {
            const result = require('child_process').execSync(`${cmd} --version`, { encoding: 'utf8' });
            if (result.includes('Python')) {
                return cmd;
            }
        } catch (error) {
            continue;
        }
    }
    return 'python'; // Default fallback
}

// Function to execute Python scripts
function executePythonScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
        const pythonCmd = getPythonExecutable();
        const fullPath = path.join(__dirname, 'demo-magician-python-64-master', scriptPath);
        
        console.log(`Executing: ${pythonCmd} ${fullPath} ${args.join(' ')}`);
        
        const process = spawn(pythonCmd, [fullPath, ...args], {
            cwd: path.join(__dirname, 'demo-magician-python-64-master'),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log(`STDOUT: ${data}`);
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
            console.error(`STDERR: ${data}`);
        });

        process.on('close', (code) => {
            console.log(`Process exited with code: ${code}`);
            if (code === 0) {
                resolve({ stdout, stderr, code });
            } else {
                reject({ stdout, stderr, code, error: `Process exited with code ${code}` });
            }
        });

        process.on('error', (error) => {
            console.error(`Process error: ${error}`);
            reject({ error: error.message });
        });

        // Store the process for potential termination
        return process;
    });
}

// Routes

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo-magician-python-64-master', 'index.html'));
});

// API endpoint to handle Dobot commands
app.post('/api/dobot/command', async (req, res) => {
    const { command } = req.body;
    
    console.log(`Received command: ${command}`);
    
    try {
        let result;
        let scriptPath;
        
        switch (command) {
            case '2': // Color Teaching Module
                scriptPath = 'color d&t/python teach_color.py.py';
                result = await executePythonScript(scriptPath);
                break;
                
            case '3': // Color Detection & Goal Stack
                // First run color detection
                scriptPath = 'color d&t/detectcolor.py';
                await executePythonScript(scriptPath);
                
                // Then run the Dobot control
                scriptPath = 'DobotControl.py';
                result = await executePythonScript(scriptPath);
                break;
                
            case '4': // Cube Position Detection
                // First run cube detection
                scriptPath = 'inverse/cube_detection_dobot.py';
                await executePythonScript(scriptPath);
                
                // Then run the HELLO.py script
                scriptPath = 'HELLO.py';
                result = await executePythonScript(scriptPath);
                break;
                
            case '5': // Homography Matrix Calibration
                scriptPath = 'inverse/cam_to_dobot_matrix.npy';
                result = await executePythonScript(scriptPath);
                break;
                
            case 'q': // Quit/Terminate
                // Terminate any running processes
                runningProcesses.forEach((process, id) => {
                    try {
                        process.kill();
                        runningProcesses.delete(id);
                    } catch (error) {
                        console.error(`Error terminating process ${id}:`, error);
                    }
                });
                
                res.json({
                    status: 'success',
                    message: 'All processes terminated successfully'
                });
                return;
                
            default:
                res.status(400).json({
                    status: 'error',
                    message: `Unknown command: ${command}`
                });
                return;
        }
        
        res.json({
            status: 'success',
            message: 'Command executed successfully',
            output: result.stdout,
            command: command
        });
        
    } catch (error) {
        console.error('Error executing command:', error);
        res.status(500).json({
            status: 'error',
            message: error.error || error.message || 'Unknown error occurred',
            stderr: error.stderr || '',
            command: command
        });
    }
});

// API endpoint to get system status
app.get('/api/dobot/status', (req, res) => {
    res.json({
        status: 'online',
        runningProcesses: runningProcesses.size,
        timestamp: new Date().toISOString()
    });
});

// API endpoint to get detected colors
app.get('/api/dobot/colors', (req, res) => {
    try {
        const colorsPath = path.join(__dirname, 'demo-magician-python-64-master', 'color d&t', 'taught_colors.json');
        if (fs.existsSync(colorsPath)) {
            const colors = JSON.parse(fs.readFileSync(colorsPath, 'utf8'));
            res.json({ status: 'success', colors });
        } else {
            res.json({ status: 'success', colors: {} });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to read colors data'
        });
    }
});

// API endpoint to get cube matrices
app.get('/api/dobot/matrices', (req, res) => {
    try {
        const initialPath = path.join(__dirname, 'demo-magician-python-64-master', 'color d&t', 'cube_matrix.json');
        const finalPath = path.join(__dirname, 'demo-magician-python-64-master', 'color d&t', 'final_cube_matrix.json');
        
        let initialMatrix = [];
        let finalMatrix = [];
        
        if (fs.existsSync(initialPath)) {
            initialMatrix = JSON.parse(fs.readFileSync(initialPath, 'utf8'));
        }
        
        if (fs.existsSync(finalPath)) {
            finalMatrix = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
        }
        
        res.json({
            status: 'success',
            initialMatrix,
            finalMatrix
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to read matrix data'
        });
    }
});

// API endpoint to get detected positions
app.get('/api/dobot/positions', (req, res) => {
    try {
        const positionsPath = path.join(__dirname, 'demo-magician-python-64-master', 'inverse', 'detected_positions.json');
        if (fs.existsSync(positionsPath)) {
            const positions = JSON.parse(fs.readFileSync(positionsPath, 'utf8'));
            res.json({ status: 'success', positions });
        } else {
            res.json({ status: 'success', positions: [] });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to read positions data'
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Endpoint not found'
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    
    // Terminate all running processes
    runningProcesses.forEach((process, id) => {
        try {
            process.kill();
            console.log(`Terminated process ${id}`);
        } catch (error) {
            console.error(`Error terminating process ${id}:`, error);
        }
    });
    
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Dobot Control Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'demo-magician-python-64-master')}`);
    console.log(`🐍 Python executable: ${getPythonExecutable()}`);
    console.log('🤖 Ready to control Dobot Magician!');
});