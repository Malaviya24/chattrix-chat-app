module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGINS: [
    'http://localhost:3000',
    'https://chattrix-chat-app.netlify.app',
    'https://chattrix-chat-app.onrender.com',
    'https://chattrix-chat-app.windsurf.build',
    'http://localhost:5000'
  ]
};