// 多语言字典：主进程（菜单/对话框）和渲染进程（界面）共用
const LOCALES = {
  en: {
    name: 'English',
    menu: {
      reopenTab: 'Reopen Closed Tab',
      tabs: 'Tabs', newTab: 'New Tab', nextTab: 'Next Tab', previousTab: 'Previous Tab',
      file: 'File', new: 'New', open: 'Open…', save: 'Save', saveAs: 'Save As…',
      exportHtml: 'Export as HTML…', exportPdf: 'Export as PDF…', quit: 'Quit',
      openRecent: 'Open Recent', clearRecent: 'Clear Recently Opened', noRecent: 'No Recent Files',
      print: 'Print…', history: 'Version History…',
      edit: 'Edit', undo: 'Undo', redo: 'Redo', cut: 'Cut', copy: 'Copy',
      paste: 'Paste', selectAll: 'Select All', find: 'Find…', replace: 'Replace…', goToLine: 'Go to Line…',
      view: 'View', editOnly: 'Editor Only', split: 'Split', previewOnly: 'Preview Only',
      fullscreen: 'Toggle Full Screen', settings: 'Settings…',
      showInFinder: 'Show in Finder', showInExplorer: 'Show in File Explorer', showInFileManager: 'Show in File Manager'
    },
    dialog: {
      unsaved: 'The document has unsaved changes. Save them?',
      save: 'Save', dontSave: "Don't Save", cancel: 'Cancel',
      discard: 'The document has unsaved changes. Discard them?',
      ok: 'OK', openFailed: 'Failed to open file', exportFailed: 'Export failed', saveFailedTitle: 'Save Failed',
      externalChangedTitle: 'File Changed', externalChanged: '“{name}” was changed by another application. Load the latest content?',
      externalChangedDirty: 'Loading will discard your unsaved changes in this tab.', loadLatest: 'Load Latest', keepCurrent: 'Keep Current',
      fileMissingTitle: 'File Missing', fileMissing: '“{name}” was deleted or moved.', fileMissingDirty: 'The editor copy contains unsaved content.',
      locateFile: 'Locate…', closeTab: 'Close Tab', keepOpen: 'Keep Open'
    },
    ui: {
      untitled: 'Untitled', chars: '{n} characters', placeholder: 'Type Markdown here…',
      new: 'New', open: 'Open', save: 'Save', saveAs: 'Save As',
      exportHtml: 'Export HTML', exportPdf: 'Export PDF', print: 'Print',
      edit: 'Editor', split: 'Split', preview: 'Preview',
      language: 'Language', theme: 'Theme', close: 'Close',
      themeSystem: 'System', themeLight: 'Light', themeDark: 'Dark',
      exported: 'Exported to {path}', find: 'Find', findPlaceholder: 'Find in document',
      findPrevious: 'Previous match', findNext: 'Next match', noResults: 'No results', matchCount: '{current} of {total}',
      replace: 'Replace', replacePlaceholder: 'Replace with', replaceAll: 'Replace All', matchCase: 'Match case',
      wholeWord: 'Whole word', useRegex: 'Use regular expression', invalidRegex: 'Invalid pattern',
      bold: 'Bold', italic: 'Italic', strike: 'Strikethrough', heading: 'Heading', quote: 'Quote', code: 'Code',
      link: 'Link', bulletList: 'Bulleted list', numberedList: 'Numbered list', taskList: 'Task list',
      outline: 'Document outline', noHeadings: 'No headings', image: 'Insert image',
      stats: '{words} words · {chars} characters · {lines} lines · Ln {line}, Col {column}', selectedStats: ' · {selected} selected',
      autoSave: 'Auto Save', history: 'Version History', noHistory: 'No previous versions', restoreVersion: 'Restore this version?', restore: 'Restore',
      saved: 'Saved', saveFailed: 'Save failed: {error}', autoSaveFailed: 'Auto save failed: {error}',
      diffTitle: 'File Changed on Disk', currentVersion: 'Current editor content', diskVersion: 'Latest disk content',
      loadLatest: 'Load Latest', keepCurrent: 'Keep Current', settings: 'Settings', lineNumbers: 'Line numbers',
      lineWrapping: 'Line wrapping', tabSize: 'Tab size', fontSize: 'Editor font size', defaultView: 'Default view',
      goToLine: 'Go to Line', lineNumber: 'Line number', go: 'Go'
    }
  },
  zh: {
    name: '简体中文',
    menu: {
      reopenTab: '重新打开已关闭的标签页',
      tabs: '标签页', newTab: '新建标签页', nextTab: '下一个标签页', previousTab: '上一个标签页',
      file: '文件', new: '新建', open: '打开…', save: '保存', saveAs: '另存为…',
      exportHtml: '导出 HTML…', exportPdf: '导出 PDF…', quit: '退出',
      openRecent: '最近打开', clearRecent: '清除最近打开', noRecent: '无最近文件',
      print: '打印…', history: '版本历史…',
      edit: '编辑', undo: '撤销', redo: '重做', cut: '剪切', copy: '复制',
      paste: '粘贴', selectAll: '全选', find: '查找…', replace: '替换…', goToLine: '转到行…',
      view: '视图', editOnly: '仅编辑', split: '分屏', previewOnly: '仅预览',
      fullscreen: '全屏', settings: '设置…',
      showInFinder: '在访达中显示', showInExplorer: '在文件资源管理器中显示', showInFileManager: '在文件管理器中显示'
    },
    dialog: {
      unsaved: '文档尚未保存，是否保存更改？',
      save: '保存', dontSave: '不保存', cancel: '取消',
      discard: '当前文档尚未保存，放弃更改吗？',
      ok: '确定', openFailed: '打开文件失败', exportFailed: '导出失败', saveFailedTitle: '保存失败',
      externalChangedTitle: '文件已修改', externalChanged: '“{name}”已被其他应用修改，是否加载最新内容？',
      externalChangedDirty: '加载后将丢弃此标签页中尚未保存的修改。', loadLatest: '加载最新内容', keepCurrent: '保留当前内容',
      fileMissingTitle: '文件已丢失', fileMissing: '“{name}”已被删除或移动。', fileMissingDirty: '编辑器副本包含尚未保存的内容。',
      locateFile: '重新定位…', closeTab: '关闭标签页', keepOpen: '继续保留'
    },
    ui: {
      untitled: '未命名', chars: '{n} 字', placeholder: '在这里输入 Markdown 内容…',
      new: '新建', open: '打开', save: '保存', saveAs: '另存为',
      exportHtml: '导出 HTML', exportPdf: '导出 PDF', print: '打印',
      edit: '编辑', split: '分屏', preview: '预览',
      language: '语言', theme: '主题', close: '关闭',
      themeSystem: '跟随系统', themeLight: '浅色', themeDark: '深色',
      exported: '已导出到 {path}', find: '查找', findPlaceholder: '在文档中查找',
      findPrevious: '上一个匹配项', findNext: '下一个匹配项', noResults: '无匹配结果', matchCount: '第 {current} 个，共 {total} 个',
      replace: '替换', replacePlaceholder: '替换为', replaceAll: '全部替换', matchCase: '区分大小写',
      wholeWord: '全字匹配', useRegex: '使用正则表达式', invalidRegex: '表达式无效',
      bold: '加粗', italic: '斜体', strike: '删除线', heading: '标题', quote: '引用', code: '代码',
      link: '链接', bulletList: '无序列表', numberedList: '有序列表', taskList: '任务列表',
      outline: '文档大纲', noHeadings: '暂无标题', image: '插入图片',
      stats: '{words} 词 · {chars} 字符 · {lines} 行 · 第 {line} 行，第 {column} 列', selectedStats: ' · 已选 {selected}',
      autoSave: '自动保存', history: '版本历史', noHistory: '暂无历史版本', restoreVersion: '恢复这个版本？', restore: '恢复',
      saved: '已保存', saveFailed: '保存失败：{error}', autoSaveFailed: '自动保存失败：{error}',
      diffTitle: '磁盘文件已修改', currentVersion: '当前编辑内容', diskVersion: '磁盘最新内容',
      loadLatest: '加载最新内容', keepCurrent: '保留当前内容', settings: '设置', lineNumbers: '显示行号',
      lineWrapping: '自动换行', tabSize: 'Tab 宽度', fontSize: '编辑器字号', defaultView: '默认视图',
      goToLine: '转到行', lineNumber: '行号', go: '转到'
    }
  },
  'zh-TW': {
    name: '繁體中文',
    menu: {
      reopenTab: '重新開啟已關閉的分頁',
      tabs: '分頁', newTab: '新增分頁', nextTab: '下一個分頁', previousTab: '上一個分頁',
      file: '檔案', new: '新增', open: '開啟…', save: '儲存', saveAs: '另存新檔…',
      exportHtml: '匯出 HTML…', exportPdf: '匯出 PDF…', quit: '結束',
      openRecent: '開啟最近使用的檔案', clearRecent: '清除最近使用的檔案', noRecent: '沒有最近使用的檔案',
      print: '列印…', history: '版本紀錄…',
      edit: '編輯', undo: '復原', redo: '重做', cut: '剪下', copy: '複製',
      paste: '貼上', selectAll: '全選', find: '尋找…', replace: '取代…', goToLine: '前往行…',
      view: '檢視', editOnly: '僅編輯器', split: '分割檢視', previewOnly: '僅預覽',
      fullscreen: '全螢幕', settings: '設定…',
      showInFinder: '在 Finder 中顯示', showInExplorer: '在檔案總管中顯示', showInFileManager: '在檔案管理員中顯示'
    },
    dialog: {
      unsaved: '文件有尚未儲存的變更。要儲存嗎？',
      save: '儲存', dontSave: '不儲存', cancel: '取消',
      discard: '文件有尚未儲存的變更。要捨棄嗎？',
      ok: '確定', openFailed: '無法開啟檔案', exportFailed: '匯出失敗', saveFailedTitle: '儲存失敗',
      externalChangedTitle: '檔案已變更', externalChanged: '「{name}」已被其他應用程式修改。要載入最新內容嗎？',
      externalChangedDirty: '載入後將捨棄此分頁中尚未儲存的變更。', loadLatest: '載入最新內容', keepCurrent: '保留目前內容',
      fileMissingTitle: '找不到檔案', fileMissing: '「{name}」已被刪除或移動。', fileMissingDirty: '編輯器副本包含尚未儲存的內容。',
      locateFile: '重新定位…', closeTab: '關閉分頁', keepOpen: '保持開啟'
    },
    ui: {
      untitled: '未命名', chars: '{n} 個字元', placeholder: '在這裡輸入 Markdown 內容…',
      new: '新增', open: '開啟', save: '儲存', saveAs: '另存新檔',
      exportHtml: '匯出 HTML', exportPdf: '匯出 PDF', print: '列印',
      edit: '編輯器', split: '分割', preview: '預覽',
      language: '語言', theme: '主題', close: '關閉',
      themeSystem: '跟隨系統', themeLight: '淺色', themeDark: '深色',
      exported: '已匯出至 {path}', find: '尋找', findPlaceholder: '在文件中尋找',
      findPrevious: '上一個相符項目', findNext: '下一個相符項目', noResults: '沒有相符結果', matchCount: '第 {current} 個，共 {total} 個',
      replace: '取代', replacePlaceholder: '取代為', replaceAll: '全部取代', matchCase: '區分大小寫',
      wholeWord: '完整單字', useRegex: '使用規則運算式', invalidRegex: '無效的規則運算式',
      bold: '粗體', italic: '斜體', strike: '刪除線', heading: '標題', quote: '引用', code: '程式碼',
      link: '連結', bulletList: '項目符號清單', numberedList: '編號清單', taskList: '待辦清單',
      outline: '文件大綱', noHeadings: '沒有標題', image: '插入圖片',
      stats: '{words} 個字詞 · {chars} 個字元 · {lines} 行 · 第 {line} 行，第 {column} 欄', selectedStats: ' · 已選取 {selected}',
      autoSave: '自動儲存', history: '版本紀錄', noHistory: '沒有先前版本', restoreVersion: '要恢復這個版本嗎？', restore: '恢復',
      saved: '已儲存', saveFailed: '儲存失敗：{error}', autoSaveFailed: '自動儲存失敗：{error}',
      diffTitle: '磁碟上的檔案已變更', currentVersion: '目前的編輯器內容', diskVersion: '磁碟上的最新內容',
      loadLatest: '載入最新內容', keepCurrent: '保留目前內容', settings: '設定', lineNumbers: '顯示行號',
      lineWrapping: '自動換行', tabSize: 'Tab 寬度', fontSize: '編輯器字型大小', defaultView: '預設檢視',
      goToLine: '前往行', lineNumber: '行號', go: '前往'
    }
  },
  ja: {
    name: '日本語',
    menu: {
      reopenTab: '閉じたタブを開く',
      tabs: 'タブ', newTab: '新しいタブ', nextTab: '次のタブ', previousTab: '前のタブ',
      file: 'ファイル', new: '新規', open: '開く…', save: '保存', saveAs: '名前を付けて保存…',
      exportHtml: 'HTML をエクスポート…', exportPdf: 'PDF をエクスポート…', quit: '終了',
      openRecent: '最近使った項目', clearRecent: '最近使った項目をクリア', noRecent: '最近のファイルなし',
      print: '印刷…', history: 'バージョン履歴…',
      edit: '編集', undo: '元に戻す', redo: 'やり直し', cut: '切り取り', copy: 'コピー',
      paste: '貼り付け', selectAll: 'すべて選択', find: '検索…', replace: '置換…', goToLine: '行へ移動…',
      view: '表示', editOnly: '編集のみ', split: '分割', previewOnly: 'プレビューのみ',
      fullscreen: '全画面表示', settings: '設定…',
      showInFinder: 'Finder に表示', showInExplorer: 'エクスプローラーに表示', showInFileManager: 'ファイルマネージャーに表示'
    },
    dialog: {
      unsaved: '変更が保存されていません。保存しますか？',
      save: '保存', dontSave: '保存しない', cancel: 'キャンセル',
      discard: '変更が保存されていません。破棄しますか？',
      ok: 'OK', openFailed: 'ファイルを開けませんでした', exportFailed: 'エクスポートに失敗しました', saveFailedTitle: '保存に失敗しました',
      externalChangedTitle: 'ファイルが変更されました', externalChanged: '「{name}」が別のアプリで変更されました。最新の内容を読み込みますか？',
      externalChangedDirty: '読み込むと、このタブの未保存の変更は破棄されます。', loadLatest: '最新を読み込む', keepCurrent: '現在の内容を保持',
      fileMissingTitle: 'ファイルが見つかりません', fileMissing: '「{name}」は削除または移動されました。', fileMissingDirty: 'エディターのコピーには未保存の内容があります。',
      locateFile: '場所を指定…', closeTab: 'タブを閉じる', keepOpen: '開いたままにする'
    },
    ui: {
      untitled: '無題', chars: '{n} 文字', placeholder: 'ここに Markdown を入力…',
      new: '新規', open: '開く', save: '保存', saveAs: '名前を付けて保存',
      exportHtml: 'HTML エクスポート', exportPdf: 'PDF エクスポート', print: '印刷',
      edit: '編集', split: '分割', preview: 'プレビュー',
      language: '言語', theme: 'テーマ', close: '閉じる',
      themeSystem: 'システム', themeLight: 'ライト', themeDark: 'ダーク',
      exported: '{path} にエクスポートしました', find: '検索', findPlaceholder: '文書内を検索',
      findPrevious: '前の一致', findNext: '次の一致', noResults: '一致なし', matchCount: '{current} / {total}',
      replace: '置換', replacePlaceholder: '置換後の文字列', replaceAll: 'すべて置換', matchCase: '大文字と小文字を区別',
      wholeWord: '単語単位', useRegex: '正規表現', invalidRegex: '無効なパターン',
      bold: '太字', italic: '斜体', strike: '取り消し線', heading: '見出し', quote: '引用', code: 'コード',
      link: 'リンク', bulletList: '箇条書き', numberedList: '番号付きリスト', taskList: 'タスクリスト',
      outline: '文書アウトライン', noHeadings: '見出しなし', image: '画像を挿入',
      stats: '{words} 語 · {chars} 文字 · {lines} 行 · {line} 行 {column} 列', selectedStats: ' · {selected} 選択',
      autoSave: '自動保存', history: 'バージョン履歴', noHistory: '以前のバージョンなし', restoreVersion: 'このバージョンを復元しますか？', restore: '復元',
      saved: '保存しました', saveFailed: '保存に失敗しました: {error}', autoSaveFailed: '自動保存に失敗しました: {error}',
      diffTitle: 'ディスク上のファイルが変更されました', currentVersion: '現在の編集内容', diskVersion: '最新のディスク内容',
      loadLatest: '最新を読み込む', keepCurrent: '現在の内容を保持', settings: '設定', lineNumbers: '行番号',
      lineWrapping: '行の折り返し', tabSize: 'タブ幅', fontSize: 'エディターの文字サイズ', defaultView: '既定の表示',
      goToLine: '行へ移動', lineNumber: '行番号', go: '移動'
    }
  },
  fr: {
    name: 'Français',
    menu: {
      reopenTab: 'Rouvrir l’onglet fermé',
      tabs: 'Onglets', newTab: 'Nouvel onglet', nextTab: 'Onglet suivant', previousTab: 'Onglet précédent',
      file: 'Fichier', new: 'Nouveau', open: 'Ouvrir…', save: 'Enregistrer', saveAs: 'Enregistrer sous…',
      exportHtml: 'Exporter en HTML…', exportPdf: 'Exporter en PDF…', quit: 'Quitter',
      openRecent: 'Ouvrir un élément récent', clearRecent: 'Effacer les éléments récents', noRecent: 'Aucun fichier récent',
      print: 'Imprimer…', history: 'Historique des versions…',
      edit: 'Édition', undo: 'Annuler', redo: 'Rétablir', cut: 'Couper', copy: 'Copier',
      paste: 'Coller', selectAll: 'Tout sélectionner', find: 'Rechercher…', replace: 'Remplacer…', goToLine: 'Atteindre la ligne…',
      view: 'Affichage', editOnly: 'Éditeur seul', split: 'Partagé', previewOnly: 'Aperçu seul',
      fullscreen: 'Plein écran', settings: 'Paramètres…',
      showInFinder: 'Afficher dans le Finder', showInExplorer: 'Afficher dans l’Explorateur de fichiers',
      showInFileManager: 'Afficher dans le gestionnaire de fichiers'
    },
    dialog: {
      unsaved: 'Le document contient des modifications non enregistrées. Les enregistrer ?',
      save: 'Enregistrer', dontSave: 'Ne pas enregistrer', cancel: 'Annuler',
      discard: 'Le document contient des modifications non enregistrées. Les abandonner ?',
      ok: 'OK', openFailed: "Échec de l'ouverture du fichier", exportFailed: "Échec de l'exportation", saveFailedTitle: "Échec de l'enregistrement",
      externalChangedTitle: 'Fichier modifié', externalChanged: '« {name} » a été modifié par une autre application. Charger la dernière version ?',
      externalChangedDirty: 'Le chargement supprimera les modifications non enregistrées de cet onglet.', loadLatest: 'Charger', keepCurrent: 'Conserver',
      fileMissingTitle: 'Fichier introuvable', fileMissing: '« {name} » a été supprimé ou déplacé.', fileMissingDirty: 'La copie dans l’éditeur contient des modifications.',
      locateFile: 'Localiser…', closeTab: 'Fermer l’onglet', keepOpen: 'Garder ouvert'
    },
    ui: {
      untitled: 'Sans titre', chars: '{n} caractères', placeholder: 'Saisissez du Markdown ici…',
      new: 'Nouveau', open: 'Ouvrir', save: 'Enregistrer', saveAs: 'Enregistrer sous',
      exportHtml: 'Exporter HTML', exportPdf: 'Exporter PDF', print: 'Imprimer',
      edit: 'Éditeur', split: 'Partagé', preview: 'Aperçu',
      language: 'Langue', theme: 'Thème', close: 'Fermer',
      themeSystem: 'Système', themeLight: 'Clair', themeDark: 'Sombre',
      exported: 'Exporté vers {path}', find: 'Rechercher', findPlaceholder: 'Rechercher dans le document',
      findPrevious: 'Résultat précédent', findNext: 'Résultat suivant', noResults: 'Aucun résultat', matchCount: '{current} sur {total}',
      replace: 'Remplacer', replacePlaceholder: 'Remplacer par', replaceAll: 'Tout remplacer', matchCase: 'Respecter la casse',
      wholeWord: 'Mot entier', useRegex: 'Expression régulière', invalidRegex: 'Expression incorrecte',
      bold: 'Gras', italic: 'Italique', strike: 'Barré', heading: 'Titre', quote: 'Citation', code: 'Code',
      link: 'Lien', bulletList: 'Liste à puces', numberedList: 'Liste numérotée', taskList: 'Liste de tâches',
      outline: 'Plan du document', noHeadings: 'Aucun titre', image: 'Insérer une image',
      stats: '{words} mots · {chars} caractères · {lines} lignes · L {line}, C {column}', selectedStats: ' · {selected} sélectionnés',
      autoSave: 'Enregistrement auto', history: 'Historique des versions', noHistory: 'Aucune version précédente', restoreVersion: 'Restaurer cette version ?', restore: 'Restaurer',
      saved: 'Enregistré', saveFailed: 'Échec de l’enregistrement : {error}', autoSaveFailed: 'Échec de l’enregistrement auto : {error}',
      diffTitle: 'Fichier modifié sur le disque', currentVersion: 'Contenu actuel', diskVersion: 'Contenu du disque',
      loadLatest: 'Charger', keepCurrent: 'Conserver', settings: 'Paramètres', lineNumbers: 'Numéros de ligne',
      lineWrapping: 'Retour à la ligne', tabSize: 'Taille des tabulations', fontSize: 'Taille de police', defaultView: 'Vue par défaut',
      goToLine: 'Atteindre la ligne', lineNumber: 'Numéro de ligne', go: 'Atteindre'
    }
  },
  ko: {
    name: '한국어',
    menu: {
      reopenTab: '닫은 탭 다시 열기',
      tabs: '탭', newTab: '새 탭', nextTab: '다음 탭', previousTab: '이전 탭',
      file: '파일', new: '새 문서', open: '열기…', save: '저장', saveAs: '다른 이름으로 저장…',
      exportHtml: 'HTML 내보내기…', exportPdf: 'PDF 내보내기…', quit: '종료',
      openRecent: '최근 항목 열기', clearRecent: '최근 항목 지우기', noRecent: '최근 파일 없음',
      print: '인쇄…', history: '버전 기록…',
      edit: '편집', undo: '실행 취소', redo: '다시 실행', cut: '잘라내기', copy: '복사',
      paste: '붙여넣기', selectAll: '모두 선택', find: '찾기…', replace: '바꾸기…', goToLine: '줄로 이동…',
      view: '보기', editOnly: '편집만', split: '분할', previewOnly: '미리보기만',
      fullscreen: '전체 화면', settings: '설정…',
      showInFinder: 'Finder에서 보기', showInExplorer: '파일 탐색기에서 보기', showInFileManager: '파일 관리자에서 보기'
    },
    dialog: {
      unsaved: '문서에 저장되지 않은 변경 사항이 있습니다. 저장하시겠습니까?',
      save: '저장', dontSave: '저장 안 함', cancel: '취소',
      discard: '저장되지 않은 변경 사항이 있습니다. 변경 사항을 버리시겠습니까?',
      ok: '확인', openFailed: '파일을 열 수 없습니다', exportFailed: '내보내기 실패', saveFailedTitle: '저장 실패',
      externalChangedTitle: '파일 변경됨', externalChanged: '“{name}” 파일이 다른 앱에서 변경되었습니다. 최신 내용을 불러오시겠습니까?',
      externalChangedDirty: '불러오면 이 탭의 저장되지 않은 변경 사항이 삭제됩니다.', loadLatest: '최신 내용 불러오기', keepCurrent: '현재 내용 유지',
      fileMissingTitle: '파일을 찾을 수 없음', fileMissing: '“{name}” 파일이 삭제되었거나 이동되었습니다.', fileMissingDirty: '편집기 사본에 저장되지 않은 내용이 있습니다.',
      locateFile: '파일 찾기…', closeTab: '탭 닫기', keepOpen: '열어 두기'
    },
    ui: {
      untitled: '제목 없음', chars: '{n}자', placeholder: '여기에 Markdown을 입력하세요…',
      new: '새 문서', open: '열기', save: '저장', saveAs: '다른 이름으로 저장',
      exportHtml: 'HTML 내보내기', exportPdf: 'PDF 내보내기', print: '인쇄',
      edit: '편집', split: '분할', preview: '미리보기',
      language: '언어', theme: '테마', close: '닫기',
      themeSystem: '시스템', themeLight: '라이트', themeDark: '다크',
      exported: '{path}(으)로 내보냈습니다', find: '찾기', findPlaceholder: '문서에서 찾기',
      findPrevious: '이전 일치', findNext: '다음 일치', noResults: '결과 없음', matchCount: '{current} / {total}',
      replace: '바꾸기', replacePlaceholder: '바꿀 내용', replaceAll: '모두 바꾸기', matchCase: '대/소문자 구분',
      wholeWord: '단어 단위', useRegex: '정규식 사용', invalidRegex: '잘못된 패턴',
      bold: '굵게', italic: '기울임꼴', strike: '취소선', heading: '제목', quote: '인용', code: '코드',
      link: '링크', bulletList: '글머리 기호', numberedList: '번호 목록', taskList: '작업 목록',
      outline: '문서 개요', noHeadings: '제목 없음', image: '이미지 삽입',
      stats: '{words}단어 · {chars}자 · {lines}줄 · {line}행 {column}열', selectedStats: ' · {selected}자 선택',
      autoSave: '자동 저장', history: '버전 기록', noHistory: '이전 버전 없음', restoreVersion: '이 버전을 복원할까요?', restore: '복원',
      saved: '저장됨', saveFailed: '저장 실패: {error}', autoSaveFailed: '자동 저장 실패: {error}',
      diffTitle: '디스크 파일이 변경됨', currentVersion: '현재 편집 내용', diskVersion: '최신 디스크 내용',
      loadLatest: '최신 내용 불러오기', keepCurrent: '현재 내용 유지', settings: '설정', lineNumbers: '줄 번호',
      lineWrapping: '자동 줄 바꿈', tabSize: '탭 크기', fontSize: '편집기 글꼴 크기', defaultView: '기본 보기',
      goToLine: '줄로 이동', lineNumber: '줄 번호', go: '이동'
    }
  },
  de: {
    name: 'Deutsch',
    menu: {
      reopenTab: 'Geschlossenen Tab wieder öffnen',
      tabs: 'Tabs', newTab: 'Neuer Tab', nextTab: 'Nächster Tab', previousTab: 'Vorheriger Tab',
      file: 'Datei', new: 'Neu', open: 'Öffnen…', save: 'Speichern', saveAs: 'Speichern unter…',
      exportHtml: 'Als HTML exportieren…', exportPdf: 'Als PDF exportieren…', quit: 'Beenden',
      openRecent: 'Zuletzt verwendet öffnen', clearRecent: 'Zuletzt verwendete löschen', noRecent: 'Keine letzten Dateien',
      print: 'Drucken…', history: 'Versionsverlauf…',
      edit: 'Bearbeiten', undo: 'Rückgängig', redo: 'Wiederholen', cut: 'Ausschneiden', copy: 'Kopieren',
      paste: 'Einfügen', selectAll: 'Alles auswählen', find: 'Suchen…', replace: 'Ersetzen…', goToLine: 'Gehe zu Zeile…',
      view: 'Ansicht', editOnly: 'Nur Editor', split: 'Geteilt', previewOnly: 'Nur Vorschau',
      fullscreen: 'Vollbild', settings: 'Einstellungen…',
      showInFinder: 'Im Finder anzeigen', showInExplorer: 'Im Datei-Explorer anzeigen', showInFileManager: 'In der Dateiverwaltung anzeigen'
    },
    dialog: {
      unsaved: 'Das Dokument enthält ungespeicherte Änderungen. Speichern?',
      save: 'Speichern', dontSave: 'Nicht speichern', cancel: 'Abbrechen',
      discard: 'Das Dokument enthält ungespeicherte Änderungen. Verwerfen?',
      ok: 'OK', openFailed: 'Datei konnte nicht geöffnet werden', exportFailed: 'Export fehlgeschlagen', saveFailedTitle: 'Speichern fehlgeschlagen',
      externalChangedTitle: 'Datei geändert', externalChanged: '„{name}“ wurde von einer anderen Anwendung geändert. Neueste Version laden?',
      externalChangedDirty: 'Beim Laden werden ungespeicherte Änderungen in diesem Tab verworfen.', loadLatest: 'Neueste laden', keepCurrent: 'Aktuelle behalten',
      fileMissingTitle: 'Datei fehlt', fileMissing: '„{name}“ wurde gelöscht oder verschoben.', fileMissingDirty: 'Die Editorkopie enthält ungespeicherte Inhalte.',
      locateFile: 'Suchen…', closeTab: 'Tab schließen', keepOpen: 'Geöffnet lassen'
    },
    ui: {
      untitled: 'Unbenannt', chars: '{n} Zeichen', placeholder: 'Markdown hier eingeben…',
      new: 'Neu', open: 'Öffnen', save: 'Speichern', saveAs: 'Speichern unter',
      exportHtml: 'HTML exportieren', exportPdf: 'PDF exportieren', print: 'Drucken',
      edit: 'Editor', split: 'Geteilt', preview: 'Vorschau',
      language: 'Sprache', theme: 'Design', close: 'Schließen',
      themeSystem: 'System', themeLight: 'Hell', themeDark: 'Dunkel',
      exported: 'Exportiert nach {path}', find: 'Suchen', findPlaceholder: 'Im Dokument suchen',
      findPrevious: 'Vorheriger Treffer', findNext: 'Nächster Treffer', noResults: 'Keine Treffer', matchCount: '{current} von {total}',
      replace: 'Ersetzen', replacePlaceholder: 'Ersetzen durch', replaceAll: 'Alle ersetzen', matchCase: 'Groß-/Kleinschreibung',
      wholeWord: 'Ganzes Wort', useRegex: 'Regulärer Ausdruck', invalidRegex: 'Ungültiges Muster',
      bold: 'Fett', italic: 'Kursiv', strike: 'Durchgestrichen', heading: 'Überschrift', quote: 'Zitat', code: 'Code',
      link: 'Link', bulletList: 'Aufzählung', numberedList: 'Nummerierte Liste', taskList: 'Aufgabenliste',
      outline: 'Dokumentgliederung', noHeadings: 'Keine Überschriften', image: 'Bild einfügen',
      stats: '{words} Wörter · {chars} Zeichen · {lines} Zeilen · Z {line}, Sp {column}', selectedStats: ' · {selected} ausgewählt',
      autoSave: 'Automatisch speichern', history: 'Versionsverlauf', noHistory: 'Keine früheren Versionen', restoreVersion: 'Diese Version wiederherstellen?', restore: 'Wiederherstellen',
      saved: 'Gespeichert', saveFailed: 'Speichern fehlgeschlagen: {error}', autoSaveFailed: 'Automatisches Speichern fehlgeschlagen: {error}',
      diffTitle: 'Datei auf dem Datenträger geändert', currentVersion: 'Aktueller Editorinhalt', diskVersion: 'Neuester Dateiinhalt',
      loadLatest: 'Neueste laden', keepCurrent: 'Aktuelle behalten', settings: 'Einstellungen', lineNumbers: 'Zeilennummern',
      lineWrapping: 'Zeilenumbruch', tabSize: 'Tabulatorbreite', fontSize: 'Editor-Schriftgröße', defaultView: 'Standardansicht',
      goToLine: 'Gehe zu Zeile', lineNumber: 'Zeilennummer', go: 'Gehe zu'
    }
  }
};

