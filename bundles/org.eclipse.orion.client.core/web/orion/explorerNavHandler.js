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

define(['dojo', 'orion/treeModelIterator'], function(dojo, mTreeModelIterator){

var exports = {};
var userAgent = navigator.userAgent;
var isPad = userAgent.indexOf("iPad") !== -1;

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
		this.model = this.explorer.model;
		
	    this._listeners = [];
	    this._selections = [];
	    
	    this._currentColumn = 0;
		
		this._modelIterator = new mTreeModelIterator.TreeModelIterator([],
		   		   {isExpanded: dojo.hitch(this, function(model) {
		   						 	return this.isExpanded(model);
		   						 }),
		   						 
		   			isExpandable: this.explorer.renderer.isExpandable ? dojo.hitch(this, function(model) {
					 				return this.explorer.renderer.isExpandable(model);
								 }) : dojo.hitch(this, function(model) {
					 				return this.isExpandable(model);
								 }),				   						 
		   			
					forceExpandFunc: this.explorer.forceExpandFunc? dojo.hitch(this, function(modelToExpand, childPosition, callback) {
			 						return this.explorer.forceExpandFunc(modelToExpand, childPosition, callback);
						 		 }) : undefined
		   		   });
		this._init(options);
		
	    var parentDiv = this._getEventListeningDiv();
	    if(!options || options.setFocus !== false){
	    	parentDiv.focus();
	    }
		var keyListener = dojo.connect(parentDiv, "onkeydown", dojo.hitch(this, function (e) {
            if (e.target) {// Firefox,  Chrome and Safari
                if(e.target !== parentDiv){
    				return true;
    			}
            } else if (e.srcElement){// Internet Explorer
                if(e.srcElement !== parentDiv){
    				return true;
    			}
            }
			if(this.explorer.preventDefaultFunc && this.explorer.preventDefaultFunc(e, this._modelIterator.cursor())){
				return true;
			}
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
		var l1 = dojo.connect(parentDiv, "onblur", dojo.hitch(this, function (e) {
			if(this.explorer.onFocus){
				this.explorer.onFocus(false);
			} else {
				this.toggleCursor(null, false);
			}
		}));
		var l2 = dojo.connect(parentDiv, "onfocus", dojo.hitch(this, function (e) {
			if(this.explorer.onFocus){
				this.explorer.onFocus(true);
			} else {
				this.toggleCursor(null, true);
			}
		}));
		this._listeners.push(l1);
		this._listeners.push(l2);
	};
	
	ExplorerNavHandler.prototype = /** @lends orion.ExplorerNavHandler.ExplorerNavHandler.prototype */ {
		
		_init: function(options){
			this._linearGridMove = true;//temporary. If true right key on the last grid will go to first grid of next row
			                            // Left key on the first grid will go to the last line grid of the previous line
			if(!options){
				return;
			}
			this.preventDefaultFunc = options.preventDefaultFunc;//optional callback. If this function returns true then the default behavior of all key press will stop at this time.
			                                                     //The key event is passed to preventDefaultFunc. It can implement its own behavior based o nteh key event.
			this.postDefaultFunc = options.postDefaultFunc;//optional callback. If this function provides addtional behaviors after the default behavior.
			                                               //Some explorers may want to do something else whne the cursor is changed, etc.
		},
		
		removeListeners: function(){
			if(this._listeners){
				for (var i=0; i < this._listeners.length; i++) {
					dojo.disconnect(this._listeners[i]);
				}
			}
		},
		
		focus: function(){
		    var parentDiv = this._getEventListeningDiv();
		    if(parentDiv){
				parentDiv.focus();
		    }
		},
		
		_getEventListeningDiv: function(){
			if(this.explorer.keyEventListeningDiv && typeof this.explorer.keyEventListeningDiv === "function"){
				return this.explorer.keyEventListeningDiv();
			}
			return this.explorer.myTree._parent;
		},
		
		isExpandable: function(model){
			if(!model){
				return false;
			}
			var expandImage = dojo.byId(this.explorer.renderer.expandCollapseImageId(this.model.getId(model)));
			return expandImage ? true: false;
		},
		
		isExpanded: function(model){
			if(!model){
				return false;
			}
			return this.explorer.myTree.isExpanded(this.model.getId(model));
		},
		
		refreshSelection: function(){
			var that = this;
			if(this.explorer.selection){
				this.explorer.selection.getSelections(function(selections) {
					that._clearSelection();
					for (var i = 0; i < selections.length; i++){
						that._selections.push(selections[i]);
					}
				});
			}
		},
		
		refreshModel: function(model, topIterationNodes, noReset){
			this.refreshSelection();
			this.topIterationNodes = [];
			this.model = model;
			if(this.model.getTopIterationNodes){
				this.topIterationNodes = this.model.getTopIterationNodes();
			} else if(topIterationNodes){
				this.topIterationNodes = topIterationNodes;
			}
			this._modelIterator.setTree(this.topIterationNodes);
			if(!noReset){
				this._modelIterator.reset();
			}
		},
		
		
		_inSelection: function(model){
			for(var i = 0; i < this._selections.length; i++){
				if(model === this._selections[i]){
					return i;
				}
			}
			return -1;
		},
		
		
		_clearSelection: function(visually){
			if(visually){
				for(var i = 0; i < this._selections.length; i++){
					this._checkRow(this._selections[i], true);
				}
			}
			this._selections.splice(0, this._selections.length);
		},
		
		_setSelection: function(model, toggling){
			if(!toggling){
				this._clearSelection(true);
				this._checkRow(model,false);		
				this._selections.push(model);
				this._lastSelection = model;
			} else{
				var index = this._inSelection(model);
				if(index >= 0){
					this._checkRow(model, true);
					this._selections.splice(index, 1);
				} else {
					this._checkRow(model,false);		
					this._selections.push(model);
					this._lastSelection = model;
				}
			}
			if (this.explorer.selection) {
				this.explorer.renderer.storeSelections();
				this.explorer.selection.setSelections(this._selections);		
			}
		},
		
		moveColumn: function(model, offset){
			if(!model){
				model = this.currentModel();
			}
			if(model && model.gridChildren && model.gridChildren.length > 0){
				if(offset !== 0){
					this.toggleCursor(model, false);
				}
				var column = this._currentColumn;
				var rowChanged= true;
				column = column + offset;
				if(column < 0){
					if(this._linearGridMove && offset !== 0){
						if(this._modelIterator.iterate(false)){
							model = this.currentModel();
						} else {
							rowChanged = false;
						}
					}
					column = rowChanged ? model.gridChildren.length - 1 : this._currentColumn;
				} else if(column >= model.gridChildren.length){
					if(this._linearGridMove && offset !== 0){
						if(this._modelIterator.iterate(true)){
							model = this.currentModel();
						} else {
							rowChanged = false;
						}
					}
					column = rowChanged ? 0 : this._currentColumn;
				}
				this._currentColumn = column;
				if(offset !== 0){
					this.toggleCursor(model, true);
				}
				return true;
			}
			return false;
		},
		
		getCurrentGrid:  function(model){
			if(!model){
				model = this.currentModel();
			}
			if(model && model.gridChildren && model.gridChildren.length > 0){
				return model.gridChildren[this._currentColumn];
			}
			return null;
		},
		
		toggleCursor:  function(model, on){
			var currentRow = this.getRowDiv(model);
			dojo.toggleClass(currentRow, "treeIterationCursorRow", on);
			var currentgrid = this.getCurrentGrid(model);
			if(currentgrid) {
				dojo.toggleClass(currentgrid.domNode, "treeIterationCursor", on);
			}
		},
		
		currentModel: function(){
			return this._modelIterator.cursor();
		},
		
		cursorOn: function(model, force, next){
			var forward = next === undefined ? false : next;
			var previousModel, currentModel;
			if(model || force){
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
			if(previousModel === currentModel && !force){
				return;
			}
			this.toggleCursor(previousModel, false);
			if(force && !currentModel){
				return;
			}
			this.moveColumn(null, 0);
			this.toggleCursor(currentModel, true);
			var currentRowDiv = this.getRowDiv();
			if(currentRowDiv && !this._visible(currentRowDiv)) {
				currentRowDiv.scrollIntoView(!forward);
			}
			if(this.explorer.onCursorChanged){
				this.explorer.onCursorChanged(previousModel, currentModel);
			}
		},
		
		getSelection: function(){
			return this._selections;
		},
		
		getSelectionIds: function(){
			var ids = [];
			for (var i = 0; i < this._selections.length; i++) {
				ids.push(this.model.getId(this._selections[i]));
			}
			return ids;
		},
		
		getRowDiv: function(model){
			var rowModel = model ? model: this._modelIterator.cursor();
			if(!rowModel){
				return null;
			}
			return rowModel.rowDomNode ? rowModel.rowDomNode :  dojo.byId(this.model.getId(rowModel));
		},
		
		iterate: function(forward, forceExpand, selecting)	{
			if(this.topIterationNodes.length === 0){
				return;
			}
			if(this._modelIterator.iterate(forward, forceExpand)){
				this.cursorOn(null, false, forward);
				if(selecting){
					this._setSelection(this._modelIterator.prevCursor(), true);
				}
			}
		},
		
		_checkRow: function(model, toggle) {
			if(this.explorer.renderer._useCheckboxSelection){
				var tableRow = this.getRowDiv(model);
				if(!tableRow){
					return;
				}
				var checkBox  = dojo.byId(this.explorer.renderer.getCheckBoxId(tableRow.id));
				var checked = toggle ? !checkBox.checked : true;
				if(checked !== checkBox.checked){
					this.explorer.renderer.onCheck(tableRow, checkBox, checked, true);
				}
			} else {
				this._select(model, toggle);
			}
		},
		
		_visible: function(rowDiv) {
			if (rowDiv.offsetWidth === 0 || rowDiv.offsetHeight === 0) {
				return false;
			}
		    var parentNode = this.explorer.myTree._parent;
			var parentRect = parentNode.getClientRects()[0],
			rects = rowDiv.getClientRects();
			for (var i = 0, l = rects.length; i < l; i++) {
				var r = rects[i];
			    var in_viewport = (r.top >= parentRect.top && r.top <= parentRect.bottom && r.bottom >= parentRect.top && r.bottom <= parentRect.bottom);
			    if (in_viewport ) {
					return true;
			    }
			}
			return false;
		},
			
		_select: function(model, toggling){
			if(!model){
				model = this._modelIterator.cursor();
			}
			dojo.toggleClass(this.getRowDiv(model), "checkedRow", this._inSelection(model) < 0);
		},
		
		_onModelGrid: function(model, mouseEvt){
			if(model.gridChildren){
				for(var i = 0; i < model.gridChildren.length; i++){
					if(mouseEvt.target === model.gridChildren[i].domNode){
						return true;
					}
				}
			}
			return false;
		},
		
		onClick: function(model, mouseEvt)	{
			if(this._onModelGrid(model, mouseEvt)){
				return;
			}
			this.cursorOn(model);
			if(isPad){
				this._setSelection(model, true);
			} else if(mouseEvt.ctrlKey){
				this._setSelection(model, true);
			} else if(mouseEvt.shiftKey && this._lastSelection){
				var scannedSel = this._modelIterator.scan(this._lastSelection, model);
				if(scannedSel){
					this._clearSelection(true);
					for(var i = 0; i < scannedSel.length; i++){
						this._setSelection(scannedSel[i], true);
					}
				}
			} else {
				this._setSelection(model, false);
			}
		},
		
		onCollapse: function(model)	{
			if(this._modelIterator.collapse(model)){
				this.cursorOn();
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
			if(!e.ctrlKey && this.moveColumn(null, -1)){
				e.preventDefault();
				return true;
			}
			var curModel = this._modelIterator.cursor();
			if(!curModel){
				return false;
			}
			if(this.isExpandable(curModel)){
				if(this.isExpanded(curModel)){
					this.explorer.myTree.collapse(curModel);
					e.preventDefault();
					return true;
				}
			}
			if(!this._modelIterator.topLevel(curModel)){
				this.cursorOn(curModel.parent);
			//The cursor is now on a top level item which is collapsed. We need to ask the explorer is it wants to scope up.	
			} else if (this.explorer.scopeUp && typeof this.explorer.scopeUp === "function"){
				this.explorer.scopeUp();
			}
		},
		
		//Right arrow key expands the current row if it is expandable and collapsed.
		onRihgtArrow: function(e) {
			if(!e.ctrlKey && this.moveColumn(null, 1)){
				e.preventDefault();
				return true;
			}
			var curModel = this._modelIterator.cursor();
			if(!curModel){
				return;
			}
			if(this.isExpandable(curModel)){
				if(!this.isExpanded(curModel)){
					this.explorer.myTree.expand(curModel);
					e.preventDefault();
					return false;
				}
			}
		},

		//Space key toggles the check box on the current row if the renderer uses check box
		onSpace: function(e) {
			this._setSelection(this.currentModel(), true);
			e.preventDefault();
		},
		
		//Enter key simulates a href call if the current row has an href link rendered. The render has to provide the getRowActionElement function that returns the href DIV.
		onEnter: function(e) {
			var currentGrid = this.getCurrentGrid(this._modelIterator.cursor());
			if(currentGrid){
				if(currentGrid.widget){
					if(typeof currentGrid.onClick === "function"){
						currentGrid.onClick();
					} else if(typeof currentGrid.widget.focus === "function"){
						currentGrid.widget.focus();
					}
				} else {
					var evt = document.createEvent("MouseEvents");
					evt.initMouseEvent("click", true, true, window,
							0, 0, 0, 0, 0, e.ctrlKey, false, false, false, 0, null);
					currentGrid.domNode.dispatchEvent(evt);
				}
				return;
			}
			if(this.explorer.renderer.getRowActionElement){
				var curModel = this._modelIterator.cursor();
				if(!curModel){
					return;
				}
				var div = this.explorer.renderer.getRowActionElement(this.model.getId(curModel));
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
