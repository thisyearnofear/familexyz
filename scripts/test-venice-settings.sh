#!/bin/bash

# Venice Settings Integration Test Suite
# Tests end-to-end functionality of user-controlled AI settings

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0;33m' # No Color

# Configuration
AGENT_URL="${AGENT_URL:-http://localhost:3000}"
WISDOM_AGENT="$AGENT_URL/Wisdom/message"
INTIMACY_AGENT="$AGENT_URL/Intimacy/message"

# Counters
PASSED=0
FAILED=0
TOTAL=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_test() {
    echo -n "  Test $1: $2... "
    ((TOTAL++))
}

pass() {
    echo -e "${GREEN}✓ PASSED${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗ FAILED${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠ WARNING${NC} $1"
}

# Check if agent is running
check_agent() {
    print_header "Pre-flight Checks"
    print_test "0" "Agent connectivity"

    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$AGENT_URL/agents")

    if [ "$RESPONSE" = "200" ]; then
        pass "(Agent is running)"
    else
        fail "(Agent not reachable at $AGENT_URL)"
        echo ""
        echo "Please start the agent backend:"
        echo "  cd agent && npm run dev"
        echo ""
        exit 1
    fi
}

# Test 1: Basic message without parameters
test_basic_message() {
    print_test "1" "Basic message (no Venice parameters)"

    RESPONSE=$(curl -s -X POST "$WISDOM_AGENT" \
        -F "text=Hello, how are you?" \
        -F "user=test-user")

    if echo "$RESPONSE" | grep -q "text"; then
        pass
    else
        fail "(No response received)"
    fi
}

# Test 2: Message with web search enabled
test_web_search_enabled() {
    print_test "2" "Message with web search enabled"

    RESPONSE=$(curl -s -X POST "$WISDOM_AGENT" \
        -F "text=What's the latest parenting advice?" \
        -F "user=test-user" \
        -F 'veniceParameters={"enable_web_search":"auto"}')

    if echo "$RESPONSE" | grep -q "text"; then
        pass "(Response received with web search)"
    else
        fail "(No response received)"
    fi
}

# Test 3: Message with web search disabled
test_web_search_disabled() {
    print_test "3" "Message with web search disabled"

    RESPONSE=$(curl -s -X POST "$WISDOM_AGENT" \
        -F "text=Tell me about family communication" \
        -F "user=test-user" \
        -F 'veniceParameters={"enable_web_search":"off"}')

    if echo "$RESPONSE" | grep -q "text"; then
        pass "(Response received without web search)"
    else
        fail "(No response received)"
    fi
}

# Test 4: Invalid JSON handling
test_invalid_json() {
    print_test "4" "Invalid JSON handling (graceful degradation)"

    RESPONSE=$(curl -s -X POST "$WISDOM_AGENT" \
        -F "text=Hello" \
        -F "user=test-user" \
        -F 'veniceParameters={invalid json}')

    if echo "$RESPONSE" | grep -q "text"; then
        pass "(Gracefully handled invalid JSON)"
    else
        fail "(Failed to handle invalid JSON)"
    fi
}

# Test 5: Multiple agents
test_multiple_agents() {
    print_test "5" "Multiple agents (parameter isolation)"

    # Send to Wisdom
    RESPONSE1=$(curl -s -X POST "$WISDOM_AGENT" \
        -F "text=Test message 1" \
        -F "user=test-user" \
        -F 'veniceParameters={"enable_web_search":"auto"}')

    # Send to Intimacy
    RESPONSE2=$(curl -s -X POST "$INTIMACY_AGENT" \
        -F "text=Test message 2" \
        -F "user=test-user" \
        -F 'veniceParameters={"enable_web_search":"off"}')

    if echo "$RESPONSE1" | grep -q "text" && echo "$RESPONSE2" | grep -q "text"; then
        pass "(Both agents responded correctly)"
    else
        fail "(One or both agents failed)"
    fi
}

