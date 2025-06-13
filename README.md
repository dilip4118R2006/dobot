# Dobot Control Web Backend

A modern web-based interface for controlling the Dobot Magician robotic arm with integrated Python script execution.

## Features

- **Web-based Terminal Interface**: Retro-styled terminal UI for robot control
- **Python Script Integration**: Seamless execution of existing Python control scripts
- **Real-time Status Updates**: Live feedback from robot operations
- **Color Teaching Module**: Interactive color detection and teaching
- **Position Detection**: Advanced cube position detection with homography matrix
- **Goal Stack Processing**: Automated cube stacking based on color detection

## System Requirements

- Node.js (v14 or higher)
- Python 3.x with required packages:
  - OpenCV (`cv2`)
  - NumPy
  - JSON support
- Dobot Magician robotic arm
- USB camera for computer vision

## Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Ensure Python environment is set up:**
   ```bash
   pip install opencv-python numpy
   ```

3. **Connect your Dobot Magician** to the computer via USB

4. **Connect a USB camera** for computer vision operations

## Usage

1. **Start the server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

2. **Open your web browser** and navigate to:
   ```
   http://localhost:3000
   ```

3. **Use the terminal interface** to control the robot:
   - **Color Teaching Module**: Train the system to recognize different colored objects
   - **Color Detection & Goal Stack**: Detect colors and execute stacking operations
   - **Cube Position Detection**: Detect and map cube positions in 3D space
   - **Homography Matrix Calibration**: Calibrate camera-to-robot coordinate transformation

## API Endpoints

### Robot Control
- `POST /api/dobot/command` - Execute robot commands
- `GET /api/dobot/status` - Get system status

### Data Access
- `GET /api/dobot/colors` - Get taught colors data
- `GET /api/dobot/matrices` - Get cube position matrices
- `GET /api/dobot/positions` - Get detected object positions

## Command Mapping

| Command | Function | Python Script |
|---------|----------|---------------|
| `2` | Color Teaching | `color d&t/python teach_color.py.py` |
| `3` | Color Detection & Stack | `color d&t/detectcolor.py` + `DobotControl.py` |
| `4` | Cube Position Detection | `inverse/cube_detection_dobot.py` + `HELLO.py` |
| `5` | Homography Calibration | `inverse/cam_to_dobot_matrix.npy` |
| `q` | Terminate | Stop all processes |

## File Structure

```
├── server.js                          # Main server file
├── package.json                       # Node.js dependencies
├── demo-magician-python-64-master/    # Python scripts and data
│   ├── index.html                     # Web interface
│   ├── DobotControl.py               # Main robot control
│   ├── HELLO.py                      # Position-based control
│   ├── color d&t/                    # Color detection modules
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

## Safety Notes

⚠️ **Important Safety Information:**

- Ensure the robot workspace is clear before executing commands
- Keep emergency stop accessible at all times
- Verify camera calibration before position-based operations
- Monitor robot movements during automated sequences
- Use appropriate lighting for computer vision operations

## Troubleshooting

### Common Issues

1. **Python script execution fails:**
   - Verify Python is installed and accessible
   - Check that required packages (OpenCV, NumPy) are installed
   - Ensure camera is connected and accessible

2. **Robot connection issues:**
   - Verify Dobot is connected via USB
   - Check COM port settings in Python scripts
   - Ensure Dobot DLL files are in the correct location

3. **Camera not detected:**
   - Verify camera is connected and working
   - Check camera index in Python scripts (usually 0 or 1)
   - Ensure no other applications are using the camera

### Debug Mode

Enable detailed logging by setting the environment variable:
```bash
DEBUG=true npm start
```

## License

This project incorporates code developed by Dilip Kumar S and Gokul S at Rajalakshmi Engineering College. Please respect the original copyright notices in the Python files.

## Support

For technical support or questions about the Dobot integration, please refer to the original Python documentation or contact the development team.