const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the demo-magician-python-64-master directory
app.use(express.static(path.join(__dirname, 'demo-magician-python-64-master')));

// Store running processes and WebSocket connections
const runningProcesses = new Map();
const wsConnections = new Set();

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    wsConnections.add(ws);
    
    ws.on('close', () => {
        wsConnections.delete(ws);
        console.log('WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        wsConnections.delete(ws);
    });
});

// Broadcast message to all connected clients
function broadcastToClients(message) {
    wsConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    });
}

// Utility function to get the correct Python executable
function getPythonExecutable() {
    const pythonCommands = ['python', 'python3', 'py'];
    
    for (const cmd of pythonCommands) {
        try {
            const result = require('child_process').execSync(`${cmd} --version`, { 
                encoding: 'utf8',
                timeout: 5000 
            });
            if (result.includes('Python')) {
                console.log(`Found Python executable: ${cmd}`);
                return cmd;
            }
        } catch (error) {
            continue;
        }
    }
    console.log('Using default Python executable: python');
    return 'python';
}

// Function to execute Python scripts with real-time output
function executePythonScript(scriptPath, args = [], processId = null) {
    return new Promise((resolve, reject) => {
        const pythonCmd = getPythonExecutable();
        const fullPath = path.join(__dirname, 'demo-magician-python-64-master', scriptPath);
        
        console.log(`Executing: ${pythonCmd} ${fullPath} ${args.join(' ')}`);
        
        // Broadcast start message
        broadcastToClients({
            type: 'process_start',
            script: scriptPath,
            processId: processId
        });
        
        const process = spawn(pythonCmd, [fullPath, ...args], {
            cwd: path.join(__dirname, 'demo-magician-python-64-master'),
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, PYTHONUNBUFFERED: '1' }
        });

        let stdout = '';
        let stderr = '';

        // Store process if ID provided
        if (processId) {
            runningProcesses.set(processId, process);
        }

        process.stdout.on('data', (data) => {
            const output = data.toString();
            stdout += output;
            console.log(`STDOUT: ${output}`);
            
            // Broadcast real-time output
            broadcastToClients({
                type: 'process_output',
                output: output,
                stream: 'stdout',
                processId: processId
            });
        });

        process.stderr.on('data', (data) => {
            const output = data.toString();
            stderr += output;
            console.error(`STDERR: ${output}`);
            
            // Broadcast real-time error output
            broadcastToClients({
                type: 'process_output',
                output: output,
                stream: 'stderr',
                processId: processId
            });
        });

        process.on('close', (code) => {
            console.log(`Process exited with code: ${code}`);
            
            // Remove from running processes
            if (processId) {
                runningProcesses.delete(processId);
            }
            
            // Broadcast completion
            broadcastToClients({
                type: 'process_complete',
                code: code,
                processId: processId,
                success: code === 0
            });
            
            if (code === 0) {
                resolve({ stdout, stderr, code });
            } else {
                reject({ stdout, stderr, code, error: `Process exited with code ${code}` });
            }
        });

        process.on('error', (error) => {
            console.error(`Process error: ${error}`);
            
            // Remove from running processes
            if (processId) {
                runningProcesses.delete(processId);
            }
            
            // Broadcast error
            broadcastToClients({
                type: 'process_error',
                error: error.message,
                processId: processId
            });
            
            reject({ error: error.message });
        });
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
    const processId = `cmd_${command}_${Date.now()}`;
    
    console.log(`Received command: ${command} (Process ID: ${processId})`);
    
    try {
        let result;
        let scriptPath;
        
        switch (command) {
            case '2': // Color Teaching Module
                scriptPath = 'color d&t/python teach_color.py.py';
                result = await executePythonScript(scriptPath, [], processId);
                break;
                
            case '3': // Color Detection & Goal Stack
                try {
                    // First run color detection
                    broadcastToClients({
                        type: 'status_update',
                        message: 'Starting color detection phase...',
                        processId: processId
                    });
                    
                    scriptPath = 'color d&t/detectcolor.py';
                    await executePythonScript(scriptPath, [], `${processId}_detect`);
                    
                    // Small delay between processes
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Then run the Dobot control
                    broadcastToClients({
                        type: 'status_update',
                        message: 'Starting robot control phase...',
                        processId: processId
                    });
                    
                    scriptPath = 'DobotControl.py';
                    result = await executePythonScript(scriptPath, [], `${processId}_control`);
                } catch (error) {
                    throw error;
                }
                break;
                
            case '4': // Cube Position Detection
                try {
                    // First run cube detection
                    broadcastToClients({
                        type: 'status_update',
                        message: 'Starting cube position detection...',
                        processId: processId
                    });
                    
                    scriptPath = 'inverse/cube_detection_dobot.py';
                    await executePythonScript(scriptPath, [], `${processId}_detect`);
                    
                    // Small delay between processes
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Then run the HELLO.py script
                    broadcastToClients({
                        type: 'status_update',
                        message: 'Starting robot positioning...',
                        processId: processId
                    });
                    
                    scriptPath = 'HELLO.py';
                    result = await executePythonScript(scriptPath, [], `${processId}_position`);
                } catch (error) {
                    throw error;
                }
                break;
                
            case '5': // Homography Matrix Calibration
                scriptPath = 'inverse/cam_to_dobot_matrix.npy';
                result = await executePythonScript(scriptPath, [], processId);
                break;
                
            case 'q': // Quit/Terminate
                // Terminate any running processes
                let terminatedCount = 0;
                runningProcesses.forEach((process, id) => {
                    try {
                        process.kill('SIGTERM');
                        runningProcesses.delete(id);
                        terminatedCount++;
                        console.log(`Terminated process: ${id}`);
                    } catch (error) {
                        console.error(`Error terminating process ${id}:`, error);
                    }
                });
                
                // Broadcast termination
                broadcastToClients({
                    type: 'all_processes_terminated',
                    count: terminatedCount
                });
                
                res.json({
                    status: 'success',
                    message: `${terminatedCount} processes terminated successfully`
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
            processId: processId,
            command: command
        });
        
    } catch (error) {
        console.error('Error executing command:', error);
        
        // Broadcast error
        broadcastToClients({
            type: 'command_error',
            error: error.error || error.message || 'Unknown error occurred',
            processId: processId,
            command: command
        });
        
        res.status(500).json({
            status: 'error',
            message: error.error || error.message || 'Unknown error occurred',
            stderr: error.stderr || '',
            command: command,
            processId: processId
        });
    }
});

// API endpoint to get system status
app.get('/api/dobot/status', (req, res) => {
    const processInfo = Array.from(runningProcesses.keys()).map(id => ({
        id,
        startTime: new Date().toISOString() // This would be better tracked from process start
    }));
    
    res.json({
        status: 'online',
        runningProcesses: runningProcesses.size,
        processes: processInfo,
        connectedClients: wsConnections.size,
        timestamp: new Date().toISOString(),
        pythonExecutable: getPythonExecutable()
    });
});

// API endpoint to terminate specific process
app.post('/api/dobot/terminate/:processId', (req, res) => {
    const { processId } = req.params;
    
    if (runningProcesses.has(processId)) {
        try {
            const process = runningProcesses.get(processId);
            process.kill('SIGTERM');
            runningProcesses.delete(processId);
            
            broadcastToClients({
                type: 'process_terminated',
                processId: processId
            });
            
            res.json({
                status: 'success',
                message: `Process ${processId} terminated successfully`
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: `Failed to terminate process ${processId}: ${error.message}`
            });
        }
    } else {
        res.status(404).json({
            status: 'error',
            message: `Process ${processId} not found`
        });
    }
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
            message: 'Failed to read colors data',
            error: error.message
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
            message: 'Failed to read matrix data',
            error: error.message
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
            message: 'Failed to read positions data',
            error: error.message
        });
    }
});

