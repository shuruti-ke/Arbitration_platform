// test/compliance-test.js
// Test script for compliance components

const ConflictGraph = require('../src/models/conflict-graph');
const RuleEngine = require('../src/services/rule-engine');

console.log('Testing compliance components...');

// Test Conflict Graph
const conflictGraph = new ConflictGraph();
conflictGraph.addNode('arbitrator-1', { type: 'arbitrator', name: 'John Doe' });
conflictGraph.addNode('party-1', { type: 'party', name: 'Acme Corp' });
conflictGraph.createRelationship('arbitrator-1', 'party-1', 'prior-relationship', { type: 'employment', endDate: '2020-01-01' });

console.log('Conflict graph nodes:', conflictGraph.nodes.size);
console.log('Conflict graph relationships:', conflictGraph.relationships.size);

// Test Rule Engine
const ruleEngine = new RuleEngine();
ruleEngine.registerInstitutionRules('Test Institution', [
  { id: 'rule-1', description: 'Test rule' }
]);

console.log('Rule engine institutions:', Array.from(ruleEngine.institutionRules.keys()));

console.log('Compliance tests completed successfully');