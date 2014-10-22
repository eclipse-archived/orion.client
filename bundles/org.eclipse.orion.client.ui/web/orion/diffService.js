/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/

define([
	'orion/extensionCommands', //$NON-NLS-0$
'orion/compare/diffParser', //$NON-NLS-0$
'orion/edit/editorContext' //$NON-NLS-0$
], function(mExtensionCommands, mDiffParser, EditorContext) {

	function diffService(serviceRegistry, inputManager, editor) {
		inputManager.addEventListener("InputChanged", function() {
			var service = getDiffServices(serviceRegistry, inputManager);
			if (service) {
				var occurrenceTimer;
				var changeListener = function(e) {
					if (occurrenceTimer) {
						window.clearTimeout(occurrenceTimer);
					}
					occurrenceTimer = window.setTimeout(function() {
						occurrenceTimer = null;
						inputManager.save().then(function() {
							showAnnotations(serviceRegistry, service, inputManager, editor);
						});
					}, 500);
				};
				editor.getTextView().addEventListener("ModelChanged", changeListener);
			}
		});
	}

	function getDiffServices(serviceRegistry, inputManager) {
		var metadata = inputManager.getFileMetadata();
		var diffServices = serviceRegistry.getServiceReferences("orion.edit.diff"); //$NON-NLS-0$
		for (var i = 0; i < diffServices.length; i++) {
			var serviceReference = diffServices[i];
			var info = {};
			info.validationProperties = serviceReference.getProperty("validationProperties"); //$NON-NLS-0$
			info.forceSingleItem = true;
			var validator = mExtensionCommands._makeValidator(info, serviceRegistry);
			if (validator.validationFunction.bind(validator)(metadata)) {
				return serviceRegistry.getService(serviceReference);
			}
		}
		return null;
	}

	function showAnnotations(serviceRegistry, service, inputManager, editor) {
		var diffParser = new mDiffParser.DiffParser();
		var context = {
			metadata: inputManager.getFileMetadata()
		};
		service.getDiffContent(EditorContext.getEditorContext(serviceRegistry), context)
			.then(function(diffContent) {
			diffParser.setLineDelim("\n");
			diffParser.parse("", diffContent);
			var oBlocks = diffParser.getOriginalBlocks();
			var nBlocks = diffParser.getNewBlocks();
			var diffRanges = getDiffRanges(oBlocks, nBlocks);
			editor.showDiffAnnotations(diffRanges);
		});
	}

	function getDiffRanges(originalHunkBlocks, newHunkBlocks) {
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
				additions.push({
					start: lineStart - 1,
					end: lineStart + newSize - 1
				});
			} else {
				modifications.push({
					start: lineStart - 1,
					end: lineStart + newSize - 1
				});
			}
		}
		return {
			additions: additions,
			modifications: modifications,
			deletions: deletions
		};
	}

	return {
		diffService: diffService
	};
});