const { contextBridge, ipcRenderer } = require('electron');
const { pathToFileURL } = require('url');
// 在 preload 里加载 highlight.js（渲染进程关闭了 nodeIntegration），common 子集覆盖约 40 种常用语言
const hljs = require('highlight.js/lib/common');

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (filePath, content) => ipcRenderer.invoke('file:save', filePath, content),
  saveFileAs: (content, suggestedName) => ipcRenderer.invoke('file:save-as', content, suggestedName),
  exportHtml: (bodyHtml, title, suggestedName) => ipcRenderer.invoke('export:html', bodyHtml, title, suggestedName),
  exportPdf: (bodyHtml, title, suggestedName) => ipcRenderer.invoke('export:pdf', bodyHtml, title, suggestedName),
  confirmDiscard: (message) => ipcRenderer.invoke('dialog:confirm', message),
  setDirty: (dirty) => ipcRenderer.send('doc:dirty-changed', dirty),
  setLang: (lang) => ipcRenderer.send('settings:lang', lang),
  closeAfterSave: () => ipcRenderer.send('app:close-after-save'),
  onDocLoad: (cb) => ipcRenderer.on('doc:load', (event, data) => cb(data)),
  onMenu: (cb) => ipcRenderer.on('menu', (event, action) => cb(action)),
  onSaveThenClose: (cb) => ipcRenderer.on('app:save-then-close', () => cb()),
  // 把文档的绝对路径转成 file:// URL，渲染进程用它解析 Markdown 里的相对图片路径
  pathToFileUrl: (p) => pathToFileURL(p).href,
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
