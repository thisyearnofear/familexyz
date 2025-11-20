
// Node 22 has built-in fetch and FormData

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

interface Agent {
    id: string;
    name: string;
}

// Define the structure of our demo story
interface DemoAct {
    title: string;
    description: string;
    steps: {
        user: string;
        agentName: string; // Fuzzy match name
        message: string;
        context?: string; // What to say in the narration/console
        delay?: number; // Custom delay after this step
        expectHedera?: boolean; // Whether to check for a transaction after this step
    }[];
}

const DEMO_SCRIPT: DemoAct[] = [
    {
        title: "ACT 1: The Generational Gap",
        description: "Demonstrating the 'Generational Bridge' agent helping a parent understand their teen.",
        steps: [
            {
                user: "Dad (Robert)",
                agentName: "Generational",
                message: "I'm struggling to connect with my son Leo. He's always on his phone and uses words I don't understand like 'skibidi' and 'rizz'. I feel like we're aliens to each other.",
                context: "Dad expresses frustration about the communication gap.",
                delay: 4000
            },
            {
                user: "Dad (Robert)",
                agentName: "Generational",
                message: "Can you give me a conversation starter that won't make me look 'cringe'?",
                context: "Dad asks for actionable advice to bridge the gap.",
                delay: 4000
            }
        ]
    },
    {
        title: "ACT 2: Digital Overload",
        description: "The 'Presence' agent helping the family manage digital wellness.",
        steps: [
            {
                user: "Mom (Sarah)",
                agentName: "Presence",
                message: "I've noticed we are all on our screens during dinner. It's becoming a bad habit. How can we stop this without a big fight?",
                context: "Mom identifies a digital wellness issue affecting family time.",
                delay: 4000
            }
        ]
    },
    {
        title: "ACT 3: Hedera Consensus & Wisdom",
        description: "The 'Wisdom' agent resolving conflict and LOGGING IT TO HEDERA.",
        steps: [
            {
                user: "Grandma (Alice)",
                agentName: "Wisdom",
                message: "I want to share some wisdom about handling family conflict. We had a big fight yesterday, but we resolved it with patience.",
                context: "Grandma shares a significant family milestone.",
                delay: 2000
            },
            {
                user: "Grandma (Alice)",
                agentName: "Wisdom",
                message: "Please record this resolution as a family milestone: 'The Great Sunday Dinner Resolution'. We agreed to listen more.",
                context: "Requesting to log this milestone to the blockchain.",
                delay: 6000,
                expectHedera: true
            }
        ]
    },
    {
        title: "ACT 4: Growth & Rewards",
        description: "The 'Growth' agent helping a teen set positive goals.",
        steps: [
            {
                user: "Son (Leo)",
                agentName: "Growth",
                message: "I want to start saving money for a car. Can you help me set a goal?",
                context: "The teen (Leo) engages with the Growth agent.",
                delay: 4000
            }
        ]
    }
];

async function getAgents(): Promise<Agent[]> {
    try {
        const response = await fetch(`${BASE_URL}/agents`);
        if (!response.ok) {
            throw new Error(`Failed to fetch agents: ${response.statusText}`);
        }
        const data = await response.json();

        if (data && typeof data === 'object') {
             // Check for { agents: [...] }
             if ('agents' in data && Array.isArray((data as any).agents)) {
                 return (data as any).agents;
             }
             // Check for { data: { agents: [...] } }
             if ('data' in data && (data as any).data && 'agents' in (data as any).data && Array.isArray((data as any).data.agents)) {
                 return (data as any).data.agents;
             }
             // Check for direct array [...]
             if (Array.isArray(data)) {
                 return data as Agent[];
             }
        }

        console.warn("⚠️ Unexpected response format from /agents:", JSON.stringify(data).substring(0, 200));
        return [];
    } catch (error) {
        console.error("Error fetching agents:", error);
        return [];
    }
}

