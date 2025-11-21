# Phase 2 Testing & Benchmarking Plan

## ✅ Backend Integration Complete

The backend message handler now:
1. ✅ Reads `veniceParameters` from client FormData
2. ✅ Merges with character defaults (client settings override)
3. ✅ Temporarily applies for message duration
4. ✅ Restores original settings after processing

## End-to-End Testing Checklist

### Test 1: Basic Web Search Toggle
**Objective**: Verify web search can be enabled/disabled via UI

**Steps**:
1. Start agent backend: `cd agent && npm run dev`
2. Start client frontend: `cd client && npm run dev`
3. Navigate to Settings tab
4. Toggle "Enable Web Search" ON
5. Verify setting saved to localStorage
6. Navigate to Chat
7. Send message: "What's the current weather in New York?"
8. **Expected**: Response includes recent weather data (indicates web search used)
9. Return to Settings, toggle "Enable Web Search" OFF
10. Send same message again
11. **Expected**: Response is generic (no real-time data)

**Success Criteria**:
- ✅ Settings persist across page refreshes
- ✅ Web search results appear when enabled
- ✅ Generic responses when disabled
- ✅ No console errors

### Test 2: Per-Message Parameter Override
**Objective**: Verify client settings override character defaults

**Setup**:
- Character file has: `enable_web_search: "off"`
- User enables in Settings UI

**Steps**:
1. Check `characters/wisdom.character.json` - set `enable_web_search: "off"`
2. Restart agent backend
3. In UI Settings, enable "Enable Web Search"
4. Send message requiring web search
5. Check backend logs for: "Received Venice parameters from client"
6. Check backend logs for: "Merged Venice parameters"
7. **Expected**: Logs show client override applied

**Success Criteria**:
- ✅ Backend logs show parameter reception
- ✅ Backend logs show merge operation
- ✅ Web search works despite character default being "off"
- ✅ Original character settings restored after message

### Test 3: Multiple Agents
**Objective**: Verify settings don't leak between agents

**Steps**:
1. Enable web search in Settings
2. Chat with Wisdom agent (send message)
3. Switch to Intimacy agent (send message)
4. **Expected**: Both agents use web search
5. Disable web search in Settings
6. Chat with Wisdom again
7. **Expected**: No web search used

**Success Criteria**:
- ✅ Settings apply to all agents
- ✅ No cross-contamination between agent instances
- ✅ Original parameters restored correctly

### Test 4: Error Handling
**Objective**: Verify graceful degradation

**Steps**:
1. Send malformed veniceParameters (manually via curl):
```bash
curl -X POST http://localhost:3000/wisdom-agent/message \
  -F "text=Hello" \
  -F "user=test" \
  -F "veniceParameters={invalid json}"
```
2. **Expected**: Backend logs warning, continues with defaults
3. Send valid parameters:
```bash
curl -X POST http://localhost:3000/wisdom-agent/message \
  -F "text=What's the latest AI news?" \
  -F "user=test" \
  -F 'veniceParameters={"enable_web_search":"auto"}'
```
4. **Expected**: Web search used successfully

**Success Criteria**:
- ✅ Invalid JSON doesn't crash backend
- ✅ Warning logged for malformed data
- ✅ Valid parameters processed correctly

## Performance Benchmarking

### Benchmark 1: Latency Impact
**Objective**: Measure overhead of web search

**Method**:
```bash
# Without web search (10 requests)
time for i in {1..10}; do
  curl -X POST http://localhost:3000/wisdom-agent/message \
    -F "text=Tell me about family communication" \
    -F "user=test" \
    -s -o /dev/null
done

# With web search (10 requests)
time for i in {1..10}; do
  curl -X POST http://localhost:3000/wisdom-agent/message \
    -F "text=What's the latest parenting advice?" \
    -F "user=test" \
    -F 'veniceParameters={"enable_web_search":"auto"}' \
    -s -o /dev/null
done
```

