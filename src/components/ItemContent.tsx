import type { Item, SubjectId } from "../types";

export function ItemContent({ item, subject }: { item: Item; subject: SubjectId }) {
  if (item.kind === "dots") {
    const count = item.dots ?? Number(item.content);
    return (
      <div className="dots-wrap" role="img" aria-label={`${count} dots to count`}>
        {Array.from({ length: count }, (_, index) => (
          <span key={index} className="dot" />
        ))}
      </div>
    );
  }

  if (item.kind === "comprehension") {
    return (
      <div className="comprehension">
        {item.passage ? <p className="comprehension-passage">{item.passage}</p> : null}
        <p className="comprehension-question">{item.content}</p>
      </div>
    );
  }

  const content = item.content;
  const words = content.trim().split(/\s+/).length;
  const isKannada = subject === "kannada";

  if (item.kind === "answer") {
    const isExpression = /^[\d\s+\-−×÷=]+$/.test(content);
    return (
      <div className={`math-content ${isExpression ? "is-expression" : "is-question"}`}>
        {content}
      </div>
    );
  }

  if (item.kind === "say") {
    return (
      <div
        className={`reading-content is-sound ${isKannada ? "kannada-font" : ""}`}
        lang={isKannada ? "kn" : undefined}
      >
        {content}
      </div>
    );
  }

  const sizeClass = words > 20 ? "is-story" : words > 8 ? "is-para" : "is-word";
  return (
    <div
      className={`reading-content ${sizeClass} ${isKannada ? "kannada-font" : ""}`}
      lang={isKannada ? "kn" : undefined}
    >
      {content}
    </div>
  );
}
