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
	"View the side-by-side compare": "檢視並列比較", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirVer": "開啟工作目錄", //$NON-NLS-0$  //$NON-NLS-1$
	"Working Directory": "工作目錄", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewWorkingDirVer": "檢視檔案的工作目錄版本", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading...": "載入中...", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories": "所有 Git 儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Repo": "儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"0 on 1 - Git": "${0} 在 ${1} - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Git": "Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in eclipse.org": "顯示在 eclipse.org 中", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in GitHub": "顯示在 GitHub 中", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in GitHub": "在 GitHub 中顯示此儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit Details": "確定詳細資料", //$NON-NLS-0$  //$NON-NLS-1$
	"No Commits": "無確定", //$NON-NLS-0$  //$NON-NLS-1$
	"commit: 0": "確定：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"parent: 0": "母項：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"authored by 0 (1) on 2": "由 ${0} 撰寫 <${1}>，在 ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"committed by 0 (1)": "由 ${0} 確定 <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"committedby": "確認者 ", //$NON-NLS-0$  //$NON-NLS-1$
	"authoredby": "作者為 ", //$NON-NLS-0$  //$NON-NLS-1$
	"on": " 於 ", //$NON-NLS-0$  //$NON-NLS-1$
	"nameEmail": "${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags:": "標籤：", //$NON-NLS-0$  //$NON-NLS-1$
	"No Tags": "無標籤", //$NON-NLS-0$  //$NON-NLS-1$
	"Diffs": "變更", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirChanges": "工作目錄變更", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChanges": "確定變更", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChangesDialog": "確定變更", //$NON-NLS-0$  //$NON-NLS-1$
	"more": "或更多 ...", //$NON-NLS-0$  //$NON-NLS-1$
	"less": "或更少 ...", //$NON-NLS-0$  //$NON-NLS-1$
	"More": "尚有", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFiles" : "更多檔案", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFilesProgress": "正在載入更多檔案...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommits": "\"${0}\" 的其他確定", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommitsProgress": "正在載入 \"${0}\" 的其他確定...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranches": "\"${0}\" 的其他分支", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranchesProgress": "正在載入 \"${0}\" 的其他分支...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTags": "其他標籤", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTagsProgress": "正在載入其他標籤...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashes": "其他隱藏", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashesProgress": "正在載入其他隱藏...", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading git log...": "正在載入 Git 日誌...", //$NON-NLS-0$  //$NON-NLS-1$
	"local": "本端", //$NON-NLS-0$  //$NON-NLS-1$
	"remote": "遠端", //$NON-NLS-0$  //$NON-NLS-1$
	"View All": "檢視全部", //$NON-NLS-0$  //$NON-NLS-1$
	"Error ${0}: ": "錯誤 ${0}： ", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading ": "正在載入 ", //$NON-NLS-0$  //$NON-NLS-1$
	"Message": "訊息", //$NON-NLS-0$  //$NON-NLS-1$
	"Author": "作者", //$NON-NLS-0$  //$NON-NLS-1$
	"Date": "日期", //$NON-NLS-0$  //$NON-NLS-1$
	"fromDate:": "開始日期：", //$NON-NLS-0$  //$NON-NLS-1$
	"toDate:": "結束日期：", //$NON-NLS-0$  //$NON-NLS-1$
	"Actions": "動作", //$NON-NLS-0$  //$NON-NLS-1$
	"Branches": "分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags": "標籤", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage": "暫置", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged removal": "未暫置移除", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage": "取消暫置", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged removal": "暫置移除", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged change": "未暫置變更", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged change": "暫置變更", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged add": "未暫置新增", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged add": "暫置新增", //$NON-NLS-0$  //$NON-NLS-1$
	"Addition": "新增", //$NON-NLS-0$  //$NON-NLS-1$
	"Deletion": "刪除", //$NON-NLS-0$  //$NON-NLS-1$
	"Resolve Conflict": "解決衝突", //$NON-NLS-0$  //$NON-NLS-1$
	"Conflicting": "衝突", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message": "確定訊息", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit": "確定", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitTooltip": "使用給定訊息來確定選取的檔案。", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthMsgLink":"${0} 需要鑑別。<a target=\"_blank\" href=\"${1}\">${2}</a>，並重試要求。</span>", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCommit": "輸入確定訊息", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCountCommit": "確定 ${0} 個檔案", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend last commit": "修改前次確定", //$NON-NLS-0$  //$NON-NLS-1$
	" Amend": " 修改", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress. Choose action:": "重設基線進行中。選擇動作：", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgress": "重設基線進行中", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseTip": "重設確定的基線，方法是將確定從作用中分支移除，然後根據 \"${0}\" 的最新狀態來重新啟動作用中分支，並且將每一個確定重新套用至已更新的作用中分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebasingRepo": "重設 Git 儲存庫的基線", //$NON-NLS-0$  //$NON-NLS-1$
	"AddingConfig": "新增 Git 配置內容：key=${0} value=${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"EditingConfig": "編輯 Git 配置內容：key=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"DeletingConfig": "刪除 Git 配置內容：key=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"AddClone": "正在複製儲存庫：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgressDetails": "正在重設分支的基線。\n\n\t在合併衝突和選取所有檔案後，請使用「繼續」；\n\t使用「跳過」會忽略現行修補程式；\n\t使用「中斷」可隨時結束重設基線。", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer name:": "確認者名稱：", //$NON-NLS-0$  //$NON-NLS-1$
	"Name:": "名稱：", //$NON-NLS-0$  //$NON-NLS-1$
	"email:": "電子郵件：", //$NON-NLS-0$  //$NON-NLS-1$
	"Email:": "電子郵件：", //$NON-NLS-0$  //$NON-NLS-1$
	"Author name: ": "作者名稱： ", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged": "未暫置", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged": "暫置", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangedFiles": "已變更檔案", //$NON-NLS-0$  //$NON-NLS-1$
	"Recent commits on": "最近確定在", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status": "Git 狀態", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Status": "針對含有這個檔案或資料夾的儲存庫，開啟「Git 狀態」頁面。", //$NON-NLS-0$  //$NON-NLS-1$
	"GetGitIncomingMsg": "正在取得 Git 送入的變更...", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout": "移出", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out...": "正在移出...", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage the change": "暫置變更", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging...": "正在暫置...", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutSelectedFiles": "移出所有選取的檔案，捨棄所有變更", //$NON-NLS-0$  //$NON-NLS-1$
	"AddFilesToGitignore" : "將所有選取的檔案新增至 .gitignore 檔", //$NON-NLS-0$  //$NON-NLS-1$
	"Writing .gitignore rules" : "正在撰寫 .gitignore 規則", //$NON-NLS-0$  //$NON-NLS-1$ 
	"Save Patch": "儲存修補程式", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage the change": "取消暫置變更", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaging...": "正在取消暫置...", //$NON-NLS-0$  //$NON-NLS-1$
	"Undo": "復原", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoTooltip": "回復這項確定，保留所有已變更的檔案，且不對工作目錄進行任何變更。", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoConfirm": "作用中分支的內容將取代為確定 \"${0}\"。將保留確定及工作目錄中的所有變更。 您確定要這樣做嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"Reset": "重設", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetConfirm": "將會捨棄工作目錄和索引中的所有未暫置和暫置變更，而且無法回復。\n\n您確定要繼續嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutConfirm" : "將會捨棄您對所選取檔案所做的變更，而且無法回復。\n\n您確定要繼續嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetBranchDiscardChanges": "重設分支，捨棄所有暫置和未暫置的變更", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesIndexDiscardedMsg": "將會捨棄工作目錄和索引中的所有未暫置和暫置變更，無法回復。", //$NON-NLS-0$  //$NON-NLS-1$
	"ContinueMsg": "您確定要繼續嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"KeepWorkDir" : "保留工作目錄", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes...": "正在重設本端變更...", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue rebase...": "繼續重設基線...", //$NON-NLS-0$  //$NON-NLS-1$
	"Skipping patch...": "正在跳過修補程式...", //$NON-NLS-0$  //$NON-NLS-1$
	"Aborting rebase...": "正在中止重設基線...", //$NON-NLS-0$  //$NON-NLS-1$
	"Complete log": "完整日誌", //$NON-NLS-0$  //$NON-NLS-1$
	"local VS index": "本端 VS 索引", //$NON-NLS-0$  //$NON-NLS-1$
	"index VS HEAD": "索引 VS HEAD", //$NON-NLS-0$  //$NON-NLS-1$
	"Compare(${0} : ${1})": "比較（${0}：${1}）", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading status...": "正在載入狀態...", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing...": "正在確定...", //$NON-NLS-0$  //$NON-NLS-1$
	"The author name is required.": "需要作者名稱。", //$NON-NLS-0$  //$NON-NLS-1$
	"The author mail is required.": "需要作者郵件。", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoConflict": ". 儲存庫仍然包含衝突。", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoUnmergedPathResolveConflict": ". 儲存庫包含未合併的路徑。請先解決衝突。", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering ${0}": "呈現 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Configuration": "配置", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting configuration of": "正在取得 ${0} 配置", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting git repository details": "正在取得 git 儲存庫詳細資料", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting changes": "取得變更", //$NON-NLS-0$  //$NON-NLS-1$
	" - Git": " - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories - Git": "儲存庫 - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository": "儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository Not Found": "找不到儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"No Repositories": "無儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repository": "載入儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repositories": "載入儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"(no remote)": "（無遠端）", //$NON-NLS-0$  //$NON-NLS-1$
	"location: ": "位置： ", //$NON-NLS-0$  //$NON-NLS-1$
	"NumFilesStageAndCommit": "要暫置 ${0} 個檔案，要確定 ${1} 個檔案。", //$NON-NLS-0$  //$NON-NLS-1$
 	"Nothing to commit.": "沒有可確定的項目。", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing to push.": "沒有可推送的項目。", //$NON-NLS-0$  //$NON-NLS-1$
	"NCommitsToPush": "有 ${0} 個確定待推送。", //$NON-NLS-0$  //$NON-NLS-1$
	"You have no changes to commit.": "您沒有可確定的變更。", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress!": "正在重設基線！", //$NON-NLS-0$  //$NON-NLS-1$
	"View all local and remote tracking branches": "檢視所有本端和遠端追蹤分支", //$NON-NLS-0$  //$NON-NLS-1$
	"tracksNoBranch": "不追蹤分支", //$NON-NLS-0$  //$NON-NLS-1$
	"tracks": "追蹤 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"last modified ${0} by ${1}": "前次修改時間：${0}，修改者：${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remote Branches": "無遠端分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering branches": "呈現分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits": "確定", //$NON-NLS-0$  //$NON-NLS-1$
	"GettingCurrentBranch": "正在取得 ${0} 的現行分支", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Log": "請參閱完整日誌", //$NON-NLS-0$  //$NON-NLS-1$
	"See the full log": "請參閱完整日誌", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting commits for \"${0}\" branch": "取得 \"${0}\" 分支的確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering commits": "呈現確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting outgoing commits": "取得送出的確定", //$NON-NLS-0$  //$NON-NLS-1$
	"The branch is up to date.": "分支已是最新。", //$NON-NLS-0$  //$NON-NLS-1$
	"NoOutgoingIncomingCommits": "您沒有送出的或送入的確定。", //$NON-NLS-0$  //$NON-NLS-1$
 	") by ": ") 由 ", //$NON-NLS-0$  //$NON-NLS-1$
	" (SHA ": " (SHA ", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting tags": "取得標籤", //$NON-NLS-0$  //$NON-NLS-1$
	"View all tags": "檢視所有標籤", //$NON-NLS-0$  //$NON-NLS-1$
	" on ": " 於 ", //$NON-NLS-0$  //$NON-NLS-1$
	" by ": " 由 ", //$NON-NLS-0$  //$NON-NLS-1$
	"Remotes": "遠端", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering remotes": "呈現遠端", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remotes": "無遠端", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged addition": "未暫置新增", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged addition": "暫置新增", //$NON-NLS-0$  //$NON-NLS-1$
	" (Rebase in Progress)": " （重設基線進行中）", //$NON-NLS-0$  //$NON-NLS-1$
	"Status": "狀態", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0)": "日誌 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0) - 1": "日誌 (${0}) - ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Status for ${0} - Git ": "${0} 的狀態 - Git ", //$NON-NLS-0$  //$NON-NLS-1$
	"No Unstaged Changes": "無未暫置變更", //$NON-NLS-0$  //$NON-NLS-1$
	"No Staged Changes": "無暫置變更", //$NON-NLS-0$  //$NON-NLS-1$
	"Changes for \"${0}\" branch": "${0} 的變更", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch": "${0} 的確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch against": "\"${0}\" 分支的確定，針對", //$NON-NLS-0$  //$NON-NLS-1$
	"Add Remote": "新增遠端", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Name:": "遠端名稱：", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote URI:": "遠端 URI：", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply Patch": "套用修補程式", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyPatchDialog": "套用修補程式", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Repository": "Git 儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the git repository": "開啟這個檔案或資料夾的「Git 儲存庫」頁面。", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Git Repository": "複製 Git 儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"CloneGitRepositoryDialog": "複製 Git 儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository URL:": "儲存庫 URL：", //$NON-NLS-0$  //$NON-NLS-1$
	"Existing directory:": "現有的目錄：", //$NON-NLS-0$  //$NON-NLS-1$
	"New folder:": "新建資料夾：", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseFolderDialog": "選擇資料夾", //$NON-NLS-0$  //$NON-NLS-1$
	"Message:": "訊息：", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend:": "修改：", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartAmend": "修正前一個確定", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangeId:": "變更 ID：", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartChangeId": "新增變更 ID 至訊息", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Name:": "確認者名稱：", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Email:": "確認者電子郵件：", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorNamePlaceholder": "輸入作者名稱", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorEmailPlaceholder": "輸入作者電子郵件", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterNamePlaceholder": "輸入確認者名稱", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterEmailPlaceholder": "輸入確認者電子郵件", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Name:": "作者名稱：", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Email:": "作者電子郵件：", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit message is required.": "需要確定訊息。", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Credentials": "Git 認證", //$NON-NLS-0$  //$NON-NLS-1$
	"Username:": "使用者名稱：", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key:": "私密金鑰：", //$NON-NLS-0$  //$NON-NLS-1$
	"Passphrase (optional):": "通行詞組（選用）：", //$NON-NLS-0$  //$NON-NLS-1$
	"commit:": "確定： ", //$NON-NLS-0$  //$NON-NLS-1$
	"parent:": "母項： ", //$NON-NLS-0$  //$NON-NLS-1$
	"branches: ": "分支： ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags: ": "標籤： ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags": "標籤", //$NON-NLS-0$  //$NON-NLS-1$
	" authored by ${0} {${1}) on ${2}": " 由 ${0} 撰寫 (${1})，在 ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"Content": "內容", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to ${0} section": "移至 ${0} 區段", //$NON-NLS-0$  //$NON-NLS-1$
	"Type the commit name (sha1):": "輸入確定名稱 (sha1)：", //$NON-NLS-0$  //$NON-NLS-1$
	"Search": "搜尋", //$NON-NLS-0$  //$NON-NLS-1$
	"Searching...": "搜尋中...", //$NON-NLS-0$  //$NON-NLS-1$
	"SelectAll": "全選", //$NON-NLS-0$  //$NON-NLS-1$
	"Looking for the commit": "尋找確定", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch:": "新建分支：", //$NON-NLS-0$  //$NON-NLS-1$
	"No remote selected": "未選取遠端", //$NON-NLS-0$  //$NON-NLS-1$
	"Enter a name...": "輸入名稱...", //$NON-NLS-0$  //$NON-NLS-1$
	"OK": "確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Cancel": "取消", //$NON-NLS-0$  //$NON-NLS-1$
	"Clear": "清除", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter": "過濾器", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommits": "過濾確定", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommitsTip": "切換過濾確定畫面", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeCmd": "最大化", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeTip": "切換編輯器的最大化狀態", //$NON-NLS-0$  //$NON-NLS-1$
	" [New branch]": " [新建分支]", //$NON-NLS-0$  //$NON-NLS-1$
	"AddKeyToHostContinueOp": "您要新增主機 ${1} 的 ${0} 按鍵以繼續作業嗎？按鍵 fingerpt 是 ${2}。", //$NON-NLS-0$  //$NON-NLS-1$
 	"Link Repository": "鏈結儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Folder name:": "資料夾名稱：", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository was linked to ": "儲存庫已鏈結至 ", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutCommitTooltip": "移出這項確定，根據內容建立本端分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutTagTooltip": "移出這個標籤，根據內容建立本端分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out ${0}": "移出 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutBranchMsg": "移出分支或對應的本端分支並設為作用中。如果遠端追蹤分支沒有對應的本端分支，將會先建立本端分支。", //$NON-NLS-0$  //$NON-NLS-1$
 	"Checking out branch...": "正在移出分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding branch ${0}...": "正在新增分支 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing branch ${0}...": "正在移除分支 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding remote ${0}...": "正在新增遠端 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote ${0}...": "正在移除遠端 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing repository ${0}": "正在移除儲存庫 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding tag {$0}": "新增標籤 {$0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing tag {$0}": "移除標籤 {$0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Merging ${0}": "正在合併 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	'Unstaging changes' : '正在解除暫置變更', //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out branch ${0}...": "正在移出分支 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch checked out.": "已移出分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch": "新建分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new local branch to the repository": "將新的本端分支新增至儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch name": "分支名稱", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete": "刪除", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the local branch from the repository": "從儲存庫中刪除本端分支", //$NON-NLS-0$  //$NON-NLS-1$
	"DelBrConfirm": "您確定要刪除分支 ${0} 嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote tracking branch from the repository": "從儲存庫中刪除遠端追蹤分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure?": "您確定要這樣做嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoveRemoteBranchConfirm": "即將刪除遠端分支 \"${0}\" 並推送變更。\n\n您確定要這樣做嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote branch: ": "移除遠端分支： ", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete Remote Branch": "刪除遠端分支", //$NON-NLS-0$  //$NON-NLS-1$
	"New Remote": "新建遠端", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Remote": "Git 遠端", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Remote": "開啟這個檔案或資料夾的遠端「Git 日誌」頁面。", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new remote to the repository": "將新的遠端新增至儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote from the repository": "從儲存庫中刪除遠端", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete remote ${0}?": "您確定要刪除遠端 ${0} 嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull": "取出", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull from the repository": "從儲存庫中取出", //$NON-NLS-0$  //$NON-NLS-1$
	"Pulling: ": "取出： ", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull Git Repository": "取出 Git 儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Log": "Git 日誌", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Log": "開啟這個檔案或資料夾的本端「Git 日誌」頁面。", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the branch": "開啟分支的日誌", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the repository": "開啟儲存庫的日誌", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the status for the repository": "開啟儲存庫的狀態", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditor": "顯示在編輯器中", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditorTooltip": "在編輯器中顯示儲存庫資料夾", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareEach": "彼此相互比較", //$NON-NLS-0$  //$NON-NLS-1$
 	"Compare With Working Tree": "與工作樹狀結構相互比較", //$NON-NLS-0$  //$NON-NLS-1$
	"Open": "開啟", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenGitCommitTip": "檢視此確定的樹狀結構", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitVersion": "開啟確定", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewCommitVersionTip": "檢視經過確定的檔案版本", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch": "提取", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote": "從遠端提取", //$NON-NLS-0$  //$NON-NLS-1$
	"Password:": "密碼：", //$NON-NLS-0$  //$NON-NLS-1$
	"User Name:": "使用者名稱：", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching remote: ": "提取遠端： ", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Fetch": "強制提取", //$NON-NLS-0$  //$NON-NLS-1$
	"FetchRemoteBranch": "從遠端分支提取到您的遠端追蹤分支，置換現行內容", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentRemoteTrackingBr": "您將會置換遠端追蹤分支的內容。 這會造成分支遺失確定。", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge": "合併", //$NON-NLS-0$  //$NON-NLS-1$
	"MergeContentFrmBr": "將分支的內容合併到作用中分支", //$NON-NLS-0$  //$NON-NLS-1$
 	". Go to ${0}.": ". 移至 ${0}。", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status page": "Git 狀態頁面", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase": "重設基線", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsMsg": "從作用中分支移除確定，以將確定重設基線，並根據所選分支的最新狀態，重新啟動作用中分支 ", //$NON-NLS-0$  //$NON-NLS-1$
 	"Rebase on top of ": "在最上層重設基線 ", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseSTOPPED": ". 發生一些衝突。 請解決後再繼續，跳過修補程式或中斷重設基線。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_WRONG_REPOSITORY_STATE": ". 儲存庫狀態無效Ｉ（例如，已經處於衍合期間）。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_UNMERGED_PATHS": ". 儲存庫包含未合併的路徑。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_PENDING_CHANGES": ". 儲存庫包含擱置變更。 請確定或隱藏它們。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseUNCOMMITTED_CHANGES": ". 有未確定的變更。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsByRmvingThem": "從作用中分支移除確定，以將確定重設基線， ", //$NON-NLS-0$  //$NON-NLS-1$
	"StartActiveBranch": "根據下列項目的最新狀態，重新啟動作用中分支：'", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyEachCommitAgain": "並將每一個確定重新套用至更新的作用中分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"Push All": "推送全部", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocal": "從本端分支將確定和標籤推送至遠端分支", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push Branch": "推送分支", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushResult": "推送結果：", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushCommitsWithoutTags": "將確定（不包含標籤）從本端分支推送至遠端分支", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push for Review": "推送以便檢閱", //$NON-NLS-0$  //$NON-NLS-1$
	"Push commits to Gerrit Code Review": "推送確定以檢閱 Gerrit 程式碼", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push Branch": "強制推送分支", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsWithoutTagsOverridingCurrentContent": "將確定（不包含標籤）從本端分支推送至遠端分支，以置換其現行內容", //$NON-NLS-0$  //$NON-NLS-1$
 	"Pushing remote: ": "推送遠端： ", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseBranchDialog": "選擇分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose the remote branch.": "選擇遠端分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push All": "強制推送全部", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocalBr": "從本端分支將確定和標籤推送至遠端分支，置換其現行內容", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentOfRemoteBr": "您將會置換遠端分支的內容。這會造成遠端儲存庫遺失確定。", //$NON-NLS-0$  //$NON-NLS-1$
	"< Previous Page": "< 上一頁", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git log": "顯示 Git 日誌的上一頁", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git tags" : "顯示上一頁 Git 標籤", //$NON-NLS-0$  //$NON-NLS-1$
	"Next Page >": "下一頁 >", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git log": "顯示 Git 日誌的下一頁", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git tags" : "顯示下一頁 Git 標籤", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the selected remote branch": "從本端分支推送至選取的遠端分支", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetActiveBr": "將作用中分支重設為這個參照的狀態。捨棄所有暫置和未暫置的變更。", //$NON-NLS-0$  //$NON-NLS-1$
 	"GitResetIndexConfirm": "作用中分支的內容將取代為確定 \"${0}\"。如果未勾選 \"${1}\"，將會捨棄所有未暫置和暫置變更，無法回復。您確定要這樣做嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting index...": "正在重設索引...", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting git index for ${0}" : "正在重設 ${0} 的 Git 索引", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag": "標籤", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a tag for the commit": "建立確定的標籤", //$NON-NLS-0$  //$NON-NLS-1$
	"ProjectSetup": "正在設定您的專案。這可能需要一分鐘...", //$NON-NLS-0$  //$NON-NLS-1$
	"LookingForProject": "正在尋找專案：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag name": "標籤名稱", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the tag from the repository": "從儲存庫中刪除標籤", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete tag ${0}?": "您確定要刪除標籤 ${0} 嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"Cherry-Pick": "最佳選擇", //$NON-NLS-0$  //$NON-NLS-1$
	"CherryPicking": "挑選最佳確定：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RevertingCommit": "正在回復確定：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the change introduced by the commit to your active branch": "將確定所引起的變更套用至作用中分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing changed.": "沒有任何變更。", //$NON-NLS-0$  //$NON-NLS-1$
	". Some conflicts occurred": ". 發生一些衝突。", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote branch into your remote tracking branch": "從遠端分支提取到您的遠端追蹤分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch Git Repository": "提取 Git 儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Push": "推送", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the remote branch": "從本端分支推送至遠端分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Push Git Repository": "推送 Git 儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Key:": "索引鍵：", //$NON-NLS-0$  //$NON-NLS-1$
	"Value:": "值：", //$NON-NLS-0$  //$NON-NLS-1$
	"New Configuration Entry": "新建配置項目", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit": "編輯", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit the configuration entry": "編輯配置項目", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the configuration entry": "刪除配置項目", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete ${0}?": "您確定要刪除 ${0} 嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Repository": "複製儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone an existing Git repository to a folder": "將現有的 Git 儲存庫複製到資料夾", //$NON-NLS-0$  //$NON-NLS-1$
	"Cloning repository: ": "複製儲存庫： ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Repository": "起始設定儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a new Git repository in a new folder": "在新的資料夾中建立新的 Git 儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Initializing repository: ": "起始設定儲存庫： ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Git Repository": "起始設定 Git 儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the repository": "刪除儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want do delete ${0} repositories?": "您確定要刪除 ${0} 儲存庫嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply a patch on the selected repository": "將修補程式套用在選取的儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Show content": "顯示內容", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit name:": "確定名稱：", //$NON-NLS-0$  //$NON-NLS-1$
	"Open Commit": "開啟確定", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitDialog": "開啟確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the commit with the given name": "開啟給定名稱的確定", //$NON-NLS-0$  //$NON-NLS-1$
	"No commits found": "找不到確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging changes": "暫置變更", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message:": "確定訊息：", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing changes": "確定變更", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching previous commit message": "正在提取先前的確定訊息", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes": "重設本端變更", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout files, discarding all changes": "移出檔案，捨棄所有變更", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Patch": "顯示修補程式", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading default workspace": "載入預設工作區", //$NON-NLS-0$  //$NON-NLS-1$
	"Show workspace changes as a patch": "將工作區變更顯示為修補程式", //$NON-NLS-0$  //$NON-NLS-1$
	"Show checked changes as a patch": "將已勾選的變更顯示成修補程式", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowCommitPatchTip": "顯示這個確定中之變更的修補程式", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue": "繼續", //$NON-NLS-0$  //$NON-NLS-1$
	"Contibue Rebase": "繼續重設基線", //$NON-NLS-0$  //$NON-NLS-1$
	"Skip Patch": "跳過修補程式", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort": "中止", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort Rebase": "中止重設基線", //$NON-NLS-0$  //$NON-NLS-1$
	"Discard": "捨棄", //$NON-NLS-0$  //$NON-NLS-1$
	"Ignore": "忽略", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesSelectedFilesDiscard": "將會捨棄您對所選檔案所做的變更，無法回復。", //$NON-NLS-0$  //$NON-NLS-1$
 	"Getting git log": "正在取得 git 日誌", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting stashed changes...": "正在取得隱藏變更...", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch (${0})": "作用中的分支 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch (${0})": "分支 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag (${0})": "標籤 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit (${0})": "確定 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommit (${0})": "隱藏 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"WIPStash": "${0} 上的 WIP：${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"IndexStash": "${0} 上的索引：${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranch (${0})": "遠端分支 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch Log": "Git 日誌（作用中的分支）", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the active local branch": "顯示作用中本端分支的日誌", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Branch Log": "Git 日誌（遠端分支）", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the corresponding remote tracking branch": "顯示對應的遠端追蹤分支的日誌", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Status" : "請參閱完整狀態", //$NON-NLS-0$  //$NON-NLS-1$
	"See the status" : "請參閱狀態", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose target location" : "請選擇目標位置", //$NON-NLS-0$  //$NON-NLS-1$
	"Default target location" : "預設的目標位置", //$NON-NLS-0$  //$NON-NLS-1$
	"Change..." : "變更...", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge Squash": "合併擠壓", //$NON-NLS-0$  //$NON-NLS-1$
	"Squash the content of the branch to the index" : "將分支的內容擠壓至索引", //$NON-NLS-0$  //$NON-NLS-1$
	"Local Branch Name:" : "本端分支名稱：", //$NON-NLS-0$  //$NON-NLS-1$
	"Local": "本端", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter items" : "過濾項目", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter filter" : "過濾訊息", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter author" : "過濾作者", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter committer" : "過濾確認者", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter sha1" : "過濾 sha1", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter fromDate" : "過濾開始日期 YYYY-MM-DD 或 1(h d w m y)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter toDate" : "過濾結束日期 YYYY-MM-DD 或 1(h d w m y)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter path" : "過濾路徑", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter remote branches" : "過濾遠端分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote branches" : "正在取得遠端分支 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote details": "正在取得遠端詳細資料：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchApplied": "已順利套用修補程式", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchFailed": "套用修補程式失敗。${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting branches" : "正在取得分支 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Paste link in email or IM" : "將鏈結貼在電子郵件或 IM 中", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in GitHub" : "在 GitHub 中顯示確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in GitHub" : "在 GitHub 中顯示儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in GitHub": "在 GitHub 中顯示此確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in eclipse.org": "在 eclipse.org 中顯示確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in eclipse.org" : "在 eclipse.org 中顯示此確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in eclipse.org":"在 eclipse.org 中顯示儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in eclipse.org":"在 eclipse.org 中顯示此儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review" : "要求檢閱", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review tooltip" : "傳送帶有要求的電子郵件供確定檢閱", //$NON-NLS-0$  //$NON-NLS-1$
	"Reviewer name" : "檢閱人員名稱", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request" : "要素項檢閱要求", //$NON-NLS-0$  //$NON-NLS-1$
	"Send the link to the reviewer" : "將鏈結傳送至檢閱人員", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key file (optional):" : "私密金鑰檔（選用）：", //$NON-NLS-0$  //$NON-NLS-1$
	"Don't prompt me again:" : "不再提示我：", //$NON-NLS-0$  //$NON-NLS-1$
	"Your private key will be saved in the browser for further use" : "您的私密金鑰會儲存在瀏覽器中供進一步使用", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading Contribution Review Request..." : "正在載入要素項檢閱要求...", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit can be found in the following repositories" : "在下列儲存庫中可以找到這項確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Try to update your repositories" : "嘗試更新儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Create new repository" : "建立新的儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"Attach the remote to one of your existing repositories" : "將遠端附加至現有的其中一個儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	"You are reviewing contribution ${0} from ${1}" : "您正在檢閱 ${0} 的要素項，其要素項來自 ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitNotFoundInWorkspace" : "很遺憾，在您的工作區中找不到這項確定。若要查看，請嘗試執行下列其中一項： ", //$NON-NLS-0$  //$NON-NLS-1$
 	"To review the commit you can also:" : "若要檢閱這項確定，您也可以：", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request for ${0} on ${1}" : "提出要素項檢閱要求 ${0} 於 ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Failing paths: ${0}": "失敗的路徑：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Problem while performing the action": "執行動作時發生問題", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the Orion repositories page to provide a git repository URL. Once the repository is created, it will appear in the Navigator.": "移至 Orion 儲存庫頁面來提供 Git 儲存庫 URL。建立儲存庫後，它會出現在「導覽器」中。", //$NON-NLS-0$  //$NON-NLS-1$
	"URL:": "URL：", //$NON-NLS-0$  //$NON-NLS-1$
	"File:": "檔案：", //$NON-NLS-0$  //$NON-NLS-1$
	"Submit": "提交", //$NON-NLS-0$  //$NON-NLS-1$
	"git url:": "git url： ", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert": "回復", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert changes introduced by the commit into your active branch": "將確定所引起的變更回復至作用中分支", //$NON-NLS-0$  //$NON-NLS-1$
	". Could not revert into active branch": ". 無法回復成作用中的分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"Login": "登入", //$NON-NLS-0$  //$NON-NLS-1$
	"Authentication required for: ${0}. ${1} and re-try the request.": "${0} 需要鑑別。${1}，並重試要求。", //$NON-NLS-0$  //$NON-NLS-1$
	"Save":"儲存", //$NON-NLS-0$  //$NON-NLS-1$
	"Remember my committer name and email:":"記住我的確認者名稱與電子郵件：", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully edited ${0} to have value ${1}":"已順利編輯 ${0} 使其具有值 ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully added ${0} with value ${1}":"已順利在 ${0} 中新增值 ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Signed-off-by: ":"登出者： ", //$NON-NLS-0$  //$NON-NLS-1$
	"Change-Id: ":"變更 ID： ", //$NON-NLS-0$  //$NON-NLS-1$
	"Push_REJECTED_NONFASTFORWARD":"推送是 non-fastforward，而遭到拒絕。請使用「提取」，來查看必須合併的新確定。", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit and Push" : "確定和推送", //$NON-NLS-0$  //$NON-NLS-1$
	"Sync" : "同步", //$NON-NLS-0$  //$NON-NLS-1$
	"SyncTooltip" : "從遠端分支提取。重設確地的基線，方法是將確定從作用中分支移除，然後根據遠端分支的最新狀態來重新啟動本端分支，並且將每一項確定套用至已更新的本端分支。從本端分支將確定和標籤推送至遠端分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"NoCommits" : "無變更", //$NON-NLS-0$  //$NON-NLS-1$
	"NoContent" : "沒有內容", //$NON-NLS-0$  //$NON-NLS-1$
	"Incoming" : "送入", //$NON-NLS-0$  //$NON-NLS-1$
	"Outgoing" : "送出", //$NON-NLS-0$  //$NON-NLS-1$
	"IncomingWithCount" : "送入 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"OutgoingWithCount" : "送出 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Synchronized" : "歷程", //$NON-NLS-0$  //$NON-NLS-1$
	"Uncommited" : "未確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository:" : "儲存庫：", //$NON-NLS-0$  //$NON-NLS-1$
	"Reference:" : "參照：", //$NON-NLS-0$  //$NON-NLS-1$
	"Author:" : "作者：", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer:" : "確認者：", //$NON-NLS-0$  //$NON-NLS-1$
	"SHA1:" : "SHA1：", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchCmd" : "顯示作用中的分支", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceCmd": "顯示參照", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceTip": "檢視 ${1} \"${2}\" 的歷程", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchTip": "檢視相對於 ${1} \"${2}\" 的 \"${0}\" 的歷程", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitType": "確定", //$NON-NLS-0$  //$NON-NLS-1$
	"BranchType": "分支", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranchType": "遠端分支", //$NON-NLS-0$  //$NON-NLS-1$
	"TagType": "標籤", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommitType": "隱藏", //$NON-NLS-0$  //$NON-NLS-1$
	"Path:" : "路徑：", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChanges" : "工作目錄變更", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChangesDetails" : "工作目錄詳細資料", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareChanges" : "比較 (${0} => ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"NoBranch" : "無分支", //$NON-NLS-0$  //$NON-NLS-1$
	"NoActiveBranch" : "沒有作用中的分支", //$NON-NLS-0$  //$NON-NLS-1$
	"NoRef" : "沒有選取的參照", //$NON-NLS-0$  //$NON-NLS-1$
	"None": "無", //$NON-NLS-0$  //$NON-NLS-1$
	"FileSelected": "已選取 ${0} 個檔案", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesSelected": "已選取 ${0} 個檔案", //$NON-NLS-0$  //$NON-NLS-1$
	"FileChanged": "${0} 個檔案已變更", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChanged": "${0} 個檔案已變更", //$NON-NLS-0$  //$NON-NLS-1$
	"file": "檔案", //$NON-NLS-0$  //$NON-NLS-1$
	"files": "個檔案", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitConfirm": "您未選取檔案。您確定要這樣做嗎？", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitWarning": "確定是空的", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChangedVsReadyToCommit": "${0} ${1}已變更。${2} ${3}已備妥可確定。", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitPush": "確定和推送", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits and pushes files to the default remote": "確定和推送檔案至預設遠端", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash" : "隱藏", //$NON-NLS-0$  //$NON-NLS-1$
	"stashIndex" : "stash@{${0}}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash all current changes away" : "隱藏所有的現行變更", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop" : "捨棄", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop the commit from the stash list" : "從隱藏清單中捨棄確定", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply" : "套用", //$NON-NLS-0$  //$NON-NLS-1$
	"Pop Stash" : "取出隱藏", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the most recently stashed change to your active branch and drop it from the stashes" : "將最近的隱藏變更套用到作用中的分支，並且從隱藏項目捨棄該隱藏變更", //$NON-NLS-0$  //$NON-NLS-1$
	"stashes" : "隱藏", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyName': "Git 儲存庫", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyTooltip': "將 git 儲存庫關聯到這個專案。",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectName': "Git 儲存庫",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectTooltip': "從 git 儲存庫建立專案。",  //$NON-NLS-0$  //$NON-NLS-1$
	'fetchGroup': '提取',  //$NON-NLS-0$  //$NON-NLS-1$
	'pushGroup' : '推送',  //$NON-NLS-0$  //$NON-NLS-1$
	'Url:' : 'URL：', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Private Key:' : 'Ssh 私密金鑰：', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Passphrase:' : 'Ssh 通行詞組：', //$NON-NLS-0$  //$NON-NLS-1$
	'confirmUnsavedChanges': '有未儲存的變更。您要儲存它們嗎？' //$NON-NLS-1$ //$NON-NLS-0$
});

