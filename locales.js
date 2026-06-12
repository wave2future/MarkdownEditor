// 多语言字典：主进程（菜单/对话框）和渲染进程（界面）共用
const LOCALES = {
  en: {
    name: 'English',
    menu: {
      file: 'File', new: 'New', open: 'Open…', save: 'Save', saveAs: 'Save As…',
      exportHtml: 'Export as HTML…', exportPdf: 'Export as PDF…', quit: 'Quit',
      edit: 'Edit', undo: 'Undo', redo: 'Redo', cut: 'Cut', copy: 'Copy',
      paste: 'Paste', selectAll: 'Select All',
      view: 'View', editOnly: 'Editor Only', split: 'Split', previewOnly: 'Preview Only',
      fullscreen: 'Toggle Full Screen'
    },
    dialog: {
      unsaved: 'The document has unsaved changes. Save them?',
      save: 'Save', dontSave: "Don't Save", cancel: 'Cancel',
      discard: 'The document has unsaved changes. Discard them?',
      ok: 'OK', openFailed: 'Failed to open file', exportFailed: 'Export failed'
    },
    ui: {
      untitled: 'Untitled', chars: '{n} characters', placeholder: 'Type Markdown here…',
      new: 'New', open: 'Open', save: 'Save', saveAs: 'Save As',
      exportHtml: 'Export HTML', exportPdf: 'Export PDF',
      edit: 'Editor', split: 'Split', preview: 'Preview',
      language: 'Language', theme: 'Theme',
      themeSystem: 'System', themeLight: 'Light', themeDark: 'Dark',
      exported: 'Exported to {path}'
    }
  },
  zh: {
    name: '中文',
    menu: {
      file: '文件', new: '新建', open: '打开…', save: '保存', saveAs: '另存为…',
      exportHtml: '导出 HTML…', exportPdf: '导出 PDF…', quit: '退出',
      edit: '编辑', undo: '撤销', redo: '重做', cut: '剪切', copy: '复制',
      paste: '粘贴', selectAll: '全选',
      view: '视图', editOnly: '仅编辑', split: '分屏', previewOnly: '仅预览',
      fullscreen: '全屏'
    },
    dialog: {
      unsaved: '文档尚未保存，是否保存更改？',
      save: '保存', dontSave: '不保存', cancel: '取消',
      discard: '当前文档尚未保存，放弃更改吗？',
      ok: '确定', openFailed: '打开文件失败', exportFailed: '导出失败'
    },
    ui: {
      untitled: '未命名', chars: '{n} 字', placeholder: '在这里输入 Markdown 内容…',
      new: '新建', open: '打开', save: '保存', saveAs: '另存为',
      exportHtml: '导出 HTML', exportPdf: '导出 PDF',
      edit: '编辑', split: '分屏', preview: '预览',
      language: '语言', theme: '主题',
      themeSystem: '跟随系统', themeLight: '浅色', themeDark: '深色',
      exported: '已导出到 {path}'
    }
  },
  ja: {
    name: '日本語',
    menu: {
      file: 'ファイル', new: '新規', open: '開く…', save: '保存', saveAs: '名前を付けて保存…',
      exportHtml: 'HTML をエクスポート…', exportPdf: 'PDF をエクスポート…', quit: '終了',
      edit: '編集', undo: '元に戻す', redo: 'やり直し', cut: '切り取り', copy: 'コピー',
      paste: '貼り付け', selectAll: 'すべて選択',
      view: '表示', editOnly: '編集のみ', split: '分割', previewOnly: 'プレビューのみ',
      fullscreen: '全画面表示'
    },
    dialog: {
      unsaved: '変更が保存されていません。保存しますか？',
      save: '保存', dontSave: '保存しない', cancel: 'キャンセル',
      discard: '変更が保存されていません。破棄しますか？',
      ok: 'OK', openFailed: 'ファイルを開けませんでした', exportFailed: 'エクスポートに失敗しました'
    },
    ui: {
      untitled: '無題', chars: '{n} 文字', placeholder: 'ここに Markdown を入力…',
      new: '新規', open: '開く', save: '保存', saveAs: '名前を付けて保存',
      exportHtml: 'HTML エクスポート', exportPdf: 'PDF エクスポート',
      edit: '編集', split: '分割', preview: 'プレビュー',
      language: '言語', theme: 'テーマ',
      themeSystem: 'システム', themeLight: 'ライト', themeDark: 'ダーク',
      exported: '{path} にエクスポートしました'
    }
  },
  fr: {
    name: 'Français',
    menu: {
      file: 'Fichier', new: 'Nouveau', open: 'Ouvrir…', save: 'Enregistrer', saveAs: 'Enregistrer sous…',
      exportHtml: 'Exporter en HTML…', exportPdf: 'Exporter en PDF…', quit: 'Quitter',
      edit: 'Édition', undo: 'Annuler', redo: 'Rétablir', cut: 'Couper', copy: 'Copier',
      paste: 'Coller', selectAll: 'Tout sélectionner',
      view: 'Affichage', editOnly: 'Éditeur seul', split: 'Partagé', previewOnly: 'Aperçu seul',
      fullscreen: 'Plein écran'
    },
    dialog: {
      unsaved: 'Le document contient des modifications non enregistrées. Les enregistrer ?',
      save: 'Enregistrer', dontSave: 'Ne pas enregistrer', cancel: 'Annuler',
      discard: 'Le document contient des modifications non enregistrées. Les abandonner ?',
      ok: 'OK', openFailed: "Échec de l'ouverture du fichier", exportFailed: "Échec de l'exportation"
    },
    ui: {
      untitled: 'Sans titre', chars: '{n} caractères', placeholder: 'Saisissez du Markdown ici…',
      new: 'Nouveau', open: 'Ouvrir', save: 'Enregistrer', saveAs: 'Enregistrer sous',
      exportHtml: 'Exporter HTML', exportPdf: 'Exporter PDF',
      edit: 'Éditeur', split: 'Partagé', preview: 'Aperçu',
      language: 'Langue', theme: 'Thème',
      themeSystem: 'Système', themeLight: 'Clair', themeDark: 'Sombre',
      exported: 'Exporté vers {path}'
    }
  },
  ko: {
    name: '한국어',
    menu: {
      file: '파일', new: '새 문서', open: '열기…', save: '저장', saveAs: '다른 이름으로 저장…',
      exportHtml: 'HTML 내보내기…', exportPdf: 'PDF 내보내기…', quit: '종료',
      edit: '편집', undo: '실행 취소', redo: '다시 실행', cut: '잘라내기', copy: '복사',
      paste: '붙여넣기', selectAll: '모두 선택',
      view: '보기', editOnly: '편집만', split: '분할', previewOnly: '미리보기만',
      fullscreen: '전체 화면'
    },
    dialog: {
      unsaved: '문서에 저장되지 않은 변경 사항이 있습니다. 저장하시겠습니까?',
      save: '저장', dontSave: '저장 안 함', cancel: '취소',
      discard: '저장되지 않은 변경 사항이 있습니다. 변경 사항을 버리시겠습니까?',
      ok: '확인', openFailed: '파일을 열 수 없습니다', exportFailed: '내보내기 실패'
    },
    ui: {
      untitled: '제목 없음', chars: '{n}자', placeholder: '여기에 Markdown을 입력하세요…',
      new: '새 문서', open: '열기', save: '저장', saveAs: '다른 이름으로 저장',
      exportHtml: 'HTML 내보내기', exportPdf: 'PDF 내보내기',
      edit: '편집', split: '분할', preview: '미리보기',
      language: '언어', theme: '테마',
      themeSystem: '시스템', themeLight: '라이트', themeDark: '다크',
      exported: '{path}(으)로 내보냈습니다'
    }
  },
  de: {
    name: 'Deutsch',
    menu: {
      file: 'Datei', new: 'Neu', open: 'Öffnen…', save: 'Speichern', saveAs: 'Speichern unter…',
      exportHtml: 'Als HTML exportieren…', exportPdf: 'Als PDF exportieren…', quit: 'Beenden',
      edit: 'Bearbeiten', undo: 'Rückgängig', redo: 'Wiederholen', cut: 'Ausschneiden', copy: 'Kopieren',
      paste: 'Einfügen', selectAll: 'Alles auswählen',
      view: 'Ansicht', editOnly: 'Nur Editor', split: 'Geteilt', previewOnly: 'Nur Vorschau',
      fullscreen: 'Vollbild'
    },
    dialog: {
      unsaved: 'Das Dokument enthält ungespeicherte Änderungen. Speichern?',
      save: 'Speichern', dontSave: 'Nicht speichern', cancel: 'Abbrechen',
      discard: 'Das Dokument enthält ungespeicherte Änderungen. Verwerfen?',
      ok: 'OK', openFailed: 'Datei konnte nicht geöffnet werden', exportFailed: 'Export fehlgeschlagen'
    },
    ui: {
      untitled: 'Unbenannt', chars: '{n} Zeichen', placeholder: 'Markdown hier eingeben…',
      new: 'Neu', open: 'Öffnen', save: 'Speichern', saveAs: 'Speichern unter',
      exportHtml: 'HTML exportieren', exportPdf: 'PDF exportieren',
      edit: 'Editor', split: 'Geteilt', preview: 'Vorschau',
      language: 'Sprache', theme: 'Design',
      themeSystem: 'System', themeLight: 'Hell', themeDark: 'Dunkel',
      exported: 'Exportiert nach {path}'
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LOCALES;
}
