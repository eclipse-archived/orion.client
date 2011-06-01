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

define(['dojo', 'dijit', 'orion/util', 'dijit/Dialog', 'dijit/form/Button', 'orion/widgets/ExplorerTree',  'orion/widgets/_OrionDialogMixin'], function(dojo, dijit, mUtil) {

/**
* @param options {{
		func : function(item)  Function to be called with the selected item
	}}
 */
 
dojo.declare("widgets.DirectoryPrompterDialog", [ dijit.Dialog, widgets._OrionDialogMixin ], {
	treeWidget : null,
	treeRoot : {},
	widgetsInTemplate : true,
	templateString : dojo.cache(new dojo._Url("/js/widgets/templates/DirectoryPrompterDialog.html")),
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = this.options.title || "Choose a Folder";
		this.buttonOk = "OK";	
	},
	
	postCreate : function() {
		this.inherited(arguments);
		this.loadFolderList("");	// workspace root
	},
	
	loadFolderList: function(path) {
		path = mUtil.makeRelative(path);
		this.treeRoot.Path = path;
		this.options.fileClient.loadWorkspace(path).then(
			dojo.hitch(this, function(loadedWorkspace) {
				for (var i in loadedWorkspace) {
					this.treeRoot[i] = loadedWorkspace[i];
				}
				// we don't filter out files because there are no files at the workspace root
				mUtil.processNavigatorParent(this.treeRoot, loadedWorkspace.Children);
				this.createTree();
			})
		);
	},
	
	createTree : function(){
		var myTreeModel = new widgets.DirectoryTreeModel(this.options.serviceRegistry, this.treeRoot , this.options.fileClient);
		this.treeWidget = new widgets.ExplorerTree({
			id: "treeWidget",
			style: "width:100%; height:100%",
			model: myTreeModel,
			showRoot: false,
			persist: true, // remember expanded state
			openOnClick: false,
			getLabel: function(item) {
				return item.Name;
			},
			getIconClass: function(/* dojo.data.Item */ item, /* Boolean */ opened){
				return "folderItem";			
			}
		});	
		    
	this.treeWidget.startup();
	dojo.byId(this.treeContentPane.id).appendChild(this.treeWidget.domNode);
	},
	
	execute : function() {
		var selectedItems = this.treeWidget.getSelectedItems();
		this.onHide();
		this.options.func(selectedItems[0]);
	}
});

widgets.DirectoryTreeModel = (function() {
	/**
	 * @name widgets.DirectoryTreeModel
	 * @class Tree model used by widgets.DirectoryPrompterDialog
	 */
	function DirectoryTreeModel(serviceRegistry, root, fileClient) {
		this.registry = serviceRegistry;
		this.root = root;
		this.fileClient = fileClient;
	}
	DirectoryTreeModel.prototype = {
		destroy: function(){
		},
		getRoot: function(onItem){
			onItem(this.root);
		},
		mayHaveChildren: function(/* dojo.data.Item */ item){
			return true;
		},
		getChildren: function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
			// the parent item may already have the children fetched
			if (parentItem.children) {
				onComplete(parentItem.children);
			} else if (parentItem.Directory!==undefined && parentItem.Directory===false) {
				onComplete([]);
			} else if (parentItem.Location) {
				this.fileClient.fetchChildren(parentItem.ChildrenLocation).then(
					dojo.hitch(this, function(children) {
						var folderChildren = [];
						for (var i=0; i<children.length; i++) {
							if (children[i].Directory) {
								folderChildren.push(children[i]);
							}
						}
						mUtil.processNavigatorParent(parentItem, folderChildren);
						onComplete(folderChildren);
					}));
			} else {
				onComplete([]);
			}
		},
		getIdentity: function(/* item */ item){
			var result;
			if (item.Name) {
				result = item.Location;
			} else {
				result = "ROOT";
			}
			return result;
		},
		getLabel: function(/* dojo.data.Item */ item){
			return item.Name;
		},
		onChildrenChange: function(/* dojo.data.Item */ parent, /* dojo.data.Item[] */ newChildrenList) {
			// No implementation is necessary, this method is here so client code
			// can connect to it
		}
	};
	return DirectoryTreeModel;
})();
});