LOCALES.es = {
  name: 'Español',
  menu: {
    reopenTab: 'Volver a abrir la pestaña cerrada',
    tabs: 'Pestañas', newTab: 'Nueva pestaña', nextTab: 'Pestaña siguiente', previousTab: 'Pestaña anterior',
    file: 'Archivo', new: 'Nuevo', open: 'Abrir…', save: 'Guardar', saveAs: 'Guardar como…',
    exportHtml: 'Exportar como HTML…', exportPdf: 'Exportar como PDF…', quit: 'Salir',
    openRecent: 'Abrir recientes', clearRecent: 'Borrar archivos recientes', noRecent: 'No hay archivos recientes',
    print: 'Imprimir…', history: 'Historial de versiones…', edit: 'Editar', undo: 'Deshacer', redo: 'Rehacer',
    cut: 'Cortar', copy: 'Copiar', paste: 'Pegar', selectAll: 'Seleccionar todo', find: 'Buscar…',
    replace: 'Reemplazar…', goToLine: 'Ir a la línea…', view: 'Ver', editOnly: 'Solo editor',
    split: 'Vista dividida', previewOnly: 'Solo vista previa', fullscreen: 'Pantalla completa', settings: 'Configuración…',
    showInFinder: 'Mostrar en Finder', showInExplorer: 'Mostrar en el Explorador de archivos',
    showInFileManager: 'Mostrar en el gestor de archivos'
  },
  dialog: {
    unsaved: 'Este documento tiene cambios sin guardar. ¿Deseas guardarlos?', save: 'Guardar', dontSave: 'No guardar', cancel: 'Cancelar',
    discard: 'Este documento tiene cambios sin guardar. ¿Deseas descartarlos?', ok: 'Aceptar',
    openFailed: 'No se pudo abrir el archivo', exportFailed: 'Error al exportar', saveFailedTitle: 'Error al guardar',
    externalChangedTitle: 'Archivo modificado', externalChanged: '«{name}» fue modificado por otra aplicación. ¿Cargar el contenido más reciente?',
    externalChangedDirty: 'Al cargar se descartarán los cambios sin guardar de esta pestaña.', loadLatest: 'Cargar última versión', keepCurrent: 'Conservar actual',
    fileMissingTitle: 'Archivo no encontrado', fileMissing: '«{name}» fue eliminado o movido.', fileMissingDirty: 'La copia del editor contiene cambios sin guardar.',
    locateFile: 'Localizar…', closeTab: 'Cerrar pestaña', keepOpen: 'Mantener abierto'
  },
  ui: {
    untitled: 'Sin título', chars: '{n} caracteres', placeholder: 'Escribe Markdown aquí…',
    new: 'Nuevo', open: 'Abrir', save: 'Guardar', saveAs: 'Guardar como', exportHtml: 'Exportar HTML', exportPdf: 'Exportar PDF', print: 'Imprimir',
    edit: 'Editor', split: 'Dividida', preview: 'Vista previa', language: 'Idioma', theme: 'Tema', close: 'Cerrar',
    themeSystem: 'Sistema', themeLight: 'Claro', themeDark: 'Oscuro', exported: 'Exportado a {path}',
    find: 'Buscar', findPlaceholder: 'Buscar en el documento', findPrevious: 'Coincidencia anterior', findNext: 'Coincidencia siguiente', noResults: 'Sin resultados', matchCount: '{current} de {total}',
    replace: 'Reemplazar', replacePlaceholder: 'Reemplazar por', replaceAll: 'Reemplazar todo', matchCase: 'Distinguir mayúsculas', wholeWord: 'Palabras completas', useRegex: 'Expresión regular', invalidRegex: 'Expresión no válida',
    bold: 'Negrita', italic: 'Cursiva', strike: 'Tachado', heading: 'Encabezado', quote: 'Cita', code: 'Código', link: 'Enlace',
    bulletList: 'Lista con viñetas', numberedList: 'Lista numerada', taskList: 'Lista de tareas', outline: 'Esquema del documento', noHeadings: 'Sin encabezados', image: 'Insertar imagen',
    stats: '{words} palabras · {chars} caracteres · {lines} líneas · Lín. {line}, Col. {column}', selectedStats: ' · {selected} seleccionados',
    autoSave: 'Guardado automático', history: 'Historial de versiones', noHistory: 'No hay versiones anteriores', restoreVersion: '¿Restaurar esta versión?', restore: 'Restaurar',
    saved: 'Guardado', saveFailed: 'Error al guardar: {error}', autoSaveFailed: 'Error de guardado automático: {error}',
    diffTitle: 'El archivo del disco ha cambiado', currentVersion: 'Contenido actual del editor', diskVersion: 'Contenido más reciente del archivo',
    loadLatest: 'Cargar última versión', keepCurrent: 'Conservar actual', settings: 'Configuración', lineNumbers: 'Números de línea',
    lineWrapping: 'Ajuste de línea', tabSize: 'Tamaño de tabulación', fontSize: 'Tamaño de fuente del editor', defaultView: 'Vista predeterminada',
    goToLine: 'Ir a la línea', lineNumber: 'Número de línea', go: 'Ir'
  }
};

