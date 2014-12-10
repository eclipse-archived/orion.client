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
    'syntaxErrorIncomplete': '语法错误，语句不完整。',  //$NON-NLS-0$  //$NON-NLS-1$
    'syntaxErrorBadToken': '标记“${0}”上有语法错误，删除此标记。',  //$NON-NLS-0$  //$NON-NLS-1$
    'esprimaParseFailure': '由于发生了错误，Esprima 未能解析此文件：${0}',  //$NON-NLS-0$ //$NON-NLS-1$
    'eslintValidationFailure': '由于发生了错误，ESLint 未能验证此文件：${0}',  //$NON-NLS-0$  //$NON-NLS-1$
	'curly': '语句应该用花括号括起来。',  //$NON-NLS-0$  //$NON-NLS-1$
	'eqeqeq' : '期望是“${0}”，而实际看到的是“${1}”。',  //$NON-NLS-0$  //$NON-NLS-1$
	'missing-doc' : '缺少函数“${0}”的文档。',  //$NON-NLS-0$  //$NON-NLS-1$
	'new-parens' : '调用构造函数时缺少圆括号。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-debugger': '建议不要使用“debugger”语句。',  //$NON-NLS-0$  //$NON-NLS-1$
	'no-dupe-keys' : '对象密钥“${0}”重复。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-empty-block' : '应当除去或者注释掉空块。',  //$NON-NLS-0$ //$NON-NLS-1$
	'no-eval' : '建议不要使用 ${0} 函数调用。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-extra-semi' : '不需要分号。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-fallthrough' : '输入的 switch case 可能与先前的 case 交叉。如果您愿意，请对上面这一行添加新的注释 //$FALLTHROUGH$。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-jslint' : '不支持“${0}”伪指令，请使用 eslint-env。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-array' : '请使用数组字面值表示法“[]”。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-func' : '对 Function 构造函数进行了求值。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-object' : '请使用对象字面值表示法 \'{}\' 或者 Object.create(null)。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-wrappers' : '请勿使用“${0}”作为构造函数。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-redeclare' : '已定义“${0}”。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-sparse-arrays': '应避免稀疏数组声明。',  //$NON-NLS-0$ //$NON-NLS-1$
	'no-undef-defined' : '未定义“${0}”。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-undef-readonly': '“${0}”是只读的。',  //$NON-NLS-0$  //$NON-NLS-1$
	'no-unreachable' : '不可达代码。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-params' : '从未使用参数“${0}”。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-vars-unused' : '未使用“${0}”。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-vars-unread' : '未读取“${0}”。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-use-before-define': '“${0}”在定义之前就已使用。', //$NON-NLS-0$  //$NON-NLS-1$
	'semi': '缺少分号。', //$NON-NLS-0$  //$NON-NLS-1$
	'throw-error': '抛出了错误。', //$NON-NLS-0$  //$NON-NLS-1$
	'use-isnan': '请使用 isNaN 函数与 NaN 进行比较。', //$NON-NLS-0$  //$NON-NLS-1$
	'valid-typeof' : '无效的 typeof 比较。',  //$NON-NLS-0$ //$NON-NLS-1$
});

