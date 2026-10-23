type Node = { type: string; name?: string; children?: Node[] };

export function remarkPullQuotes() {
  return (tree: Node) => {
    function walk(node: Node) {
      node.children = node.children?.flatMap((child) => {
        walk(child);
        if (child.type !== "paragraph" || !child.children?.some((entry) => entry.type === "mdxJsxTextElement" && entry.name === "Pull")) return [child];
        const blocks: Node[] = [];
        let text: Node[] = [];
        function flush() {
          if (text.length) blocks.push({ ...child, children: text });
          text = [];
        }
        for (const entry of child.children) {
          if (entry.type === "mdxJsxTextElement" && entry.name === "Pull") {
            flush();
            blocks.push({ ...entry, type: "mdxJsxFlowElement" });
          } else text.push(entry);
        }
        flush();
        return blocks;
      });
    }
    walk(tree);
  };
}
