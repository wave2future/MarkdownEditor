const { app, BrowserWindow, clipboard, dialog, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const os = require('os');
const crypto = require('crypto');
const fs = require('fs/promises');
const LOCALES = require('./locales');
const { DEFAULT_FORMAT, normalizeFormat, readDocument, writeDocument } = require('./lib/file-utils');

const MD_EXTS = ['.md', '.markdown', '.txt'];
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
const IMAGE_MIME_EXT = new Map([
  ['image/png', '.png'], ['image/jpeg', '.jpg'], ['image/gif', '.gif'],
  ['image/webp', '.webp'], ['image/svg+xml', '.svg']
]);

let mainWindow = null;
let pendingOpenPath = null; // 窗口就绪前收到的待打开文件（双击关联文件）
let rendererReady = false;
let isDirty = false;
let closingAfterSave = false;
let currentLang = 'en';
const watchedFiles = new Map();
const filesBeingSaved = new Set();
let checkingWatchedFiles = false;

const t = () => LOCALES[currentLang] || LOCALES.en;
const isTrustedSender = (event) => BrowserWindow.fromWebContents(event.sender) === mainWindow;

// ---- 本地版本历史 ----
const HISTORY_MAX = 20;
const historyRoot = () => path.join(app.getPath('userData'), 'history');

function historyDirectory(filePath) {
  return path.join(historyRoot(), crypto.createHash('sha256').update(filePath).digest('hex'));
}

async function createHistorySnapshot(filePath, nextContent) {
  try {
    const { content } = await readDocument(filePath);
    if (content === nextContent) return;
    const dir = historyDirectory(filePath);
    await fs.mkdir(dir, { recursive: true });
    const snapshot = { filePath, createdAt: new Date().toISOString(), content };
    await fs.writeFile(path.join(dir, `${Date.now()}.json`), JSON.stringify(snapshot), 'utf-8');
    const entries = (await fs.readdir(dir)).filter((name) => /^\d+\.json$/.test(name)).sort().reverse();
    await Promise.all(entries.slice(HISTORY_MAX).map((name) => fs.unlink(path.join(dir, name))));
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('Failed to save document history:', err.message);
  }
}

async function listHistory(filePath) {
  try {
    const dir = historyDirectory(filePath);
    const entries = (await fs.readdir(dir)).filter((name) => /^\d+\.json$/.test(name)).sort().reverse();
    return Promise.all(entries.map(async (id) => {
      const snapshot = JSON.parse(await fs.readFile(path.join(dir, id), 'utf-8'));
      return { id, createdAt: snapshot.createdAt, size: snapshot.content.length };
    }));
  } catch {
    return [];
  }
}

// ---- 最近打开的文件 ----
let recentFiles = [];
const RECENT_MAX = 10;
const recentStorePath = () => path.join(app.getPath('userData'), 'recent.json');

async function loadRecent() {
  try {
    const arr = JSON.parse(await fs.readFile(recentStorePath(), 'utf-8'));
    if (Array.isArray(arr)) recentFiles = arr.filter((p) => typeof p === 'string');
  } catch {
    // 首次运行没有该文件，或内容损坏，忽略即可
  }
}

function saveRecent() {
  fs.writeFile(recentStorePath(), JSON.stringify(recentFiles), 'utf-8').catch(() => {});
}

function addRecent(filePath) {
  if (!filePath) return;
  recentFiles = recentFiles.filter((p) => p !== filePath); // 已存在则提到最前
  recentFiles.unshift(filePath);
  if (recentFiles.length > RECENT_MAX) recentFiles.length = RECENT_MAX;
  saveRecent();
  buildMenu();
}

function removeRecent(filePath) {
  const before = recentFiles.length;
  recentFiles = recentFiles.filter((p) => p !== filePath);
  if (recentFiles.length !== before) {
    saveRecent();
    buildMenu();
  }
}

function clearRecent() {
  recentFiles = [];
  saveRecent();
  buildMenu();
}

// ---- 会话与自动草稿 ----
// 会话里保存每个 Tab 的完整内容，所以即使渲染进程异常退出，未落盘草稿也能恢复。
const sessionStorePath = () => path.join(app.getPath('userData'), 'session.json');
let sessionWriteQueue = Promise.resolve();

function sanitizeSession(value) {
  if (!value || !Array.isArray(value.tabs) || value.tabs.length === 0) return null;
  const tabs = value.tabs.slice(0, 100).map((tab) => {
    const content = typeof tab?.content === 'string' ? tab.content : '';
    const dirty = !!tab?.dirty;
    return {
      filePath: typeof tab?.filePath === 'string' && tab.filePath ? tab.filePath : null,
      content,
      savedContent: typeof tab?.savedContent === 'string'
        ? tab.savedContent
        : (dirty ? '' : content),
      format: normalizeFormat(tab?.format),
      dirty
    };
  });
  const activeIndex = Number.isInteger(value.activeIndex)
    ? Math.max(0, Math.min(value.activeIndex, tabs.length - 1))
    : 0;
  return { version: 1, activeIndex, tabs };
}

async function loadSession() {
  try {
    const session = sanitizeSession(JSON.parse(await fs.readFile(sessionStorePath(), 'utf-8')));
    if (!session) return null;

    // 已保存的文件重新从磁盘读取，未保存的草稿则以自动保存内容为准。
    await Promise.all(session.tabs.map(async (tab) => {
      if (!tab.filePath) return;
      try {
        const diskDocument = await readDocument(tab.filePath);
        if (!tab.dirty) tab.content = diskDocument.content;
        tab.savedContent = diskDocument.content;
        tab.format = diskDocument.format;
      } catch {
        // 文件在应用关闭期间被移动/删除时，保留缓存副本并标为未保存，避免内容丢失。
        tab.dirty = true;
      }
    }));
    return session;
  } catch {
    return null;
  }
}

function saveSession(value) {
  const session = sanitizeSession(value);
  if (!session) return Promise.resolve(false);
  sessionWriteQueue = sessionWriteQueue.catch(() => {}).then(async () => {
    const target = sessionStorePath();
    const temp = `${target}.tmp`;
    await fs.writeFile(temp, JSON.stringify(session), 'utf-8');
    await fs.rename(temp, target);
    return true;
  });
  return sessionWriteQueue;
}

async function fileVersion(filePath) {
  const stat = await fs.stat(filePath);
  return { mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs, size: stat.size };
}

function sameFileVersion(a, b) {
  return a && b && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs && a.size === b.size;
}

function sameDocumentFormat(a, b) {
  const left = normalizeFormat(a);
  const right = normalizeFormat(b);
  return left.encoding === right.encoding && left.bom === right.bom && left.eol === right.eol;
}

async function syncWatchedFiles(tabs) {
  const wantedTabs = tabs.filter((tab) => typeof tab?.filePath === 'string' && tab.filePath);
  const wanted = new Set(wantedTabs.map((tab) => tab.filePath));
  for (const filePath of watchedFiles.keys()) {
    if (!wanted.has(filePath)) watchedFiles.delete(filePath);
  }
  await Promise.all(wantedTabs.map(async (tab) => {
    const filePath = tab.filePath;
    if (watchedFiles.has(filePath)) return;
    try {
      const [version, document] = await Promise.all([fileVersion(filePath), readDocument(filePath)]);
      watchedFiles.set(filePath, { version, content: document.content, format: document.format, missing: false });
      if (typeof tab.savedContent === 'string' && document.content !== tab.savedContent &&
          mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('file:external-change', { filePath, ...document });
      }
    } catch {
      // 文件暂时不可访问时留待下一次会话同步。
    }
  }));
}

async function updateWatchedFile(filePath, content, format) {
  try {
    watchedFiles.set(filePath, { version: await fileVersion(filePath), content, format: normalizeFormat(format), missing: false });
  } catch {
    watchedFiles.delete(filePath);
  }
}

async function checkWatchedFiles() {
  if (checkingWatchedFiles || !mainWindow || mainWindow.isDestroyed()) return;
  checkingWatchedFiles = true;
  try {
    await Promise.all(Array.from(watchedFiles, async ([filePath, known]) => {
      try {
        if (filesBeingSaved.has(filePath)) return;
        const version = await fileVersion(filePath);
        if (!known.missing && sameFileVersion(version, known.version)) return;
        const wasMissing = !!known.missing;
        const document = await readDocument(filePath);
        watchedFiles.set(filePath, { version, content: document.content, format: document.format, missing: false });
        if ((wasMissing || document.content !== known.content || !sameDocumentFormat(document.format, known.format)) &&
            mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('file:external-change', { filePath, ...document });
        }
      } catch (error) {
        if (error.code === 'ENOENT' && !known.missing) {
          known.missing = true;
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('file:external-missing', { filePath });
          }
        }
      }
    }));
  } finally {
    checkingWatchedFiles = false;
  }
}