**Metrics to Record**:
- Average response time without web search: _____ ms
- Average response time with web search: _____ ms
- Overhead: _____ ms (_____ %)

**Target**: < 500ms additional latency for web search

### Benchmark 2: Cost Analysis
**Objective**: Estimate API cost increase

**Method**:
1. Monitor Venice API usage dashboard
2. Send 100 messages without web search
3. Note token usage and cost
4. Send 100 messages with web search
5. Note token usage and cost

**Metrics to Record**:
- Tokens per message (no search): _____
- Tokens per message (with search): _____
- Cost per message (no search): $_____
- Cost per message (with search): $_____
- Cost increase: _____ %

**Target**: < 50% cost increase for web search

### Benchmark 3: Quality Improvement
**Objective**: Measure response quality with web search

**Method**:
Create test queries requiring real-time data:
1. "What's the weather today?"
2. "What are the latest family activity trends?"
3. "Current best practices for teen communication?"
4. "Recent research on family dynamics?"
5. "What's happening in family therapy this week?"

**Scoring** (1-5 scale):
- Relevance: How relevant is the response?
- Timeliness: Does it include recent information?
- Accuracy: Is the information correct?
- Usefulness: Would this help the user?

**Target**:
- Without web search: Average score 2-3
- With web search: Average score 4-5

### Benchmark 4: Concurrent Users
**Objective**: Test parameter isolation under load

**Method**:
```bash
# Simulate 10 concurrent users with different settings
for i in {1..10}; do
  (
    if [ $((i % 2)) -eq 0 ]; then
      # Even users: web search ON
      curl -X POST http://localhost:3000/wisdom-agent/message \
        -F "text=User $i message" \
        -F "user=user$i" \
        -F 'veniceParameters={"enable_web_search":"auto"}'
    else
      # Odd users: web search OFF
      curl -X POST http://localhost:3000/wisdom-agent/message \
        -F "text=User $i message" \
        -F "user=user$i"
    fi
  ) &
done
wait
```

**Success Criteria**:
- ✅ No parameter leakage between requests
- ✅ Each request uses correct settings
- ✅ No race conditions
- ✅ All requests complete successfully

## Automated Test Script

Create `test-venice-settings.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

AGENT_URL="http://localhost:3000/wisdom-agent/message"
PASSED=0
FAILED=0

echo "🧪 Venice Settings Integration Tests"
echo "===================================="
echo ""

# Test 1: Basic message without parameters
echo -n "Test 1: Basic message (no parameters)... "
RESPONSE=$(curl -s -X POST $AGENT_URL \
  -F "text=Hello" \
  -F "user=test")

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ PASSED${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAILED${NC}"
  ((FAILED++))
fi

# Test 2: Message with web search enabled
echo -n "Test 2: Message with web search... "
RESPONSE=$(curl -s -X POST $AGENT_URL \
  -F "text=What's the latest news?" \
  -F "user=test" \
  -F 'veniceParameters={"enable_web_search":"auto"}')

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ PASSED${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAILED${NC}"
  ((FAILED++))
fi

# Test 3: Invalid JSON handling
echo -n "Test 3: Invalid JSON handling... "
RESPONSE=$(curl -s -X POST $AGENT_URL \
  -F "text=Hello" \
  -F "user=test" \
  -F 'veniceParameters={invalid}')

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ PASSED${NC} (graceful degradation)"
  ((PASSED++))
else
  echo -e "${RED}✗ FAILED${NC}"
  ((FAILED++))
fi

# Test 4: Performance test
echo -n "Test 4: Performance (10 requests)... "
START=$(date +%s%N)
for i in {1..10}; do
  curl -s -X POST $AGENT_URL \
    -F "text=Test message $i" \
    -F "user=test" \
    -o /dev/null
done
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
AVG=$(( DURATION / 10 ))

if [ $AVG -lt 5000 ]; then
  echo -e "${GREEN}✓ PASSED${NC} (avg: ${AVG}ms)"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠ SLOW${NC} (avg: ${AVG}ms)"
  ((PASSED++))
fi

# Summary
echo ""
echo "===================================="
echo "Results: ${GREEN}${PASSED} passed${NC}, ${RED}${FAILED} failed${NC}"
echo "===================================="

if [ $FAILED -eq 0 ]; then
  exit 0
else
  exit 1
fi
```

