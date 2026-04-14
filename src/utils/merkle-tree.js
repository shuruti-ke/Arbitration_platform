// src/utils/merkle-tree.js
// Merkle Tree utility for document integrity verification

const crypto = require('crypto');

class MerkleTree {
  constructor(data) {
    this.leaves = data.map(item => this.hash(item));
    this.layers = [this.leaves];
    this.createTree();
  }

  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  concatHash(left, right) {
    return this.hash(left + right);
  }

  createTree() {
    let layer = this.leaves;
    while (layer.length > 1) {
      const newLayer = [];
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i];
        const right = layer[i + 1] || left;
        newLayer.push(this.concatHash(left, right));
      }
      this.layers.push(newLayer);
      layer = newLayer;
    }
  }

  getRoot() {
    return this.layers[this.layers.length - 1][0];
  }

  getProof(leaf) {
    const leafHash = this.hash(leaf);
    const proof = [];
    let currentHash = leafHash;
    let index = this.leaves.indexOf(leafHash);

    if (index === -1) {
      throw new Error('Leaf not found in tree');
    }

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isLeft = index % 2 === 0;
      const siblingIndex = isLeft ? index + 1 : index - 1;
      
      if (siblingIndex < layer.length) {
        proof.push({
          left: isLeft,
          hash: layer[siblingIndex]
        });
      }
      
      // Calculate parent hash for next iteration
      const parentIndex = Math.floor(index / 2);
      index = parentIndex;
    }

    return proof;
  }

  verifyProof(leaf, proof, root) {
    let hash = this.hash(leaf);
    
    for (const proofItem of proof) {
      if (proofItem.left) {
        hash = this.concatHash(hash, proofItem.hash);
      } else {
        hash = this.concatHash(proofItem.hash, hash);
      }
    }
    
    return hash === root;
  }
}

module.exports = MerkleTree;