function fileFromArgv(argv) {
  // 跳过可执行文件本身和 electron 开发模式下的 "."
  for (const arg of argv.slice(1)) {
    if (arg.startsWith('-') || arg === '.') continue;
    if (MD_EXTS.includes(path.extname(arg).toLowerCase())) return arg;
  }
  return null;
}

function imageDestination(documentPath, originalName, fallbackExt = '.png') {
  const docDir = path.dirname(documentPath);
  const docBase = path.basename(documentPath, path.extname(documentPath));
  const assetDir = path.join(docDir, `${docBase}.assets`);
  const rawExt = path.extname(originalName || '').toLowerCase();
  const ext = IMAGE_EXTS.has(rawExt) ? rawExt : fallbackExt;
  const rawBase = path.basename(originalName || 'image', rawExt).replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '');
  const base = rawBase || 'image';
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return {
    assetDir,
    filePath: path.join(assetDir, `${base}-${stamp}-${Math.random().toString(36).slice(2, 7)}${ext}`),
    relativeDir: `${docBase}.assets`
  };
}

async function copyImageToAssets(sourcePath, documentPath) {
  const ext = path.extname(sourcePath).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) return null;
  const destination = imageDestination(documentPath, path.basename(sourcePath), ext);
  await fs.mkdir(destination.assetDir, { recursive: true });
  await fs.copyFile(sourcePath, destination.filePath);
  return `${destination.relativeDir}/${path.basename(destination.filePath)}`;
}

