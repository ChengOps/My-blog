import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import { mdxComponents } from "@/components/mdx-components";
import { rehypeHeadings, type TocEntry } from "./headings";

export async function renderPost(source: string) {
  const toc: TocEntry[] = [];
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeHeadings(toc), [rehypePrettyCode, {
          theme: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
          keepBackground: false,
        }]],
      },
    },
  });
  return { content, toc };
}
