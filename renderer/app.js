const preview = document.getElementById('preview');
const main = document.getElementById('main');
const tabbar = document.getElementById('tabbar');
const statusPath = document.getElementById('status-path');
const statusMsg = document.getElementById('status-msg');
const statusCount = document.getElementById('status-count');
const themeSelect = document.getElementById('theme-select');
const langSelect = document.getElementById('lang-select');
const findBar = document.getElementById('find-bar');
const outline = document.getElementById('outline');
const findInput = document.getElementById('find-input');
const findCount = document.getElementById('find-count');
const findPrev = document.getElementById('find-prev');
const findNext = document.getElementById('find-next');
const findClose = document.getElementById('find-close');
const findCase = document.getElementById('find-case');
const findWord = document.getElementById('find-word');
const findRegex = document.getElementById('find-regex');
const replaceRow = document.getElementById('replace-row');
const replaceInput = document.getElementById('replace-input');
const replaceOne = document.getElementById('replace-one');
const replaceAll = document.getElementById('replace-all');
const autoSaveToggle = document.getElementById('autosave-toggle');
const historyModal = document.getElementById('history-modal');
const historyTitle = document.getElementById('history-title');
const historyList = document.getElementById('history-list');
const historyClose = document.getElementById('history-close');
const diffModal = document.getElementById('diff-modal');
const diffTitle = document.getElementById('diff-title');
const diffPath = document.getElementById('diff-path');
const diffContent = document.getElementById('diff-content');
const diffCurrentLabel = document.getElementById('diff-current-label');
const diffDiskLabel = document.getElementById('diff-disk-label');
const diffKeep = document.getElementById('diff-keep');
const diffLoad = document.getElementById('diff-load');
const settingsModal = document.getElementById('settings-modal');
const settingsTitle = document.getElementById('settings-title');
const settingsClose = document.getElementById('settings-close');
const settingsCancel = document.getElementById('settings-cancel');
const settingsSave = document.getElementById('settings-save');
const settingLineNumbers = document.getElementById('setting-line-numbers');
const settingLineWrapping = document.getElementById('setting-line-wrapping');
const settingAutoSave = document.getElementById('setting-auto-save');
const settingTabSize = document.getElementById('setting-tab-size');
const settingFontSize = document.getElementById('setting-font-size');
const settingDefaultView = document.getElementById('setting-default-view');
const gotoModal = document.getElementById('goto-modal');
const gotoTitle = document.getElementById('goto-title');
const gotoInput = document.getElementById('goto-input');
const gotoClose = document.getElementById('goto-close');
const gotoCancel = document.getElementById('goto-cancel');
const gotoSubmit = document.getElementById('goto-submit');

let lang = localStorage.getItem('lang') || 'en';
let themeSetting = localStorage.getItem('theme') || 'system';
const DEFAULT_EDITOR_SETTINGS = Object.freeze({
  lineNumbers: false,
  lineWrapping: true,
  autoSave: localStorage.getItem('autoSave') === 'true',
  tabSize: 2,
  fontSize: 14,
  defaultView: 'split'
});

function loadEditorSettings() {
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem('editorSettings') || '{}'); } catch { /* Ignore invalid settings. */ }
  return {
    lineNumbers: typeof stored.lineNumbers === 'boolean' ? stored.lineNumbers : DEFAULT_EDITOR_SETTINGS.lineNumbers,
    lineWrapping: typeof stored.lineWrapping === 'boolean' ? stored.lineWrapping : DEFAULT_EDITOR_SETTINGS.lineWrapping,
    autoSave: typeof stored.autoSave === 'boolean' ? stored.autoSave : DEFAULT_EDITOR_SETTINGS.autoSave,
    tabSize: [2, 4, 8].includes(Number(stored.tabSize)) ? Number(stored.tabSize) : 2,
    fontSize: Math.min(28, Math.max(11, Number(stored.fontSize) || 14)),
    defaultView: ['edit', 'split', 'preview'].includes(stored.defaultView) ? stored.defaultView : 'split'
  };
}

let editorSettings = loadEditorSettings();

const L = () => LOCALES[lang] || LOCALES.en;
const DEFAULT_DOCUMENT_FORMAT = Object.freeze({ encoding: 'utf8', bom: false, eol: '\n' });

function documentFormat(value) {
  return {
    encoding: ['utf8', 'utf16le', 'utf16be'].includes(value?.encoding) ? value.encoding : 'utf8',
    bom: !!value?.bom,
    eol: ['\n', '\r\n', '\r'].includes(value?.eol) ? value.eol : '\n'
  };
}

// ---- 多文档（Tab）模型 ----
// 单个 CodeMirror 实例 + 每个 Tab 一份 CodeMirror.Doc，用 cm.swapDoc() 切换。
// 每个 Doc 自带独立的撤销历史，切换 Tab 时历史互不干扰。
let tabs = [];
let activeIndex = -1;
let tabSeq = 0;
let restoringSession = false;
let sessionSaveTimer = null;
let autoSaveEnabled = editorSettings.autoSave;
const autoSaveTimers = new Map();

function activeTab() {
  return tabs[activeIndex] || null;
}

function sessionSnapshot() {
  return {
    version: 1,
    activeIndex,
    tabs: tabs.map((tab) => ({
      filePath: tab.filePath,
      content: tab.doc.getValue(),
      savedContent: tab.savedContent,
      format: tab.format,
      dirty: tab.dirty
    }))
  };
}

function scheduleSessionSave() {
  if (restoringSession || tabs.length === 0) return;
  clearTimeout(sessionSaveTimer);
  sessionSaveTimer = setTimeout(() => {
    sessionSaveTimer = null;
    window.api.saveSession(sessionSnapshot()).catch(() => {});
  }, 150);
}

