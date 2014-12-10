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
	'orion/webui/RichDropdown'
], function(objects, messages, RunBarTemplate, lib, i18nUtil, mRichDropdown) {
	
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
				this._launchConfigurationsWrapper = lib.$(".launchConfigurationsWrapper", this._domNode); //$NON-NLS-0$
				
				this._statusLight = document.createElement("span"); //$NON-NLS-0$
				this._statusLight.classList.add("statusLight"); //$NON-NLS-0$
				
				this._playButton = lib.$("button.playButton", this._domNode); //$NON-NLS-0$
				this._boundPlayButtonListener = this._playButtonListener.bind(this);
				this._playButton.addEventListener("click", this._boundPlayButtonListener); //$NON-NLS-0$ 
				
				this._deployButton = lib.$("button.deployButton", this._domNode); //$NON-NLS-0$
				this._boundDeployButtonListener = this._deployButtonListener.bind(this);
				this._deployButton.addEventListener("click", this._boundDeployButtonListener); //$NON-NLS-0$ 
				
				this._stopButton = lib.$("button.stopButton", this._domNode); //$NON-NLS-0$
				this._boundStopButtonListener = this._stopButtonListener.bind(this);
				this._stopButton.addEventListener("click", this._boundStopButtonListener); //$NON-NLS-0$
				
				this._launchConfigurationDispatcher = this._projectCommands.getLaunchConfigurationDispatcher();
				this._launchConfigurationEventTypes = ["create", "delete", "changeState", "deleteAll"]; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				this._boundLaunchConfigurationListener = this._launchConfigurationListener.bind(this);
				this._launchConfigurationEventTypes.forEach(function(eventType) {
					this._launchConfigurationDispatcher.addEventListener(eventType, this._boundLaunchConfigurationListener);
				}, this);
				
				this._createLaunchConfigurationsDropdown();
			} else {
				throw new Error("this._domNode is null"); //$NON-NLS-0$
			}
		},
		
		_createLaunchConfigurationsDropdown: function() {
			this._cachedLaunchConfigurations = {};
			
			// function which populates the launch configurations dropdown menu
			var populateFunction = function(parent) {
				if (this._menuItemsCache && this._menuItemsCache.length > 0) {
					this._menuItemsCache.forEach(function(menuItem){
						parent.appendChild(menuItem);
					});
				} else {
					this._menuItemsCache = []; // clear launch configurations menu items cache
					var dropdown = this._launchConfigurationsDropdown.getDropdown();
					var hash, launchConfiguration, menuItem;
					
					for (hash in this._cachedLaunchConfigurations) {
						if (this._cachedLaunchConfigurations.hasOwnProperty(hash)) {
							launchConfiguration = this._cachedLaunchConfigurations[hash];
							menuItem = dropdown.appendMenuItem(launchConfiguration.Name);
							
							menuItem.addEventListener("click", function(currentHash, event){ //$NON-NLS-0$
								// Use currentHash to get cached launch config again because it will be updated 
								// by the listener as events occur. Using currentHash directly here to avoid 
								// unnecessarily keeping old copies of the launchConfiguration alive.
								var cachedConfig = this._cachedLaunchConfigurations[currentHash];
								this.selectLaunchConfiguration(cachedConfig, true);
							}.bind(this, hash)); // passing in hash here because using it directly in function only creates a reference which ends up with the last value of hash
							
							this._menuItemsCache.push(menuItem);
						}
					}
					
					var separator = dropdown.appendSeparator();
					this._menuItemsCache.push(separator);
					
					var createNewItem = dropdown.appendMenuItem(messages["createNew"]); //$NON-NLS-0$
					this._menuItemsCache.push(createNewItem);
					
					var defaultDeployCommand = this._projectCommands.getDeployProjectCommands(this._commandRegistry)[0];
					createNewItem.addEventListener("click", function(event){ //$NON-NLS-0$
						this._commandRegistry.runCommand(defaultDeployCommand.id, this._projectExplorer.treeRoot, this, null, null, this._launchConfigurationsWrapper); //$NON-NLS-0$
					}.bind(this));
				}
			}.bind(this);
			
			this._launchConfigurationsDropdown = new mRichDropdown.RichDropdown({
				parentNode: this._launchConfigurationsWrapper, 
				buttonName: messages["selectLaunchConfig"], //$NON-NLS-0$
				populateFunction: populateFunction
			});
			
			var triggerButton = this._launchConfigurationsDropdown.getDropdownTriggerButton();
			
			triggerButton.classList.remove("dropdownDefaultButton"); //$NON-NLS-0$
			triggerButton.classList.add("launchConfigurationsButton"); //$NON-NLS-0$
		},
		
		destroy: function() {
			this._launchConfigurationEventTypes.forEach(function(eventType) {
				this._launchConfigurationDispatcher.removeEventListener(eventType, this._boundLaunchConfigurationListener);
			}, this);
			this._playButton.removeEventListener("click", this._boundPlayButtonListener); //$NON-NLS-0$
			this._deployButton.removeEventListener("click", this._boundDeployButtonListener); //$NON-NLS-0$
			this._stopButton.removeEventListener("click", this._boundStopButtonListener); //$NON-NLS-0$
			
		},
		
		_launchConfigurationListener: function(event) {
			var newConfig = event.newValue;
			
			if(event.type === "changeState" && newConfig){ //$NON-NLS-0$			
				// update status if selected launch config was modified
				var cachedHash = this._getHash(newConfig);
				var selectedHash = this._getHash(this._selectedLaunchConfiguration);
				if (cachedHash === selectedHash) {
					this.selectLaunchConfiguration(newConfig, false);
				}
				
				// replace cached launch config
				this._putInLaunchConfigurationsCache(newConfig);
			} else {
				this._menuItemsCache = []; // clear launch configurations menu items cache
				
				if(event.type === "create" && newConfig){ //$NON-NLS-0$
					// cache and select new launch config
					this._putInLaunchConfigurationsCache(newConfig);
					this.selectLaunchConfiguration(newConfig);
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
				this._launchConfigurationsDropdown.setDropdownTriggerButtonName(launchConfiguration.Name, this._statusLight);
				this._selectedLaunchConfiguration = launchConfiguration;
				
				if (checkStatus) {
					this._checkLaunchConfigurationStatus(launchConfiguration);
				} else {
					// do not check the status, only set it in the UI if it is already in the launchConfiguration
					if (launchConfiguration.status) {
						this.setStatus(launchConfiguration.status);
					}
				}
			} else {
				this._launchConfigurationsDropdown.setDropdownTriggerButtonName(messages["selectLaunchConfig"]); //$NON-NLS-0$
				this._selectedLaunchConfiguration = null;
				this.setStatus({State: "", Message: ""}); //$NON-NLS-1$ //$NON-NLS-0$
			}
		},
		
		_checkLaunchConfigurationStatus: function(launchConfiguration) {
			var progressMessage = i18nUtil.formatMessage(messages["checkingStateMessage"], launchConfiguration.Name); //$NON-NLS-0$
			
			this.setStatus({
				State: "PROGRESS", //$NON-NLS-0$
				Message: progressMessage
			});
			
			// update status
			this._projectClient.getProjectDelpoyService(launchConfiguration.ServiceId, launchConfiguration.Type).then(function(service){
				if(service && service.getState){
					this._progressService.progress(service.getState(launchConfiguration), progressMessage).then(function(result){
						launchConfiguration.status = result;
						this._launchConfigurationDispatcher.dispatchEvent({type: "changeState", newValue: launchConfiguration}); //$NON-NLS-0$
					}.bind(this), function(error){
						launchConfiguration.status = {error: error};
						if (error.Retry) {
							// authentication error, gather required parameters and try again
							launchConfiguration.parametersRequested = launchConfiguration.status.error.Retry.parameters;
							launchConfiguration.optionalParameters = launchConfiguration.status.error.Retry.optionalParameters;
							
							// run command to collect params first then check status again
							this._commandRegistry.runCommand("orion.launchConfiguration.checkStatus", launchConfiguration, this, null, null, this._statusLight); //$NON-NLS-0$
						} else {
							this._launchConfigurationDispatcher.dispatchEvent({type: "changeState", newValue: launchConfiguration}); //$NON-NLS-0$
						}
					}.bind(this), function(error){}, function(progress){});
				}
			}.bind(this));
		},
		
		setStatus: function(status) {
			// turn status light off
			this._statusLight.classList.remove("statusLightGreen"); //$NON-NLS-0$
			this._statusLight.classList.remove("statusLightRed"); //$NON-NLS-0$
			this._statusLight.classList.remove("statusLightProgress"); //$NON-NLS-0$
			
			this._disableAllControls();
			
			if (status.error) {
				this._enableDeployControl();
				if (status.error.Retry) {
					this._setStatusTitle(null);
				} else {
					this._statusLight.classList.add("statusLightRed"); //$NON-NLS-0$
					this._setStatusTitle(status.error.Message);
				}
			} else {
				switch (status.State) {
					case "PROGRESS": //$NON-NLS-0$
						this._statusLight.classList.add("statusLightProgress"); //$NON-NLS-0$
						break;
					case "STARTED": //$NON-NLS-0$
						this._enableControl(this._playButton);
						this._convertPlayButtonToRestartButton();
						this._enableControl(this._stopButton);
						this._statusLight.classList.add("statusLightGreen"); //$NON-NLS-0$
						break;
					case "STOPPED": //$NON-NLS-0$
						this._enableControl(this._playButton);
						this._restorePlayButton();
						this._statusLight.classList.add("statusLightRed"); //$NON-NLS-0$
						break;
					default:
						this._restorePlayButton();
						break;
				}
				this._setStatusTitle(status.Message);
			}
		},
		
		_setStatusTitle: function(title) {
			this._statusLight.title = title || ""; //$NON-NLS-0$
		},
		
		/**
		 * Sets the list of launch configurations to be used by this run bar.
		 * This method may be called more than once. Any previously cached
		 * launch configurations will be replaced with the newly specified ones.
		 * 
		 * @param {Array} launchConfigurations An array of launch configurations
		 */
		setLaunchConfigurations: function(launchConfigurations) {
			this._menuItemsCache = []; //reset the cached launch configuration dropdown menu items
			this._cacheLaunchConfigurations(launchConfigurations);
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
			this._cachedLaunchConfigurations[hash] = launchConfiguration;
		},
		
		_removeFromLaunchConfigurationsCache: function(launchConfiguration) {
			var hash = this._getHash(launchConfiguration);
			delete this._cachedLaunchConfigurations[hash];
		},
		
		_deployButtonListener: function() {
			if (this._isEnabled(this._deployButton)) {
				this._commandRegistry.runCommand("orion.launchConfiguration.deploy", this._selectedLaunchConfiguration, this, null, null, this._playButton); //$NON-NLS-0$
			}
		},

		_playButtonListener: function() {
			if (this._isEnabled(this._playButton)) {
				this._commandRegistry.runCommand("orion.launchConfiguration.startApp", this._selectedLaunchConfiguration, this, null, null, this._playButton); //$NON-NLS-0$
			}
		},
		
		_stopButtonListener: function() {
			if (this._isEnabled(this._stopButton)) {
				this._commandRegistry.runCommand("orion.launchConfiguration.stopApp", this._selectedLaunchConfiguration, this, null, null, this._stopButton); //$NON-NLS-0$
			}
		},
		
		getSelectedLaunchConfiguration: function() {
			return this._selectedLaunchConfiguration;
		},
		
		_disableAllControls: function() {
			this._disableControl(this._playButton);
			this._playButton.classList.remove("hidden"); //$NON-NLS-0$
			this._disableControl(this._deployButton);
			this._deployButton.classList.add("hidden"); //$NON-NLS-0$
			this._disableControl(this._stopButton);
		},
		
		_enableDeployControl: function(domNode) {
			this._deployButton.classList.remove("disabled"); //$NON-NLS-0$
			this._deployButton.classList.remove("hidden"); //$NON-NLS-0$
			this._playButton.classList.add("hidden"); //$NON-NLS-0$
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
		
		_convertPlayButtonToRestartButton: function() {
			this._playButton.classList.add("restartAppButton"); //$NON-NLS-0$
		},
		
		_restorePlayButton: function() {
			this._playButton.classList.remove("restartAppButton"); //$NON-NLS-0$
		}
		
	});
	
	return {
		RunBar: RunBar
	};
});
