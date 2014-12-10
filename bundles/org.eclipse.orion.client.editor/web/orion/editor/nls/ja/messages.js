/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: 
 *		Felipe Heidrich (IBM Corporation) - initial API and implementation
 *		Silenio Quarti (IBM Corporation) - initial API and implementation
 ******************************************************************************/

//NLS_CHARSET=UTF-8

/*eslint-env browser, amd*/

define({
	"multipleAnnotations": "複数の注釈:", //$NON-NLS-1$ //$NON-NLS-0$
	"line": "行: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"breakpoint": "ブレークポイント", //$NON-NLS-1$ //$NON-NLS-0$
	"bookmark": "ブックマーク", //$NON-NLS-1$ //$NON-NLS-0$
	"task": "タスク", //$NON-NLS-1$ //$NON-NLS-0$
	"error": "エラー", //$NON-NLS-1$ //$NON-NLS-0$
	"warning": "警告", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingSearch": "一致検索", //$NON-NLS-1$ //$NON-NLS-0$
	"currentSearch": "現行検索", //$NON-NLS-1$ //$NON-NLS-0$
	"currentLine": "現在行", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingBracket": "対応する大括弧", //$NON-NLS-1$ //$NON-NLS-0$
	"currentBracket": "現行大括弧", //$NON-NLS-1$ //$NON-NLS-0$
	
	"lineUp": "1 行上へ", //$NON-NLS-1$ //$NON-NLS-0$
	"lineDown": "1 行下へ", //$NON-NLS-1$ //$NON-NLS-0$
	"lineStart": "行の先頭", //$NON-NLS-1$ //$NON-NLS-0$
	"lineEnd": "行の末尾", //$NON-NLS-1$ //$NON-NLS-0$
	"charPrevious": "前の文字", //$NON-NLS-1$ //$NON-NLS-0$
	"charNext": "次の文字", //$NON-NLS-1$ //$NON-NLS-0$
	"pageUp": "Page Up", //$NON-NLS-1$ //$NON-NLS-0$
	"pageDown": "Page Down", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageUp": "ページのスクロールアップ", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageDown": "ページのスクロールダウン", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineUp": "行のスクロールアップ", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineDown": "行のスクロールダウン", //$NON-NLS-1$ //$NON-NLS-0$
	"wordPrevious": "前の単語", //$NON-NLS-1$ //$NON-NLS-0$
	"wordNext": "次の単語", //$NON-NLS-1$ //$NON-NLS-0$
	"textStart": "文書の開始", //$NON-NLS-1$ //$NON-NLS-0$
	"textEnd": "文書の終了", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextStart": "文書の開始のスクロール", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextEnd": "文書の終了のスクロール", //$NON-NLS-1$ //$NON-NLS-0$
	"centerLine": "中心線", //$NON-NLS-1$ //$NON-NLS-0$
	
	"selectLineUp": "行を上に選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineDown": "行を下に選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineUp": " 行の全体を上に選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineDown": "行の全体を下に選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineStart": "行の先頭まで選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineEnd": "行の末尾まで選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharPrevious": "前の文字を選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharNext": "次の文字を選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageUp": "ページの上部まで選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageDown": "ページの下部まで選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordPrevious": "前の単語を選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordNext": "次の単語を選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextStart": "文書の開始の選択", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextEnd": "文書の終了の選択", //$NON-NLS-1$ //$NON-NLS-0$

	"deletePrevious": "前の文字を削除", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteNext": "次の文字を削除", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordPrevious": "前の単語を削除", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordNext": "次の単語を削除", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineStart": "行の先頭まで削除", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineEnd": "行の末尾まで削除", //$NON-NLS-1$ //$NON-NLS-0$
	"tab": "タブを挿入", //$NON-NLS-1$ //$NON-NLS-0$
	"enter": "行区切り文字を挿入", //$NON-NLS-1$ //$NON-NLS-0$
	"enterNoCursor": "行区切り文字を挿入", //$NON-NLS-1$ //$NON-NLS-0$
	"selectAll": "すべて選択", //$NON-NLS-1$ //$NON-NLS-0$
	"copy": "コピー", //$NON-NLS-1$ //$NON-NLS-0$
	"cut": "切り取り", //$NON-NLS-1$ //$NON-NLS-0$
	"paste": "貼り付け", //$NON-NLS-1$ //$NON-NLS-0$
	
	"uppercase": "大文字に変更", //$NON-NLS-1$ //$NON-NLS-0$
	"lowercase": "小文字に変更", //$NON-NLS-1$ //$NON-NLS-0$
	"capitalize": "先頭文字のみ大文字", //$NON-NLS-1$ //$NON-NLS-0$
	"reversecase" : "大文字/小文字を反転", //$NON-NLS-1$ //$NON-NLS-0$
	
	"toggleWrapMode": "折り返しモードの切り替え", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleTabMode": "タブ・モードの切り替え", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleOverwriteMode": "上書きモードの切り替え", //$NON-NLS-1$ //$NON-NLS-0$
	
	"committerOnTime": "${0} (時刻: ${1})", //$NON-NLS-1$ //$NON-NLS-0$
	
	//Emacs
	"emacs": "Emacs", //$NON-NLS-1$ //$NON-NLS-0$
	"exchangeMarkPoint": "マークとポイントの交換", //$NON-NLS-1$ //$NON-NLS-0$
	"setMarkCommand": "マークの設定", //$NON-NLS-1$ //$NON-NLS-0$
	"clearMark": "マークのクリア", //$NON-NLS-1$ //$NON-NLS-0$
	"digitArgument": "数字の引数 ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"negativeArgument": "負の引数", //$NON-NLS-1$ //$NON-NLS-0$
			
	"Comment": "コメント", //$NON-NLS-1$ //$NON-NLS-0$
	"Flat outline": "フラット・アウトライン", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStr": "インクリメンタル検索: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStrNotFound": "インクリメンタル検索: ${0} (未検出)", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStr": "逆方向のインクリメンタル検索: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStrNotFound": "逆方向のインクリメンタル検索: ${0} (見つかりません)", //$NON-NLS-1$ //$NON-NLS-0$
	"find": "検索...", //$NON-NLS-1$ //$NON-NLS-0$
	"undo": "元に戻す", //$NON-NLS-1$ //$NON-NLS-0$
	"redo": "やり直し", //$NON-NLS-1$ //$NON-NLS-0$
	"cancelMode": "現行モードのキャンセル", //$NON-NLS-1$ //$NON-NLS-0$
	"findNext": "次のオカレンスの検索", //$NON-NLS-1$ //$NON-NLS-0$
	"findPrevious": "前のオカレンスの検索", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFind": "インクリメンタル検索", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverse": "逆インクリメンタル検索", //$NON-NLS-1$ //$NON-NLS-0$
	"indentLines": "行のインデント", //$NON-NLS-1$ //$NON-NLS-0$
	"unindentLines": "行のインデントを解除", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesUp": "行を上へ移動", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesDown": "行を下へ移動", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesUp": "行を上へコピー", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesDown": "行を下へコピー", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLines": "行削除", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "行への移動...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompty": "移動先の行:", //$NON-NLS-1$ //$NON-NLS-0$
	"nextAnnotation": "次の注釈", //$NON-NLS-1$ //$NON-NLS-0$
	"prevAnnotation": "前の注釈", //$NON-NLS-1$ //$NON-NLS-0$
	"expand": "展開", //$NON-NLS-1$ //$NON-NLS-0$
	"collapse": "省略", //$NON-NLS-1$ //$NON-NLS-0$
	"expandAll": "すべて展開", //$NON-NLS-1$ //$NON-NLS-0$
	"collapseAll": "すべて省略表示", //$NON-NLS-1$ //$NON-NLS-0$
	"lastEdit": "最後の編集位置", //$NON-NLS-1$ //$NON-NLS-0$
	"trimTrailingWhitespaces": "末尾の空白を削除", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleLineComment": "行コメントの切り替え", //$NON-NLS-1$ //$NON-NLS-0$
	"addBlockComment": "ブロック・コメントの追加", //$NON-NLS-1$ //$NON-NLS-0$
	"removeBlockComment": "ブロック・コメントの削除", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeEntered": "リンクされたモードに入りました", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeExited": "リンクされたモードを終了しました", //$NON-NLS-1$ //$NON-NLS-0$
	"syntaxError": "構文エラー", //$NON-NLS-1$ //$NON-NLS-0$
	"contentAssist": "コンテンツ・アシスト", //$NON-NLS-1$ //$NON-NLS-0$
	"lineColumn": "${0} 行 : ${1} 列", //$NON-NLS-1$ //$NON-NLS-0$
	
	//vi
	"vi": "vi", //$NON-NLS-1$ //$NON-NLS-0$
	"vimove": "(移動)", //$NON-NLS-1$ //$NON-NLS-0$
	"viyank": "(ヤンク)", //$NON-NLS-1$ //$NON-NLS-0$
	"videlete": "(削除)", //$NON-NLS-1$ //$NON-NLS-0$
	"vichange": "(変更)", //$NON-NLS-1$ //$NON-NLS-0$
	"viLeft": "${0} 左", //$NON-NLS-1$ //$NON-NLS-0$
	"viRight": "${0} 右", //$NON-NLS-1$ //$NON-NLS-0$
	"viUp": "${0} 上", //$NON-NLS-1$ //$NON-NLS-0$
	"viDown": "${0} 下", //$NON-NLS-1$ //$NON-NLS-0$
	"viw": "${0} 次の単語", //$NON-NLS-1$ //$NON-NLS-0$
	"vib": "${0} 単語の開始", //$NON-NLS-1$ //$NON-NLS-0$
	"viW": "${0} 次の単語 (空白文字停止)", //$NON-NLS-1$ //$NON-NLS-0$
	"viB": "${0} 単語の開始 (空白文字停止)", //$NON-NLS-1$ //$NON-NLS-0$
	"vie": "${0} 単語の終わり", //$NON-NLS-1$ //$NON-NLS-0$
	"viE": "${0} 単語の終わり (空白文字停止)", //$NON-NLS-1$ //$NON-NLS-0$
	"vi$": "${0} 行の終わり", //$NON-NLS-1$ //$NON-NLS-0$
	"vi^_": "${0} 現在行の最初の非ブランク文字", //$NON-NLS-1$ //$NON-NLS-0$
	"vi+": "${0} 次の行の最初の文字", //$NON-NLS-1$ //$NON-NLS-0$
	"vi-": "${0} 前の行の最初の文字", //$NON-NLS-1$ //$NON-NLS-0$
	"vi|": "${0} 行内の n 番目の列", //$NON-NLS-1$ //$NON-NLS-0$
	"viH": "${0} ページの先頭", //$NON-NLS-1$ //$NON-NLS-0$
	"viM": "${0} ページの中央", //$NON-NLS-1$ //$NON-NLS-0$
	"viL": "${0} ページの下部", //$NON-NLS-1$ //$NON-NLS-0$
	"vi/": "${0} 順方向検索", //$NON-NLS-1$ //$NON-NLS-0$
	"vi?": "${0} 逆方向検索", //$NON-NLS-1$ //$NON-NLS-0$
	"vin": "${0} 次の検索", //$NON-NLS-1$ //$NON-NLS-0$
	"viN": "${0} 前の検索", //$NON-NLS-1$ //$NON-NLS-0$
	"vif": "${0} 文字を順方向に検索", //$NON-NLS-1$ //$NON-NLS-0$
	"viF": "${0} 文字を逆方向に検索", //$NON-NLS-1$ //$NON-NLS-0$
	"vit": "${0} 文字を順方向に検索 (キャレットは 1 スペース前)", //$NON-NLS-1$ //$NON-NLS-0$
	"viT": "${0} 文字を逆方向に検索 (キャレットは 1 スペース前)", //$NON-NLS-1$ //$NON-NLS-0$
	"vi,": "${0} 文字検索を逆方向で繰り返す", //$NON-NLS-1$ //$NON-NLS-0$
	"vi;": "${0} 文字検索を繰り返す", //$NON-NLS-1$ //$NON-NLS-0$
	"viG": "${0} 指定行へジャンプ", //$NON-NLS-1$ //$NON-NLS-0$
	"viycd": "${0} 現在行", //$NON-NLS-1$ //$NON-NLS-0$
	"via": "カーソルの後ろに追加", //$NON-NLS-1$ //$NON-NLS-0$
	"viA": "行末に追加", //$NON-NLS-1$ //$NON-NLS-0$
	"vii": "カーソルの前に追加", //$NON-NLS-1$ //$NON-NLS-0$
	"viI": "行の先頭に追加", //$NON-NLS-1$ //$NON-NLS-0$
	"viO": "上に行を挿入", //$NON-NLS-1$ //$NON-NLS-0$
	"vio": "下に行を挿入", //$NON-NLS-1$ //$NON-NLS-0$
	"viR": "テキストの上書きを開始", //$NON-NLS-1$ //$NON-NLS-0$
	"vis": "文字の置換", //$NON-NLS-1$ //$NON-NLS-0$
	"viS": "行全体の置換", //$NON-NLS-1$ //$NON-NLS-0$
	"viC": "テキストを行末まで変更", //$NON-NLS-1$ //$NON-NLS-0$
	"vip": "文字または行の後ろに貼り付け", //$NON-NLS-1$ //$NON-NLS-0$
	"viP": "文字または行の前に貼り付け", //$NON-NLS-1$ //$NON-NLS-0$
	"viStar": "カーソル位置の単語を検索", //$NON-NLS-1$ //$NON-NLS-0$
	
	"next": "次へ", //$NON-NLS-1$ //$NON-NLS-0$
	"previous": "前へ", //$NON-NLS-1$ //$NON-NLS-0$
	"replace": "置換", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceAll": "すべて置換", //$NON-NLS-1$ //$NON-NLS-0$
	"findWith": "検索内容", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceWith": "置換", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitive": "Aa", //$NON-NLS-1$ //$NON-NLS-0$
	"regex": "/.*/", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWord": "\\b", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitiveTooltip": "大/小文字の区別の有無を切り替え", //$NON-NLS-1$ //$NON-NLS-0$
	"regexTooltip": "正規表現を切り替え", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWordTooltip": "完全一致が必要かどうかを切り替え", //$NON-NLS-1$ //$NON-NLS-0$
	"closeTooltip": "閉じる", //$NON-NLS-1$ //$NON-NLS-0$

	"replacingAll": "すべてを置換中...", //$NON-NLS-1$ //$NON-NLS-0$
	"replacedMatches": "${0} 個の一致を置換しました", //$NON-NLS-1$ //$NON-NLS-0$
	"nothingReplaced": "何も置き換えられていません", //$NON-NLS-1$ //$NON-NLS-0$
	"notFound": "未検出" //$NON-NLS-1$ //$NON-NLS-0$
});

