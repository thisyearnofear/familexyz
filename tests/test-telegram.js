#!/usr/bin/env node

// Simple test script to run the Telegram bot
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

console.log('🤖 Starting Family AI Agents Telegram Bot...');
console.log('📱 Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Configured ✅' : 'Missing ❌');
console.log('🔑 Venice API:', process.env.VENICE_API_KEY ? 'Configured ✅' : 'Missing ❌');

// Simple Telegram bot using node-telegram-bot-api
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('✅ Telegram bot initialized');

// Load family characters
const characters = {
  wisdom: JSON.parse(readFileSync(join(__dirname, 'characters/wisdom.character.json'), 'utf8')),
  intimacy: JSON.parse(readFileSync(join(__dirname, 'characters/intimacy.character.json'), 'utf8')),
  generationalBridge: JSON.parse(readFileSync(join(__dirname, 'characters/generationalBridge.character.json'), 'utf8')),
  presence: JSON.parse(readFileSync(join(__dirname, 'characters/presence.character.json'), 'utf8')),
  growth: JSON.parse(readFileSync(join(__dirname, 'characters/growth.character.json'), 'utf8'))
};

console.log('📚 Loaded family characters:', Object.keys(characters));

// Simple Venice API integration
async function callVenice(message, character) {
  const veniceKey = process.env.VENICE_API_KEY;
  if (!veniceKey) {
    return "I need a Venice API key to provide AI responses. Please configure VENICE_API_KEY in your environment.";
  }

  try {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${veniceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b',
        messages: [
          {
            role: 'system',
            content: character.bio + '\n\n' + character.lore.join('\n')
          },
          {
            role: 'user',
            content: message
          }
        ],
        venice_parameters: {
          enable_web_search: false,
          include_venice_system_prompt: true
        },
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I'm having trouble responding right now.";
  } catch (error) {
    console.error('Venice API error:', error);
    return "I'm experiencing some technical difficulties. Please try again later.";
  }
}

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🏠 Welcome to Family-Connection AI Agents!

I'm here to help strengthen your family bonds through specialized AI agents:

🧠 /wisdom - Philosophy & Emotional Intelligence
💑 /intimacy - Relationship Coaching  
👵👦 /stories - Cross-Generational Bridge
🧘 /presence - Mindfulness & Digital Wellness
🚀 /growth - Family Growth Challenges

Choose an agent to begin your family wellness journey!

Built with privacy-first Venice AI and secured by Hedera blockchain 🔐
  `;
  
  bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/wisdom/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "🧠 Wisdom Agent activated! Ask me about life philosophy, emotional intelligence, or seek guidance on any matter. What's on your mind?");
});

bot.onText(/\/intimacy/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "💑 Intimacy Agent here! I can help with relationship coaching, communication improvement, and family bonding. What would you like to explore?");
});

bot.onText(/\/stories/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "👵👦 Generational Bridge Agent ready! Share family stories, preserve traditions, or connect across generations. What story shall we explore?");
});

bot.onText(/\/presence/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "🧘 Presence Agent activated! Let's work on mindfulness, digital wellness, and being present with family. How can I guide you?");
});

bot.onText(/\/growth/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "🚀 Growth Agent here! Ready to set family goals, track progress, and celebrate achievements together. What growth challenge interests you?");
});

// Handle all other messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Skip if it's a command
  if (text?.startsWith('/')) return;

  console.log(`📨 Message from ${msg.from?.first_name}: ${text}`);

  // For demo, use wisdom agent as default
  const response = await callVenice(text, characters.wisdom);
  
  bot.sendMessage(chatId, `🧠 ${response}`);
});

console.log('🚀 Family AI Agents Telegram Bot is running!');
console.log('📱 Test it at: https://t.me/familexyzbot');
console.log('🛑 Press Ctrl+C to stop');