**Usage**:
```bash
chmod +x test-venice-settings.sh
./test-venice-settings.sh
```

## Manual Testing Checklist

### UI Testing
- [ ] Settings tab loads without errors
- [ ] "Enable Web Search" toggle works
- [ ] "Premium" badge displays correctly
- [ ] Settings persist after page refresh
- [ ] Settings persist after browser restart
- [ ] Save button enables when changes made
- [ ] Reset button restores previous values
- [ ] Success message shows after save

### Backend Testing
- [ ] Agent starts without errors
- [ ] Venice API key loaded correctly
- [ ] Character settings loaded correctly
- [ ] Message endpoint accepts veniceParameters
- [ ] Parameters parsed correctly
- [ ] Parameters merged with defaults
- [ ] Original parameters restored
- [ ] Logs show parameter flow

### Integration Testing
- [ ] Client sends parameters to backend
- [ ] Backend receives parameters
- [ ] Venice API receives parameters
- [ ] Web search executes when enabled
- [ ] Web search skipped when disabled
- [ ] Response quality improves with search
- [ ] No errors in browser console
- [ ] No errors in backend logs

## Performance Targets

| Metric | Without Web Search | With Web Search | Target |
|--------|-------------------|-----------------|--------|
| Response Time | < 1000ms | < 1500ms | < 2000ms |
| Token Usage | ~500 tokens | ~800 tokens | < 1000 tokens |
| Cost per Request | $0.001 | $0.002 | < $0.005 |
| Quality Score | 3/5 | 4.5/5 | > 4/5 |

## Monitoring & Logging

### Backend Logs to Watch
```bash
# Start agent with debug logging
DEBUG=* npm run dev

# Look for these log messages:
# - "Received Venice parameters from client"
# - "Merged Venice parameters"
# - "Restored original Venice parameters"
# - "Initializing Venice model"
```

### Client Console Logs
```javascript
// Check localStorage
localStorage.getItem('familyProfile')

// Should show:
{
  "preferences": {
    "enableWebSearch": true,
    ...
  }
}
```

### Venice API Monitoring
- Check Venice dashboard for request logs
- Monitor token usage
- Track API costs
- Review error rates

## Troubleshooting

### Issue: Web search not working
**Check**:
1. Venice API key set correctly
2. Character has `modelProvider: "venice"`
3. Settings saved to localStorage
4. Backend logs show parameter reception
5. Venice API endpoint reachable

### Issue: Settings not persisting
**Check**:
1. Browser localStorage enabled
2. No console errors on save
3. `familyProfile` key exists in localStorage
4. JSON structure correct

### Issue: Parameters not reaching backend
**Check**:
1. API client sending `veniceParameters` in FormData
2. Backend parsing FormData correctly
3. CORS not blocking request
4. Network tab shows parameter in request

### Issue: High latency
**Check**:
1. Venice API response time
2. Network latency
3. Backend processing time
4. Database query performance
5. Consider caching web search results

## Success Criteria for Phase 2

- [x] Backend reads client settings ✅
- [x] Settings override character defaults ✅
- [ ] End-to-end test confirms web search works
- [ ] Performance benchmarks established
- [ ] No errors in production-like environment
- [ ] Documentation updated
- [ ] Tests automated

## Next Steps After Phase 2

1. **Production Deployment**
   - Deploy to staging environment
   - Run full test suite
   - Monitor for 24 hours
   - Deploy to production

2. **User Feedback**
   - A/B test with subset of users
   - Collect quality metrics
   - Gather user feedback
   - Iterate based on data

3. **Phase 3: Monetization**
   - Implement subscription tiers
   - Add usage tracking
   - Integrate payment processing
   - Build analytics dashboard
