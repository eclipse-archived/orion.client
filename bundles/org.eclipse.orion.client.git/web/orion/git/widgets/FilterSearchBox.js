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
 define(['i18n!git/nls/gitmessages', 'dojo', 'dijit', 'dojo/store/Memory', 'dojo/data/ObjectStore', 'dijit/form/ComboBox'],
 	function(messages, dojo, dijit, Memory, ObjectStore, ComboBox){
 
	/**
	 * Filtering search box widget
	 * @param options.items [required] loaded items to be filtered
	 * @param options.renderItem [required] function(item) which renders the item
	 * @param options.sectionId [required] section id in which the filter search box is rendered
	 * @param options.itemNode [required] node in which filtered items are rendered
	 * @param options.filterAttr [optional] unique property after which items are filtered (default: Name)
	 * @param options.placeHolder [optional] filter search box placeholder (default: externalized Filter items)
	 */
	function FilterSearchBox(options){
		if(!options) { throw new Error("Missing argument: options"); }
		
		this._items = options.items;
		this._renderItem = options.renderItem;
		this._id = options.sectionId + "FilterSearchBox";
		this._itemNode = options.itemNode;
		
		//optional parameters
		if(options.filterAttr) { this._filterAttr = options.filterAttr; }
		else { this._filterAttr = "Name"; }
		
		if(options.placeHolder) { this._placeHolder = options.placeHolder; }
		else { this._placeHolder = messages["Filter items"]; }
	}
	
	FilterSearchBox.prototype = {
		
		/**
		 * Cleans the view by deleting all of the rendered items
		 **/
		_cleanup : function(){
			dojo.empty(this._itemNode);
		},
	
		/**
		 * Renders the search box into the view
		 */
		render : function(){
			if(dijit.byId(this._id)){
				return;
			}
			
			var that = this;
			
			// create a store based on the given items
			var store = new Memory({
				idProperty : this._filterAttr, //$NON-NLS-0$
				data : that._items
			});
				
			var select = new ComboBox({
				name: that._id,
	            placeHolder: that._placeHolder,
	            store: new ObjectStore({objectStore : store}),
	            searchAttr : that._filterAttr, //$NON-NLS-0$
	            highlightMatch : "all", //$NON-NLS-0$
	            queryExpr : "*${0}*", //$NON-NLS-0$
	            autoComplete : false,
	            style : { width : "280px" }
			}, that._id);
				
			dojo.connect(select, "onChange", function(){
				var exp = new RegExp(select.get('displayedValue'), 'i'); //$NON-NLS-0$

				//clean the view
				that._cleanup();
						
				setTimeout(function(){
				//filter items
				store.query(function(item){
					return item[that._filterAttr].match(exp);
				}).forEach(function(item){
					//render matched item
					that._renderItem(item);
				});}, 1);
			});
			
			//update widget
			select.startup();
		}
	};
	
	//add constructor
	FilterSearchBox.prototype.constructor = FilterSearchBox;
	
	return {
		FilterSearchBox : FilterSearchBox
	}; 
 });