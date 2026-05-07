import React, { useMemo } from "react";
import DOMPurify from "dompurify";

const formatMarkdown = (text) =>
  text
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

const MarkdownText = ({ text, className }) => {
  const html = useMemo(() => DOMPurify.sanitize(formatMarkdown(text || "")), [text]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default MarkdownText;
