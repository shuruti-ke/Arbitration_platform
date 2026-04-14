// test/system-test.js
// Comprehensive system test

const http = require('http');

console.log('Running comprehensive system test...');

// Test 1: Health check
console.log('Test 1: Health check');
const healthOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET'
};

const healthReq = http.request(healthOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Health check response:', data);
    
    // Test 2: Models endpoint
    console.log('Test 2: Models endpoint');
    const modelsOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/models',
      method: 'GET'
    };
    
    const modelsReq = http.request(modelsOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Models response:', data);
        
        // Test 3: Rules endpoint
        console.log('Test 3: Rules endpoint');
        const rulesOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/rules',
          method: 'GET'
        };
        
        const rulesReq = http.request(rulesOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            console.log('Rules response:', data);
            
            // Test 4: CA providers endpoint
            console.log('Test 4: CA providers endpoint');
            const caOptions = {
              hostname: 'localhost',
              port: 3000,
              path: '/api/ca/providers',
              method: 'GET'
            };
            
            const caReq = http.request(caOptions, (res) => {
              let data = '';
              res.on('data', (chunk) => {
                data += chunk;
              });
              
              res.on('end', () => {
                console.log('CA providers response:', data);
                console.log('System test completed successfully');
              });
            });
            
            caReq.on('error', (error) => {
              console.error('CA providers request error:', error.message);
            });
            
            caReq.end();
          });
        });
        
        rulesReq.on('error', (error) => {
          console.error('Rules request error:', error.message);
        });
        
        rulesReq.end();
      });
    });
    
    modelsReq.on('error', (error) => {
      console.error('Models request error:', error.message);
    });
    
    modelsReq.end();
  });
});

healthReq.on('error', (error) => {
  console.error('Health request error:', error.message);
});

healthReq.end();