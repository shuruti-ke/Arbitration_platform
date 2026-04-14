// test/basic-test.js
// Basic test to verify the implementation

const AIOrchestrator = require('../src/services/ai-orchestrator');

// Test the AI Orchestrator service
console.log('Testing AI Orchestrator...');

const aiOrchestrator = new AIOrchestrator();

// Test model registration
aiOrchestrator.registerModel('test-model', {
  version: '1.0.0',
  type: 'test',
  description: 'Test model'
});

// Test listing models
const models = aiOrchestrator.listModels();
console.log('Registered models:', models);

// Test model execution
aiOrchestrator.executeModel('test-model', { data: 'test' })
  .then(result => {
    console.log('Model execution result:', result);
    console.log('Test completed successfully');
  })
  .catch(error => {
    console.error('Test failed:', error);
  });