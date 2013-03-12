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
 
/*globals define XMLHttpRequest window */

define(['orion/compare/builder/compare'],   
 
function(Compare) {
	var document = window.document;

	/** Buttons */	
	var bCompare = document.getElementById("doCompare"); //$NON-NLS-0$
	var bCompareType = document.getElementById("compareTypeSelect"); //$NON-NLS-0$
	
	var compareType = "byTwoContents"; //$NON-NLS-0$
	var contentOnLeft = "Sample Orion compare contents on left side\n\nYou can replace the contents here and and click on [Refresh Compare] to see the new result\n"; //$NON-NLS-0$
	var	contentOnRight = "Sample Orion compare contents on right side\n\nYou can replace the contents here and and click on [Refresh Compare] to see the new result\n"; //$NON-NLS-0$
	var contentOnLeftURL = "Put file URL here\n"; //$NON-NLS-0$
	var	contentOnRightURL = "Put file URL here\n"; //$NON-NLS-0$
	
    var options = {
        parentDivId: "compareParentDiv", //$NON-NLS-0$
        commandSpanId: "compareCmdDiv", //$NON-NLS-0$
        newFile: {
            Name: "left.js", //$NON-NLS-0$
            readonly: false,
            Content: contentOnLeft
        },
        baseFile: {
            Name: "right.js", //$NON-NLS-0$
            readonly: false,
            Content: contentOnRight
        }
    };
	
	var compare = new Compare(options);

	function doCompare() {
		var widget = compare.getCompareView().getWidget();
		if(widget.type === "twoWay"){ //$NON-NLS-0$
			var editors = widget._editors;
			var oldContents = editors[0].getTextView().getText();
			var newContents = editors[1].getTextView().getText();
			if(compareType === "byTwoContents"){ //$NON-NLS-0$
				widget.options.baseFile.Content = oldContents;
				widget.options.newFile.Content = newContents;
				widget.options.baseFile.URL = null;
				widget.options.newFile.URL = null;
			} else {
				widget.options.baseFile.URL = oldContents;
				widget.options.newFile.URL = newContents;
			}
			widget.options.mapper = null;
			compare.refresh();
			//widget.refresh();
		}
	}
	function onCType(evt) {
		compareType = bCompareType.options[bCompareType.selectedIndex].value;
		var widget = compare.getCompareView().getWidget();
		if(compareType === "byTwoContents"){ //$NON-NLS-0$
			widget.options.baseFile.Content = contentOnRight;
			widget.options.newFile.Content = contentOnLeft;
			widget.options.baseFile.URL = null;
			widget.options.newFile.URL = null;
		} else {
			widget.options.baseFile.Content = contentOnRightURL;
			widget.options.newFile.Content = contentOnLeftURL;
			widget.options.baseFile.URL = null;
			widget.options.newFile.URL = null;
		}
		widget.refresh();
	}
	
	/* Adding events */
	bCompare.onclick = doCompare;
	bCompareType.onchange = onCType;
 });
