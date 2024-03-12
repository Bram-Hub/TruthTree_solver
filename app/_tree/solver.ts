import { AtomicStatement, NotStatement, Statement } from "./lib/statement";
import { TruthTree } from "./lib/tree";

interface LegalExpansion {
  nodeId: number;
  leaves: Array<number>;
}

export class TruthTreeSolver {
  static treeEvaluationFunction = (tree: TruthTree) => {
    console.log("Tree evaluation function called");
    // Add your code here to evaluate the truth tree

    return 1;
  };

  // Inner representation of the tree
  public tree: TruthTree;
  public contradictionMap: { [key: number]: Set<Statement> };
  public debugMode: boolean = false;

  constructor(jsonTreeText: string) {
    this.tree = TruthTree.deserialize(jsonTreeText);
    this.contradictionMap = {};
    this.cleanNonPremise();
  }

  private log(...messages: any[]) {
    if (this.debugMode) console.log(...messages);
  }

  /**
   * Removes all non-premise nodes from the tree.
   * Assuming all premise nodes are at the start of the tree.
   */
  private cleanNonPremise() {
    const cleanNode = (nodeId: number) => {
      const node = this.tree.nodes[nodeId];
      if (!node) {
        return;
      }
      if (!node.premise) {
        if (node.children.length <= 1) {
          const childId = node.children[0];
          this.tree.deleteNode(node.id);
          cleanNode(childId);
        } else {
          for (const childId of node.children) {
            cleanNode(childId);
          }
          this.tree.deleteNode(node.id);
        }
      }
    };

    for (const nodeId in this.tree.nodes) {
      cleanNode(parseInt(nodeId));
    }
  }

  /**
   * Returns a set of node ids from the root to the node
   * @param nodeId any node id
   * @returns a set of node ids from the root to the node
   */
  private getBranch(nodeId: number): Set<number> {
    const branch = new Set<number>();
    let node = this.tree.nodes[nodeId];
    while (node.parent !== null) {
      branch.add(node.id);
      node = this.tree.nodes[node.parent];
    }
    branch.add(node.id);

    return branch;
  }

  /**
   * Calculates the current branches that need to be expanded from the node
   * @param nodeId The node that can be expanded
   * @returns A set of leaf nodes that needed to be expanded from the node
   */
  private determineExpansionBranches(nodeId: number): Array<number> {
    const node = this.tree.nodes[nodeId];

    const leaves: Array<number> = [];

    // If the node is decomposed, it does not any expansion
    if (node.isDecomposed() === true) {
      return [];
    }

    for (const leafId of Array.from(this.tree.leaves)) {
      const leafNode = this.tree.nodes[leafId];

      // If the leaf is not a descendant of the node, skip it
      // We only want to expand the branches that are relevant to the node
      if (!node.isAncestorOf(leafId) && leafId !== node.id) {
        continue;
      }

      // If the leaf is a closed terminator, the branch is already closed.
      // We don't need to expand it
      if (leafNode.isClosedTerminator()) continue;

      // If exists a decomposed node in the branch, we don't need to expand it
      const branch = Array.from(this.getBranch(leafId));
      let containedInBranch = false;
      for (const decomposed of Array.from(node.decomposition)) {
        if (branch.includes(decomposed)) {
          containedInBranch = true;
          break;
        }
      }
      if (containedInBranch) continue;

      leaves.push(leafId);
    }

    return leaves;
  }

  /**
   * Determines the best expansion from a set of legal expansions
   * @param expansions A set of legal expansions of the tree
   * @returns The best expansion
   */
  private determineBestExpansion(
    expansions: LegalExpansion[]
  ): LegalExpansion | null {
    // TODO: Implement a function to determine the best expansion
    // ! For now, we just return the first expansion
    return expansions[0];
  }

  /**
   * Applies the expansion to the tree
   * @param nodeId The node that will be expanded
   * @param leaves A set of leaf nodes that the expansion will be applied
   * @returns A set of edited leaves after applying the expansion
   */
  private applyExpansion(nodeId: number, leaves: Array<number>) {
    const decomposition = this.tree.nodes[nodeId].statement?.decompose();

    if (!decomposition) return;
    if (decomposition.length === 0) return;

    const addedNodes: Array<number> = [];

    if (decomposition.length === 1) {
      // No need for branching
      for (const leafId of leaves) {
        let trailNodeId = leafId;
        for (const statementToAdd of decomposition[0]) {
          const newNodeId = this.tree.addNodeAfter(trailNodeId, false);
          if (newNodeId === null) {
            this.log("Error Applying Expansion: Could not add node");
            return;
          }
          const newNode = this.tree.nodes[newNodeId];
          newNode.text = statementToAdd.toString();

          addedNodes.push(newNodeId);

          trailNodeId = newNodeId;
        }
      }
    } else {
      // Branching
      for (const leafId of leaves) {
        for (const branch of decomposition) {
          let trailNodeId = leafId;

          let firstNodeToAdd = true;
          for (const statementToAdd of branch) {
            const newNodeId = this.tree.addNodeAfter(
              trailNodeId,
              firstNodeToAdd
            );
            firstNodeToAdd = false;
            if (newNodeId === null) {
              this.log(
                "Error Applying Expansion: Could not add node in branching"
              );
              return;
            }

            const newNode = this.tree.nodes[newNodeId];
            newNode.text = statementToAdd.toString();

            addedNodes.push(newNodeId);

            trailNodeId = newNodeId;
          }
        }
      }
    }

    // Update the decomposition set and Antecedent of the node
    this.tree.nodes[nodeId].decomposition = new Set([
      ...addedNodes,
      ...Array.from(this.tree.nodes[nodeId].decomposition),
    ]);
    this.tree.nodes[nodeId].correctDecomposition = null;

    for (const addedNodeId of addedNodes) {
      this.tree.nodes[addedNodeId].antecedent = nodeId;
      this.tree.nodes[addedNodeId].correctDecomposition = null;
    }

    // Returns the new leaves
    return new Set(addedNodes.filter((id) => this.tree.leaves.has(id)));
  }