function scheduleAutoSave(tab) {
  if (!autoSaveEnabled || !tab?.filePath || !tab.dirty) return;
  clearTimeout(autoSaveTimers.get(tab.id));
  autoSaveTimers.set(tab.id, setTimeout(async () => {
    const content = tab.doc.getValue();
    try {
      const result = await window.api.saveFile(tab.filePath, content, tab.format, true);
      if (!result?.ok) {
        flashStatus(L().ui.autoSaveFailed.replace('{error}', result?.error || 'Unknown error'));
        return;
      }
      tab.format = documentFormat(result.format);
      tab.savedContent = content;
      setTabDirty(tab, tab.doc.getValue() !== content);
    } catch {
      // 常规保存错误由下一次手动保存或自动保存重试处理。
    }
    autoSaveTimers.delete(tab.id);
  }, 1500));
}

async function persistSessionNow() {
  clearTimeout(sessionSaveTimer);
  sessionSaveTimer = null;
  if (tabs.length > 0) await window.api.saveSession(sessionSnapshot());
}

// ---- CodeMirror 编辑器 ----

const cm = CodeMirror(document.getElementById('editor-host'), {
  mode: 'markdown',
  lineWrapping: true,
  autofocus: true,
  styleSelectedText: true,
  extraKeys: {
    'Enter': 'newlineAndIndentContinueMarkdownList',
    'Cmd-F': () => openFind(),
    'Ctrl-F': () => openFind(),
    'Ctrl-H': () => openReplace(),
    'Cmd-Alt-F': () => openReplace(),
    'Cmd-B': () => wrapSelection('**', '**', 'bold'),
    'Ctrl-B': () => wrapSelection('**', '**', 'bold'),
    'Cmd-I': () => wrapSelection('*', '*', 'italic'),
    'Ctrl-I': () => wrapSelection('*', '*', 'italic'),
    'Cmd-G': () => navigateSearch(1),
    'Ctrl-G': () => navigateSearch(1),
    'Shift-Cmd-G': () => navigateSearch(-1),
    'Shift-Ctrl-G': () => navigateSearch(-1),
    'Tab': (cm) => {
      if (cm.somethingSelected()) cm.indentSelection('add');
      else cm.replaceSelection('  ');
    },
    'Shift-Tab': (cm) => cm.indentSelection('subtract')
  }
});

let searchMarkers = [];
let searchMatches = [];
let searchIndex = -1;
let searchRefreshTimer = null;
let searchInvalid = false;

function searchOption(button) {
  return button.getAttribute('aria-pressed') === 'true';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function searchPattern() {
  const source = searchOption(findRegex) ? findInput.value : escapeRegExp(findInput.value);
  const wrapped = searchOption(findWord) ? `\\b(?:${source})\\b` : source;
  return new RegExp(wrapped, searchOption(findCase) ? 'g' : 'gi');
}

function clearSearchMarkers() {
  searchMarkers.forEach((marker) => marker.clear());
  searchMarkers = [];
}

function updateSearchCount() {
  if (!findInput.value) findCount.textContent = '';
  else if (searchInvalid) findCount.textContent = L().ui.invalidRegex;
  else if (searchMatches.length === 0) findCount.textContent = L().ui.noResults;
  else findCount.textContent = L().ui.matchCount
    .replace('{current}', searchIndex + 1)
    .replace('{total}', searchMatches.length);
}

function refreshSearch(selectMatch = true) {
  clearSearchMarkers();
  searchMatches = [];
  searchIndex = -1;
  searchInvalid = false;
  const query = findInput.value;
  if (!query) {
    updateSearchCount();
    return;
  }

  let pattern;
  try {
    pattern = searchPattern();
  } catch {
    searchInvalid = true;
    updateSearchCount();
    return;
  }
  const cursor = cm.getSearchCursor(pattern, CodeMirror.Pos(0, 0));
  while (cursor.findNext()) {
    if (CodeMirror.cmpPos(cursor.from(), cursor.to()) !== 0) {
      searchMatches.push({ from: cursor.from(), to: cursor.to() });
    }
  }

  if (searchMatches.length > 0) {
    const position = cm.getCursor('from');
    searchIndex = searchMatches.findIndex((match) => CodeMirror.cmpPos(match.from, position) >= 0);
    if (searchIndex < 0) searchIndex = 0;
  }
  paintSearchMatches();
  if (selectMatch && searchIndex >= 0) selectSearchMatch();
  updateSearchCount();
}

function paintSearchMatches() {
  clearSearchMarkers();
  searchMarkers = searchMatches.map((match, index) => cm.markText(match.from, match.to, {
    className: index === searchIndex ? 'cm-searching cm-searching-current' : 'cm-searching'
  }));
}

function selectSearchMatch() {
  const match = searchMatches[searchIndex];
  if (!match) return;
  cm.setSelection(match.from, match.to);
  cm.scrollIntoView({ from: match.from, to: match.to }, 80);
}

function navigateSearch(direction) {
  if (findBar.hidden) {
    openFind();
    return;
  }
  if (searchMatches.length === 0) refreshSearch(false);
  if (searchMatches.length === 0) return;
  searchIndex = (searchIndex + direction + searchMatches.length) % searchMatches.length;
  paintSearchMatches();
  selectSearchMatch();
  updateSearchCount();
  findInput.focus();
}

function openFind() {
  openSearch(false);
}

function openReplace() {
  openSearch(true);
}

function openSearch(showReplace) {
  if (main.classList.contains('mode-preview')) setView('edit');
  const selected = cm.getSelection();
  if (findBar.hidden && selected && !selected.includes('\n') && selected.length <= 200) {
    findInput.value = selected;
  }
  findBar.hidden = false;
  if (showReplace) replaceRow.hidden = false;
  refreshSearch(true);
  // 菜单快捷键触发后 Electron 会尝试恢复原焦点，延后一帧可确保光标留在搜索框。
  requestAnimationFrame(() => {
    findInput.focus();
    findInput.select();
  });
}

function replaceCurrent() {
  if (searchIndex < 0 || !searchMatches[searchIndex]) return;
  const match = searchMatches[searchIndex];
  cm.replaceRange(replacementForMatch(match), match.from, match.to, '+replace');
  refreshSearch(true);
  replaceInput.focus();
}

function replacementForMatch(match) {
  if (!searchOption(findRegex)) return replaceInput.value;
  const text = cm.getRange(match.from, match.to);
  const pattern = searchPattern();
  pattern.lastIndex = 0;
  return text.replace(new RegExp(pattern.source, pattern.flags.replace('g', '')), replaceInput.value);
}

function replaceEveryMatch() {
  refreshSearch(false);
  if (searchMatches.length === 0) return;
  cm.operation(() => {
    for (let i = searchMatches.length - 1; i >= 0; i--) {
      cm.replaceRange(replacementForMatch(searchMatches[i]), searchMatches[i].from, searchMatches[i].to, '+replace');
    }
  });
  refreshSearch(false);
  replaceInput.focus();
}

function closeFind() {
  findBar.hidden = true;
  replaceRow.hidden = true;
  clearSearchMarkers();
  searchMatches = [];
  searchIndex = -1;
  clearTimeout(searchRefreshTimer);
  cm.focus();
}

findInput.addEventListener('input', () => refreshSearch(true));
findInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    navigateSearch(e.shiftKey ? -1 : 1);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeFind();
  }
});
findPrev.addEventListener('click', () => navigateSearch(-1));
findNext.addEventListener('click', () => navigateSearch(1));
findClose.addEventListener('click', closeFind);
replaceOne.addEventListener('click', replaceCurrent);
replaceAll.addEventListener('click', replaceEveryMatch);
replaceInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    replaceCurrent();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeFind();
  }
});
[findCase, findWord, findRegex].forEach((button) => {
  button.addEventListener('click', () => {
    button.setAttribute('aria-pressed', String(!searchOption(button)));
    refreshSearch(true);
  });
});

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    openFind();
  } else if (e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'h') {
    e.preventDefault();
    openReplace();
  } else if (e.metaKey && e.altKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    openReplace();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    openGoToLine();
  } else if (e.key === 'Escape' && !findBar.hidden) {
    e.preventDefault();
    closeFind();
  } else if (e.key === 'Escape' && !historyModal.hidden) {
    e.preventDefault();
    closeHistory();
  } else if (e.key === 'Escape' && !diffModal.hidden) {
    e.preventDefault();
    resolveExternalDiff(false);
  } else if (e.key === 'Escape' && !settingsModal.hidden) {
    e.preventDefault();
    closeSettings();
  } else if (e.key === 'Escape' && !gotoModal.hidden) {
    e.preventDefault();
    closeGoToLine();
  }
}, true);

