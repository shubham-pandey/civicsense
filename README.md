# CivicSense

A full-stack civic issue reporting platform that enables citizens to report municipal issues (potholes, lighting, sanitation, etc.) and allows administrators to track and manage these reports efficiently.

## 📋 Overview

CivicSense consists of two main components:

1. **Civic Reporter** - A cross-platform mobile application (React Native/Expo) for citizens to report civic issues
2. **CivicSense Admin** - A web-based admin dashboard (Node.js/Express) for managing and tracking reported issues

## 🏗️ Project Structure

```
civicsense/
├── civic-reporter/          # Mobile app for reporting issues
│   ├── app/                 # Expo Router screens
│   ├── components/          # Reusable React components
│   ├── lib/                 # Utility functions
│   ├── constants/           # App constants
│   └── assets/              # Images and static assets
└── civicSenseAdmin/         # Admin dashboard backend
    ├── server.js            # Express server
    ├── app.js               # Application logic
    ├── index.html           # Admin frontend
    ├── styles.css           # Dashboard styles
    ├── schema.sql           # Database schema
    └── seed.sql             # Sample data
```

## 🚀 Features

### Civic Reporter (Mobile App)

- 📍 Location-based issue reporting with GPS
- 📷 Photo capture and upload for issue documentation
- 🗺️ Interactive map view of reported issues
- 📱 Cross-platform support (iOS, Android, Web)
- 🔔 Push notifications for issue status updates
- 👤 User authentication with Firebase
- 🎨 Modern UI with React Native components

### CivicSense Admin (Dashboard)

- 📊 Comprehensive issue management dashboard
- ✅ Status tracking (new, acknowledged, in progress, resolved, rejected)
- 🎯 Priority assignment (low, medium, high, critical)
- 🏷️ Category filtering (pothole, lighting, sanitation, graffiti, other)
- 📝 Activity feed for issue updates
- 🗺️ Location mapping with coordinates
- 📁 File attachment support
- 🔍 Search and filter capabilities

## 🛠️ Technology Stack

### Mobile App
- **Framework**: React Native with Expo
- **Routing**:  Expo Router
- **State Management**:  Zustand
- **Maps**: React Native Maps
- **Authentication**: Firebase
- **Language**: TypeScript
- **Camera**: Expo Camera & Image Picker

### Backend/Admin
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **API**:  RESTful endpoints
- **Frontend**:  Vanilla JavaScript with HTML/CSS

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- Expo CLI (for mobile development)
- Git

### Civic Reporter (Mobile App)

1. Navigate to the civic-reporter directory: 
```bash
cd civic-reporter
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (use `.env.example` as template):
```bash
cp .env.example .env
```

4. Add your Firebase configuration and API keys to `.env`

5. Start the development server:
```bash
npm start
```

6. Run on specific platforms:
```bash
npm run android    # Android
npm run ios        # iOS
npm run web        # Web browser
```

### CivicSense Admin (Backend & Dashboard)

1. Navigate to the civicSenseAdmin directory:
```bash
cd civicSenseAdmin
```

2. Install dependencies:
```bash
npm install
```

3. Set up the PostgreSQL database:
```bash
psql -U your_username -d your_database -f schema.sql
psql -U your_username -d your_database -f seed.sql
```

4. Create a `.env` file with your database configuration:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/civicsense
PORT=3000
```

Refer to `ENV. md` for detailed environment variable configuration.

5. Start the server:
```bash
npm start          # Production mode
npm run dev        # Development mode with nodemon
```

The admin dashboard will be available at `http://localhost:3000`

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User information and authentication
- **reports** - Civic issue reports
- **report_attachments** - Images and files attached to reports
- **report_activity** - Activity log for status changes and updates

### Report Categories
- Pothole
- Lighting
- Sanitation
- Graffiti
- Other

### Report Status
- New
- Acknowledged
- In Progress
- Resolved
- Rejected

### Priority Levels
- Low
- Medium
- High
- Critical

## 🔧 Configuration

### Mobile App Configuration

Configure the following in `civic-reporter/. env`:
- Firebase credentials
- Google Maps API keys (Android/iOS)
- Backend API endpoint

### Admin Dashboard Configuration

Configure the following in `civicSenseAdmin/. env`:
- Database connection URL
- Server port
- File upload settings

See `civicSenseAdmin/ENV.md` for detailed configuration options.

## 📱 Mobile App Permissions

The Civic Reporter app requires the following permissions: 

- **Location**: To accurately pin-point issue locations
- **Camera**: To capture photos of civic issues
- **Photo Library**: To attach existing photos to reports
- **Notifications**: To receive updates on report status

## 🔒 Security

- Environment variables for sensitive configuration
- Firebase authentication for user management
- SQL parameterized queries to prevent injection
- CORS configuration for API security

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is available for use under standard open source practices.

## 👤 Author

**shubham-pandey**
- GitHub: [@shubham-pandey](https://github.com/shubham-pandey)

## 🙏 Acknowledgments

- Expo team for the excellent mobile development framework
- React Native community for comprehensive libraries
- PostgreSQL for robust database management

## 📞 Support

For issues, questions, or suggestions, please open an issue in the GitHub repository. 

---

Made with ❤️ for better civic engagement
```
