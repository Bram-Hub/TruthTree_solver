"use client";
import { useRef, useState } from "react";
import { TruthTreeSolver } from "./_tree/solver";
import TruthTreeDisplay from "@/components/truthtree";

export default function Home() {
  const [tree, setTree] = useState<TruthTreeSolver | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const treeHistory = useRef<string[]>([]);
  const [_, reload] = useState(0); // Used to force a re-render

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

  const progress = () => {
    if (!tree) return;
    // Save the current tree to the history
    treeHistory.current.push(tree.tree.serialize());
    tree.expand(tree.prioritizeMoreBranch);
    reload((prev) => prev + 1);
  };

  const undo = () => {
    if (treeHistory.current.length === 0) {
      return alert("There are no more previous states to return to.");
    }
    const previousState = treeHistory.current.pop();
    if (!previousState) return;
    setTree(new TruthTreeSolver(previousState, false));
    reload((prev) => prev + 1);
  };

  const fastForward = () => {
    if (!tree) return;
    // Save the current tree to the history
    treeHistory.current.push(tree.tree.serialize());
    tree.expandAll();
    reload((prev) => prev + 1);
  };

  return (
    <main className="flex min-h-screen flex-col items-start justify-between py-12 px-16 gap-8">
      <section className="h-full flex flex-col gap-4">
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
        <div className="space-y-2">
          <div className="flex justify-between gap-2">
            <button
              className="inline p-2 px-4 rounded bg-blue-500 text-white hover:bg-blue-700"
              onClick={() => progress()}
            >
              Progress
            </button>
            <button
              className="inline p-2 px-4 rounded  text-white bg-gray-500 hover:bg-gray-700"
              onClick={() => undo()}
            >
              Undo
            </button>
            <button
              className="inline p-2 px-4 rounded  text-white bg-orange-500 hover:bg-orange-700"
              onClick={() => fastForward()}
            >
              Fast Forward
            </button>
          </div>
          <button
            className="block w-full p-2 px-4 rounded bg-black text-white hover:bg-gray-800"
            onClick={() => saveFile()}
          >
            Save File
          </button>
        </div>
      </section>
      <TruthTreeDisplay tree={tree?.tree} fileName={fileName} />
    </main>
  );
}
