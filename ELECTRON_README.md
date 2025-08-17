# Expense Sharing App - Desktop Version

This is the desktop version of the Expense Sharing App built with Electron and Next.js.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

### Running in Development Mode

1. Start the development server and Electron app:
```bash
npm run electron-dev
```

This will:
- Start the Next.js development server on `http://localhost:3000`
- Wait for the server to be ready
- Launch the Electron app

### Running Electron Only (Production Build)

1. First build the Next.js app:
```bash
npm run build
```

2. Then run Electron:
```bash
npm run electron
```

## Building for Distribution

### Build for Current Platform

```bash
npm run dist
```

This will:
- Build the Next.js app
- Package it with Electron
- Create distributable files in the `dist` folder

### Build for Specific Platform

```bash
# For Windows
npm run dist -- --win

# For macOS
npm run dist -- --mac

# For Linux
npm run dist -- --linux
```

## Project Structure

```
├── electron/
│   ├── main.js          # Main Electron process
│   └── preload.js       # Preload script for security
├── app/                 # Next.js app directory
├── components/          # React components
├── convex/             # Backend functions
├── public/             # Static assets
└── electron-builder.json # Electron build configuration
```

## Features

- **Native Desktop App**: Runs as a native desktop application
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Native Menu**: Custom application menu with shortcuts
- **Security**: Proper security settings with context isolation
- **Auto-Updates**: Ready for auto-update implementation

## Keyboard Shortcuts

- `Ctrl+N` (Windows/Linux) or `Cmd+N` (macOS): New Expense
- `Ctrl+Q` (Windows/Linux) or `Cmd+Q` (macOS): Quit Application

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**: Make sure no other Next.js app is running on port 3000
2. **Build fails**: Ensure all dependencies are installed with `npm install`
3. **App doesn't start**: Check the console for error messages

### Development Tips

- Use `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS) to open DevTools
- The app will automatically reload when you make changes to the Next.js code
- Electron will need to be restarted manually for changes to `electron/main.js`

## Distribution

The built application will be available in the `dist` folder:

- **Windows**: `.exe` installer
- **macOS**: `.dmg` file
- **Linux**: `.AppImage` file

## Security

The app implements several security measures:

- Context isolation enabled
- Node integration disabled
- Remote module disabled
- Web security enabled
- Preload script for safe API exposure

## License

Same as the original project. 