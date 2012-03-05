/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit eclipse widgets */
/*jslint browser:true */

define(['dojo', 'dijit', 'orion/util', 'orion/explorer', 'dijit/Dialog', 'dijit/form/Button', 'orion/widgets/ExplorerTree',  'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/RemotePrompterDialog.html'], function(dojo, dijit, mUtil, mExplorer) {

/**
* @param options {{
		func : function(item)  Function to be called with the selected item
	}}
 */
 
dojo.declare("orion.git.widgets.RemotePrompterDialog", [ dijit.Dialog, orion.widgets._OrionDialogMixin ], {
	treeWidget : null,
	treeRoot : {},
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'git/widgets/templates/RemotePrompterDialog.html'),
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
		var myTreeModel = new GitClonesModel(this.gitClient, null, this.gitClient.getGitClone, this.treeRoot);
		this.createTree(myTreeModel);
	},
	
	createTree : function(myTreeModel){
		
		this.treeWidget = new orion.widgets.ExplorerTree({
			style: "width:100%; height:100%",
			model: myTreeModel,
			region: "center",
			showRoot: false,
			persist: true, // remember expanded state
			openOnClick: false,
			getLabel: function(item) {
				if(item.Type === "RemoteTrackingBranch" && !item.Id){
					return item.Name + " [New branch]";
				}
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
		if(this.options.func){
			if(selectedItems[0].Type==="RemoteTrackingBranch"){
				this.options.func(selectedItems[0], selectedItems[0].parent);
			}else{
				this.options.func(null, selectedItems[0], this.newBranch.value);
			}
		}
		delete this.options.func; //prevent performing this action twice (IE)
	}
});

var GitClonesModel = function() {
	/**
	 * Creates a new Git repository model
	 * @name orion.git.widgets.GitClonesModel
	 */
	function GitClonesModel(gitClient, rootPath, fetchItems, root) {
		//TODO: Consolidate with eclipse.TreeModel
		this.gitClient = gitClient;
		this.rootPath = rootPath;
		this.fetchItems = fetchItems;
		this.root = root ? root : null;
	}
	GitClonesModel.prototype = new mExplorer.ExplorerModel(); 
	
	GitClonesModel.prototype.getRoot = function(onItem){
		if(this.root){
			onItem(this.root);
			return;
		}
		this.fetchItems(this.rootPath).then(
			dojo.hitch(this, function(item){
				this.root = item;
				onItem(item);
			})
		);
	};
	
	GitClonesModel.prototype.mayHaveChildren = function (item){
		if (item.children || item.Children) {
			return true;
		}
		else if (item.BranchLocation && item.RemoteLocation){
			return true;
		}
		else if (item.GroupNode){
			return true;
		}
		else if (item.Type === "Remote"){
			return true;
		}
		return false;
	};

	GitClonesModel.prototype.getIdentity = function(/* item */ item){
		var result;
		if(item.Location){
			result = item.Location;
			// remove all non valid chars to make a dom id. 
			result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
		} else {
			result = "ROOT";
		}
		return result;
	};

	GitClonesModel.prototype.getChildren = function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
			// the parent already has the children fetched
		parentItem.children = [];
		
		if (parentItem.Children) {
			for(var i=0; i<parentItem.Children.length; i++){
				parentItem.Children[i].parent = parentItem;
				parentItem.children[i] = parentItem.Children[i];
			}
			onComplete(parentItem.Children);
		}
		else if (parentItem.BranchLocation && parentItem.RemoteLocation){
					parentItem.children = [ {
						GroupNode : "true",
						Location : parentItem.BranchLocation,
						Name : "Branches",
						parent : parentItem
					}, {
						GroupNode : "true",
						Location : parentItem.RemoteLocation,
						BranchLocation : parentItem.BranchLocation,
						Name : "Remotes",
						parent : parentItem
					}, {
						GroupNode: "true",
						Location: parentItem.TagLocation,
						Name: "Tags",
						parent: parentItem
					} ]; 
			onComplete(parentItem.children);
		}
		else if (parentItem.GroupNode){
			this.gitClient.getGitBranch(parentItem.Location).then( 
				dojo.hitch(this, function(children) {
					parentItem.children = children.Children;
					for(var i=0; i<children.Children.length; i++){
						children.Children[i].parent = parentItem;
					}
					onComplete(children.Children);
				})
			);
		}
		else if (parentItem.Type === "Remote"){
			this.gitClient.getGitBranch(parentItem.Location).then( 
				dojo.hitch(this, function(children) {
					parentItem.children = children.Children;
					for(var i=0; i<children.Children.length; i++){
						children.Children[i].parent = parentItem;
					}
					onComplete(children.Children);
				})
			);
		}
	};

	return GitClonesModel;
}();

});