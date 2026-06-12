const preview = document.getElementById('preview');
const main = document.getElementById('main');
const statusPath = document.getElementById('status-path');
const statusMsg = document.getElementById('status-msg');
const statusCount = document.getElementById('status-count');
const themeSelect = document.getElementById('theme-select');
const langSelect = document.getElementById('lang-select');

let currentFilePath = null;
let dirty = false;
let savedContent = '';
let lang = localStorage.getItem('lang') || 'en';
let themeSetting = localStorage.getItem('theme') || 'system';

const L = () => LOCALES[lang] || LOCALES.en;

// ---- CodeMirror 编辑器 ----

const cm = CodeMirror(document.getElementById('editor-host'), {
  mode: 'markdown',
  lineWrapping: true,
  autofocus: true,
  extraKeys: {
    'Enter': 'newlineAndIndentContinueMarkdownList',
    'Tab': (cm) => {
      if (cm.somethingSelected()) cm.indentSelection('add');
      else cm.replaceSelection('  ');
    },
    'Shift-Tab': (cm) => cm.indentSelection('subtract')
  }
});

// ---- Markdown 渲染（代码块用 highlight.js 高亮，hljs 在 preload 中加载） ----

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

marked.use({
  breaks: true,
  gfm: true,
  renderer: {
    code(token) {
      const langName = (token.lang || '').match(/^\S*/)[0];
      const highlighted = window.api.highlight(token.text, langName) ?? escapeHtml(token.text);
      return `<pre><code class="hljs">${highlighted}</code></pre>\n`;
    }
  }
});

function renderMarkdown() {
  return marked.parse(cm.getValue());
}

function render() {
  preview.innerHTML = renderMarkdown();
}

// ---- 国际化 ----

function docName() {
  return currentFilePath ? currentFilePath.split(/[\\/]/).pop() : L().ui.untitled;
}

function updateStatus() {
  const ui = L().ui;
  statusPath.textContent = (currentFilePath || ui.untitled) + (dirty ? ' •' : '');
  statusCount.textContent = ui.chars.replace('{n}', cm.getValue().length);
  document.title = `${dirty ? '• ' : ''}${docName()} - Markdown Editor`;
}

function applyLang() {
  const ui = L().ui;
  document.documentElement.lang = lang;
  const tips = {
    'btn-new': `${ui.new} (Ctrl+N)`,
    'btn-open': `${ui.open} (Ctrl+O)`,
    'btn-save': `${ui.save} (Ctrl+S)`,
    'btn-save-as': `${ui.saveAs} (Ctrl+Shift+S)`,
    'btn-export-html': `${ui.exportHtml} (Ctrl+E)`,
    'btn-export-pdf': `${ui.exportPdf} (Ctrl+Shift+E)`,
    'btn-view-edit': `${ui.edit} (Ctrl+1)`,
    'btn-view-split': `${ui.split} (Ctrl+2)`,
    'btn-view-preview': `${ui.preview} (Ctrl+3)`
  };
  for (const [id, tip] of Object.entries(tips)) {
    document.getElementById(id).title = tip;
  }
  themeSelect.title = ui.theme;
  langSelect.title = ui.language;
  const themeLabels = [ui.themeSystem, ui.themeLight, ui.themeDark];
  Array.from(themeSelect.options).forEach((opt, i) => { opt.textContent = themeLabels[i]; });
  cm.setOption('placeholder', ui.placeholder);
  updateStatus();
  window.api.setLang(lang); // 通知主进程重建菜单
}

// 语言下拉框：各语言显示自己的本名
for (const [code, dict] of Object.entries(LOCALES)) {
  const opt = document.createElement('option');
  opt.value = code;
  opt.textContent = dict.name;
  langSelect.appendChild(opt);
}
langSelect.value = lang;
langSelect.addEventListener('change', () => {
  lang = langSelect.value;
  localStorage.setItem('lang', lang);
  applyLang();
});

// ---- 主题 ----

const darkMedia = matchMedia('(prefers-color-scheme: dark)');

function applyTheme() {
  const dark = themeSetting === 'dark' || (themeSetting === 'system' && darkMedia.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  cm.setOption('theme', dark ? 'material-darker' : 'default');
  document.getElementById('hljs-light').disabled = dark;
  document.getElementById('hljs-dark').disabled = !dark;
}

themeSelect.value = themeSetting;
themeSelect.addEventListener('change', () => {
  themeSetting = themeSelect.value;
  localStorage.setItem('theme', themeSetting);
  applyTheme();
});
darkMedia.addEventListener('change', () => {
  if (themeSetting === 'system') applyTheme();
});

// ---- 编辑状态 ----

function setDirty(value) {
  if (dirty !== value) {
    dirty = value;
    window.api.setDirty(dirty);
  }
  updateStatus();
}

function loadDocument(filePath, content) {
  currentFilePath = filePath;
  savedContent = content;
  cm.setValue(content);
  cm.clearHistory();
  render();
  setDirty(false);
}

let renderTimer = null;
cm.on('change', () => {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 120);
  setDirty(cm.getValue() !== savedContent);
});

