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
	"Compare": "比較", //$NON-NLS-0$  //$NON-NLS-1$
	"View the side-by-side compare": "並列比較の表示", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirVer": "作業ディレクトリーを開く", //$NON-NLS-0$  //$NON-NLS-1$
	"Working Directory": "作業ディレクトリー", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewWorkingDirVer": "ファイルの作業ディレクトリーのバージョンを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading...": "ロード中...", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories": "すべての Git リポジトリー", //$NON-NLS-0$  //$NON-NLS-1$
	"Repo": "リポジトリー", //$NON-NLS-0$  //$NON-NLS-1$
	"0 on 1 - Git": "${0} (${1} 上) - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Git": "Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in eclipse.org": "eclipse.org で表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in GitHub": "GitHub で表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in GitHub": "GitHub でこのリポジトリーを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit Details": "詳細をコミット", //$NON-NLS-0$  //$NON-NLS-1$
	"No Commits": "コミットなし", //$NON-NLS-0$  //$NON-NLS-1$
	"commit: 0": "コミット: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"parent: 0": "親: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"authored by 0 (1) on 2": "作成者: ${0} <${1}> 日時: ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"committed by 0 (1)": "コミット担当者: ${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"committedby": "コミット担当者 ", //$NON-NLS-0$  //$NON-NLS-1$
	"authoredby": "作成者", //$NON-NLS-0$  //$NON-NLS-1$
	"on": " 作成日: ", //$NON-NLS-0$  //$NON-NLS-1$
	"nameEmail": "${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags:": "タグ:", //$NON-NLS-0$  //$NON-NLS-1$
	"No Tags": "タグなし", //$NON-NLS-0$  //$NON-NLS-1$
	"Diffs": "変更", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirChanges": "作業ディレクトリーの変更", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChanges": "変更のコミット", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChangesDialog": "変更のコミット", //$NON-NLS-0$  //$NON-NLS-1$
	"more": "詳細...", //$NON-NLS-0$  //$NON-NLS-1$
	"less": "簡略...", //$NON-NLS-0$  //$NON-NLS-1$
	"More": "その他", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFiles" : "追加のファイル", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFilesProgress": "追加のファイルをロード中...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommits": "\"${0}\" の追加のコミット", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommitsProgress": "\"${0}\" の追加のコミットをロード中...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranches": "\"${0}\" の追加のブランチ", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranchesProgress": "\"${0}\" の追加のブランチをロード中...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTags": "追加のタグ", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTagsProgress": "追加のタグをロード中...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashes": "追加のスタッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashesProgress": "追加のスタッシュをロード中...", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading git log...": "git ログのロード中...", //$NON-NLS-0$  //$NON-NLS-1$
	"local": "ローカル", //$NON-NLS-0$  //$NON-NLS-1$
	"remote": "リモート", //$NON-NLS-0$  //$NON-NLS-1$
	"View All": "すべて表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Error ${0}: ": "エラー ${0}: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading ": "ロード中 ", //$NON-NLS-0$  //$NON-NLS-1$
	"Message": "メッセージ", //$NON-NLS-0$  //$NON-NLS-1$
	"Author": "作成者", //$NON-NLS-0$  //$NON-NLS-1$
	"Date": "日付", //$NON-NLS-0$  //$NON-NLS-1$
	"fromDate:": "開始日:", //$NON-NLS-0$  //$NON-NLS-1$
	"toDate:": "終了日:", //$NON-NLS-0$  //$NON-NLS-1$
	"Actions": "アクション", //$NON-NLS-0$  //$NON-NLS-1$
	"Branches": "ブランチ", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags": "タグ", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage": "ステージ", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged removal": "未ステージの削除", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage": "ステージ解除", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged removal": "ステージ済み削除", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged change": "未ステージの変更", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged change": "ステージ済み変更", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged add": "未ステージの追加", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged add": "ステージ済み追加", //$NON-NLS-0$  //$NON-NLS-1$
	"Addition": "追加", //$NON-NLS-0$  //$NON-NLS-1$
	"Deletion": "削除", //$NON-NLS-0$  //$NON-NLS-1$
	"Resolve Conflict": "競合の解決", //$NON-NLS-0$  //$NON-NLS-1$
	"Conflicting": "競合", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message": "コミット・メッセージ", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit": "コミット", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitTooltip": "指定されたメッセージを選択されたファイルに付けてコミットします。", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthMsgLink":"${0} の認証が必要です。<a target=\"_blank\" href=\"${1}\">${2}</a> の後、要求を再試行してください。</span>", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCommit": "コミット・メッセージを入力", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCountCommit": "${0} ファイルをコミット", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend last commit": "最後のコミットの修正", //$NON-NLS-0$  //$NON-NLS-1$
	" Amend": " 修正", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress. Choose action:": "リベース進行中。 アクションを選択してください:", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgress": "リベース進行中", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseTip": "アクティブ・ブランチからコミットを削除し、「${0}」の最新の状態に基づいてアクティブ・ブランチを再開してから、各コミットを更新済みのアクティブ・ブランチに再び適用することによって、コミットをリベースします。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebasingRepo": "Git リポジトリーのリベース", //$NON-NLS-0$  //$NON-NLS-1$
	"AddingConfig": "Git 構成プロパティーの追加: キー=${0} 値=${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"EditingConfig": "Git　構成プロパティーの編集: キー=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"DeletingConfig": "Git 構成プロパティーの削除: キー=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"AddClone": "リポジトリーのクローン作成: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgressDetails": "ブランチのリベース進行中。\n\n\t競合をマージし、すべてのファイルを選択して続行してください。\n\t現在のパッチをバイパスするにはスキップを選択します。\n\t中断を選択すると、いつでもリベースを終了できます。", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer name:": "コミット担当者名:", //$NON-NLS-0$  //$NON-NLS-1$
	"Name:": "名前:", //$NON-NLS-0$  //$NON-NLS-1$
	"email:": "E メール:", //$NON-NLS-0$  //$NON-NLS-1$
	"Email:": "E メール: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Author name: ": "作成者名: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged": "未ステージ", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged": "ステージ済み", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangedFiles": "変更されたファイル", //$NON-NLS-0$  //$NON-NLS-1$
	"Recent commits on": "最近のコミット", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status": "Git 状況", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Status": "このファイルまたはフォルダーを含むリポジトリーの Git 状況ページを開きます。", //$NON-NLS-0$  //$NON-NLS-1$
	"GetGitIncomingMsg": "git 着信変更の取得...", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout": "チェックアウト", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out...": "チェックアウト中...", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage the change": "変更をステージ", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging...": "ステージング...", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutSelectedFiles": "選択した全ファイルをチェックアウト (変更はすべて破棄)", //$NON-NLS-0$  //$NON-NLS-1$
	"AddFilesToGitignore" : "選択されたすべてのファイルを .gitignore ファイルに追加", //$NON-NLS-0$  //$NON-NLS-1$
	"Writing .gitignore rules" : ".gitignore 規則を書き込み中", //$NON-NLS-0$  //$NON-NLS-1$ 
	"Save Patch": "パッチの保存", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage the change": "変更をステージ解除", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaging...": "ステージ解除中...", //$NON-NLS-0$  //$NON-NLS-1$
	"Undo": "元に戻す", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoTooltip": "このコミットを元に戻し、変更されたすべてのファイルを保持し、作業ディレクトリーには変更を加えません。", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoConfirm": "アクティブ・ブランチのコンテンツがコミット「${0}」に置換されます。コミットに含まれるすべての変更と作業ディレクトリーは保持されます。実行しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"Reset": "リセット", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetConfirm": "作業ディレクトリーおよび索引に含まれる未ステージとステージ済みのすべての変更は破棄され、復旧できません。\n\n続行しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutConfirm" : "選択したファイルに加えた変更は破棄され、復旧できません。\n\n続行しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetBranchDiscardChanges": "ブランチをリセット (ステージ済み変更と未ステージの変更をすべて破棄)", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesIndexDiscardedMsg": "作業ディレクトリーおよび索引に含まれる未ステージとステージ済みのすべての変更は破棄され、復旧できません。", //$NON-NLS-0$  //$NON-NLS-1$
	"ContinueMsg": "続行しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"KeepWorkDir" : "作業ディレクトリーを保持", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes...": "ローカル変更のリセット中...", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue rebase...": "リベースの続行...", //$NON-NLS-0$  //$NON-NLS-1$
	"Skipping patch...": "パッチをスキップ中...", //$NON-NLS-0$  //$NON-NLS-1$
	"Aborting rebase...": "リベースを中断中...", //$NON-NLS-0$  //$NON-NLS-1$
	"Complete log": "ログ完了", //$NON-NLS-0$  //$NON-NLS-1$
	"local VS index": "ローカル VS 索引", //$NON-NLS-0$  //$NON-NLS-1$
	"index VS HEAD": "索引 VS HEAD", //$NON-NLS-0$  //$NON-NLS-1$
	"Compare(${0} : ${1})": "比較 (${0} : ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading status...": "状況のロード中...", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing...": "コミット中...", //$NON-NLS-0$  //$NON-NLS-1$
	"The author name is required.": "作成者の名前が必要です。", //$NON-NLS-0$  //$NON-NLS-1$
	"The author mail is required.": "作成者のメールが必要です。", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoConflict": ". リポジトリーにまだ競合が含まれています。", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoUnmergedPathResolveConflict": ". リポジトリーに、アンマージされているパスが含まれています。 最初に競合を解決してください。", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering ${0}": "${0} のレンダリング", //$NON-NLS-0$  //$NON-NLS-1$
	"Configuration": "構成", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting configuration of": "${0} の構成の取得中", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting git repository details": "Git リポジトリー詳細の取得中", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting changes": "変更の取得中", //$NON-NLS-0$  //$NON-NLS-1$
	" - Git": " - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories - Git": "リポジトリー - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository": "リポジトリー", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository Not Found": "リポジトリーが見つかりません", //$NON-NLS-0$  //$NON-NLS-1$
	"No Repositories": "リポジトリーがありません", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repository": "リポジトリーのロード中", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repositories": "リポジトリーのロード中", //$NON-NLS-0$  //$NON-NLS-1$
	"(no remote)": "(リモートなし)", //$NON-NLS-0$  //$NON-NLS-1$
	"location: ": "ロケーション: ", //$NON-NLS-0$  //$NON-NLS-1$
	"NumFilesStageAndCommit": "ステージするファイル: ${0} 個、コミットするファイル: ${1} 個", //$NON-NLS-0$  //$NON-NLS-1$
 	"Nothing to commit.": "コミットするものがありません。", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing to push.": "プッシュするものがありません。", //$NON-NLS-0$  //$NON-NLS-1$
	"NCommitsToPush": "プッシュするコミット ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"You have no changes to commit.": "コミットする変更はありません。", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress!": "リベース進行中", //$NON-NLS-0$  //$NON-NLS-1$
	"View all local and remote tracking branches": "ローカルおよびリモートのトラッキング・ブランチのすべてを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"tracksNoBranch": "トラックするブランチなし", //$NON-NLS-0$  //$NON-NLS-1$
	"tracks": "トラック ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"last modified ${0} by ${1}": "最終変更日時 ${0} (変更者 ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remote Branches": "リモート・ブランチなし", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering branches": "ブランチのレンダリング", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits": "コミット", //$NON-NLS-0$  //$NON-NLS-1$
	"GettingCurrentBranch": "${0} の現在のブランチの取得中", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Log": "ログ全体を参照", //$NON-NLS-0$  //$NON-NLS-1$
	"See the full log": "ログ全体を参照", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting commits for \"${0}\" branch": "\"${0}\" ブランチのコミット取得", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering commits": "コミットのレンダリング", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting outgoing commits": "発信コミットの取得", //$NON-NLS-0$  //$NON-NLS-1$
	"The branch is up to date.": "ブランチは最新です。", //$NON-NLS-0$  //$NON-NLS-1$
	"NoOutgoingIncomingCommits": "発信コミットも着信コミットもありません。", //$NON-NLS-0$  //$NON-NLS-1$
 	") by ": ") by ", //$NON-NLS-0$  //$NON-NLS-1$
	" (SHA ": " (SHA ", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting tags": "タグ取得", //$NON-NLS-0$  //$NON-NLS-1$
	"View all tags": "全タグの表示", //$NON-NLS-0$  //$NON-NLS-1$
	" on ": " 作成日: ", //$NON-NLS-0$  //$NON-NLS-1$
	" by ": " 条件: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Remotes": "リモート", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering remotes": "リモートのレンダリング", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remotes": "リモートなし", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged addition": "未ステージの追加", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged addition": "ステージ済み追加", //$NON-NLS-0$  //$NON-NLS-1$
	" (Rebase in Progress)": " (リベース進行中)", //$NON-NLS-0$  //$NON-NLS-1$
	"Status": "状況", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0)": "ログ (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0) - 1": "ログ (${0}) - ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Status for ${0} - Git ": "${0} の状況 - Git ", //$NON-NLS-0$  //$NON-NLS-1$
	"No Unstaged Changes": "未ステージの変更なし", //$NON-NLS-0$  //$NON-NLS-1$
	"No Staged Changes": "ステージ済みの変更なし", //$NON-NLS-0$  //$NON-NLS-1$
	"Changes for \"${0}\" branch": "${0} の変更", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch": "${0} のコミット", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch against": "\"${0}\" ブランチのコミットと比較:", //$NON-NLS-0$  //$NON-NLS-1$
	"Add Remote": "リモートの追加", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Name:": "リモート名", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote URI:": "リモートの URI:", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply Patch": "パッチの適用", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyPatchDialog": "パッチの適用", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Repository": "Git リポジトリー", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the git repository": "このファイルまたはフォルダーの Git リポジトリー・ページを開きます。", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Git Repository": "Git リポジトリーのクローン", //$NON-NLS-0$  //$NON-NLS-1$
	"CloneGitRepositoryDialog": "Git リポジトリーのクローン", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository URL:": "リポジトリー URL:", //$NON-NLS-0$  //$NON-NLS-1$
	"Existing directory:": "既存のディレクトリー:", //$NON-NLS-0$  //$NON-NLS-1$
	"New folder:": "新規フォルダー:", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseFolderDialog": "フォルダーの選択", //$NON-NLS-0$  //$NON-NLS-1$
	"Message:": "メッセージ:", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend:": "修正:", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartAmend": "前のコミットの修正", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangeId:": "変更 ID:", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartChangeId": "メッセージへの変更 ID の追加", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Name:": "コミット担当者名:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Email:": "コミット担当者の E メール:", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorNamePlaceholder": "作成者名の入力", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorEmailPlaceholder": "作成者の E メールの入力", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterNamePlaceholder": "コミッターの名前の入力", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterEmailPlaceholder": "コミッターの E メールの入力", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Name:": "作成者名:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Email:": "作成者の E メール:", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit message is required.": "コミット・メッセージが必要です。", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Credentials": "Git 資格情報", //$NON-NLS-0$  //$NON-NLS-1$
	"Username:": "ユーザー名:", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key:": "秘密鍵:", //$NON-NLS-0$  //$NON-NLS-1$
	"Passphrase (optional):": "パスフレーズ (オプション):", //$NON-NLS-0$  //$NON-NLS-1$
	"commit:": "コミット: ", //$NON-NLS-0$  //$NON-NLS-1$
	"parent:": "親: ", //$NON-NLS-0$  //$NON-NLS-1$
	"branches: ": "ブランチ: ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags: ": "タグ: ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags": "タグ", //$NON-NLS-0$  //$NON-NLS-1$
	" authored by ${0} {${1}) on ${2}": " 作成者: ${0} (${1}) (日時: ${2})", //$NON-NLS-0$  //$NON-NLS-1$
	"Content": "コンテンツ", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to ${0} section": "${0} セクションにジャンプ", //$NON-NLS-0$  //$NON-NLS-1$
	"Type the commit name (sha1):": "コミットの名前を入力 (sha1):", //$NON-NLS-0$  //$NON-NLS-1$
	"Search": "検索", //$NON-NLS-0$  //$NON-NLS-1$
	"Searching...": "検索中...", //$NON-NLS-0$  //$NON-NLS-1$
	"SelectAll": "すべて選択", //$NON-NLS-0$  //$NON-NLS-1$
	"Looking for the commit": "コミットを検索中", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch:": "新規ブランチ:", //$NON-NLS-0$  //$NON-NLS-1$
	"No remote selected": "リモートが選択されていません", //$NON-NLS-0$  //$NON-NLS-1$
	"Enter a name...": "名前の入力...", //$NON-NLS-0$  //$NON-NLS-1$
	"OK": "OK", //$NON-NLS-0$  //$NON-NLS-1$
	"Cancel": "キャンセル", //$NON-NLS-0$  //$NON-NLS-1$
	"Clear": "クリア", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter": "フィルター", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommits": "コミットのフィルター", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommitsTip": "「コミットのフィルター」パネルを切り替えます", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeCmd": "最大化", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeTip": "エディターの状態の最大化を切り替えます", //$NON-NLS-0$  //$NON-NLS-1$
	" [New branch]": " [新規ブランチ]", //$NON-NLS-0$  //$NON-NLS-1$
	"AddKeyToHostContinueOp": "ホスト ${1} の ${0} キーを追加して操作を続行しますか? キー fingerpt は ${2} です。", //$NON-NLS-0$  //$NON-NLS-1$
 	"Link Repository": "リポジトリーのリンク", //$NON-NLS-0$  //$NON-NLS-1$
	"Folder name:": "フォルダー名:", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository was linked to ": "リポジトリーのリンク先 ", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutCommitTooltip": "このコミットをチェックアウトし、そのコンテンツに基づいてローカル・ブランチを作成します。", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutTagTooltip": "このタグをチェックアウトし、そのコンテンツに基づいてローカル・ブランチを作成します。", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out ${0}": "${0} をチェックアウト中", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutBranchMsg": "ブランチまたは対応するローカル・ブランチをチェックアウトして、それをアクティブにします。 リモート・トラッキング・ブランチに対応するローカル・ブランチがない場合、まずローカル・ブランチが作成されます。", //$NON-NLS-0$  //$NON-NLS-1$
 	"Checking out branch...": "ブランチのチェックアウト中", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding branch ${0}...": "ブランチ ${0} の追加中", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing branch ${0}...": "ブランチ ${0} の削除中", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding remote ${0}...": "リモート ${0} の追加中", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote ${0}...": "リモート ${0} の削除中", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing repository ${0}": "リポジトリー ${0} の削除中", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding tag {$0}": "タグ {$0} の追加中", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing tag {$0}": "タグ {$0} の削除中", //$NON-NLS-0$  //$NON-NLS-1$
	"Merging ${0}": "${0} のマージ中", //$NON-NLS-0$  //$NON-NLS-1$
	'Unstaging changes' : '変更のステージ解除中', //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out branch ${0}...": "ブランチ ${0} のチェックアウト中", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch checked out.": "ブランチがチェックアウトされました。", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch": "新規ブランチ", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new local branch to the repository": "新規ローカル・ブランチをリポジトリーに追加", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch name": "ブランチ名", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete": "削除", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the local branch from the repository": "リポジトリーからローカル・ブランチを削除", //$NON-NLS-0$  //$NON-NLS-1$
	"DelBrConfirm": "ブランチ ${0} を削除しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote tracking branch from the repository": "リポジトリーからリモート・トラッキング・ブランチを削除", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure?": "実行しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoveRemoteBranchConfirm": "リモート・ブランチ「${0}」を削除し、変更をプッシュしようとしています。\n\n続行しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote branch: ": "リモート・ブランチの削除中: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete Remote Branch": "リモート・ブランチの削除", //$NON-NLS-0$  //$NON-NLS-1$
	"New Remote": "新規リモート", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Remote": "Git リモート", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Remote": "このファイルまたはフォルダーのリモート Git ログ・ページを開きます。", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new remote to the repository": "リポジトリーに新規リモートを追加", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote from the repository": "リポジトリーからリモートを削除", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete remote ${0}?": "リモート ${0} を削除しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull": "プル", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull from the repository": "リポジトリーからプル", //$NON-NLS-0$  //$NON-NLS-1$
	"Pulling: ": "プル中 : ", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull Git Repository": "Git リポジトリーのプル", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Log": "Git ログ", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Log": "このファイルまたはフォルダーのローカル Git ログ・ページを開きます。", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the branch": "ブランチのログを開く", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the repository": "リポジトリーのログを開く", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the status for the repository": "リポジトリーの状況を開く", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditor": "エディターに表示", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditorTooltip": "リポジトリー・フォルダーをエディターに表示", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareEach": "相互比較", //$NON-NLS-0$  //$NON-NLS-1$
 	"Compare With Working Tree": "作業ツリーでの比較", //$NON-NLS-0$  //$NON-NLS-1$
	"Open": "開く", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenGitCommitTip": "コミットのツリーを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitVersion": "コミットを開く", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewCommitVersionTip": "ファイルのコミット済みバージョンを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch": "フェッチ", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote": "リモートからフェッチ", //$NON-NLS-0$  //$NON-NLS-1$
	"Password:": "パスワード:", //$NON-NLS-0$  //$NON-NLS-1$
	"User Name:": "ユーザー名:", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching remote: ": "リモートからフェッチ中: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Fetch": "強制フェッチ", //$NON-NLS-0$  //$NON-NLS-1$
	"FetchRemoteBranch": "リモート・ブランチからフェッチして、リモート・トラッキング・ブランチに入れ、現在のコンテンツをオーバーライド", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentRemoteTrackingBr": "リモート・トラッキング・ブランチのコンテンツをオーバーライドしようとしています。 ブランチでコミットが失われることがあります。", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge": "マージ", //$NON-NLS-0$  //$NON-NLS-1$
	"MergeContentFrmBr": "ブランチのコンテンツをアクティブ・ブランチにマージ", //$NON-NLS-0$  //$NON-NLS-1$
 	". Go to ${0}.": ". ${0} にジャンプ", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status page": "Git 状況ページ", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase": "リベース", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsMsg": "アクティブ・ブランチから削除することによりリベースをコミットし、選択されたブランチの最後の状態に基づいて、アクティブのブランチを再開 ", //$NON-NLS-0$  //$NON-NLS-1$
 	"Rebase on top of ": "追加でリベース ", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseSTOPPED": ". 何らかの競合が発生しました。 それらを解決してから、続行、またはパッチをスキップ、またはリベースを打ち切ってください。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_WRONG_REPOSITORY_STATE": ". リポジトリー状態が無効です (既にリベース中です)。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_UNMERGED_PATHS": ". リポジトリーに、アンマージされているパスが含まれています。 ", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_PENDING_CHANGES": ". リポジトリーに保留中の変更が含まれています。 それらをコミットまたは隠しておいてください。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseUNCOMMITTED_CHANGES": ". コミットされていない変更があります。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsByRmvingThem": "アクティブ・ブランチから削除することによりコミットをリベースし、 ", //$NON-NLS-0$  //$NON-NLS-1$
	"StartActiveBranch": "の最新の状態に基づいてアクティブ・ブランチを再開し、", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyEachCommitAgain": "更新されたアクティブ・ブランチに各コミットを再適用します。", //$NON-NLS-0$  //$NON-NLS-1$
	"Push All": "すべてプッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocal": "コミットとタグを、ローカル・ブランチからリモート・ブランチにプッシュ", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push Branch": "ブランチをプッシュ", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushResult": "プッシュの結果:", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushCommitsWithoutTags": "コミットをタグなしで、ローカル・ブランチからリモート・ブランチにプッシュ", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push for Review": "レビュー用にプッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"Push commits to Gerrit Code Review": "Gerrit コード・レビューにコミットをプッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push Branch": "ブランチを強制プッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsWithoutTagsOverridingCurrentContent": "ローカル・ブランチからリモート・ブランチにコミットをタグなしでプッシュし、現在のコンテンツをオーバーライド", //$NON-NLS-0$  //$NON-NLS-1$
 	"Pushing remote: ": "リモートをプッシュ中: ", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseBranchDialog": "ブランチの選択", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose the remote branch.": "リモート・ブランチを選択します。", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push All": "すべて強制プッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocalBr": "ローカル・ブランチからリモート・ブランチにコミットとタグをプッシュし、現在のコンテンツをオーバーライド", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentOfRemoteBr": "リモート・ブランチのコンテンツをオーバーライドしようとしています。 リモート・リポジトリーでコミットが失われることがあります。", //$NON-NLS-0$  //$NON-NLS-1$
	"< Previous Page": "< 前ページ", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git log": "git ログの前ページを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git tags" : "git タグの前ページを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Next Page >": "次ページ >", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git log": "git ログの次ページを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git tags" : "git タグの次ページを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the selected remote branch": "ローカル・ブランチから、選択したリモート・ブランチにプッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetActiveBr": "アクティブ・ブランチを、この参照の状態にリセットします。ステージ済みおよび未ステージのすべての変更を破棄します。", //$NON-NLS-0$  //$NON-NLS-1$
 	"GitResetIndexConfirm": "アクティブ・ブランチのコンテンツがコミット「${0}」に置換されます。未ステージとステージ済みのすべての変更は破棄され、「${1}」がチェックされていなければ復旧できません。実行しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting index...": "索引のリセット中...", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting git index for ${0}" : "${0} の Git 索引のリセット中", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag": "タグ", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a tag for the commit": "コミットのタグを作成", //$NON-NLS-0$  //$NON-NLS-1$
	"ProjectSetup": "ご使用のプロジェクトはセットアップ中です。これには少し時間がかかることがあります...", //$NON-NLS-0$  //$NON-NLS-1$
	"LookingForProject": "プロジェクトの検索中: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag name": "タグ名", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the tag from the repository": "リポジトリーからタグを削除", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete tag ${0}?": "タグ ${0} を削除しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"Cherry-Pick": "チェリー・ピック", //$NON-NLS-0$  //$NON-NLS-1$
	"CherryPicking": "チェリー・ピックのコミット: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RevertingCommit": "コミットを元に戻しています: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the change introduced by the commit to your active branch": "コミットによる変更をアクティブ・ブランチに適用", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing changed.": "変更なし。", //$NON-NLS-0$  //$NON-NLS-1$
	". Some conflicts occurred": ". 何らかの競合が発生しました。 ", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote branch into your remote tracking branch": "リモート・ブランチからフェッチして、リモート・トラッキング・ブランチに入れる", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch Git Repository": "Git リポジトリーのフェッチ", //$NON-NLS-0$  //$NON-NLS-1$
	"Push": "プッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the remote branch": "ローカル・ブランチからリモート・ブランチにプッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"Push Git Repository": "Git リポジトリーのプッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"Key:": "キー:", //$NON-NLS-0$  //$NON-NLS-1$
	"Value:": "値:", //$NON-NLS-0$  //$NON-NLS-1$
	"New Configuration Entry": "新しい構成エントリー", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit": "編集", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit the configuration entry": "構成エントリーの編集", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the configuration entry": "構成エントリーの削除", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete ${0}?": "${0} を削除しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Repository": "リポジトリーのクローン", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone an existing Git repository to a folder": "既存の Git リポジトリーのクローンをフォルダーに作成", //$NON-NLS-0$  //$NON-NLS-1$
	"Cloning repository: ": "リポジトリーのクローン作成 ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Repository": "リポジトリーの初期化", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a new Git repository in a new folder": "新しい Git リポジトリーを新しいフォルダー中に作成", //$NON-NLS-0$  //$NON-NLS-1$
	"Initializing repository: ": "リポジトリーの初期化 ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Git Repository": "Git リポジトリーの初期化", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the repository": "リポジトリーの削除", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want do delete ${0} repositories?": "${0} リポジトリーを削除しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply a patch on the selected repository": "選択したリポジトリーにパッチを適用", //$NON-NLS-0$  //$NON-NLS-1$
	"Show content": "コンテンツの表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit name:": "コミットの名前:", //$NON-NLS-0$  //$NON-NLS-1$
	"Open Commit": "コミットを開く", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitDialog": "コミットを開く", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the commit with the given name": "指定した名前のコミットを開く", //$NON-NLS-0$  //$NON-NLS-1$
	"No commits found": "コミットが見つかりません", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging changes": "変更のステージング", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message:": "コミット・メッセージ:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing changes": "変更のコミット中", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching previous commit message": "前のコミット・メッセージを取り出し中", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes": "ローカル変更のリセット中", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout files, discarding all changes": "ファイルのチェックアウト (変更をすべて破棄)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Patch": "パッチの表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading default workspace": "デフォルトのワークスペースをロード中", //$NON-NLS-0$  //$NON-NLS-1$
	"Show workspace changes as a patch": "ワークスペースの変更をパッチとして表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show checked changes as a patch": "チェックされた変更をパッチとして表示", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowCommitPatchTip": "コミットの変更パッチを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue": "続行", //$NON-NLS-0$  //$NON-NLS-1$
	"Contibue Rebase": "リベースの続行", //$NON-NLS-0$  //$NON-NLS-1$
	"Skip Patch": "パッチをスキップ", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort": "中断", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort Rebase": "リベースを打ち切る", //$NON-NLS-0$  //$NON-NLS-1$
	"Discard": "破棄", //$NON-NLS-0$  //$NON-NLS-1$
	"Ignore": "無視", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesSelectedFilesDiscard": "選択したファイルに加えた変更は破棄され、復旧できません。", //$NON-NLS-0$  //$NON-NLS-1$
 	"Getting git log": "Git ログの取得中", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting stashed changes...": "スタッシュ変更の取得中...", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch (${0})": "アクティブ・ブランチ (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch (${0})": "ブランチ (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag (${0})": "タグ (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit (${0})": "コミット (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommit (${0})": "スタッシュ (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"WIPStash": "${0} 上の WIP: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"IndexStash": "${0} 上の索引: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranch (${0})": "リモート・ブランチ (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch Log": "Git ログ (アクティブ・ブランチ)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the active local branch": "アクティブ・ローカル・ブランチのログを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Branch Log": "Git ログ (リモート・ブランチ)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the corresponding remote tracking branch": "対応するリモート・トラッキング・ブランチのログを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Status" : "状況全体を参照", //$NON-NLS-0$  //$NON-NLS-1$
	"See the status" : "状況を参照", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose target location" : "ターゲット・ロケーションを選択", //$NON-NLS-0$  //$NON-NLS-1$
	"Default target location" : "デフォルト・ターゲット・ロケーション", //$NON-NLS-0$  //$NON-NLS-1$
	"Change..." : "変更...", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge Squash": "squash 指定でマージ", //$NON-NLS-0$  //$NON-NLS-1$
	"Squash the content of the branch to the index" : "ブランチのコンテンツをインデックスへ squash", //$NON-NLS-0$  //$NON-NLS-1$
	"Local Branch Name:" : "ローカル・ブランチ名:", //$NON-NLS-0$  //$NON-NLS-1$
	"Local": "ローカル", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter items" : "項目のフィルター", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter filter" : "メッセージのフィルター", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter author" : "作成者のフィルター", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter committer" : "コミッターのフィルター", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter sha1" : "sha1 のフィルター", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter fromDate" : "日付 YYYY-MM-DD または 1(h d w m y) からのフィルター", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter toDate" : "日付 YYYY-MM-DD または 1(h d w m y) までのフィルター", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter path" : "パスのフィルター", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter remote branches" : "リモート・ブランチのフィルター", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote branches" : "リモート・ブランチ ${0} の取得中", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote details": "リモートの詳細の取得中: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchApplied": "パッチの適用に成功 しました", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchFailed": "パッチの適用に失敗しました。${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting branches" : "ブランチ ${0} の取得中", //$NON-NLS-0$  //$NON-NLS-1$
	"Paste link in email or IM" : "E メールまたは IM にリンクを貼り付ける", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in GitHub" : "GitHub でコミットを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in GitHub" : "GitHub でリポジトリーを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in GitHub": "GitHub でこのコミットを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in eclipse.org": "eclipse.org でコミットを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in eclipse.org" : "eclipse.org でこのコミットを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in eclipse.org":"eclipse.org でリポジトリーを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in eclipse.org":"eclipse.org でこのリポジトリーを表示", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review" : "レビュー依頼", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review tooltip" : "コミットのレビュー依頼の E メールを送信", //$NON-NLS-0$  //$NON-NLS-1$
	"Reviewer name" : "レビュー担当者名", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request" : "コントリビューション・レビューの要求", //$NON-NLS-0$  //$NON-NLS-1$
	"Send the link to the reviewer" : "レビュー担当者にリンクを送信", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key file (optional):" : "秘密鍵ファイル (オプション):", //$NON-NLS-0$  //$NON-NLS-1$
	"Don't prompt me again:" : "今後プロンプトを表示しない:", //$NON-NLS-0$  //$NON-NLS-1$
	"Your private key will be saved in the browser for further use" : "以降の使用のために秘密鍵はブラウザーに保存されます。", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading Contribution Review Request..." : "コントリビューション・レビュー要求をロード中...", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit can be found in the following repositories" : "コミットは以下のリポジトリーで見つけることができます", //$NON-NLS-0$  //$NON-NLS-1$
	"Try to update your repositories" : "リポジトリーの更新を試行してください", //$NON-NLS-0$  //$NON-NLS-1$
	"Create new repository" : "新規リポジトリーの作成", //$NON-NLS-0$  //$NON-NLS-1$
	"Attach the remote to one of your existing repositories" : "既存のリポジトリーのいずれかにリモートを接続します", //$NON-NLS-0$  //$NON-NLS-1$
	"You are reviewing contribution ${0} from ${1}" : "コントリビューション ${0} から ${1} をレビューしています", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitNotFoundInWorkspace" : "残念ながらコミットはワークスペースで見つかりませんでした。それを表示するには、以下のいずれかを試行してください。", //$NON-NLS-0$  //$NON-NLS-1$
 	"To review the commit you can also:" : "以下の方法でもコミットをレビューすることができます。", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request for ${0} on ${1}" : "${1} の ${0} についてのコントリビューション・レビューの要求", //$NON-NLS-0$  //$NON-NLS-1$
	"Failing paths: ${0}": "障害のあるパス: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Problem while performing the action": "操作の実行中に問題が生じました", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the Orion repositories page to provide a git repository URL. Once the repository is created, it will appear in the Navigator.": "Orion リポジトリー・ページに移動して、git リポジトリーの URL を指定します。リポジトリーが作成されると、ナビゲーターに表示されます。", //$NON-NLS-0$  //$NON-NLS-1$
	"URL:": "URL:", //$NON-NLS-0$  //$NON-NLS-1$
	"File:": "ファイル:", //$NON-NLS-0$  //$NON-NLS-1$
	"Submit": "実行依頼", //$NON-NLS-0$  //$NON-NLS-1$
	"git url:": "git URL: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert": "前回の状態に戻す", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert changes introduced by the commit into your active branch": "コミットによる変更をアクティブ・ブランチに戻す", //$NON-NLS-0$  //$NON-NLS-1$
	". Could not revert into active branch": ". アクティブ・ブランチに戻せませんでした。", //$NON-NLS-0$  //$NON-NLS-1$
	"Login": "ログイン", //$NON-NLS-0$  //$NON-NLS-1$
	"Authentication required for: ${0}. ${1} and re-try the request.": "${0} の認証が必要です。${1} の後、要求を再試行してください。", //$NON-NLS-0$  //$NON-NLS-1$
	"Save":"保存", //$NON-NLS-0$  //$NON-NLS-1$
	"Remember my committer name and email:":"コミット担当者名と E メールを記憶:", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully edited ${0} to have value ${1}":"${0} は正常に編集されました。値は ${1} です。", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully added ${0} with value ${1}":"${0} は正常に追加されました。値は ${1} です。", //$NON-NLS-0$  //$NON-NLS-1$
	"Signed-off-by: ":"サインオフ: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Change-Id: ":"変更 ID: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Push_REJECTED_NONFASTFORWARD":"プッシュは non-fastforward であり、リジェクトされました。マージが必要な新しいコミットを確認するには、フェッチを使用してください。", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit and Push" : "コミットしてプッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"Sync" : "同期化", //$NON-NLS-0$  //$NON-NLS-1$
	"SyncTooltip" : "リモート・ブランチからフェッチします。ローカル・ブランチから削除することによりリベースをコミットし、リモート・ブランチの最後の状態に基づいてローカル・ブランチを再開し、更新されたローカル・ブランチに各コミットを適用します。コミットとタグをローカル・ブランチからリモート・ブランチにプッシュします。", //$NON-NLS-0$  //$NON-NLS-1$
	"NoCommits" : "変更なし", //$NON-NLS-0$  //$NON-NLS-1$
	"NoContent" : "コンテンツなし", //$NON-NLS-0$  //$NON-NLS-1$
	"Incoming" : "着信", //$NON-NLS-0$  //$NON-NLS-1$
	"Outgoing" : "発信", //$NON-NLS-0$  //$NON-NLS-1$
	"IncomingWithCount" : "着信 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"OutgoingWithCount" : "発信 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Synchronized" : "履歴", //$NON-NLS-0$  //$NON-NLS-1$
	"Uncommited" : "未コミット", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository:" : "リポジトリー:", //$NON-NLS-0$  //$NON-NLS-1$
	"Reference:" : "参照:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author:" : "作成者: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer:" : "コミッター:", //$NON-NLS-0$  //$NON-NLS-1$
	"SHA1:" : "SHA1:", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchCmd" : "アクティブ・ブランチの表示", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceCmd": "参照の表示", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceTip": "${1}「${2}」の履歴の表示", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchTip": "${1}「${2}」に関連する「${0}」の履歴の表示", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitType": "commit", //$NON-NLS-0$  //$NON-NLS-1$
	"BranchType": "ブランチ", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranchType": "リモート・ブランチ", //$NON-NLS-0$  //$NON-NLS-1$
	"TagType": "タグ", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommitType": "スタッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"Path:" : "パス:", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChanges" : "作業ディレクトリーの変更", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChangesDetails" : "作業ディレクトリーの詳細", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareChanges" : "比較 (${0} => ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"NoBranch" : "ブランチなし", //$NON-NLS-0$  //$NON-NLS-1$
	"NoActiveBranch" : "アクティブ・ブランチなし", //$NON-NLS-0$  //$NON-NLS-1$
	"NoRef" : "選択参照なし", //$NON-NLS-0$  //$NON-NLS-1$
	"None": "なし", //$NON-NLS-0$  //$NON-NLS-1$
	"FileSelected": "${0} ファイルが選択されました", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesSelected": "${0} ファイルが選択されました", //$NON-NLS-0$  //$NON-NLS-1$
	"FileChanged": "${0} ファイルは変更されました", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChanged": "${0} ファイルは変更されました", //$NON-NLS-0$  //$NON-NLS-1$
	"file": "ファイル", //$NON-NLS-0$  //$NON-NLS-1$
	"files": "ファイル", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitConfirm": "ファイルが選択されていません。実行しますか?", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitWarning": "コミットは空です", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChangedVsReadyToCommit": "${0} ${1} を変更しました。${2} ${3} のコミット準備ができました。", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitPush": "コミットしてプッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits and pushes files to the default remote": "ファイルをデフォルトのリモートにコミットしてプッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash" : "スタッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"stashIndex" : "stash@{${0}}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash all current changes away" : "現在のすべての変更内容をスタッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop" : "削除", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop the commit from the stash list" : "スタッシュ・リストからコミットを削除", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply" : "適用", //$NON-NLS-0$  //$NON-NLS-1$
	"Pop Stash" : "ポップ・スタッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the most recently stashed change to your active branch and drop it from the stashes" : "スタッシュに退避済みの最新の変更をアクティブ・ブランチに適用して、スタッシュから削除 ", //$NON-NLS-0$  //$NON-NLS-1$
	"stashes" : "スタッシュ", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyName': "Git リポジトリー", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyTooltip': "Git リポジトリーとこのプロジェクトを関連付けます。",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectName': "Git リポジトリー",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectTooltip': "Git リポジトリーからプロジェクトを作成します。",  //$NON-NLS-0$  //$NON-NLS-1$
	'fetchGroup': 'フェッチ',  //$NON-NLS-0$  //$NON-NLS-1$
	'pushGroup' : 'プッシュ',  //$NON-NLS-0$  //$NON-NLS-1$
	'Url:' : 'URL:', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Private Key:' : 'SSH 秘密鍵:', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Passphrase:' : 'SSH パスフレーズ:', //$NON-NLS-0$  //$NON-NLS-1$
	'confirmUnsavedChanges': '保存されていない変更があります。 保存しますか?' //$NON-NLS-1$ //$NON-NLS-0$
});

