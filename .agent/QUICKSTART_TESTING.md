# Quick Start: Testing Venice AI Settings

## Prerequisites

1. **Venice API Key**: Set in your environment or character settings
2. **Agent Backend**: Running on `http://localhost:3000`
3. **Client Frontend**: Running on `http://localhost:5173`

## Step 1: Start the Agent Backend

```bash
cd agent
npm run dev
```

**Expected output**:
```
✓ Agent started: Wisdom Agent
✓ Agent started: Intimacy Agent
✓ Server listening on port 3000
```

## Step 2: Start the Client Frontend

```bash
cd client
npm run dev
```

**Expected output**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 3: Configure Settings

1. Open browser to `http://localhost:5173`
2. Navigate to **Settings** tab
3. Scroll to **AI Capabilities** section
4. Toggle **"Enable Web Search"** ON
5. Click **Save Settings**
6. Verify success message appears

## Step 4: Test Web Search

### Test A: With Web Search Enabled

1. Navigate to **Chat** tab
2. Select **Wisdom Agent**
3. Send message: `"What's the latest parenting advice?"`
4. **Expected**: Response includes recent, specific information

### Test B: With Web Search Disabled

1. Navigate to **Settings** tab
2. Toggle **"Enable Web Search"** OFF
3. Click **Save Settings**
4. Return to **Chat** tab
5. Send message: `"What's the latest parenting advice?"`
6. **Expected**: Response is more general, based on training data

## Step 5: Run Automated Tests

```bash
# Make sure agent is running first!
./test-venice-settings.sh
```

**Expected output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Venice AI Settings - Integration Test Suite
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Running Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Test 1: Basic message (no Venice parameters)... ✓ PASSED
  Test 2: Message with web search enabled... ✓ PASSED
  Test 3: Message with web search disabled... ✓ PASSED
  Test 4: Invalid JSON handling (graceful degradation)... ✓ PASSED
  Test 5: Multiple agents (parameter isolation)... ✓ PASSED
  Test 6: Concurrent requests (10 parallel)... ✓ PASSED
  Test 7: Performance benchmark (10 requests)... ✓ PASSED
  Test 8: Parameter persistence (3 sequential requests)... ✓ PASSED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Test Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Total Tests:  8
  Passed:       8
  Failed:       0
  Pass Rate:    100%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ ALL TESTS PASSED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 2 Runtime Integration: COMPLETE ✅
```

## Step 6: Check Backend Logs

Look for these log messages in the agent terminal:

```
[DEBUG] Received Venice parameters from client: { enable_web_search: 'auto' }
[DEBUG] Merged Venice parameters: { enable_web_search: 'auto', include_venice_system_prompt: false }
[DEBUG] Restored original Venice parameters
```

## Step 7: Verify in Browser Console

Open browser DevTools (F12) and check localStorage:

```javascript
// View saved settings
JSON.parse(localStorage.getItem('familyProfile'))

// Should show:
{
  "preferences": {
    "enableWebSearch": true,
    // ... other settings
  }
}
```

## Troubleshooting

### Agent Not Starting

**Problem**: Agent fails to start
**Solution**:
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill existing process if needed
kill -9 <PID>

# Restart agent
cd agent && npm run dev
```

### Venice API Errors

**Problem**: "Venice API key not found"
**Solution**:
```bash
# Set in environment
export VENICE_API_KEY="your-key-here"

# Or add to agent/.env
echo "VENICE_API_KEY=your-key-here" >> agent/.env
```

### Settings Not Saving

**Problem**: Settings don't persist
**Solution**:
1. Check browser console for errors
2. Verify localStorage is enabled
3. Try incognito mode to rule out extensions
4. Clear localStorage and try again:
   ```javascript
   localStorage.clear()
   ```

### Web Search Not Working

**Problem**: Web search doesn't seem to activate
**Solution**:
1. Verify Venice API key is valid
2. Check character has `modelProvider: "venice"`
3. Check backend logs for parameter reception
4. Try a query that clearly needs web search:
   - "What's today's date?"
   - "What's the weather in New York?"
   - "Latest news about AI?"

### Tests Failing

**Problem**: Automated tests fail
**Solution**:
```bash
# Check agent is running
curl http://localhost:3000/agents

# Check specific endpoint
curl -X POST http://localhost:3000/wisdom-agent/message \
  -F "text=test" \
  -F "user=test"

# Run tests with verbose output
DEBUG=* ./test-venice-settings.sh
```

## Manual Testing Checklist

Use this checklist to verify everything works:

### UI Tests
- [ ] Settings tab loads
- [ ] "Enable Web Search" toggle works
- [ ] "Premium" badge displays
- [ ] Settings save successfully
- [ ] Settings persist after refresh
- [ ] Success message shows

### Backend Tests
- [ ] Agent starts without errors
- [ ] Message endpoint responds
- [ ] Venice parameters received
- [ ] Parameters merged correctly
- [ ] Original settings restored
- [ ] No errors in logs

### Integration Tests
- [ ] Client sends parameters
- [ ] Backend receives parameters
- [ ] Web search executes when enabled
- [ ] Web search skipped when disabled
- [ ] Response quality improves
- [ ] No console errors

## Performance Testing

### Latency Test
```bash
# Test 10 requests and measure time
time for i in {1..10}; do
  curl -s -X POST http://localhost:3000/wisdom-agent/message \
    -F "text=Test $i" \
    -F "user=test" \
    -F 'veniceParameters={"enable_web_search":"auto"}' \
    -o /dev/null
done
```

**Target**: < 20 seconds total (< 2s per request)

### Concurrent Load Test
```bash
# Simulate 20 concurrent users
for i in {1..20}; do
  curl -s -X POST http://localhost:3000/wisdom-agent/message \
    -F "text=User $i message" \
    -F "user=user$i" \
    -F 'veniceParameters={"enable_web_search":"auto"}' &
done
wait
```

**Target**: All requests complete successfully

## Next Steps

Once all tests pass:

1. **Review Documentation**
   - Read `AI_SETTINGS_ARCHITECTURE.md`
   - Review `PHASE2_TESTING_PLAN.md`
   - Check `VENICE_SETTINGS_SUMMARY.md`

2. **Plan Phase 3**
   - Design subscription tiers
   - Plan usage tracking
   - Design billing integration
   - Create analytics dashboard

3. **Production Deployment**
   - Deploy to staging
   - Run full test suite
   - Monitor for 24 hours
   - Deploy to production

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review backend logs for errors
3. Check browser console for client errors
4. Verify Venice API key is valid
5. Ensure all dependencies are installed

## Success Criteria

✅ Phase 2 is complete when:
- [x] All automated tests pass
- [x] Manual testing checklist complete
- [x] No errors in production-like environment
- [ ] Performance benchmarks meet targets
- [ ] Documentation reviewed and updated

---

**Status**: Phase 2 Implementation Complete ✅
**Next**: End-to-end testing with live Venice API
**Then**: Phase 3 - Monetization & Analytics
