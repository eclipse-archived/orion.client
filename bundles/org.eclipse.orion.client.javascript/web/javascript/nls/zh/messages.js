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
	'error': '错误',  //$NON-NLS-0$  //$NON-NLS-1$
	'warning' : '警告',  //$NON-NLS-0$  //$NON-NLS-1$
	'ignore' : '忽略',  //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutline' : '源大纲', //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutlineTitle': 'JavaScript 源大纲',  //$NON-NLS-0$  //$NON-NLS-1$
	'contentAssist' : 'JavaScript 内容辅助', //$NON-NLS-0$  //$NON-NLS-1$
	'eslintValidator' : 'JavaScript 验证器', //$NON-NLS-0$  //$NON-NLS-1$
	'missingCurly' : '语句未用花括号括起来：', //$NON-NLS-0$  //$NON-NLS-1$
	'noCaller' : '建议不要使用“arguments.caller”或“arguments.callee”，请使用：', //$NON-NLS-0$  //$NON-NLS-1$
	'noEqeqeq' : '建议不要使用“==”：', //$NON-NLS-0$  //$NON-NLS-1$
	'noDebugger' : '建议不要使用“debugger”语句：', //$NON-NLS-0$  //$NON-NLS-1$
	'noEval' : '建议不要使用“eval()”：', //$NON-NLS-0$  //$NON-NLS-1$
	'noDupeKeys' : '对象密钥重复：', //$NON-NLS-0$  //$NON-NLS-1$
	'useIsNaN' : 'NaN 未与 isNaN() 进行比较：', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncDecl' : '函数声明中没有 JSDoc：', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncExpr' : '函数表达式中没有 JSDoc：', //$NON-NLS-0$  //$NON-NLS-1$
	'noUnreachable' : '不可达代码：', //$NON-NLS-0$  //$NON-NLS-1$
	'noFallthrough' : 'switch case 跳转：', //$NON-NLS-0$  //$NON-NLS-1$
	'useBeforeDefine' : '在定义之前使用了成员：', //$NON-NLS-0$  //$NON-NLS-1$
	'noEmptyBlock' : '未记录的空块：', //$NON-NLS-0$  //$NON-NLS-1$
	'newParens' : '构造函数调用中缺少圆括号：', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewArray': '建议不要使用“new Array()”：', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewFunc': '建议不要使用“new Function()”：', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewObject': '建议不要使用“new Object()”：', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewWrappers': '建议不要使用包装器对象：', //$NON-NLS-0$  //$NON-NLS-1$
	'missingSemi' : '缺少分号：', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedVars' : '未使用的变量：', //$NON-NLS-0$  //$NON-NLS-1$
	'varRedecl' : '变量重复声明：', //$NON-NLS-0$  //$NON-NLS-1$
	'varShadow': '变量影子建立：', //$NON-NLS-0$  //$NON-NLS-1$
	'undefMember' : '未声明的全局引用：', //$NON-NLS-0$  //$NON-NLS-1$
	'unnecessarySemis' : '多余分号：', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedParams' : '未使用的参数：', //$NON-NLS-0$  //$NON-NLS-1$
	'unsupportedJSLint' : '不受支持的环境伪指令：',  //$NON-NLS-0$  //$NON-NLS-1$
	'throwError': '在“throw”中使用了 Non-Error：',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocName' : '生成元素注释',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocTooltip' : '为所选择的 JavaScript 元素生成类似于 JSDoc 的注释',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclName' : '打开声明',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclTooltip' : '打开所选元素的声明',  //$NON-NLS-0$  //$NON-NLS-1$
	'validTypeof': '无效的“typeof”比较',  //$NON-NLS-0$ //$NON-NLS-1$
	'noSparseArrays': '稀疏数组声明', //$NON-NLS-0$ //$NON-NLS-1$
	'jsHover': 'JavaScript 悬浮帮助提供程序', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixName': '移除多余分号', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixTooltip': '移除多余分号', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixName': '添加 $FALLTHROUGH$ 注释', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixTooltip': '添加 $FALLTHROUGH$ 行注释', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixName': '对空块进行注释', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixTooltip': '将待办事宜注释添加到空块', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixName': '添加到 eslint-env 伪指令', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixTooltip': '添加到 eslint-env 伪指令以过滤已知成员', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixName': '添加到 globals 伪指令', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixTooltip': '添加到 globals 伪指令以过滤未知成员', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixName': '移除参数', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixTooltip': '移除未使用的参数，保留副作用', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixName': '将 @callback 添加到函数', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixTooltip': '使用 @callback 记录函数，同时忽略未使用的参数', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixName': '更新运算符', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixTooltip': '将运算符更新为预期运算符', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixName': '移除不可达代码', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixTooltip': '移除不可达代码', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixName': '转换为正常数组', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixTooltip': '移除稀疏条目并转换为正常数组', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixName': '添加缺少的“;”', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixTooltip': '添加缺少的“;”', //$NON-NLS-0$ //$NON-NLS-1$
	'radix': '缺少 parseInt() 的 radix 参数', //$NON-NLS-0$ //$NON-NLS-1$
});

