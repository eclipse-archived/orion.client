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
/*eslint-env amd */
define({
    'syntaxErrorIncomplete': '語法錯誤，不完整的陳述式。',  //$NON-NLS-0$  //$NON-NLS-1$
    'syntaxErrorBadToken': '記號 \'${0}\' 語法錯誤，請刪除這個記號。',  //$NON-NLS-0$  //$NON-NLS-1$
    'esprimaParseFailure': 'Esprima 無法剖析此檔案，因為發生錯誤：${0}',  //$NON-NLS-0$ //$NON-NLS-1$
    'eslintValidationFailure': 'ESLint 無法驗證此檔案，因為發生錯誤：${0}',  //$NON-NLS-0$  //$NON-NLS-1$
	'curly': '陳述式應用大括弧括住。',  //$NON-NLS-0$  //$NON-NLS-1$
	'eqeqeq' : '預期為 \'${0}\'，但卻出現 \'${1}\'。',  //$NON-NLS-0$  //$NON-NLS-1$
	'missing-doc' : '遺漏函數 \'${0}\' 的說明文件。',  //$NON-NLS-0$  //$NON-NLS-1$
	'new-parens' : '呼叫建構子時遺漏括弧。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-debugger': '不建議使用 \'debugger\' 陳述式。',  //$NON-NLS-0$  //$NON-NLS-1$
	'no-dupe-keys' : '重複的物件索引鍵 \'${0}\'。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-empty-block' : '空白區塊應移除或加以註解。',  //$NON-NLS-0$ //$NON-NLS-1$
	'no-eval' : '不建議使用 ${0} 函數呼叫。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-extra-semi' : '不必要的分號。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-fallthrough' : '上一個 case 失敗會進入 Switch case。若有需要，請在上方的行新增 //$FALLTHROUGH$ 註解。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-jslint' : '不支援 \'${0}\' 指引，請使用 eslint-env。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-array' : '使用陣列文字表示法 \'[]\'。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-func' : '函數建構子是 eval。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-object' : '請使用物件文字表示法 \'{}\' 或 Object.create(null)。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-wrappers' : '請勿使用 \'${0}\' 作為建構子。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-redeclare' : '\'${0}\' 已定義。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-sparse-arrays': '應該避免稀疏陣列宣告。',  //$NON-NLS-0$ //$NON-NLS-1$
	'no-undef-defined' : '\'${0}\' 未定義。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-undef-readonly': '\'${0}\' 是唯讀的。',  //$NON-NLS-0$  //$NON-NLS-1$
	'no-unreachable' : '無法呼叫到的程式碼。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-params' : '從未使用參數 \'${0}\'。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-vars-unused' : '\'${0}\' 未使用。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-vars-unread' : '\'${0}\' 未讀取。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-use-before-define': '\'${0}\' 在定義之前便已使用。', //$NON-NLS-0$  //$NON-NLS-1$
	'semi': '遺漏分號。', //$NON-NLS-0$  //$NON-NLS-1$
	'throw-error': '改以擲出錯誤。', //$NON-NLS-0$  //$NON-NLS-1$
	'use-isnan': '使用 isNaN 函數來與 NaN 相互比較。', //$NON-NLS-0$  //$NON-NLS-1$
	'valid-typeof' : '無效的 typeof 比較。',  //$NON-NLS-0$ //$NON-NLS-1$
});

