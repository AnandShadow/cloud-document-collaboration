// Direct test of AI endpoint
const axios = require('axios');

console.log('🧪 Testing AI Endpoint Directly...\n');

async function testHealth() {
    try {
        console.log('1️⃣ Testing Health Endpoint...');
        const response = await axios.get('http://localhost:5000/health');
        console.log('✅ Health Check Success!');
        console.log('Response:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health Check Failed!');
        console.error('Error:', error.message);
        if (error.code) console.error('Code:', error.code);
        return false;
    }
}

async function testAI() {
    try {
        console.log('\n2️⃣ Testing AI Endpoint...');
        const response = await axios.post('http://localhost:5000/api/ai/advanced', {
            text: 'hello',
            task: 'generate',
            prompt: 'Write a professional hello world message',
            toneTarget: 'professional',
            length: 'short'
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        console.log('✅ AI Request Success!');
        console.log('Provider:', response.data.provider);
        console.log('Result:', response.data.result);
        return true;
    } catch (error) {
        console.error('❌ AI Request Failed!');
        console.error('Error:', error.message);
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        } else if (error.code) {
            console.error('Code:', error.code);
        }
        return false;
    }
}

async function runTests() {
    const healthOk = await testHealth();
    
    if (healthOk) {
        await testAI();
    } else {
        console.log('\n❌ Skipping AI test because health check failed');
        console.log('💡 Backend is not accessible on port 5000');
    }
}

runTests();
