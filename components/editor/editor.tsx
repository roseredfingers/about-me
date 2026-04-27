"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";

import { AudioBlock } from "@/components/editor/audio-block";
import { ImageUpload } from "@/components/editor/image-upload";
import { EditorToolbar } from "@/components/editor/toolbar";
import { hydrateMediaSources } from "@/lib/content";
import type { Post } from "@/lib/types";
import { getExcerpt } from "@/lib/utils";

interface EditorProps {
  post: Post;
  mediaUrls: Record<string, string>;
  onBack: () => void;
  onSave: (input: { title: string; content: string; excerpt: string }) => Promise<void>;
  onUploadMedia: (file: File) => Promise<{
    id: string;
    src: string;
    mimeType: string;
    name: string;
  }>;
}

const SanctuaryImage = Image.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      mediaId: { default: null },
    };
  },
});

export function WritingEditor({ post, mediaUrls, onBack, onSave, onUploadMedia }: EditorProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [saveStatus, setSaveStatus] = useState("Saved");
  const lastSavedRef = useRef(`${post.title}::${post.content}`);

  const hydratedContent = useMemo(
    () => hydrateMediaSources(content, mediaUrls),
    [content, mediaUrls],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      SanctuaryImage,
      AudioBlock,
      Typography,
      Placeholder.configure({
        placeholder: "Write what you cannot say anywhere else.",
      }),
    ],
    content: hydratedContent,
    onUpdate: ({ editor: tiptapEditor }) => {
      const nextContent = JSON.stringify(tiptapEditor.getJSON());
      setContent(nextContent);
      setExcerpt(getExcerpt(tiptapEditor.getText()));
      setSaveStatus("Saving...");
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(hydrateMediaSources(post.content, mediaUrls), {
      emitUpdate: false,
    });
  }, [editor, mediaUrls, post.content, post.id]);

  useEffect(() => {
    const current = `${title}::${content}`;
    if (current === lastSavedRef.current) return;

    const timer = window.setTimeout(async () => {
      await onSave({ title, content, excerpt });
      lastSavedRef.current = `${title}::${content}`;
      setSaveStatus("Saved");
    }, 750);

    return () => window.clearTimeout(timer);
  }, [content, excerpt, onSave, title]);

  const insertMedia = async (file: File) => {
    if (!editor) return;
    const uploaded = await onUploadMedia(file);
    if (uploaded.mimeType.startsWith("image/")) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: { src: uploaded.src, alt: uploaded.name, mediaId: uploaded.id },
        })
        .run();
      return;
    }
    if (uploaded.mimeType.startsWith("audio/")) {
      editor
        .chain()
        .focus()
        .setAudioBlock({ src: uploaded.src, mediaId: uploaded.id, name: uploaded.name })
        .run();
    }
  };

  return (
    <div className="editorShell">
      <div className="editorNav">
        <button type="button" className="btnGhost" onClick={onBack}>
          Back
        </button>
        <span className="editorStatus">{saveStatus}</span>
      </div>

      <input
        className="editorTitleInput"
        value={title}
        placeholder="Title your thought"
        onChange={(e) => {
          setSaveStatus("Saving...");
          setTitle(e.target.value);
        }}
      />

      <div className="editorMeta">
        <div className="editorActions">
          <ImageUpload onFileSelect={insertMedia} />
          <label className="uploadButton">
            + Audio
            <input
              type="file"
              accept="audio/mpeg,audio/wav,audio/x-wav"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void insertMedia(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {editor && <EditorToolbar editor={editor} />}

      <div className="editorCanvas">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
