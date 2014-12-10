/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 ******************************************************************************/

/*eslint-env browser, amd*/
//NLS_CHARSET=UTF-8

define({
	"Editor": "エディター", //$NON-NLS-1$ //$NON-NLS-0$
	"switchEditor": "エディターの切り替え", //$NON-NLS-1$ //$NON-NLS-0$
	"Fetching": "取り出し中: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"confirmUnsavedChanges": "保存されていない変更があります。 このままナビゲートしますか?", //$NON-NLS-1$ //$NON-NLS-0$
	"searchFiles": "クイック検索...", //$NON-NLS-1$ //$NON-NLS-0$
	"searchTerm": "検索語を入力してください:", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedChanges": "保存されていない変更があります。", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedAutoSaveChanges": "自動保存が完了するまでこのページを開いておいてください。", //$NON-NLS-1$ //$NON-NLS-0$
	"Save": "保存", //$NON-NLS-1$ //$NON-NLS-0$
	"Saved": "保存済み", //$NON-NLS-1$ //$NON-NLS-0$
	"Blame": "変更履歴", //$NON-NLS-1$ //$NON-NLS-0$
	"BlameTooltip":"変更履歴注釈の表示", //$NON-NLS-1$ //$NON-NLS-0$
	"saveOutOfSync": "リソースは、サーバーと同期がとれていません。 このまま保存しますか?", //$NON-NLS-1$ //$NON-NLS-0$
	"loadOutOfSync": "リソースは、サーバーと同期がとれていません。 ロードしますか? この処理により、ローカルの変更内容が上書きされます。", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadata": "${0} のメタデータの読み取り中", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadataError": "${0} のメタデータを取得できません", //$NON-NLS-1$ //$NON-NLS-0$
	"Reading": "${0} の読み取り中です", //$NON-NLS-1$ //$NON-NLS-0$
	"readonly": "読み取り専用", //$NON-NLS-1$ //$NON-NLS-0$
	"saveFile": "このファイルを保存", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleZoomRuler": "ズーム・ルーラーを切り替え", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "指定行へジャンプ...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLineTooltip": "行番号を指定してジャンプ", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompt": "移動先の行:", //$NON-NLS-1$ //$NON-NLS-0$
	"Undo": "元に戻す", //$NON-NLS-1$ //$NON-NLS-0$
	"Redo": "やり直し", //$NON-NLS-1$ //$NON-NLS-0$
	"Find": "検索...", //$NON-NLS-1$ //$NON-NLS-0$
	"noResponse": "サーバーからの応答がありません。インターネット接続を確認してから、再試行してください。", //$NON-NLS-1$ //$NON-NLS-0$
	"savingFile": "ファイル ${0} を保存中", //$NON-NLS-1$ //$NON-NLS-0$
	"running": "${0} を実行中", //$NON-NLS-1$ //$NON-NLS-0$
	"Saving..." : "保存中...", //$NON-NLS-1$ //$NON-NLS-0$
	"View": "表示", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanel": "サイド・パネル", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanelTooltip": "サイド・パネルの表示内容を選択します。", //$NON-NLS-1$ //$NON-NLS-0$
	"Slideout": "Slideout", //$NON-NLS-1$ //$NON-NLS-0$
	"Actions": "アクション", //$NON-NLS-1$ //$NON-NLS-0$
	"Navigator": "ナビゲーター", //$NON-NLS-1$ //$NON-NLS-0$
	"FolderNavigator": "フォルダー・ナビゲーター", //$NON-NLS-1$ //$NON-NLS-0$
	"Project": "プロジェクト", //$NON-NLS-1$ //$NON-NLS-0$
	"New": "新規", //$NON-NLS-1$ //$NON-NLS-0$
	"File": "ファイル", //$NON-NLS-1$ //$NON-NLS-0$
	"Edit": "編集", //$NON-NLS-1$ //$NON-NLS-0$
	"Tools": "ツール", //$NON-NLS-1$ //$NON-NLS-0$
	"Add": "追加", //$NON-NLS-1$ //$NON-NLS-0$
	"noActions": "現在の選択項目に使用できるアクションはありません。", //$NON-NLS-1$ //$NON-NLS-0$
	"NoFile": "新しいファイルやフォルダーを作成するには ${0} を使用してください。ファイルをクリックすると、コーディングが開始します。", //$NON-NLS-1$ //$NON-NLS-0$
	"LocalEditorSettings": "ローカル・エディター設定", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProject": "${0} はプロジェクトではありません。プロジェクトに変換するには ${1} を使用してください。", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProjects": "ワークスペースにプロジェクトがありません。${0} メニューを使用してプロジェクトを作成してください。", //$NON-NLS-1$ //$NON-NLS-0$
	"Disconnected": "${0} (切断)", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFS": "ファイル・システムの選択", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFSTooltip": "表示するファイル・システムを選択します。", //$NON-NLS-1$ //$NON-NLS-0$
	"FSTitle": "${0} (${1})", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy": "デプロイ", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy As": "形式を指定してデプロイ", //$NON-NLS-1$ //$NON-NLS-0$
	"Import": "インポート", //$NON-NLS-1$ //$NON-NLS-0$
	"Export": "エクスポート", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenWith": "アプリケーションから開く", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenRelated": "関連項目を開く", //$NON-NLS-1$ //$NON-NLS-0$
	"Dependency": "依存関係", //$NON-NLS-1$ //$NON-NLS-0$
	"UnnamedCommand": "名前なし", //$NON-NLS-1$ //$NON-NLS-0$
	"searchInFolder": "フォルダー内で検索...",  //$NON-NLS-1$ //$NON-NLS-0$
	"Global Search": "グローバル・サーチ...", //$NON-NLS-1$ //$NON-NLS-0$
	"ClickEditLabel": "編集するにはクリックします", //$NON-NLS-1$ //$NON-NLS-0$
	"ProjectInfo": "プロジェクト情報", //$NON-NLS-1$ //$NON-NLS-0$
	"DeployInfo": "デプロイメント情報", //$NON-NLS-1$ //$NON-NLS-0$
	"Name": "名前", //$NON-NLS-1$ //$NON-NLS-0$
	"Description": "説明", //$NON-NLS-1$ //$NON-NLS-0$
	"Site": "サイト", //$NON-NLS-1$ //$NON-NLS-0$
	'projectsSectionTitle': 'プロジェクト',  //$NON-NLS-0$  //$NON-NLS-1$
	'listingProjects': 'プロジェクトのリストを作成中...',  //$NON-NLS-0$  //$NON-NLS-1$
	'gettingWorkspaceInfo': 'ワークスペース情報を取得中...',  //$NON-NLS-0$  //$NON-NLS-1$
	"showProblems": "問題を表示...",  //$NON-NLS-1$ //$NON-NLS-0$
});

