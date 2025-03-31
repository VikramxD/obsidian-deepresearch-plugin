

**I. Simple Product Requirements Document (PRD): "Gemini Assistant" for Obsidian**

**1. Introduction & Goals**

*   **Problem:** Users spend significant time writing, editing, summarizing, and brainstorming within Obsidian. Leveraging AI can streamline these tasks, improve writing quality, and overcome creative blocks, but switching between Obsidian and external AI tools is disruptive.
*   **Goal:** Seamlessly integrate Google Gemini's generative AI capabilities directly into the Obsidian editing workflow to enhance user productivity and creativity for personal knowledge management and writing.
*   **Target User:** Individual Obsidian users who want AI assistance for their notes and writing without leaving the application.
*   **Value Proposition:** Save time, improve writing quality, generate ideas, and interact with note content in new ways directly within Obsidian using a powerful AI model (Gemini).

**2. User Goals & Use Cases (Examples)**

*   **Goal:** Quickly understand the gist of a long note section.
    *   *Use Case:* Select a block of text -> Right-click -> Choose "Summarize with Gemini" -> See a concise summary inserted below the selection.
*   **Goal:** Improve the clarity or tone of a sentence/paragraph.
    *   *Use Case:* Select text -> Trigger command palette -> Run "Rephrase selection with Gemini" -> Replace the selection with the AI's suggestion (or insert options).
*   **Goal:** Brainstorm ideas related to a topic/heading.
    *   *Use Case:* Place cursor under a heading -> Trigger command palette -> Run "Brainstorm ideas with Gemini" -> Get a bulleted list of ideas inserted at the cursor.
*   **Goal:** Continue writing when stuck.
    *   *Use Case:* Place cursor at the end of a paragraph -> Run "Continue writing with Gemini" -> Get a relevant continuation paragraph inserted.
*   **Goal:** Ask a specific question about the selected text.
    *   *Use Case:* Select text -> Trigger command "Ask Gemini about selection" -> Enter question in a pop-up -> See the answer inserted.
*   **Goal:** Configure the plugin to use their personal AI credentials.
    *   *Use Case:* Go to Obsidian Settings -> Plugin Options -> Gemini Assistant -> Enter Google AI Studio API Key -> Select preferred Gemini model.

**3. Core Features (MVP - Minimum Viable Product)**

*   **F1: Settings Configuration:**
    *   A dedicated settings tab within Obsidian's settings.
    *   Input field for the Google Gemini API Key (obtained from Google AI Studio). Store securely using Obsidian's `loadData`/`saveData`. Basic masking (password field) in UI.
    *   Dropdown to select the Gemini model (e.g., `gemini-1.5-flash-latest`, `gemini-pro`). Default provided.
*   **F2: API Interaction Service:**
    *   Internal module responsible for constructing requests to the Google Gemini API (`generativelanguage.googleapis.com`).
    *   Uses the API key and selected model from settings.
    *   Handles sending prompts and receiving text-based responses.
    *   Includes basic error handling for API calls (network errors, invalid key, rate limits).
*   **F3: Editor Integration - Text Selection Actions:**
    *   Add commands to the Obsidian Command Palette (e.g., "Gemini: Summarize selection", "Gemini: Rephrase selection").
    *   Add corresponding actions to the editor context menu (right-click on selected text).
*   **F4: Core AI Actions (Predefined Prompts):**
    *   **Summarize:** Takes selected text, sends it to Gemini with a predefined "Summarize this:" prompt.
    *   **Rephrase:** Takes selected text, sends it to Gemini with a predefined "Rephrase this text:" prompt.
*   **F5: Output Handling:**
    *   By default, insert the AI-generated response on a new line below the user's current selection or cursor position.
    *   Provide user feedback via Obsidian `Notice` (e.g., "Contacting Gemini...", "Gemini response inserted.", "Error: API Key invalid.").

**4. Future Considerations (Post-MVP)**

*   **Custom Prompts:** A command that opens a Modal for users to type custom instructions for the selected text or the entire note.
*   **More AI Actions:** "Continue Writing", "Brainstorm Ideas", "Check Grammar", "Change Tone", "Translate".
*   **Flexible Output:** Options in settings or per-command to replace selection, insert as blockquote, send to a new note, copy to clipboard.
*   **Streaming Responses:** For long generations, display the response as it arrives from the API.
*   **Context Awareness:** Option to include the entire note content (or sections) as context, not just the selection (being mindful of token limits).
*   **Parameter Tuning:** Settings to adjust Gemini parameters like temperature, max output tokens.
*   **Error Handling:** More robust error parsing and user-friendly messages.
*   **Other AI Providers:** Architecture allowing potential future integration of OpenAI, Anthropic, etc. (requires abstraction).
*   **Vertex AI Support:** Option to use Google Cloud Vertex AI endpoints (might require different authentication).

**5. Non-Goals (Initially)**

*   Real-time collaboration features (cursors, simultaneous editing).
*   Complex chat interface within Obsidian.
*   Vector database integration or long-term memory across notes.
*   Local AI model support.
*   Deep UI customization beyond standard Obsidian elements.

**II. Architecture Outline & Core Flows**

**1. Core Components (Conceptual Modules):**

*   **`main.ts` (Plugin Entry Point):**
    *   Handles plugin lifecycle (`onload`, `onunload`).
    *   Initializes all other components.
    *   Registers commands, editor menu items, settings tab.
    *   Orchestrates calls between UI triggers and the feature logic.