function copySelection() {
  if (!cm.somethingSelected()) return;
  window.api.writeClipboardText(cm.getSelections().join('\n'));
  cm.focus();
}

function cutSelection() {
  if (!cm.somethingSelected()) return;
  window.api.writeClipboardText(cm.getSelections().join('\n'));
  cm.operation(() => {
    cm.replaceSelections(cm.getSelections().map(() => ''), 'around', '+cut');
  });
  cm.focus();
}

async function pasteClipboard() {
  const text = await window.api.readClipboardText();
  if (!text) {
    const bytes = await window.api.readClipboardImage();
    if (bytes) {
      const documentPath = await ensureDocumentPath();
      if (documentPath) insertImageMarkdown(await window.api.saveImageData(bytes, 'image/png', documentPath));
      return;
    }
  }
  cm.operation(() => {
    cm.replaceSelections(cm.listSelections().map(() => text), 'end', '+paste');
  });
  cm.focus();
}

function wrapSelection(before, after, placeholder) {
  cm.operation(() => {
    const selections = cm.getSelections();
    cm.replaceSelections(selections.map((text) => `${before}${text || placeholder}${after}`), 'around', '+format');
  });
  cm.focus();
}

function prefixSelectedLines(prefix) {
  const from = cm.getCursor('from').line;
  const end = cm.getCursor('to');
  const to = end.ch === 0 && end.line > from ? end.line - 1 : end.line;
  const lines = [];
  for (let line = from; line <= to; line++) lines.push(cm.getLine(line));
  const remove = lines.filter((line) => line.trim()).every((line) => line.startsWith(prefix));
  cm.operation(() => {
    for (let line = to; line >= from; line--) {
      if (remove) cm.replaceRange('', { line, ch: 0 }, { line, ch: prefix.length }, '+format');
      else cm.replaceRange(prefix, { line, ch: 0 }, null, '+format');
    }
  });
  cm.focus();
}

function applyFormat(format) {
  ({
    bold: () => wrapSelection('**', '**', 'bold'),
    italic: () => wrapSelection('*', '*', 'italic'),
    strike: () => wrapSelection('~~', '~~', 'text'),
    heading: () => prefixSelectedLines('## '),
    quote: () => prefixSelectedLines('> '),
    bullet: () => prefixSelectedLines('- '),
    numbered: () => prefixSelectedLines('1. '),
    task: () => prefixSelectedLines('- [ ] '),
    link: () => wrapSelection('[', '](https://)', 'link text'),
    image: chooseAndInsertImage,
    code: () => {
      const selected = cm.getSelection();
      if (selected.includes('\n')) wrapSelection('```\n', '\n```', 'code');
      else wrapSelection('`', '`', 'code');
    }
  })[format]?.();
}

async function chooseAndInsertImage() {
  const documentPath = await ensureDocumentPath();
  if (!documentPath) return;
  insertImageMarkdown(await window.api.chooseImage(documentPath));
}

// 右键点在现有选区内时保留选区；点在选区外时，把光标移到点击位置。
cm.getWrapperElement().addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const pos = cm.coordsChar({ left: e.clientX, top: e.clientY }, 'window');
  const inSelection = cm.listSelections().some((range) => {
    const from = range.from();
    const to = range.to();
    return CodeMirror.cmpPos(from, pos) <= 0 && CodeMirror.cmpPos(pos, to) <= 0 &&
      CodeMirror.cmpPos(from, to) !== 0;
  });
  if (!inSelection) cm.setCursor(pos);
  cm.focus();

  const history = cm.historySize();
  window.api.showEditorContextMenu({
    hasSelection: cm.somethingSelected(),
    canUndo: history.undo > 0,
    canRedo: history.redo > 0
  });
}, true);

