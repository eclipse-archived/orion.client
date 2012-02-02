/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define window */
/*jslint regexp:false browser:true forin:true*/

define([], function(){

var exports = {};

exports.TreeIterator = (function() {
	/**
	 * Creates a new tree iterator.
	 *
	 * @name orion.treeIterator.TreeIterator
	 * @class A tree model based iterator component.
	 * @param {list} firstLevelChildren The first level children of the tree root, each item has children and parent property recursively.
	 * @param {Object} options The options object which provides iterate patterns and all call back functions when iteration happens.
	 */
	function TreeIterator(firstLevelChildren, options) {
		this.firstLevelChildren = firstLevelChildren;
		this.reset();
		this._init(options);
	}
	TreeIterator.prototype = /** @lends orion.treeIterator.TreeIterator.prototype */ {
		
		_init: function(options){
			this.isExpanded = options.isExpanded;//optional callback providing that if a model item is expanded even if it has children. Default is true if it has children.
			this.isExpandable = options.isExpandable;//optional  callback providing that if a model item is expandable.Default is true .
		},
			
		_topLevel: function(modelItem) {
			return modelItem.parent ? (modelItem.parent === this.root) : true;
		},
		
		_expanded: function(model){
			if(!model){
				return true;//root is always expanded
			}
			var expanded = (model.children && model.children.length > 0);
			if(this.isExpanded && expanded){
				expanded = this.isExpanded(model);
			}
			return expanded;
		},
		
		_expandable: function(model){
			if(!model){
				return true;//root is always expandable
			}
			if(this.isExpandable && expanded){
				return this.isExpandable(model);
			}
			return true;
		},
		
		_diveIn: function(model){
			if( this._expanded(model)){
				this.setCursor(model.children[0]);
				return this.cursor();
			}
			return null;
		},
		
		_drillToLast: function(model){
			if( this._expanded(model)){
				return this._drillToLast(model.children[model.children.length-1]);
			}
			return model;
		},
		
		_forward: function(forceDiveIn){
			//first we will try to dive into the current cursor
			var next = this._diveIn(this._cursor);
			if(!next){
				if(forceDiveIn && this._expandable(this._cursor)){
					return null;//ask the caller to set the cursor
				}
				next = this._findSibling(this._cursor, true);
				if(next){
					this.setCursor(next);
				} 
			}
			return next;
		},
		
		_backward: function(forceDiveIn){
			var previous = this._findSibling(this._cursor, false);
			if(previous && previous !== this._cursor.parent){
				previous = this._drillToLast(previous);
			}
			if(forceDiveIn && this._expandable(previous)){
				return null;//ask the caller to set the cursor
			}
			if(previous){
				this.setCursor(previous);
			} 
			return previous;
		},
		
		_findSibling: function(current, forward){
			var isTopLevel = this._topLevel(current);
			var siblings = isTopLevel ? this.firstLevelChildren: current.parent.children;
			for(var i = 0; i < siblings.length; i++){
				if(siblings[i] === current){
					if((i === 0 && !forward) ){
						return isTopLevel ? null : current.parent;
					} else if (i === (siblings.length-1) && forward) {
						return isTopLevel ? null : this._findSibling(current.parent, forward);
					} else {
						return forward ? siblings[i+1] : siblings[i-1];
					}
				}
			}
			return null;
		},
		
		_inParentChain: function(model, compareTo){
			var parent = model.parent;
			while(parent){
				if(parent === compareTo){
					return true;
				}
				parent = parent.parent;
			}
			return false;
		},
		
		_onCollapse: function(model){
			if(this._expanded(model.parent)){
				return model;
			}
			return this._onCollapse(model.parent);
		},
		
		/**
		 * Set the cursor to the given model
		 * @param {Object} the given model
		 */
		setCursor: function(modelItem) {
			this._prevCursor = this._cursor;
			this._cursor = modelItem;
		},
		
		/**
		 * Set the the first level children
		 * @param {list} the first level children
		 */
		setTree: function(firstLevelChildren) {
			this.firstLevelChildren = firstLevelChildren;
		},
		
		/**
		 * Iterate from the current cursor
		 * @param {boolean} forward the iteration direction. If true then iterate to next, otherwise previous.
		 * @param {boolean} forceDiveIn optional. the flag for the current cursor to dive into its children. 
		 *                  If the cursor has no children yet or its children are not expanded, this method will call postExpandFunc.
		 *                  If there is no postExpandFunc defined it will return  null.
		 * @param {function} postExpandFunc optional. The call back function when forceDive is true.
		 */
		iterate: function(forward, forceDiveIn, postExpandFunc) {
			return forward ? this._forward(forceDiveIn, postExpandFunc) : this._backward(forceDiveIn, postExpandFunc);
		},
		
		/**
		 * When the parent model containing the cursor is collapsed, the cursor has to be surfaced to the parent
		 */
		collapse: function(collapsedModel) {
			if(this._inParentChain(this._cursor, collapsedModel)){
				this._cursor = collapsedModel;
				return this._cursor;
			}
			return null;
		},
		
		/**
		 * Reset cursor and previous cursor
		 */
		reset: function(){
			this._cursor = null;
			this._prevCursor = null;
			this.root = null;
			//By default the cursor is pointed to the first child 
			if(this.firstLevelChildren.length > 0){
				this._cursor = this.firstLevelChildren[0];
				this.root = this.firstLevelChildren[0].parent;
			}
		},
		
		/**
		 * Convenient method to see if last iterate action moved the cursor
		 */
		cursorMoved: function(){
			return this._cursor !== this._prevCursor;
		},
		
		/**
		 * Get current selected model by the iteration
		 */
		cursor: function(){
			return this._cursor;
		},
		
		/**
		 * Get previously selected model by the iteration
		 */
		prevCursor: function(){
			return this._prevCursor;
		}
	};
	return TreeIterator;
}());

return exports;
});