*   **`SettingsManager` (Handles `loadData`/`saveData`):**
    *   Responsible for loading and saving plugin settings (API key, model choice).
    *   Provides synchronous access to current settings for other modules.
    *   Encapsulates the `this.loadData()` / `this.saveData()` logic.
*   **`UISettingsTab` (Extends `PluginSettingTab`):**
    *   Creates the UI elements within the Obsidian settings pane.
    *   Reads current settings from `SettingsManager` to populate fields.
    *   Calls `SettingsManager` to save changes when user updates fields.
*   **`GeminiAPIService` (Handles API communication):**
    *   Contains the logic to interact specifically with the Google Gemini API endpoint.
    *   Requires API key and model name (passed in or retrieved from `SettingsManager`).
    *   Has methods like `generateContent(prompt: string): Promise<string | Error>`.
    *   Uses Obsidian's `requestUrl` for making HTTPS POST requests.
    *   Formats the request body according to Gemini API specs.
    *   Parses the response JSON to extract the generated text (`candidates[0].content.parts[0].text`).
    *   Handles API/network errors and returns them distinctly from successful responses. *Crucially, this module knows nothing about the Obsidian Editor.*
*   **`EditorService` (Handles Obsidian Editor interaction):**
    *   Wraps common interactions with the Obsidian `Editor` object.
    *   Methods like `getSelectedText(editor: Editor): string`, `getCursorPosition(editor: Editor)`, `insertTextBelowSelection(editor: Editor, text: string)`, `replaceSelection(editor: Editor, text: string)`.
    *   *This module knows nothing about the Gemini API.*
*   **`FeatureHandler` (Orchestrates specific AI actions):**
    *   Contains functions triggered by commands or menu items (e.g., `handleSummarize`, `handleRephrase`).
    *   Uses `EditorService` to get context (selected text).
    *   Uses `SettingsManager` to get API configuration.
    *   Constructs the specific prompt for the desired action.
    *   Calls `GeminiAPIService.generateContent()` with the prompt.
    *   Handles the Promise returned by the API service.
    *   Uses `EditorService` to insert the result into the editor.
    *   Uses Obsidian's `Notice` API for user feedback (loading, success, error).

**2. Core User Flows (Example: Summarize Selection):**

1.  **Trigger:** User selects text -> Right-clicks -> Clicks "Summarize with Gemini".
2.  **Obsidian Event:** Obsidian fires the `editor-menu` event.
3.  **Plugin Listener (`main.ts`):** The plugin's event listener for the context menu item is activated.
4.  **Orchestration (`main.ts` -> `FeatureHandler`):** The listener calls `FeatureHandler.handleSummarize(editor)`.
5.  **Get Context (`FeatureHandler` -> `EditorService`):** `handleSummarize` calls `EditorService.getSelectedText(editor)` to get the selected text.
6.  **Get Config (`FeatureHandler` -> `SettingsManager`):** `handleSummarize` retrieves the API key and model name from `SettingsManager`.
7.  **Prepare Prompt (`FeatureHandler`):** Creates the prompt string (e.g., `"Please summarize the following text concisely:\n\n" + selectedText`).
8.  **Show Feedback (`FeatureHandler`):** `new Notice('Contacting Gemini...')`.
9.  **API Call (`FeatureHandler` -> `GeminiAPIService`):** Calls `GeminiAPIService.generateContent(prompt)` passing the prepared prompt and config.
10. **HTTP Request (`GeminiAPIService`):** Makes the actual `requestUrl` POST call to the Google API endpoint, including the API key, formatted body, etc. (asynchronous).
11. **API Response (`GeminiAPIService`):** Receives the HTTP response. Parses JSON. Extracts text if successful (status 200), otherwise extracts error info. Returns `Promise<string | Error>`.
12. **Handle Response (`FeatureHandler`):** `await`s the promise from `GeminiAPIService`.
13. **Hide Feedback & Process Result (`FeatureHandler`):** Hides the loading notice.
    *   **If Success (string received):** Calls `EditorService.insertTextBelowSelection(editor, resultText)`. Shows `new Notice('Summary inserted.')`.
    *   **If Error (Error received):** Logs the error. Shows `new Notice('Gemini Error: ' + error.message)`.
14. **Flow End:** User sees the summary inserted or an error message.

**3. Key Architectural Considerations:**

*   **Modularity & Separation of Concerns:** Keep API logic separate from editor logic separate from settings logic. This makes the code easier to test, maintain, and extend (e.g., adding another AI provider would mainly involve creating a new `XxxAPIService` and updating the `FeatureHandler` or adding an abstraction layer).
*   **Asynchronicity:** All API calls and potentially some editor operations are asynchronous. Use `async`/`await` thoroughly.
*   **Error Handling:** Implement error handling at multiple levels: UI validation (e.g., API key format - though less critical for personal key), API call failures (network, auth, rate limits), response parsing, unexpected empty results.
*   **State Management:** Keep it simple initially. Settings are the main persistent state, managed by `SettingsManager`. No complex in-memory state needed for MVP.
*   **Dependency:** Rely primarily on the Obsidian API (`obsidian` package) and built-in browser/Node capabilities (like `fetch` via `requestUrl`). Avoid unnecessary external libraries for the MVP.
*   **Security:** The API key is stored locally via Obsidian's mechanisms. While convenient, it's not highly secure (could be read if someone has filesystem access). This is a common tradeoff for user-provided keys in plugins. Clearly document this.

This detailed plan provides a strong foundation for starting development, focusing on building a robust MVP before expanding to more complex features.