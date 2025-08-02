# 🔐 ChatTrix - Secure & Ephemeral Chat Rooms

A real-time, secure chat application with end-to-end encryption, self-destructing messages, and advanced privacy features.

## ✨ Features

### 🔐 Security & Privacy
- **AES-GCM Encryption** - Client-side message encryption
- **Password Protection** - Strong password requirements (8+ chars, uppercase, lowercase, numbers)
- **Self-Destructing Messages** - Messages auto-delete after 5 minutes
- **Invisible Mode** - Blur messages from other users
- **Panic Mode** - Instantly clear all messages and redirect
- **CSRF Protection** - Cross-site request forgery prevention
- **Rate Limiting** - Prevent abuse and brute force attacks

### 🌟 User Experience
- **Dark/Light Mode** - Beautiful theme toggle with sun/moon icons
- **Real-Time Messaging** - Instant message delivery with Socket.IO
- **QR Code Sharing** - Easy room sharing via QR codes
- **Anonymous Users** - No registration required
- **Mobile Responsive** - Works perfectly on phones and PCs
- **Smooth Animations** - Framer Motion powered UI

### 🛠️ Technical Features
- **MongoDB** - NoSQL database with TTL indexes for auto-cleanup
- **Socket.IO** - Real-time bidirectional communication
- **Express.js** - Fast, unopinionated web framework
- **React** - Modern frontend with hooks and context
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Production-ready motion library

## 🚀 Live Demo

**Frontend:** https://chattrix-chat-app.netlify.app

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Netlify)     │◄──►│   (Render)      │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ • React         │    │ • Node.js       │    │ • TTL Indexes   │
│ • Tailwind CSS  │    │ • Express       │    │ • Auto-cleanup  │
│ • Socket.IO     │    │ • Socket.IO     │    │ • Encryption    │
│ • Framer Motion │    │ • bcrypt        │    │ • Sessions      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
chat-room-app/
├── src/                    # Frontend React code
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── services/          # API and Socket.IO services
│   └── utils/             # Utility functions
├── server/                # Backend Node.js code
│   ├── models/            # MongoDB models
│   ├── middleware/        # Security middleware
│   └── utils/             # Encryption utilities
├── public/                # Static assets
└── build/                 # Production build
```

## 🛡️ Security Features

### Encryption
- **AES-GCM** - Authenticated encryption for messages
- **Key Rotation** - Automatic encryption key updates
- **Client-Side** - Messages encrypted before transmission

### Authentication
- **bcrypt** - Password hashing with salt rounds
- **Session Management** - Secure session storage
- **CSRF Tokens** - Cross-site request forgery protection

### Rate Limiting
- **API Endpoints** - 100 requests per 15 minutes
- **Authentication** - 5 attempts per 15 minutes
- **Messages** - 30 messages per minute per user

## 🚀 Deployment

### Frontend (Netlify)
```bash
# Build the project
npm run build

# Deploy to Netlify
npx netlify-cli deploy --prod --dir=build
```

### Backend (Render)
1. Create account on [render.com](https://render.com)
2. Connect your GitHub repository
3. Create new Web Service
4. Set environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `SESSION_SECRET` - Random secret key
   - `NODE_ENV` - production
   - `CORS_ORIGIN` - Your frontend URL

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Frontend Setup
```bash
cd chat-room-app
npm install
npm start
```

### Backend Setup
```bash
cd chat-room-app/server
npm install
npm start
```

### Environment Variables
Create `.env` file in server directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chattrix
SESSION_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

## 📱 Usage

### Creating a Room
1. Visit the app
2. Click "Create Room"
3. Enter nickname and strong password
4. Share the generated QR code or link

### Joining a Room
1. Click the shared link or scan QR code
2. Enter nickname and room password
3. Start chatting!

### Features
- **Dark Mode** - Toggle theme with sun/moon icon
- **Invisible Mode** - Blur messages from others
- **Panic Mode** - Clear all messages instantly
- **Real-Time** - See messages as they're sent
- **Self-Destruct** - Messages disappear after 5 minutes

## 🔧 API Endpoints

### Authentication
- `POST /api/rooms` - Create new room
- `POST /api/rooms/:roomId/join` - Join existing room
- `GET /api/rooms/:roomId` - Get room information

### Socket.IO Events
- `join-room` - Join chat room
- `send-message` - Send encrypted message
- `toggle-invisible` - Toggle invisible mode
- `panic-mode` - Clear all messages

## 🛡️ Privacy & Security

### Data Protection
- **No Registration** - Anonymous usage
- **Temporary Storage** - Messages auto-delete
- **Encryption** - End-to-end message encryption
- **No Logging** - No message content stored

### Compliance
- **GDPR Ready** - No personal data collection
- **Privacy First** - Designed for privacy
- **Open Source** - Transparent codebase

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Socket.IO** - Real-time communication
- **MongoDB** - Database solution
- **Tailwind CSS** - Styling framework
- **Framer Motion** - Animation library
- **Netlify** - Frontend hosting
- **Render** - Backend hosting

---

**Built with ❤️ for secure, private communication**
