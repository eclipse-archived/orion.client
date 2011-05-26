/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global dijit dojo widgets*/
/*jslint devel:true*/
define(['dojo', 'dijit', 'dijit/Tree'], function(dojo, dijit) {

dojo.declare(
	"widgets._ExplorerTreeNode",
	[dijit._TreeNode],
{
	templateString : dojo.cache(new dojo._Url("/js/widgets/templates/_ExplorerTreeNode.html")),
	
	/**
	 * @override
	 */
	_updateItemClasses: function(item) {
		this.inherited(arguments);
		this._applyClassAndStyle(item, "follow", "Follow");
		// Apply any other magic to the link (set href, etc)
		if (typeof this.tree.updateFollowLink === "function") {
			this.tree.updateFollowLink(item, this.followLink);
		}
	}
});

/**
 * Tree with a selection model and a "follow" link icon that appears after the label.
 * - Call getSelectedItems() to get the tree model objects that are selected.
 * - Override getFollowXXX to customize the "follow" icon appearance, and updateFollowLink 
 *   to set the link's href.
 * - The selectedNode property (see dijit.Tree) stores the most-recently-selected node.
 */
dojo.declare(
	"widgets.ExplorerTree",
	[dijit.Tree],
{
	selectedNodes: {}, /* key:dijit Id of TreeNode, value:TreeNode */
	
	postCreate: function() {
		dojo.connect(this, "onMouseDown", this._eatSelectionEvent);
		dojo.connect(this.domNode, "onselectstart", this._eatSelectionEvent); // IE only
		this.inherited(arguments);
	},
	
	/**
	 * Overridable function to return CSS class name to use for "follow" icon
	 * @return {String|Object} Suitable input to dojo.style()
	 */
	getFollowClass: function(/**dojo.data.Item*/ item, /**Boolean*/ opened) {
	},
	
	/**
	 * Overridable function to return CSS styles to display "follow" icon
	 * @return {String|Object} Suitable input to dojo.style()
	 */
	getFollowStyle: function(/**dojo.data.Item*/ item, /**Boolean*/ opened) {
	},
	
	/**
	 * Overridable function to set any other properties of the "follow" link (eg. set its href).
	 */
	updateFollowLink: function(/**dojo.data.Item*/ item, /**HTMLLinkElement*/ link) {
	},
	
	/**
	 * Overridable function called when the "follow" icon is clicked. By default the follow link
	 * will be opened in the browser. Use dojo.stopEvent(evt) to prevent that.
	 */
	onFollowClick: function(/**dojo.data.Item*/ item, /**dijit._TreeNode*/ node, /**Event*/ evt) {
	},
	
	// @return Array of model objects whose TreeNodes are selected
	getSelectedItems: function() {
		var result = [];
		this._forEachSelectedNode(function(nodeId, treeNode){
			result.push(treeNode.item);
		});
		return result;
	},
	
	/**
	 * @return TreeNode[]
	 */
	_getSelectedNodes: function() {
		var treeNodes = [];
		this._forEachSelectedNode(function(id, node) {
			treeNodes.push(node);
		});
		return treeNodes;
	},
	
	/**
	 * @param {Function(String, TreeNode)} callback
	 */
	_forEachSelectedNode: function(callback) {
		var nodes = this.selectedNodes;
		for (var k in nodes) {
			if (nodes.hasOwnProperty(k)) {
				callback(k, nodes[k]);
			}
		}
	},
	
	_createTreeNode: function(args) {
		return new widgets._ExplorerTreeNode(args);
	},
	
	_eatSelectionEvent: function(/**Event*/ e) {
		if (dojo.isCopyKey(e) || e.shiftKey) {
			dojo.stopEvent(e);
		}
	},
	
	/**
	 * @override
	 */
	_onClick: function(/**dijit._TreeNode*/ nodeWidget, /**Event*/ e) {
		var domElement = e.target,
			isExpandoClick = (domElement === nodeWidget.expandoNode || domElement === nodeWidget.expandoNodeText),
			isFollowClick = domElement === nodeWidget.followNode;
		
		if(dojo.isCopyKey(e)) {
			this._toggleSelectNode(nodeWidget);
			this.focusNode(nodeWidget);
		} else if (e.shiftKey) {
			if (this.selectedNode) {
				var start = this.selectedNode; // start from last selected node
				this._selectRange(start, nodeWidget);
				this.focusNode(nodeWidget);
			}
		} else {
			if (isFollowClick) {
				this.onFollowClick(nodeWidget.item, nodeWidget, e);
			} else if ((this.openOnClick && nodeWidget.isExpandable) || isExpandoClick) {
				// expando node was clicked, or label of a folder node was clicked; open it
				if(nodeWidget.isExpandable) {
					this._onExpandoClick({node:nodeWidget});
				}
			} else {
				// "other" click
				this._publish("execute", { item: nodeWidget.item, node: nodeWidget, evt: e } );
				this.onClick(nodeWidget.item, nodeWidget, e);
				this.focusNode(nodeWidget);
			}
			
			if(!isExpandoClick && !isFollowClick) {
				this._selectNode(nodeWidget);
			}
		}
		
		// If they clicked the "follow" icon, don't eat the event -- this is to get real browser
		// behavior (middle-click, etc) for the follow link
		if (!isFollowClick) {
			dojo.stopEvent(e);
		}
	},
	
	/**
	 * @override
	 */
	_onItemDelete: function(/**dojo.data.Item*/ item){
		// Remove deleted TreeNodes from selection before calling super
		var model = this.model,
			identity = model.getIdentity(item),
			nodes = this._itemNodesMap[identity];
		if(nodes){
			var scope = this;
			dojo.forEach(nodes,function(node){
				scope._removeFromSelection(node);
			});
		}
		this.inherited(arguments);
	},
	
	_getVisibleAncestor: function(/**dijit._TreeNode*/ node) {
		if (!node) {
			return null;
		}
		var parent = node.getParent();
		while (parent && !(parent.isExpandable && parent.isExpanded)) {
			node = parent;
			parent = parent.getParent();
		}
		return node;
	},
	
	// Adds or removes node from the selection
	_toggleSelectNode: function(/**dijit._TreeNode*/ node) {
		if (this.selectedNodes[node.get("id")]) {
			node.setSelected(false);
			this._removeFromSelection(node);
		} else {
			node.setSelected(true);
			this._addToSelection(node);
		}
	},
	
	_addToSelection: function(node) {
		this.selectedNodes[node.get("id")] = node;
	},
	
	_removeFromSelection: function(node) {
		delete this.selectedNodes[node.get("id")];
	},
	
	/**
	 * Selects a range from start to end.
	 */
	_selectRange: function(/**dijit._TreeNode*/ start, /**dijit._TreeNode*/ end) {
		var visibleStart = this._getVisibleAncestor(start),
			visibleEnd = this._getVisibleAncestor(end);
		if (!visibleStart || !visibleEnd) {
			return;
		} else if (visibleStart === visibleEnd) {
			this._selectNode(visibleStart);
			return;
		}
		
		var scope = this;
		function walk(from, to) {
			var traversal = [],
				next = from;
			do {
				traversal.push(next);
				next = scope._getNextNode(next);
			} while (next && next !== to);
			
			if (next === to) {
				traversal.push(to);
				return traversal;
			}
			return null;
		}
		
		var traversal = walk(visibleStart, visibleEnd);
		if (traversal) {
			// reverse() makes visibleStart the most-recently-selected node
			this._selectNodes(traversal.reverse(), true);
			return;
		}
		
		traversal = walk(visibleEnd, visibleStart);
		if (traversal) {
			this._selectNodes(traversal, true);
			return;
		}
		
		console.debug("Warning: couldn't select range from " + visibleStart.label + " to " + visibleEnd.label);
	},
	
	/**
	 * Resets selection to just the given node.
	 * @param node null means select none
	 * @override
	 */
	_selectNode: function(/**dijit._TreeNode*/ node) {
		this._selectNodes(node ? [node] : null);
	},
	
	/**
	 * Resets selection to just the given nodes.
	 * The "selectedNode" property will be set to the last node in the array.
	 */
	_selectNodes: function(/**dijit._TreeNode[]*/ nodes) {
		this._forEachSelectedNode(function(id, treeNode) {
			if (!treeNode._destroyed) {
				treeNode.setSelected(false);
			}
		});
		this.selectedNodes = {};
		
		if(nodes) {
			for (var i=0; i < nodes.length; i++) {
				var node = nodes[i];
				node.setSelected(true);
				this._addToSelection(node);
				this.selectedNode = node; // set property from superclass
			}
		}
	}
});
});
