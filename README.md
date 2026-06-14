# Markdown Editor

A clean, cross-platform (Windows / macOS) Markdown editor built on Electron.

## Requirements

> Develop a Markdown editor that works on both Windows and Mac, supporting Markdown content editing, Markdown preview, and file open/save functions. Double-clicking a .md file in the system should open it directly in this app. The interface should be clean and simple.
>
> Enhancements needed: replace the textarea with CodeMirror for syntax highlighting, add code block highlighting (highlight.js), and support exporting to HTML/PDF. Toolbar buttons should use intuitive icons. Add internationalization support — the app defaults to English and can be switched to Chinese, Japanese, French, Korean, or German. Support System/Dark/Light mode switching.

## Features

- CodeMirror editor: Markdown syntax highlighting, automatic list continuation, Tab indentation
- Live preview with code block highlighting via highlight.js (Edit / Split / Preview-only views, switch with Ctrl+1/2/3)
- New file (Ctrl+N), Open (Ctrl+O), Save (Ctrl+S), Save As (Ctrl+Shift+S)
- Export to HTML (Ctrl+E) / Export to PDF (Ctrl+Shift+E), exported content includes code highlighting styles
- Icon toolbar + status bar (file path, word count, export notifications)
- Internationalization: defaults to English, switchable to 中文 / 日本語 / Français / 한국어 / Deutsch (menus, dialogs, and UI all follow the selected language, with the choice persisted)
- Themes: System (follows OS) / Light / Dark, with coordinated colors for the editor and preview
- Double-click .md / .markdown files in the system to open directly in this app (installer build only)
- Unsaved changes protection: prompts to save before close, new, or open
- Single-instance mode: double-clicking a file again reuses the already-open window

## Development

```bash
npm install
npm start
```

## Packaging

```bash
npm run dist:win   # Windows, generates an NSIS installer (in the dist/ directory)
npm run dist:mac   # macOS, generates a dmg (must be run on a Mac)
```

Notes:

- **.md double-click association only works in the "installer" build** (`npm start` in dev mode does not register the file association).
  The association is configured via `build.fileAssociations` in `package.json` and is written
  automatically to the Windows registry / macOS Info.plist when packaged with electron-builder.
- The macOS dmg must be packaged on a Mac; unsigned apps require allowing them in
  "System Settings → Privacy & Security" on first launch.

## Project Structure

```
main.js              Main process: window, i18n menus, file dialogs, HTML/PDF export, file association, single instance
preload.js           contextBridge security bridge + highlight.js highlighting service
locales.js           Six-language dictionary (shared by main and renderer processes)
renderer/index.html  UI layout (icon toolbar, CodeMirror, theme/language switching)
renderer/app.js      Editor logic, live preview (marked + hljs), i18n, theme switching
renderer/style.css   App styles (CSS variables for light/dark themes)
renderer/export.css  Standalone styles for HTML/PDF export
sample.md            Test document
```

Technical notes:

- System theme mode follows the OS via `matchMedia('(prefers-color-scheme: dark)')` and listens
  for changes; in dark mode, CodeMirror switches to the material-darker theme and the preview
  switches to the github-dark highlighting style.
- Language/theme selections are stored in localStorage; when the language changes, the renderer
  notifies the main process to rebuild the application menu.
- The Undo/Redo/Select All menu items do not use system roles (which would act on CodeMirror's
  hidden textarea); they are forwarded to CodeMirror instead.
- PDF export: the main process writes the rendered HTML to a temporary file, loads it in a
  hidden BrowserWindow, and calls `printToPDF` (A4, with background colors).
- The preload script needs `require('highlight.js')`, so the window disables Electron's default
  preload sandbox (`sandbox: false`, while still keeping contextIsolation enabled).
  
  
---

## LaTex Examples

行内公式：$E = mc^2$

块级公式：
$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

更复杂的例子：
$$
\begin{cases}
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0} \\[2ex]
\nabla \cdot \mathbf{B} = 0 \\[2ex]
\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t} \\[2ex]
\nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{cases}
$$


