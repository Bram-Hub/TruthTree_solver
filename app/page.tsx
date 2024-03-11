"use client";
import { useRef, useState } from "react";
import decomp from "./_tree/test/DS.json";
import { TruthTreeSolver } from "./_tree/solver";

export default function Home() {
  // const tree = TruthTree.deserialize(JSON.stringify(decomp));
  // for (const nodeId in tree.nodes) {
  //   const node = tree.nodes[nodeId];
  //   console.log(node.isDecomposed());
  // }

  // const solver = new TruthTreeSolver(JSON.stringify(decomp));
  // solver.expandAll();
  // // solver.expand();

  // console.log(solver.toString());
  // console.log(solver.isFinished());
  // console.log(solver.tree.leaves.size);
  // console.log(solver.tree.serialize());
  const [tree, setTree] = useState<TruthTreeSolver | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = (fileName: File) => {
    if (fileName === undefined) {
      return alert("You must select a file to open.");
    }

    const reader = new FileReader();
    reader.readAsText(fileName, "UTF-8");

    reader.onload = (loadEvent) => {
      const name = fileName.name.endsWith(".willow")
        ? fileName.name.substring(0, fileName.name.length - ".willow".length)
        : fileName.name;

      const fileContents = loadEvent.target?.result;
      if (typeof fileContents !== "string") {
        return alert(
          "The selected file does not contain a truth tree. Perhaps you selected the wrong file, or the file has been corrupted."
        );
      }

      setFileName(name);
      setTree(new TruthTreeSolver(fileContents));
    };
  };

  const saveFile = () => {
    if (!tree) return;
    tree.expandAll();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([tree.tree.serialize()], { type: "text/plain" })
    );
    a.download = `${fileName}_result.willow`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <input
        type="file"
        ref={inputRef}
        accept=".willow"
        onChange={(e) => {
          const files = e.target.files;
          if (!files || files.length === 0) return;
          loadFile(files[0]);
        }}
      />
      <button onClick={() => saveFile()}>Calculate</button>
    </main>
  );
}
