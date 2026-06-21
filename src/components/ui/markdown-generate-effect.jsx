import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../../lib/utils";
import "./markdown-generate-effect.css";

export const MarkdownGenerateEffect = ({
  content,
  className,
  isNew = false,
  speed = 15, // ms per character
}) => {
  const [displayedText, setDisplayedText] = useState(isNew ? "" : content);
  const [isAnimating, setIsAnimating] = useState(isNew);

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(content);
      setIsAnimating(false);
      return;
    }

    let i = 0;
    setIsAnimating(true);
    setDisplayedText("");

    const interval = setInterval(() => {
      i += 3; // Reveal 3 characters at a time to be faster
      if (i >= content.length) {
        setDisplayedText(content);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        setDisplayedText(content.slice(0, i));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content, isNew, speed]);

  return (
    <div
      className={cn(
        "ns-markdown-generate-wrap",
        isAnimating && "is-generating",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayedText}
      </ReactMarkdown>
    </div>
  );
};
