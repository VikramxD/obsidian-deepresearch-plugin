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
     * Get text before the cursor, limited to a specified number of characters.
     */
    public getTextBeforeCursor(editor: Editor, contextSize: number): string {
        const cursor = editor.getCursor();
        const line = cursor.line;
        const ch = cursor.ch;
        
        let text = '';
        let charCount = 0;
        let currentLine = line;
        
        // Start from the current cursor position and work backwards
        while (currentLine >= 0 && charCount < contextSize) {
            const lineText = editor.getLine(currentLine);
            
            if (currentLine === line) {
                // For the current line, only get the text before the cursor
                const textBefore = lineText.substring(0, ch);
                text = textBefore + (text.length > 0 ? '\n' + text : '');
                charCount += textBefore.length;
            } else {
                // For previous lines, get the entire line
                text = lineText + (text.length > 0 ? '\n' + text : '');
                charCount += lineText.length;
            }
            
            currentLine--;
        }
        
        // If we've collected more than the contextSize, trim it
        if (charCount > contextSize) {
            const excessChars = charCount - contextSize;
            text = text.substring(excessChars);
        }
        
        return text;
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
     * Insert text at the current cursor position.
     */
    public insertTextAtCursor(editor: Editor, text: string): void {
        const cursor = editor.getCursor();
        editor.replaceRange(text, cursor);
    }

    /**
     * Replace the current selection with new text.
     */
    public replaceSelection(editor: Editor, text: string): void {
        editor.replaceSelection(text);
    }
} 