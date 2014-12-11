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
	'htmlOutline' : 'HTML アウトライン', //$NON-NLS-0$  //$NON-NLS-1$
	'cssOutline' : 'CSS ルール・アウトライン', //$NON-NLS-0$  //$NON-NLS-1$
	'htmlContentAssist' : 'HTML コンテンツ・アシスト', //$NON-NLS-0$  //$NON-NLS-1$
	'cssContentAssist' : 'CSS コンテンツ・アシスト', //$NON-NLS-0$  //$NON-NLS-1$
	'cssHover' : 'CSS Hover', //$NON-NLS-0$  //$NON-NLS-1$
	'csslintValidator' : 'CSS の検証', //$NON-NLS-0$  //$NON-NLS-1$
	
	'ignore' : '無視', //$NON-NLS-0$  //$NON-NLS-1$
	'warning' : '警告', //$NON-NLS-0$  //$NON-NLS-1$
	'error' : 'エラー', //$NON-NLS-0$  //$NON-NLS-1$
	
	'adjoining-classes': '隣接クラスを許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'box-model': 'ボックス・サイズの破損に注意:', //$NON-NLS-0$  //$NON-NLS-1$
	'box-sizing': 'box-sizing の使用を許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'bulletproof-font-face': '確実な @font-face 構文を使用:', //$NON-NLS-0$  //$NON-NLS-1$
	'compatible-vendor-prefixes': '互換性のあるベンダー・プレフィックスが必要:', //$NON-NLS-0$  //$NON-NLS-1$
	'display-property-grouping': '表示に適したプロパティーが必要:', //$NON-NLS-0$  //$NON-NLS-1$
	'duplicate-background-images': '重複した背景イメージを許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'duplicate-properties': '重複したプロパティーを許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'empty-rules': '空の rules を許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'fallback-colors': 'フォールバックにカラーが必要:', //$NON-NLS-0$  //$NON-NLS-1$
	'floats': '多すぎる float を許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'font-faces': '多すぎる Web フォントを使用しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'font-sizes': '多すぎるフォント・サイズを許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'gradients': 'すべてのグラデーション定義が必要:', //$NON-NLS-0$  //$NON-NLS-1$
	'ids': 'セレクターに ID を許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'import': '@import を許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'important': '!important を許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'known-properties': '既知のプロパティーの使用が必要:', //$NON-NLS-0$  //$NON-NLS-1$
	'outline-none': 'outline: none を許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'overqualified-elements': '必要以上に修飾された要素を許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'qualified-headings': '修飾された見出しを許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'regex-selectors': '正規表現のように見えるセレクターを許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'rules-count': 'ルールのカウント:', //$NON-NLS-0$  //$NON-NLS-1$
	'selector-max-approaching': 'IE のセレクター制限 4095 に近づくと警告:', //$NON-NLS-0$  //$NON-NLS-1$
	'selector-max': 'IE のセレクター制限 4095 を超えるとエラー:', //$NON-NLS-0$  //$NON-NLS-1$
	'shorthand': 'プロパティーの省略表現が必要:', //$NON-NLS-0$  //$NON-NLS-1$
	'star-property-hack': 'スター・プレフィックスを持つプロパティーを許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'text-indent': '負の text-indent を許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'underscore-property-hack': 'アンダースコアのプレフィックスを持つプロパティーを許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'unique-headings': '見出しの定義を 1 回のみとする:', //$NON-NLS-0$  //$NON-NLS-1$
	'universal-selector': '全称セレクターを許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'unqualified-attributes': '修飾されていない属性セレクターを許可しない:', //$NON-NLS-0$  //$NON-NLS-1$
	'vendor-prefix': 'ベンダー・プレフィックスを持つ標準プロパティーが必要:', //$NON-NLS-0$  //$NON-NLS-1$
	'zero-units': '0 値には単位を許可しない:' //$NON-NLS-0$  //$NON-NLS-1$
});

