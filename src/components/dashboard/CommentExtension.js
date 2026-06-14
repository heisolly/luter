import { Mark, mergeAttributes } from '@tiptap/core';

export const CommentExtension = Mark.create({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'bg-yellow-400/30 dark:bg-yellow-500/40 border-b-2 border-yellow-500/50 cursor-pointer transition-colors hover:bg-yellow-400/50 dark:hover:bg-yellow-500/60 rounded-sm px-0.5',
      },
    };
  },

  addAttributes() {
    return {
      threadId: {
        default: null,
        parseHTML: element => element.getAttribute('data-thread-id'),
        renderHTML: attributes => {
          if (!attributes.threadId) {
            return {};
          }
          return {
            'data-thread-id': attributes.threadId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-thread-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setComment:
        (threadId) =>
        ({ commands }) => {
          return commands.setMark(this.name, { threadId });
        },
      unsetComment:
        (threadId) =>
        ({ tr, dispatch }) => {
          const { doc } = tr;
          let hasMark = false;

          doc.descendants((node, pos) => {
            if (node.marks) {
              node.marks.forEach(mark => {
                if (mark.type.name === this.name && mark.attrs.threadId === threadId) {
                  hasMark = true;
                  if (dispatch) {
                    tr.removeMark(pos, pos + node.nodeSize, mark.type);
                  }
                }
              });
            }
          });

          return hasMark;
        },
    };
  },
});
