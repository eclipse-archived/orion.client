/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define(['embeddedEditor/builder/embeddedEditor',
		'orion/Deferred'
],
function(mEmbeddedEditor,
Deferred) {
	var defaultPluginURLs = [
		"../../javascript/plugins/javascriptPlugin_embed_dev.html",
		"../../webtools/plugins/webToolsPlugin_embed_dev.html",
		"../../plugins/embeddedToolingPlugin.html"
	];
	var contents = 'var foo = "bar";\n' +
						 "var bar = foo;\n" + 
						 "/*\n" + 
						 " * test demo\n" + 
						 "*/\n" + 
						 "function test(){\n" + 
						 "	var foo1 = bar.lastIndexOf(char, from);\n" + 
						 "}\n" + 
						"//Keep editting in this demo and try the content assit, probem validations and hover service!\n" +
						 "var foo2 = foo."; 
	var contents1 = 
						 '<div class="embeddedEditorParentOuter" id="embeddedEditor1">\n' + 
						 "</div>\n" + 
						 "<span>var foo2</span>"; 
						 
	var contents2 = '<server description="new server">\n' +
					 '</server>';
	var embeddedEditor = new mEmbeddedEditor({
		_defaultPlugins: defaultPluginURLs,
		//defaultPlugins: [],
		toolbarId: "__toolbar__"/*,
		userPlugins:["editorCommandsPlugin.html"]*/});
	var cto = {
		id: "foo/bar",
		extension: ["bar"],
		name: 'Xtext Language',
		'extends': 'text/plain'
	};
	embeddedEditor.serviceRegistry.registerService('orion.core.contenttype', {}, {contentTypes: [cto]});
	var proposals = [
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal "
	];
	var contentAssistProvider = {
	    computeProposals: function(buffer, offset, context) {
	        var result = [];
	        for(var i = 0; i < 10; i++){
	            result.push({proposal: "proposal " + i});
	        }
	        return result;
	    }
	};
	//	var contentAssistProvider = {
	//		computeProposals: function(buffer, offset, context) {
	//			var result = [];
	//			for(var i = 0; i < proposals.length; i++){
	//				result.push({proposal: "<" + proposals[i] + i + ">", 
	//							 hover: {content: "foooo", type: "markdown"},
	//							 });
	//			}
	//			return result;
	//		}
	//	};
	var hoverProvider = {
		computeHoverInfo: function (editorContext, context) {
			if(context.proposal && context.proposal.hover) {
				return context.proposal.hover;
			}
			var pContent = "*This text will be italic*\n\n **This text will be bold**\n\n";
			if(typeof context.offset === "number") {
				return context.offset > 12 ? {
					title: "This is the title",
					content: pContent,
					type: "html"} : null;
			} else if(typeof context.proposal === "string") {
				var index = parseInt(context.proposal.substring("proposal ".length - 1), 10);
				return index > 3 ? {
					title: "This is the title",
					content: pContent,
					type: "markdown"} : {};
			}
			return null;
		}
	};
	function computeOccurrences(orionContext, context) {
		var oc = [];
		if(typeof context.selection) {
			oc = context.selection.start > 5 ? [{start: context.selection.start + 5, end: context.selection.start + 9}] : [];
		} 
		return new Deferred().resolve(oc);
	}
	embeddedEditor.create({parent: "embeddedEditor"}).then(function(editorViewer) {
		document.getElementById("progressMessageDiv").textContent = "Plugins loaded!";
		editorViewer.setContents(contents, "application/javascript");
		editorViewer.inputManager.setAutoSaveTimeout(-1);
		//editorViewer.editor.getTextView().setOptions({themeClass: "editorTheme"});
		function execute(orionContext, params) {
			//alert("foo");
			//editorViewer.editor.getTextView()._setThemeClass("editorTheme");
			editorViewer.editor.getTextView().setOptions({themeClass: "editorTheme"});
		}
		editorViewer.serviceRegistry.registerService('orion.edit.command', {execute: execute}, {
			name: 'Xtext formatting service',
			id: 'xtext.formatter',
			key: ['l', true, true],
			contentType: ["application/javascript"]
		});		
		var markerService = editorViewer.serviceRegistry.getService(editorViewer.problemsServiceID);
		if(markerService) {
			markerService.addEventListener("problemsChanged", function(evt) { //$NON-NLS-0$
				if(evt.problems) {
					evt.problems.forEach(function(problem) {
						console.log(problem);
					})
				}
			});
		}
	});
	embeddedEditor.create({parent: "embeddedEditor1"}).then(function(editorViewer) {
		editorViewer.setContents(contents, "application/javascript");
		editorViewer.inputManager.setAutoSaveTimeout(-1);
		//editorViewer.editor.getTextView().setOptions({themeClass: "editorTheme"});
		function execute(orionContext, params) {
			//alert("foo");
			//editorViewer.editor.getTextView()._setThemeClass("editorTheme");
			editorViewer.editor.getTextView().setOptions({themeClass: "editorTheme"});
		}
		editorViewer.serviceRegistry.registerService('orion.edit.command', {execute: execute}, {
			name: 'Xtext formatting service',
			id: 'xtext.formatter',
			key: ['l', true, true],
			contentType: ["application/javascript"]
		});		
		var markerService = editorViewer.serviceRegistry.getService(editorViewer.problemsServiceID);
		if(markerService) {
			markerService.addEventListener("problemsChanged", function(evt) { //$NON-NLS-0$
				if(evt.problems) {
					evt.problems.forEach(function(problem) {
						console.log(problem);
					});
				}
			});
		}
	});
	
	embeddedEditor.create({parent: "embeddedEditor1",
						   contentType: "foo/bar",
						   contents: contents2}).then(function(editorViewer){
		editorViewer.inputManager.setAutoSaveTimeout(-1);
		editorViewer.editor.addEventListener("InputChanged", function(evt) {
			if(evt.contentsSaved) {
				console.log(evt.contents);
			}
		});
		if (editorViewer.settings) {
			editorViewer.settings.contentAssistAutoTrigger = true;
			editorViewer.settings.showOccurrences = true;
		}
		var fontSizeCounter = 9;
		var themeClass = "myTheme";
		var settings = {
			"className": "myTheme",
			"name": "myTheme",
			"styles": {
				"fontSize": "9px"
			}
		};
		function changeFontDynamically() {
			var theme = editorViewer.editor.getTextView().getOptions("theme");
			settings["styles"]["fontSize"] = fontSizeCounter + "px";
			theme.setThemeClass(themeClass, theme.buildStyleSheet(themeClass, settings));
			fontSizeCounter++;
		}
				editorViewer.serviceRegistry.registerService('orion.edit.command', {execute: changeFontDynamically}, {
					name: 'Change font size',
					id: 'Change font size service',
					key: ['l', true, true],
					contentType: ["foo/bar"]
				});		
		editorViewer.serviceRegistry.registerService("orion.edit.contentassist",
				contentAssistProvider,
				{	name: "xmlContentAssist",
					contentType: ["foo/bar"],
					charTriggers: "[.(]"
				});
		editorViewer.serviceRegistry.registerService("orion.edit.hover",
			hoverProvider,
    		{	name: "xmlContentHover",
    			contentType: ["foo/bar"]
    		});
		editorViewer.serviceRegistry.registerService('orion.edit.occurrences',
			{computeOccurrences: computeOccurrences}, {contentType: ["foo/bar"]});	
	});
});
