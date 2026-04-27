import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audioBlock: {
      setAudioBlock: (options: {
        src: string;
        mediaId?: string;
        name?: string;
      }) => ReturnType;
    };
  }
}

export const AudioBlock = Node.create({
  name: "audioBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: "",
      },
      mediaId: {
        default: null,
      },
      name: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: "audio[data-audio-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "audio",
      mergeAttributes(HTMLAttributes, {
        controls: "true",
        preload: "metadata",
        "data-audio-block": "true",
      }),
    ];
  },

  addCommands() {
    return {
      setAudioBlock:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    };
  },
});
