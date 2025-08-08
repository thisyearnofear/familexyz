# Installation Guide

This guide will help you set up the Family-Connection AI Agents project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Node.js** (v23.3.0 or later)
  ```bash
  # Check your Node.js version
  node --version
  ```
  
- **pnpm** (v9.12.3 or later) - Package manager
  ```bash
  # Install pnpm globally
  npm install -g pnpm
  
  # Check pnpm version
  pnpm --version
  ```

- **Git** - Version control
  ```bash
  git --version
  ```

### Optional Software

- **Docker** - For containerized deployment
- **PostgreSQL** - For production database (SQLite is used by default)
- **Redis** - For caching (optional)

## Quick Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/familexyz.git
cd familexyz
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment

```bash
# Copy development environment template
cp environments/development/.env.development .env

# Edit the .env file with your configuration
# See the Environment Setup section below for details
```

### 4. Start Development Server

```bash
pnpm dev
```

The application will start with all five family agents running automatically.

## Detailed Installation

### Environment Setup

1. **Choose Your Environment Template**

   For development:
   ```bash
   cp environments/development/.env.development .env
   ```

   For staging:
   ```bash
   cp environments/staging/.env.staging .env
   ```

   For production:
   ```bash
   cp environments/production/.env.production .env
   ```

2. **Configure API Keys**

   Edit your `.env` file and add the following required keys:

   ```env
   # Required: AI Model API Key (choose one)
   OPENAI_API_KEY=your_openai_api_key_here
   # OR
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   
   # Optional: Platform Integration Keys
   DISCORD_API_TOKEN=your_discord_bot_token
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TWITTER_USERNAME=your_bot_username
   TWITTER_PASSWORD=your_bot_password
   TWITTER_EMAIL=your_bot_email
   ```

3. **Configure Family Features**

   Enable the family-specific features you want:

   ```env
   # Family Feature Toggles
   GENERATIONAL_BRIDGE_ENABLED=true
   INTIMACY_COACH_ENABLED=true
   GROWTH_CHALLENGES_ENABLED=true
   MINDFULNESS_REMINDERS_ENABLED=true
   WISDOM_SHARING_ENABLED=true
   ```

4. **Database Configuration**

   **For Development (Default):**
   ```env
   DATABASE_URL=sqlite:./agent/data/db.sqlite
   ```

   **For Production (Recommended):**
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/family_agents
   ```

### Build System Setup

1. **Verify Build Configuration**

   ```bash
   # Check if all packages build successfully
   pnpm build
   ```

2. **Run Tests**

   ```bash
   # Run the test suite
   pnpm test
   ```

3. **Lint and Format**

   ```bash
   # Check code formatting
   pnpm lint
   
   # Auto-fix formatting issues
   pnpm format
   ```

## Platform-Specific Installation

### Discord Bot Setup

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to "Bot" section and create a bot
   - Copy the bot token to your `.env` file

2. **Set Bot Permissions**
   - In the Discord Developer Portal, go to OAuth2 > URL Generator
   - Select "bot" scope
   - Select permissions: Send Messages, Read Message History, Use Slash Commands
   - Use the generated URL to invite the bot to your server

3. **Configure Environment**
   ```env
   DISCORD_APPLICATION_ID=your_discord_app_id
   DISCORD_API_TOKEN=your_discord_bot_token
   ```

### Telegram Bot Setup

1. **Create Telegram Bot**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Use `/newbot` command and follow instructions
   - Copy the bot token

2. **Configure Environment**
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ```

### Twitter/X Integration

1. **Twitter Developer Account**
   - Apply for a Twitter Developer account
   - Create a new app and get API credentials
   - Note: Twitter integration uses username/password for enhanced functionality

2. **Configure Environment**
   ```env
   TWITTER_DRY_RUN=false
   TWITTER_USERNAME=your_bot_username
   TWITTER_PASSWORD=your_bot_password
   TWITTER_EMAIL=your_bot_email
   ```

## Docker Installation

### Using Docker Compose (Recommended)

1. **Build and Start Services**
   ```bash
   pnpm docker:build
   pnpm docker:start
   ```

2. **Access the Application**
   - Web client: http://localhost:3000
   - API: http://localhost:3000/api

### Manual Docker Build

1. **Build Docker Image**
   ```bash
   docker build -f docker/Dockerfile -t family-agents .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 --env-file .env family-agents
   ```

## Database Setup

### SQLite (Development)

SQLite is used by default and requires no additional setup. The database file will be created automatically at `agent/data/db.sqlite`.

### PostgreSQL (Production)

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   
   # Start PostgreSQL service
   sudo service postgresql start  # Linux
   brew services start postgresql # macOS
   ```

2. **Create Database**
   ```bash
   sudo -u postgres createdb family_agents
   sudo -u postgres createuser your_username
   sudo -u postgres psql -c "ALTER USER your_username WITH PASSWORD 'your_password';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE family_agents TO your_username;"
   ```

3. **Update Environment**
   ```env
   DATABASE_URL=postgresql://your_username:your_password@localhost:5432/family_agents
   ```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Permission Errors**
   ```bash
   # Fix npm permissions (Unix/macOS)
   sudo chown -R $(whoami) ~/.npm
   
   # Or use a Node version manager like nvm
   ```

3. **pnpm Installation Issues**
   ```bash
   # Clear pnpm cache
   pnpm store prune
   
   # Reinstall dependencies
   rm -rf node_modules
   pnpm install
   ```

4. **Environment File Not Found**
   ```bash
   # Ensure you've copied an environment template
   ls -la | grep .env
   
   # If no .env file exists:
   cp environments/development/.env.development .env
   ```

5. **API Key Errors**
   - Verify your API keys are valid and have proper permissions
   - Check for typos in your `.env` file
   - Ensure no trailing spaces in API key values

### Getting Help

- **Documentation**: Check `/docs` directory for detailed guides
- **GitHub Issues**: Report bugs or request features
- **Community Discord**: Join our community for support
- **Environment Setup**: See `/docs/setup/environments.md` for detailed environment configuration

### Development Tips

1. **Hot Reload**: Development mode includes hot reload for faster development
2. **Debug Mode**: Use `pnpm start:debug` for detailed logging
3. **Clean Start**: Use `pnpm cleanstart` to reset the database and start fresh
4. **Family Features**: All family agents start automatically with `pnpm dev`

## Next Steps

Once installation is complete:

1. **Test Family Features**: Try interacting with different family agents
2. **Configure Platforms**: Set up Discord/Telegram bots for your family
3. **Customize Agents**: Modify character files to personalize your family agents
4. **Deploy**: Follow deployment guides for staging/production setup

For detailed configuration and advanced features, see the other documentation files in the `/docs` directory.