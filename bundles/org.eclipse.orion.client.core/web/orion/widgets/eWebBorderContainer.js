/*******************************************************************************
 * @license
 * Copyright (c) 2004, 2011, The Dojo Foundation and others. All Rights Reserved.
 *	Available via Academic Free License >= 2.1 OR the modified BSD license.
 *	see: http://dojotoolkit.org/license for details
 *
 * Contributors:
 *     Dojo Foundation: _handleOnChange function, and cookie management code
 *     IBM Corporation: Initial API and implementation of the remainder of the script
 *******************************************************************************/
 
 /*global dojo dijit dojox*/
 
define(['dojo', 'dijit', 'dijit/layout/BorderContainer', 'dojox/layout/ToggleSplitter'], function(dojo, dijit) {

dojo.declare("orion.widgets.eWebBorderContainer", dijit.layout.BorderContainer, {
	_splitterClass : "orion.widgets.eWebSplitter",
		
	getPreferredLeftPaneWidth: function(){
		// if we haven't remembered a width in the past, compute one that is 1/4 of the right pane width.
		var leftPaneW = this.getSizeCookie();
		var prefWidth;
		if(leftPaneW <= 0){
			var rightWidth = dojo.position(this.getRightPane()).w;
			prefWidth = rightWidth * 0.25;
		} else {
			prefWidth = leftPaneW;
		}
		return prefWidth;
	},
	
	isLeftPaneOpen: function(){
		var splitter = this.getSplitter("left");  // TODO going away in dojo 2.0
		if(splitter){
			return splitter.open;
		}
		return false;
	},
	
	getLeftPane: function() {
		if (this._left) {
			return this._left;
		}
		var children = this.getChildren();
		for (var i=0; i<children.length; i++) {
			if (children[i].region && (children[i].region === "leading" || children[i].region === "left")) {
				this._left = children[i].domNode;
				return this._left;
			}
		}
	},
	
	getHidingPane: function(){
		return this.getLeftPane();
	},
		
	getRightPane: function() {
		if (this._center) {
			return this._center;
		}
		var children = this.getChildren();
		for (var i=0; i<children.length; i++) {
			if (children[i].region && children[i].region === "center") {
				this._center = children[i].domNode;
				return this._center;
			}
		}
	},
	
	
	
	getSizeCookie: function(){
		var splitter = this.getSplitter("left");  // TODO going away in dojo 2.0
		if (splitter){
			return splitter.getSizeCookie();
		}
		return 0;
	},
	
	setSizeCookie: function(value){
		var splitter = this.getSplitter("left");  // TODO going away in dojo 2.0
		if (splitter){
			return splitter.setSizeCookie(value);
		}
	},
	
	toggleLeftPaneState: function(){
		var splitter = this.getSplitter("left");  // TODO going away in dojo 2.0
		if (splitter){
			splitter.toggleHidingPaneState();
		}
	},
	
	setToggleCallback: function(toggleCallback) {
		this.toggleCallback = toggleCallback;
	},
	
	toggle: function() {
		// find left and center and store so we only do this once.
		if (!this._left || !this._center) {
			var children = this.getChildren();
			for (var i=0; i<children.length; i++) {
				if (children[i].region && children[i].region === "center") {
					this._center = children[i].domNode;
				} else if (children[i].region && (children[i].region === "leading" || children[i].region === "left")) {
					this._left = children[i].domNode;
				}
			}
		}
		var leftPane = this._left;
		var rightPane = this._center;
		var originalW = dojo.position(leftPane).w;
		var isLeftOpen = this.isLeftPaneOpen();
		var targetWint;
		if(isLeftOpen){
			targetWint = 0;
		} else {
			targetWint = this.getPreferredLeftPaneWidth();
		}
				
		if(!isLeftOpen) {
			this.toggleLeftPaneState();
		}
				
		var leftOverflow = leftPane.style.overflow;
		var rightOverflow = rightPane.style.overflow;
		var a = new dojo.Animation({
			node: leftPane,
			duration: 300,
			curve: [1, 100],
			onAnimate: dojo.hitch(this, function(x){
				var deltaW = (targetWint - originalW)*x/100;
				var curWidth = originalW + deltaW;
				leftPane.style.width = curWidth + "px";
				leftPane.style.overflow = "hidden";
				rightPane.style.overflow = "hidden";
				this.layout();
				//this.resize();
			}),
			onEnd: dojo.hitch(this, function(){
				rightPane.style.overflow = rightOverflow;
				leftPane.style.overflow = leftOverflow;

				if (this.toggleCallback) {
					this.toggleCallback.apply();
				}
				if(isLeftOpen){
					this.toggleLeftPaneState();
				} else {
					this.setSizeCookie(null);
				}
			})
		});
		a.play();
	}
});

dojo.declare("orion.widgets.eWebSplitter", dojox.layout.ToggleSplitter,
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
		if (this.container.persist){ 
			// restore old state
			var persistOpenState = dojo.cookie(this._openStateCookieName);
			if (persistOpenState === "true") {
				this.container.getHidingPane().style.width = this.getSizeCookie() + "px";
			} else if (persistOpenState === "false") {
				this.set("open", false);
				this._handleOnChange();
			} else {
				// unrecognized value, assume open
				this.set("open", true);
				this._handleOnChange();
			}
		} else {
			// start out in an open state
			this.set("open", true);
			this._handleOnChange();		
		}
		return this;
	},
	
	_handleOnChange: function(){
		// summary
		// effect the state change with the new value of this.open

		// TODO: animate the open/close
		
		var paneNode = this.child.domNode, 
			openProps,
			dim = this.horizontal ? "height" : "width"; 

		if(this.open){
			// change to open state
			var styleProps = dojo.mixin({
				display: "block", 
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
		this.container.toggle();
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
	
	toggleHidingPaneState: function(){
		this.set("open", !this.open);
		this.container.getHidingPane().style.visibility = this.open ? "visible" : "hidden";	
		if(this.container.persist){
			dojo.cookie(this._openStateCookieName, this.open ? "true" : "false", {expires:365});
		}
	}
});

dojo.declare("orion.widgets.eWebBorderContainerReverse", dijit.layout.BorderContainer, {
	_splitterClass : "orion.widgets.eWebSplitter",
		
	getPreferredRightPaneWidth: function(){
		// if we haven't remembered a width in the past, compute one that is 1/4 of the left pane width.
		var rightPaneW = this.getSizeCookie();
		var prefWidth;
		if(rightPaneW <= 0){
			var leftWidth = dojo.position(this.getLeftPane()).w;
			prefWidth = leftWidth * 0.25;
		} else {
			prefWidth = rightPaneW;
		}
		return prefWidth;
	},
	
	isRightPaneOpen: function(){
		var splitter = this.getSplitter("right");  // TODO going away in dojo 2.0
		if(splitter){
			return splitter.open;
		}
		return false;
	},
	
	getRightPane: function() {
		if (this._right) {
			return this._right;
		}
		var children = this.getChildren();
		for (var i=0; i<children.length; i++) {
			if (children[i].region && (children[i].region === "trailing" || children[i].region === "right")) {
				this._right = children[i].domNode;
				return this._right;
			}
		}
	},
	
	getHidingPane: function(){
		return this.getRightPane();
	},
		
	getLeftPane: function() {
		if (this._center) {
			return this._center;
		}
		var children = this.getChildren();
		for (var i=0; i<children.length; i++) {
			if (children[i].region && children[i].region === "center") {
				this._center = children[i].domNode;
				return this._center;
			}
		}
	},
	
	
	
	getSizeCookie: function(){
		var splitter = this.getSplitter("right");  // TODO going away in dojo 2.0
		if (splitter){
			return splitter.getSizeCookie();
		}
		return 0;
	},
	
	setSizeCookie: function(value){
		var splitter = this.getSplitter("right");  // TODO going away in dojo 2.0
		if (splitter){
			return splitter.setSizeCookie(value);
		}
	},
	
	toggleRightPaneState: function(){
		var splitter = this.getSplitter("right");  // TODO going away in dojo 2.0
		if (splitter){
			splitter.toggleHidingPaneState();
		}
	},
	
	setToggleCallback: function(toggleCallback) {
		this.toggleCallback = toggleCallback;
	},
	
	toggle: function() {
		// find right and center and store so we only do this once.
		if (!this._right || !this._center) {
			var children = this.getChildren();
			for (var i=0; i<children.length; i++) {
				if (children[i].region && children[i].region === "center") {
					this._center = children[i].domNode;
				} else if (children[i].region && (children[i].region === "trailing" || children[i].region === "right")) {
					this._right = children[i].domNode;
				}
			}
		}
		var rightPane = this._right;
		var leftPane = this._center;
		var originalW = dojo.position(rightPane).w;
		var isRightOpen = this.isRightPaneOpen();
		var targetWint;
		if(isRightOpen){
			targetWint = 0;
		} else {
			targetWint = this.getPreferredRightPaneWidth();
		}
				
		if(!isRightOpen) {
			this.toggleRightPaneState();
		}
				
		var rightOverflow = rightPane.style.overflow;
		var leftOverflow = leftPane.style.overflow;
		var a = new dojo.Animation({
			node: rightPane,
			duration: 300,
			curve: [1, 100],
			onAnimate: dojo.hitch(this, function(x){
				var deltaW = (targetWint - originalW)*x/100;
				var curWidth = originalW + deltaW;
				rightPane.style.width = curWidth + "px";
				rightPane.style.overflow = "hidden";
				leftPane.style.overflow = "hidden";
				this.layout();
				//this.resize();
			}),
			onEnd: dojo.hitch(this, function(){
				leftPane.style.overflow = leftOverflow;
				rightPane.style.overflow = rightOverflow;

				if (this.toggleCallback) {
					this.toggleCallback.apply();
				}
				if(isRightOpen){
					this.toggleRightPaneState();
				} else {
					this.setSizeCookie(null);
				}
			})
		});
		a.play();
	}
});

});
