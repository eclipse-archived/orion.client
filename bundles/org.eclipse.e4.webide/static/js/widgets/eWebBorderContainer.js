/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
dojo.provide("widgets.eWebBorderContainer");
	 
dojo.require("dijit.layout.BorderContainer");
dojo.require("dojox.layout.ToggleSplitter");	 
dojo.declare("widgets.eWebBorderContainer", dijit.layout.BorderContainer, {
	_splitterClass : "widgets.eWebSplitter",
	_editorContainer: null,
	
	_setEditorContainerAttr: function(value) {
		this._editorContainer = value;
	},
	_getEditorContainerAttr: function() {
		return this._editorContainer;
	},
	isLeftPaneOpen: function(){
		var splitter = this._splitters["left"];
		if(splitter){
			return dijit.byNode(splitter).open;
		}
		return false;
	},
	getSizeCookie: function(){
		var splitter = this._splitters["left"];
		if(splitter){
			return dijit.byNode(splitter).getSizeCookie();
		}
		return 0;
	},
	setSizeCookie: function(value){
		var splitter = this._splitters["left"];
		if(splitter){
			return dijit.byNode(splitter).setSizeCookie(value);
		}
	},
	toggleLeftPaneState: function(){
		var splitter = this._splitters["left"];
		if(splitter){
			dijit.byNode(splitter).toggleLeftPaneState();
		}
	}
});

dojo.declare("widgets.eWebSplitter", dojox.layout.ToggleSplitter,
{
	postCreate: function(){
		this.inherited(arguments);
		this.connect(this.toggleNode, "onmousedown", "_onThumbMouseDown");
		this.connect(this.toggleNode, "onmouseover", "_onThumbMouseOver");
		this.connect(this.domNode, "onmouseover", "_onMouseOver");
		this.connect(this.toggleNode, "onmouseout", "_onThumbMouseOut");
		this._openStateCookieName = this.container.id + "_" + this.region + "_" + "open";
	}, 

	startup: function(){
		this.inherited(arguments);
		if(this.container.persist){
			// restore old state
			var persistOpenState = dojo.cookie(this._openStateCookieName);
			if(!persistOpenState || persistOpenState == "false" ){
				dojo.byId("leftPane").style.width = "0px";
				this.set("open", false);
				this._handleOnChange();
			} else {
				dojo.byId("leftPane").style.width = this.getSizeCookie() + "px";
			}
		}
		return this;
	},
	
	_handleOnChange: function(){
		// summary
		// 	effect the state change with the new value of this.open

		// TODO: animate the open/close
		
		var paneNode = this.child.domNode, 
			openProps,
			dim = this.horizontal ? "height" : "width"; 

		if(this.open){
			// change to open state
			var styleProps = dojo.mixin({
				display: "block", 
				overflow: "auto",
				visibility: "visible"
			}, this._openStyleProps);

			styleProps[dim] = (this._openStyleProps && this._openStyleProps[dim]) ? this._openStyleProps[dim] : this.openSize;
			dojo.style(paneNode, styleProps);
			
			// and re-hook up the mouse event handler
			this.connect(this.domNode, "onmousedown", "_onMouseDown");

		} else {
			// change to closed state
			// FIXME: this wont work in a drag-to-closed scenario
			var paneStyle  = dojo.getComputedStyle(paneNode); 
			
			openProps = this._getStyleProps(paneNode, true, paneStyle);
			var closedProps = this._getStyleProps(paneNode, false, paneStyle);

			this._openStyleProps = openProps;
			dojo.style(paneNode, closedProps);
		}
		this._setStateClass();
		if(this.container._started){
			var regionSize = 0;
			if(this.open && this.openSize) {
				regionSize = parseInt(this.openSize.replace("px", ""), 10);
			}
			this.container._layoutChildren(this.region, regionSize);
		}
	},
	
	_removeFocusVisual: function(evt){
		dojo.stopEvent(evt);
	},
	
	_onMouseDown: function(evt){
		if(!this.open){
			this._removeFocusVisual(evt);
			return; 
		}
		this._startDrag(evt);
	}, 

	_onMouseOver: function(e){
		if(!this.open){
			this.domNode.style.cursor = "default";
		} else {
			this.domNode.style.cursor = "e-resize";
		}
	},

	_onThumbMouseDown: function(evt){
		evt.stopPropagation();
		this._removeFocusVisual(evt);
		this.container.attr("editorContainer").toggleLeftPane();
	},
	
	_onThumbMouseOver: function(evt){
		this.toggleNode.style.backgroundColor='#AAAAAA';
	},
	
	_onThumbMouseOut: function(evt){
		this.toggleNode.style.backgroundColor='#DDDDDD';
	},
	
	_toggleMe: function(evt){
		//Do nothing	
	},
	
	getSizeCookie: function(){
		if(this.container.persist){
			// restore old size
			var persistSize = dojo.cookie(this._cookieName);
			if(persistSize){
				return parseInt(persistSize.replace("px", ""), 10);
			}
		}
		return 0;
	},
	
	setSizeCookie: function(value){
		if(this.container.persist){
			dojo.cookie(this._cookieName, this.child.domNode.style[this.horizontal ? "height" : "width"], {expires:365});
		}
	},
	
	toggleLeftPaneState: function(){
		this.set("open", !this.open);
		dojo.byId("leftPane").style.visibility = this.open ? "visible" : "hidden";	
		if(this.container.persist){
			dojo.cookie(this._openStateCookieName, this.open ? "true" : "false", {expires:365});
		}
	}
});
