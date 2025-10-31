# 🤖 Venice AI Configuration Guide

## 🔧 **Model Configuration**

### **Current Setup:**
- **Wisdom & Intimacy & GenerationalBridge**: `llama-3.3-70b` (High reasoning, 128k context)
- **Presence**: `llama-3.2-3b` (Fast responses, 32k context)
- **Growth**: `qwen-2.5-coder-32b` (Goal-oriented, code-specialized)

### **Available Venice AI Models:**

#### **Large Models (High Reasoning)**
- `llama-3.3-70b` - Extensive context, versatile
- `qwen-2.5-72b` - Advanced reasoning capabilities
- `qwen-3-235b-a22b` - Multimodal, in-depth reasoning

#### **Fast Models (Quick Responses)**
- `llama-3.2-3b` - Lightweight, fast
- `qwen-2.5-14b` - Balanced speed/quality

#### **Specialized Models**
- `qwen-2.5-coder-32b` - Code generation, technical tasks
- `qwen-2.5-vl` - Vision capabilities
- `mistral-31-24b` - Vision, function calling, web search

### **Fallback Strategy:**
1. Primary model fails → `llama-3.2-3b` (fast fallback)
2. Still failing → `qwen-2.5-32b` (alternative reasoning)
3. Last resort → `mistral-31-24b` (full features)

## 🔐 **Privacy Features**

Venice AI ensures privacy through:
- ✅ **No data storage** - Conversations never stored on servers
- ✅ **Encrypted local storage** - Data stays in your browser
- ✅ **Decentralized processing** - Distributed GPU providers
- ✅ **No conversation logging** - Zero persistent tracking
- ✅ **Proxy routing** - Requests processed via secure proxy

## 🚀 **Usage**

### **Restart Agents:**
```bash
# Stop current agents (Ctrl+C)
pnpm start:family
```

### **Expected Results:**
- ✅ Agents respond with Venice AI models
- ✅ Privacy-first processing
- ✅ Fallback handling for reliability
- ✅ Specialized models per agent type

## 🎯 **Agent-Model Mapping**

| Agent | Model | Purpose | Context |
|-------|-------|---------|---------|
| 🧠 Wisdom | llama-3.3-70b | Complex emotional reasoning | 128k |
| 💑 Intimacy | llama-3.3-70b | Relationship intelligence | 128k |
| 👵👦 Bridge | llama-3.3-70b | Cross-generational understanding | 128k |
| 🧘 Presence | llama-3.2-3b | Quick mindfulness responses | 32k |
| 🚀 Growth | qwen-2.5-coder-32b | Goal-oriented, structured tasks | 64k |

This configuration balances performance, cost, and specialized capabilities for optimal family AI experience.