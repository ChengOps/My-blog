export type TocEntry = { id: string; text: string; level: number };
type TreeNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: TreeNode[];
};

export function createHeadingId(text: string, used: Set<string>): string {
  const base = text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-") || "section";
  let id = base;
  let suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  used.add(id);
  return id;
}

function textContent(node: TreeNode): string {
  return node.value ?? node.children?.map(textContent).join("") ?? "";
}

export function rehypeHeadings(toc: TocEntry[]) {
  return () => (tree: TreeNode) => {
    const used = new Set<string>();
    function walk(node: TreeNode) {
      if (node.tagName && /^h[1-6]$/.test(node.tagName)) {
        const text = textContent(node);
        const id = createHeadingId(text, used);
        node.properties = { ...node.properties, id };
        const level = Number(node.tagName[1]);
        if (level === 2 || level === 3) toc.push({ text, id, level });
      }
      node.children?.forEach(walk);
    }
    walk(tree);
  };
}
