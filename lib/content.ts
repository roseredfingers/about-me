type JsonNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JsonNode[];
  [key: string]: unknown;
};

const hydrateNode = (node: JsonNode, mediaUrls: Record<string, string>): JsonNode => {
  const hydrated: JsonNode = { ...node };
  if (node.attrs && typeof node.attrs.mediaId === "string") {
    const mediaId = node.attrs.mediaId;
    const src = mediaUrls[mediaId];
    if (src) {
      hydrated.attrs = {
        ...node.attrs,
        src,
      };
    }
  }

  if (Array.isArray(node.content)) {
    hydrated.content = node.content.map((child) => hydrateNode(child, mediaUrls));
  }

  return hydrated;
};

export const hydrateMediaSources = (
  rawContent: string,
  mediaUrls: Record<string, string>,
): JsonNode => {
  const fallback = { type: "doc", content: [{ type: "paragraph" }] };
  try {
    const parsed = JSON.parse(rawContent) as JsonNode;
    return hydrateNode(parsed, mediaUrls);
  } catch {
    return fallback;
  }
};
