import { Extension } from '@tiptap/core';
import { defaultSelectionBuilder, yCursorPlugin } from '@tiptap/y-tiptap';

const awarenessStatesToArray = (states) => {
    return Array.from(states.entries()).map(([key, value]) => {
        return {
            clientId: key,
            ...value.user,
        };
    });
};

const defaultOnUpdate = () => null;

/**
 * Custom CollaborationCursor extension that uses @tiptap/y-tiptap
 * This prevents PluginKey mismatch errors with Tiptap v3!
 */
export const CollaborationCursor = Extension.create({
    name: 'collaborationCursor',
    priority: 999,
    addOptions() {
        return {
            provider: null,
            user: {
                name: null,
                color: null,
            },
            render: user => {
                const cursor = document.createElement('span');
                cursor.classList.add('collaboration-cursor__caret');
                cursor.setAttribute('style', `border-color: ${user.color}`);
                
                const label = document.createElement('div');
                label.classList.add('collaboration-cursor__label');
                label.setAttribute('style', `background-color: ${user.color}`);
                label.insertBefore(document.createTextNode(user.name), null);
                
                cursor.insertBefore(label, null);
                return cursor;
            },
            selectionRender: defaultSelectionBuilder,
            onUpdate: defaultOnUpdate,
        };
    },
    onCreate() {
        if (!this.options.provider) {
            throw new Error('The "provider" option is required for the CollaborationCursor extension');
        }
    },
    addStorage() {
        return {
            users: [],
        };
    },
    addCommands() {
        return {
            updateUser: attributes => () => {
                this.options.user = attributes;
                this.options.provider.awareness.setLocalStateField('user', this.options.user);
                return true;
            },
        };
    },
    addProseMirrorPlugins() {
        return [
            yCursorPlugin((() => {
                this.options.provider.awareness.setLocalStateField('user', this.options.user);
                this.storage.users = awarenessStatesToArray(this.options.provider.awareness.states);
                
                this.options.provider.awareness.on('update', () => {
                    this.storage.users = awarenessStatesToArray(this.options.provider.awareness.states);
                });
                
                return this.options.provider.awareness;
            })(), 
            {
                cursorBuilder: this.options.render,
                selectionBuilder: this.options.selectionRender,
            }),
        ];
    },
});
