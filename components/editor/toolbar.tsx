"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";

interface ToolbarProps {
  editor: Editor;
}

const marks = [
  { label: "B", title: "Bold", action: (e: Editor) => e.chain().focus().toggleBold().run() },
  { label: "I", title: "Italic", action: (e: Editor) => e.chain().focus().toggleItalic().run() },
  {
    label: "H",
    title: "Heading",
    action: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "❝",
    title: "Blockquote",
    action: (e: Editor) => e.chain().focus().toggleBlockquote().run(),
  },
];

export function EditorToolbar({ editor }: ToolbarProps) {
  return (
    <BubbleMenu editor={editor}>
      <div className="floatingToolbar">
        {marks.map((mark) => (
          <button
            key={mark.label}
            type="button"
            title={mark.title}
            className="floatingToolbarBtn"
            onClick={() => mark.action(editor)}
          >
            {mark.label}
          </button>
        ))}
      </div>
    </BubbleMenu>
  );
}
