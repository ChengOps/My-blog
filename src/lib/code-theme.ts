export const codeTheme = {
  name: "avatar",
  colors: {
    "editor.background": "var(--code-background)",
    "editor.foreground": "var(--code-foreground)",
  },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "var(--code-comment)" } },
    { scope: ["keyword", "storage", "entity.name.type", "support.type", "entity.name.tag"], settings: { foreground: "var(--code-violet)" } },
    { scope: ["string", "constant.other.symbol"], settings: { foreground: "var(--code-rose)" } },
    { scope: ["entity.name.function", "support.function", "constant.numeric", "constant.language", "variable", "entity.other.attribute-name"], settings: { foreground: "var(--code-blue)" } },
  ],
};
