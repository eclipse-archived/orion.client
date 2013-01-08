/*******************************************************************************
 * @license Copyright (c) 2011, 2012 IBM Corporation and others. All rights
 *          reserved. This program and the accompanying materials are made
 *          available under the terms of the Eclipse Public License v1.0
 *          (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse
 *          Distribution License v1.0
 *          (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define([ 'i18n!git/nls/gitmessages', 'orion/webui/dialog', 'orion/explorers/explorer', 'orion/widgets/ExplorerTree' ], function(messages, dialog, mExplorer) {

	function RemotePrompterDialog(options) {
		this._init(options);
	}

	RemotePrompterDialog.prototype = new dialog.Dialog();

	RemotePrompterDialog.prototype.TEMPLATE = '<div>'
			+ '<div id="treeContentPane" style="width:25em; min-height: 25em; max-height: 30em; height: auto; overflow-y: auto; padding: 8px"></div>'
			+ '<div id="newBranchPane" style="padding: 8px">' + '<label for="newBranch">${New Branch:}</label>'
			+ '<input id="newBranch" value="" disabled=true/>' + '</div>' + '</div>';

	RemotePrompterDialog.prototype._init = function(options) {
		var that = this;

		this.title = options.title || messages['Choose a Folder'];
		this.modal = true;
		this.messages = messages;
		this.func = options.func;
		this.treeRoot = options.treeRoot;
		this.gitClient = options.gitClient;
		this.hideNewBranch = options.hideNewBranch;

		this.buttons = [];

		this.buttons.push({ callback : function() {
			that.destroy();
			that._execute();
		},
		text : 'OK'
		});
	};

	RemotePrompterDialog.prototype._bindToDom = function(parent) {
		var that = this;

		this.$newBranch.addEventListener("input", function(evt) { //$NON-NLS-0$
			that._validate();
		});

		if (this.hideNewBranch) {
			this.$newBranchPane.style.display = "none"; //$NON-NLS-0$
		}
	};

	RemotePrompterDialog.prototype._beforeShowing = function() {
		// Start the dialog initialization.
		this._initialize();

		this._loadRemoteChildren();
	};

	RemotePrompterDialog.prototype._loadRemoteChildren = function() {
		var myTreeModel = new GitClonesModel(this.gitClient, null, this.gitClient.getGitClone, this.treeRoot);
		this._createTree(myTreeModel);
	};

	RemotePrompterDialog.prototype._createTree = function(myTreeModel) {
		var that = this;

		this.treeWidget = new orion.widgets.ExplorerTree({ style : "width:100%; height:100%", //$NON-NLS-0$
		model : myTreeModel,
		region : "center", //$NON-NLS-0$
		showRoot : false,
		persist : true, // remember expanded state
		openOnClick : false,
		getLabel : function(item) {
			if (item.Type === "RemoteTrackingBranch" && !item.Id) { //$NON-NLS-0$
				return item.Name + messages[" [New branch]"];
			}
			return item.Name;
		},
		getIconClass : function(item, opened) {
			if (item.BranchLocation && item.RemoteLocation) {
				return "gitRepoItem"; //$NON-NLS-0$
			}
			if (item.GroupNode) {
				return item.Name === "Branch" ? "gitBranchesItem" : "gitRemotesItem"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
			if (item.Type === "Branch" || item.Type === "RemoteTrackingBranch") { //$NON-NLS-1$ //$NON-NLS-0$
				return "gitBranchItem"; //$NON-NLS-0$
			}
			if (item.Type === "Remote") { //$NON-NLS-0$
				return "gitRemoteItem"; //$NON-NLS-0$
			}
			return "gitDefaultItem"; //$NON-NLS-0$
		}
		});

		this.treeWidget._inheritedSelectNode = this.treeWidget._selectNode;

		this.treeWidget._selectNode = function(node) {
			that.treeWidget._inheritedSelectNode(node);
			if (node.item && node.item.Type === "Remote") { //$NON-NLS-0$
				that.$newBranch.disabled = false;
			} else {
				that.$newBranch.disabled = true;
			}
			that._validate();
		};

		this.treeWidget.startup();

		var treeContentPane = this.$treeContentPane;
		treeContentPane.appendChild(this.treeWidget.domNode);
	};

	RemotePrompterDialog.prototype._validate = function() {
		var selectedItems = this.treeWidget.getSelectedItems();
		if (selectedItems.length === 1) {
			if (selectedItems[0].Type === "RemoteTrackingBranch") { //$NON-NLS-0$
				this.RemoteBrowserButton.disabled = false;
				return;
			} else if (selectedItems[0].Type === "Remote") { //$NON-NLS-0$
				if (this.$newBranch.value !== "") {
					this.RemoteBrowserButton.disabled = false;
					return;
				}
			}
		}
		this.RemoteBrowserButton.disabled = true;
	};

	RemotePrompterDialog.prototype._execute = function() {
		var selectedItems = this.treeWidget.getSelectedItems();
		if (this.func) {
			if (selectedItems[0].Type === "RemoteTrackingBranch") { //$NON-NLS-0$
				this.func(selectedItems[0], selectedItems[0].parent);
			} else {
				var id = selectedItems[0].CloneLocation.split("/")[4];
				var newBranchObject = new Object();
				newBranchObject.parent = selectedItems[0];
				newBranchObject.FullName = "refs/remotes/" + selectedItems[0].Name + "/" + this.$newBranch.value;
				newBranchObject.Name = selectedItems[0].Name + "/" + this.$newBranch.value;
				newBranchObject.Type = "RemoteTrackingBranch";
				newBranchObject.Location = "/gitapi/remote/" + selectedItems[0].Name + "/" + this.$newBranch.value + "/file/" + id;
				this.func(null, selectedItems[0], newBranchObject);
			}
		}
	};

	var GitClonesModel = function() {
		/**
		 * Creates a new Git repository model
		 * 
		 * @name orion.git.widgets.GitClonesModel
		 */
		function GitClonesModel(gitClient, rootPath, fetchItems, root) {
			// TODO: Consolidate with eclipse.TreeModel
			this.gitClient = gitClient;
			this.rootPath = rootPath;
			this.fetchItems = fetchItems;
			this.root = root ? root : null;
		}
		GitClonesModel.prototype = new mExplorer.ExplorerModel();

		GitClonesModel.prototype.getRoot = function(onItem) {
			var that = this;

			if (this.root) {
				onItem(this.root);
				return;
			}
			this.fetchItems(this.rootPath).then(function(item) {
				that.root = item;
				onItem(item);
			});
		};

		GitClonesModel.prototype.mayHaveChildren = function(item) {
			if (item.children || item.Children) {
				return true;
			} else if (item.BranchLocation && item.RemoteLocation) {
				return true;
			} else if (item.GroupNode) {
				return true;
			} else if (item.Type === "Remote") { //$NON-NLS-0$
				return true;
			}
			return false;
		};

		GitClonesModel.prototype.getIdentity = function(/* item */item) {
			var result;
			if (item.Location) {
				result = item.Location;
				// remove all non valid chars to make a dom id.
				result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
			} else {
				result = "ROOT"; //$NON-NLS-0$
			}
			return result;
		};

		GitClonesModel.prototype.getChildren = function(parentItem, onComplete) {
			// the parent already has the children fetched
			parentItem.children = [];

			if (parentItem.Children) {
				for ( var i = 0; i < parentItem.Children.length; i++) {
					parentItem.Children[i].parent = parentItem;
					parentItem.children[i] = parentItem.Children[i];
				}
				onComplete(parentItem.Children);
			} else if (parentItem.BranchLocation && parentItem.RemoteLocation) {
				parentItem.children = [ { GroupNode : "true", //$NON-NLS-0$
				Location : parentItem.BranchLocation,
				Name : "Branches", //$NON-NLS-0$
				parent : parentItem
				}, { GroupNode : "true", //$NON-NLS-0$
				Location : parentItem.RemoteLocation,
				BranchLocation : parentItem.BranchLocation,
				Name : "Remotes", //$NON-NLS-0$
				parent : parentItem
				}, { GroupNode : "true", //$NON-NLS-0$
				Location : parentItem.TagLocation,
				Name : "Tags", //$NON-NLS-0$
				parent : parentItem
				} ];
				onComplete(parentItem.children);
			} else if (parentItem.GroupNode) {
				this.gitClient.getGitBranch(parentItem.Location).then(function(children) {
					parentItem.children = children.Children;
					for ( var i = 0; i < children.Children.length; i++) {
						children.Children[i].parent = parentItem;
					}
					onComplete(children.Children);
				});
			} else if (parentItem.Type === "Remote") { //$NON-NLS-0$
				this.gitClient.getGitBranch(parentItem.Location).then(function(children) {
					parentItem.children = children.Children;
					for ( var i = 0; i < children.Children.length; i++) {
						children.Children[i].parent = parentItem;
					}
					onComplete(children.Children);
				});
			}
		};

		return GitClonesModel;
	}();

	RemotePrompterDialog.prototype.constructor = RemotePrompterDialog;

	// return the module exports
	return { RemotePrompterDialog : RemotePrompterDialog
	};
});