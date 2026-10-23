import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";
import { SemanticText } from "./semantic-text";

function MdxImage({ src, alt, width, height }: ComponentProps<"img">) {
  if (typeof src !== "string" || !alt?.trim()) throw new Error("文章图片需要 src 和有意义的 alt 文本");
  return <Image src={src} alt={alt} width={Number(width ?? 1200)} height={Number(height ?? 675)} sizes="(max-width: 768px) 100vw, 680px" />;
}

export const mdxComponents = {
  img: MdxImage,
  Image: MdxImage,
  pre: (props: ComponentProps<"pre">) => <pre {...props} tabIndex={0} aria-label="代码示例，可横向滚动" />,
  table: (props: ComponentProps<"table">) => (
    <div className="table-scroll" role="region" aria-label="可横向滚动的表格" tabIndex={0}><table {...props} /></div>
  ),
  Pull: ({ children }: { children: ReactNode }) => (
    <figure className="pull-quote"><SemanticText>{children}</SemanticText></figure>
  ),
};