  /**
   * Adds an open terminator to the tree after the given node
   * @param nodeId The leaf node to apply the open terminator
   */
  private applyOpenTerminator(nodeId: number) {
    const terminatorId = this.tree.addNodeAfter(nodeId, false);
    if (terminatorId === null) {
      this.log("Error Applying Open Terminator: Could not add node");
      return;
    }
    const terminatorNode = this.tree.nodes[terminatorId];
    terminatorNode.text = TruthTree.OPEN_TERMINATOR;
  }

  /**
   * Adds a closed terminator to the tree after the given node
   * @param nodeId The leaf node to apply the closed terminator
   * @param ref1 The first reference node for the closed terminator
   * @param ref2 The second reference node for the closed terminator
   */
  private applyClosedTerminator(nodeId: number, ref1: number, ref2: number) {
    const terminatorId = this.tree.addNodeAfter(nodeId, false);
    if (terminatorId === null) {
      this.log("Error Applying Closed Terminator: Could not add node");
      return;
    }
    const terminatorNode = this.tree.nodes[terminatorId];
    terminatorNode.decomposition = new Set([ref1, ref2]);
    terminatorNode.text = TruthTree.CLOSED_TERMINATOR;
  }

  /**
   * Checks if the leaf node is qualified for a closed terminator
   * @param nodeId The leaf node to check for a closed terminator
   */
  private tryClosedTerminator(nodeId: number) {
    if (!this.tree.leaves.has(nodeId)) {
      this.log("Node is not a leaf");
      return;
    }

    // Contains the compliment of the found statements
    const contradictionMap = new Map<string, number>();
    let foundContradiction = false;
    let ref1 = null;
    let ref2 = null;

    for (const ancestorId of Array.from(this.getBranch(nodeId))) {
      const ancestor = this.tree.nodes[ancestorId];
      const ancestorStatement = ancestor.statement;

      // If there is a contradiction, we can close the branch
      if (
        !foundContradiction &&
        (ancestorStatement instanceof AtomicStatement ||
          (ancestorStatement instanceof NotStatement &&
            ancestorStatement.operand instanceof AtomicStatement))
      ) {
        // If there is a contradiction, it's invalid
        if (contradictionMap.has(ancestorStatement.toString())) {
          // Branch has a contradiction
          foundContradiction = true;
          ref1 = ancestorId;
          ref2 = contradictionMap.get(ancestorStatement.toString());
        }

        // Otherwise, store this statement for possible future
        // contradictions
        if (ancestorStatement instanceof AtomicStatement) {
          contradictionMap.set(
            new NotStatement(ancestorStatement).toString(),
            ancestorId
          );
        } else {
          contradictionMap.set(
            ancestorStatement.operand.toString(),
            ancestorId
          );
        }
      }

      // Check if each ancestor is valid
      const ancestorValidity = ancestor.isValid();
      if (ancestorValidity !== true) {
        return;
      }
    }

    if (foundContradiction && ref1 && ref2) {
      this.applyClosedTerminator(nodeId, ref1, ref2);
    }
  }

  /**
   * Determines whether or not the tree need to be expanded to be correct
   * @returns true if the tree is correct and terminated, false otherwise
   */
  isFinished(): boolean {
    const { value: finished, message } = this.tree.isCorrect();
    if (!finished) {
      console.error(message);
    }
    return finished;
  }

  /**
   * @returns A string representation of all the statements in the tree
   */
  toString(): string {
    return Object.values(this.tree.nodes)
      .map(
        (node) =>
          `${node.id}: ${node.statement?.toString()} -- ${node.isDecomposed()}
          ${Array.from(node.decomposition)
            .map((d) => d.toString())
            .join(", ")}
          `
      )
      .join("\n");
  }

  /**
   * Expands the tree by one step, applying the best possible expansion
   * determined by determineBestExpansion function.
   * Returns true if the tree require more expansion, false otherwise.
   */
  expand(): boolean {
    const legalExpansions = this.possibleExpansions();
    if (legalExpansions.length === 0) {
      this.log("No legal expansions");
      for (const leafId of Array.from(this.tree.leaves)) {
        if (this.tree.nodes[leafId].isTerminator()) {
          continue;
        }
        this.applyOpenTerminator(leafId);
      }
      return false;
    }
    const bestExpansion = this.determineBestExpansion(legalExpansions);
    if (bestExpansion) {
      this.log("Expanding", bestExpansion.nodeId, bestExpansion.leaves);
      const newLeaves = this.applyExpansion(
        bestExpansion.nodeId,
        bestExpansion.leaves
      );
      if (newLeaves) {
        for (const newLeafId of Array.from(newLeaves)) {
          this.tryClosedTerminator(newLeafId);
        }
      }
    }
    return true;
  }

  /**
   * Returns all the possible expansions of the tree
   */
  possibleExpansions(): LegalExpansion[] {
    let legalExpansions: LegalExpansion[] = [];
    for (let nodeId in this.tree.nodes) {
      const node = this.tree.nodes[nodeId];
      const response = node.isDecomposed();
      if (!(response === true)) {
        legalExpansions.push({
          nodeId: node.id,
          leaves: this.determineExpansionBranches(node.id),
        });
      }
    }
    return legalExpansions;
  }

  /**
   * Expands the tree until it is finished
   */
  expandAll() {
    while (this.expand());
  }
}
