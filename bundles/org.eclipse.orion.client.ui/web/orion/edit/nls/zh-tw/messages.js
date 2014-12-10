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
	"Editor": "編輯器", //$NON-NLS-1$ //$NON-NLS-0$
	"switchEditor": "切換編輯器", //$NON-NLS-1$ //$NON-NLS-0$
	"Fetching": "正在提取：${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"confirmUnsavedChanges": "有未儲存的變更。您仍要離開嗎？", //$NON-NLS-1$ //$NON-NLS-0$
	"searchFiles": "快速搜尋...", //$NON-NLS-1$ //$NON-NLS-0$
	"searchTerm": "輸入搜尋詞彙：", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedChanges": "有未儲存的變更。", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedAutoSaveChanges": "請停留在頁面上，直到「自動儲存」完成為止。", //$NON-NLS-1$ //$NON-NLS-0$
	"Save": "儲存", //$NON-NLS-1$ //$NON-NLS-0$
	"Saved": "已儲存", //$NON-NLS-1$ //$NON-NLS-0$
	"Blame": "Blame", //$NON-NLS-1$ //$NON-NLS-0$
	"BlameTooltip":"顯示 Blame 註釋", //$NON-NLS-1$ //$NON-NLS-0$
	"saveOutOfSync": "資源與伺服器不同步。 您仍要儲存嗎？", //$NON-NLS-1$ //$NON-NLS-0$
	"loadOutOfSync": "資源與伺服器不同步。 您還是要載入嗎？ 這會改寫您在本端所做的變更。", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadata": "正在讀取 ${0} 的 meta 資料", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadataError": "無法取得 ${0} 的 meta 資料", //$NON-NLS-1$ //$NON-NLS-0$
	"Reading": "正在讀取 ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"readonly": "唯讀。", //$NON-NLS-1$ //$NON-NLS-0$
	"saveFile": "儲存這個檔案", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleZoomRuler": "切換縮放尺規", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "移至行...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLineTooltip": "移至指定的行號", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompt": "移至行：", //$NON-NLS-1$ //$NON-NLS-0$
	"Undo": "復原", //$NON-NLS-1$ //$NON-NLS-0$
	"Redo": "重做", //$NON-NLS-1$ //$NON-NLS-0$
	"Find": "尋找...", //$NON-NLS-1$ //$NON-NLS-0$
	"noResponse": "伺服器沒有回應。 請檢查網際網路連線，然後再試一次。", //$NON-NLS-1$ //$NON-NLS-0$
	"savingFile": "正在儲存 ${0} 檔", //$NON-NLS-1$ //$NON-NLS-0$
	"running": "正在執行 ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"Saving..." : "正在儲存...", //$NON-NLS-1$ //$NON-NLS-0$
	"View": "檢視", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanel": "側邊畫面", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanelTooltip": "選擇側邊畫面中要顯示的項目。", //$NON-NLS-1$ //$NON-NLS-0$
	"Slideout": "滑出", //$NON-NLS-1$ //$NON-NLS-0$
	"Actions": "動作", //$NON-NLS-1$ //$NON-NLS-0$
	"Navigator": "導覽器", //$NON-NLS-1$ //$NON-NLS-0$
	"FolderNavigator": "資料夾導覽器", //$NON-NLS-1$ //$NON-NLS-0$
	"Project": "專案", //$NON-NLS-1$ //$NON-NLS-0$
	"New": "新建", //$NON-NLS-1$ //$NON-NLS-0$
	"File": "檔案", //$NON-NLS-1$ //$NON-NLS-0$
	"Edit": "編輯", //$NON-NLS-1$ //$NON-NLS-0$
	"Tools": "工具", //$NON-NLS-1$ //$NON-NLS-0$
	"Add": "新增", //$NON-NLS-1$ //$NON-NLS-0$
	"noActions": "現行選項沒有動作。", //$NON-NLS-1$ //$NON-NLS-0$
	"NoFile": "使用 ${0} 來建立新的檔案與資料夾。 請按一下檔案，開始編碼。", //$NON-NLS-1$ //$NON-NLS-0$
	"LocalEditorSettings": "本端編輯器設定", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProject": "${0} 不是專案。 如果要轉換成專案，請使用 ${1}。", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProjects": "您的工作區中沒有專案。 請使用${0}功能表來建立專案。", //$NON-NLS-1$ //$NON-NLS-0$
	"Disconnected": "${0}（已斷線）", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFS": "選擇檔案系統", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFSTooltip": "選擇您想檢視的檔案系統。", //$NON-NLS-1$ //$NON-NLS-0$
	"FSTitle": "${0} (${1})", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy": "部署", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy As": "部署方式", //$NON-NLS-1$ //$NON-NLS-0$
	"Import": "匯入", //$NON-NLS-1$ //$NON-NLS-0$
	"Export": "匯出", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenWith": "開啟工具", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenRelated": "開啟相關項目", //$NON-NLS-1$ //$NON-NLS-0$
	"Dependency": "相依關係", //$NON-NLS-1$ //$NON-NLS-0$
	"UnnamedCommand": "未命名", //$NON-NLS-1$ //$NON-NLS-0$
	"searchInFolder": "在資料夾中搜尋...",  //$NON-NLS-1$ //$NON-NLS-0$
	"Global Search": "廣域搜尋...", //$NON-NLS-1$ //$NON-NLS-0$
	"ClickEditLabel": "按一下以編輯", //$NON-NLS-1$ //$NON-NLS-0$
	"ProjectInfo": "專案資訊", //$NON-NLS-1$ //$NON-NLS-0$
	"DeployInfo": "部署資訊", //$NON-NLS-1$ //$NON-NLS-0$
	"Name": "名稱", //$NON-NLS-1$ //$NON-NLS-0$
	"Description": "說明", //$NON-NLS-1$ //$NON-NLS-0$
	"Site": "網站", //$NON-NLS-1$ //$NON-NLS-0$
	'projectsSectionTitle': '專案',  //$NON-NLS-0$  //$NON-NLS-1$
	'listingProjects': '正在列出專案...',  //$NON-NLS-0$  //$NON-NLS-1$
	'gettingWorkspaceInfo': '正在取得工作區資訊...',  //$NON-NLS-0$  //$NON-NLS-1$
	"showProblems": "顯示問題...",  //$NON-NLS-1$ //$NON-NLS-0$
});