// API endpoint to check Python environment
app.get('/api/dobot/python-check', (req, res) => {
    const pythonCmd = getPythonExecutable();
    
    exec(`${pythonCmd} -c "import cv2, numpy; print('OpenCV:', cv2.__version__); print('NumPy:', numpy.__version__)"`, 
        (error, stdout, stderr) => {
            if (error) {
                res.json({
                    status: 'error',
                    message: 'Python environment check failed',
                    error: error.message,
                    stderr: stderr
                });
            } else {
                res.json({
                    status: 'success',
                    message: 'Python environment is ready',
                    pythonExecutable: pythonCmd,
                    packages: stdout.trim()
                });
            }
        });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: error.message
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
    
    // Close WebSocket connections
    wsConnections.forEach(ws => {
        ws.close();
    });
    
    // Terminate all running processes
    runningProcesses.forEach((process, id) => {
        try {
            process.kill('SIGTERM');
            console.log(`Terminated process ${id}`);
        } catch (error) {
            console.error(`Error terminating process ${id}:`, error);
        }
    });
    
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Dobot Control Web App running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'demo-magician-python-64-master')}`);
    console.log(`🐍 Python executable: ${getPythonExecutable()}`);
    console.log(`🔌 WebSocket server ready for real-time communication`);
    console.log('🤖 Ready to control Dobot Magician!');
    
    // Check Python environment on startup
    const pythonCmd = getPythonExecutable();
    exec(`${pythonCmd} -c "import cv2, numpy; print('✅ Python environment ready')"`, 
        (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Python environment check failed:', error.message);
                console.error('Please ensure OpenCV and NumPy are installed');
            } else {
                console.log('✅ Python environment verified');
            }
        });
});