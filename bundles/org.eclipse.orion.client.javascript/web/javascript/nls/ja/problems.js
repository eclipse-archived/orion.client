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
    'syntaxErrorIncomplete': '構文エラー。ステートメントが不完全です。',  //$NON-NLS-0$  //$NON-NLS-1$
    'syntaxErrorBadToken': 'トークン \'${0}\' に構文エラーがあります。このトークンを削除してください。',  //$NON-NLS-0$  //$NON-NLS-1$
    'esprimaParseFailure': 'エラーが発生したため Esprima がこのファイルを構文解析できませんでした: ${0}',  //$NON-NLS-0$ //$NON-NLS-1$
    'eslintValidationFailure': 'エラーが発生したため、ESLint はこのファイルを検証できませんでした: ${0}',  //$NON-NLS-0$  //$NON-NLS-1$
	'curly': 'ステートメントは中括弧で囲む必要があります。',  //$NON-NLS-0$  //$NON-NLS-1$
	'eqeqeq' : '\'${0}\' が必要ですが、代わりに \'${1}\' が見つかりました。',  //$NON-NLS-0$  //$NON-NLS-1$
	'missing-doc' : '関数 \'${0}\' にドキュメンテーションがありません。',  //$NON-NLS-0$  //$NON-NLS-1$
	'new-parens' : 'コンストラクター呼び出しに括弧がありません。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-debugger': '\'debugger\' ステートメントの使用は推奨されません。',  //$NON-NLS-0$  //$NON-NLS-1$
	'no-dupe-keys' : 'オブジェクト・キー \'${0}\' が重複しています。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-empty-block' : '空のブロックは削除するか、コメントを記述する必要があります。',  //$NON-NLS-0$ //$NON-NLS-1$
	'no-eval' : '${0} 関数呼び出しは推奨されません。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-extra-semi' : 'セミコロンは不要です。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-fallthrough' : 'switch 文において、case ラベルの処理後に break などが抜けている可能性があります。意図的である場合は、上記の行に新規コメント //$FALLTHROUGH$ を追加してください。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-jslint' : '\'${0}\' ディレクティブはサポートされません。eslint-env を使用してください。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-array' : '配列リテラル表記 \'[]\' を使用してください。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-func' : '関数コンストラクターが eval です。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-object' : 'オブジェクト・リテラル表記 \'{}\' または Object.create(null) を使用してください。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-wrappers' : '\'${0}\' をコンストラクターとして使用しないでください。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-redeclare' : '\'${0}\' は既に定義済みです。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-sparse-arrays': '疎配列宣言を回避してください。',  //$NON-NLS-0$ //$NON-NLS-1$
	'no-undef-defined' : '\'${0}\' は定義されていません。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-undef-readonly': '\'${0}\' は読み取り専用です。',  //$NON-NLS-0$  //$NON-NLS-1$
	'no-unreachable' : '到達不能コードです。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-params' : 'パラメーター \'${0}\' は使用されていません。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-vars-unused' : '\'${0}\' は未使用です。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-vars-unread' : '\'${0}\' は未読です。', //$NON-NLS-0$  //$NON-NLS-1$
	'no-use-before-define': '\'${0}\' は定義より先に使用されました。', //$NON-NLS-0$  //$NON-NLS-1$
	'semi': 'セミコロンがありません。', //$NON-NLS-0$  //$NON-NLS-1$
	'throw-error': '代わりに Error を throw してください。', //$NON-NLS-0$  //$NON-NLS-1$
	'use-isnan': 'NaN との比較には isNaN 関数を使用してください。', //$NON-NLS-0$  //$NON-NLS-1$
	'valid-typeof' : '無効な typeof 比較です。',  //$NON-NLS-0$ //$NON-NLS-1$
});

