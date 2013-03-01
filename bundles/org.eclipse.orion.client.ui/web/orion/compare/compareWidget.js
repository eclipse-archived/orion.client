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

define(['orion/serviceregistry', 'orion/status', 'orion/progress', 'orion/operationsClient', 'orion/commands', 'orion/fileClient',
		'orion/compare/compare-features', 'orion/compare/compare-container', 'orion/compare/compareUtils', 'orion/contentTypes', "orion/editor/textMateStyler",
	"orion/editor/htmlGrammar", //$NON-NLS-0$
	"examples/editor/textStyler" //$NON-NLS-0$
],
function(mServiceregistry, mStatus, mProgress, mOperationsClient, mCommands, mFileClient, mCompareFeatures, mCompareContainer, mCompareUtils, mContentTypes, mTextMateStyler, mHtmlGrammar, mTextStyler) {
		var serviceRegistry = window.serviceRegistry = new mServiceregistry.ServiceRegistry();
		var commandService = new mCommands.CommandService({
			serviceRegistry: serviceRegistry
		});
		// File operations
		//var fileClient = new mFileClient.FileClient(serviceRegistry);
		var contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);

		// Canned highlighter function for js, java, and css. Grammar-based highlighter for html
		function SyntaxHighlighter() {
			this.styler = null;
		}
		SyntaxHighlighter.prototype = /** @lends orion.highlight.SyntaxHighlighter.prototype */ {
			highlight: function(fileName, contentType, editor, compareWidget, loadingNumber) {
				if (this.styler) {
					this.styler.destroy();
					this.styler = null;
				}
				var splitName = fileName.split("."); //$NON-NLS-0$
				var lang = "js"; //$NON-NLS-0$
				if(splitName.length > 1){
					lang = splitName[splitName.length - 1];
				}
				if (lang) {
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
					if(compareWidget && loadingNumber){
						editor.setAnnotationRulerVisible(false);
						compareWidget._highlighterLoaded++;
						if(compareWidget._highlighterLoaded === loadingNumber){
							compareWidget._diffNavigator.renderAnnotations();
							compareWidget._diffNavigator.gotoBlock(compareWidget.options.blockNumber-1, compareWidget.options.changeNumber-1);
						}
					}
				}
			}
		};
		
        function compareView(parentDivId, commandDivId, nameOnLeft, contentOnLeft, nameOnRight, contentOnRight){
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
	            readonly: true,
	            hasConflicts: false,
	            commandSpanId: commandDivId,
	            highlighter: SyntaxHighlighter,
	            newFile: {
	                Name: nameOnLeft, //$NON-NLS-0$
	                Type: "js", //$NON-NLS-0$
	                Content: contentOnLeft
	            },
	            baseFile: {
	                Name: nameOnRight, //$NON-NLS-0$
	                Type: "js", //$NON-NLS-0$
	                Content: contentOnRight
	            }
	        };
			var compareContainer = new mCompareContainer.toggleableCompareContainer(serviceRegistry, parentDivId, "twoWay", options); //$NON-NLS-0$
			compareContainer.startup();
        }
        return compareView;
	}
);
