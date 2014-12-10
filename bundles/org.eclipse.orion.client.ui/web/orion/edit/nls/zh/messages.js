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
	"Editor": "编辑器", //$NON-NLS-1$ //$NON-NLS-0$
	"switchEditor": "切换编辑器", //$NON-NLS-1$ //$NON-NLS-0$
	"Fetching": "正在访存：${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"confirmUnsavedChanges": "存在未保存的更改。仍然要浏览吗？", //$NON-NLS-1$ //$NON-NLS-0$
	"searchFiles": "快速搜索...", //$NON-NLS-1$ //$NON-NLS-0$
	"searchTerm": "输入搜索项：", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedChanges": "存在未保存的更改。", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedAutoSaveChanges": "请停留在该页面，直到完成“自动保存”为止。", //$NON-NLS-1$ //$NON-NLS-0$
	"Save": "保存", //$NON-NLS-1$ //$NON-NLS-0$
	"Saved": "已保存", //$NON-NLS-1$ //$NON-NLS-0$
	"Blame": "负责", //$NON-NLS-1$ //$NON-NLS-0$
	"BlameTooltip":"显示负责注释", //$NON-NLS-1$ //$NON-NLS-0$
	"saveOutOfSync": "资源与服务器不同步。无论如何都要保存此资源吗？", //$NON-NLS-1$ //$NON-NLS-0$
	"loadOutOfSync": "资源与服务器不同步。无论如何都要将其装入吗？这将覆盖您在本地所作的更改。", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadata": "正在读取 ${0} 的元数据", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadataError": "无法获取 ${0} 的元数据", //$NON-NLS-1$ //$NON-NLS-0$
	"Reading": "正在读取 ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"readonly": "只读。", //$NON-NLS-1$ //$NON-NLS-0$
	"saveFile": "保存此文件", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleZoomRuler": "切换缩放标尺", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "转至行...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLineTooltip": "转至所指定的行号", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompt": "转至行：", //$NON-NLS-1$ //$NON-NLS-0$
	"Undo": "撤销", //$NON-NLS-1$ //$NON-NLS-0$
	"Redo": "重做", //$NON-NLS-1$ //$NON-NLS-0$
	"Find": "查找...", //$NON-NLS-1$ //$NON-NLS-0$
	"noResponse": "服务器没有响应。请检查因特网连接，然后重试。", //$NON-NLS-1$ //$NON-NLS-0$
	"savingFile": "正在保存文件 ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"running": "正在运行 ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"Saving..." : "正在保存...", //$NON-NLS-1$ //$NON-NLS-0$
	"View": "查看", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanel": "侧面板", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanelTooltip": "选择要在侧面板中显示的内容。", //$NON-NLS-1$ //$NON-NLS-0$
	"Slideout": "滑出式", //$NON-NLS-1$ //$NON-NLS-0$
	"Actions": "操作", //$NON-NLS-1$ //$NON-NLS-0$
	"Navigator": "导航器", //$NON-NLS-1$ //$NON-NLS-0$
	"FolderNavigator": "文件夹导航器", //$NON-NLS-1$ //$NON-NLS-0$
	"Project": "项目", //$NON-NLS-1$ //$NON-NLS-0$
	"New": "新建", //$NON-NLS-1$ //$NON-NLS-0$
	"File": "文件", //$NON-NLS-1$ //$NON-NLS-0$
	"Edit": "编辑", //$NON-NLS-1$ //$NON-NLS-0$
	"Tools": "工具", //$NON-NLS-1$ //$NON-NLS-0$
	"Add": "添加", //$NON-NLS-1$ //$NON-NLS-0$
	"noActions": "不存在对当前选择执行的操作。", //$NON-NLS-1$ //$NON-NLS-0$
	"NoFile": "使用 ${0} 来创建新的文件和文件夹。单击文件以开始编码。", //$NON-NLS-1$ //$NON-NLS-0$
	"LocalEditorSettings": "本地编辑器设置", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProject": "${0} 不是项目。要将其转换为项目，请使用 ${1}。", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProjects": "工作空间中不存在项目。请使用${0}菜单来创建项目。", //$NON-NLS-1$ //$NON-NLS-0$
	"Disconnected": "${0}（已断开连接）", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFS": "选择文件系统", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFSTooltip": "请选择您要查看的文件系统。", //$NON-NLS-1$ //$NON-NLS-0$
	"FSTitle": "${0} (${1})", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy": "部署", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy As": "部署方式", //$NON-NLS-1$ //$NON-NLS-0$
	"Import": "导入", //$NON-NLS-1$ //$NON-NLS-0$
	"Export": "导出", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenWith": "打开方式", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenRelated": "打开相关项", //$NON-NLS-1$ //$NON-NLS-0$
	"Dependency": "依赖关系", //$NON-NLS-1$ //$NON-NLS-0$
	"UnnamedCommand": "未命名", //$NON-NLS-1$ //$NON-NLS-0$
	"searchInFolder": "在文件夹中搜索...",  //$NON-NLS-1$ //$NON-NLS-0$
	"Global Search": "全局搜索...", //$NON-NLS-1$ //$NON-NLS-0$
	"ClickEditLabel": "单击此项以进行编辑", //$NON-NLS-1$ //$NON-NLS-0$
	"ProjectInfo": "项目信息", //$NON-NLS-1$ //$NON-NLS-0$
	"DeployInfo": "部署信息", //$NON-NLS-1$ //$NON-NLS-0$
	"Name": "名称", //$NON-NLS-1$ //$NON-NLS-0$
	"Description": "描述", //$NON-NLS-1$ //$NON-NLS-0$
	"Site": "站点", //$NON-NLS-1$ //$NON-NLS-0$
	'projectsSectionTitle': '项目',  //$NON-NLS-0$  //$NON-NLS-1$
	'listingProjects': '正在列示项目...',  //$NON-NLS-0$  //$NON-NLS-1$
	'gettingWorkspaceInfo': '正在获取工作空间信息...',  //$NON-NLS-0$  //$NON-NLS-1$
	"showProblems": "显示问题...",  //$NON-NLS-1$ //$NON-NLS-0$
});

