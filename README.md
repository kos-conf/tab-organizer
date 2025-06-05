# Tab Organizer Chrome Extension

A powerful Chrome extension that helps you organize your tabs into groups automatically and provides quick search functionality.

## Features

- 🔍 **Quick Tab Search**: Press `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux) to instantly search through your tabs
- 🤖 **Auto-Organization**: Automatically groups similar tabs together
- 🎯 **Smart Grouping**: Groups tabs based on domain and content similarity
- ⌨️ **Keyboard Shortcuts**:
  - `Cmd/Ctrl + K`: Quick search
  - `Cmd/Ctrl + O`: Organize tabs
  - `Cmd/Ctrl + E`: Toggle collapse/expand all groups
  - `Cmd/Ctrl + ,`: Open settings
- 📊 **Tab Statistics**: View total tabs and groups at a glance
- ⚙️ **Customizable Settings**: Configure auto-organization and grouping preferences

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/tab-organizer-extension.git
```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right

4. Click "Load unpacked" and select the cloned repository directory

## Usage

1. **Quick Search**:
   - Click the extension icon to open the popup
   - Press `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux)
   - Type to search through your tabs
   - Use arrow keys to navigate results
   - Press Enter to switch to the selected tab

2. **Organizing Tabs**:
   - Click "Organize Tabs" to manually group tabs
   - Enable "Auto-organize" to automatically group new tabs
   - Click the collapse/expand button to toggle group visibility

3. **Settings**:
   - Click the settings icon to customize:
     - Auto-organization preferences
     - Grouping behavior
     - Other extension settings

## Development

### Project Structure
```
tab-organizer-extension/
├── src/
│   ├── background.js        # Background service worker
│   ├── popup/              # Popup UI
│   │   ├── popup.html      # Popup interface
│   │   ├── popup.js        # Popup logic
│   │   ├── popup.css       # Popup styles
│   │   ├── settings.html   # Settings page
│   │   └── settings.js     # Settings logic
│   ├── services/           # Core services
│   │   ├── tabService.js   # Tab management
│   │   └── tabGroupService.js  # Group management
│   └── utils/              # Utility functions
│       └── similarity.js   # Text similarity algorithms
├── manifest.json           # Extension configuration
└── README.md              # This file
```

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add comments for complex logic
- Write clear commit messages
- Test your changes thoroughly
- Update documentation as needed

### Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the version numbers in manifest.json
3. The PR will be merged once you have the sign-off of at least one other developer

## Acknowledgments

- Inspired by the need for better tab management in Chrome 