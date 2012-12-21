/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
/*global window define localStorage setTimeout */
/*jslint forin:true*/

define(['i18n!orion/stringexternalizer/nls/messages', 'dojo', 'orion/section', 'orion/commands', 'orion/webui/dialogs/DirectoryPrompterDialog'], function(messages, dojo, mSection, mCommands, DirPrompter){
	function StringExternalizerConfig(options){
		this.parent = options.parent;
		this.fileClient = options.fileClient;
		this.commandService= options.commandService;
		this.serviceRegistry = options.serviceRegistry;
		this.setConfig = options.setConfig;
		this.createCommands();
	}
	
	StringExternalizerConfig.prototype={
			createCommands: function(){
				var changeMessagesDirectory = new mCommands.Command({
					name: messages["Change Directory"],
					tooltip: messages["Change messages directory"],
					id: "eclipse.changeMessagesDirectory", //$NON-NLS-0$
					callback: function(data) {
						var dialog = new DirPrompter.DirectoryPrompterDialog({
							serviceRegistry: this.serviceRegistry,
							fileClient: this.fileClient,
							func: dojo.hitch(this, function(folder) {
								var that = this;
								this.fileClient.read(folder.Location, true).then(dojo.hitch(that, function(metadata){
									//read metadata again, because the returned item does not contain all info
									this.config.directory = metadata;
									this.render(this.config.root);
									this.configChanged(true);
								}));
							})});
						dialog.show();
					},
					visibleWhen: function(item) {
						return !!item;
					}
				});
				this.commandService.addCommand(changeMessagesDirectory);
			},
			
			render: function(root){
				dojo.empty(this.parent);
				if(!this.config){
					var savedConfig = localStorage.getItem("StringExternalizerConfig_"+root.Location); //$NON-NLS-0$
					try{
						this.config = JSON.parse(savedConfig);
					}catch (e) {
					}
					this.config = this.config || {root: root};
				}
				if(!this.config.directory){
					this.config.directory = {
							Location: root.Location[root.Location.length-1]==='/' ? root.Location + "nls" : root.Location + "/nls", //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							Name: "nls", //$NON-NLS-0$
							Parents: [root].concat(root.Parents)
					};
				}
				if(!this.config.file){
					this.config.file = "messages.js"; //$NON-NLS-0$
				}
				if(!this.config.module){
					this.config.module = "i18n!messages"; //$NON-NLS-0$
				}
				if(this.config.marknls===null){
					this.config.marknls = true;
				}
				var section = new mSection.Section(this.parent, {
					id: "stringexternalizerConfigSection", //$NON-NLS-0$
					title: messages["Externalize Strings Configuration"],
					content: '<div id="stringexternalizerConfigContent"></div>', //$NON-NLS-0$
					preferenceService: this.serviceRegistry.getService("orion.core.preference"), //$NON-NLS-0$
					canHide: false,
					useAuxStyle: true
				});
				
				this.commandService.registerCommandContribution(section.actionsNode.id, "eclipse.changeMessagesDirectory", 1); //$NON-NLS-0$
				this.commandService.renderCommands(section.actionsNode.id, section.actionsNode.id, this.config, this, "button"); //$NON-NLS-0$
				
				
				var sectionContent = dojo.byId('stringexternalizerConfigContent'); //$NON-NLS-0$
				var p = dojo.create("p", null, sectionContent); //$NON-NLS-0$
				var b = dojo.create("b", null, p); //$NON-NLS-0$
				dojo.place(window.document.createTextNode(messages["Messages directory:"]), b, "only"); //$NON-NLS-1$
				dojo.create("br", null, p, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				if(this.config.directory.Parents){
					for(var i=this.config.directory.Parents.length-1; i>=0; i--){
						dojo.place(window.document.createTextNode(this.config.directory.Parents[i].Name + "/"), p, "last"); //$NON-NLS-1$ //$NON-NLS-0$
					}
				} else if(this.config.directory.parent){
					var parent = this.config.directory.parent;
					var path = "";
					while(parent){
						path = parent.Name + "/" + path; //$NON-NLS-0$
						if(parent.Id){
							break; // this is a project
						}
						parent = parent.parent;
					}
					dojo.place(window.document.createTextNode(path), p, "last"); //$NON-NLS-0$
				}
				dojo.place(window.document.createTextNode(this.config.directory.Name + "/"), p, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				
				var p = dojo.create("p", null, sectionContent); //$NON-NLS-0$
				var b = dojo.create("b", null, p); //$NON-NLS-0$
				dojo.place(window.document.createTextNode(messages["Messages file name:"]), b, "only"); //$NON-NLS-1$
				dojo.create("br", null, p, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				var fileName = dojo.create("input", {type: "text", value: this.config.file, size: 40}, p, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.connect(fileName, "onchange", null, dojo.hitch(this, function(){ //$NON-NLS-0$
						this.config.file = fileName.value;
						this.configChanged(true);
					}));
				
				var p = dojo.create("p", null, sectionContent); //$NON-NLS-0$
				var b = dojo.create("b", null, p); //$NON-NLS-0$
				dojo.place(window.document.createTextNode(messages["Messages module:"]), b, "only"); //$NON-NLS-1$
				dojo.create("br", null, p, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				var moduleName = dojo.create("input", {type: "text", value: this.config.module, size: 40}, p, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.connect(moduleName, "onchange", null, dojo.hitch(this, function(){ //$NON-NLS-0$
					this.config.module = moduleName.value;
					this.configChanged(false);
				}));

				var p = dojo.create("p", null, sectionContent); //$NON-NLS-0$
				var b = dojo.create("b", null, p); //$NON-NLS-0$
				dojo.place(window.document.createTextNode(messages["Mark not exported as NON-NLS:"]), b, "only"); //$NON-NLS-1$
				dojo.create("br", null, p, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				var markNls = dojo.create("input", {type: "checkbox", checked: this.config.marknls}, p, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.connect(markNls, "onchange", null, dojo.hitch(this, function(){ //$NON-NLS-0$
					this.config.marknls = markNls.checked;
					this.configChanged(false);
				}));
				this.configChanged(true);
			},
			configChanged: function(changedFile){
				var that = this;
				localStorage.setItem("StringExternalizerConfig_"+this.config.root.Location, JSON.stringify(this.config)); //$NON-NLS-0$
				if(changedFile){
					this.config.fileLocation = this.config.directory.Location+"/root/"+this.config.file; //$NON-NLS-0$
					this.fileClient.read(this.config.fileLocation).then(function(contents){
						var match = new RegExp("define\\(\\{(.*\\r?\\n*)*\\}\\);", "gmi").exec(contents); //$NON-NLS-1$ //$NON-NLS-0$
						var messages = {};
						if(match){
							var messagesString = match[0].substring("define(".length, match[0].length-");".length); //$NON-NLS-1$ //$NON-NLS-0$
							messages = JSON.parse(messagesString);
						}
						that.config.messages = {};
						for(var message in messages){
							that.config.messages[messages[message]] = message;
						}
						if(that.setConfig){
							that.setConfig(that.config);
						}
					}, function(error){
						that.config.messages = {};
						if(that.setConfig){
							that.setConfig(that.config);
						}
					});
				} else {
					if(this.setConfig){
						this.setConfig(that.config);
					}
				}
			}
	};
	
	StringExternalizerConfig.prototype.constructor = StringExternalizerConfig;
	
	return{
		StringExternalizerConfig: StringExternalizerConfig
	};
});