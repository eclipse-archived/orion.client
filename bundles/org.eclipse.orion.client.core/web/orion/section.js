/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
define(['dojo', 'orion/selection', 'orion/commands', 'orion/commonHTMLFragments'], function(dojo, mSelection, mCommands, mHTMLFragments){
	
	/**
	 * Generates a section
	 * 
	 * @param parent parent node
	 * @param options.id [required] id of the section header
	 * @param options.title [required] title of the section
	 * @param options.preferenceService [optional] used to store the hidden/shown state of the section if specified
	 * @param options.iconClass [optional] the class of the icon decorating section, no icon displayed if not provided
	 * @param options.content [optional] content of the section in HTML. May be set later using setContent()
	 * @param options.slideout {boolean} [optional] if true section will contain generated slideout
	 * @param options.canHide {boolean} [optional] if true section may be hidden
	 * @param options.hidden {boolean} [optional] if true section will be hidden at first display
	 * @param options.useAuxStyle {boolean} [optional] if true the section will be styled for an auxiliary pane
	 * @returns Section object
	 */
	function Section(parent, options) {
		
		var that = this;
		
		this._expandImageClass = "core-sprite-twistie_open";
		this._collapseImageClass = "core-sprite-twistie_closed";
		this._twistieSpriteClass = "modelDecorationSprite";
		
		// ...
		
		if (!options.id) {
			throw new Error("Missing required argument: id");
		}
		this.id = options.id;
				
		if (!options.title) {
			throw new Error("Missing required argument: title");
		}

		// setting up the section
		var wrapperClass = options.useAuxStyle ? "sectionWrapper sectionWrapperAux" : "sectionWrapper";
		this.domNode = dojo.create( "div", {"class": wrapperClass+" toolComposite", "id": options.id}, parent );

		// if canHide, add twistie and stuff...
		if(options.canHide){
			this.twistie = dojo.create( "span", { "class":"modelDecorationSprite layoutLeft" }, this.domNode );
			dojo.style(this.domNode, "cursor", "pointer");
			dojo.attr(this.domNode, "tabIndex", "0");
			dojo.connect(this.domNode, "onclick", function(evt) {
				if (evt.target.parentNode !== that.actionsNode && evt.target.parentNode !== that.selectionNode) {
					that._changeExpandedState();
				}
			});
			dojo.connect(this.domNode, "onkeydown", function(evt) {
				if(evt.keyCode === dojo.keys.ENTER && evt.target.parentNode !== that.actionsNode && evt.target.parentNode !== that.selectionNode) {
					that._changeExpandedState();
				}
			});
		}

		if(options.iconClass){
			var icon = dojo.create( "span", { "class":"sectionIcon" }, this.domNode );
			dojo.addClass(icon, options.iconClass);
		}
		
		this.titleNode = dojo.create( "div", { id: options.id + "Title", "class":"sectionAnchor layoutLeft", innerHTML: options.title }, this.domNode );
		
		this._progressNode = dojo.create( "div", { id: options.id + "Progress", "class": "sectionProgress layoutLeft", innerHTML: "..."}, this.domNode );
		this._progressNode.style.visibility = "hidden";
		
		this._toolActionsNode = dojo.create( "div", { id: options.id + "ToolActionsArea", "class":"layoutRight sectionActions"}, this.domNode );
		this.actionsNode = dojo.create( "div", { id: options.id + "ActionArea", "class":"layoutRight sectionActions"}, this.domNode );
		this.selectionNode = dojo.create( "div", { id: options.id + "SelectionArea", "class":"layoutRight sectionActions"}, this.domNode );
		
		if(options.slideout){
			this.slideout = mHTMLFragments.slideoutHTMLFragment(options.id);
			dojo.place(this.slideout, this.domNode);
		}

		this._contentParent = dojo.create("div", { "id": this.id + "Content", "role": "region", "class":"sectionTable", "aria-labelledby": this.titleNode.id}, parent, "last");

		if(options.content){
			this.setContent(options.content);
		}
		
		this.hidden = options.hidden;
		this._preferenceService = options.preferenceService;
		// initially style as hidden until we determine what needs to happen
		dojo.style(this._contentParent, "display", "none");
		// should we consult a preference?
		if (this._preferenceService) {
			this._preferenceService.getPreferences("/window/views").then(dojo.hitch(this, function(prefs) { 
				var isExpanded = prefs.get(this.id);
				
				if (isExpanded === undefined){
				} else {
					this.hidden = !isExpanded;
				}

				if (!this.hidden) {
					dojo.style(this._contentParent, "display", "block");
				}
				
				this._updateExpandedState(!this.hidden, false);
			}));
		} else {
			if (!this.hidden) {
				dojo.style(this._contentParent, "display", "block");
			}
			this._updateExpandedState(!this.hidden, false);
		}
		this._commandService = options.commandService;
		this._lastMonitor = 0;
		this._loading = {};
	}
	
	Section.prototype = {
			
		/**
		 * Changes the title of section
		 * @param title
		 */
		setTitle: function(title){
			this.titleNode.innerHTML = title;
		},
		
		/**
		 * Changes the contents of the section.
		 * @param content
		 */
		setContent: function(content){
			this._contentParent.innerHTML = content;
		},
		
		createProgressMonitor: function(){
			return new ProgressMonitor(this);
		},
		
		_setMonitorMessage: function(monitorId, message){
			this._progressNode.style.visibility = "visible";
			this._loading[monitorId] = message;
			var progressTitle = "";
			for(var loadingId in this._loading){
				if(progressTitle!==""){
					progressTitle+="\n";
				}
				progressTitle+=this._loading[loadingId];
			}
			this._progressNode.title = progressTitle;
		},
		
		_monitorDone: function(monitorId){
			delete this._loading[monitorId];
			var progressTitle = "";
			for(var loadingId in this._loading){
				if(progressTitle!==""){
					progressTitle+="\n";
				}
				progressTitle+=this._loading[loadingId];
			}
			this._progressNode.title = progressTitle;
			if(progressTitle===""){
				this._progressNode.style.visibility = "hidden";
			}
		},
		
		_changeExpandedState: function() {
			var t = new dojo.fx.Toggler({
				node: this._contentParent.id,
				showDuration: 500,
				hideDuration: 500,
				showFunc: dojo.fx.wipeIn,
				hideFunc: dojo.fx.wipeOut
			});
				
			if (!this.hidden){
				t.hide();
				this.hidden = true;
			} else {
				t.show();
				this.hidden = false;
			}
			
			this._updateExpandedState(!this.hidden, true);
		},
		
		_updateExpandedState: function(isExpanded, storeValue) {
			var expandImage = this.twistie;
			var id = this.id;
			if (expandImage) {
				dojo.addClass(expandImage, isExpanded ? this._expandImageClass : this._collapseImageClass);
				dojo.removeClass(expandImage, isExpanded ? this._collapseImageClass : this._expandImageClass);
			}
			// if a preference service was specified, we remember the state.
			if (this._preferenceService && storeValue) {
				this._preferenceService.getPreferences("/window/views").then(function(prefs){
					prefs.put(id, isExpanded);
				}); 
			}
		}
	};
	
	Section.prototype.constructor = Section;
	
	// ProgressMonitor
	
	function ProgressMonitor(section){
		this._section = section;
		this._id = ++section._lastMonitor;
	}
	
	ProgressMonitor.prototype = {
		begin: function(message){
			this.status = message;
			this._section._setMonitorMessage(this.id, message);
		},
		
		worked: function(message){
			this.status = message;
			this._section._setMonitorMessage(this.id, message);
		},
		
		done: function(status){
			this.status = status;
			this._section._monitorDone(this.id);
		}
	};
	
	ProgressMonitor.prototype.constructor = ProgressMonitor;

	return {Section: Section};
});