LOCALES['pt-BR'] = {
  name: 'Português (Brasil)',
  menu: {
    reopenTab: 'Reabrir aba fechada',
    tabs: 'Abas', newTab: 'Nova aba', nextTab: 'Próxima aba', previousTab: 'Aba anterior',
    file: 'Arquivo', new: 'Novo', open: 'Abrir…', save: 'Salvar', saveAs: 'Salvar como…',
    exportHtml: 'Exportar como HTML…', exportPdf: 'Exportar como PDF…', quit: 'Sair',
    openRecent: 'Abrir recentes', clearRecent: 'Limpar arquivos recentes', noRecent: 'Nenhum arquivo recente',
    print: 'Imprimir…', history: 'Histórico de versões…', edit: 'Editar', undo: 'Desfazer', redo: 'Refazer',
    cut: 'Recortar', copy: 'Copiar', paste: 'Colar', selectAll: 'Selecionar tudo', find: 'Localizar…',
    replace: 'Substituir…', goToLine: 'Ir para a linha…', view: 'Exibir', editOnly: 'Somente editor',
    split: 'Dividido', previewOnly: 'Somente visualização', fullscreen: 'Tela cheia', settings: 'Configurações…',
    showInFinder: 'Mostrar no Finder', showInExplorer: 'Mostrar no Explorador de Arquivos',
    showInFileManager: 'Mostrar no gerenciador de arquivos'
  },
  dialog: {
    unsaved: 'O documento tem alterações não salvas. Deseja salvá-las?', save: 'Salvar', dontSave: 'Não salvar', cancel: 'Cancelar',
    discard: 'O documento tem alterações não salvas. Deseja descartá-las?', ok: 'OK',
    openFailed: 'Falha ao abrir o arquivo', exportFailed: 'Falha ao exportar', saveFailedTitle: 'Falha ao salvar',
    externalChangedTitle: 'Arquivo alterado', externalChanged: '“{name}” foi alterado por outro aplicativo. Carregar o conteúdo mais recente?',
    externalChangedDirty: 'O carregamento descartará as alterações não salvas desta aba.', loadLatest: 'Carregar versão mais recente', keepCurrent: 'Manter atual',
    fileMissingTitle: 'Arquivo não encontrado', fileMissing: '“{name}” foi excluído ou movido.', fileMissingDirty: 'A cópia no editor contém alterações não salvas.',
    locateFile: 'Localizar…', closeTab: 'Fechar aba', keepOpen: 'Manter aberto'
  },
  ui: {
    untitled: 'Sem título', chars: '{n} caracteres', placeholder: 'Digite Markdown aqui…',
    new: 'Novo', open: 'Abrir', save: 'Salvar', saveAs: 'Salvar como', exportHtml: 'Exportar HTML', exportPdf: 'Exportar PDF', print: 'Imprimir',
    edit: 'Editor', split: 'Dividido', preview: 'Visualização', language: 'Idioma', theme: 'Tema', close: 'Fechar',
    themeSystem: 'Sistema', themeLight: 'Claro', themeDark: 'Escuro', exported: 'Exportado para {path}',
    find: 'Localizar', findPlaceholder: 'Localizar no documento', findPrevious: 'Correspondência anterior', findNext: 'Próxima correspondência', noResults: 'Nenhum resultado', matchCount: '{current} de {total}',
    replace: 'Substituir', replacePlaceholder: 'Substituir por', replaceAll: 'Substituir tudo', matchCase: 'Diferenciar maiúsculas', wholeWord: 'Palavra inteira', useRegex: 'Expressão regular', invalidRegex: 'Expressão inválida',
    bold: 'Negrito', italic: 'Itálico', strike: 'Tachado', heading: 'Título', quote: 'Citação', code: 'Código', link: 'Link',
    bulletList: 'Lista com marcadores', numberedList: 'Lista numerada', taskList: 'Lista de tarefas', outline: 'Estrutura do documento', noHeadings: 'Nenhum título', image: 'Inserir imagem',
    stats: '{words} palavras · {chars} caracteres · {lines} linhas · Lin. {line}, Col. {column}', selectedStats: ' · {selected} selecionados',
    autoSave: 'Salvamento automático', history: 'Histórico de versões', noHistory: 'Nenhuma versão anterior', restoreVersion: 'Restaurar esta versão?', restore: 'Restaurar',
    saved: 'Salvo', saveFailed: 'Falha ao salvar: {error}', autoSaveFailed: 'Falha no salvamento automático: {error}',
    diffTitle: 'O arquivo no disco foi alterado', currentVersion: 'Conteúdo atual do editor', diskVersion: 'Conteúdo mais recente do arquivo',
    loadLatest: 'Carregar versão mais recente', keepCurrent: 'Manter atual', settings: 'Configurações', lineNumbers: 'Números de linha',
    lineWrapping: 'Quebra de linha', tabSize: 'Tamanho da tabulação', fontSize: 'Tamanho da fonte do editor', defaultView: 'Visualização padrão',
    goToLine: 'Ir para a linha', lineNumber: 'Número da linha', go: 'Ir'
  }
};

