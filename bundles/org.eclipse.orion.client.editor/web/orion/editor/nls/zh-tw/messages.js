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
	"multipleAnnotations": "多個註釋：", //$NON-NLS-1$ //$NON-NLS-0$
	"line": "行：${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"breakpoint": "岔斷點", //$NON-NLS-1$ //$NON-NLS-0$
	"bookmark": "書籤", //$NON-NLS-1$ //$NON-NLS-0$
	"task": "作業", //$NON-NLS-1$ //$NON-NLS-0$
	"error": "錯誤", //$NON-NLS-1$ //$NON-NLS-0$
	"warning": "警告", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingSearch": "符合搜尋", //$NON-NLS-1$ //$NON-NLS-0$
	"currentSearch": "現行搜尋", //$NON-NLS-1$ //$NON-NLS-0$
	"currentLine": "現行行", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingBracket": "對稱的方括弧", //$NON-NLS-1$ //$NON-NLS-0$
	"currentBracket": "現行方括弧", //$NON-NLS-1$ //$NON-NLS-0$
	
	"lineUp": "上移一行", //$NON-NLS-1$ //$NON-NLS-0$
	"lineDown": "下移一行", //$NON-NLS-1$ //$NON-NLS-0$
	"lineStart": "行首", //$NON-NLS-1$ //$NON-NLS-0$
	"lineEnd": "行尾", //$NON-NLS-1$ //$NON-NLS-0$
	"charPrevious": "前一個字元", //$NON-NLS-1$ //$NON-NLS-0$
	"charNext": "下一個字元", //$NON-NLS-1$ //$NON-NLS-0$
	"pageUp": "上一頁", //$NON-NLS-1$ //$NON-NLS-0$
	"pageDown": "下一頁", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageUp": "往上捲動頁面", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageDown": "往下捲動頁面", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineUp": "上捲一行", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineDown": "下捲一行", //$NON-NLS-1$ //$NON-NLS-0$
	"wordPrevious": "上一個單字", //$NON-NLS-1$ //$NON-NLS-0$
	"wordNext": "下一個單字", //$NON-NLS-1$ //$NON-NLS-0$
	"textStart": "文件開頭", //$NON-NLS-1$ //$NON-NLS-0$
	"textEnd": "文件末尾", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextStart": "捲動到文件開頭", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextEnd": "捲動到文件末尾", //$NON-NLS-1$ //$NON-NLS-0$
	"centerLine": "中線", //$NON-NLS-1$ //$NON-NLS-0$
	
	"selectLineUp": "往上選取字行", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineDown": "往下選取字行", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineUp": " 往上選取整行", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineDown": "往下選取整行", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineStart": "選取行首", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineEnd": "選取行尾", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharPrevious": "選取前一個字元", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharNext": "選取下一個字元", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageUp": "往上選取頁面", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageDown": "往下選取頁面", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordPrevious": "選取上一個單字", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordNext": "選取下一個單字", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextStart": "選取文件開頭", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextEnd": "選取文件末尾", //$NON-NLS-1$ //$NON-NLS-0$

	"deletePrevious": "刪除前一個字元", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteNext": "刪除下一個字元", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordPrevious": "刪除上一個單字", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordNext": "刪除下一個單字", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineStart": "刪除行首", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineEnd": "刪除行尾", //$NON-NLS-1$ //$NON-NLS-0$
	"tab": "插入欄標", //$NON-NLS-1$ //$NON-NLS-0$
	"enter": "插入行定界字元", //$NON-NLS-1$ //$NON-NLS-0$
	"enterNoCursor": "插入行定界字元", //$NON-NLS-1$ //$NON-NLS-0$
	"selectAll": "全選", //$NON-NLS-1$ //$NON-NLS-0$
	"copy": "複製", //$NON-NLS-1$ //$NON-NLS-0$
	"cut": "剪下", //$NON-NLS-1$ //$NON-NLS-0$
	"paste": "貼上", //$NON-NLS-1$ //$NON-NLS-0$
	
	"uppercase": "成為大寫", //$NON-NLS-1$ //$NON-NLS-0$
	"lowercase": "成為小寫", //$NON-NLS-1$ //$NON-NLS-0$
	"capitalize": "字母大小寫", //$NON-NLS-1$ //$NON-NLS-0$
	"reversecase" : "反向大小寫", //$NON-NLS-1$ //$NON-NLS-0$
	
	"toggleWrapMode": "切換折行模式", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleTabMode": "切換欄標模式", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleOverwriteMode": "切換改寫模式", //$NON-NLS-1$ //$NON-NLS-0$
	
	"committerOnTime": "${0} 於 ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//Emacs
	"emacs": "Emacs", //$NON-NLS-1$ //$NON-NLS-0$
	"exchangeMarkPoint": "交換標示和點", //$NON-NLS-1$ //$NON-NLS-0$
	"setMarkCommand": "設定標示", //$NON-NLS-1$ //$NON-NLS-0$
	"clearMark": "清除標示", //$NON-NLS-1$ //$NON-NLS-0$
	"digitArgument": "數字引數 ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"negativeArgument": "負數引數", //$NON-NLS-1$ //$NON-NLS-0$
			
	"Comment": "註解", //$NON-NLS-1$ //$NON-NLS-0$
	"Flat outline": "平面大綱", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStr": "漸進式尋找：${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStrNotFound": "漸進式尋找：${0}（找不到）", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStr": "反向漸進式尋找：${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStrNotFound": "反向漸進式尋找：${0}（找不到）", //$NON-NLS-1$ //$NON-NLS-0$
	"find": "尋找...", //$NON-NLS-1$ //$NON-NLS-0$
	"undo": "復原", //$NON-NLS-1$ //$NON-NLS-0$
	"redo": "重做", //$NON-NLS-1$ //$NON-NLS-0$
	"cancelMode": "取消現行模式", //$NON-NLS-1$ //$NON-NLS-0$
	"findNext": "尋找下一個出現項目", //$NON-NLS-1$ //$NON-NLS-0$
	"findPrevious": "尋找上一個出現項目", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFind": "漸進式尋找", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverse": "逆向漸進式尋找", //$NON-NLS-1$ //$NON-NLS-0$
	"indentLines": "縮排行", //$NON-NLS-1$ //$NON-NLS-0$
	"unindentLines": "取消縮排行", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesUp": "將各行向上移動", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesDown": "將各行向下移動", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesUp": "將行向上複製", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesDown": "將行向下複製", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLines": "刪除行", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "移至行...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompty": "移至行：", //$NON-NLS-1$ //$NON-NLS-0$
	"nextAnnotation": "下一個註釋", //$NON-NLS-1$ //$NON-NLS-0$
	"prevAnnotation": "上一個註釋", //$NON-NLS-1$ //$NON-NLS-0$
	"expand": "展開", //$NON-NLS-1$ //$NON-NLS-0$
	"collapse": "收合", //$NON-NLS-1$ //$NON-NLS-0$
	"expandAll": "全部展開", //$NON-NLS-1$ //$NON-NLS-0$
	"collapseAll": "全部收合", //$NON-NLS-1$ //$NON-NLS-0$
	"lastEdit": "前次編輯位置", //$NON-NLS-1$ //$NON-NLS-0$
	"trimTrailingWhitespaces": "修整尾端空格", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleLineComment": "切換行註解", //$NON-NLS-1$ //$NON-NLS-0$
	"addBlockComment": "新增區塊註解", //$NON-NLS-1$ //$NON-NLS-0$
	"removeBlockComment": "移除區塊註解", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeEntered": "進入鏈結模式", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeExited": "離開鏈結模式", //$NON-NLS-1$ //$NON-NLS-0$
	"syntaxError": "語法錯誤", //$NON-NLS-1$ //$NON-NLS-0$
	"contentAssist": "內容輔助", //$NON-NLS-1$ //$NON-NLS-0$
	"lineColumn": "行 ${0}：欄 ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//vi
	"vi": "vi", //$NON-NLS-1$ //$NON-NLS-0$
	"vimove": "（移動）", //$NON-NLS-1$ //$NON-NLS-0$
	"viyank": "（召回）", //$NON-NLS-1$ //$NON-NLS-0$
	"videlete": "（刪除）", //$NON-NLS-1$ //$NON-NLS-0$
	"vichange": "（變更）", //$NON-NLS-1$ //$NON-NLS-0$
	"viLeft": "${0} 左", //$NON-NLS-1$ //$NON-NLS-0$
	"viRight": "${0} 右", //$NON-NLS-1$ //$NON-NLS-0$
	"viUp": "${0} 上", //$NON-NLS-1$ //$NON-NLS-0$
	"viDown": "${0} 下", //$NON-NLS-1$ //$NON-NLS-0$
	"viw": "${0} 下一個單字", //$NON-NLS-1$ //$NON-NLS-0$
	"vib": "${0} 單字的開頭", //$NON-NLS-1$ //$NON-NLS-0$
	"viW": "${0} 下一個單字（ws 停止）", //$NON-NLS-1$ //$NON-NLS-0$
	"viB": "${0} 單字的開頭（ws 停止）", //$NON-NLS-1$ //$NON-NLS-0$
	"vie": "${0} 單字的結尾", //$NON-NLS-1$ //$NON-NLS-0$
	"viE": "${0} 單字的結尾（ws 停止）", //$NON-NLS-1$ //$NON-NLS-0$
	"vi$": "${0} 行尾", //$NON-NLS-1$ //$NON-NLS-0$
	"vi^_": "${0} 第一個非空白字元現行行", //$NON-NLS-1$ //$NON-NLS-0$
	"vi+": "${0} 第一個字元下一行", //$NON-NLS-1$ //$NON-NLS-0$
	"vi-": "${0} 第一個字元上一行", //$NON-NLS-1$ //$NON-NLS-0$
	"vi|": "${0} 行的第 n 欄", //$NON-NLS-1$ //$NON-NLS-0$
	"viH": "${0} 頁面頂端", //$NON-NLS-1$ //$NON-NLS-0$
	"viM": "${0} 頁面中間", //$NON-NLS-1$ //$NON-NLS-0$
	"viL": "${0} 頁面底端", //$NON-NLS-1$ //$NON-NLS-0$
	"vi/": "${0} 向前搜尋", //$NON-NLS-1$ //$NON-NLS-0$
	"vi?": "${0} 向後搜尋", //$NON-NLS-1$ //$NON-NLS-0$
	"vin": "${0} 下一個搜尋", //$NON-NLS-1$ //$NON-NLS-0$
	"viN": "${0} 上一個搜尋", //$NON-NLS-1$ //$NON-NLS-0$
	"vif": "${0} 向前搜尋字元", //$NON-NLS-1$ //$NON-NLS-0$
	"viF": "${0} 向後搜尋字元", //$NON-NLS-1$ //$NON-NLS-0$
	"vit": "${0} 在字元之前向前搜尋", //$NON-NLS-1$ //$NON-NLS-0$
	"viT": "${0} 在字元之前向後搜尋", //$NON-NLS-1$ //$NON-NLS-0$
	"vi,": "${0} 重複反向字元搜尋", //$NON-NLS-1$ //$NON-NLS-0$
	"vi;": "${0} 重複字元搜尋", //$NON-NLS-1$ //$NON-NLS-0$
	"viG": "${0} 移至行", //$NON-NLS-1$ //$NON-NLS-0$
	"viycd": "${0} 現行行", //$NON-NLS-1$ //$NON-NLS-0$
	"via": "附加在游標之後", //$NON-NLS-1$ //$NON-NLS-0$
	"viA": "附加在行尾", //$NON-NLS-1$ //$NON-NLS-0$
	"vii": "插入在游標之前", //$NON-NLS-1$ //$NON-NLS-0$
	"viI": "插入在行首", //$NON-NLS-1$ //$NON-NLS-0$
	"viO": "插入上方列", //$NON-NLS-1$ //$NON-NLS-0$
	"vio": "插入下方列", //$NON-NLS-1$ //$NON-NLS-0$
	"viR": "開始改寫文字", //$NON-NLS-1$ //$NON-NLS-0$
	"vis": "替換字元", //$NON-NLS-1$ //$NON-NLS-0$
	"viS": "替換整行", //$NON-NLS-1$ //$NON-NLS-0$
	"viC": "變更文字直到行尾", //$NON-NLS-1$ //$NON-NLS-0$
	"vip": "貼在字元或行之後", //$NON-NLS-1$ //$NON-NLS-0$
	"viP": "貼在字元或行之前", //$NON-NLS-1$ //$NON-NLS-0$
	"viStar": "搜尋游標之下的單字", //$NON-NLS-1$ //$NON-NLS-0$
	
	"next": "下一步", //$NON-NLS-1$ //$NON-NLS-0$
	"previous": "上一步", //$NON-NLS-1$ //$NON-NLS-0$
	"replace": "取代", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceAll": "全部取代", //$NON-NLS-1$ //$NON-NLS-0$
	"findWith": "尋找", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceWith": "取代為", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitive": "Aa", //$NON-NLS-1$ //$NON-NLS-0$
	"regex": "/.*/", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWord": "\\b", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitiveTooltip": "切換區分大小寫", //$NON-NLS-1$ //$NON-NLS-0$
	"regexTooltip": "切換正規表示式", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWordTooltip": "切換完整單字", //$NON-NLS-1$ //$NON-NLS-0$
	"closeTooltip": "關閉", //$NON-NLS-1$ //$NON-NLS-0$

	"replacingAll": "正在全部取代...", //$NON-NLS-1$ //$NON-NLS-0$
	"replacedMatches": "已取代 ${0} 個相符項", //$NON-NLS-1$ //$NON-NLS-0$
	"nothingReplaced": "未取代", //$NON-NLS-1$ //$NON-NLS-0$
	"notFound": "找不到" //$NON-NLS-1$ //$NON-NLS-0$
});