async function loadFileIntoWindow(filePath) {
  if (!mainWindow || !rendererReady) {
    pendingOpenPath = filePath;
    return;
  }
  try {
    const document = await readDocument(filePath);
    mainWindow.webContents.send('doc:load', { filePath, ...document });
    addRecent(filePath);
  } catch (err) {
    dialog.showErrorBox(t().dialog.openFailed, `${filePath}\n${err.message}`);
    removeRecent(filePath); // 文件已被移动/删除，从最近列表清掉
  }
}

function createWindow() {
  rendererReady = false;
  isDirty = false;
  closingAfterSave = false;
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    icon: path.join(__dirname, 'build', 'icon.png'), // 开发模式下的任务栏图标；打包后用 exe 内嵌图标

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // preload 需要 require('highlight.js')，沙箱模式下不允许加载 npm 模块
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', (e) => {
    if (closingAfterSave) return;
    e.preventDefault();

    if (!isDirty) {
      mainWindow.webContents.send('app:prepare-close');
      return;
    }
    const d = t().dialog;
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'warning',
      buttons: [d.save, d.dontSave, d.cancel],
      defaultId: 0,
      cancelId: 2,
      message: d.unsaved
    });
    if (choice === 0) {
      mainWindow.webContents.send('app:save-then-close');
    } else if (choice === 1) {
      mainWindow.webContents.send('app:discard-then-close');
    }
    // choice === 2：取消关闭
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    watchedFiles.clear();
  });
}

function buildRecentSubmenu() {
  const m = t().menu;
  if (recentFiles.length === 0) {
    return [{ label: m.noRecent, enabled: false }];
  }
  const items = recentFiles.map((filePath) => ({
    label: filePath,
    click: () => loadFileIntoWindow(filePath)
  }));
  items.push({ type: 'separator' });
  items.push({ label: m.clearRecent, click: () => clearRecent() });
  return items;
}

