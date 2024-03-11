import decomp from "./_tree/test/Sheet1Problem11.json";
import { TruthTreeSolver } from "./_tree/solver";

export default function Home() {
  // const tree = TruthTree.deserialize(JSON.stringify(decomp));
  // for (const nodeId in tree.nodes) {
  //   const node = tree.nodes[nodeId];
  //   console.log(node.isDecomposed());
  // }

  const solver = new TruthTreeSolver(JSON.stringify(decomp));
  solver.expandAll();

  console.log(solver.toString());
  console.log(solver.isFinished());
  console.log(solver.tree.leaves.size);
  console.log(solver.tree.serialize());
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {/* {solver.toString()} */}

      {/* <p>Active Branches: {tree.leaves.size}</p> */}
    </main>
  );
}
