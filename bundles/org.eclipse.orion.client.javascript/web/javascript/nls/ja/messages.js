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
	'error': 'エラー',  //$NON-NLS-0$  //$NON-NLS-1$
	'warning' : '警告',  //$NON-NLS-0$  //$NON-NLS-1$
	'ignore' : '無視',  //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutline' : 'ソース・アウトライン', //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutlineTitle': 'JavaScript ソース・アウトライン',  //$NON-NLS-0$  //$NON-NLS-1$
	'contentAssist' : 'JavaScript コンテンツ・アシスト', //$NON-NLS-0$  //$NON-NLS-1$
	'eslintValidator' : 'JavaScript の検証', //$NON-NLS-0$  //$NON-NLS-1$
	'missingCurly' : 'ステートメントが波括弧で囲まれていない:', //$NON-NLS-0$  //$NON-NLS-1$
	'noCaller' : '非推奨の \'arguments.caller\' または \'arguments.callee\' の使用:', //$NON-NLS-0$  //$NON-NLS-1$
	'noEqeqeq' : '非推奨の \'==\' の使用:', //$NON-NLS-0$  //$NON-NLS-1$
	'noDebugger' : '非推奨の \'debugger\' ステートメントの使用:', //$NON-NLS-0$  //$NON-NLS-1$
	'noEval' : '非推奨の \'eval()\' の使用:', //$NON-NLS-0$  //$NON-NLS-1$
	'noDupeKeys' : 'オブジェクト・キーの重複:', //$NON-NLS-0$  //$NON-NLS-1$
	'useIsNaN' : 'NaN の比較に isNaN() が使用されていない:', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncDecl' : '関数宣言に JSDoc がない:', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncExpr' : '関数式に JSDoc がない:', //$NON-NLS-0$  //$NON-NLS-1$
	'noUnreachable' : '到達不能コード:', //$NON-NLS-0$  //$NON-NLS-1$
	'noFallthrough' : 'switch case のフォールスルー', //$NON-NLS-0$  //$NON-NLS-1$
	'useBeforeDefine' : '定義前にメンバーを使用:', //$NON-NLS-0$  //$NON-NLS-1$
	'noEmptyBlock' : '何も記述のない空のブロック:', //$NON-NLS-0$  //$NON-NLS-1$
	'newParens' : 'コンストラクター呼び出しに括弧がない:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewArray': '非推奨の \'new Array()\':', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewFunc': '非推奨の \'new Function()\':', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewObject': '非推奨の \'new Object()\':', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewWrappers': '非推奨のラッパー・オブジェクト:', //$NON-NLS-0$  //$NON-NLS-1$
	'missingSemi' : '欠落しているセミコロン:', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedVars' : '未使用の変数:', //$NON-NLS-0$  //$NON-NLS-1$
	'varRedecl' : '変数の再宣言:', //$NON-NLS-0$  //$NON-NLS-1$
	'varShadow': '変数のシャドーイング:', //$NON-NLS-0$  //$NON-NLS-1$
	'undefMember' : '宣言されていないグローバル参照:', //$NON-NLS-0$  //$NON-NLS-1$
	'unnecessarySemis' : '不要なセミコロン:', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedParams' : '未使用のパラメーター:', //$NON-NLS-0$  //$NON-NLS-1$
	'unsupportedJSLint' : 'サポートされない環境ディレクティブ:',  //$NON-NLS-0$  //$NON-NLS-1$
	'throwError': '\'throw\' で Error 以外を使用:',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocName' : '要素コメントの生成',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocTooltip' : '選択した JavaScript 要素に JSDoc 形式コメントを生成',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclName' : '宣言を開く',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclTooltip' : '選択された要素の宣言を開きます',  //$NON-NLS-0$  //$NON-NLS-1$
	'validTypeof': '無効な「typeof」比較',  //$NON-NLS-0$ //$NON-NLS-1$
	'noSparseArrays': '疎配列宣言', //$NON-NLS-0$ //$NON-NLS-1$
	'jsHover': 'JavaScript Hover プロバイダー', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixName': '余分なセミコロンの削除', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixTooltip': '余分なセミコロンを削除します', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixName': '$FALLTHROUGH$ コメントの追加', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixTooltip': '$FALLTHROUGH$ 行コメントを追加します', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixName': '空ブロックのコメント', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixTooltip': '空ブロックに TODO コメントを追加します', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixName': 'eslint-env ディレクティブに追加', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixTooltip': 'eslint-env ディレクティブに追加して、既知のメンバーをフィルター処理します', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixName': 'globals ディレクティブに追加', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixTooltip': 'globals ディレクティブに追加して、不明メンバーをフィルター処理します', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixName': 'パラメーターの削除', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixTooltip': '未使用のパラメーターを削除し、副次作用を保持します', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixName': '@callback を関数に追加', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixTooltip': '@callback を使用して関数を文書化し、未使用のパラメーターを無視します', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixName': '演算子の更新', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixTooltip': '演算子を、予期されているものに更新します', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixName': '到達不能コードの削除', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixTooltip': '到達不能コードを削除します', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixName': '標準配列に変換', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixTooltip': '疎項目を削除し、標準配列に変換します', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixName': '欠落している\';\' の追加', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixTooltip': '欠落している \';\' を追加します', //$NON-NLS-0$ //$NON-NLS-1$
	'radix': 'parseInt() への基数パラメーターがありません', //$NON-NLS-0$ //$NON-NLS-1$
});

