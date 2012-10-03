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

define(['i18n!git/nls/gitmessages', 'dojo', 'dijit', 'orion/explorers/explorer', 'dijit/Dialog', 'dijit/form/Button', 'orion/widgets/ExplorerTree',  'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/RemotePrompterDialog.html'], function(messages, dojo, dijit, mExplorer) {

/**
* @param options {{
		func : function(item)  Function to be called with the selected item
	}}
 */
 
dojo.declare("orion.git.widgets.RemotePrompterDialog", [ dijit.Dialog, orion.widgets._OrionDialogMixin ], { //$NON-NLS-0$
	treeWidget : null,
	treeRoot : {},
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'git/widgets/templates/RemotePrompterDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
		this.treeRoot = this.options.treeRoot;
	},
	
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = this.options.title || messages['Choose a Folder'];
		this.newBranchText = messages["New Branch:"];
		this.buttonOk = messages["OK"];	
	},
	
	postCreate : function() {
		this.inherited(arguments);
		this.loadRemoteChildren(this.treeRoot);
		dojo.connect(this.newBranch, "onchange", dojo.hitch(this, this.validate)); //$NON-NLS-0$
		if(this.options.hideNewBranch){
			this.newBranchSection.style.display = "none"; //$NON-NLS-0$
		}
	},
	
	loadRemoteChildren: function(item) {
		this.treeRoot = item;
		var myTreeModel = new GitClonesModel(this.gitClient, null, this.gitClient.getGitClone, this.treeRoot);
		this.createTree(myTreeModel);
	},
	
	createTree : function(myTreeModel){
		
		this.treeWidget = new orion.widgets.ExplorerTree({
			style: "width:100%; height:100%", //$NON-NLS-0$
			model: myTreeModel,
			region: "center", //$NON-NLS-0$
			showRoot: false,
			persist: true, // remember expanded state
			openOnClick: false,
			getLabel: function(item) {
				if(item.Type === "RemoteTrackingBranch" && !item.Id){ //$NON-NLS-0$
					return item.Name + messages[" [New branch]"];
				}
				return item.Name;
			},
			getIconClass: function(/* dojo.data.Item */ item, /* Boolean */ opened){
				if (item.BranchLocation && item.RemoteLocation) {
					return "gitRepoItem"; //$NON-NLS-0$
				}
				if(item.GroupNode){
					return item.Name==="Branch" ? "gitBranchesItem" : "gitRemotesItem"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}
				if(item.Type === "Branch" || item.Type === "RemoteTrackingBranch"){ //$NON-NLS-1$ //$NON-NLS-0$
					return "gitBranchItem"; //$NON-NLS-0$
				}
				if(item.Type === "Remote"){ //$NON-NLS-0$
					return "gitRemoteItem"; //$NON-NLS-0$
				}
				return "gitDefaultItem"; //$NON-NLS-0$
							
			}
		});	
		
		var tree = this.treeWidget;
		var self = this;
		
		this.treeWidget._inheritedSelectNode = this.treeWidget._selectNode;
		
		this.treeWidget._selectNode = function(/**dijit._TreeNode*/ node) {
			tree._inheritedSelectNode(node);
			if(node.item && node.item.Type==="Remote"){ //$NON-NLS-0$
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
		if(selectedItems.length===1){
			if(selectedItems[0].Type==="RemoteTrackingBranch"){ //$NON-NLS-0$
				this.RemoteBrowserButton.disabled = false;
				return;
			}else if(selectedItems[0].Type==="Remote"){ //$NON-NLS-0$
				if(this.newBranch.value!==""){
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
			if(selectedItems[0].Type==="RemoteTrackingBranch"){ //$NON-NLS-0$
				this.options.func(selectedItems[0], selectedItems[0].parent);
			}else{
				var id = selectedItems[0].CloneLocation.split("/")[4];
				var newBranchObject = new Object();
				newBranchObject.parent = selectedItems[0];
				newBranchObject.FullName = "refs/remotes/" + selectedItems[0].Name + "/" + this.newBranch.value;
				newBranchObject.Name = selectedItems[0].Name + "/" + this.newBranch.value;
				newBranchObject.Type = "RemoteTrackingBranch";
				newBranchObject.Location=  "/gitapi/remote/" + selectedItems[0].Name + "/" + this.newBranch.value + "/file/" + id;
				this.options.func(null, selectedItems[0], newBranchObject);
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
		else if (item.Type === "Remote"){ //$NON-NLS-0$
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
			result = "ROOT"; //$NON-NLS-0$
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
						GroupNode : "true", //$NON-NLS-0$
						Location : parentItem.BranchLocation,
						Name : "Branches", //$NON-NLS-0$
						parent : parentItem
					}, {
						GroupNode : "true", //$NON-NLS-0$
						Location : parentItem.RemoteLocation,
						BranchLocation : parentItem.BranchLocation,
						Name : "Remotes", //$NON-NLS-0$
						parent : parentItem
					}, {
						GroupNode: "true", //$NON-NLS-0$
						Location: parentItem.TagLocation,
						Name: "Tags", //$NON-NLS-0$
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
		else if (parentItem.Type === "Remote"){ //$NON-NLS-0$
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