preview.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const selection = window.getSelection();
  const selectedText = selection && selection.rangeCount > 0 &&
    preview.contains(selection.getRangeAt(0).commonAncestorContainer)
    ? selection.toString()
    : '';
  window.api.showPreviewContextMenu(selectedText);
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

function safeUrl(raw, kind) {
  if (!raw) return null;
  if (kind === 'image' && /^data:image\/(?:png|gif|jpe?g|webp|svg\+xml);/i.test(raw)) return raw;
  try {
    const resolved = new URL(raw, docBaseUrl || location.href);
    const allowed = kind === 'image'
      ? ['file:', 'http:', 'https:']
      : ['file:', 'http:', 'https:', 'mailto:'];
    return allowed.includes(resolved.protocol) ? resolved.href : null;
  } catch {
    return null;
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
    // 不可信 Markdown 中的原始 HTML 仅作为文本显示，阻止事件属性和脚本进入预览区。
    html(token) {
      return escapeHtml(token.text || token.raw || '');
    },
    code(token) {
      const langName = (token.lang || '').match(/^\S*/)[0];
      const highlighted = window.api.highlight(token.text, langName) ?? escapeHtml(token.text);
      return `<pre><code class="hljs">${highlighted}</code></pre>\n`;
    },
    image(token) {
      const safeSrc = safeUrl(resolveSrc(token.href || ''), 'image');
      const alt = escapeAttr(token.text || '');
      if (!safeSrc) return alt;
      const src = escapeAttr(safeSrc);
      const title = token.title ? ` title="${escapeAttr(token.title)}"` : '';
      return `<img src="${src}" alt="${alt}"${title}>`;
    },
    link(token) {
      const href = safeUrl(token.href || '', 'link');
      const text = this.parser.parseInline(token.tokens || []);
      if (!href) return text;
      const title = token.title ? ` title="${escapeAttr(token.title)}"` : '';
      return `<a href="${escapeAttr(href)}"${title}>${text}</a>`;
    }
  }
});

function renderMarkdown() {
  return marked.parse(cm.getValue());
}

function render() {
  preview.innerHTML = renderMarkdown();
  renderOutline();
}

function documentHeadings() {
  const headings = [];
  let fenced = false;
  cm.eachLine((handle) => {
    const line = handle.text;
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      return;
    }
    if (fenced) return;
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) headings.push({ level: match[1].length, text: match[2], line: cm.getLineNumber(handle) });
  });
  return headings;
}

function renderOutline() {
  if (outline.hidden) return;
  outline.innerHTML = '';
  const headings = documentHeadings();
  if (headings.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'outline-empty';
    empty.textContent = L().ui.noHeadings;
    outline.appendChild(empty);
    return;
  }
  headings.forEach((heading) => {
    const button = document.createElement('button');
    button.className = 'outline-item';
    button.style.paddingLeft = `${6 + (heading.level - 1) * 12}px`;
    button.textContent = heading.text;
    button.title = heading.text;
    button.addEventListener('click', () => {
      if (main.classList.contains('mode-preview')) setView('edit');
      cm.setCursor({ line: heading.line, ch: 0 });
      cm.scrollIntoView({ line: heading.line, ch: 0 }, 100);
      cm.focus();
    });
    outline.appendChild(button);
  });
}

function toggleOutline() {
  outline.hidden = !outline.hidden;
  document.getElementById('btn-outline').classList.toggle('active', !outline.hidden);
  localStorage.setItem('outlineVisible', String(!outline.hidden));
  if (!outline.hidden) renderOutline();
  cm.refresh();
}

preview.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link || !preview.contains(link)) return;
  e.preventDefault();
  const href = link.href;
  if (/^(https?:|mailto:)/i.test(href)) window.api.openExternal(href);
});

// ---- 国际化 ----

function docName(tab) {
  const t = tab || activeTab();
  if (!t || !t.filePath) return L().ui.untitled;
  return t.filePath.split(/[\\/]/).pop();
}

