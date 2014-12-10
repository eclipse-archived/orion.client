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
	"multipleAnnotations": "多个注释：", //$NON-NLS-1$ //$NON-NLS-0$
	"line": "行：${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"breakpoint": "断点", //$NON-NLS-1$ //$NON-NLS-0$
	"bookmark": "书签", //$NON-NLS-1$ //$NON-NLS-0$
	"task": "任务", //$NON-NLS-1$ //$NON-NLS-0$
	"error": "错误", //$NON-NLS-1$ //$NON-NLS-0$
	"warning": "警告", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingSearch": "相匹配的搜索", //$NON-NLS-1$ //$NON-NLS-0$
	"currentSearch": "当前搜索", //$NON-NLS-1$ //$NON-NLS-0$
	"currentLine": "当前行", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingBracket": "配对的方括号", //$NON-NLS-1$ //$NON-NLS-0$
	"currentBracket": "当前方括号", //$NON-NLS-1$ //$NON-NLS-0$
	
	"lineUp": "上移", //$NON-NLS-1$ //$NON-NLS-0$
	"lineDown": "下移", //$NON-NLS-1$ //$NON-NLS-0$
	"lineStart": "行首", //$NON-NLS-1$ //$NON-NLS-0$
	"lineEnd": "行末", //$NON-NLS-1$ //$NON-NLS-0$
	"charPrevious": "前一个字符", //$NON-NLS-1$ //$NON-NLS-0$
	"charNext": "下一个字符", //$NON-NLS-1$ //$NON-NLS-0$
	"pageUp": "向上翻页", //$NON-NLS-1$ //$NON-NLS-0$
	"pageDown": "向下翻页", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageUp": "将页面向上滚动", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageDown": "将页面向下滚动", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineUp": "向上滚动一行", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineDown": "向下滚动一行", //$NON-NLS-1$ //$NON-NLS-0$
	"wordPrevious": "上一个单词", //$NON-NLS-1$ //$NON-NLS-0$
	"wordNext": "下一个单词", //$NON-NLS-1$ //$NON-NLS-0$
	"textStart": "文档开头", //$NON-NLS-1$ //$NON-NLS-0$
	"textEnd": "文档末尾", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextStart": "滚动文档开头", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextEnd": "滚动文档末尾", //$NON-NLS-1$ //$NON-NLS-0$
	"centerLine": "中心行", //$NON-NLS-1$ //$NON-NLS-0$
	
	"selectLineUp": "选择上一行", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineDown": "选择下一行", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineUp": " 选择整个上一行", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineDown": "选择整个下一行", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineStart": "选择行首", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineEnd": "选择行末", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharPrevious": "选择前一个字符", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharNext": "选择下一个字符", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageUp": "选择页面顶部", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageDown": "选择页面底部", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordPrevious": "选择上一个单词", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordNext": "选择下一个单词", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextStart": "选择文档开头", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextEnd": "选择文档末尾", //$NON-NLS-1$ //$NON-NLS-0$

	"deletePrevious": "删除前一个字符", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteNext": "删除下一个字符", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordPrevious": "删除上一个单词", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordNext": "删除下一个单词", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineStart": "删除行首", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineEnd": "删除行末", //$NON-NLS-1$ //$NON-NLS-0$
	"tab": "插入制表符", //$NON-NLS-1$ //$NON-NLS-0$
	"enter": "插入行定界符", //$NON-NLS-1$ //$NON-NLS-0$
	"enterNoCursor": "插入行定界符", //$NON-NLS-1$ //$NON-NLS-0$
	"selectAll": "全选", //$NON-NLS-1$ //$NON-NLS-0$
	"copy": "复制", //$NON-NLS-1$ //$NON-NLS-0$
	"cut": "剪切", //$NON-NLS-1$ //$NON-NLS-0$
	"paste": "粘贴", //$NON-NLS-1$ //$NON-NLS-0$
	
	"uppercase": "更改为大写", //$NON-NLS-1$ //$NON-NLS-0$
	"lowercase": "更改为小写", //$NON-NLS-1$ //$NON-NLS-0$
	"capitalize": "转为大写", //$NON-NLS-1$ //$NON-NLS-0$
	"reversecase" : "撤销大小写", //$NON-NLS-1$ //$NON-NLS-0$
	
	"toggleWrapMode": "切换回绕方式", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleTabMode": "切换跳格方式", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleOverwriteMode": "切换改写方式", //$NON-NLS-1$ //$NON-NLS-0$
	
	"committerOnTime": "${0} 于 ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//Emacs
	"emacs": "Emacs", //$NON-NLS-1$ //$NON-NLS-0$
	"exchangeMarkPoint": "交换标记和点", //$NON-NLS-1$ //$NON-NLS-0$
	"setMarkCommand": "设置标记", //$NON-NLS-1$ //$NON-NLS-0$
	"clearMark": "清除标记", //$NON-NLS-1$ //$NON-NLS-0$
	"digitArgument": "数字自变量 ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"negativeArgument": "负数自变量", //$NON-NLS-1$ //$NON-NLS-0$
			
	"Comment": "注释", //$NON-NLS-1$ //$NON-NLS-0$
	"Flat outline": "平面大纲", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStr": "增量查找：${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStrNotFound": "增量查找：${0}（找不到）", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStr": "逆向增量查找：${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStrNotFound": "逆向增量查找：${0}（找不到）", //$NON-NLS-1$ //$NON-NLS-0$
	"find": "查找...", //$NON-NLS-1$ //$NON-NLS-0$
	"undo": "撤销", //$NON-NLS-1$ //$NON-NLS-0$
	"redo": "重做", //$NON-NLS-1$ //$NON-NLS-0$
	"cancelMode": "取消当前方式", //$NON-NLS-1$ //$NON-NLS-0$
	"findNext": "查找下一个实例", //$NON-NLS-1$ //$NON-NLS-0$
	"findPrevious": "查找上一个实例", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFind": "增量查找", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverse": "逆向增量查找", //$NON-NLS-1$ //$NON-NLS-0$
	"indentLines": "缩进行", //$NON-NLS-1$ //$NON-NLS-0$
	"unindentLines": "非缩进行", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesUp": "将行上移", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesDown": "将行下移", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesUp": "向上复制行", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesDown": "向下复制行", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLines": "删除行", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "转至行...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompty": "转至行：", //$NON-NLS-1$ //$NON-NLS-0$
	"nextAnnotation": "下一个注释", //$NON-NLS-1$ //$NON-NLS-0$
	"prevAnnotation": "上一个注释", //$NON-NLS-1$ //$NON-NLS-0$
	"expand": "展开", //$NON-NLS-1$ //$NON-NLS-0$
	"collapse": "折叠", //$NON-NLS-1$ //$NON-NLS-0$
	"expandAll": "全部展开", //$NON-NLS-1$ //$NON-NLS-0$
	"collapseAll": "全部折叠", //$NON-NLS-1$ //$NON-NLS-0$
	"lastEdit": "上一个编辑位置", //$NON-NLS-1$ //$NON-NLS-0$
	"trimTrailingWhitespaces": "删除结尾空格", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleLineComment": "切换行注释", //$NON-NLS-1$ //$NON-NLS-0$
	"addBlockComment": "添加块注释", //$NON-NLS-1$ //$NON-NLS-0$
	"removeBlockComment": "除去块注释", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeEntered": "已进入链接方式", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeExited": "已退出链接方式", //$NON-NLS-1$ //$NON-NLS-0$
	"syntaxError": "语法错误", //$NON-NLS-1$ //$NON-NLS-0$
	"contentAssist": "内容辅助", //$NON-NLS-1$ //$NON-NLS-0$
	"lineColumn": "第 ${0} 行：第 ${1} 列", //$NON-NLS-1$ //$NON-NLS-0$
	
	//vi
	"vi": "vi", //$NON-NLS-1$ //$NON-NLS-0$
	"vimove": "（移动）", //$NON-NLS-1$ //$NON-NLS-0$
	"viyank": "（拖拽）", //$NON-NLS-1$ //$NON-NLS-0$
	"videlete": "（删除）", //$NON-NLS-1$ //$NON-NLS-0$
	"vichange": "（更改）", //$NON-NLS-1$ //$NON-NLS-0$
	"viLeft": "${0}左对齐", //$NON-NLS-1$ //$NON-NLS-0$
	"viRight": "${0}右对齐", //$NON-NLS-1$ //$NON-NLS-0$
	"viUp": "${0}向上", //$NON-NLS-1$ //$NON-NLS-0$
	"viDown": "${0}向下", //$NON-NLS-1$ //$NON-NLS-0$
	"viw": "${0}下一个单词", //$NON-NLS-1$ //$NON-NLS-0$
	"vib": "${0}单词开头", //$NON-NLS-1$ //$NON-NLS-0$
	"viW": "${0}下一个单词 (ws stop)", //$NON-NLS-1$ //$NON-NLS-0$
	"viB": "${0}单词开头 (ws stop)", //$NON-NLS-1$ //$NON-NLS-0$
	"vie": "${0}单词结尾", //$NON-NLS-1$ //$NON-NLS-0$
	"viE": "${0}单词结尾 (ws stop)", //$NON-NLS-1$ //$NON-NLS-0$
	"vi$": "${0}行结尾", //$NON-NLS-1$ //$NON-NLS-0$
	"vi^_": "${0}当前行首个非空字符", //$NON-NLS-1$ //$NON-NLS-0$
	"vi+": "${0}下一行首个字符", //$NON-NLS-1$ //$NON-NLS-0$
	"vi-": "${0}前一行首个字符", //$NON-NLS-1$ //$NON-NLS-0$
	"vi|": "${0}行中的 nth 列", //$NON-NLS-1$ //$NON-NLS-0$
	"viH": "${0}页首", //$NON-NLS-1$ //$NON-NLS-0$
	"viM": "${0}页中", //$NON-NLS-1$ //$NON-NLS-0$
	"viL": "${0}页底", //$NON-NLS-1$ //$NON-NLS-0$
	"vi/": "${0}向前搜索", //$NON-NLS-1$ //$NON-NLS-0$
	"vi?": "${0}向后搜索", //$NON-NLS-1$ //$NON-NLS-0$
	"vin": "${0}下一个搜索", //$NON-NLS-1$ //$NON-NLS-0$
	"viN": "${0}前一个搜索", //$NON-NLS-1$ //$NON-NLS-0$
	"vif": "${0}向前搜索字符", //$NON-NLS-1$ //$NON-NLS-0$
	"viF": "${0}向后搜索字符", //$NON-NLS-1$ //$NON-NLS-0$
	"vit": "${0}在字符前向前搜索", //$NON-NLS-1$ //$NON-NLS-0$
	"viT": "${0}在字符前向后搜索", //$NON-NLS-1$ //$NON-NLS-0$
	"vi,": "${0}重复撤销字符搜索", //$NON-NLS-1$ //$NON-NLS-0$
	"vi;": "${0}重复字符搜索", //$NON-NLS-1$ //$NON-NLS-0$
	"viG": "${0}转至行", //$NON-NLS-1$ //$NON-NLS-0$
	"viycd": "${0}当前行", //$NON-NLS-1$ //$NON-NLS-0$
	"via": "在光标后追加", //$NON-NLS-1$ //$NON-NLS-0$
	"viA": "追加到行结尾", //$NON-NLS-1$ //$NON-NLS-0$
	"vii": "在光标前插入", //$NON-NLS-1$ //$NON-NLS-0$
	"viI": "在行首插入", //$NON-NLS-1$ //$NON-NLS-0$
	"viO": "在行上插入", //$NON-NLS-1$ //$NON-NLS-0$
	"vio": "在行下插入", //$NON-NLS-1$ //$NON-NLS-0$
	"viR": "开始覆盖文本", //$NON-NLS-1$ //$NON-NLS-0$
	"vis": "替换字符", //$NON-NLS-1$ //$NON-NLS-0$
	"viS": "替换整行", //$NON-NLS-1$ //$NON-NLS-0$
	"viC": "更改文本直到行末", //$NON-NLS-1$ //$NON-NLS-0$
	"vip": "在字符后或行后粘贴", //$NON-NLS-1$ //$NON-NLS-0$
	"viP": "在字符后或行前粘贴", //$NON-NLS-1$ //$NON-NLS-0$
	"viStar": "在光标下方搜索词语", //$NON-NLS-1$ //$NON-NLS-0$
	
	"next": "下一个", //$NON-NLS-1$ //$NON-NLS-0$
	"previous": "上一个", //$NON-NLS-1$ //$NON-NLS-0$
	"replace": "替换", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceAll": "全部替换", //$NON-NLS-1$ //$NON-NLS-0$
	"findWith": "查找方式", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceWith": "替换为", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitive": "Aa", //$NON-NLS-1$ //$NON-NLS-0$
	"regex": "/.*/", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWord": "\\b", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitiveTooltip": "切换不区分大小写", //$NON-NLS-1$ //$NON-NLS-0$
	"regexTooltip": "切换正则表达式", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWordTooltip": "切换整个词语", //$NON-NLS-1$ //$NON-NLS-0$
	"closeTooltip": "关闭", //$NON-NLS-1$ //$NON-NLS-0$

	"replacingAll": "正在全部替换...", //$NON-NLS-1$ //$NON-NLS-0$
	"replacedMatches": "已替换 ${0} 个匹配项", //$NON-NLS-1$ //$NON-NLS-0$
	"nothingReplaced": "未替换任何对象", //$NON-NLS-1$ //$NON-NLS-0$
	"notFound": "找不到" //$NON-NLS-1$ //$NON-NLS-0$
});

