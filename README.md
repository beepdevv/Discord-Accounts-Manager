# Discord Manager

A comprehensive Discord account management and administration tool with a modern web interface.

## 🚀 Features

### 📊 Account Management
- **Token Storage**: Securely store and manage Discord account tokens
- **Account Validation**: Automatic token validation and status checking
- **Bulk Operations**: Import/export multiple accounts at once
- **Real-time Updates**: Live account status and information updates
- **Search & Filter**: Advanced filtering and search capabilities

### 🛠️ Account Tools
- **Profile Management**: Edit user profiles, avatars, and settings
- **Relationship Manager**: Block/unblock users, manage friendships
- **Guild Operations**: Join/leave Discord servers
- **Mass Messaging**: Send DMs to multiple users
- **Token Cleaner**: Automated account cleanup and maintenance

### 🔧 Builder & Compilation
- **C++ Compilation**: Build custom executables from C++ source
- **Assembly Info**: Configure executable metadata and properties
- **Icon Support**: Custom executable icons (.ico format)
- **Resource Management**: Integrated resource compilation

### 🎨 Modern UI/UX
- **Dark Theme**: Sleek, professional dark interface
- **Responsive Design**: Works on all screen sizes
- **Draggable Windows**: Modal windows with drag functionality
- **Real-time Updates**: Live status indicators and notifications
- **Keyboard Shortcuts**: Enhanced user experience

### 🔧 Configuration
- **Webhook Integration**: Global notification system
- **Auto-refresh**: Configurable data refresh intervals
- **Proxy Support**: HTTP proxy configuration
- **Persistent Settings**: Settings saved across sessions


## 📁 Project Structure

```
Root/
├── DiscordManager/
│   ├── backend/                 # FastAPI Python backend
│   │   ├── main.py              # Main API server
│   │   └── Exe/                 # C++ source files
│   │       ├── injection.cpp    # Main injection source
│   │       ├── payload.cpp      # Payload source
│   │       └── stub.exe         # Compiled executable
│   └── frontend/                # React frontend
│       ├── src/
│       │   ├── App.jsx          # Main React component
│       │   ├── main.jsx         # React entry point
│       │   └── index.css        # Styling
│       ├── public/
│       │   └── index.html       # HTML template
│       └── package.json         # Dependencies
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+**: Required for backend
- **Node.js 18+**: Required for frontend development
- **g++ Compiler**: Required for C++ compilation
- **Modern Browser**: Chrome, Firefox, Edge, Safari

### Installation
1. **Download Repository**:
   - Go to: https://github.com/beepdevv/Discord-Accounts-Manager
   - Click **Code** → **Download ZIP**

2. **Extract Files**:
   - Extract the ZIP to a folder on your computer

3. **Open Folder**:
   ```bash
   cd Discord-Accounts-Manager

2. **Backend Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Running the Application
- **Backend**: Runs on `http://localhost:8000`
- **Frontend**: Runs on `http://localhost:5173`
- **Access**: Open frontend in browser to use the application

## 🔧 Development

### Backend API Endpoints
- `GET /accounts` - List all accounts
- `POST /add_account` - Add new account
- `DELETE /remove/{id}` - Remove account
- `POST /refresh/{id}` - Refresh account data
- `POST /action/{id}` - Perform account actions
- `POST /relationships/{id}/block/{target}` - Block user
- `POST /relationships/{id}/dm/{target}` - Send DM
- `POST /guilds/{id}/join` - Join guild
- `POST /guilds/{id}/leave/{guild_id}` - Leave guild
- `POST /cleaner/{id}` - Start token cleaner
- `POST /builder/compile` - Compile C++ executable
- `GET /builder/download` - Download compiled executable

### Frontend Components
- **Dashboard**: Account overview and management
- **Builder**: Executable compilation interface
- **Settings**: Configuration and preferences
- **Modals**: Various interactive dialogs
- **Components**: Reusable UI elements

## 🛠️ Tools & Utilities

### Builder Usage
1. Configure assembly information and optional icon
2. Click "Compile and Download" 
3. Receive compiled `.exe` file
4. Distribute as needed

### Account Operations
- **Import**: Load tokens from file or clipboard
- **Validate**: Check token validity automatically
- **Export**: Download account data as JSON
- **Bulk Actions**: Select multiple accounts for batch operations

## 🌟 Browser Compatibility

### Supported Browsers
- ✅ **Chrome 90+**: Full feature support
- ✅ **Firefox 88+**: Modern browser support
- ✅ **Safari 14+**: WebKit engine support
- ✅ **Edge 90+**: Chromium-based support

### Mobile Support
- 📱 **Responsive Design**: Mobile-optimized interface
- 📱 **Touch Gestures**: Mobile interaction support
- 📱 **PWA Ready**: Progressive web app capabilities

## 📝 Configuration



### Settings File
User preferences and settings are automatically saved to browser localStorage and persist between sessions.

## 🔄 Updates & Maintenance

### Version Management
- **Semantic Versioning**: Follow semantic versioning
- **Changelog**: Document all changes
- **Migration Scripts**: Handle database updates
- **Backward Compatibility**: Maintain API stability

### Regular Tasks
- **Token Validation**: Periodic token checking
- **Database Cleanup**: Remove expired/invalid tokens
- **Cache Management**: Clear temporary files
- **Log Rotation**: Manage log file sizes

## 🐛 Troubleshooting

### Common Issues
1. **Port Conflicts**: Ensure ports 8000/5173 are available
2. **Compilation Errors**: Install g++ and add to PATH
3. **Token Validation**: Check Discord API status
4. **Database Issues**: Verify SQLite file permissions
5. **Network Errors**: Check firewall and proxy settings


### Performance Optimization
- **Database Indexing**: Properly indexed queries
- **Frontend Bundling**: Optimized React builds
- **Memory Management**: Efficient state management
- **Network Caching**: Reduce API calls

## 📄 License

This project is provided for educational and research purposes only. Users are responsible for ensuring compliance with Discord's Terms of Service and applicable laws.

### Disclaimer
- **Educational Use**: For learning and research
- **User Responsibility**: Compliance with terms/laws
- **No Warranty**: Provided as-is, without warranty
- **Attribution**: Credit original authors where applicable

## 🤝 Contributing

### Development Guidelines
1. **Fork Repository**: Create your own copy
2. **Feature Branch**: Create descriptive branch name
3. **Code Style**: Follow existing patterns
4. **Testing**: Ensure all features work
5. **Documentation**: Update relevant docs
6. **Pull Request**: Submit with clear description

### Code Standards
- **Python**: PEP 8 compliance
- **JavaScript**: ESLint configuration
- **CSS**: Tailwind CSS
- **C++**: Modern C++17 standards

## 📞 Support

### Getting Help
- **Issues**: Report via GitHub Issues
- **Discussions**: Use GitHub Discussions

### Resources
- **API Documentation**: Detailed endpoint documentation
- **Video Tutorials**: Step-by-step guides
- **Community Wiki**: User-contributed guides
- **Example Projects**: Reference implementations

---

**Built with ❤️ by beepdev**
