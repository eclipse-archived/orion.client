/******************************************************************************* 
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define([
	'orion/objects',
	'i18n!orion/widgets/nls/messages',
	'text!orion/widgets/projects/RunBar.html',
	'orion/webui/littlelib',
	'orion/i18nUtil',
	'orion/webui/RichDropdown',
	'orion/webui/tooltip',
	'orion/metrics'
], function(objects, messages, RunBarTemplate, lib, i18nUtil, mRichDropdown, mTooltip, mMetrics) {
	
	var METRICS_LABEL_PREFIX = "RunBar"; //$NON-NLS-0$
	
	/**
	 * Creates a new RunBar.
	 * @class RunBar
	 * @name orion.projects.RunBar
	 * @param options
	 * @param options.parentNode
	 * @param options.serviceRegistry
	 * @param options.commandRegistry
	 * @param options.fileClient
	 * @param options.progressService
	 * @param options.preferencesService
	 * @param options.statusService
	 * @param options.actionScopeId
	 */
	function RunBar(options) {
		this._parentNode = options.parentNode;
		this._projectExplorer = options.projectExplorer;
		this._serviceRegistry = options.serviceRegistry;
		this._commandRegistry = options.commandRegistry;
		this._fileClient = options.fileClient;
		this._progressService = options.progressService;
		this._preferencesService = options.preferencesService;
		this.statusService = options.statusService;
		this.actionScopeId = options.actionScopeId;
		this._projectCommands = options.projectCommands;
		this._projectClient = options.projectClient;
		
		this._initialize();
		this._disableAllControls(); // start with controls disabled until a launch configuration is selected
	}
	
	objects.mixin(RunBar.prototype, /** @lends orion.projects.RunBar.prototype */ {
		_initialize: function() {
			this._domNode = lib.createNodes(RunBarTemplate);
			if (this._domNode) {
				this._parentNode.appendChild(this._domNode);
				
				this._undestroyedTooltips = []; // an array of all the tooltips that need to be destroyed when this widget is destroyed
								
				this._playButton = lib.$("button.playButton", this._domNode); //$NON-NLS-0$
				this._boundPlayButtonListener = this._runBarButtonListener.bind(this, "orion.launchConfiguration.deploy"); //$NON-NLS-0$
				this._playButton.addEventListener("click", this._boundPlayButtonListener); //$NON-NLS-0$ 
				
				this._stopButton = lib.$("button.stopButton", this._domNode); //$NON-NLS-0$
				this._boundStopButtonListener = this._runBarButtonListener.bind(this, "orion.launchConfiguration.stopApp"); //$NON-NLS-0$
				this._stopButton.addEventListener("click", this._boundStopButtonListener); //$NON-NLS-0$
				
				// set button tooltips
				var playCommand = this._commandRegistry.findCommand("orion.launchConfiguration.deploy"); //$NON-NLS-0$
				if (playCommand.tooltip) {
					this._setNodeTooltip(this._playButton, playCommand.tooltip);
				}
				var stopCommand = this._commandRegistry.findCommand("orion.launchConfiguration.stopApp"); //$NON-NLS-0$
				if (stopCommand.tooltip) {
					this._setNodeTooltip(this._stopButton, stopCommand.tooltip);
				}
				
				this._launchConfigurationDispatcher = this._projectCommands.getLaunchConfigurationDispatcher();
				this._launchConfigurationEventTypes = ["create", "delete", "changeState", "deleteAll"]; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				this._boundLaunchConfigurationListener = this._launchConfigurationListener.bind(this);
				this._launchConfigurationEventTypes.forEach(function(eventType) {
					this._launchConfigurationDispatcher.addEventListener(eventType, this._boundLaunchConfigurationListener);
				}, this);
				
				this._createLaunchConfigurationsDropdown();
				
				//app link
				this._boundLinkClickListener = this._linkClickListener.bind(this);

				this._appLink = lib.$(".appLink", this._domNode); //$NON-NLS-0$
				this._appLink.addEventListener("click", this._boundLinkClickListener); //$NON-NLS-0$
				this._setNodeTooltip(this._appLink, messages["openAppTooltip"]); //$NON-NLS-0$
				this._disableLink(this._appLink);
				
				if (this._projectExplorer.treeRoot && this._projectExplorer.treeRoot.Project) {
					this.loadLaunchConfigurations(this._projectExplorer.treeRoot.Project);
				} else {
					// the Project has not yet been fully loaded into the explorer, wait until that happens 
					this._projectExplorer.addEventListener("rootChanged", function(event){ //$NON-NLS-0$
						var root = event.root;
						if (root && root.Project) {
							this.loadLaunchConfigurations(root.Project);
						}
					}.bind(this));
				}
			} else {
				throw new Error("this._domNode is null"); //$NON-NLS-0$
			}
		},
				
		_createLaunchConfigurationsDropdown: function() {
			this._launchConfigurationsWrapper = lib.$(".launchConfigurationsWrapper", this._domNode); //$NON-NLS-0$
			this._cachedLaunchConfigurations = {};
			
			var separator;
			
			// function which populates the launch configurations dropdown menu
			var populateFunction = function(parent) {
				if (this._menuItemsCache && this._menuItemsCache.length > 0) {
					this._menuItemsCache.forEach(function(menuItem){
						parent.appendChild(menuItem);
					});
				} else {
					this._menuItemsCache = []; // clear launch configurations menu items cache
					var dropdown = this._launchConfigurationsDropdown.getDropdown();
					var hash, launchConfiguration, menuItem, domNodeWrapperList;
					
					for (hash in this._cachedLaunchConfigurations) {
						if (this._cachedLaunchConfigurations.hasOwnProperty(hash)) {
							launchConfiguration = this._cachedLaunchConfigurations[hash];
							menuItem = dropdown.appendMenuItem(launchConfiguration.Name);
							menuItem.classList.add("launchConfigurationMenuItem"); //$NON-NLS-0$
							menuItem.id = launchConfiguration.Name + "_RunBarMenuItem"; //$NON-NLS-0$
							
							menuItem.addEventListener("click", function(currentHash, event){ //$NON-NLS-0$
								// Use currentHash to get cached launch config again because it will be updated 
								// by the listener as events occur. Using currentHash directly here to avoid 
								// unnecessarily keeping old copies of the launchConfiguration alive.
								var cachedConfig = this._cachedLaunchConfigurations[currentHash];
								var checkStatus = true;
								if (cachedConfig.status && ("PROGRESS" === cachedConfig.status.State) ) { //$NON-NLS-0$
									//do not check status if it is in PROGRESS
									checkStatus = false;
								}
								this.selectLaunchConfiguration(cachedConfig, checkStatus);
							}.bind(this, hash)); // passing in hash here because using it directly in function only creates a reference which ends up with the last value of hash
							
							this._commandRegistry.registerCommandContribution(menuItem.id, "orion.launchConfiguration.delete", 1); //$NON-NLS-0$
							domNodeWrapperList = [];
							this._commandRegistry.renderCommands(menuItem.id, menuItem.firstChild, launchConfiguration, this, "tool", null, domNodeWrapperList); //$NON-NLS-0$
							if (domNodeWrapperList.length > 0){
								domNodeWrapperList[0].domNode.classList.remove("commandMargins"); //$NON-NLS-0$
								domNodeWrapperList[0].domNode.classList.add("launchConfigurationDeleteButton"); //$NON-NLS-0$
							}
							
							this._menuItemsCache.push(menuItem);
							
							separator = dropdown.appendSeparator();
							this._menuItemsCache.push(separator);
						}
					}
					
					separator = dropdown.appendSeparator();
					this._menuItemsCache.push(separator);

					var createNewItem = dropdown.appendMenuItem(); //$NON-NLS-0$
					createNewItem.id = "CreateNew_RunBarMenuItem"; //$NON-NLS-0$
					this._menuItemsCache.push(createNewItem);
					
					var dropdownMenuItemSpan = lib.$(".dropdownMenuItem", createNewItem); //$NON-NLS-0$
					dropdownMenuItemSpan.classList.add("addNewMenuItem"); //$NON-NLS-0$
					
					var defaultDeployCommand = this._projectCommands.getDeployProjectCommands(this._commandRegistry)[0];
					if (defaultDeployCommand) {
						this._commandRegistry.registerCommandContribution(createNewItem.id, defaultDeployCommand.id, 1); //$NON-NLS-0$
						domNodeWrapperList = [];
						this._commandRegistry.renderCommands(createNewItem.id, dropdownMenuItemSpan, this._projectExplorer.treeRoot, this, "button", null, domNodeWrapperList); //$NON-NLS-0$
						domNodeWrapperList[0].domNode.textContent = "+"; //$NON-NLS-0$
					}
				}
			}.bind(this);
			
			this._launchConfigurationsDropdown = new mRichDropdown.RichDropdown({
				parentNode: this._launchConfigurationsWrapper,
				populateFunction: populateFunction
			});
			this._disableControl(this._launchConfigurationsWrapper); // start with control greyed out until launch configs are set
			
			this._launchConfigurationsLabel = lib.$(".dropdownTriggerButtonLabel", this._launchConfigurationsWrapper); //$NON-NLS-0$
			this._appName = lib.$(".appName", this._launchConfigurationsLabel); //$NON-NLS-0$
			this._statusLight = lib.$(".statusLight", this._launchConfigurationsLabel); //$NON-NLS-0$
			this._appInfoSpan = lib.$(".appInfoSpan", this._launchConfigurationsLabel); //$NON-NLS-0$
			
			this._launchConfigurationsWrapper.removeChild(this._launchConfigurationsLabel);
			this._launchConfigurationsDropdown.setCustomTriggerButtonLabelNode(this._launchConfigurationsLabel);
			
			var triggerButton = this._launchConfigurationsDropdown.getDropdownTriggerButton();
			triggerButton.classList.remove("dropdownDefaultButton"); //$NON-NLS-0$
			triggerButton.classList.add("launchConfigurationsButton"); //$NON-NLS-0$
			
			this._boundTriggerButtonEventListener = function(event){ 
				mMetrics.logEvent("ui", "invoke", METRICS_LABEL_PREFIX + ".launchConfigurationsDropdownTriggerButton.clicked", event.which); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}.bind(this);
			triggerButton.addEventListener("click", this._boundTriggerButtonEventListener); //$NON-NLS-0$
		},
		
		destroy: function() {
			// destroy tooltips
			if (this._undestroyedTooltips) {
				this._undestroyedTooltips.forEach(function(tooltip){
					tooltip.destroy();
				}, this);
				this._undestroyedTooltips = null;
			}
			
			// remove event listeners
			if (this._launchConfigurationEventTypes) {
				this._launchConfigurationEventTypes.forEach(function(eventType) {
					this._launchConfigurationDispatcher.removeEventListener(eventType, this._boundLaunchConfigurationListener);
				}, this);
			}
			
			if (this._playButton) {
				this._playButton.removeEventListener("click", this._boundPlayButtonListener); //$NON-NLS-0$
				this._playButton = null;
			}
			
			if (this._stopButton) {
				this._stopButton.removeEventListener("click", this._boundStopButtonListener); //$NON-NLS-0$
				this._stopButton = null;
			}
			
			if (this._launchConfigurationsDropdown) {
				var triggerButton = this._launchConfigurationsDropdown.getDropdownTriggerButton();
				if (triggerButton && this._boundTriggerButtonEventListener) {
					triggerButton.removeEventListener("click", this._boundTriggerButtonEventListener); //$NON-NLS-0$
				}
				this._launchConfigurationsDropdown.destroy();
				this._launchConfigurationsDropdown = null;
			}
			if (this._appLink) {
				this._appLink.removeEventListener("click", this._boundLinkClickListener); //$NON-NLS-0$
				this._appLink = null;
			}
		},
		
		_launchConfigurationListener: function(event) {
			var newConfig = event.newValue;
			
			if((event.type === "changeState") && newConfig){ //$NON-NLS-0$			
				// update status if selected launch config was modified
				var cachedHash = this._getHash(newConfig);
				var selectedHash = this._getHash(this._selectedLaunchConfiguration);
				if (cachedHash === selectedHash) {
					var checkStatus = newConfig.status && newConfig.status.CheckState; // check status again if status.CheckState is set
					this.selectLaunchConfiguration(newConfig, checkStatus);
				}
				
				// replace cached launch config
				this._putInLaunchConfigurationsCache(newConfig);
			} else {
				this._menuItemsCache = []; // clear launch configurations menu items cache
				
				if((event.type === "create") && newConfig){ //$NON-NLS-0$
					// cache and select new launch config
					this._putInLaunchConfigurationsCache(newConfig);
					
					// iterate over cached launch configs, find and delete syntetic ones
					for (var hash in this._cachedLaunchConfigurations) {
						if (this._cachedLaunchConfigurations.hasOwnProperty(hash)) {
							if (this._cachedLaunchConfigurations[hash].Params.Synthetic) {
								if (this._cachedLaunchConfigurations[hash] === this._selectedLaunchConfiguration) {
									this.selectLaunchConfiguration(null);
								}
								
								this._removeFromLaunchConfigurationsCache(this._cachedLaunchConfigurations[hash]);
								break;
							}
						}
					}
					
					this.selectLaunchConfiguration(newConfig, true); //check the status of newly created configs
				} else if(event.type === "delete"){ //$NON-NLS-0$
					var deletedFile = event.oldValue.File;
					
					// iterate over cached launch configs, find and delete 
					// the one that matches the deleted file
					for (var hash in this._cachedLaunchConfigurations) {
						if (this._cachedLaunchConfigurations.hasOwnProperty(hash)) {
							if (this._cachedLaunchConfigurations[hash].File.Location === deletedFile.Location) {
								if (this._cachedLaunchConfigurations[hash] === this._selectedLaunchConfiguration) {
									this.selectLaunchConfiguration(null);
								}
								
								this._removeFromLaunchConfigurationsCache(this._cachedLaunchConfigurations[hash]);
								break;
							}
						}
					}
				} else if(event.type === "deleteAll"){ //$NON-NLS-0$
					this._cacheLaunchConfigurations([]);
					this.selectLaunchConfiguration(null);
				}
			}
		},
	
		/**
		 * Selects the specified launch configuration
		 * 
		 * @param {Object} launchConfiguration The launch configuration to select
		 * @param {Boolean} checkStatus Specifies whether or not the status of the launchConfiguration should be checked
		 */
		selectLaunchConfiguration: function(launchConfiguration, checkStatus) {
			if (launchConfiguration) {
				this._selectedLaunchConfiguration = launchConfiguration;
				this._setLaunchConfigurationsLabel(launchConfiguration);
				
				if (checkStatus) {
					this._checkLaunchConfigurationStatus(launchConfiguration);
				} else {
					// do not check the status, only set it in the UI if it is already in the launchConfiguration
					if (launchConfiguration.status) {
						this.setStatus(launchConfiguration.status);
					}
				}
			} else {
				this._selectedLaunchConfiguration = null;
				this._setLaunchConfigurationsLabel(null);
				this.setStatus({});
			}
		},
			
		_checkLaunchConfigurationStatus: function(launchConfiguration) {
			var progressMessage = i18nUtil.formatMessage(messages["checkingStateMessage"], launchConfiguration.Name); //$NON-NLS-0$
			
			// start progress spinner in launch config dropdown trigger and indicate that we are checking the status
			this.setStatus({
				State: "PROGRESS", //$NON-NLS-0$
				Message: progressMessage,
				ShortMessage: messages["checkingStateShortMessage"] //$NON-NLS-0$
			});
			
			var errorHandler = function (error) {
				// stop the progress spinner in the launch config dropdown trigger
				this.setStatus({
					error: error || true //if no error was passed in we still want to ensure that the error state is recorded
				});
			}.bind(this);
			
			// update status
			return this._projectClient.getProjectDelpoyService(launchConfiguration.ServiceId, launchConfiguration.Type).then(
				function(service){
					if(service && service.getState){
						return service.getState(launchConfiguration).then(function(status){
								launchConfiguration.status = status;
								this._launchConfigurationDispatcher.dispatchEvent({type: "changeState", newValue: launchConfiguration}); //$NON-NLS-0$
								return status;
							}.bind(this),
							function(error){
								launchConfiguration.status = {error: error};
								if (error.Retry) {
									// authentication error, gather required parameters and try again
									launchConfiguration.parametersRequested = launchConfiguration.status.error.Retry.parameters;
									launchConfiguration.optionalParameters = launchConfiguration.status.error.Retry.optionalParameters;
									
									// run command because it knows how to collect params first then check the status again
									this._commandRegistry.runCommand("orion.launchConfiguration.checkStatus", launchConfiguration, this, null, null, this._statusLight); //$NON-NLS-0$
								} else {
									this._launchConfigurationDispatcher.dispatchEvent({type: "changeState", newValue: launchConfiguration}); //$NON-NLS-0$
								}
							}.bind(this)
						);
					} else {
						errorHandler();
					}
				}.bind(this),
				errorHandler
			);
		},
		
		setStatus: function(status) {
			var appInfoText = null;
			var statusLightText = null;
			
			// turn status light off
			this._statusLight.classList.remove("statusLightGreen"); //$NON-NLS-0$
			this._statusLight.classList.remove("statusLightRed"); //$NON-NLS-0$
			this._statusLight.classList.remove("statusLightProgress"); //$NON-NLS-0$
			
			this._setText(this._appInfoSpan, null);
			
			this._disableAllControls(); // applicable controls will be re-enabled further below
			
			if (status.error) {
				this._enableControl(this._playButton);
				if (!status.error.Retry) {
					if (status.error.Message) {
						statusLightText = status.error.Message;
					}
				}
				// set the short status that appears next to the app name
				appInfoText = status.ShortMessage || statusLightText || messages["appInfoUnknown"]; //$NON-NLS-0$
			} else {
				switch (status.State) {
					case "PROGRESS": //$NON-NLS-0$
						this._statusLight.classList.add("statusLightProgress"); //$NON-NLS-0$
						if (status.ShortMessage || status.Message) {
							appInfoText = status.ShortMessage || status.Message;
						}
						break;
					case "STARTED": //$NON-NLS-0$
						this._enableControl(this._playButton);
						this._enableControl(this._stopButton);
						this._statusLight.classList.add("statusLightGreen"); //$NON-NLS-0$
						
						appInfoText = messages["appInfoRunning"]; //$NON-NLS-0$
						break;
					case "STOPPED": //$NON-NLS-0$
						this._enableControl(this._playButton);
						this._statusLight.classList.add("statusLightRed"); //$NON-NLS-0$
						
						appInfoText = messages["appInfoStopped"]; //$NON-NLS-0$
						break;
					default:
						break;
				}
				statusLightText = status.Message;
			}
			
			this._setNodeTooltip(this._statusLight, statusLightText);
			
			if (appInfoText) {
				this._setText(this._appInfoSpan, "(" + appInfoText.toLocaleLowerCase() + ")"); //$NON-NLS-1$ //$NON-NLS-0$
			}
			
			if (status.Url) {
				this._enableLink(this._appLink, status.Url);
			}
		},
		
		/**
		 * Get launch configurations from the specified project and load them into this run bar.
		 * 
		 * @param[in] {Object} project The project from which to load the launch configurations
		 */
		loadLaunchConfigurations: function (project) {
			this._projectClient.getProjectLaunchConfigurations(project).then(function(launchConfigurations){
				this._setLaunchConfigurations(launchConfigurations);
			}.bind(this));
		},
		
		/**
		 * Sets the list of launch configurations to be used by this run bar.
		 * This method may be called more than once. Any previously cached
		 * launch configurations will be replaced with the newly specified ones.
		 * 
		 * @param {Array} launchConfigurations An array of launch configurations
		 */
		_setLaunchConfigurations: function(launchConfigurations) {
			this._enableControl(this._launchConfigurationsWrapper);
			this._menuItemsCache = []; //reset the cached launch configuration dropdown menu items
			this._cacheLaunchConfigurations(launchConfigurations);
			
			if (launchConfigurations && launchConfigurations[0]) {
				// select first launch configuration
				var hash = this._getHash(launchConfigurations[0]);
				var cachedConfig = this._cachedLaunchConfigurations[hash];
				this.selectLaunchConfiguration(cachedConfig, true);
			} else {
				this.selectLaunchConfiguration(null);
			}
		},
		
		_cacheLaunchConfigurations: function(launchConfigurations) {
			this._cachedLaunchConfigurations = {};
			launchConfigurations.forEach(function(launchConfig){
				this._putInLaunchConfigurationsCache(launchConfig);
			}, this);
		},
		
		_getHash: function(launchConfiguration) {
			var hash = null;
			if (launchConfiguration) {
				hash = launchConfiguration.Name + ":" + launchConfiguration.ServiceId; //$NON-NLS-0$
			}
			return hash;
		},
		
		_putInLaunchConfigurationsCache: function(launchConfiguration) {
			var hash = this._getHash(launchConfiguration);
			if (!launchConfiguration.project) {
				// TODO Find a better way to get this info
				launchConfiguration.project = this._projectExplorer.treeRoot.Project;
			}
			this._cachedLaunchConfigurations[hash] = launchConfiguration;
		},
		
		_removeFromLaunchConfigurationsCache: function(launchConfiguration) {
			var hash = this._getHash(launchConfiguration);
			delete this._cachedLaunchConfigurations[hash];
		},
		
		/**
		 * Implements a generic button listener which executes the specified
		 * command when it is invoked and collects metrics
		 * 
		 * @param[in] {String} command A String containing the id of the command to run
		 * @param[in] {Event} event The event which triggered the listener
		 */
		_runBarButtonListener: function(commandId, event) {
			var buttonNode = event.target;
			var id = buttonNode.id;
			var isEnabled = this._isEnabled(buttonNode);
			var disabled = isEnabled ? "" : ".disabled"; //$NON-NLS-1$ //$NON-NLS-0$
			
			mMetrics.logEvent("ui", "invoke", METRICS_LABEL_PREFIX + "." + id +".clicked" + disabled, event.which); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			if (isEnabled) {
				this._commandRegistry.runCommand(commandId, this._selectedLaunchConfiguration, this, null, null, buttonNode); //$NON-NLS-0$
			}
		},
		
		getSelectedLaunchConfiguration: function() {
			return this._selectedLaunchConfiguration;
		},
		
		_disableAllControls: function() {
			this._disableControl(this._playButton);
			this._disableControl(this._stopButton);
			this._disableLink(this._appLink);
		},
		
		_enableControl: function(domNode) {
			domNode.classList.remove("disabled"); //$NON-NLS-0$
		},
		
		_disableControl: function(domNode) {
			domNode.classList.add("disabled"); //$NON-NLS-0$
		},
		
		_isEnabled: function(domNode) {
			return !domNode.classList.contains("disabled"); //$NON-NLS-0$
		},
		
		_enableLink: function(linkNode, href) {
			linkNode.href = href;
			this._enableControl(linkNode);
		},
		
		_disableLink: function(linkNode) {
			linkNode.href = "javascript: void(0)"; //$NON-NLS-0$
			this._disableControl(linkNode);
		},
		
		_isLinkDisabled: function(linkNode) {
			return ("javascript: void(0)" === linkNode.href); //$NON-NLS-0$ 
		},
		
		_linkClickListener: function(event) {
			var domNode = event.target;
			var id = domNode.id;
			var disabled = this._isLinkDisabled(domNode) ? ".disabled" : ""; //$NON-NLS-1$ //$NON-NLS-0$
			
			mMetrics.logEvent("ui", "invoke", METRICS_LABEL_PREFIX + "." + id +".clicked" + disabled, event.which); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		},
		
		_setNodeTooltip: function(domNode, text) {
			var index = -1;
			if (domNode.tooltip) {
				domNode.tooltip.destroy();
				index = this._undestroyedTooltips.indexOf(domNode.tooltip);
				if (-1 !== index) {
					this._undestroyedTooltips.splice(index, 1);
				}
			}
			if (text) {
				domNode.tooltip = new mTooltip.Tooltip({
					node: domNode,
					text: text,
					trigger: "mouseover", //$NON-NLS-0$
					position: ["above", "below", "right", "left"] //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				});
				this._undestroyedTooltips.push(domNode.tooltip);
			}
		},
		
		_setText: function(domNode, text) {
			lib.empty(domNode);
			if (text) {
				var textNode = document.createTextNode(text);
				domNode.appendChild(textNode);
			}
		},
		
		_setLaunchConfigurationsLabel: function(launchConfiguration) {
			if (launchConfiguration) {
				var displayName = launchConfiguration.Params.Name + messages["displayNameSeparator"] + launchConfiguration.Params.Target.Space; //$NON-NLS-0$
				
				lib.empty(this._launchConfigurationsLabel);
				
				this._setText(this._appName, displayName);
				this._setNodeTooltip(this._appName, launchConfiguration.Name);
				this._setText(this._appInfoSpan, null);
				
				this._launchConfigurationsLabel.appendChild(this._statusLight);
				this._launchConfigurationsLabel.appendChild(this._appName);
				this._launchConfigurationsLabel.appendChild(this._appInfoSpan);
			} else {
				this._setText(this._launchConfigurationsLabel, messages["selectLaunchConfig"]); //$NON-NLS-0$
			}
		}
	});
	
	return {
		RunBar: RunBar,
		METRICS_LABEL_PREFIX: METRICS_LABEL_PREFIX
	};
});
