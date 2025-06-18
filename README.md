# 📋 To-Do List & Shopping List PWA

A modern, responsive Progressive Web Application for managing tasks, notes, and calendar events with multi-language support and offline capabilities.

## 🌟 Features

- ✅ **Task Management**: Create, organize, and track to-do lists
- 📝 **Notes System**: Secure notes with optional password protection
- 📅 **Calendar Integration**: Schedule and manage events
- 🎨 **Multiple Themes**: 7 beautiful themes with light/dark modes
- 🌍 **Multi-language**: Hungarian, English, and German support
- 📱 **PWA Ready**: Install as native app on any device
- 🔄 **Real-time Sync**: Firebase integration for data synchronization
- 🔐 **Secure**: End-to-end encryption for sensitive notes
- 📊 **Progress Tracking**: XP system and achievement badges
- 🎵 **Audio Notifications**: Sound alerts for important events

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd to-do-listank
   ```

2. **Open in browser**
   ```bash
   # Serve with any local server (e.g., Live Server in VS Code)
   # Or simply open index.html in a modern browser
   ```

3. **Configure Firebase** (Optional)
   - Update Firebase configuration in `js/firebase-config.js`
   - Enable Authentication and Realtime Database in Firebase Console

## 📁 Project Structure

### **HTML Files**
```
├── index.html           # Main application (Hungarian)
├── en-index.html        # English version
├── de-index.html        # German version
└── manifest.json        # PWA manifest
```

### **CSS Structure (Modular)**
```
├── css/
│   ├── variables.css    # CSS custom properties and themes
│   ├── base.css         # Reset, typography, and base styles
│   ├── components.css   # Reusable UI components
│   ├── layout.css       # Grid systems and layouts
│   └── navigation.css   # Navigation and menu styles
├── styles.css           # Main CSS file (imports all modules)
└── modern-themes.css    # Theme-specific styling
```

### **JavaScript Structure (Modular)**
```
├── js/
│   ├── main.js          # Application entry point
│   ├── app-core.js      # Core application logic
│   ├── firebase-config.js # Firebase configuration
│   ├── language-manager.js # Internationalization
│   ├── pwa-manager.js   # Progressive Web App features
│   ├── audio-manager.js # Sound and notification system
│   ├── quick-fixes.js   # Language key fixes
│   └── utils.js         # Utility functions and helpers
```

### **Language Files**
```
├── languages/
│   ├── hu.json          # Hungarian translations
│   ├── en.json          # English translations
│   └── de.json          # German translations
```

### **Assets**
```
├── favicon.ico
├── apple-touch-icon.png
├── android-chrome-*.png
├── favicon-*.png
└── sw.js                # Service Worker for PWA
```

## 🎨 Theme System

The application supports 7 beautiful themes, each with light and dark modes:

1. **Default** - Classic emerald green
2. **Ocean Blue** - Refreshing ocean blue
3. **Sakura Pink** - Gentle cherry blossom
4. **Forest Green** - Natural forest green
5. **Minimal Mono** - Clean monochrome
6. **Sunset Orange** - Warm sunset orange
7. **Royal Purple** - Elegant royal purple

### Theme Architecture
- CSS custom properties for consistent theming
- Automatic theme persistence
- Firebase sync for authenticated users
- Responsive design across all themes

## 🌍 Internationalization

The app supports multiple languages with a robust i18n system:

- **Hungarian** (default) - `hu`
- **English** - `en` 
- **German** - `de`

### Adding New Languages
1. Create new JSON file in `languages/` directory
2. Add translations following the existing structure
3. Update language manager configuration
4. Create new HTML entry point if needed

## 📱 Progressive Web App Features

- **Installable**: Can be installed on any device
- **Offline Support**: Works without internet connection
- **Push Notifications**: Event reminders and alerts
- **Background Sync**: Data synchronization when online
- **Responsive Design**: Optimized for all screen sizes

## 🔧 Development

### Prerequisites
- Modern web browser with ES6+ support
- Local development server (recommended)
- Firebase account (optional, for full functionality)

### Development Setup
1. Install dependencies (if using build tools)
2. Configure Firebase credentials
3. Start local development server
4. Open browser and navigate to application

### Code Style
- **ES6+ Modules**: Modern JavaScript module system
- **CSS Custom Properties**: For theming and consistency
- **Component-based Architecture**: Reusable UI components
- **Semantic HTML**: Accessible and meaningful markup
- **Mobile-first Design**: Responsive across all devices

## 🚀 Build & Deployment

The application is built using vanilla JavaScript and CSS, requiring no build process:

1. **Direct Deployment**: Upload files to any web server
2. **GitHub Pages**: Enable GitHub Pages for automatic hosting
3. **Firebase Hosting**: Deploy to Firebase for advanced features
4. **Netlify/Vercel**: Use modern hosting platforms

### PWA Requirements
- HTTPS connection (required for service workers)
- Valid manifest.json file
- Service worker registration
- Appropriate icons and metadata

## 🔐 Security Features

- **Password Protection**: Optional password protection for sensitive notes
- **Firebase Auth**: Secure user authentication
- **HTTPS Only**: Encrypted data transmission
- **Input Sanitization**: XSS protection
- **Content Security Policy**: Additional security headers

## 📊 Performance

### Optimizations
- **Modular Loading**: Only load required modules
- **Lazy Loading**: Load features on demand
- **Efficient CSS**: Minimal and optimized stylesheets
- **Compressed Assets**: Optimized images and icons
- **Service Worker Caching**: Offline performance

### Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

## 🔄 Data Management

### Local Storage
- Theme preferences
- Language settings
- PWA install state
- Offline data cache

### Firebase Integration
- Real-time data synchronization
- User authentication
- Cloud data backup
- Cross-device sync

## 🛠️ API Reference

### Core Functions
```javascript
// Initialize application
import { initializeApp } from './js/app-core.js';

// Show notifications
import { showNotification } from './js/app-core.js';

// Utility functions
import { DateUtils, StringUtils } from './js/utils.js';
```

### Theme Management
```javascript
// Apply theme
applyTheme('ocean-blue', 'dark');

// Get current theme
getCurrentTheme();
```

### Language Management
```javascript
// Change language
await setLanguage('en');

// Get translated text
getText('common.save');
```

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection**
   - Check internet connection
   - Verify Firebase configuration
   - Check browser console for errors

2. **PWA Installation**
   - Ensure HTTPS connection
   - Check service worker registration
   - Verify manifest.json validity

3. **Language Loading**
   - Check language file exists
   - Verify JSON syntax
   - Check network requests

### Debug Mode
Enable debug mode for detailed logging:
```javascript
window.appDebug.enableDebugMode();
```

## 📈 Future Enhancements

- [ ] Advanced task filtering and sorting
- [ ] Collaborative lists and sharing
- [ ] Advanced calendar views (week, month)
- [ ] Integration with external calendars
- [ ] Advanced analytics and reporting
- [ ] Plugin system for extensibility
- [ ] Advanced notification customization
- [ ] Backup and export functionality

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

### Code Style Guidelines
- Use ES6+ features
- Follow component-based architecture
- Write semantic, accessible HTML
- Use CSS custom properties for theming
- Include JSDoc comments for functions
- Follow existing naming conventions

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Firebase for backend services
- Material Icons for iconography
- SortableJS for drag-and-drop functionality
- Modern CSS Grid and Flexbox for layouts

---

**Built with ❤️ using modern web technologies** 