async function getFamilyStats() {
    try {
        const response = await fetch(`${BASE_URL}/family/stats`);
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        return null;
    }
}

async function sendMessage(agentId: string, user: string, message: string) {
    try {
        const formData = new FormData();
        formData.append("text", `${user}: ${message}`);
        formData.append("user", "user");

        const response = await fetch(`${BASE_URL}/${agentId}/message`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.statusText}`);
        }

        const data = await response.json();

        // Format output for the demo
        console.log(`\n👤 \x1b[1m${user}:\x1b[0m ${message}`);

        // Simulate "typing" delay for the agent response to feel natural in the console
        await new Promise(resolve => setTimeout(resolve, 1500));

        const responseText = (data as any).text || "No response text";
        console.log(`🤖 \x1b[36m[Agent]:\x1b[0m ${responseText}`);

        return data;
    } catch (error) {
        console.error(`❌ Error sending message from ${user}:`, error);
    }
}

async function runSimulation() {
    console.clear();
    console.log("\x1b[1m\x1b[32m==================================================\x1b[0m");
    console.log("   👨‍👩‍👧‍👦 FAMILYXYZ DEMO SIMULATION SCRIPT 👨‍👩‍👧‍👦   ");
    console.log("\x1b[1m\x1b[32m==================================================\x1b[0m");
    console.log("This script will simulate family interactions to populate");
    console.log("the dashboard and demonstrate agent capabilities.\n");

    // Initial check
    let agents = await getAgents();
    if (agents.length === 0) {
        console.log("⚠️  Agents not found initially. Waiting 5s for server...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        agents = await getAgents();
    }

    if (agents.length === 0) {
        console.error("❌ No agents found. Please ensure the agent server is running (pnpm --filter agent start).");
        return;
    }

    console.log(`ℹ️  Found ${agents.length} active agents.`);

    for (const act of DEMO_SCRIPT) {
        console.log(`\n\n\x1b[1m\x1b[33m🎬 ${act.title}\x1b[0m`);
        console.log(`\x1b[3m${act.description}\x1b[0m`);
        console.log("--------------------------------------------------");

        for (const step of act.steps) {
            // Find the matching agent
            const agent = agents.find(a => a.name.toLowerCase().includes(step.agentName.toLowerCase()));

            if (agent) {
                if (step.context) {
                    console.log(`\n👉 \x1b[2mContext: ${step.context}\x1b[0m`);
                }
                await sendMessage(agent.id, step.user, step.message);

                if (step.expectHedera) {
                    console.log("\n\x1b[35m⏳ Verifying Hedera Consensus...\x1b[0m");
                    // Poll for transaction ID
                    let txId = null;
                    for (let i = 0; i < 5; i++) {
                        const stats = await getFamilyStats();
                        if (stats && (stats as any).latestTransactionId) {
                            txId = (stats as any).latestTransactionId;
                            break;
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    if (txId) {
                        console.log(`\x1b[1m\x1b[32m✅ HEDERA TRANSACTION CONFIRMED!\x1b[0m`);
                        console.log(`   TxID: ${txId}`);
                        console.log(`   View on HashScan: https://hashscan.io/testnet/transaction/${txId}`);
                    } else {
                        console.log(`\x1b[33m⚠️  (Hedera transaction pending or not configured in env)\x1b[0m`);
                    }
                }

                const delay = step.delay || 3000;
                console.log(`\n\x1b[2m(Waiting ${delay/1000}s for viewer to read...)\x1b[0m`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.warn(`⚠️  Agent matching '${step.agentName}' not found. Skipping step.`);
            }
        }
    }

    console.log("\n\x1b[1m\x1b[32m==================================================\x1b[0m");
    console.log("   ✅ DEMO SIMULATION COMPLETE");
    console.log("   Check the Dashboard for updated metrics!");
    console.log("\x1b[1m\x1b[32m==================================================\x1b[0m");
}

runSimulation();