LOCALES.ru = {
  name: 'Русский',
  menu: {
    reopenTab: 'Открыть закрытую вкладку',
    tabs: 'Вкладки', newTab: 'Новая вкладка', nextTab: 'Следующая вкладка', previousTab: 'Предыдущая вкладка',
    file: 'Файл', new: 'Создать', open: 'Открыть…', save: 'Сохранить', saveAs: 'Сохранить как…',
    exportHtml: 'Экспортировать в HTML…', exportPdf: 'Экспортировать в PDF…', quit: 'Выход',
    openRecent: 'Открыть недавние', clearRecent: 'Очистить список недавних', noRecent: 'Нет недавних файлов',
    print: 'Печать…', history: 'История версий…', edit: 'Правка', undo: 'Отменить', redo: 'Повторить',
    cut: 'Вырезать', copy: 'Копировать', paste: 'Вставить', selectAll: 'Выделить всё', find: 'Найти…',
    replace: 'Заменить…', goToLine: 'Перейти к строке…', view: 'Вид', editOnly: 'Только редактор',
    split: 'Разделённый вид', previewOnly: 'Только предпросмотр', fullscreen: 'Полноэкранный режим', settings: 'Настройки…',
    showInFinder: 'Показать в Finder', showInExplorer: 'Показать в Проводнике', showInFileManager: 'Показать в файловом менеджере'
  },
  dialog: {
    unsaved: 'В документе есть несохранённые изменения. Сохранить их?', save: 'Сохранить', dontSave: 'Не сохранять', cancel: 'Отмена',
    discard: 'В документе есть несохранённые изменения. Отменить их?', ok: 'ОК',
    openFailed: 'Не удалось открыть файл', exportFailed: 'Ошибка экспорта', saveFailedTitle: 'Ошибка сохранения',
    externalChangedTitle: 'Файл изменён', externalChanged: 'Файл «{name}» изменён другим приложением. Загрузить последнюю версию?',
    externalChangedDirty: 'При загрузке несохранённые изменения в этой вкладке будут потеряны.', loadLatest: 'Загрузить последнюю версию', keepCurrent: 'Оставить текущую',
    fileMissingTitle: 'Файл отсутствует', fileMissing: 'Файл «{name}» удалён или перемещён.', fileMissingDirty: 'Копия в редакторе содержит несохранённые данные.',
    locateFile: 'Найти…', closeTab: 'Закрыть вкладку', keepOpen: 'Оставить открытым'
  },
  ui: {
    untitled: 'Без названия', chars: '{n} символов', placeholder: 'Введите Markdown здесь…',
    new: 'Создать', open: 'Открыть', save: 'Сохранить', saveAs: 'Сохранить как', exportHtml: 'Экспорт HTML', exportPdf: 'Экспорт PDF', print: 'Печать',
    edit: 'Редактор', split: 'Разделённый вид', preview: 'Предпросмотр', language: 'Язык', theme: 'Тема', close: 'Закрыть',
    themeSystem: 'Системная', themeLight: 'Светлая', themeDark: 'Тёмная', exported: 'Экспортировано в {path}',
    find: 'Найти', findPlaceholder: 'Найти в документе', findPrevious: 'Предыдущее совпадение', findNext: 'Следующее совпадение', noResults: 'Совпадений нет', matchCount: '{current} из {total}',
    replace: 'Заменить', replacePlaceholder: 'Заменить на', replaceAll: 'Заменить всё', matchCase: 'Учитывать регистр', wholeWord: 'Только целые слова', useRegex: 'Регулярное выражение', invalidRegex: 'Недопустимое выражение',
    bold: 'Полужирный', italic: 'Курсив', strike: 'Зачёркнутый', heading: 'Заголовок', quote: 'Цитата', code: 'Код', link: 'Ссылка',
    bulletList: 'Маркированный список', numberedList: 'Нумерованный список', taskList: 'Список задач', outline: 'Структура документа', noHeadings: 'Нет заголовков', image: 'Вставить изображение',
    stats: '{words} слов · {chars} символов · {lines} строк · Стр. {line}, стлб. {column}', selectedStats: ' · выделено: {selected}',
    autoSave: 'Автосохранение', history: 'История версий', noHistory: 'Нет предыдущих версий', restoreVersion: 'Восстановить эту версию?', restore: 'Восстановить',
    saved: 'Сохранено', saveFailed: 'Ошибка сохранения: {error}', autoSaveFailed: 'Ошибка автосохранения: {error}',
    diffTitle: 'Файл на диске изменён', currentVersion: 'Текущее содержимое редактора', diskVersion: 'Последнее содержимое файла',
    loadLatest: 'Загрузить последнюю версию', keepCurrent: 'Оставить текущую', settings: 'Настройки', lineNumbers: 'Номера строк',
    lineWrapping: 'Перенос строк', tabSize: 'Размер табуляции', fontSize: 'Размер шрифта редактора', defaultView: 'Вид по умолчанию',
    goToLine: 'Перейти к строке', lineNumber: 'Номер строки', go: 'Перейти'
  }
};