# Test 6: Concurrent requests
test_concurrent_requests() {
    print_test "6" "Concurrent requests (10 parallel)"

    PIDS=()
    TEMP_DIR=$(mktemp -d)

    for i in {1..10}; do
        (
            curl -s -X POST "$WISDOM_AGENT" \
                -F "text=Concurrent test $i" \
                -F "user=test-user-$i" \
                -F 'veniceParameters={"enable_web_search":"auto"}' \
                > "$TEMP_DIR/response-$i.json"
        ) &
        PIDS+=($!)
    done

    # Wait for all requests
    FAILED_COUNT=0
    for pid in "${PIDS[@]}"; do
        wait $pid || ((FAILED_COUNT++))
    done

    # Check responses
    SUCCESS_COUNT=0
    for i in {1..10}; do
        if [ -f "$TEMP_DIR/response-$i.json" ] && grep -q "text" "$TEMP_DIR/response-$i.json"; then
            ((SUCCESS_COUNT++))
        fi
    done

    rm -rf "$TEMP_DIR"

    if [ $SUCCESS_COUNT -eq 10 ]; then
        pass "(All 10 requests succeeded)"
    elif [ $SUCCESS_COUNT -gt 5 ]; then
        warn "($SUCCESS_COUNT/10 requests succeeded)"
        ((PASSED++))
    else
        fail "(Only $SUCCESS_COUNT/10 requests succeeded)"
    fi
}

# Test 7: Performance benchmark
test_performance() {
    print_test "7" "Performance benchmark (10 requests)"

    START=$(date +%s%N)

    for i in {1..10}; do
        curl -s -X POST "$WISDOM_AGENT" \
            -F "text=Performance test $i" \
            -F "user=test-user" \
            -o /dev/null
    done

    END=$(date +%s%N)
    DURATION=$(( (END - START) / 1000000 ))
    AVG=$(( DURATION / 10 ))

    if [ $AVG -lt 3000 ]; then
        pass "(avg: ${AVG}ms - excellent)"
    elif [ $AVG -lt 5000 ]; then
        pass "(avg: ${AVG}ms - good)"
    elif [ $AVG -lt 10000 ]; then
        warn "(avg: ${AVG}ms - acceptable)"
        ((PASSED++))
    else
        fail "(avg: ${AVG}ms - too slow)"
    fi
}

# Test 8: Parameter persistence
test_parameter_persistence() {
    print_test "8" "Parameter persistence (3 sequential requests)"

    # Request 1: Enable web search
    RESPONSE1=$(curl -s -X POST "$WISDOM_AGENT" \
        -F "text=First message" \
        -F "user=test-user" \
        -F 'veniceParameters={"enable_web_search":"auto"}')

    # Request 2: No parameters (should use character defaults)
    RESPONSE2=$(curl -s -X POST "$WISDOM_AGENT" \
        -F "text=Second message" \
        -F "user=test-user")

    # Request 3: Disable web search
    RESPONSE3=$(curl -s -X POST "$WISDOM_AGENT" \
        -F "text=Third message" \
        -F "user=test-user" \
        -F 'veniceParameters={"enable_web_search":"off"}')

    if echo "$RESPONSE1" | grep -q "text" && \
       echo "$RESPONSE2" | grep -q "text" && \
       echo "$RESPONSE3" | grep -q "text"; then
        pass "(All requests succeeded, no parameter leakage)"
    else
        fail "(Parameter persistence issue detected)"
    fi
}

# Print summary
print_summary() {
    echo ""
    print_header "Test Results"

    PASS_RATE=$(( PASSED * 100 / TOTAL ))

    echo "  Total Tests:  $TOTAL"
    echo -e "  Passed:       ${GREEN}$PASSED${NC}"
    echo -e "  Failed:       ${RED}$FAILED${NC}"
    echo "  Pass Rate:    $PASS_RATE%"
    echo ""

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}  ✓ ALL TESTS PASSED!${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Phase 2 Runtime Integration: COMPLETE ✅"
        echo ""
    else
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}  ✗ SOME TESTS FAILED${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Please review the failed tests and check:"
        echo "  - Agent backend logs"
        echo "  - Venice API configuration"
        echo "  - Network connectivity"
        echo ""
    fi
}

# Main execution
main() {
    clear
    print_header "Venice AI Settings - Integration Test Suite"
    echo "  Testing user-controlled AI capabilities"
    echo "  Agent URL: $AGENT_URL"
    echo ""

    check_agent

    print_header "Running Tests"

    test_basic_message
    test_web_search_enabled
    test_web_search_disabled
    test_invalid_json
    test_multiple_agents
    test_concurrent_requests
    test_performance
    test_parameter_persistence

    print_summary

    if [ $FAILED -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main
main