function updateStatus() {
  const ui = L().ui;
  const tab = activeTab();
  const dirty = !!(tab && tab.dirty);
  statusPath.textContent = (tab && tab.filePath ? tab.filePath : ui.untitled) + (dirty ? ' •' : '');
  const content = tab ? tab.doc.getValue() : '';
  const cursor = cm.getCursor();
  const selected = cm.getSelections().reduce((total, text) => total + text.length, 0);
  const cjk = (content.match(/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  const nonCjk = content.replace(/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g, ' ');
  const words = cjk + (nonCjk.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []).length;
  statusCount.textContent = ui.stats
    .replace('{words}', words)
    .replace('{chars}', content.length)
    .replace('{lines}', tab ? tab.doc.lineCount() : 1)
    .replace('{line}', cursor.line + 1)
    .replace('{column}', cursor.ch + 1) +
    (selected ? ui.selectedStats.replace('{selected}', selected) : '');
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
    'btn-print': `${ui.print} (Ctrl+P)`,
    'btn-outline': ui.outline,
    'btn-settings': ui.settings,
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
  findInput.placeholder = ui.findPlaceholder;
  findInput.setAttribute('aria-label', ui.find);
  findPrev.title = ui.findPrevious;
  findPrev.setAttribute('aria-label', ui.findPrevious);
  findNext.title = ui.findNext;
  findNext.setAttribute('aria-label', ui.findNext);
  findClose.title = ui.close;
  findClose.setAttribute('aria-label', ui.close);
  replaceInput.placeholder = ui.replacePlaceholder;
  replaceInput.setAttribute('aria-label', ui.replacePlaceholder);
  replaceOne.textContent = ui.replace;
  replaceAll.textContent = ui.replaceAll;
  findCase.title = ui.matchCase;
  findCase.setAttribute('aria-label', ui.matchCase);
  findWord.title = ui.wholeWord;
  findWord.setAttribute('aria-label', ui.wholeWord);
  findRegex.title = ui.useRegex;
  findRegex.setAttribute('aria-label', ui.useRegex);
  autoSaveToggle.textContent = ui.autoSave;
  autoSaveToggle.title = ui.autoSave;
  autoSaveToggle.setAttribute('aria-label', ui.autoSave);
  autoSaveToggle.setAttribute('aria-pressed', String(autoSaveEnabled));
  historyTitle.textContent = ui.history;
  diffTitle.textContent = ui.diffTitle;
  diffCurrentLabel.textContent = ui.currentVersion;
  diffDiskLabel.textContent = ui.diskVersion;
  diffKeep.textContent = ui.keepCurrent;
  diffLoad.textContent = ui.loadLatest;
  settingsTitle.textContent = ui.settings;
  document.getElementById('label-line-numbers').textContent = ui.lineNumbers;
  document.getElementById('label-line-wrapping').textContent = ui.lineWrapping;
  document.getElementById('label-auto-save').textContent = ui.autoSave;
  document.getElementById('label-tab-size').textContent = ui.tabSize;
  document.getElementById('label-font-size').textContent = ui.fontSize;
  document.getElementById('label-default-view').textContent = ui.defaultView;
  settingsCancel.textContent = ui.close;
  settingsSave.textContent = ui.save;
  const viewLabels = [ui.edit, ui.split, ui.preview];
  Array.from(settingDefaultView.options).forEach((option, index) => { option.textContent = viewLabels[index]; });
  gotoTitle.textContent = ui.goToLine;
  gotoInput.placeholder = ui.lineNumber;
  gotoInput.setAttribute('aria-label', ui.lineNumber);
  gotoCancel.textContent = ui.close;
  gotoSubmit.textContent = ui.go;
  const formatLabels = {
    bold: ui.bold, italic: ui.italic, strike: ui.strike, heading: ui.heading, quote: ui.quote,
    code: ui.code, link: ui.link, image: ui.image, bullet: ui.bulletList, numbered: ui.numberedList, task: ui.taskList
  };
  document.querySelectorAll('.format-btn').forEach((button) => {
    const label = formatLabels[button.dataset.format];
    button.title = label;
    button.setAttribute('aria-label', label);
  });
  updateSearchCount();
  renderTabs();
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

// ---- 编辑器设置 ----

function persistEditorSettings() {
  editorSettings.autoSave = autoSaveEnabled;
  localStorage.setItem('editorSettings', JSON.stringify(editorSettings));
  localStorage.setItem('autoSave', String(autoSaveEnabled));
}

function applyEditorSettings() {
  cm.setOption('lineNumbers', editorSettings.lineNumbers);
  cm.setOption('lineWrapping', editorSettings.lineWrapping);
  cm.setOption('tabSize', editorSettings.tabSize);
  cm.setOption('indentUnit', editorSettings.tabSize);
  cm.getWrapperElement().style.fontSize = `${editorSettings.fontSize}px`;
  cm.refresh();
}

function openSettings() {
  settingLineNumbers.checked = editorSettings.lineNumbers;
  settingLineWrapping.checked = editorSettings.lineWrapping;
  settingAutoSave.checked = autoSaveEnabled;
  settingTabSize.value = String(editorSettings.tabSize);
  settingFontSize.value = String(editorSettings.fontSize);
  settingDefaultView.value = editorSettings.defaultView;
  settingsModal.hidden = false;
  settingLineNumbers.focus();
}

function closeSettings() {
  settingsModal.hidden = true;
  cm.focus();
}

function saveSettings() {
  editorSettings = {
    lineNumbers: settingLineNumbers.checked,
    lineWrapping: settingLineWrapping.checked,
    autoSave: settingAutoSave.checked,
    tabSize: Number(settingTabSize.value),
    fontSize: Math.min(28, Math.max(11, Number(settingFontSize.value) || 14)),
    defaultView: settingDefaultView.value
  };
  autoSaveEnabled = editorSettings.autoSave;
  autoSaveToggle.setAttribute('aria-pressed', String(autoSaveEnabled));
  if (!autoSaveEnabled) {
    autoSaveTimers.forEach((timer) => clearTimeout(timer));
    autoSaveTimers.clear();
  } else {
    scheduleAutoSave(activeTab());
  }
  persistEditorSettings();
  applyEditorSettings();
  closeSettings();
}

function openGoToLine() {
  gotoInput.max = String(cm.lineCount());
  gotoInput.value = String(cm.getCursor().line + 1);
  gotoModal.hidden = false;
  requestAnimationFrame(() => { gotoInput.focus(); gotoInput.select(); });
}

function closeGoToLine() {
  gotoModal.hidden = true;
  cm.focus();
}

function goToLine() {
  const line = Math.min(cm.lineCount(), Math.max(1, Number.parseInt(gotoInput.value, 10) || 1));
  closeGoToLine();
  cm.setCursor({ line: line - 1, ch: 0 });
  cm.scrollIntoView({ line: line - 1, ch: 0 }, 100);
  cm.focus();
}

// ---- Tab 管理 ----

// 主进程的"未保存"标志（驱动关窗确认对话框）只需知道"是否有任意 Tab 脏"
function syncGlobalDirty() {
  window.api.setDirty(tabs.some((t) => t.dirty));
}

function setTabDirty(tab, value) {
  if (tab.dirty !== value) {
    tab.dirty = value;
    syncGlobalDirty();
  }
  if (tab === activeTab()) updateStatus();
  renderTabs();
  scheduleSessionSave();
}

function createTab(filePath, content, savedContent = content, dirty = false, format = DEFAULT_DOCUMENT_FORMAT) {
  const tab = {
    id: ++tabSeq,
    filePath,
    doc: CodeMirror.Doc(content, 'markdown'),
    savedContent,
    format: documentFormat(format),
    missing: false,
    dirty
  };
  tabs.push(tab);
  scheduleSessionSave();
  return tab;
}

function activateTab(index) {
  if (index < 0 || index >= tabs.length) return;
  clearSearchMarkers();
  activeIndex = index;
  const tab = tabs[index];
  cm.swapDoc(tab.doc);
  setDocBaseUrl(tab.filePath);
  render();
  renderTabs();
  updateStatus();
  if (!findBar.hidden) refreshSearch(false);
  cm.focus();
  scheduleSessionSave();
}

// 已打开同一文件则直接切过去（保留其中未保存的编辑），否则新建 Tab
function openInNewTab(filePath, content, format) {
  if (filePath) {
    const existing = tabs.findIndex((t) => t.filePath === filePath);
    if (existing >= 0) {
      activateTab(existing);
      return;
    }
  }
  createTab(filePath, content, content, false, format);
  activateTab(tabs.length - 1);
}

async function closeTab(index) {
  const tab = tabs[index];
  if (!tab) return;
  if (tab.dirty) {
    activateTab(index);
    if (!(await window.api.confirmDiscard(L().dialog.discard))) return;
  }
  removeTab(index);
}

function removeTab(index) {
  tabs.splice(index, 1);
  if (tabs.length === 0) {
    createTab(null, '');
    activateTab(0);
  } else {
    // 关掉的 Tab 在当前激活项之前/就是当前项时，索引要回退一格
    activateTab(Math.min(index, tabs.length - 1));
  }
  syncGlobalDirty();
  scheduleSessionSave();
}

function renderTabs() {
  tabbar.innerHTML = '';
  tabs.forEach((tab, i) => {
    const el = document.createElement('div');
    el.className = 'tab' + (i === activeIndex ? ' active' : '');
    el.title = tab.filePath || docName(tab);

    const name = document.createElement('span');
    name.className = 'tab-name';
    name.textContent = (tab.dirty ? '• ' : '') + docName(tab);
    el.appendChild(name);

    const close = document.createElement('button');
    close.className = 'tab-close';
    close.textContent = '×';
    close.addEventListener('mousedown', (e) => e.stopPropagation());
    close.addEventListener('click', (e) => { e.stopPropagation(); closeTab(i); });
    el.appendChild(close);

    el.addEventListener('mousedown', (e) => {
      if (e.button === 1) { e.preventDefault(); closeTab(i); } // 中键关闭
    });
    el.addEventListener('click', () => activateTab(i));
    tabbar.appendChild(el);
  });

  const add = document.createElement('button');
  add.className = 'tab-add';
  add.textContent = '+';
  add.title = L().ui.new;
  add.addEventListener('click', newFile);
  tabbar.appendChild(add);
}

async function restorePreviousSession() {
  const session = await window.api.loadSession();
  if (!session || !Array.isArray(session.tabs) || session.tabs.length === 0) return false;

  restoringSession = true;
  tabs = [];
  activeIndex = -1;
  for (const savedTab of session.tabs) {
    createTab(
      savedTab.filePath || null,
      typeof savedTab.content === 'string' ? savedTab.content : '',
      typeof savedTab.savedContent === 'string' ? savedTab.savedContent : '',
      !!savedTab.dirty,
      savedTab.format
    );
  }
  restoringSession = false;

  activateTab(Math.max(0, Math.min(session.activeIndex || 0, tabs.length - 1)));
  syncGlobalDirty();
  scheduleSessionSave();
  return true;
}

// ---- 编辑状态 ----

let renderTimer = null;
cm.on('change', () => {
  const tab = activeTab();
  if (!tab) return;
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 120);
  setTabDirty(tab, tab.missing || tab.doc.getValue() !== tab.savedContent);
  scheduleAutoSave(tab);
  if (!findBar.hidden) {
    clearTimeout(searchRefreshTimer);
    searchRefreshTimer = setTimeout(() => refreshSearch(false), 80);
  }
});

// 编辑区滚动时，预览区按比例同步
cm.on('scroll', () => {
  const info = cm.getScrollInfo();
  const ratio = info.top / Math.max(1, info.height - info.clientHeight);
  preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
});

cm.on('cursorActivity', updateStatus);

// ---- 文件操作 ----

function newFile() {
  createTab(null, '');
  activateTab(tabs.length - 1);
}

async function openFile() {
  const result = await window.api.openFile();
  if (result) openInNewTab(result.filePath, result.content, result.format);
}

async function saveFile() {
  const tab = activeTab();
  if (!tab) return false;
  if (tab.filePath) {
    const result = await window.api.saveFile(tab.filePath, tab.doc.getValue(), tab.format);
    if (!result?.ok) {
      flashStatus(L().ui.saveFailed.replace('{error}', result?.error || 'Unknown error'));
      return false;
    }
    tab.format = documentFormat(result.format);
    tab.missing = false;
    tab.savedContent = tab.doc.getValue();
    setTabDirty(tab, false);
    flashStatus(L().ui.saved);
    return true;
  }
  return saveFileAs();
}

async function saveFileAs() {
  const tab = activeTab();
  if (!tab) return false;
  const result = await window.api.saveFileAs(tab.doc.getValue(), tab.filePath || `${L().ui.untitled}.md`, tab.format);
  if (!result) return false;
  if (result.error) {
    flashStatus(L().ui.saveFailed.replace('{error}', result.error));
    return false;
  }
  tab.filePath = result.filePath;
  tab.format = documentFormat(result.format);
  tab.missing = false;
  setDocBaseUrl(result.filePath);
  tab.savedContent = tab.doc.getValue();
  setTabDirty(tab, false);
  updateStatus();
  flashStatus(L().ui.saved);
  return true;
}

async function openHistory() {
  const tab = activeTab();
  historyModal.hidden = false;
  historyList.innerHTML = '';
  const entries = tab?.filePath ? await window.api.listHistory(tab.filePath) : [];
  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = L().ui.noHistory;
    historyList.appendChild(empty);
    return;
  }
  entries.forEach((entry) => {
    const button = document.createElement('button');
    button.className = 'history-item';
    const time = document.createElement('time');
    time.textContent = new Date(entry.createdAt).toLocaleString(lang);
    const size = document.createElement('span');
    size.textContent = L().ui.chars.replace('{n}', entry.size);
    button.append(time, size);
    button.addEventListener('click', async () => {
      if (!(await window.api.confirmDiscard(L().ui.restoreVersion))) return;
      const content = await window.api.readHistory(tab.filePath, entry.id);
      if (typeof content !== 'string') return;
      const lastLine = cm.lastLine();
      cm.replaceRange(content, { line: 0, ch: 0 }, { line: lastLine, ch: cm.getLine(lastLine).length }, '+history');
      historyModal.hidden = true;
      cm.focus();
    });
    historyList.appendChild(button);
  });
}

function closeHistory() {
  historyModal.hidden = true;
  cm.focus();
}

let externalDiffResolver = null;

function resolveExternalDiff(loadLatest) {
  if (!externalDiffResolver) return;
  const resolve = externalDiffResolver;
  externalDiffResolver = null;
  diffModal.hidden = true;
  resolve(loadLatest);
}

function showExternalDiff(filePath, currentContent, diskContent) {
  if (externalDiffResolver) resolveExternalDiff(false);
  diffPath.textContent = filePath;
  diffContent.innerHTML = '';
  window.api.diffLines(currentContent, diskContent).forEach((row) => {
    const rowElement = document.createElement('div');
    rowElement.className = `diff-row ${row.type}`;
    for (const side of ['left', 'right']) {
      const cell = document.createElement('div');
      cell.className = 'diff-cell';
      const number = document.createElement('span');
      number.className = 'diff-line-number';
      number.textContent = row[`${side}Line`] ?? '';
      const text = document.createElement('span');
      text.className = 'diff-line-text';
      text.textContent = row[`${side}Text`] || ' ';
      cell.append(number, text);
      rowElement.appendChild(cell);
    }
    diffContent.appendChild(rowElement);
  });
  diffModal.hidden = false;
  return new Promise((resolve) => { externalDiffResolver = resolve; });
}

diffKeep.addEventListener('click', () => resolveExternalDiff(false));
diffLoad.addEventListener('click', () => resolveExternalDiff(true));

async function ensureDocumentPath() {
  const tab = activeTab();
  if (!tab) return null;
  if (!tab.filePath && !(await saveFileAs())) return null;
  return tab.filePath;
}

function insertImageMarkdown(relativePath, alt = 'image') {
  if (!relativePath) return;
  cm.replaceSelection(`![${alt}](${relativePath.replace(/\\/g, '/')})`, 'end', '+image');
  cm.focus();
}

async function importImageFile(file) {
  const documentPath = await ensureDocumentPath();
  if (!documentPath) return false;
  const sourcePath = window.api.getPathForFile(file);
  let relativePath = null;
  if (sourcePath) relativePath = await window.api.importImage(sourcePath, documentPath);
  else if (file.type?.startsWith('image/')) {
    relativePath = await window.api.saveImageData(new Uint8Array(await file.arrayBuffer()), file.type, documentPath);
  }
  if (!relativePath) return false;
  insertImageMarkdown(relativePath, file.name?.replace(/\.[^.]+$/, '') || 'image');
  return true;
}

async function pasteImage(e) {
  const imageItem = Array.from(e.clipboardData?.items || []).find((item) => item.type.startsWith('image/'));
  if (!imageItem) return;
  e.preventDefault();
  const file = imageItem.getAsFile();
  if (file) await importImageFile(file);
}

// ---- 拖放打开（把 Markdown 文件拖到窗口即在新 Tab 中打开） ----

// 与 main.js 的文件关联保持一致：只接受这些扩展名
const MD_EXTS = ['.md', '.markdown', '.txt'];
const IMG_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

function isMarkdownPath(p) {
  const i = p.lastIndexOf('.');
  return i >= 0 && MD_EXTS.includes(p.slice(i).toLowerCase());
}

function isImagePath(p) {
  const i = p.lastIndexOf('.');
  return i >= 0 && IMG_EXTS.includes(p.slice(i).toLowerCase());
}

// 用计数器抵消子元素进出造成的 dragenter/dragleave 抖动
let dragDepth = 0;

function isFileDrag(e) {
  return e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
}

// 捕获阶段处理，抢在 CodeMirror 自身的拖放逻辑之前
window.addEventListener('dragenter', (e) => {
  if (!isFileDrag(e)) return;
  e.preventDefault();
  dragDepth++;
  document.body.classList.add('drag-over');
}, true);

window.addEventListener('dragover', (e) => {
  if (!isFileDrag(e)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}, true);

window.addEventListener('dragleave', (e) => {
  if (!isFileDrag(e)) return;
  if (dragDepth > 0) dragDepth--;
  if (dragDepth === 0) document.body.classList.remove('drag-over');
}, true);

window.addEventListener('drop', async (e) => {
  if (!isFileDrag(e)) return; // 编辑器内的文本拖动交给 CodeMirror
  e.preventDefault();
  e.stopPropagation();
  dragDepth = 0;
  document.body.classList.remove('drag-over');

  let lastIndex = -1;
  for (const file of Array.from(e.dataTransfer.files)) {
    const filePath = window.api.getPathForFile(file);
    if (!filePath) continue;
    if (isMarkdownPath(filePath)) {
      const result = await window.api.readFile(filePath);
      if (result) {
        openInNewTab(result.filePath, result.content, result.format);
        lastIndex = activeIndex;
      }
    } else if (isImagePath(filePath)) {
      await importImageFile(file);
    }
  }
  if (lastIndex >= 0) activateTab(lastIndex);
}, true);

cm.getWrapperElement().addEventListener('paste', pasteImage, true);

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

function doPrint() {
  window.api.print(renderMarkdown(), docName());
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
document.getElementById('btn-print').addEventListener('click', doPrint);
document.getElementById('btn-outline').addEventListener('click', toggleOutline);
document.getElementById('btn-settings').addEventListener('click', openSettings);
viewButtons.edit.addEventListener('click', () => setView('edit'));
viewButtons.split.addEventListener('click', () => setView('split'));
viewButtons.preview.addEventListener('click', () => setView('preview'));
document.getElementById('formatbar').addEventListener('click', (e) => {
  const button = e.target.closest('[data-format]');
  if (button) applyFormat(button.dataset.format);
});
autoSaveToggle.addEventListener('click', () => {
  autoSaveEnabled = !autoSaveEnabled;
  persistEditorSettings();
  autoSaveToggle.setAttribute('aria-pressed', String(autoSaveEnabled));
  if (autoSaveEnabled) scheduleAutoSave(activeTab());
  else {
    autoSaveTimers.forEach((timer) => clearTimeout(timer));
    autoSaveTimers.clear();
  }
});
historyClose.addEventListener('click', closeHistory);
historyModal.addEventListener('click', (e) => { if (e.target === historyModal) closeHistory(); });
settingsClose.addEventListener('click', closeSettings);
settingsCancel.addEventListener('click', closeSettings);
settingsSave.addEventListener('click', saveSettings);
settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) closeSettings(); });
gotoClose.addEventListener('click', closeGoToLine);
gotoCancel.addEventListener('click', closeGoToLine);
gotoSubmit.addEventListener('click', goToLine);
gotoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); goToLine(); }
  else if (e.key === 'Escape') { e.preventDefault(); closeGoToLine(); }
});

