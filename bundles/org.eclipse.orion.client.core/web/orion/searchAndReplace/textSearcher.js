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
define(['dojo', 'orion/commands'], function(dojo, mCommands) {

var orion = orion || {};

orion.TextSearcher = (function() {
	function TextSearcher(cmdservice, textSearchResponser, options){
		this._commandService = cmdservice;
		this._textSearchResponser = textSearchResponser;
		this._searchRange =  null;
		this._searchOnRange = false;
		this._ignoreCase = false;
		this._reverse = false;
		this._useRegExp = false;
		this._circularSearch = true;
		this._toolBarId = "optionalPageActions";
		this.setOptions(options);
	}	
	TextSearcher.prototype = {
		_createActionTable:function(){
				var parentDiv = document.getElementById(this._toolBarId);
				var table = document.createElement('table');
				//table.width = "100%";
				parentDiv.appendChild(table);
				
				var row = document.createElement('tr');
				table.appendChild(row);
				row.align = "right";
				table.align = "right";
			
				//create the command span for Find
				var td = document.createElement('td');
				td.id = "localSearchFindCommands"; 
				row.appendChild(td);
				//td.noWrap = true;
				
				//create search text area 
				var searchStrTd = document.createElement('td');
				row.appendChild(searchStrTd);
				var searchStringDiv = document.createElement('input');
				searchStringDiv.type = "text";
				searchStringDiv.name = "Find:";
				searchStringDiv.id = "localSearchFindWith";
				searchStrTd.appendChild(searchStringDiv);
				
				//create the command span for Replace
				td = document.createElement('td');
				td.id = "localSearchReplaceCommands"; 
				row.appendChild(td);
				
				//create replace text 
				var replaceStrTd = document.createElement('td');
				row.appendChild(replaceStrTd);
				var replaceStringDiv = document.createElement('input');
				replaceStringDiv.type = "text";
				replaceStringDiv.name = "ReplaceWith:";
				replaceStringDiv.id = "localSearchReplaceWith";
				replaceStrTd.appendChild(replaceStringDiv);
				
				//create all other span for commands :  replace/find , replace all 
				td = document.createElement('td');
				td.id = "localSearchOtherCommands"; 
				row.appendChild(td);
				
				//create directions : forward , backward (radion button)
				var dirTd = document.createElement('td');
				//td.noWrap = true;
				row.appendChild(dirTd);
				
				//create Scope : All , selected lines (radion button)
				var scopeTd = document.createElement('td');
				//td.noWrap = true;
				row.appendChild(scopeTd);
				
				//create Options button , which will bring a dialog
				var optionTd = document.createElement('td');
				//td.noWrap = true;
				row.appendChild(optionTd);
				
				//create close command span
				var closeTd = document.createElement('td');
				closeTd.id = "localSearchCloseCommands"; 
				row.appendChild(closeTd);
				return table;
		},
		
		_closeUI: function(){
			dojo.empty(this._toolBarId);
			this._refreshTopContainer();
			this._toolBarExist = false;
		},
		
		_refreshTopContainer: function(){
			//There is refresh issue when we add some thing inside the dijit.layout.BorderContainer
			//We need to work this around by doing the layout() call.
			var topContainer = dijit.byId("topContainer");
			if(topContainer && topContainer.layout)
				topContainer.layout();
		},
		
		buildToolBar:function(defaultSearchStr){
			if(this._toolBarExist){
				this._closeUI();
				return;
			}
			this._toolBarExist = true;
			this._createActionTable();
			this._refreshTopContainer();
			
			//set the default value of search string
			document.getElementById("localSearchFindWith").value = defaultSearchStr;
			
			var self = this;
			var findCommand = new mCommands.Command({
				name : "Find",
				//image : "/images/move_down.gif",
				id: "orion.search.find",
				groupId: "orion.searchGroup",
				callback : function() {
					self.findNext();
			}});
			
			var replaceCommand = new mCommands.Command({
				name : "Replace with",
				//image : "/images/move_down.gif",
				id: "orion.search.replace",
				groupId: "orion.searchGroup",
				callback : function() {
					self.replace();
			}});
			
			var replaceAndFindCommand = new mCommands.Command({
				name : "Replace/Find",
				//image : "/images/move_down.gif",
				id: "orion.search.replaceAndFind",
				groupId: "orion.searchGroup",
				callback : function() {
					self.replace(true);
			}});
			
			var closeUICommand = new mCommands.Command({
				name : "Close",
				image : "/images/delete.gif",
				id: "orion.search.closeUI",
				groupId: "orion.searchGroup",
				callback : function() {
					self._closeUI();
			}});
			
			this._commandService.addCommand(findCommand, "dom");
			this._commandService.addCommand(replaceCommand, "dom");
			this._commandService.addCommand(replaceAndFindCommand, "dom");
			this._commandService.addCommand(closeUICommand, "dom");
				
			// Register command contributions
			this._commandService.registerCommandContribution("orion.search.find", 1, "localSearchFindCommands");
			this._commandService.registerCommandContribution("orion.search.replace", 1, "localSearchReplaceCommands");
			this._commandService.registerCommandContribution("orion.search.replaceAndFind", 1, "localSearchOtherCommands");
			this._commandService.registerCommandContribution("orion.search.closeUI", 1, "localSearchCloseCommands");
			this._commandService.renderCommands("localSearchFindCommands", "dom", self, self,"image",null,null,true);
			this._commandService.renderCommands("localSearchReplaceCommands", "dom", self, self,"image",null,null,true);
			this._commandService.renderCommands("localSearchOtherCommands", "dom", self, self,"image",null,null,true);
			this._commandService.renderCommands("localSearchCloseCommands", "dom", self, self,"image");
		},
		
		/**
		 * Helper for finding occurrences of str in the editor contents.
		 * @param {String} str
		 * @param {Number} startIndex
		 * @param {Boolean} [ignoreCase] Default is false.
		 * @param {Boolean} [reverse] Default is false.
		 * @return {Object} An object giving the match details, or <code>null</code> if no match found. The returned 
		 * object will have the properties:<br />
		 * {Number} index<br />
		 * {Number} length 
		 */
		_findString: function(searchStr, startIndex ) {
			var text;
			if(this._searchOnRange && this._searchRange){
				text = this._textSearchResponser.getText().substring(this._searchRange.start, this._searchRange.end);
				startIndex = startIndex - this._searchRange.start;
			} else {
				text = this._textSearchResponser.getText();
			}
			if(this._ignoreCase) {
				searchStr = searchStr.toLowerCase();
				text = text.toLowerCase();
			}
			var i;
			if(this._reverse) {
				text = text.split("").reverse().join("");
				searchStr = searchStr.split("").reverse().join("");
				startIndex = text.length - startIndex - 1;
				i = text.indexOf(searchStr, startIndex);
				if(i === -1){
					if(this._circularSearch && startIndex < (text.length - 1))
						return this._findString(searchStr, text.length - 1);
				} else {
					return {index: text.length - searchStr.length - i, length: searchStr.length};
				}
				
			} else {
				i = text.indexOf(searchStr, startIndex);
				if(i === -1){
					if(this._circularSearch && startIndex > 0)
						return this._findString(searchStr, 0);
				} else {
					return {index: i, length: searchStr.length};
				}
			}
			return null;
		},
		
		getResponser: function(){
			return this._textSearchResponser;
		},
		
		setOptions: function(options){
			if(options){
				if(options.searchRange){
					this._searchRange = options.searchRange;
				}
				if(options.toolBarId){
					this._toolBarId = options.toolBarId;
				}
				if(options.searchOnRange === true || options.searchOnRange === false){
					this._searchOnRange = options.searchOnRange;
				}
				if(options.ignoreCase === true || options.ignoreCase === false){
					this._ignoreCase = options.ignoreCase;
				}
				if(options.reverse === true || options.reverse === false){
					this._reverse = options.reverse;
				}
				if(options.useRegExp === true || options.useRegExp === false){
					this._useRegExp = options.useRegExp;
				}
			}
		},
		
		findNext: function() {
			this.doFind(document.getElementById("localSearchFindWith").value);
		},
		
		replace: function(findNext) {
			this._textSearchResponser.responseReplace(document.getElementById("localSearchReplaceWith").value);
			
			if(findNext && document.getElementById("localSearchFindWith").value.length > 0)
				this.doFind(document.getElementById("localSearchFindWith").value);
		},
		
		doFind: function(searchStr) {
			var startIndex = this._textSearchResponser.getSearchStartIndex(this._reverse);
			this._lastSearchStr = searchStr;
			if (this._useRegExp) {
				var regexp = this.parseRegExp(searchStr);
				if(regexp){
					var pattern = regexp.pattern;
					var flags = regexp.flags;
					flags = flags + (this._ignoreCase && flags.indexOf("i") === -1 ? "i" : "");
					result = this._findRegExpg(pattern, flags, startIndex);
				}
			} else {
				result = this._findString(searchStr, startIndex);
			}
			
			if (result) {
				this._textSearchResponser.responseFind(result.index, result.index+result.length , this._reverse);
			} else {
				this._textSearchResponser.responseFind(-1,-1);
			}
		},
		
			
		/**
		 * Helper for finding regex matches in the editor contents. Use {@link #doFind} for simple string searches.
		 * @param {String} pattern A valid regexp pattern.
		 * @param {String} flags Valid regexp flags: [is]
		 * @param {Number} [startIndex] Default is false.
		 * @param {Boolean} [reverse] Default is false.
		 * @return {Object} An object giving the match details, or <code>null</code> if no match found. The returned object
		 * will have the properties:<br />
		 * {Number} index<br />
		 * {Number} length 
		 */
		_findRegExp: function(pattern, flags, startIndex) {
			if (!pattern) {
				return null;
			}
			
			flags = flags || "";
			// 'g' makes exec() iterate all matches, 'm' makes ^$ work linewise
			flags += (flags.indexOf("g") === -1 ? "g" : "") + (flags.indexOf("m") === -1 ? "m" : "");
			var regexp = new RegExp(pattern, flags);
			var text = this._textSearchResponser.getText();
			var result = null,
			    match = null;
			if (this._reverse) {
				while (true) {
					result = regexp.exec(text);
					if (result && result.index <= startIndex) {
						match = {index: result.index, length: result[0].length};
					} else {
						return match;
					}
				}
			} else {
				result = regexp.exec(text.substring(startIndex));
				return result && {index: result.index + startIndex, length: result[0].length};
			}
		},
		
		/**
		 * @private
		 * @static
		 * @param {String} Input string
		 * @returns {pattern:String, flags:String} if str looks like a RegExp, or null otherwise
		 */
		parseRegExp: function(str) {
			var regexp = /^\s*\/(.+)\/([gim]{0,3})\s*$/.exec(str);
			if (regexp) {
				return {pattern: regexp[1], flags: regexp[2]};
			}
			return null;
		}

	};
	return TextSearcher;
}());

return orion;
});
