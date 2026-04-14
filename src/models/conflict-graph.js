// src/models/conflict-graph.js
// Conflict Graph data model for arbitrators, counsel, firms, etc.

class ConflictGraph {
  constructor() {
    this.nodes = new Map();
    this.relationships = new Map();
  }

  /**
   * Add a node to the conflict graph
   * @param {string} id - Node ID
   * @param {object} data - Node data
   */
  addNode(id, data) {
    this.nodes.set(id, {
      id,
      ...data,
      createdAt: new Date()
    });
  }

  /**
   * Create a relationship between nodes
   * @param {string} from - Source node ID
   * @param {string} to - Target node ID
   * @param {string} type - Relationship type
   * @param {object} properties - Relationship properties
   */
  createRelationship(from, to, type, properties = {}) {
    const relationshipId = `${from}-${to}-${type}`;
    this.relationships.set(relationshipId, {
      from,
      to,
      type,
      properties,
      createdAt: new Date()
    });
    
    return relationshipId;
  }

  /**
   * Get node by ID
   * @param {string} id - Node ID
   * @returns {object} Node data
   */
  getNode(id) {
    return this.nodes.get(id);
  }

  /**
   * Get all relationships for a node
   * @param {string} nodeId - Node ID
   * @returns {Array} Relationships
   */
  getNodeRelationships(nodeId) {
    const nodeRelationships = [];
    
    for (const [key, relationship] of this.relationships) {
      if (relationship.from === nodeId || relationship.to === nodeId) {
        nodeRelationships.push(relationship);
      }
    }
    
    return nodeRelationships;
  }

  /**
   * Check for conflicts of interest
   * @param {object} caseData - Case data
   * @returns {object} Conflict analysis
   */
  checkConflicts(caseData) {
    // This would contain logic to check for conflicts of interest
    // based on the case data and existing relationships in the graph
    return {
      conflicts: [],
      potentialConflicts: [],
      analysis: {
        checkedAt: new Date().toISOString(),
        totalEntities: this.nodes.size,
        totalRelationships: this.relationships.size
      }
    };
  }
}

module.exports = ConflictGraph;