const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs/promises');
const LOCALES = require('./locales');

const MD_EXTS = ['.md', '.markdown', '.txt'];

let mainWindow = null;
let pendingOpenPath = null; // 窗口就绪前收到的待打开文件（双击关联文件）
let isDirty = false;
let closingAfterSave = false;
let currentLang = 'en';

const t = () => LOCALES[currentLang] || LOCALES.en;

function fileFromArgv(argv) {
  // 跳过可执行文件本身和 electron 开发模式下的 "."
  for (const arg of argv.slice(1)) {
    if (arg.startsWith('-') || arg === '.') continue;
    if (MD_EXTS.includes(path.extname(arg).toLowerCase())) return arg;
  }
  return null;
}

async function loadFileIntoWindow(filePath) {
  if (!mainWindow) {
    pendingOpenPath = filePath;
    return;
  }
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    mainWindow.webContents.send('doc:load', { filePath, content });
  } catch (err) {
    dialog.showErrorBox(t().dialog.openFailed, `${filePath}\n${err.message}`);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // preload 需要 require('highlight.js')，沙箱模式下不允许加载 npm 模块
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingOpenPath) {
      loadFileIntoWindow(pendingOpenPath);
      pendingOpenPath = null;
    }
  });

  mainWindow.on('close', (e) => {
    if (!isDirty || closingAfterSave) return;
    const d = t().dialog;
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'warning',
      buttons: [d.save, d.dontSave, d.cancel],
      defaultId: 0,
      cancelId: 2,
      message: d.unsaved
    });
    if (choice === 2) {
      e.preventDefault();
    } else if (choice === 0) {
      e.preventDefault();
      mainWindow.webContents.send('app:save-then-close');
    }
    // choice === 1：直接关闭
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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
        { type: 'separator' },
        { label: m.save, accelerator: 'CmdOrCtrl+S', click: () => send('save') },
        { label: m.saveAs, accelerator: 'CmdOrCtrl+Shift+S', click: () => send('save-as') },
        { type: 'separator' },
        { label: m.exportHtml, accelerator: 'CmdOrCtrl+E', click: () => send('export-html') },
        { label: m.exportPdf, accelerator: 'CmdOrCtrl+Shift+E', click: () => send('export-pdf') },
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
        { role: 'cut', label: m.cut },
        { role: 'copy', label: m.copy },
        { role: 'paste', label: m.paste },
        { label: m.selectAll, accelerator: 'CmdOrCtrl+A', click: () => send('select-all') }
      ]
    },
    {
      label: m.view,
      submenu: [
        { label: m.editOnly, accelerator: 'CmdOrCtrl+1', click: () => send('view-edit') },
        { label: m.split, accelerator: 'CmdOrCtrl+2', click: () => send('view-split') },
        { label: m.previewOnly, accelerator: 'CmdOrCtrl+3', click: () => send('view-preview') },
        { type: 'separator' },
        { role: 'togglefullscreen', label: m.fullscreen }
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

  app.whenReady().then(() => {
    createWindow();
    buildMenu();
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

async function buildExportHtml(bodyHtml, title) {
  const [mdCss, hljsCss] = await Promise.all([
    fs.readFile(path.join(__dirname, 'renderer', 'export.css'), 'utf-8'),
    fs.readFile(path.join(__dirname, 'node_modules', 'highlight.js', 'styles', 'github.css'), 'utf-8')
  ]);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
${hljsCss}
${mdCss}
</style>
</head>
<body class="markdown-body">
${bodyHtml}
</body>
</html>`;
}

ipcMain.handle('export:html', async (event, bodyHtml, title, suggestedName) => {
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

// ---- IPC ----

ipcMain.on('settings:lang', (event, lang) => {
  if (LOCALES[lang]) {
    currentLang = lang;
    buildMenu();
  }
});

ipcMain.handle('file:open', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown'] },
      { name: '*', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, 'utf-8');
  return { filePath, content };
});

ipcMain.handle('file:save', async (event, filePath, content) => {
  await fs.writeFile(filePath, content, 'utf-8');
  return true;
});

ipcMain.handle('file:save-as', async (event, content, suggestedName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: suggestedName,
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });
  if (result.canceled || !result.filePath) return null;
  await fs.writeFile(result.filePath, content, 'utf-8');
  return result.filePath;
});

ipcMain.handle('dialog:confirm', async (event, message) => {
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
  isDirty = dirty;
});

ipcMain.on('app:close-after-save', () => {
  closingAfterSave = true;
  if (mainWindow) mainWindow.close();
});
