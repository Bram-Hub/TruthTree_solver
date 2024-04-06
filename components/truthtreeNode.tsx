import { TruthTree, TruthTreeNode } from "@/app/_tree/lib/tree";
import React from "react";

interface TruthTreeNodeProps {
  tree: TruthTree;
  nodeId: number;
}

const NodeLabel = ({ label }: { label: string }) => {
  return (
    <div className="rounded-full px-4 py-1 font-mono text-sm  border border-black">
      {label}
    </div>
  );
};

const TruthTreeNodeDisplay = ({ tree, nodeId }: TruthTreeNodeProps) => {
  const node: TruthTreeNode | null = tree.getNode(nodeId);
  if (!node) {
    return <div>Node not found</div>;
  }

  const label =
    node.antecedent !== null
      ? `from ${node.antecedent}`
      : node.premise
      ? "premise"
      : null;

  return (
    <div className="flex gap-3 items-center">
      <div className="bg-black text-white font-light aspect-square w-8 h-8 flex items-center justify-center">
        {nodeId}
      </div>
      <div>{node.text}</div>
      {label && <NodeLabel label={label} />}
    </div>
  );
};

export default TruthTreeNodeDisplay;
