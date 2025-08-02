#!/bin/bash

# GitHub Repository Setup Script
echo "🚀 Setting up GitHub repository for deployment..."

# Initialize git if not already done
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git repository initialized"
fi

# Add all files
git add .

# Commit changes
git commit -m "🚀 Complete chat room app with backend and frontend

✨ Features:
- Real-time messaging with Socket.IO
- AES-GCM encryption
- MongoDB with TTL indexes
- Dark/Light mode toggle
- Password validation
- QR code generation
- Panic mode
- Invisible mode
- CSRF protection
- Rate limiting

🔧 Backend: Node.js + Express + Socket.IO + MongoDB
🎨 Frontend: React + Tailwind CSS + Framer Motion
🌐 Deployed: Frontend on Netlify, Backend on Render"

echo "✅ Changes committed to git"

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << EOL
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
EOL
    echo "✅ .gitignore created"
fi

echo "🎉 GitHub repository setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Run: git remote add origin YOUR_GITHUB_REPO_URL"
echo "3. Run: git push -u origin main"
echo "4. Connect to Render for backend deployment"
echo "5. Set MONGODB_URI environment variable in Render" 