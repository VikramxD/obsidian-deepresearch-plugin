import { Editor } from 'obsidian';

export class EditorService {
    /**
     * Get the currently selected text from the editor.
     */
    public getSelectedText(editor: Editor): string {
        const selection = editor.getSelection();
        return selection;
    }

    /**
     * Get the current cursor position.
     */
    public getCursorPosition(editor: Editor): number {
        return editor.getCursor().line;
    }

    /**
     * Insert text below the current selection.
     */
    public insertTextBelowSelection(editor: Editor, text: string): void {
        const cursor = editor.getCursor('to');
        const position = {
            line: cursor.line + 1,
            ch: 0
        };
        
        // Insert a new line at the end of the current selection
        editor.replaceRange('\n\n' + text + '\n', position, position);
    }

    /**
     * Replace the current selection with new text.
     */
    public replaceSelection(editor: Editor, text: string): void {
        editor.replaceSelection(text);
    }
} 