window.api.onMenu((action) => {
  ({
    'new': newFile,
    'open': openFile,
    'save': saveFile,
    'save-as': saveFileAs,
    'export-html': doExportHtml,
    'export-pdf': doExportPdf,
    'print': doPrint,
    'undo': () => cm.undo(),
    'redo': () => cm.redo(),
    'find': openFind,
    'replace': openReplace,
    'history': openHistory,
    'settings': openSettings,
    'go-to-line': openGoToLine,
    'cut': cutSelection,
    'copy': copySelection,
    'paste': pasteClipboard,
    'select-all': () => { cm.focus(); cm.execCommand('selectAll'); },
    'view-edit': () => setView('edit'),
    'view-split': () => setView('split'),
    'view-preview': () => setView('preview')
  })[action]?.();
});

// 双击 .md 文件 / 单实例转发过来的文件：在新 Tab 中打开
window.api.onDocLoad(({ filePath, content, format }) => {
  openInNewTab(filePath, content, format);
});

let externalChangeQueue = Promise.resolve();
window.api.onExternalFileChange(({ filePath, content, format }) => {
  externalChangeQueue = externalChangeQueue.then(async () => {
    const index = tabs.findIndex((tab) => tab.filePath === filePath);
    if (index < 0) return;
    const tab = tabs[index];
    tab.format = documentFormat(format);
    tab.missing = false;
    if (content === tab.savedContent) {
      setTabDirty(tab, tab.doc.getValue() !== tab.savedContent);
      scheduleSessionSave();
      return;
    }

    const loadLatest = await showExternalDiff(filePath, tab.doc.getValue(), content);
    tab.missing = false;
    if (loadLatest) {
      tab.savedContent = content;
      tab.doc.setValue(content);
      setTabDirty(tab, false);
      if (tab === activeTab()) {
        render();
        updateStatus();
      }
    } else {
      // 保留编辑器内容，但把新的磁盘内容作为比较基线，使当前版本保持“未保存”状态。
      tab.savedContent = content;
      setTabDirty(tab, tab.doc.getValue() !== content);
    }
    scheduleSessionSave();
  }).catch(() => {});
});

