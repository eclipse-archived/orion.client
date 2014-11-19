/*******************************************************************************
 * @license
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2014. All Rights Reserved. 
 * 
 * Note to U.S. Government Users Restricted Rights:  Use, 
 * duplication or disclosure restricted by GSA ADP Schedule 
 * Contract with IBM Corp.
 *******************************************************************************/
/*eslint-env browser, amd*/

define(['i18n!cfui/nls/messages', 'orion/webui/littlelib', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commandRegistry',  'orion/keyBinding', 'orion/dialogs', 'orion/selection',
	'orion/contentTypes','orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands', 'orion/links',
	'orion/cfui/cFClient', 'orion/PageUtil', 'orion/cfui/logView', 'orion/section',  'orion/cfui/widgets/CfLoginDialog', 'orion/i18nUtil'], 
	function(messages, lib, mBootstrap, mStatus, mProgress, CommandRegistry, KeyBinding, mDialogs, mSelection,
	mContentTypes, mFileClient, mOperationsClient, mSearchClient, mGlobalCommands, mLinks,
	mCFClient, PageUtil, mLogView, mSection, CfLoginDialog, i18Util) {
	mBootstrap.startup().then(
		function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var pluginRegistry = core.pluginRegistry;
		
			new mDialogs.DialogService(serviceRegistry);
			var selection = new mSelection.Selection(serviceRegistry);
			var commandRegistry = new CommandRegistry.CommandRegistry({selection: selection});
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient, commandRegistry);
		
			// ...
			var linkService = new mLinks.TextLinkService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandRegistry, fileService: fileClient});
			var cFClient = new mCFClient.CFService(serviceRegistry);
			var contentTypeRegistry = new mContentTypes.ContentTypeRegistry(serviceRegistry);
			var mainLogView = lib.node("log");
			
			function statusReporter(message, type, isAccessible) {
				if (type === "progress") { //$NON-NLS-0$
					statusService.setProgressMessage(message);
				} else if (type === "error") { //$NON-NLS-0$
					statusService.setErrorMessage(message);
				} else {
					statusService.setMessage(message, null, isAccessible);
				}
			}
			
			var logEditorView = new mLogView.LogEditorView({
				parent: mainLogView,
				undoStack: null,
				serviceRegistry: serviceRegistry,
				pluginRegistry: pluginRegistry,
				commandRegistry: commandRegistry,
				contentTypeRegistry: contentTypeRegistry,
				preferences: preferences,
				searcher: searcher,
				selection: selection,
				fileService: fileClient,
				statusReporter: statusReporter,
				statusService: statusService,
				progressService: progressService,
				cFClient: cFClient
			});

			mGlobalCommands.generateBanner("cf-logs", serviceRegistry, commandRegistry, preferences, searcher, {});

			function handleError(error) {
				if (!statusService) {
					window.console.log(error);
					return;
				}
				if (error.status === 0) {
					error = {
						Severity: "Error", //$NON-NLS-0$
						Message: messages["noResponse"]
					};
				} else {
					var responseText = error.responseText;
					if (responseText) {
						try {
							error = JSON.parse(responseText);
						} catch(e) {
							error = {
								//HTML: true,
								Severity: "Error", //$NON-NLS-0$
								Message: responseText
							};
						}
					}
				}
				
				statusService.setProgressResult(error);
			}
			
			function loadLogs(logParams){
				var target;
				if(logParams.Url || logParams.Org || logParams.Space){
					target = {Url: logParams.Url, Org: logParams.Org, Space:logParams.Space}
					logParams.target = target;
				}

				logEditorView.create();
				
				progressService.showWhile(cFClient.getLogz(target, logParams.resource), messages["gettingLogs"]).then(
					function(logs){
						var logsInfo = {
							Target: target,
							Application: logParams.resource,
							instance: logParams.instance,
							logs: logs.Messages
						};
						this.lastLogsInfo = logsInfo;
						logEditorView.inputManager.setApplicationInfo(logsInfo);

						mainLogView.classList.add("toolbarTarget");
						logEditorView.inputManager.setInput("logs for " + logParams.resource);
					}, function(e){
						if(e.JsonData && e.JsonData.error_code){
							var err = e.JsonData;
							if (err.error_code === "CF-InvalidAuthToken" || err.error_code === "CF-NotAuthenticated"){
								var dialog = new CfLoginDialog({
								title: messages["loginTo"] + target.Url,
								func: function(login, password){
									progressService.showWhile(cFClient.login(target.Url, login, password, target.Org, target.Space), i18Util.formatMessage(messages["loggingInTo${0}"], target.Url)).then(function(){
										loadLogs(logParams);
									}, handleError);
								}});
								dialog.show();
								return;
							}
						}

						handleError(e);
					}
				);
			}
			
			this.lastLogsInfo = {};
			loadLogs(PageUtil.matchResourceParameters());
			
			window.addEventListener("hashchange", function() {
				loadLogs(PageUtil.matchResourceParameters());
			}.bind(this));
			
		});
	});