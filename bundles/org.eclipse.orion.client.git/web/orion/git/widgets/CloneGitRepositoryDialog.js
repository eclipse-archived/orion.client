/******************************************************************************* 
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo dijit widgets*/
/*jslint browser:true*/
define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'dijit', 'dijit/Dialog', 'orion/widgets/_OrionDialogMixin', 'orion/widgets/DirectoryPrompterDialog', 'text!orion/git/widgets/templates/CloneGitRepositoryDialog.html'], function(messages, require, dojo, dijit) {

/**
 * @param options {{ 
 *     func: function
 * }}
 */
dojo.declare("orion.git.widgets.CloneGitRepositoryDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], { //$NON-NLS-0$
	widgetsInTemplate: true,
	templateString: dojo.cache('orion', 'git/widgets/templates/CloneGitRepositoryDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = this.options.title ? this.options.title : messages["Clone Git Repository"];
		this.gitUrlLabelText = messages["Repository URL:"];
		this.gitPathLabelText = messages["Existing directory:"];
		this.gitNameLabelText = messages["New folder:"];
		this.advancedShown = false;
		
		this.gitTargetLocationText = messages["Choose target location"];
		this.gitDefaultTargetLocationText = messages["Default target location"];
		this.gitChangeGitPathText = messages["Change..."];
	},
	postCreate : function(){
		var that = this;
		this.inherited(arguments);
		if (this.options.url) {
			this.gitUrl.value = this.options.url;
		}
		if(this.options.advancedOnly){
			this.Basic.style.display="none"; //$NON-NLS-0$
			this.Advanced.style.display="";
			setTimeout(function(){that.gitName.focus();}, 400);
		}
		
		dojo.connect(this.changeGitPath, "onclick", null, dojo.hitch(this, this.openDirectoryPickerDialog)); //$NON-NLS-0$
		dojo.connect(this.isExistingProject, "onchange", null, dojo.hitch(this, this.showExistingFolder)); //$NON-NLS-0$
		dojo.connect(this.gitName, "onfocus", null, dojo.hitch(this, this.showNewProject)); //$NON-NLS-0$
		dojo.connect(this.advancedLink, "onclick", null, dojo.hitch(this, this.showAdvanced)); //$NON-NLS-0$
		dojo.connect(this.advancedLinkHide, "onclick", null, dojo.hitch(this, this.hideAdvanced)); //$NON-NLS-0$
		if (this.options.alwaysShowAdvanced) {
			this.showAdvanced();
		}
	},
	execute: function() {
		if(this.options.func)
		this.options.func(
				this.options.advancedOnly ? undefined : this.gitUrl.value,
				(this.advancedShown && this.isNewProject.checked) ? undefined : this.gitPath.value,
				(this.advancedShown && !this.isNewProject.checked) ? undefined : this.gitName.value
				);
		delete this.options.func; //prevent performing this action twice (IE)
	},
	showAdvanced: function(){
		this.advancedShown = true;
		this.Advanced.style.display="";
		this.advancedLink.style.display="none"; //$NON-NLS-0$
		this.advancedLinkHide.style.display="";
	},
	hideAdvanced: function(){
		this.advancedShown = false;
		this.Advanced.style.display="none"; //$NON-NLS-0$
		this.advancedLink.style.display="";
		this.advancedLinkHide.style.display="none"; //$NON-NLS-0$
		
	},
	showExistingFolder: function(){
		if(this.isExistingProject.checked){
			this.openDirectoryPickerDialog();
		}else{
			this.gitName.focus();
		}
	},
	showNewProject: function(){
		this.isNewProject.checked = true;
	},
	openDirectoryPickerDialog: function(){
		function makePathSegment(folder) {
			var link = document.createElement("a"); //$NON-NLS-0$
			link.href = require.toUrl("navigate/table.html") + "#"+folder.ChildrenLocation; //$NON-NLS-1$ //$NON-NLS-0$
			link.textContent = folder.Name;
			return link;
		}
		this.isExistingProject.checked = true; 
		var self = this;
		var dialog = new orion.widgets.DirectoryPrompterDialog({
				title: messages["Choose a Folder"],
				serviceRegistry: this.options.serviceRegistry,
				fileClient: this.options.fileClient,	
				func: dojo.hitch(this, function(targetFolder) {
					if (targetFolder && targetFolder.Location) {
						this.gitPath.value = targetFolder.Location;
						dojo.place(makePathSegment(targetFolder), this.shownGitPath, "only"); //$NON-NLS-0$
						var currentFolder = targetFolder;

						while(currentFolder.parent && !currentFolder.parent.Projects){
							this.shownGitPath.insertBefore(document.createTextNode("/"), this.shownGitPath.firstChild); //$NON-NLS-0$
							this.shownGitPath.insertBefore(makePathSegment(currentFolder.parent), this.shownGitPath.firstChild);

							currentFolder = currentFolder.parent;
						}
					}
				})
			});
			dialog.startup();
			dialog.show();
	}
});
});