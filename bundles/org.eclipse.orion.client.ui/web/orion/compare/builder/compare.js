/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 (http://www.eclipse.org/legal/epl-v10.html),
 * and the Eclipse Distribution License v1.0
 * (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define document console prompt window*/

define(['orion/commandRegistry',
		'orion/commands',
		'orion/Deferred',
		'orion/compare/compareView',
		"orion/editor/textMateStyler",
		"orion/editor/htmlGrammar",
		"examples/editor/textStyler"],
function(mCommandRegistry, mCommands, Deferred, mCompareView, mTextMateStyler, mHtmlGrammar, mTextStyler) {
	var commandService = new mCommandRegistry.CommandRegistry({
	});

	function _fileExt(fName){
		var splitName = fName.split("."); //$NON-NLS-0$
		var ext = "js"; //$NON-NLS-0$
		if(splitName.length > 1){
			ext = splitName[splitName.length - 1];
		}
		return ext;
	}
	
	function _contentType(fName){
		var ext = _fileExt(fName);
		var cType = {id: "application/javascript"}; //$NON-NLS-0$
		switch (ext) {
			case "java": //$NON-NLS-0$
				cType.id = "text/x-java-source"; //$NON-NLS-0$
				break;
			case "css": //$NON-NLS-0$
				cType.id = "text/css"; //$NON-NLS-0$
				break;
		}
		return cType;
	}
	
	/*
	 * Default syntax highlighter for js, java, and css. Grammar-based highlighter for html.
	*/
	function DefaultHighlighter() {
		this.styler = null;
	}
	DefaultHighlighter.prototype = {
		highlight: function(fileName, contentType, editor) {
			if (this.styler) {
				this.styler.destroy();
				this.styler = null;
			}
			var lang = _fileExt(fileName);
			if (lang){
				var textView = editor.getTextView();
				var annotationModel = editor.getAnnotationModel();
				switch(lang) {
					case "js": //$NON-NLS-0$
					case "java": //$NON-NLS-0$
					case "css": //$NON-NLS-0$
						this.styler = new mTextStyler.TextStyler(textView, lang, annotationModel);
						break;
					case "html": //$NON-NLS-0$
						this.styler = new mTextMateStyler.TextMateStyler(textView, new mHtmlGrammar.HtmlGrammar());
						break;
				}
				return new Deferred().resolve(editor);
			}
			return null;
		}
	};
    function compare(parentDivId, commandDivId, nameOnLeft, contentOnLeft, nameOnRight, contentOnRight, viewOptions){
		if(!nameOnLeft){
			nameOnLeft = "left.js"; //$NON-NLS-0$
		}
		if(!contentOnLeft){
			contentOnLeft = "Sample Orion compare contents on left side\nvar left = 1\n"; //$NON-NLS-0$
		}
		if(!nameOnRight){
			nameOnRight = "right.js"; //$NON-NLS-0$
		}
		if(!contentOnRight){
			contentOnRight = "Sample Orion compare contents on right side\nvar right = 2\n"; //$NON-NLS-0$
		}
        var options = {
            hasConflicts: true,
            commandSpanId: commandDivId,
            highlighters: (viewOptions && viewOptions.highlighters) ? viewOptions.highlighters : [new DefaultHighlighter(), new DefaultHighlighter()],
            newFile: {
                Name: nameOnLeft,
                readonly: false,
                Type: _contentType(nameOnLeft),
                Content: contentOnLeft
            },
            baseFile: {
                Name: nameOnRight,
                readonly: false,
                Type: _contentType(nameOnRight),
                Content: contentOnRight
            }
        };
		var compareView = new mCompareView.toggleableCompareView(commandService, parentDivId, "twoWay", options); //$NON-NLS-0$
		compareView.getWidget().setOptions({readonly: false, hasConflicts: false});
		compareView.startup();
    }
    return compare;
});
