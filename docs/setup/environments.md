# Environment Configuration

This directory contains environment-specific configurations for the Family-Connection AI Agents project.

## Directory Structure

```
environments/
├── development/
│   └── .env.development     # Development environment template
├── staging/
│   └── .env.staging         # Staging environment template
├── production/
│   └── .env.production      # Production environment template
└── README.md               # This file
```

## Setup Instructions

### 1. Choose Your Environment

Copy the appropriate environment template to your project root as `.env`:

**For Development:**
```bash
cp environments/development/.env.development .env
```

**For Staging:**
```bash
cp environments/staging/.env.staging .env
```

**For Production:**
```bash
cp environments/production/.env.production .env
```

### 2. Configure Your Environment

Edit the `.env` file and replace placeholder values with your actual configuration:

1. **API Keys**: Add your OpenAI, Discord, Telegram, and other service API keys
2. **Database**: Configure your database connection string
3. **Security**: Set strong JWT secrets and encryption keys
4. **Family Features**: Enable/disable specific family-oriented features
5. **Blockchain**: Configure Hedera network settings if using blockchain features

### 3. Environment-Specific Notes

#### Development Environment
- Uses SQLite database by default for easy setup
- Enables debug logging and hot reload
- Includes test data seeding
- Less strict security for easier development

#### Staging Environment
- Mirror of production with test data
- Used for integration testing
- Stricter security than development
- Safe environment for testing deployments

#### Production Environment
- Maximum security settings enabled
- Optimized for performance
- Minimal logging for privacy
- Production-grade database required

## Security Best Practices

### 🔒 **NEVER commit actual `.env` files to version control**

The `.env` file should be added to `.gitignore` and never committed. Only the templates in this directory should be tracked.

### 🔑 **Rotate Keys Regularly**

- Change API keys quarterly
- Rotate JWT secrets monthly in production
- Update encryption keys annually

### 🛡️ **Family Data Protection**

This project handles sensitive family data. Ensure:
- Strong encryption keys (32+ characters)
- Privacy mode enabled in production
- Data retention policies respected
- Parental controls properly configured

## Environment Variables Reference

### Core Configuration
- `NODE_ENV`: Environment type (development/staging/production)
- `VERBOSE`: Enable detailed logging
- `DEFAULT_LOG_LEVEL`: Logging verbosity level
- `DEBUG`: Debug namespaces

### AI Models
- `OPENAI_API_KEY`: OpenAI API key for GPT models
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude models
- `OLLAMA_HOST`: Local Ollama server URL

### Social Platforms
- `DISCORD_API_TOKEN`: Discord bot token
- `TELEGRAM_BOT_TOKEN`: Telegram bot token
- `TWITTER_*`: Twitter/X API credentials

### Family Features
- `GENERATIONAL_BRIDGE_ENABLED`: Enable/disable storytelling features
- `INTIMACY_COACH_ENABLED`: Enable/disable relationship coaching
- `GROWTH_CHALLENGES_ENABLED`: Enable/disable family growth challenges
- `MINDFULNESS_REMINDERS_ENABLED`: Enable/disable mindfulness features
- `WISDOM_SHARING_ENABLED`: Enable/disable philosophical guidance

### Security & Privacy
- `JWT_SECRET`: Secret for JWT token signing
- `ENCRYPTION_KEY`: Key for encrypting sensitive data
- `PRIVACY_MODE`: Privacy protection level (strict/moderate/basic)
- `DATA_RETENTION_DAYS`: How long to keep family data

### Blockchain (Hedera)
- `HEDERA_NETWORK`: Hedera network (mainnet/testnet)
- `HEDERA_ACCOUNT_ID`: Your Hedera account ID
- `HEDERA_PRIVATE_KEY`: Your Hedera private key

## Troubleshooting

### Common Issues

1. **"API Key not found" errors**
   - Ensure all required API keys are set in your `.env` file
   - Check that keys are valid and have proper permissions

2. **Database connection errors**
   - Verify `DATABASE_URL` is correctly formatted
   - Ensure database server is running (for PostgreSQL/MySQL)
   - Check file permissions for SQLite

3. **Family features not working**
   - Confirm family-specific features are enabled in your environment
   - Verify required AI models are accessible
   - Check that content moderation settings aren't too restrictive

4. **Permission denied errors**
   - Ensure proper file permissions on data directories
   - Check that encryption keys are properly formatted
   - Verify JWT secret is set

### Getting Help

- Check the main project README for setup instructions
- Review the documentation in `/docs`
- Join our community Discord for support
- Report issues on GitHub

## Environment Migration

When moving between environments:

1. **Development → Staging**
   ```bash
   # Export development data (if needed)
   npm run export:dev
   
   # Switch environment
   cp environments/staging/.env.staging .env
   
   # Update configuration
   # Edit .env with staging-specific values
   
   # Migrate data
   npm run migrate:staging
   ```

2. **Staging → Production**
   ```bash
   # Backup production data
   npm run backup:prod
   
   # Switch environment
   cp environments/production/.env.production .env
   
   # Update configuration with production values
   # Edit .env carefully - this affects real users!
   
   # Deploy
   npm run deploy:prod
   ```

Remember: Always test thoroughly in staging before deploying to production, especially when dealing with family data and privacy settings.