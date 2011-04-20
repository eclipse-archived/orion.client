/*******************************************************************************
 * Copyright (c) 2004, 2011, The Dojo Foundation and others. All Rights Reserved.
 *	Available via Academic Free License >= 2.1 OR the modified BSD license.
 *	see: http://dojotoolkit.org/license for details
 *
 * Contributors:
 *     Dojo Foundation: _handleOnChange function, and cookie management code
 *     IBM Corporation: Initial API and implementation of the remainder of the script
 *******************************************************************************/
 
 /*global dojo dijit dojox*/
 
dojo.provide("widgets.eWebBorderContainer");
	 
dojo.require("dijit.layout.BorderContainer");
dojo.require("dojox.layout.ToggleSplitter");	 
dojo.declare("widgets.eWebBorderContainer", dijit.layout.BorderContainer, {
	_splitterClass : "widgets.eWebSplitter",
	
	_leftPaneWidth: 0,
	
	_calcLeftPaneW: function(rightPane){
		var leftPaneW = this.getSizeCookie();
		if(leftPaneW < 50){
			var originalW = rightPane.style.width;
			var originalWint = parseInt(originalW.replace("px", ""), 10);
			this._leftPaneWidth = originalWint*0.25;
		} else {
			this._leftPaneWidth = leftPaneW;
		}
		return this._leftPaneWidth;
	},
	
	isLeftPaneOpen: function(){
		var splitter = this._splitters.left;
		if(splitter){
			return dijit.byNode(splitter).open;
		}
		return false;
	},
	getSizeCookie: function(){
		var splitter = this._splitters.left;
		if(splitter){
			return dijit.byNode(splitter).getSizeCookie();
		}
		return 0;
	},
	setSizeCookie: function(value){
		var splitter = this._splitters.left;
		if(splitter){
			return dijit.byNode(splitter).setSizeCookie(value);
		}
	},
	toggleLeftPaneState: function(){
		var splitter = this._splitters.left;
		if(splitter){
			dijit.byNode(splitter).toggleLeftPaneState();
		}
	},
	
	setToggleCallback: function(toggleCallback) {
		this.toggleCallback = toggleCallback;
	},
	toggle: function() {
		var targetW = "";
		var leftPane = this._left;
		var rightPane = this._center;
		var originalW = leftPane.style.width;
		var originalWint = parseInt(originalW.replace("px", ""), 10);
		var isLeftOpen = this.isLeftPaneOpen();
		var targetWint;
		if(isLeftOpen){
			this._leftPaneWidth = originalWint;
			targetWint = 0;

		} else {
			this._calcLeftPaneW(rightPane);
			targetWint = this._leftPaneWidth;
		}
				
		if(!isLeftOpen) {
			this.toggleLeftPaneState();
		}
				
		var leftOverflow = leftPane.style.overflow;
		var centerOverflow = this._center.style.overflow;
		var a = new dojo.Animation({
			node: leftPane,
			duration: 300,
			curve: [1, 100],
			onAnimate: dojo.hitch(this, function(x){
				var deltaW = (targetWint - originalWint)*x/100;
				var curWidth = originalWint + deltaW;
				leftPane.style.width = curWidth + "px";
				leftPane.style.overflow = "hidden";
				this._center.style.overflow = "hidden";
				this.layout();
				//this.resize();
			}),
			onEnd: dojo.hitch(this, function(){
				this._center.style.overflow = centerOverflow;
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
			if(!persistOpenState || persistOpenState === "false" ){
				this.container._left.style.width = "0px";
				this.set("open", false);
				this._handleOnChange();
			} else {
				this.container._left.style.width = this.getSizeCookie() + "px";
			}
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
	
	toggleLeftPaneState: function(){
		this.set("open", !this.open);
		dojo.byId("leftPane").style.visibility = this.open ? "visible" : "hidden";	
		if(this.container.persist){
			dojo.cookie(this._openStateCookieName, this.open ? "true" : "false", {expires:365});
		}
	}
});
