import http from 'http';

const checkServer = () => {
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/',
    method: 'GET',
    timeout: 3000
  };

  const req = http.request(options, (res) => {
    console.log('✅ Server is running on port 8080');
    console.log('🚀 You can start the Next.js app now with: npm run dev');
  });

  req.on('error', (err) => {
    console.log('❌ Signaling server is NOT running on port 8080');
    console.log('');
    console.log('🔧 To fix this, run the following commands:');
    console.log('');
    console.log('1. Open a new terminal/command prompt');
    console.log('2. Navigate to the server directory:');
    console.log('   cd fermistream/server');
    console.log('');
    console.log('3. Install dependencies (if not done):');
    console.log('   npm install');
    console.log('');
    console.log('4. Start the signaling server:');
    console.log('   npm start');
    console.log('');
    console.log('5. You should see: "🚀 Signaling server running on port 8080"');
    console.log('');
    console.log('6. Then come back to this terminal and run:');
    console.log('   npm run dev');
    console.log('');
    console.log('💡 Keep both terminals open - one for the server, one for the client');
  });

  req.on('timeout', () => {
    console.log('❌ Server check timed out');
    req.destroy();
  });

  req.end();
};

console.log('🔍 Checking if signaling server is running...');
checkServer(); 