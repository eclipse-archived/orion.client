/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define window URL*/

define(['orion/compare/diffParser',"orion/Deferred", "orion/xhr", "orion/URL-shim"], function(mDiffParser, Deferred, xhr){
	function GitDiffAnnotation(serviceRegistry, editor) {
		this.serviceRegistry = serviceRegistry;
		this.editor = editor;
		this.diffParser = new mDiffParser.DiffParser();
	}

	GitDiffAnnotation.prototype = {
		/**
		 * Display the git diff annotations onto the editor.
		 */
		showAnnotations: function(inputManager) {
			var self = this;		
			var diffURI = "/gitapi/diff/Default/" + inputManager.getInput(); //$NON-NLS-0$
			self.getDiffContent(diffURI).then(function(diffContent) {
				self.diffParser.setLineDelim("\n");
				self.diffParser.parse("", diffContent);
				var oBlocks = self.diffParser.getOriginalBlocks();
				var nBlocks = self.diffParser.getNewBlocks();
				var diffRanges = self.getDiffRanges(oBlocks, nBlocks);
				self.editor.showDiffAnnotations(diffRanges);
			});
		},
		
		/**
		 * Returns an object { additions, modifications, deletions } with each property containing an array
		 * of objects { start, end } detailing the start and end line index for the specified property.
		 */
		getDiffRanges: function(originalHunkBlocks, newHunkBlocks) {
			var additions = [];
			var modifications = [];
			var deletions = [];

			for (var i = 0; i < newHunkBlocks.length; i++) {
				var lineStart = newHunkBlocks[i][0];
				var oldSize = originalHunkBlocks[i][1];
				var newSize = newHunkBlocks[i][1];

				if (newSize === 0) {
					deletions.push(lineStart - 1);
				} else if (oldSize === 0) {
					additions.push({ start: lineStart - 1, end: lineStart + newSize - 1 });
				} else {
					modifications.push({ start: lineStart - 1, end: lineStart + newSize - 1 });
				}
			}
			return { additions: additions, modifications: modifications, deletions: deletions };
		},
		
		getDiffContent: function(diffURI) {
            var url = new URL(diffURI, window.location);
            url.query.set("parts", "diff");
            return xhr("GET", url.href, {
                headers: {
				    "Orion-Version": "1"
                },
                timeout: 15000
            }).then(function(xhrResult) {
                return xhrResult.responseText;
            });
        }
	};

	return { GitDiffAnnotation: GitDiffAnnotation };
});
