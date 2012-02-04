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

define(['orion/treeModelIterator'], function(mTreeModelIterator){

var exports = {};

exports.ExplorerNavHandler = (function() {
	/**
	 * Creates a new tree iteration handler
	 * 
	 * @name orion.ExplorerNavHandler.ExplorerNavHandler
	 * @class A tree iteration handler based on an explorer.
	 * @param {Object} explorer The orion.explorer.Explorer instance.
	 * @param {Object} options The options object which provides iterate patterns and all call back functions when iteration happens.
	 */
	function ExplorerNavHandler(explorer, options) {
		this.explorer = explorer;
		this.renderer = this.explorer.renderer;
		this.model = this.explorer.model;
		this.myTree = this.explorer.myTree;
		
	    this._listeners = [];
	    var parentDiv = this.myTree._parent;
	    parentDiv.focus();
		
		this._modelIterator = new mTreeModelIterator.TreeModelIterator([],
		   		   {isExpanded: dojo.hitch(this, function(model) {
		   						 	return this.isExpanded(model);
		   						 }),
		   						 
		   			isExpandable: this.renderer.isExpandable ? dojo.hitch(this, function(model) {
					 				return this.renderer.isExpandable(model);
								 }) : dojo.hitch(this, function(model) {
					 				return this.isExpandable(model);
								 }),				   						 
		   			
					forceExpandFunc: this.renderer.forceExpandFunc? dojo.hitch(this, function(modelToExpand, childPosition, callback) {
			 						return this.forceExpandFunc(modelToExpand, childPosition, callback);
						 		 }) : undefined
		   		   });
		this._init(options);
		
		var keyListener = dojo.connect(parentDiv, "onkeydown", dojo.hitch(this, function (e) {
			if(e.keyCode === dojo.keys.DOWN_ARROW){
				return this.onUpArrow(e);
			} else if(e.keyCode === dojo.keys.UP_ARROW){
				return this.onDownArrow(e);
			} else if(e.keyCode === dojo.keys.RIGHT_ARROW){
				if(!e.ctrlKey){
					return this.onRihgtArrow(e);
				}
			} else if(e.keyCode === dojo.keys.LEFT_ARROW){
				if(!e.ctrlKey){
					return this.onLeftArrow(e);
				}
			} else if(e.keyCode === dojo.keys.SPACE){
				if(!e.ctrlKey){
					return this.onSpace(e);
				}
			} else if(e.keyCode === dojo.keys.ENTER) {
				return this.onEnter(e);
			}
		}));
		this._listeners.push(keyListener);
	};
	
	ExplorerNavHandler.prototype = /** @lends orion.ExplorerNavHandler.ExplorerNavHandler.prototype */ {
		
		_init: function(options){
			if(!options){
				return;
			}
			this.postIterateFunc = options.postIterateFunc;//optional callback providing that if a model item is expanded even if it has children. Default is true if it has children.
			this.postSelectFunc = options.isExpandable;//optional  callback providing that if a model item is expandable.Default is true .
		},
		
		isExpandable: function(model){
			if(!model){
				return false;
			}
			var expandImage = dojo.byId(this.renderer.expandCollapseImageId(this.model.getId(model)));
			return expandImage ? true: false;
		},
		
		isExpanded: function(model){
			if(!model){
				return false;
			}
			return this.myTree.isExpanded(this.model.getId(model));
		},
		
		refreshModel: function(model){
			this.topIterationNodes = [];
			this.model = model;
			if(this.model.getTopIterationNodes){
				this.model.getTopIterationNodes();
			} else if(this.model.root && this.model.root.children){
				this.topIterationNodes = this.model.root.children;
			}
			this._modelIterator.setTree(this.topIterationNodes);
			this._modelIterator.reset();
		},
		
		toggleCursor:  function(model, on){
			var currentRow = this.getRowdDiv(model);
			if(currentRow) {
				dojo.toggleClass(currentRow, "treeIterationCursor", on);
			}
		},
		
		cursorOn: function(model){
			var previousModel, currentModel;
			if(model){
				if(currentModel === this._modelIterator.cursor()){
					return;
				}
				previousModel = this._modelIterator.cursor();
				currentModel = model;
				this._modelIterator.setCursor(currentModel);
			} else {
				previousModel = this._modelIterator.prevCursor();
				currentModel = this._modelIterator.cursor();
			}
			if(previousModel === currentModel){
				return;
			}
			this.toggleCursor(previousModel, false);
			this.toggleCursor(currentModel, true);
		},
		
		getRowdDiv: function(model){
			var rowModel = model ? model: this._modelIterator.cursor();
			if(!rowModel){
				return null;
			}
			return dojo.byId(this.model.getId(rowModel));
		},
		
		iterate: function(forward, forceExpand, selecting)	{
			if(this.topIterationNodes.length === 0){
				return;
			}
			if(this._modelIterator.iterate(forward, forceExpand)){
				this.cursorOn();
				if(selecting){
					this._checkRow(this._modelIterator.prevCursor(), true);
				}
				//this.onHighlightSelection(next);
			}
		},
		
		_checkRow: function(model, toggle) {
			if(this.renderer._useCheckboxSelection){
				var tableRow = this.getRowdDiv(model);
				if(!tableRow){
					return;
				}
				var checkBox  = dojo.byId(this.renderer.getCheckBoxId(tableRow.id));
				var checked = toggle ? !checkBox.checked : true;
				if(checked !== checkBox.checked){
					this.renderer.onCheck(tableRow, checkBox, checked, true);
				}
			}
		},
		
		//Up arrow key iterates the current row backward. If control key is on, browser's scroll up behavior takes over.
		//If shift key is on, it toggles the check box and iterates backward.
		onUpArrow: function(e) {
			if(!e.ctrlKey){
				this.iterate(true, false, e.shiftKey);
				e.preventDefault();
				return false;
			}
		},

		//Down arrow key iterates the current row forward. If control key is on, browser's scroll down behavior takes over.
		//If shift key is on, it toggles the check box and iterates forward.
		onDownArrow: function(e) {
			if(!e.ctrlKey){
				this.iterate(false, false, e.shiftKey);
				e.preventDefault();
				return false;
			}
		},

		//Left arrow key collapses the current row. If current row is not expandable(e.g. a file in file navigator), move the cursor to its parent row.
		//If current row is expandable and expanded, collapse it. Otherwise move the cursor to its parent row.
		onLeftArrow:  function(e) {
			var curModel = this._modelIterator.cursor();
			if(!curModel){
				return false;
			}
			if(this.isExpandable(curModel)){
				if(this.isExpanded(curModel)){
					this.myTree.collapse(curModel);
					e.preventDefault();
					return true;
				}
			}
			if(!this._modelIterator.topLevel(curModel)){
				this.cursorOn(curModel.parent);
			}
		},
		
		//Right arrow key expands the current row if it is expandable and collapsed.
		onRihgtArrow: function(e) {
			var curModel = this._modelIterator.cursor();
			if(!curModel){
				return;
			}
			if(this.isExpandable(curModel)){
				if(!this.isExpanded(curModel)){
					this.myTree.expand(curModel);
					e.preventDefault();
					return false;
				}
			} 
		},

		//Space key toggles the check box on the current row if the renderer uses check box
		onSpace: function(e) {
			this._checkRow(null, true);
		},
		
		//Enter key simulates a href call if the current row has an href link rendered. The render has to provide the getRowActionElement function that returns the href DIV.
		onEnter: function(e) {
			if(this.renderer.getRowActionElement){
				var curModel = this._modelIterator.cursor();
				if(!curModel){
					return;
				}
				var div = this.renderer.getRowActionElement(this.model.getId(curModel));
				if(div.href){
					if(e.ctrlKey){
						window.open(div.href);
					} else {
						window.location.href = div.href;
					}
				}
			}
		}
	};
	return ExplorerNavHandler;
}());

return exports;
});
