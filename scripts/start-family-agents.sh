#!/bin/bash

# Start all family agents
echo "🚀 Starting Family AI Agents..."

cd agent

# Start with all family character files
pnpm dev --characters="../characters/wisdom.character.json,../characters/intimacy.character.json,../characters/generationalBridge.character.json,../characters/presence.character.json,../characters/growth.character.json"