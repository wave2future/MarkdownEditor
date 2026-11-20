const { contextBridge, ipcRenderer, webUtils } = require('electron');
const { pathToFileURL } = require('url');
// 在 preload 里加载 highlight.js（渲染进程关闭了 nodeIntegration），common 子集覆盖约 40 种常用语言
const hljs = require('highlight.js/lib/common');
const bash = require('highlight.js/lib/languages/bash');
const { diffLines } = require('./lib/diff-utils');

hljs.registerLanguage('bash', (highlighter) => {
  const language = bash(highlighter);
  // A here-document piped to `node -` contains JavaScript between the shell delimiters.
  language.contains.unshift({
    begin: /^[ \t]*node[ \t]+-[ \t]+<<(-?)[ \t]*(['"]?)(\w+)\2(?:[ \t]+#[^\r\n]*)?[ \t]*\r?\n/,
    end: /^(\t*)(\w+)(?=\r?$)/,
    beginScope: 'meta',
    endScope: 'meta',
    subLanguage: 'javascript',
    'on:begin': (match, response) => {
      response.data.allowTabs = match[1] === '-';
      response.data.delimiter = match[3];
    },
    'on:end': (match, response) => {
      if (match[2] !== response.data.delimiter || (match[1] && !response.data.allowTabs)) {
        response.ignoreMatch();
      }
    }
  });
  return language;
});

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('file:open'),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  locateFile: (originalPath) => ipcRenderer.invoke('file:locate', originalPath),
  // Electron 32+ 移除了 File.path，拖放的文件路径要通过 webUtils 获取（必须在 preload 调用）
  getPathForFile: (file) => webUtils.getPathForFile(file),
  saveFile: (filePath, content, format, silent = false) => ipcRenderer.invoke('file:save', filePath, content, format, silent),
  saveFileAs: (content, suggestedName, format) => ipcRenderer.invoke('file:save-as', content, suggestedName, format),
  listHistory: (filePath) => ipcRenderer.invoke('history:list', filePath),
  readHistory: (filePath, id) => ipcRenderer.invoke('history:read', filePath, id),
  diffLines: (current, disk) => diffLines(current, disk),
  exportHtml: (bodyHtml, title, suggestedName) => ipcRenderer.invoke('export:html', bodyHtml, title, suggestedName),
  exportPdf: (bodyHtml, title, suggestedName) => ipcRenderer.invoke('export:pdf', bodyHtml, title, suggestedName),
  print: (bodyHtml, title) => ipcRenderer.invoke('doc:print', bodyHtml, title),
  openExternal: (href) => ipcRenderer.invoke('app:open-external', href),
  confirmDiscard: (message) => ipcRenderer.invoke('dialog:confirm', message),
  handleMissingFile: (filePath, dirty) => ipcRenderer.invoke('dialog:file-missing', filePath, dirty),
  setDirty: (dirty) => ipcRenderer.send('doc:dirty-changed', dirty),
  setLang: (lang) => ipcRenderer.send('settings:lang', lang),
  loadSession: () => ipcRenderer.invoke('session:load'),
  saveSession: (session) => ipcRenderer.invoke('session:save', session),
  sessionReady: () => ipcRenderer.send('session:ready'),
  showEditorContextMenu: (state) => ipcRenderer.send('editor:show-context-menu', state),
  showPreviewContextMenu: (text) => ipcRenderer.send('preview:show-context-menu', text),
  writeClipboardText: (text) => ipcRenderer.send('clipboard:write-text', text),
  readClipboardText: () => ipcRenderer.invoke('clipboard:read-text'),
  readClipboardImage: () => ipcRenderer.invoke('clipboard:read-image'),
  importImage: (sourcePath, documentPath) => ipcRenderer.invoke('image:import', sourcePath, documentPath),
  chooseImage: (documentPath) => ipcRenderer.invoke('image:choose', documentPath),
  saveImageData: (bytes, mimeType, documentPath) => ipcRenderer.invoke('image:save-data', bytes, mimeType, documentPath),
  closeAfterSave: () => ipcRenderer.send('app:close-after-save'),
  onDocLoad: (cb) => ipcRenderer.on('doc:load', (event, data) => cb(data)),
  onExternalFileChange: (cb) => ipcRenderer.on('file:external-change', (event, data) => cb(data)),
  onExternalFileMissing: (cb) => ipcRenderer.on('file:external-missing', (event, data) => cb(data)),
  onMenu: (cb) => ipcRenderer.on('menu', (event, action) => cb(action)),
  onPrepareClose: (cb) => ipcRenderer.on('app:prepare-close', () => cb()),
  onDiscardThenClose: (cb) => ipcRenderer.on('app:discard-then-close', () => cb()),
  onSaveThenClose: (cb) => ipcRenderer.on('app:save-then-close', () => cb()),
  // 把文档的绝对路径转成 file:// URL，渲染进程用它解析 Markdown 里的相对图片路径
  pathToFileUrl: (p) => pathToFileURL(p).href,
  mindmapIcon: (name) => {
    const pack = require('@iconify-json/fa/icons.json');
    if (!Object.hasOwn(pack.icons, name)) return null;
    const { body, width = pack.width, height = pack.height } = pack.icons[name];
    return { body, width, height };
  },
  highlight: (code, lang) => {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return null;
    }
  }
});
