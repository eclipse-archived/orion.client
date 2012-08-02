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
	 * @param options.onExpandCollapse {function} [optional] a function that will be called when the expanded/collapsed state changes
	 * @returns Section object
	 */
	function Section(parent, options) {
		
		var that = this;
		
		this._expandImageClass = "core-sprite-openarrow"; //$NON-NLS-0$
		this._collapseImageClass = "core-sprite-closedarrow"; //$NON-NLS-0$
		this._twistieSpriteClass = "modelDecorationSprite"; //$NON-NLS-0$
		
		// ...
		
		if (!options.id) {
			throw new Error("Missing required argument: id"); //$NON-NLS-0$
		}
		this.id = options.id;
				
		if (!options.title) {
			throw new Error("Missing required argument: title"); //$NON-NLS-0$
		}

		// setting up the section
		var wrapperClass = options.useAuxStyle ? "sectionWrapper sectionWrapperAux" : "sectionWrapper"; //$NON-NLS-1$ //$NON-NLS-0$
		this.domNode = dojo.create( "div", {"class": wrapperClass+" toolComposite", "id": options.id}, parent ); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		// if canHide, add twistie and stuff...
		if(options.canHide){
			this.twistie = dojo.create( "span", { "class":"modelDecorationSprite layoutLeft sectionTitle" }, this.domNode ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.style(this.domNode, "cursor", "pointer"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.attr(this.domNode, "tabIndex", "0"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.connect(this.domNode, "onclick", function(evt) { //$NON-NLS-0$
				if (evt.target === that.titleNode || evt.target === that.twistie) {
					that._changeExpandedState();
				}
			});
			dojo.connect(this.domNode, "onkeydown", function(evt) { //$NON-NLS-0$
				if(evt.keyCode === dojo.keys.ENTER && (evt.target === that.domNode || evt.target === that.titleNode || evt.target === that.twistie)) {
					that._changeExpandedState();
				}
			});
		}

		if(options.iconClass){
			var icon = dojo.create( "span", { "class":"sectionIcon" }, this.domNode ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(icon, options.iconClass);
		}
		
		this.titleNode = dojo.create( "div", { id: options.id + "Title", "class":"sectionAnchor sectionTitle layoutLeft", innerHTML: options.title }, this.domNode ); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		this._progressNode = dojo.create( "div", { id: options.id + "Progress", "class": "sectionProgress sectionTitle layoutLeft", innerHTML: "..."}, this.domNode ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._progressNode.style.visibility = "hidden"; //$NON-NLS-0$
		
		this._toolActionsNode = dojo.create( "div", { id: options.id + "ToolActionsArea", "class":"layoutRight sectionActions"}, this.domNode ); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.actionsNode = dojo.create( "div", { id: options.id + "ActionArea", "class":"layoutRight sectionActions"}, this.domNode ); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.selectionNode = dojo.create( "div", { id: options.id + "SelectionArea", "class":"layoutRight sectionActions"}, this.domNode ); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		if(options.slideout){
			this.slideout = mHTMLFragments.slideoutHTMLFragment(options.id);
			dojo.place(this.slideout, this.domNode);
		}

		this._contentParent = dojo.create("div", { "id": this.id + "Content", "role": "region", "class":"sectionTable", "aria-labelledby": this.titleNode.id}, parent, "last"); //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		if(options.content){
			this.setContent(options.content);
		}
		
		this.hidden = options.hidden;
		if (typeof(options.onExpandCollapse) === "function") { //$NON-NLS-0$
			this._onExpandCollapse = options.onExpandCollapse;
		}
		this._preferenceService = options.preferenceService;
		// initially style as hidden until we determine what needs to happen
		dojo.style(this._contentParent, "display", "none"); //$NON-NLS-1$ //$NON-NLS-0$
		// should we consult a preference?
		if (this._preferenceService) {
			this._preferenceService.getPreferences("/window/views").then(dojo.hitch(this, function(prefs) {  //$NON-NLS-0$
				var isExpanded = prefs.get(this.id);
				
				if (isExpanded === undefined){
				} else {
					this.hidden = !isExpanded;
				}

				if (!this.hidden) {
					dojo.style(this._contentParent, "display", "block"); //$NON-NLS-1$ //$NON-NLS-0$
				}
				
				this._updateExpandedState(!this.hidden, false);
			}));
		} else {
			if (!this.hidden) {
				dojo.style(this._contentParent, "display", "block"); //$NON-NLS-1$ //$NON-NLS-0$
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

		/**
		 * @returns The dom node that holds the section contents.
		 */
		getContentElement: function() {
			return this._contentParent;
		},

		createProgressMonitor: function(){
			return new ProgressMonitor(this);
		},
		
		_setMonitorMessage: function(monitorId, message){
			this._progressNode.style.visibility = "visible"; //$NON-NLS-0$
			this._loading[monitorId] = message;
			var progressTitle = "";
			for(var loadingId in this._loading){
				if(progressTitle!==""){
					progressTitle+="\n"; //$NON-NLS-0$
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
					progressTitle+="\n"; //$NON-NLS-0$
				}
				progressTitle+=this._loading[loadingId];
			}
			this._progressNode.title = progressTitle;
			if(progressTitle===""){
				this._progressNode.style.visibility = "hidden"; //$NON-NLS-0$
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
				this._preferenceService.getPreferences("/window/views").then(function(prefs){ //$NON-NLS-0$
					prefs.put(id, isExpanded);
				}); 
			}
			
			// notify the client
			if (this._onExpandCollapse) {
				this._onExpandCollapse(isExpanded, this);
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