LOCALES.it = {
  name: 'Italiano',
  menu: {
    reopenTab: 'Riapri scheda chiusa',
    tabs: 'Schede', newTab: 'Nuova scheda', nextTab: 'Scheda successiva', previousTab: 'Scheda precedente',
    file: 'File', new: 'Nuovo', open: 'Apri…', save: 'Salva', saveAs: 'Salva con nome…',
    exportHtml: 'Esporta come HTML…', exportPdf: 'Esporta come PDF…', quit: 'Esci',
    openRecent: 'Apri recenti', clearRecent: 'Cancella file recenti', noRecent: 'Nessun file recente',
    print: 'Stampa…', history: 'Cronologia versioni…', edit: 'Modifica', undo: 'Annulla', redo: 'Ripristina',
    cut: 'Taglia', copy: 'Copia', paste: 'Incolla', selectAll: 'Seleziona tutto', find: 'Trova…',
    replace: 'Sostituisci…', goToLine: 'Vai alla riga…', view: 'Visualizza', editOnly: 'Solo editor',
    split: 'Vista divisa', previewOnly: 'Solo anteprima', fullscreen: 'Schermo intero', settings: 'Impostazioni…',
    showInFinder: 'Mostra nel Finder', showInExplorer: 'Mostra in Esplora file', showInFileManager: 'Mostra nel gestore file'
  },
  dialog: {
    unsaved: 'Il documento contiene modifiche non salvate. Salvarle?', save: 'Salva', dontSave: 'Non salvare', cancel: 'Annulla',
    discard: 'Il documento contiene modifiche non salvate. Scartarle?', ok: 'OK',
    openFailed: 'Impossibile aprire il file', exportFailed: 'Esportazione non riuscita', saveFailedTitle: 'Salvataggio non riuscito',
    externalChangedTitle: 'File modificato', externalChanged: '“{name}” è stato modificato da un’altra applicazione. Caricare il contenuto più recente?',
    externalChangedDirty: 'Il caricamento eliminerà le modifiche non salvate in questa scheda.', loadLatest: 'Carica ultima versione', keepCurrent: 'Mantieni attuale',
    fileMissingTitle: 'File non trovato', fileMissing: '“{name}” è stato eliminato o spostato.', fileMissingDirty: 'La copia nell’editor contiene modifiche non salvate.',
    locateFile: 'Individua…', closeTab: 'Chiudi scheda', keepOpen: 'Mantieni aperto'
  },
  ui: {
    untitled: 'Senza titolo', chars: '{n} caratteri', placeholder: 'Scrivi Markdown qui…',
    new: 'Nuovo', open: 'Apri', save: 'Salva', saveAs: 'Salva con nome', exportHtml: 'Esporta HTML', exportPdf: 'Esporta PDF', print: 'Stampa',
    edit: 'Editor', split: 'Divisa', preview: 'Anteprima', language: 'Lingua', theme: 'Tema', close: 'Chiudi',
    themeSystem: 'Sistema', themeLight: 'Chiaro', themeDark: 'Scuro', exported: 'Esportato in {path}',
    find: 'Trova', findPlaceholder: 'Trova nel documento', findPrevious: 'Corrispondenza precedente', findNext: 'Corrispondenza successiva', noResults: 'Nessun risultato', matchCount: '{current} di {total}',
    replace: 'Sostituisci', replacePlaceholder: 'Sostituisci con', replaceAll: 'Sostituisci tutto', matchCase: 'Maiuscole/minuscole', wholeWord: 'Parola intera', useRegex: 'Espressione regolare', invalidRegex: 'Espressione non valida',
    bold: 'Grassetto', italic: 'Corsivo', strike: 'Barrato', heading: 'Titolo', quote: 'Citazione', code: 'Codice', link: 'Collegamento',
    bulletList: 'Elenco puntato', numberedList: 'Elenco numerato', taskList: 'Elenco attività', outline: 'Struttura del documento', noHeadings: 'Nessun titolo', image: 'Inserisci immagine',
    stats: '{words} parole · {chars} caratteri · {lines} righe · Riga {line}, Col. {column}', selectedStats: ' · {selected} selezionati',
    autoSave: 'Salvataggio automatico', history: 'Cronologia versioni', noHistory: 'Nessuna versione precedente', restoreVersion: 'Ripristinare questa versione?', restore: 'Ripristina',
    saved: 'Salvato', saveFailed: 'Salvataggio non riuscito: {error}', autoSaveFailed: 'Salvataggio automatico non riuscito: {error}',
    diffTitle: 'Il file sul disco è stato modificato', currentVersion: 'Contenuto attuale dell’editor', diskVersion: 'Contenuto più recente del file',
    loadLatest: 'Carica ultima versione', keepCurrent: 'Mantieni attuale', settings: 'Impostazioni', lineNumbers: 'Numeri di riga',
    lineWrapping: 'A capo automatico', tabSize: 'Dimensione tabulazione', fontSize: 'Dimensione carattere editor', defaultView: 'Vista predefinita',
    goToLine: 'Vai alla riga', lineNumber: 'Numero di riga', go: 'Vai'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LOCALES;
}
