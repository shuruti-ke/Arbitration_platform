// test/merkle-test.js
// Test script for Merkle tree implementation

const MerkleTree = require('../src/utils/merkle-tree');

console.log('Testing Merkle tree implementation...');

// Test data
const testData = [
  'Document 1 content',
  'Document 2 content',
  'Document 3 content',
  'Document 4 content'
];

// Create a Merkle tree
const merkleTree = new MerkleTree(testData);

console.log('Merkle tree created successfully');
console.log('Root hash:', merkleTree.getRoot());

// Test proof generation
const proof = merkleTree.getProof(testData[0]);
console.log('Proof for first document:', proof);

console.log('Merkle tree test completed successfully');