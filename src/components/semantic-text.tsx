import { Children, cloneElement, Fragment, isValidElement, type ReactNode } from "react";

const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
const opening = /^[\p{Ps}\p{Pi}"']+$/u;
const closing = /^[\p{Pe}\p{Pf}，。、！？：；…,.!?:;"']+$/u;

function words(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      const segments = Array.from(segmenter.segment(child));
      const mobile = segments.map(({ segment, index }, position) => {
        const next = segments[position + 1]?.segment;
        const canBreak = next !== undefined && !/\s/u.test(segment + next) && !opening.test(segment) && !closing.test(next);
        return <Fragment key={index}>{segment}{canBreak && <wbr />}</Fragment>;
      });
      return <><span className="semantic-desktop">{child}</span><span className="semantic-mobile">{mobile}</span></>;
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children !== undefined) {
      return cloneElement(child, undefined, words(child.props.children));
    }
    return child;
  });
}

export function SemanticText({ children }: { children: ReactNode }) {
  return <>{words(children)}</>;
}