window.api.onExternalFileMissing(({ filePath }) => {
  externalChangeQueue = externalChangeQueue.then(async () => {
    const index = tabs.findIndex((tab) => tab.filePath === filePath);
    if (index < 0) return;
    const tab = tabs[index];
    tab.missing = true;
    setTabDirty(tab, true);
    const action = await window.api.handleMissingFile(filePath, tab.dirty);
    if (action === 'locate') {
      const located = await window.api.locateFile(filePath);
      if (!located) return;
      const loadLocated = located.content === tab.doc.getValue()
        ? true
        : await showExternalDiff(located.filePath, tab.doc.getValue(), located.content);
      tab.filePath = located.filePath;
      tab.format = documentFormat(located.format);
      tab.savedContent = located.content;
      tab.missing = false;
      if (loadLocated) tab.doc.setValue(located.content);
      setTabDirty(tab, tab.doc.getValue() !== located.content);
      if (tab === activeTab()) {
        setDocBaseUrl(tab.filePath);
        render();
        updateStatus();
      }
    } else if (action === 'save-as') {
      activateTab(index);
      await saveFileAs();
    } else if (action === 'close') {
      removeTab(index);
    }
    scheduleSessionSave();
  }).catch(() => {});
});

// 关闭窗口时用户选择了"保存"：逐个保存所有脏 Tab 后再关闭
window.api.onSaveThenClose(async () => {
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].dirty) {
      activateTab(i);
      if (!(await saveFile())) return; // 用户在"另存为"对话框取消，则中止关闭
    }
  }
  await persistSessionNow();
  window.api.closeAfterSave();
});

// 没有未保存修改时，也在真正关窗前等待最后一次会话写入完成。
window.api.onPrepareClose(async () => {
  await persistSessionNow();
  window.api.closeAfterSave();
});

// 用户明确选择“不保存”时丢弃修改，但保留原来的 Tab 布局供下次启动恢复。
window.api.onDiscardThenClose(async () => {
  tabs.forEach((tab) => {
    if (!tab.dirty) return;
    tab.doc.setValue(tab.savedContent);
    tab.dirty = false;
  });
  syncGlobalDirty();
  activateTab(activeIndex);
  await persistSessionNow();
  window.api.closeAfterSave();
});

// ---- 初始化 ----

async function initialize() {
  applyTheme();
  applyEditorSettings();
  if (!(await restorePreviousSession())) newFile();
  setView(editorSettings.defaultView);
  if (localStorage.getItem('outlineVisible') === 'true') toggleOutline();
  applyLang();
  window.api.sessionReady(); // 会话恢复完毕后，主进程才能安全转发双击打开的文件
}

initialize().catch(() => {
  if (tabs.length === 0) newFile();
  applyLang();
  window.api.sessionReady();
});
