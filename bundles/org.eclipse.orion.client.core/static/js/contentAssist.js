/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window widgets eclipse:true serviceRegistry dojo dijit */
/*jslint maxerr:150 browser:true devel:true regexp:false*/


/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

eclipse.ContentAssist = (function() {
	function ContentAssist(editor, contentAssistId) {
		this.editor = editor;
		this.editorWidget = editor.getEditorWidget();
		this.contentAssistPanel = dojo.byId(contentAssistId);
		this.active = false;
		this.prefix = "";
		this.keywords= [];
		this.cssKeywords = ["color", "text-align", "text-indent", "text-decoration", 
		 "font", "font-style", "font-family", "font-weight", "font-size", "font-variant", "line-height",
		 "background", "background-color", "background-image", "background-position", "background-repeat", "background-attachment",
		 "list-style", "list-style-image", "list-style-position", "list-style-type", 
		 "outline", "outline-color", "outline-style", "outline-width",
		 "border", "border-left", "border-top", "border-bottom", "border-right", "border-color", "border-width", "border-style",
		 "border-bottom-color", "border-bottom-style", "border-bottom-width",
		 "border-left-color", "border-left-style", "border-left-width",
		 "border-top-color", "border-top-style", "border-top-width",
		 "border-right-color", "border-right-style", "border-right-width",
		 "padding", "padding-left", "padding-top", "padding-bottom", "padding-right",
		 "margin", "margin-left", "margin-top", "margin-bottom", "margin-right",
		 "width", "height", "left", "top", "right", "bottom",
		 "min-width", "max-width", "min-height", "max-height",
		 "display", "visibility",
		 "clip", "cursor", "overflow", "overflow-x", "overflow-y", "position", "z-index",
		 "vertical-align", "horizontal-align",
		 "float", "clear"
		];
		this.contentAssistListener = {
			onVerify: function(event){
				this.showContentAssist(false);
			},
			onSelectionChanged: function() {
				this.showContentAssist(false);
			}
		};
		this.init();
	}
	ContentAssist.prototype = {
		init: function() {
			var isMac = navigator.platform.indexOf("Mac") !== -1;
			this.editorWidget.setKeyBinding(isMac ? new eclipse.KeyBinding(' ', false, false, false, true) : new eclipse.KeyBinding(' ', true), "content assist");
			this.editorWidget.setAction("content assist", dojo.hitch(this, function() {
				this.showContentAssist(true);
				return true;
			}));
			dojo.connect(this.editor, "onInputChange", this, this.inputChanged);
		},
	
	inputChanged: function(fileName) {
		if (fileName) {
			var splits = fileName.split(".");
			if (splits.length > 0) {
				var extension = splits.pop().toLowerCase();
				switch(extension) {
					case "css":
						this.keywords = this.cssKeywords;
						break;
					case "java":
					case "html":
					case "xml":
					case "js":
						this.keywords = [];
						break;
				}
			}
		}			
	},
	
	cancel: function() {
		this.showContentAssist(false);
	},
	isActive: function() {
		return this.active;
	},
	lineUp: function() {
		if (this.contentAssistPanel) {
			var nodes = dojo.query('> div', this.contentAssistPanel);
			var index = 0;
			for (var i=0; i<nodes.length; i++) {
				if (nodes[i].className === "selected") {
					nodes[i].className = "";
					index = i;
					break;
				}
			}
			if (index > 0) {
				nodes[index-1].className = "selected";
			} else {
				nodes[nodes.length - 1].className = "selected";
			}
			return true;
		}
	},
	lineDown: function() {
		if (this.contentAssistPanel) {
			var nodes = dojo.query('> div', this.contentAssistPanel);
			var index = 0;
			for (var i=0; i<nodes.length; i++) {
				if (nodes[i].className === "selected") {
					nodes[i].className = "";
					index = i;
					break;
				}
			}
			if (index < nodes.length - 1) {
				nodes[index+1].className = "selected";
			} else {
				nodes[0].className = "selected";
			}
			return true;
		}
	},
	enter: function() {
		if (this.contentAssistPanel) {
			var proposal = dojo.query("> .selected", this.contentAssistPanel);
			this.editorWidget.setText(proposal[0].innerHTML.substring(this.prefix.length), this.editorWidget.getCaretOffset(), this.editorWidget.getCaretOffset());
			this.showContentAssist(false);
			return true;
		}
	},
	showContentAssist: function(enable) {
		if (!this.contentAssistPanel) {
			return;
		}
		function createDiv(proposal, isSelected, parent) {
			var attributes = {innerHTML: proposal, onclick: function(){alert(proposal);}};
			if (isSelected) {
				attributes.className = "selected";
			}
			dojo.create("div", attributes, parent, this);
		}
		if (!enable) {
			this.editorWidget.removeEventListener("Verify", this, this.contentAssistListener.onVerify);
			this.editorWidget.removeEventListener("Selection", this, this.contentAssistListener.onSelectionChanged);
			this.active = false;
			this.contentAssistPanel.style.display = "none";
		} else {
			var offset = this.editorWidget.getCaretOffset();
			var index = offset;
			var c;
			while (index > 0 && ((97 <= (c = this.editorWidget.getText(index - 1, index).charCodeAt(0)) && c <= 122) || (65 <= c && c <= 90) || c === 95 || (48 <= c && c <= 57))) { //LETTER OR UNDERSCORE OR NUMBER
				index--;
			}
			if (index === offset) {
				return;
			}
			this.prefix = this.editorWidget.getText(index, offset);
			
			var proposals = [];
			for (var i = this.keywords.length - 1; i>=0; i--) {
				var proposal = this.keywords[i];
				if (proposal.substr(0, this.prefix.length) === this.prefix) {
					proposals.push(proposal);
				}
			}
			if (proposals.length === 0) {
				return;
			}
			
			var caretLocation = this.editorWidget.getLocationAtOffset(offset);
			caretLocation.y += this.editorWidget.getLineHeight();
			this.contentAssistPanel.innerHTML = "";
			for (i = 0; i<proposals.length; i++) {
				createDiv(proposals[i], i===0, this.contentAssistPanel);
			}
			this.editorWidget.convert(caretLocation, "document", "page");
			this.contentAssistPanel.style.left = caretLocation.x + "px";
			this.contentAssistPanel.style.top = caretLocation.y + "px";
			this.contentAssistPanel.style.display = "block";
			this.editorWidget.addEventListener("Verify", this, this.contentAssistListener.onVerify);
			this.editorWidget.addEventListener("Selection", this, this.contentAssistListener.onSelectionChanged);
			this.active = true;
		}
	}
};
return ContentAssist;
}());
