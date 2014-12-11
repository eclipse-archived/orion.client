/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 ******************************************************************************/
//NLS_CHARSET=UTF-8
/*eslint-env amd*/
define({
	'error': '錯誤',  //$NON-NLS-0$  //$NON-NLS-1$
	'warning' : '警告',  //$NON-NLS-0$  //$NON-NLS-1$
	'ignore' : '忽略',  //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutline' : '程式碼大綱', //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutlineTitle': 'JavaScript 程式碼大綱',  //$NON-NLS-0$  //$NON-NLS-1$
	'contentAssist' : 'JavaScript 內容輔助', //$NON-NLS-0$  //$NON-NLS-1$
	'eslintValidator' : 'JavaScript 驗證器', //$NON-NLS-0$  //$NON-NLS-1$
	'missingCurly' : '陳述式未用大括弧括住：', //$NON-NLS-0$  //$NON-NLS-1$
	'noCaller' : '不建議的 \'arguments.caller\' 或 \'arguments.callee\' 用法：', //$NON-NLS-0$  //$NON-NLS-1$
	'noEqeqeq' : '不建議的 \'==\' 用法：', //$NON-NLS-0$  //$NON-NLS-1$
	'noDebugger' : '不建議的 \'debugger\' 陳述式用法：', //$NON-NLS-0$  //$NON-NLS-1$
	'noEval' : '不建議的 \'eval()\' 用法：', //$NON-NLS-0$  //$NON-NLS-1$
	'noDupeKeys' : '重複的物件索引鍵：', //$NON-NLS-0$  //$NON-NLS-1$
	'useIsNaN' : 'NaN 不能與 isNaN() 相互比較：', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncDecl' : '函數宣告中沒有 JSDoc：', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncExpr' : '函數表示式中沒有 JSDoc：', //$NON-NLS-0$  //$NON-NLS-1$
	'noUnreachable' : '無法呼叫到的程式碼：', //$NON-NLS-0$  //$NON-NLS-1$
	'noFallthrough' : 'Switch case 貫穿：', //$NON-NLS-0$  //$NON-NLS-1$
	'useBeforeDefine' : '在定義之前使用成員：', //$NON-NLS-0$  //$NON-NLS-1$
	'noEmptyBlock' : '未記載的空區塊：', //$NON-NLS-0$  //$NON-NLS-1$
	'newParens' : '建構子呼叫中遺漏括弧：', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewArray': '不建議的 \'new Array()\'：', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewFunc': '不建議的 \'new Function()\'：', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewObject': '不建議的 \'new Object()\'：', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewWrappers': '不建議的封套物件：', //$NON-NLS-0$  //$NON-NLS-1$
	'missingSemi' : '遺漏分號：', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedVars' : '未使用的變數：', //$NON-NLS-0$  //$NON-NLS-1$
	'varRedecl' : '變數重複宣告：', //$NON-NLS-0$  //$NON-NLS-1$
	'varShadow': '變數投影處理：', //$NON-NLS-0$  //$NON-NLS-1$
	'undefMember' : '未宣告的廣域參照：', //$NON-NLS-0$  //$NON-NLS-1$
	'unnecessarySemis' : '不必要的分號：', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedParams' : '未使用的參數：', //$NON-NLS-0$  //$NON-NLS-1$
	'unsupportedJSLint' : '不支援的環境指引：',  //$NON-NLS-0$  //$NON-NLS-1$
	'throwError': '在 \'throw\' 中使用非錯誤：',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocName' : '產生元素註解',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocTooltip' : '針對選取的 JavaScript 元素產生類似 JSDoc 的註解',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclName' : '開啟宣告',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclTooltip' : '開啟選定元素的宣告',  //$NON-NLS-0$  //$NON-NLS-1$
	'validTypeof': '無效的 \'typeof\' 比較',  //$NON-NLS-0$ //$NON-NLS-1$
	'noSparseArrays': '稀疏陣列宣告', //$NON-NLS-0$ //$NON-NLS-1$
	'jsHover': 'JavaScript 移至提供者', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixName': '移除額外的分號', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixTooltip': '移除額外的分號', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixName': '新增 $FALLTHROUGH$ 註解', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixTooltip': '新增 $FALLTHROUGH$ 行註解', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixName': '註解空白區塊', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixTooltip': '新增待辦事項註解至空白區塊', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixName': '新增至 eslint-env 指引', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixTooltip': '新增至 eslint-env 指引以過濾已知成員', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixName': '新增至廣域指引', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixTooltip': '新增至廣域指引以過濾未知成員', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixName': '移除參數', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixTooltip': '移除未用的參數，保留負面影響', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixName': '將 @callback 新增至函數', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixTooltip': '製作附加 @callback 之函數的文件，忽略未用的參數', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixName': '更新運算子', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixTooltip': '將運算子更新為預期的運算子', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixName': '移除無法呼叫到的程式碼', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixTooltip': '移除無法呼叫到的程式碼', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixName': '轉換為一般陣列', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixTooltip': '移除稀疏項目並轉換為一般陣列', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixName': '新增遺漏的 \';\'', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixTooltip': '新增遺漏的 \';\'', //$NON-NLS-0$ //$NON-NLS-1$
	'radix': '遺漏 parseInt() 的基數參數', //$NON-NLS-0$ //$NON-NLS-1$
});

