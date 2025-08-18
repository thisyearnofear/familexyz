// Test script to verify frontend-backend chat integration
const testChatIntegration = async () => {
  console.log('🧪 Testing Chat Integration...\n');
  
  const agents = [
    { id: 'wisdom', name: 'Wisdom' },
    { id: 'intimacy', name: 'Intimacy' },
    { id: 'generationalbridge', name: 'Generational Bridge' },
    { id: 'presence', name: 'Presence' },
    { id: 'growth', name: 'Growth' }
  ];
  
  for (const agent of agents) {
    try {
      console.log(`Testing ${agent.name} agent...`);
      
      const response = await fetch(`http://localhost:3000/${agent.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Hello ${agent.name}, can you introduce yourself?`,
          userId: 'test-user-123',
          userName: 'Test Family Member'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle both array and object responses (like the frontend does)
        const responseData = Array.isArray(data) ? data[0] : data;
        
        console.log(`✅ ${agent.name}: ${responseData.text?.substring(0, 100)}...`);
      } else {
        console.log(`❌ ${agent.name}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${agent.name}: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Chat integration test completed!');
};

// Run the test
testChatIntegration().catch(console.error);
