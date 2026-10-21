import Image from "next/image";
import type { ComponentProps } from "react";

function MdxImage({ src, alt, width, height }: ComponentProps<"img">) {
  if (typeof src !== "string" || !alt?.trim()) throw new Error("文章图片需要 src 和有意义的 alt 文本");
  return <Image src={src} alt={alt} width={Number(width ?? 1200)} height={Number(height ?? 675)} sizes="(max-width: 768px) 100vw, 680px" />;
}

export const mdxComponents = {
  img: MdxImage,
  Image: MdxImage,
  table: (props: ComponentProps<"table">) => (
    <div className="table-scroll" role="region" aria-label="可横向滚动的表格" tabIndex={0}><table {...props} /></div>
  ),
};
