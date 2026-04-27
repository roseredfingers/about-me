"use client";

import type { ReactNode } from "react";

import { AudioPlayer } from "@/components/audio-player";
import type { Blog, Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type JsonNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string }>;
  content?: JsonNode[];
};

interface PostViewProps {
  blog: Blog;
  post: Post;
  mediaUrls: Record<string, string>;
}

const applyMarks = (text: string, marks: Array<{ type: string }> = []) => {
  return marks.reduce<ReactNode>((acc, mark) => {
    if (mark.type === "bold") return <strong>{acc}</strong>;
    if (mark.type === "italic") return <em>{acc}</em>;
    return acc;
  }, text);
};

const resolveSource = (attrs: Record<string, unknown> = {}, mediaUrls: Record<string, string>) => {
  const mediaId = typeof attrs.mediaId === "string" ? attrs.mediaId : undefined;
  if (mediaId && mediaUrls[mediaId]) return mediaUrls[mediaId];
  return typeof attrs.src === "string" ? attrs.src : "";
};

const renderNode = (
  node: JsonNode,
  mediaUrls: Record<string, string>,
  key: string,
  isFirstParagraph: boolean,
): ReactNode => {
  switch (node.type) {
    case "heading":
      return (
        <h2 key={key}>
          {(node.content ?? []).map((child, i) => renderNode(child, mediaUrls, `${key}-${i}`, false))}
        </h2>
      );
    case "paragraph":
      return (
        <p key={key} className={isFirstParagraph ? "dropCap" : undefined}>
          {(node.content ?? []).map((child, i) =>
            renderNode(child, mediaUrls, `${key}-${i}`, false),
          )}
        </p>
      );
    case "blockquote":
      return (
        <blockquote key={key}>
          {(node.content ?? []).map((child, i) =>
            renderNode(child, mediaUrls, `${key}-${i}`, false),
          )}
        </blockquote>
      );
    case "image": {
      const src = resolveSource(node.attrs, mediaUrls);
      if (!src) return null;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={src}
          alt={String(node.attrs?.alt ?? "Attached image")}
          className="postImage"
        />
      );
    }
    case "audioBlock": {
      const src = resolveSource(node.attrs, mediaUrls);
      if (!src) return null;
      return <AudioPlayer key={key} src={src} name={String(node.attrs?.name ?? "Audio")} />;
    }
    case "text":
      return <span key={key}>{applyMarks(node.text ?? "", node.marks)}</span>;
    default:
      return (node.content ?? []).map((child, i) =>
        renderNode(child, mediaUrls, `${key}-${i}`, false),
      );
  }
};

const parseContent = (value: string): JsonNode => {
  try {
    return JSON.parse(value) as JsonNode;
  } catch {
    return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] };
  }
};

export function PostView({ blog, post, mediaUrls }: PostViewProps) {
  const parsed = parseContent(post.content);
  const firstParagraphIndex = (parsed.content ?? []).findIndex((n) => n.type === "paragraph");

  const blocks = (parsed.content ?? []).map((node, index) => {
    const useDropCap = index === firstParagraphIndex && node.type === "paragraph";
    return renderNode(node, mediaUrls, `block-${index}`, useDropCap);
  });

  return (
    <div className="pageWrap">
      <div className="readingHeader">
        <span className="eyebrow">{blog.name} &mdash; {formatDate(post.updatedAt)}</span>
        <h1>{post.title || "Untitled reflection"}</h1>
      </div>

      <div className="postContent">{blocks}</div>
    </div>
  );
}
