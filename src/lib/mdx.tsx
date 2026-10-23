import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import { mdxComponents } from "@/components/mdx-components";
import { rehypeHeadings, type TocEntry } from "./headings";
import { codeTheme } from "./code-theme";
import { remarkPullQuotes } from "./pull-quotes";

export async function renderPost(source: string) {
  const toc: TocEntry[] = [];
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkPullQuotes],
        rehypePlugins: [rehypeHeadings(toc), [rehypePrettyCode, {
          theme: codeTheme,
          keepBackground: false,
        }]],
      },
    },
  });
  return { content, toc };
}
