/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit eclipse widgets */
/*jslint browser:true */

define(['dojo', 'dijit', 'orion/util', 'orion/git/git-clones-explorer', 'dijit/Dialog', 'dijit/form/Button', 'orion/widgets/ExplorerTree',  'orion/widgets/_OrionDialogMixin'], function(dojo, dijit, mUtil, mGitClonesExplorer) {

/**
* @param options {{
		func : function(item)  Function to be called with the selected item
	}}
 */
 
dojo.declare("orion.git.widgets.RemotePrompterDialog", [ dijit.Dialog, orion.widgets._OrionDialogMixin ], {
	treeWidget : null,
	treeRoot : {},
	widgetsInTemplate : true,
	templateString : dojo.cache(new dojo._Url("/orion/git/widgets/templates/RemotePrompterDialog.html")),
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
		this.treeRoot = this.options.treeRoot;
	},
	
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = this.options.title || "Choose a Folder";
		this.newBranchText = "New Branch:";
		this.buttonOk = "OK";	
	},
	
	postCreate : function() {
		this.inherited(arguments);
		this.loadRemoteChildren(this.treeRoot);
		dojo.connect(this.newBranch, "onchange", dojo.hitch(this, this.validate));
		if(this.options.hideNewBranch){
			this.newBranchSection.style.display = "none";
		}
	},
	
	loadRemoteChildren: function(item) {
		this.treeRoot = item;
		var myTreeModel = new mGitClonesExplorer.GitClonesModel(this.gitClient, null, this.gitClient.getGitClone, this.treeRoot);
		this.createTree(myTreeModel);		
		var root = this.treeRoot;
	},
	
	createTree : function(myTreeModel){
		
		this.treeWidget = new orion.widgets.ExplorerTree({
			id: "treeWidget",
			style: "width:100%; height:100%",
			model: myTreeModel,
			region: "center",
			showRoot: false,
			persist: true, // remember expanded state
			openOnClick: false,
			getLabel: function(item) {
				return item.Name;
			},
			getIconClass: function(/* dojo.data.Item */ item, /* Boolean */ opened){
				if (item.BranchLocation && item.RemoteLocation) {
					return "gitRepoItem";
				}
				if(item.GroupNode){
					return item.Name==="Branch" ? "gitBranchesItem" : "gitRemotesItem";
				}
				if(item.Type === "Branch" || item.Type === "RemoteTrackingBranch"){
					return "gitBranchItem";
				}
				if(item.Type === "Remote"){
					return "gitRemoteItem";
				}
				return "gitDefaultItem";
							
			}
		});	
		
		var tree = this.treeWidget;
		var self = this;
		
		this.treeWidget._inheritedSelectNode = this.treeWidget._selectNode;
		
		this.treeWidget._selectNode = function(/**dijit._TreeNode*/ node) {
			tree._inheritedSelectNode(node);
			if(node.item && node.item.Type==="Remote"){
				self.newBranch.disabled = false;
			}else{
				self.newBranch.disabled = true;
			}
			dojo.hitch(self, self.validate)();
		};
		
		    
	this.treeWidget.startup();
	dojo.byId(this.treeContentPane.id).appendChild(this.treeWidget.domNode);
	},
	
	validate : function(){
		var selectedItems = this.treeWidget.getSelectedItems();
		if(selectedItems.length==1){
			if(selectedItems[0].Type==="RemoteTrackingBranch"){
				this.RemoteBrowserButton.disabled = false;
				return;
			}else if(selectedItems[0].Type==="Remote"){
				if(this.newBranch.value!=""){
					this.RemoteBrowserButton.disabled = false;
					return;
				}
			}
		}
		this.RemoteBrowserButton.disabled = true;
	},
	
	execute : function() {
		var selectedItems = this.treeWidget.getSelectedItems();
		this.onHide();
		if(selectedItems[0].Type==="RemoteTrackingBranch"){
			this.options.func(selectedItems[0]);
		}else{
			this.options.func(null, selectedItems[0], this.newBranch.value);
		}
		
	}
});
});