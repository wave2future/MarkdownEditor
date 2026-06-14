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

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

// 当前文档所在位置的 file:// URL，用来把 Markdown 里的相对图片路径解析成绝对路径。
// 预览页面本身是 renderer/index.html，相对路径默认相对它解析，所以必须重写。
let docBaseUrl = null;

function setDocBaseUrl(filePath) {
  docBaseUrl = filePath ? window.api.pathToFileUrl(filePath) : null;
}

function resolveSrc(src) {
  if (!src || !docBaseUrl) return src;
  // 已是绝对 URL（http(s):、file:、data: 等）或协议相对路径时不处理
  if (/^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith('//')) return src;
  try {
    return new URL(src, docBaseUrl).href;
  } catch {
    return src;
  }
}

// ---- 数学公式（KaTeX，katex 全局变量由 index.html 的 script 标签提供） ----

function renderMath(tex, displayMode) {
  try {
    // throwOnError:false 时 KaTeX 会把出错的公式渲染成红色提示，而不是抛异常
    return katex.renderToString(tex, { displayMode, throwOnError: false });
  } catch {
    return `<code class="math-error">${escapeHtml(tex)}</code>`;
  }
}

// 用 marked 扩展在其它内联规则之前拦截 $...$ / $$...$$，
// 否则公式里的下划线、星号会被当成 Markdown 强调语法处理。
const blockMath = {
  name: 'blockMath',
  level: 'block',
  start(src) { const i = src.indexOf('$$'); return i < 0 ? undefined : i; },
  tokenizer(src) {
    const m = /^\$\$([\s\S]+?)\$\$(?:\n+|$)/.exec(src);
    if (m) return { type: 'blockMath', raw: m[0], text: m[1].trim() };
  },
  renderer(token) { return renderMath(token.text, true); }
};

const inlineMath = {
  name: 'inlineMath',
  level: 'inline',
  start(src) { const i = src.indexOf('$'); return i < 0 ? undefined : i; },
  tokenizer(src) {
    // Pandoc 风格：开 $ 后不接空白，闭 $ 前不接空白且后面不接数字，
    // 这样 "花了 $5 和 $10" 这类货币写法不会被当成公式
    const m = /^\$(?!\s)((?:\\\$|[^$\n])+?)(?<!\s)\$(?!\d)/.exec(src);
    if (m) return { type: 'inlineMath', raw: m[0], text: m[1].trim() };
  },
  renderer(token) { return renderMath(token.text, false); }
};

marked.use({
  breaks: true,
  gfm: true,
  extensions: [blockMath, inlineMath],
  renderer: {
    code(token) {
      const langName = (token.lang || '').match(/^\S*/)[0];
      const highlighted = window.api.highlight(token.text, langName) ?? escapeHtml(token.text);
      return `<pre><code class="hljs">${highlighted}</code></pre>\n`;
    },
    image(token) {
      const src = escapeAttr(resolveSrc(token.href || ''));
      const alt = escapeAttr(token.text || '');
      const title = token.title ? ` title="${escapeAttr(token.title)}"` : '';
      return `<img src="${src}" alt="${alt}"${title}>`;
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
  setDocBaseUrl(filePath);
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
  setDocBaseUrl(filePath);
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

// ---- 可拖动的分隔条（调整编辑区/预览区宽度） ----

const splitter = document.getElementById('splitter');

// 恢复上次的分屏比例
const savedSplit = parseFloat(localStorage.getItem('splitPos'));
if (savedSplit >= 15 && savedSplit <= 85) {
  main.style.setProperty('--split-pos', savedSplit + '%');
}

splitter.addEventListener('mousedown', (e) => {
  e.preventDefault();
  document.body.classList.add('dragging');

  const onMove = (ev) => {
    const rect = main.getBoundingClientRect();
    let pct = ((ev.clientX - rect.left) / rect.width) * 100;
    pct = Math.min(85, Math.max(15, pct));
    main.style.setProperty('--split-pos', pct + '%');
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.classList.remove('dragging');
    const pct = main.style.getPropertyValue('--split-pos');
    if (pct) localStorage.setItem('splitPos', parseFloat(pct));
    cm.refresh();
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

// 双击分隔条恢复到 50/50
splitter.addEventListener('dblclick', () => {
  main.style.setProperty('--split-pos', '50%');
  localStorage.setItem('splitPos', 50);
  cm.refresh();
});

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
