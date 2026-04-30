"use client";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export default function ChatMessage({ message, isStreaming }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 animate-fade-in-up ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
          isUser
            ? "bg-gradient-to-br from-accent-400 to-accent-500 text-white"
            : "bg-gradient-to-br from-primary-500 to-primary-700 text-white"
        }`}
      >
        {isUser ? "U" : "G"}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary-600/20 border border-primary-500/20 text-surface-100"
            : "bg-surface-800/80 border border-surface-700/40 text-surface-200"
        } ${isStreaming ? "typing-cursor" : ""}`}
      >
        <div className="markdown-content">
          <FormattedContent content={message.content} />
        </div>
      </div>
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  if (!content) return <span className="text-surface-500 italic">Thinking...</span>;

  // Simple markdown-like rendering
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="my-2">
            <code>{codeContent.trimEnd()}</code>
          </pre>
        );
        codeContent = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeContent = "";
      }
      return;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      return;
    }

    if (line.startsWith("### ")) {
      elements.push(<h3 key={i}>{formatInline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i}>{formatInline(line.slice(3))}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i}>{formatInline(line.slice(2))}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-4 list-disc">
          {formatInline(line.slice(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <li key={i} className="ml-4 list-decimal">
          {formatInline(line.replace(/^\d+\.\s/, ""))}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<br key={i} />);
    } else {
      elements.push(<p key={i}>{formatInline(line)}</p>);
    }
  });

  // Close unclosed code block
  if (inCodeBlock && codeContent) {
    elements.push(
      <pre key="code-final">
        <code>{codeContent.trimEnd()}</code>
      </pre>
    );
  }

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    type MatchCandidate = { index: number; length: number; node: React.ReactNode };
    const candidates: MatchCandidate[] = [];

    if (boldMatch && boldMatch.index !== undefined) {
      candidates.push({
        index: boldMatch.index,
        length: boldMatch[0].length,
        node: <strong key={key++}>{boldMatch[1]}</strong>,
      });
    }

    if (codeMatch && codeMatch.index !== undefined) {
      candidates.push({
        index: codeMatch.index,
        length: codeMatch[0].length,
        node: <code key={key++}>{codeMatch[1]}</code>,
      });
    }

    if (candidates.length === 0) {
      parts.push(remaining);
      break;
    }

    const firstMatch = candidates.sort((a, b) => a.index - b.index)[0];
    if (firstMatch.index > 0) {
      parts.push(remaining.slice(0, firstMatch.index));
    }
    parts.push(firstMatch.node);
    remaining = remaining.slice(firstMatch.index + firstMatch.length);
  }

  return <>{parts}</>;
}