function buildMenu() {
  const m = t().menu;
  const send = (action) => mainWindow && mainWindow.webContents.send('menu', action);
  const template = [
    {
      label: m.file,
      submenu: [
        { label: m.new, accelerator: 'CmdOrCtrl+N', click: () => send('new') },
        { label: m.open, accelerator: 'CmdOrCtrl+O', click: () => send('open') },
        { label: m.openRecent, submenu: buildRecentSubmenu() },
        { type: 'separator' },
        { label: m.save, accelerator: 'CmdOrCtrl+S', click: () => send('save') },
        { label: m.saveAs, accelerator: 'CmdOrCtrl+Shift+S', click: () => send('save-as') },
        { label: m.history, click: () => send('history') },
        { type: 'separator' },
        { label: m.exportHtml, accelerator: 'CmdOrCtrl+E', click: () => send('export-html') },
        { label: m.exportPdf, accelerator: 'CmdOrCtrl+Shift+E', click: () => send('export-pdf') },
        { type: 'separator' },
        { label: m.print, accelerator: 'CmdOrCtrl+P', click: () => send('print') },
        { type: 'separator' },
        { role: 'quit', label: m.quit }
      ]
    },
    {
      label: m.edit,
      submenu: [
        // 撤销/重做/全选交给 CodeMirror 处理，不能用系统 role（会作用在隐藏 textarea 上）
        { label: m.undo, accelerator: 'CmdOrCtrl+Z', click: () => send('undo') },
        { label: m.redo, accelerator: 'CmdOrCtrl+Shift+Z', click: () => send('redo') },
        { type: 'separator' },
        { label: m.find, accelerator: 'CmdOrCtrl+F', click: () => send('find') },
        { label: m.replace, accelerator: process.platform === 'darwin' ? 'Cmd+Alt+F' : 'Ctrl+H', click: () => send('replace') },
        { type: 'separator' },
        { label: m.cut, accelerator: 'CmdOrCtrl+X', click: () => send('cut') },
        { label: m.copy, accelerator: 'CmdOrCtrl+C', click: () => send('copy') },
        { label: m.paste, accelerator: 'CmdOrCtrl+V', click: () => send('paste') },
        { label: m.selectAll, accelerator: 'CmdOrCtrl+A', click: () => send('select-all') },
        { type: 'separator' },
        { label: m.goToLine, accelerator: 'CmdOrCtrl+L', click: () => send('go-to-line') }
      ]
    },
    {
      label: m.view,
      submenu: [
        { label: m.editOnly, accelerator: 'CmdOrCtrl+1', click: () => send('view-edit') },
        { label: m.split, accelerator: 'CmdOrCtrl+2', click: () => send('view-split') },
        { label: m.previewOnly, accelerator: 'CmdOrCtrl+3', click: () => send('view-preview') },
        { type: 'separator' },
        { role: 'togglefullscreen', label: m.fullscreen },
        { type: 'separator' },
        { label: m.settings, click: () => send('settings') }
      ]
    }
  ];
  if (process.platform === 'darwin') {
    template.unshift({ role: 'appMenu' });
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---- 单实例：再次双击 .md 文件时复用已打开的窗口 ----
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    const file = fileFromArgv(argv);
    if (file) loadFileIntoWindow(file);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // macOS：Finder 中双击 .md 文件触发
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    loadFileIntoWindow(filePath);
  });

  // Windows：首次启动时文件路径在命令行参数里
  pendingOpenPath = fileFromArgv(process.argv);

  app.whenReady().then(async () => {
    await loadRecent();
    createWindow();
    buildMenu();
    setInterval(checkWatchedFiles, 1000);
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

// ---- 导出 ----

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 打印预览窗口顶部的工具条（打印 / 关闭按钮 + Ctrl+P / Esc 快捷键），打印时通过 @media print 隐藏
function printPreviewChrome() {
  const ui = t().ui;
  return `<style>
#print-bar{position:fixed;top:0;left:0;right:0;z-index:1000;display:flex;gap:8px;justify-content:flex-end;
  padding:8px 16px;background:#f6f8fa;border-bottom:1px solid #d0d7de;
  font-family:-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;}
#print-bar button{padding:6px 18px;font-size:14px;border:1px solid #d0d7de;border-radius:6px;
  background:#fff;color:#24292f;cursor:pointer;}
#print-bar button:hover{background:#eaecef;}
#print-bar .primary{background:#0969da;border-color:#0969da;color:#fff;}
body.markdown-body{padding-top:60px;}
@media print{#print-bar{display:none;}body.markdown-body{padding-top:0;}}
</style>
<div id="print-bar">
  <button class="primary" onclick="window.print()">${escapeHtml(ui.print)}</button>
  <button onclick="window.close()">${escapeHtml(ui.close)}</button>
</div>
<script>
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); window.print(); }
  else if (e.key === 'Escape') { window.close(); }
});
</script>`;
}

async function buildExportHtml(bodyHtml, title, previewChrome = false) {
  const katexDir = path.join(__dirname, 'node_modules', 'katex', 'dist');
  const [mdCss, hljsCss, katexCssRaw] = await Promise.all([
    fs.readFile(path.join(__dirname, 'renderer', 'export.css'), 'utf-8'),
    fs.readFile(path.join(__dirname, 'node_modules', 'highlight.js', 'styles', 'github.css'), 'utf-8'),
    fs.readFile(path.join(katexDir, 'katex.min.css'), 'utf-8')
  ]);
  // KaTeX 字体在样式里是相对路径 url(fonts/...)，导出的 HTML 不在 katex 目录下，
  // 改写成指向 node_modules 的绝对 file:// 路径，PDF/HTML 才能加载字体
  const fontsUrl = pathToFileURL(path.join(katexDir, 'fonts')).href;
  const katexCss = katexCssRaw.replace(/url\(fonts\//g, `url(${fontsUrl}/`);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
${hljsCss}
${katexCss}
${mdCss}
</style>
</head>
<body class="markdown-body">
${previewChrome ? printPreviewChrome() : ''}
${bodyHtml}
</body>
</html>`;
}

ipcMain.handle('export:html', async (event, bodyHtml, title, suggestedName) => {
  if (!isTrustedSender(event)) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: suggestedName,
    filters: [{ name: 'HTML', extensions: ['html'] }]
  });
  if (result.canceled || !result.filePath) return null;
  try {
    await fs.writeFile(result.filePath, await buildExportHtml(bodyHtml, title), 'utf-8');
    return result.filePath;
  } catch (err) {
    dialog.showErrorBox(t().dialog.exportFailed, err.message);
    return null;
  }
});

ipcMain.handle('export:pdf', async (event, bodyHtml, title, suggestedName) => {
  if (!isTrustedSender(event)) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: suggestedName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (result.canceled || !result.filePath) return null;

  const tmpFile = path.join(os.tmpdir(), `md-export-${Date.now()}.html`);
  let pdfWindow = null;
  try {
    await fs.writeFile(tmpFile, await buildExportHtml(bodyHtml, title), 'utf-8');
    pdfWindow = new BrowserWindow({ show: false });
    await pdfWindow.loadFile(tmpFile);
    const pdfData = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0.6, bottom: 0.6, left: 0.6, right: 0.6 }
    });
    await fs.writeFile(result.filePath, pdfData);
    return result.filePath;
  } catch (err) {
    dialog.showErrorBox(t().dialog.exportFailed, err.message);
    return null;
  } finally {
    if (pdfWindow) pdfWindow.destroy();
    fs.unlink(tmpFile).catch(() => {});
  }
});

ipcMain.handle('doc:print', async (event, bodyHtml, title) => {
  if (!isTrustedSender(event)) return false;
  // 打开可见的预览窗口（与导出同一套排版），由页面内的"打印"按钮触发 window.print()。
  // 这样用户能先预览，取消打印也不会报错。
  const tmpFile = path.join(os.tmpdir(), `md-print-${Date.now()}.html`);
  try {
    await fs.writeFile(tmpFile, await buildExportHtml(bodyHtml, title, true), 'utf-8');
    const previewWindow = new BrowserWindow({
      width: 900,
      height: 1000,
      title,
      autoHideMenuBar: true,
      backgroundColor: '#ffffff'
    });
    previewWindow.setMenu(null); // 去掉本窗口的应用菜单，让 Ctrl+P 走页面内的处理而非主窗口
    await previewWindow.loadFile(tmpFile);
    fs.unlink(tmpFile).catch(() => {}); // 内容已载入内存，临时文件可删
    return true;
  } catch (err) {
    dialog.showErrorBox(t().dialog.exportFailed, err.message);
    fs.unlink(tmpFile).catch(() => {});
    return false;
  }
});

// ---- IPC ----

ipcMain.on('settings:lang', (event, lang) => {
  if (!isTrustedSender(event)) return;
  if (LOCALES[lang]) {
    currentLang = lang;
    buildMenu();
  }
});

ipcMain.handle('session:load', (event) => {
  if (BrowserWindow.fromWebContents(event.sender) !== mainWindow) return null;
  return loadSession();
});

ipcMain.handle('session:save', (event, session) => {
  if (BrowserWindow.fromWebContents(event.sender) !== mainWindow) return false;
  if (Array.isArray(session?.tabs)) {
    syncWatchedFiles(session.tabs).catch(() => {});
  }
  return saveSession(session);
});

ipcMain.on('session:ready', (event) => {
  if (BrowserWindow.fromWebContents(event.sender) !== mainWindow) return;
  rendererReady = true;
  if (pendingOpenPath) {
    const filePath = pendingOpenPath;
    pendingOpenPath = null;
    loadFileIntoWindow(filePath);
  }
});

// CodeMirror 的选区不属于普通 input/textarea，Electron 的系统编辑 role 无法稳定操作它。
// 右键菜单只负责展示和发送命令，实际选区修改由渲染进程中的 CodeMirror 完成。
ipcMain.on('editor:show-context-menu', (event, state) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win !== mainWindow) return;

  const m = t().menu;
  const send = (action) => event.sender.send('menu', action);
  const menu = Menu.buildFromTemplate([
    { label: m.undo, enabled: !!state?.canUndo, click: () => send('undo') },
    { label: m.redo, enabled: !!state?.canRedo, click: () => send('redo') },
    { type: 'separator' },
    { label: m.cut, enabled: !!state?.hasSelection, click: () => send('cut') },
    { label: m.copy, enabled: !!state?.hasSelection, click: () => send('copy') },
    { label: m.paste, enabled: clipboard.readText().length > 0, click: () => send('paste') },
    { type: 'separator' },
    { label: m.selectAll, click: () => send('select-all') }
  ]);
  menu.popup({ window: win });
});

ipcMain.on('preview:show-context-menu', (event, selectedText) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win !== mainWindow) return;
  const text = typeof selectedText === 'string' ? selectedText : '';
  Menu.buildFromTemplate([
    { label: t().menu.copy, enabled: text.length > 0, click: () => clipboard.writeText(text) }
  ]).popup({ window: win });
});

ipcMain.on('clipboard:write-text', (event, text) => {
  if (BrowserWindow.fromWebContents(event.sender) !== mainWindow) return;
  clipboard.writeText(String(text));
});

ipcMain.handle('clipboard:read-text', (event) => {
  if (BrowserWindow.fromWebContents(event.sender) !== mainWindow) return '';
  return clipboard.readText();
});

ipcMain.handle('clipboard:read-image', (event) => {
  if (!isTrustedSender(event)) return null;
  const image = clipboard.readImage();
  return image.isEmpty() ? null : image.toPNG();
});

ipcMain.handle('image:import', async (event, sourcePath, documentPath) => {
  if (!isTrustedSender(event) || typeof sourcePath !== 'string' || typeof documentPath !== 'string') return null;
  return copyImageToAssets(sourcePath, documentPath);
});

ipcMain.handle('image:choose', async (event, documentPath) => {
  if (!isTrustedSender(event) || typeof documentPath !== 'string') return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return copyImageToAssets(result.filePaths[0], documentPath);
});

ipcMain.handle('image:save-data', async (event, bytes, mimeType, documentPath) => {
  if (!isTrustedSender(event) || typeof documentPath !== 'string') return null;
  const ext = IMAGE_MIME_EXT.get(String(mimeType).toLowerCase());
  const data = Buffer.from(bytes || []);
  if (!ext || data.length === 0 || data.length > 25 * 1024 * 1024) return null;
  const destination = imageDestination(documentPath, `pasted-image${ext}`, ext);
  await fs.mkdir(destination.assetDir, { recursive: true });
  await fs.writeFile(destination.filePath, data);
  return `${destination.relativeDir}/${path.basename(destination.filePath)}`;
});

ipcMain.handle('file:open', async (event) => {
  if (!isTrustedSender(event)) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown'] },
      { name: '*', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const document = await readDocument(filePath);
  addRecent(filePath);
  return { filePath, ...document };
});

// 拖放打开：渲染进程拿到文件路径后读取内容（路径由 preload 的 webUtils 解析）
ipcMain.handle('file:read', async (event, filePath) => {
  if (!isTrustedSender(event)) return null;
  try {
    const document = await readDocument(filePath);
    addRecent(filePath);
    return { filePath, ...document };
  } catch (err) {
    dialog.showErrorBox(t().dialog.openFailed, `${filePath}\n${err.message}`);
    return null;
  }
});

ipcMain.handle('file:locate', async (event, originalPath) => {
  if (!isTrustedSender(event)) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    defaultPath: originalPath,
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const document = await readDocument(filePath);
  addRecent(filePath);
  return { filePath, ...document };
});

ipcMain.handle('dialog:file-missing', async (event, filePath, dirty) => {
  if (!isTrustedSender(event)) return 'keep';
  const d = t().dialog;
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: [d.locateFile, t().menu.saveAs, d.closeTab, d.keepOpen],
    defaultId: 0,
    cancelId: 3,
    title: d.fileMissingTitle,
    message: d.fileMissing.replace('{name}', path.basename(filePath)),
    detail: dirty ? d.fileMissingDirty : undefined
  });
  return ['locate', 'save-as', 'close', 'keep'][result.response] || 'keep';
});

ipcMain.handle('file:save', async (event, filePath, content, format, silent) => {
  if (!isTrustedSender(event)) return { ok: false, error: 'Untrusted sender' };
  filesBeingSaved.add(filePath);
  try {
    await createHistorySnapshot(filePath, content);
    const savedFormat = await writeDocument(filePath, content, format || DEFAULT_FORMAT);
    await updateWatchedFile(filePath, content, savedFormat);
    return { ok: true, format: savedFormat };
  } catch (error) {
    if (!silent) dialog.showErrorBox(t().dialog.saveFailedTitle, `${filePath}\n${error.message}`);
    return { ok: false, error: error.message };
  } finally {
    filesBeingSaved.delete(filePath);
  }
});

ipcMain.handle('history:list', (event, filePath) => {
  if (!isTrustedSender(event) || typeof filePath !== 'string') return [];
  return listHistory(filePath);
});

ipcMain.handle('history:read', async (event, filePath, id) => {
  if (!isTrustedSender(event) || typeof filePath !== 'string' || !/^\d+\.json$/.test(id)) return null;
  try {
    const snapshot = JSON.parse(await fs.readFile(path.join(historyDirectory(filePath), id), 'utf-8'));
    return snapshot.filePath === filePath && typeof snapshot.content === 'string' ? snapshot.content : null;
  } catch {
    return null;
  }
});

ipcMain.handle('file:save-as', async (event, content, suggestedName, format) => {
  if (!isTrustedSender(event)) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: suggestedName,
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });
  if (result.canceled || !result.filePath) return null;
  try {
    const savedFormat = await writeDocument(result.filePath, content, format || DEFAULT_FORMAT);
    await updateWatchedFile(result.filePath, content, savedFormat);
    addRecent(result.filePath);
    return { filePath: result.filePath, format: savedFormat };
  } catch (error) {
    dialog.showErrorBox(t().dialog.saveFailedTitle, `${result.filePath}\n${error.message}`);
    return { error: error.message };
  }
});

ipcMain.handle('dialog:confirm', async (event, message) => {
  if (!isTrustedSender(event)) return false;
  const d = t().dialog;
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: [d.ok, d.cancel],
    defaultId: 1,
    cancelId: 1,
    message
  });
  return result.response === 0;
});

ipcMain.on('doc:dirty-changed', (event, dirty) => {
  if (!isTrustedSender(event)) return;
  isDirty = dirty;
});

ipcMain.on('app:close-after-save', (event) => {
  if (!isTrustedSender(event)) return;
  closingAfterSave = true;
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('app:open-external', async (event, href) => {
  if (!isTrustedSender(event) || typeof href !== 'string') return false;
  try {
    const url = new URL(href);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return false;
    await shell.openExternal(url.href);
    return true;
  } catch {
    return false;
  }
});
