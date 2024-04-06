import { TruthTree } from "@/app/_tree/lib/tree";
import React from "react";
import TruthTreeNodeDisplay from "./truthtreeNode";
import TreeBranch from "./truthtreeBranch";

interface TruthTreeProps {
  tree: TruthTree | undefined;
  fileName: string;
}

const NoTree: React.FC = () => {
  return (
    <>
      <h2 className="font-bold text-xl">Truth Tree</h2>
      <p>There is no tree to display.</p>
    </>
  );
};

const TruthTreeRepresentation = ({ tree }: { tree: TruthTree }) => {
  const showNode: any = (nodeId: number) => {
    // console.log(nodeId, tree.nodes[nodeId]);
    if (tree.nodes[nodeId].children.length > 1) {
      return (
        <>
          <TruthTreeNodeDisplay tree={tree} nodeId={nodeId} />
          <TreeBranch />
          <div className="flex gap-24">
            {tree.nodes[nodeId].children.map((node) => {
              return showBranch(node);
            })}
          </div>
        </>
      );
    }
    return (
      <>
        <TruthTreeNodeDisplay tree={tree} nodeId={nodeId} />
        {tree.nodes[nodeId].children.length !== 0 &&
          showNode(tree.nodes[nodeId].children[0])}
      </>
    );
  };

  const showBranch = (nodeId: number) => {
    return (
      <div className="space-y-1 w-auto" key={nodeId}>
        {showNode(nodeId)}
      </div>
    );
  };

  return <div className="inline">{showBranch(tree.root)}</div>;
};

const TruthTreeDisplay = ({ tree, fileName }: TruthTreeProps) => {
  return (
    <section className="grow overflow-x-auto">
      {!tree && <NoTree />}
      {!!tree && (
        <>
          <h3 className="font-bold text-xl ">{fileName}</h3>
          <TruthTreeRepresentation tree={tree} />
        </>
      )}
    </section>
  );
};

export default TruthTreeDisplay;
