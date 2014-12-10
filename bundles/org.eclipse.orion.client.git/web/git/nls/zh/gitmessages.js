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
	"Compare": "比较", //$NON-NLS-0$  //$NON-NLS-1$
	"View the side-by-side compare": "查看并排比较", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirVer": "打开工作目录", //$NON-NLS-0$  //$NON-NLS-1$
	"Working Directory": "工作目录", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewWorkingDirVer": "查看文件的工作目录版本", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading...": "正在装入...", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories": "所有 Git 存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Repo": "存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"0 on 1 - Git": "${1} 上的 ${0} - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Git": "Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in eclipse.org": "在 eclipse.org 中显示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in GitHub": "在 GitHub 中显示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in GitHub": "在 GitHub 中显示此存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit Details": "落实详细信息", //$NON-NLS-0$  //$NON-NLS-1$
	"No Commits": "无落实", //$NON-NLS-0$  //$NON-NLS-1$
	"commit: 0": "落实：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"parent: 0": "父代：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"authored by 0 (1) on 2": "由 ${0} <${1}> 在 ${2} 进行了编辑", //$NON-NLS-0$  //$NON-NLS-1$
	"committed by 0 (1)": "由 ${0} <${1}> 落实", //$NON-NLS-0$  //$NON-NLS-1$
	"committedby": "落实者", //$NON-NLS-0$  //$NON-NLS-1$
	"authoredby": "编辑者", //$NON-NLS-0$  //$NON-NLS-1$
	"on": " 打开", //$NON-NLS-0$  //$NON-NLS-1$
	"nameEmail": "${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags:": "标记：", //$NON-NLS-0$  //$NON-NLS-1$
	"No Tags": "无标记", //$NON-NLS-0$  //$NON-NLS-1$
	"Diffs": "更改", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirChanges": "工作目录更改", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChanges": "落实更改", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChangesDialog": "落实更改", //$NON-NLS-0$  //$NON-NLS-1$
	"more": "更多...", //$NON-NLS-0$  //$NON-NLS-1$
	"less": "更少...", //$NON-NLS-0$  //$NON-NLS-1$
	"More": "更多", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFiles" : "更多文件", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFilesProgress": "正在装入更多文件...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommits": "“${0}”的更多落实", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommitsProgress": "正在为“${0}”装入更多落实...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranches": "“${0}”的更多分支", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranchesProgress": "正在为“${0}”装入更多分支...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTags": "更多标记", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTagsProgress": "正在装入更多标记...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashes": "更多隐藏项", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashesProgress": "正在装入更多隐藏项...", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading git log...": "正在装入 Git 日志...", //$NON-NLS-0$  //$NON-NLS-1$
	"local": "本地", //$NON-NLS-0$  //$NON-NLS-1$
	"remote": "远程", //$NON-NLS-0$  //$NON-NLS-1$
	"View All": "全部查看", //$NON-NLS-0$  //$NON-NLS-1$
	"Error ${0}: ": "错误 ${0}：", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading ": "正在装入", //$NON-NLS-0$  //$NON-NLS-1$
	"Message": "消息", //$NON-NLS-0$  //$NON-NLS-1$
	"Author": "作者", //$NON-NLS-0$  //$NON-NLS-1$
	"Date": "日期", //$NON-NLS-0$  //$NON-NLS-1$
	"fromDate:": "开始日期：", //$NON-NLS-0$  //$NON-NLS-1$
	"toDate:": "结束日期：", //$NON-NLS-0$  //$NON-NLS-1$
	"Actions": "操作", //$NON-NLS-0$  //$NON-NLS-1$
	"Branches": "分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags": "标记", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage": "登台", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged removal": "未登台的除去", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage": "未登台", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged removal": "已登台的除去", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged change": "未登台的更改", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged change": "已登台的更改", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged add": "未登台的添加", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged add": "已登台的添加", //$NON-NLS-0$  //$NON-NLS-1$
	"Addition": "添加", //$NON-NLS-0$  //$NON-NLS-1$
	"Deletion": "删除", //$NON-NLS-0$  //$NON-NLS-1$
	"Resolve Conflict": "解决冲突", //$NON-NLS-0$  //$NON-NLS-1$
	"Conflicting": "冲突", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message": "落实消息", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit": "落实", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitTooltip": "落实所选择的文件并提供所给定的消息。", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthMsgLink":"需要对 ${0} 进行认证。<a target=\"_blank\" href=\"${1}\">${2}</a>，然后重试该请求。</span>", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCommit": "输入落实消息", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCountCommit": "落实 ${0} 文件", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend last commit": "修改上次的落实", //$NON-NLS-0$  //$NON-NLS-1$
	" Amend": " 修改", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress. Choose action:": "正在重定基底。选择操作：", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgress": "正在重定基底", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseTip": "通过从活动分支中除去落实，然后根据“${0}”的最新状态来再次启动该活动分支，并将每个落实再次应用于已更新的活动分支，从而对落实重定基底。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebasingRepo": "正在对 Git 存储库重定基底", //$NON-NLS-0$  //$NON-NLS-1$
	"AddingConfig": "正在添加 Git 配置属性：键=${0}，值=${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"EditingConfig": "正在编辑 Git 配置属性：键=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"DeletingConfig": "正在删除 Git 配置属性：键=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"AddClone": "正在克隆存储库：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgressDetails": "正在为分支重定基底。\n\n\t合并冲突并选择所有文件之后使用“继续”；\n\t跳过以忽略当前补丁；\n\t异常终止以随时结束重定基底。", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer name:": "落实者名称：", //$NON-NLS-0$  //$NON-NLS-1$
	"Name:": "名称：", //$NON-NLS-0$  //$NON-NLS-1$
	"email:": "电子邮件：", //$NON-NLS-0$  //$NON-NLS-1$
	"Email:": "电子邮件：", //$NON-NLS-0$  //$NON-NLS-1$
	"Author name: ": "作者名称：", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged": "未登台", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged": "已登台", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangedFiles": "已更改的文件", //$NON-NLS-0$  //$NON-NLS-1$
	"Recent commits on": "最近落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status": "Git 状态", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Status": "对包含此文件或文件夹的存储库打开“Git 状态”页面。", //$NON-NLS-0$  //$NON-NLS-1$
	"GetGitIncomingMsg": "正在获取 Git 传入更改...", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout": "检出", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out...": "正在检出...", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage the change": "将更改登台", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging...": "正在登台...", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutSelectedFiles": "检出所选择的所有文件，并废弃所有更改", //$NON-NLS-0$  //$NON-NLS-1$
	"AddFilesToGitignore" : "将所选择的所有文件添加至 .gitignore 文件", //$NON-NLS-0$  //$NON-NLS-1$
	"Writing .gitignore rules" : "正在编写 .gitignore 规则", //$NON-NLS-0$  //$NON-NLS-1$ 
	"Save Patch": "保存补丁", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage the change": "取消将更改登台", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaging...": "正在取消登台...", //$NON-NLS-0$  //$NON-NLS-1$
	"Undo": "撤销", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoTooltip": "还原此落实，保留已更改的所有文件，对工作目录不进行任何更改。", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoConfirm": "活动分支的内容将替换为落实“${0}”。将保留在落实和工作目录中进行的所有更改。您确定吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"Reset": "重置", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetConfirm": "工作目录和索引中所有未登台和已登台的更改都将被废弃，并且无法恢复。\n\n确定要继续吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutConfirm" : "您对所选文件所作的更改将被废弃，并且无法恢复。\n\n确定要继续吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetBranchDiscardChanges": "重置分支，并废弃所有已登台和未登台的更改", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesIndexDiscardedMsg": "工作目录和索引中所有未登台和已登台的更改都将被废弃，并且无法恢复。", //$NON-NLS-0$  //$NON-NLS-1$
	"ContinueMsg": "确定要继续吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"KeepWorkDir" : "保留工作目录", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes...": "正在重置本地更改...", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue rebase...": "继续重定基底...", //$NON-NLS-0$  //$NON-NLS-1$
	"Skipping patch...": "正在跳过补丁...", //$NON-NLS-0$  //$NON-NLS-1$
	"Aborting rebase...": "正在退出重定基底...", //$NON-NLS-0$  //$NON-NLS-1$
	"Complete log": "完整日志", //$NON-NLS-0$  //$NON-NLS-1$
	"local VS index": "本地 VS 索引", //$NON-NLS-0$  //$NON-NLS-1$
	"index VS HEAD": "索引 VS HEAD", //$NON-NLS-0$  //$NON-NLS-1$
	"Compare(${0} : ${1})": "比较（${0}：${1}）", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading status...": "正在装入状态...", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing...": "正在落实... ", //$NON-NLS-0$  //$NON-NLS-1$
	"The author name is required.": "作者名是必需的。", //$NON-NLS-0$  //$NON-NLS-1$
	"The author mail is required.": "作者邮件是必需的。", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoConflict": ". 存储库仍然包含冲突。", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoUnmergedPathResolveConflict": ". 存储库包含未合并的路径。请首先解决冲突。", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering ${0}": "正在呈示 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Configuration": "配置", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting configuration of": "正在获取 ${0} 的配置", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting git repository details": "正在获取 Git 存储库详细信息", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting changes": "正在获取更改", //$NON-NLS-0$  //$NON-NLS-1$
	" - Git": " - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories - Git": "存储库 - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository": "存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository Not Found": "找不到存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"No Repositories": "无存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repository": "正在装入存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repositories": "正在装入存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"(no remote)": "（无远程分支）", //$NON-NLS-0$  //$NON-NLS-1$
	"location: ": "位置：", //$NON-NLS-0$  //$NON-NLS-1$
	"NumFilesStageAndCommit": "${0} 个文件要登台，${1} 个文件要落实。", //$NON-NLS-0$  //$NON-NLS-1$
 	"Nothing to commit.": "没有要落实的内容", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing to push.": "没有要推送的内容。", //$NON-NLS-0$  //$NON-NLS-1$
	"NCommitsToPush": "${0} 个落实需要推送。", //$NON-NLS-0$  //$NON-NLS-1$
	"You have no changes to commit.": "您没有要落实的更改。", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress!": "正在重定基底！", //$NON-NLS-0$  //$NON-NLS-1$
	"View all local and remote tracking branches": "查看所有本地跟踪分支和远程跟踪分支", //$NON-NLS-0$  //$NON-NLS-1$
	"tracksNoBranch": "不跟踪分支", //$NON-NLS-0$  //$NON-NLS-1$
	"tracks": "跟踪 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"last modified ${0} by ${1}": "由 ${1} 最近一次修改 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remote Branches": "没有远程分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering branches": "呈示分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits": "落实数", //$NON-NLS-0$  //$NON-NLS-1$
	"GettingCurrentBranch": "正在获取 ${0} 的当前分支", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Log": "查看完整日志", //$NON-NLS-0$  //$NON-NLS-1$
	"See the full log": "查看完整的日志", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting commits for \"${0}\" branch": "正在获取“${0}”分支的落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering commits": "正在呈示落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting outgoing commits": "正在获取传出落实", //$NON-NLS-0$  //$NON-NLS-1$
	"The branch is up to date.": "最新的分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"NoOutgoingIncomingCommits": "您没有任何传出或传入落实。", //$NON-NLS-0$  //$NON-NLS-1$
 	") by ": "）由", //$NON-NLS-0$  //$NON-NLS-1$
	" (SHA ": " (SHA ", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting tags": "获取标记", //$NON-NLS-0$  //$NON-NLS-1$
	"View all tags": "查看所有标记", //$NON-NLS-0$  //$NON-NLS-1$
	" on ": " 打开", //$NON-NLS-0$  //$NON-NLS-1$
	" by ": " 为 ", //$NON-NLS-0$  //$NON-NLS-1$
	"Remotes": "远程对象", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering remotes": "正在呈示远程对象", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remotes": "无远程对象", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged addition": "未登台的添加", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged addition": "已登台的添加", //$NON-NLS-0$  //$NON-NLS-1$
	" (Rebase in Progress)": " （正在重定基底）", //$NON-NLS-0$  //$NON-NLS-1$
	"Status": "状态", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0)": "日志 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0) - 1": "日志 (${0}) - ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Status for ${0} - Git ": "${0} 的状态 - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"No Unstaged Changes": "没有未登台的更改", //$NON-NLS-0$  //$NON-NLS-1$
	"No Staged Changes": "没有已登台的更改", //$NON-NLS-0$  //$NON-NLS-1$
	"Changes for \"${0}\" branch": "${0} 的更改", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch": "${0} 的落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch against": "“${0}”分支的落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Add Remote": "添加远程对象", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Name:": "远程对象名称：", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote URI:": "远程 URI：", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply Patch": "应用补丁", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyPatchDialog": "应用补丁", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Repository": "Git 存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the git repository": "为此文件或文件夹打开“Git 存储库”页面。", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Git Repository": "克隆 Git 存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"CloneGitRepositoryDialog": "克隆 Git 存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository URL:": "存储库 URL：", //$NON-NLS-0$  //$NON-NLS-1$
	"Existing directory:": "现有目录：", //$NON-NLS-0$  //$NON-NLS-1$
	"New folder:": "新建文件夹：", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseFolderDialog": "选择文件夹", //$NON-NLS-0$  //$NON-NLS-1$
	"Message:": "消息：", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend:": "修改：", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartAmend": "修改先前的落实", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangeId:": "更改标识：", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartChangeId": "将更改标识添加到消息", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Name:": "落实者名称：", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Email:": "落实者电子邮件：", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorNamePlaceholder": "输入作者名称", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorEmailPlaceholder": "输入作者电子邮件", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterNamePlaceholder": "输入落实者名称", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterEmailPlaceholder": "输入落实者电子邮件", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Name:": "作者名称：", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Email:": "作者电子邮件：", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit message is required.": "落实消息是必需的。", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Credentials": "Git 凭证", //$NON-NLS-0$  //$NON-NLS-1$
	"Username:": "用户名：", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key:": "专用密钥：", //$NON-NLS-0$  //$NON-NLS-1$
	"Passphrase (optional):": "口令（可选）：", //$NON-NLS-0$  //$NON-NLS-1$
	"commit:": "落实：", //$NON-NLS-0$  //$NON-NLS-1$
	"parent:": "父代：", //$NON-NLS-0$  //$NON-NLS-1$
	"branches: ": "分支：", //$NON-NLS-0$  //$NON-NLS-1$
	"tags: ": "标记：", //$NON-NLS-0$  //$NON-NLS-1$
	"tags": "标记", //$NON-NLS-0$  //$NON-NLS-1$
	" authored by ${0} {${1}) on ${2}": " 由 ${0} (${1}) 在 ${2} 进行了编辑", //$NON-NLS-0$  //$NON-NLS-1$
	"Content": "内容", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to ${0} section": "转至 ${0} 部分", //$NON-NLS-0$  //$NON-NLS-1$
	"Type the commit name (sha1):": "输入落实名称 (sha1)：", //$NON-NLS-0$  //$NON-NLS-1$
	"Search": "搜索", //$NON-NLS-0$  //$NON-NLS-1$
	"Searching...": "正在搜索...", //$NON-NLS-0$  //$NON-NLS-1$
	"SelectAll": "全选", //$NON-NLS-0$  //$NON-NLS-1$
	"Looking for the commit": "正在查找落实...", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch:": "新建分支：", //$NON-NLS-0$  //$NON-NLS-1$
	"No remote selected": "未选择远程对象", //$NON-NLS-0$  //$NON-NLS-1$
	"Enter a name...": "请输入名称...", //$NON-NLS-0$  //$NON-NLS-1$
	"OK": "确定", //$NON-NLS-0$  //$NON-NLS-1$
	"Cancel": "取消", //$NON-NLS-0$  //$NON-NLS-1$
	"Clear": "清除", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter": "过滤", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommits": "过滤落实", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommitsTip": "切换过滤落实面板", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeCmd": "最大化", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeTip": "切换编辑器的最大化状态", //$NON-NLS-0$  //$NON-NLS-1$
	" [New branch]": " [新建分支]", //$NON-NLS-0$  //$NON-NLS-1$
	"AddKeyToHostContinueOp": "要为主机 ${1} 添加 ${0} 以继续执行操作吗？密钥手指模板为 ${2}。", //$NON-NLS-0$  //$NON-NLS-1$
 	"Link Repository": "链接存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Folder name:": "文件夹名：", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository was linked to ": "存储库已链接至", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutCommitTooltip": "检出此落实，并根据其内容创建本地分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutTagTooltip": "检出此标记，并根据其内容创建本地分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out ${0}": "正在检出 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutBranchMsg": "检出该分支或者相应的本地分支并使其处于活动状态。如果远程跟踪分支不具备相应的本地分支，那么首先将创建本地分支。", //$NON-NLS-0$  //$NON-NLS-1$
 	"Checking out branch...": "正在检出分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding branch ${0}...": "正在添加分支 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing branch ${0}...": "正在除去分支 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding remote ${0}...": "正在添加远程 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote ${0}...": "正在除去远程 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing repository ${0}": "正在除去存储库 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding tag {$0}": "正在添加标记 {$0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing tag {$0}": "正在除去标记 {$0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Merging ${0}": "正在合并 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	'Unstaging changes' : '正在取消将更改登台', //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out branch ${0}...": "正在检出分支 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch checked out.": "已检出分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch": "新建分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new local branch to the repository": "将新的本地分支添加到存储库中", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch name": "分支名称", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete": "删除", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the local branch from the repository": "从存储库中删除本地分支", //$NON-NLS-0$  //$NON-NLS-1$
	"DelBrConfirm": "确定要删除分支 ${0} 吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote tracking branch from the repository": "从存储库中删除远程跟踪分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure?": "您确定吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoveRemoteBranchConfirm": "您将删除远程分支“${0}”并推送更改。\n\n您确定吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote branch: ": "正在除去远程分支：", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete Remote Branch": "删除远程分支", //$NON-NLS-0$  //$NON-NLS-1$
	"New Remote": "新建远程对象", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Remote": "Git 远程对象", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Remote": "为此文件或文件夹打开远程“Git 日志”页面。", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new remote to the repository": "将新的远程对象添加到存储库中", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote from the repository": "从存储库中删除远程对象", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete remote ${0}?": "确定要删除远程对象 ${0} 吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull": "拉取", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull from the repository": "从存储库中拉取", //$NON-NLS-0$  //$NON-NLS-1$
	"Pulling: ": "正在拉取：", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull Git Repository": "拉取 Git 存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Log": "Git 日志", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Log": "为此文件或文件夹打开本地“Git 日志”页面。", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the branch": "打开分支的日志", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the repository": "打开存储库的日志", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the status for the repository": "打开存储库的状态", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditor": "在编辑器中显示", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditorTooltip": "在编辑器中显示存储库文件夹", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareEach": "互相比较", //$NON-NLS-0$  //$NON-NLS-1$
 	"Compare With Working Tree": "与工作树比较", //$NON-NLS-0$  //$NON-NLS-1$
	"Open": "打开", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenGitCommitTip": "查看此落实的树", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitVersion": "打开落实", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewCommitVersionTip": "查看已落实版本的文件", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch": "访存", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote": "从远程对象访存", //$NON-NLS-0$  //$NON-NLS-1$
	"Password:": "密码：", //$NON-NLS-0$  //$NON-NLS-1$
	"User Name:": "用户名：", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching remote: ": "正在访存远程对象：", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Fetch": "强制访存", //$NON-NLS-0$  //$NON-NLS-1$
	"FetchRemoteBranch": "从远程分支访存到远程跟踪分支中并覆盖其当前内容", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentRemoteTrackingBr": "您将覆盖远程跟踪分支的内容。这可能会导致该分支失去落实。", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge": "合并", //$NON-NLS-0$  //$NON-NLS-1$
	"MergeContentFrmBr": "将该分支的内容合并到活动分支中", //$NON-NLS-0$  //$NON-NLS-1$
 	". Go to ${0}.": ". 转至 ${0}。", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status page": "“Git 状态”页面", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase": "重定基底", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsMsg": "通过从活动分支中除去落实，然后根据所选分支的最新状态来再次启动此活动分支，从而对落实重定基底", //$NON-NLS-0$  //$NON-NLS-1$
 	"Rebase on top of ": "基于以下对象重定基底", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseSTOPPED": ". 发生了一些冲突。请解决这些冲突之后继续，跳过补丁或者异常终止重定基底。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_WRONG_REPOSITORY_STATE": ". 存储库状态无效（即，已经在重定基底）。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_UNMERGED_PATHS": ". 存储库包含未合并的路径。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_PENDING_CHANGES": ". 存储库中包含暂挂的更改。请落实或隐藏这些更改。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseUNCOMMITTED_CHANGES": ". 存在未落实的更改。", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsByRmvingThem": "通过从活动分支中除去落实，", //$NON-NLS-0$  //$NON-NLS-1$
	"StartActiveBranch": "然后根据所选分支的最新状态来再次启动此活动分支，", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyEachCommitAgain": "并对更新后的活动分支再次应用每个落实，从而对落实重定基底。", //$NON-NLS-0$  //$NON-NLS-1$
	"Push All": "全部推送", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocal": "将落实和标记从本地分支推送到远程分支", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push Branch": "推送分支", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushResult": "推送结果：", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushCommitsWithoutTags": "将没有标记的落实从本地分支推送到远程分支", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push for Review": "推送以复审", //$NON-NLS-0$  //$NON-NLS-1$
	"Push commits to Gerrit Code Review": "推送落实以进行 Gerrit 代码复审", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push Branch": "强制推送分支", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsWithoutTagsOverridingCurrentContent": "将没有标记的落实从本地分支推送到推送到远程分支并覆盖其当前内容", //$NON-NLS-0$  //$NON-NLS-1$
 	"Pushing remote: ": "正在推送远程对象：", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseBranchDialog": "选择分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose the remote branch.": "请选择远程分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push All": "强制全部推送", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocalBr": "将落实和标记从本地分支推送到远程分支并覆盖其当前内容", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentOfRemoteBr": "您将覆盖远程分支的内容。这可能会导致该远程存储库丢失落实项。", //$NON-NLS-0$  //$NON-NLS-1$
	"< Previous Page": "< 上一页", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git log": "显示 Git 日志的上一页", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git tags" : "显示 Git 标记的上一页", //$NON-NLS-0$  //$NON-NLS-1$
	"Next Page >": "下一页 >", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git log": "显示 Git 日志的下一页", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git tags" : "显示 Git 标记的下一页", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the selected remote branch": "从本地分支推送到所选择的远程分支", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetActiveBr": "将活动分支复位为此引用的状态。废弃所有已登台的更改和未登台的更改。", //$NON-NLS-0$  //$NON-NLS-1$
 	"GitResetIndexConfirm": "活动分支的内容将替换为落实“${0}”。如果未选中“${1}”，那么所有未登台和已登台的更改都将被废弃，并且无法恢复。您确定吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting index...": "正在重置索引...", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting git index for ${0}" : "正在为 ${0} 重置 Git 索引", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag": "标记", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a tag for the commit": "为落实创建标记", //$NON-NLS-0$  //$NON-NLS-1$
	"ProjectSetup": "正在设置项目。这可能需要一分钟的时间...", //$NON-NLS-0$  //$NON-NLS-1$
	"LookingForProject": "正在查找项目：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag name": "标记名称", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the tag from the repository": "从存储库中删除此标记", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete tag ${0}?": "确定要删除标记 ${0} 吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"Cherry-Pick": "选出最佳项目", //$NON-NLS-0$  //$NON-NLS-1$
	"CherryPicking": "选出最佳项目落实：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RevertingCommit": "还原落实：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the change introduced by the commit to your active branch": "对活动分支应用由落实引入的更改", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing changed.": "未进行任何更改。", //$NON-NLS-0$  //$NON-NLS-1$
	". Some conflicts occurred": ". 发生了一些冲突。", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote branch into your remote tracking branch": "从远程分支访存到远程跟踪分支中", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch Git Repository": "访存 Git 存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Push": "推送", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the remote branch": "从本地分支推送到远程分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Push Git Repository": "推送 Git 存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Key:": "键：", //$NON-NLS-0$  //$NON-NLS-1$
	"Value:": "值：", //$NON-NLS-0$  //$NON-NLS-1$
	"New Configuration Entry": "新建配置条目", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit": "编辑", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit the configuration entry": "编辑配置条目", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the configuration entry": "删除配置条目", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete ${0}?": "确定要删除${0}吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Repository": "克隆存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone an existing Git repository to a folder": "将现有 Git 存储库克隆到文件夹中", //$NON-NLS-0$  //$NON-NLS-1$
	"Cloning repository: ": "正在克隆存储库：", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Repository": "初始化存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a new Git repository in a new folder": "在新的文件夹中创建新的 Git 存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Initializing repository: ": "正在初始化存储库：", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Git Repository": "初始化 Git 存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the repository": "删除存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want do delete ${0} repositories?": "确定要删除 ${0} 存储库吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply a patch on the selected repository": "对所选择的存储库应用补丁", //$NON-NLS-0$  //$NON-NLS-1$
	"Show content": "显示内容", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit name:": "落实名称：", //$NON-NLS-0$  //$NON-NLS-1$
	"Open Commit": "打开落实", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitDialog": "打开落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the commit with the given name": "打开具有所给定名称的落实", //$NON-NLS-0$  //$NON-NLS-1$
	"No commits found": "找不到任何落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging changes": "正在将更改登台", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message:": "落实消息：", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing changes": "正在落实更改", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching previous commit message": "正在访存先前落实消息", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes": "正在重置本地更改", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout files, discarding all changes": "检出文件，并废弃所有更改", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Patch": "显示补丁", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading default workspace": "正在装入缺省工作空间", //$NON-NLS-0$  //$NON-NLS-1$
	"Show workspace changes as a patch": "将工作空间更改作为补丁显示", //$NON-NLS-0$  //$NON-NLS-1$
	"Show checked changes as a patch": "将已检查的更改作为补丁显示", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowCommitPatchTip": "显示此落实中对更改的补丁", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue": "继续", //$NON-NLS-0$  //$NON-NLS-1$
	"Contibue Rebase": "继续重定基底", //$NON-NLS-0$  //$NON-NLS-1$
	"Skip Patch": "跳过补丁", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort": "放弃", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort Rebase": "异常终止重定基底", //$NON-NLS-0$  //$NON-NLS-1$
	"Discard": "废弃", //$NON-NLS-0$  //$NON-NLS-1$
	"Ignore": "忽略", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesSelectedFilesDiscard": "您对所选文件所作的更改将被废弃，并且无法恢复。", //$NON-NLS-0$  //$NON-NLS-1$
 	"Getting git log": "正在获取 Git 日志", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting stashed changes...": "正在获取隐藏的更改...", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch (${0})": "活动分支 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch (${0})": "分支 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag (${0})": "标记 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit (${0})": "落实 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommit (${0})": "隐藏项 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"WIPStash": "${0} 上的 WIP：${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"IndexStash": "${0} 上的索引：${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranch (${0})": "远程分支 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch Log": "Git 日志（活动分支）", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the active local branch": "显示活动本地分支的日志", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Branch Log": "Git 日志（远程分支）", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the corresponding remote tracking branch": "显示相应的远程跟踪分支的日志", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Status" : "查看完整状态", //$NON-NLS-0$  //$NON-NLS-1$
	"See the status" : "查看状态", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose target location" : "选择目标位置", //$NON-NLS-0$  //$NON-NLS-1$
	"Default target location" : "缺省目标位置", //$NON-NLS-0$  //$NON-NLS-1$
	"Change..." : "更改...", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge Squash": "合并压缩", //$NON-NLS-0$  //$NON-NLS-1$
	"Squash the content of the branch to the index" : "将分支的内容压缩到索引", //$NON-NLS-0$  //$NON-NLS-1$
	"Local Branch Name:" : "本地分支名称：", //$NON-NLS-0$  //$NON-NLS-1$
	"Local": "本地", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter items" : "过滤项目", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter filter" : "过滤消息", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter author" : "过滤作者", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter committer" : "过滤落实者", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter sha1" : "过滤 sha1", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter fromDate" : "过滤起始日期 YYYY-MM-DD 或 1(h d w m y)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter toDate" : "过滤终止日期 YYYY-MM-DD 或 1(h d w m y)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter path" : "过滤路径", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter remote branches" : "过滤远程分支", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote branches" : "正在获取远程分支 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote details": "正在获取远程详细信息：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchApplied": "已成功应用补丁", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchFailed": "应用补丁失败。${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting branches" : "正在获取分支 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Paste link in email or IM" : "在电子邮件或 IM 中粘贴链接", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in GitHub" : "在 GitHub 中显示落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in GitHub" : "在 GitHub 中显示存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in GitHub": "在 GitHub 中显示此落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in eclipse.org": "在 eclipse.org 中显示落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in eclipse.org" : "在 eclipse.org 中显示此落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in eclipse.org":"在 eclipse.org 中显示存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in eclipse.org":"在 eclipse.org 中显示此存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review" : "请求复审", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review tooltip" : "发送电子邮件请求落实复审", //$NON-NLS-0$  //$NON-NLS-1$
	"Reviewer name" : "复审者名称", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request" : "添加复审请求", //$NON-NLS-0$  //$NON-NLS-1$
	"Send the link to the reviewer" : "将链接发送到复审者", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key file (optional):" : "专用密钥文件（可选）：", //$NON-NLS-0$  //$NON-NLS-1$
	"Don't prompt me again:" : "不要再次提示我：", //$NON-NLS-0$  //$NON-NLS-1$
	"Your private key will be saved in the browser for further use" : "您的专用密钥将保存在浏览器中以备后用", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading Contribution Review Request..." : "正在装入添加项复审请求...", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit can be found in the following repositories" : "可以在下列存储库中找到该落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Try to update your repositories" : "尝试更新存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Create new repository" : "创建新的存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"Attach the remote to one of your existing repositories" : "将远程对象附加到现有的其中一个存储库", //$NON-NLS-0$  //$NON-NLS-1$
	"You are reviewing contribution ${0} from ${1}" : "您正在复查来自 ${1} 的添加项 ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitNotFoundInWorkspace" : "很遗憾，在工作空间中找不到该落实。要进行查看，请尝试执行下列其中一项操作：", //$NON-NLS-0$  //$NON-NLS-1$
 	"To review the commit you can also:" : "要复查该落实，您还可以：", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request for ${0} on ${1}" : "对 ${1} 上的 ${0} 添加复查请求", //$NON-NLS-0$  //$NON-NLS-1$
	"Failing paths: ${0}": "失败路径：${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Problem while performing the action": "执行该操作时发生问题", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the Orion repositories page to provide a git repository URL. Once the repository is created, it will appear in the Navigator.": "转至“Orion 存储库”页面以提供 Git 存储库 URL。一旦创建了存储库，它就会出现在导航器中。", //$NON-NLS-0$  //$NON-NLS-1$
	"URL:": "URL：", //$NON-NLS-0$  //$NON-NLS-1$
	"File:": "文件：", //$NON-NLS-0$  //$NON-NLS-1$
	"Submit": "提交", //$NON-NLS-0$  //$NON-NLS-1$
	"git url:": "GIT URL：", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert": "还原", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert changes introduced by the commit into your active branch": "对活动分支还原由落实引入的更改", //$NON-NLS-0$  //$NON-NLS-1$
	". Could not revert into active branch": ". 未能还原到活动分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"Login": "登录", //$NON-NLS-0$  //$NON-NLS-1$
	"Authentication required for: ${0}. ${1} and re-try the request.": "需要对 ${0} 进行认证。${1}，然后重试该请求。", //$NON-NLS-0$  //$NON-NLS-1$
	"Save":"保存", //$NON-NLS-0$  //$NON-NLS-1$
	"Remember my committer name and email:":"请记住我的落实者名称和电子邮件：", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully edited ${0} to have value ${1}":"已成功编辑 ${0}，使其具有值 ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully added ${0} with value ${1}":"为 ${0} 成功添加了值 ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Signed-off-by: ":"注销者：", //$NON-NLS-0$  //$NON-NLS-1$
	"Change-Id: ":"更改标识：", //$NON-NLS-0$  //$NON-NLS-1$
	"Push_REJECTED_NONFASTFORWARD":"推送非快进，并且已被拒绝。使用“访存”来查看必须合并的新落实。", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit and Push" : "落实和推送", //$NON-NLS-0$  //$NON-NLS-1$
	"Sync" : "同步", //$NON-NLS-0$  //$NON-NLS-1$
	"SyncTooltip" : "从远程分支访存。通过从本地分支中除去落实，然后根据远程分支的最新状态来再次启动此本地分支，并将每个落实应用于已更新的本地分支，从而对落实重定基底。将落实和标记从本地分支推送到远程分支。", //$NON-NLS-0$  //$NON-NLS-1$
	"NoCommits" : "无更改", //$NON-NLS-0$  //$NON-NLS-1$
	"NoContent" : "无内容", //$NON-NLS-0$  //$NON-NLS-1$
	"Incoming" : "传入", //$NON-NLS-0$  //$NON-NLS-1$
	"Outgoing" : "传出", //$NON-NLS-0$  //$NON-NLS-1$
	"IncomingWithCount" : "传入 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"OutgoingWithCount" : "传出 (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Synchronized" : "历史记录", //$NON-NLS-0$  //$NON-NLS-1$
	"Uncommited" : "未落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository:" : "存储库：", //$NON-NLS-0$  //$NON-NLS-1$
	"Reference:" : "引用：", //$NON-NLS-0$  //$NON-NLS-1$
	"Author:" : "作者：", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer:" : "落实者：", //$NON-NLS-0$  //$NON-NLS-1$
	"SHA1:" : "SHA1：", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchCmd" : "显示活动分支", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceCmd": "显示引用", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceTip": "查看 ${1}“${2}”的历史记录", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchTip": "查看“${0}”中与 ${1}“${2}”相关的历史记录", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitType": "落实", //$NON-NLS-0$  //$NON-NLS-1$
	"BranchType": "分支", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranchType": "远程分支", //$NON-NLS-0$  //$NON-NLS-1$
	"TagType": "标记", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommitType": "隐藏", //$NON-NLS-0$  //$NON-NLS-1$
	"Path:" : "路径：", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChanges" : "工作目录更改", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChangesDetails" : "工作目录详细信息", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareChanges" : "比较 (${0} => ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"NoBranch" : "无分支", //$NON-NLS-0$  //$NON-NLS-1$
	"NoActiveBranch" : "无活动分支", //$NON-NLS-0$  //$NON-NLS-1$
	"NoRef" : "未选择引用", //$NON-NLS-0$  //$NON-NLS-1$
	"None": "无", //$NON-NLS-0$  //$NON-NLS-1$
	"FileSelected": "选择了 ${0} 个文件", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesSelected": "选择了 ${0} 个文件", //$NON-NLS-0$  //$NON-NLS-1$
	"FileChanged": "更改了 ${0} 文件", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChanged": "更改了 ${0} 个文件", //$NON-NLS-0$  //$NON-NLS-1$
	"file": "文件", //$NON-NLS-0$  //$NON-NLS-1$
	"files": "文件", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitConfirm": "您没有选择文件。您确定吗？", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitWarning": "落实为空", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChangedVsReadyToCommit": "${0} ${1} 已更改。${2} ${3} 准备好进行落实。", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitPush": "落实和推送", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits and pushes files to the default remote": "落实文件并将其推送到缺省远程位置", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash" : "隐藏", //$NON-NLS-0$  //$NON-NLS-1$
	"stashIndex" : "stash@{${0}}：${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash all current changes away" : "隐藏所有当前更改", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop" : "删除", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop the commit from the stash list" : "从隐藏列表中删除落实", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply" : "应用", //$NON-NLS-0$  //$NON-NLS-1$
	"Pop Stash" : "应用隐藏的更改", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the most recently stashed change to your active branch and drop it from the stashes" : "将最近隐藏的更改应用至活动分支，并从隐藏中删除这些项", //$NON-NLS-0$  //$NON-NLS-1$
	"stashes" : "隐藏", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyName': "Git 存储库", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyTooltip': "将 Git 存储库与此项目相关联。",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectName': "Git 存储库",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectTooltip': "从 Git 存储库创建项目。",  //$NON-NLS-0$  //$NON-NLS-1$
	'fetchGroup': '访存',  //$NON-NLS-0$  //$NON-NLS-1$
	'pushGroup' : '推送',  //$NON-NLS-0$  //$NON-NLS-1$
	'Url:' : 'Url：', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Private Key:' : 'Ssh 专用密钥：', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Passphrase:' : 'Ssh 口令：', //$NON-NLS-0$  //$NON-NLS-1$
	'confirmUnsavedChanges': '存在未保存的更改。要保存这些更改吗？' //$NON-NLS-1$ //$NON-NLS-0$
});

