# Desktop Conversion Guide

## Overview

This document outlines the conversion of the Expense Sharing web application to a desktop application using Electron.

## What Was Done

### 1. Added Electron Dependencies
- `electron`: Core Electron framework
- `electron-builder`: For packaging and distribution
- `concurrently`: For running multiple processes
- `wait-on`: For waiting for the dev server to be ready

### 2. Created Electron Structure
```
electron/
├── main.js          # Main Electron process
├── preload.js       # Security preload script
├── production.js    # Production build script
└── test.js          # Simple test script
```

### 3. Updated Configuration Files
- `package.json`: Added Electron scripts and build configuration
- `next.config.mjs`: Added Electron compatibility settings
- `electron-builder.json`: Build configuration for different platforms

### 4. Security Implementation
- Context isolation enabled
- Node integration disabled
- Preload script for safe API exposure
- External link handling

## Available Scripts

### Development
```bash
# Start desktop app in development mode
npm run desktop

# Alternative development command
npm run electron-dev

# Test basic Electron setup
npm run electron-test
```

### Production
```bash
# Build and run production version
npm run electron-prod

# Build distributable packages
npm run dist

# Build for specific platform
npm run dist -- --win    # Windows
npm run dist -- --mac    # macOS
npm run dist -- --linux  # Linux
```

## Features

### Desktop-Specific Features
- **Native Window**: Runs as a native desktop application
- **Custom Menu**: Application menu with keyboard shortcuts
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Security**: Proper security settings implemented
- **Auto-Start**: Can be configured to start with the system

### Keyboard Shortcuts
- `Ctrl+N` (Windows/Linux) / `Cmd+N` (macOS): New Expense
- `Ctrl+Q` (Windows/Linux) / `Cmd+Q` (macOS): Quit Application
- `Ctrl+Shift+I`: Open Developer Tools (development mode)

### Menu Structure
- **File**: New Expense, Quit
- **Edit**: Undo, Redo, Cut, Copy, Paste
- **View**: Reload, DevTools, Zoom controls, Fullscreen
- **Window**: Minimize, Close

## Architecture

### Development Mode
1. Next.js development server starts on port 3000
2. Electron app loads the development URL
3. Hot reloading works for both Next.js and Electron

### Production Mode
1. Next.js app is built
2. Production server starts
3. Electron app loads the production URL
4. App is packaged with electron-builder

## Build Process

### Development Build
```bash
npm run desktop
```
- Starts Next.js dev server
- Launches Electron app
- Enables hot reloading

### Production Build
```bash
npm run dist
```
- Builds Next.js app
- Packages with Electron
- Creates platform-specific installers

## Distribution

### Windows
- Creates `.exe` installer
- Includes desktop and start menu shortcuts
- Allows custom installation directory

### macOS
- Creates `.dmg` file
- Supports both Intel and Apple Silicon
- Categorized as Finance app

### Linux
- Creates `.AppImage` file
- Portable executable
- Categorized as Finance app

## Security Considerations

### Implemented Security Measures
- Context isolation enabled
- Node integration disabled
- Remote module disabled
- Web security enabled
- Preload script for safe API exposure
- External link handling

### Best Practices
- No direct Node.js access from renderer
- All IPC communication through preload script
- External links open in default browser
- Proper process cleanup on exit

## Troubleshooting

### Common Issues

1. **Port 3000 Already in Use**
   ```bash
   # Kill process using port 3000
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Build Fails**
   ```bash
   # Clean and reinstall
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

3. **Electron App Won't Start**
   - Check console for error messages
   - Ensure Next.js server is running
   - Verify all dependencies are installed

### Development Tips
- Use `Ctrl+Shift+I` to open DevTools
- Next.js changes auto-reload
- Electron changes require app restart
- Check `electron/main.js` for window configuration

## Performance Considerations

### Optimizations
- Lazy loading of components
- Efficient state management
- Proper cleanup of event listeners
- Memory leak prevention

### Monitoring
- Use DevTools for performance profiling
- Monitor memory usage
- Check for memory leaks in production

## Future Enhancements

### Potential Improvements
- Auto-update functionality
- Offline support
- Native notifications
- System tray integration
- File system integration
- Print functionality
- Export to PDF/Excel

### Advanced Features
- Multi-window support
- Custom window themes
- Global shortcuts
- Drag and drop support
- Native file dialogs

## Migration Notes

### From Web to Desktop
- All existing functionality preserved
- No changes required to React components
- Backend (Convex) remains unchanged
- Authentication flow unchanged
- Database operations unchanged

### Breaking Changes
- None - this is a wrapper around the existing web app
- All existing features work as before
- Same user experience with desktop benefits

## Support

For issues related to:
- **Electron**: Check Electron documentation
- **Next.js**: Check Next.js documentation
- **Build Process**: Check electron-builder documentation
- **App-specific**: Check the main README.md

## License

Same as the original project. Electron is licensed under MIT. 