// 编辑区滚动时，预览区按比例同步
cm.on('scroll', () => {
  const info = cm.getScrollInfo();
  const ratio = info.top / Math.max(1, info.height - info.clientHeight);
  preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
});

// ---- 文件操作 ----

async function confirmDiscardIfDirty() {
  if (!dirty) return true;
  return window.api.confirmDiscard(L().dialog.discard);
}

async function newFile() {
  if (!(await confirmDiscardIfDirty())) return;
  loadDocument(null, '');
}

async function openFile() {
  if (!(await confirmDiscardIfDirty())) return;
  const result = await window.api.openFile();
  if (result) loadDocument(result.filePath, result.content);
}

async function saveFile() {
  if (currentFilePath) {
    await window.api.saveFile(currentFilePath, cm.getValue());
    savedContent = cm.getValue();
    setDirty(false);
    return true;
  }
  return saveFileAs();
}

async function saveFileAs() {
  const filePath = await window.api.saveFileAs(cm.getValue(), currentFilePath || `${L().ui.untitled}.md`);
  if (!filePath) return false;
  currentFilePath = filePath;
  savedContent = cm.getValue();
  setDirty(false);
  return true;
}

// ---- 导出 ----

let msgTimer = null;
function flashStatus(text) {
  statusMsg.textContent = text;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { statusMsg.textContent = ''; }, 5000);
}

function exportBaseName(ext) {
  return docName().replace(/\.(md|markdown|txt)$/i, '') + ext;
}

async function doExportHtml() {
  const result = await window.api.exportHtml(renderMarkdown(), docName(), exportBaseName('.html'));
  if (result) flashStatus(L().ui.exported.replace('{path}', result));
}

async function doExportPdf() {
  const result = await window.api.exportPdf(renderMarkdown(), docName(), exportBaseName('.pdf'));
  if (result) flashStatus(L().ui.exported.replace('{path}', result));
}

// ---- 视图切换 ----

const viewButtons = {
  edit: document.getElementById('btn-view-edit'),
  split: document.getElementById('btn-view-split'),
  preview: document.getElementById('btn-view-preview')
};

function setView(mode) {
  main.className = `mode-${mode}`;
  for (const [key, btn] of Object.entries(viewButtons)) {
    btn.classList.toggle('active', key === mode);
  }
  if (mode !== 'preview') cm.refresh();
  if (mode !== 'edit') render();
}

// ---- 事件绑定 ----

document.getElementById('btn-new').addEventListener('click', newFile);
document.getElementById('btn-open').addEventListener('click', openFile);
document.getElementById('btn-save').addEventListener('click', saveFile);
document.getElementById('btn-save-as').addEventListener('click', saveFileAs);
document.getElementById('btn-export-html').addEventListener('click', doExportHtml);
document.getElementById('btn-export-pdf').addEventListener('click', doExportPdf);
viewButtons.edit.addEventListener('click', () => setView('edit'));
viewButtons.split.addEventListener('click', () => setView('split'));
viewButtons.preview.addEventListener('click', () => setView('preview'));

window.api.onMenu((action) => {
  ({
    'new': newFile,
    'open': openFile,
    'save': saveFile,
    'save-as': saveFileAs,
    'export-html': doExportHtml,
    'export-pdf': doExportPdf,
    'undo': () => cm.undo(),
    'redo': () => cm.redo(),
    'select-all': () => { cm.focus(); cm.execCommand('selectAll'); },
    'view-edit': () => setView('edit'),
    'view-split': () => setView('split'),
    'view-preview': () => setView('preview')
  })[action]?.();
});

// 双击 .md 文件 / 单实例转发过来的文件
window.api.onDocLoad(async ({ filePath, content }) => {
  if (!(await confirmDiscardIfDirty())) return;
  loadDocument(filePath, content);
});

// 关闭窗口时用户选择了"保存"
window.api.onSaveThenClose(async () => {
  if (await saveFile()) window.api.closeAfterSave();
});

// ---- 初始化 ----

applyTheme();
applyLang();
render();
