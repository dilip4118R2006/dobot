# Dobot Control Web Application

A comprehensive web-based interface for controlling the Dobot Magician robotic arm with real-time Python script execution and WebSocket communication.

## 🚀 Features

### Web Interface
- **Retro Terminal UI**: Cyberpunk-styled interface with scan lines and animations
- **Real-time Communication**: WebSocket integration for live process monitoring
- **Process Management**: Track and manage multiple Python processes
- **Status Indicators**: Visual feedback for system status and connections

### Robot Control Modules
1. **Color Teaching Module**: Interactive color detection training
2. **Color Detection & Goal Stack**: Automated cube stacking based on color recognition
3. **Cube Position Detection**: 3D position mapping with computer vision
4. **Homography Matrix Calibration**: Camera-to-robot coordinate transformation

### Backend Features
- **Python Script Integration**: Seamless execution of existing Python control scripts
- **Real-time Output Streaming**: Live console output via WebSocket
- **Process Monitoring**: Track running processes and system status
- **Error Handling**: Comprehensive error reporting and recovery
- **API Endpoints**: RESTful API for data access and control

## 📋 System Requirements

### Software Dependencies
- **Node.js** (v14 or higher)
- **Python 3.x** with packages:
  - OpenCV (`pip install opencv-python`)
  - NumPy (`pip install numpy`)
  - JSON support (built-in)

### Hardware Requirements
- **Dobot Magician** robotic arm
- **USB Camera** for computer vision operations
- **USB Connection** to Dobot

## 🛠️ Installation

1. **Clone or extract the project files**

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Verify Python environment:**
   ```bash
   python -c "import cv2, numpy; print('Environment ready')"
   ```

4. **Connect hardware:**
   - Connect Dobot Magician via USB
   - Connect USB camera
   - Ensure proper lighting for computer vision

## 🚀 Usage

### Starting the Application

1. **Start the web server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

2. **Open your web browser:**
   ```
   http://localhost:3000
   ```

3. **Verify connections:**
   - Check WebSocket status indicator (green = connected)
   - Verify Python environment via system status

### Using the Interface

#### Color Teaching Module
- Click "COLOR TEACHING MODULE" button
- Use mouse to click on colored objects in camera view
- Enter color names when prompted
- Colors are automatically saved to `taught_colors.json`

#### Color Detection & Goal Stack
- Ensure colors are taught first
- Click "COLOR DETECTION & GOAL STACK" button
- System will detect cube positions and execute stacking sequence
- Monitor progress in real-time console

#### Cube Position Detection
- Click "CUBE POSITION DETECTION" button
- System captures single frame and detects all objects
- Positions are saved and robot executes pickup sequence

#### Homography Matrix Calibration
- Click "HOMOGRAPHY MATRIX CALIBRATION" button
- System calibrates camera-to-robot coordinate transformation
- Matrix is saved for future position calculations

## 🔧 API Reference

### Robot Control
```http
POST /api/dobot/command
Content-Type: application/json

{
  "command": "2"  // Command codes: 2, 3, 4, 5, q
}
```

### System Status
```http
GET /api/dobot/status
```

### Data Access
```http
GET /api/dobot/colors        # Taught colors
GET /api/dobot/matrices      # Cube position matrices  
GET /api/dobot/positions     # Detected object positions
GET /api/dobot/python-check  # Python environment status
```

### Process Management
```http
POST /api/dobot/terminate/:processId  # Terminate specific process
```

## 📁 File Structure

```
├── server.js                          # Main web server
├── package.json                       # Node.js dependencies
├── public/
│   └── index.html                     # Web interface
├── demo-magician-python-64-master/    # Python scripts
│   ├── DobotControl.py               # Main robot control
│   ├── HELLO.py                      # Position-based control
│   ├── color d&t/                    # Color detection
│   │   ├── detectcolor.py
│   │   ├── python teach_color.py.py
│   │   ├── taught_colors.json
│   │   ├── cube_matrix.json
│   │   └── final_cube_matrix.json
│   └── inverse/                      # Position detection
│       ├── cube_detection_dobot.py
│       ├── cam_to_dobot_matrix.npy
│       └── detected_positions.json
```

## 🔄 WebSocket Events

### Client → Server
- Connection establishment
- Real-time status updates

### Server → Client
```javascript
{
  "type": "process_start",
  "script": "script_name.py",
  "processId": "unique_id"
}

{
  "type": "process_output", 
  "output": "console_output",
  "stream": "stdout|stderr",
  "processId": "unique_id"
}

{
  "type": "process_complete",
  "success": true,
  "code": 0,
  "processId": "unique_id"
}
```

## ⚠️ Safety Guidelines

### Robot Safety
- **Clear Workspace**: Ensure robot workspace is free of obstacles
- **Emergency Stop**: Keep emergency stop accessible
- **Monitor Operations**: Always supervise automated sequences
- **Proper Calibration**: Verify camera calibration before position operations

### System Safety
- **Process Monitoring**: Monitor running processes via web interface
- **Error Handling**: Check console output for errors
- **Connection Status**: Verify WebSocket connection status
- **Resource Management**: Terminate unused processes

## 🐛 Troubleshooting

### Common Issues

1. **Python Environment**
   ```bash
   # Check Python installation
   python --version
   
   # Install missing packages
   pip install opencv-python numpy
   
   # Test environment
   python -c "import cv2, numpy; print('OK')"
   ```

2. **Camera Issues**
   - Verify camera connection and permissions
   - Check camera index in Python scripts (0, 1, 2...)
   - Ensure no other applications are using camera

3. **Robot Connection**
   - Verify USB connection to Dobot
   - Check COM port in Python scripts
   - Ensure Dobot DLL files are accessible

4. **WebSocket Connection**
   - Check browser console for errors
   - Verify server is running on correct port
   - Check firewall settings

### Debug Mode

Enable detailed logging:
```bash
DEBUG=true npm start
```

### Log Analysis
- **Green text**: Normal output
- **Red text**: Errors
- **Blue text**: System information
- **Process indicators**: Active process count

## 📊 Performance Optimization

### System Performance
- **Process Limits**: Monitor active process count
- **Memory Usage**: Console output is limited to 100 entries
- **Connection Management**: WebSocket auto-reconnection

### Computer Vision
- **Lighting**: Ensure consistent, bright lighting
- **Camera Position**: Stable camera mounting
- **Calibration**: Regular homography matrix updates

## 🔐 Security Considerations

- **Local Network**: Application designed for local network use
- **Process Control**: Automatic process termination on shutdown
- **Error Isolation**: Errors contained within process boundaries
- **Resource Cleanup**: Automatic cleanup of terminated processes

## 📝 License

This project incorporates code developed by Dilip Kumar S and Gokul S at Rajalakshmi Engineering College. Original copyright notices are preserved in Python files.

## 🤝 Support

For technical support:
1. Check console output for detailed error messages
2. Verify all system requirements are met
3. Review troubleshooting section
4. Check WebSocket connection status

---

**Ready to control your Dobot Magician with style! 🤖✨**