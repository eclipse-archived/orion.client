/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define window dojo*/

define(['dojo'], function(dojo) {

var eclipse = eclipse || {};
/*
 * Listens to editor change, looks up validator service for the file type, calls validator service, passes result to the marker service.
 */
eclipse.SyntaxChecker = (function () {
	function SyntaxChecker(serviceRegistry, editor) {
		this.registry = serviceRegistry;
		this.editor = editor;
		this.editor.addEventListener("InputChanged", dojo.hitch(this, function(evt) {
			this.checkSyntax(evt.title, evt.message, evt.contents, evt.contentsSaved);
		}));
	}
	SyntaxChecker.prototype = {
		checkSyntax: function (title, message, contents, contentsSaved) {
			if (!message) {
				var validators = this.registry.getServiceReferences("orion.edit.validator");
				var filteredValidators = [];
				for (var i=0; i < validators.length; i++) {
					var serviceReference = validators[i];
					var pattern = serviceReference.getProperty("pattern");
					if (pattern && new RegExp(pattern).test(title)) {
						filteredValidators.push(serviceReference);
					}
				}

				var extractProblems = function(data) {
					return data.problems || data.errors;
				};
				var problemPromises = [];
				for (i=0; i < filteredValidators.length; i++) {
					var validator = filteredValidators[i];
					problemPromises.push(this.registry.getService(validator).checkSyntax(title, contents).then(extractProblems));
				}
				
				new dojo.DeferredList(problemPromises)
					.then(dojo.hitch(this, function(result) {
						var problems = [];
						for (i=0; i < result.length; i++) {
							var probs = result[i] && result[i][1];
							if (probs) {
								this._fixup(probs);
								problems = problems.concat(probs);
							}
						}
						this.registry.getService("orion.core.marker")._setProblems(problems);
					}));
			}
		},
		_fixup: function(problems) {
			var model = this.editor.getModel();
			for (var i=0; i < problems.length; i++) {
				var problem = problems[i];
				
				problem.description = problem.description || problem.reason;
				problem.severity = problem.severity || "error";
				problem.start = (typeof problem.start === "number") ? problem.start : problem.character;
				problem.end = (typeof problem.end === "number") ? problem.end : problem.start + 1;
				
				// Range check
				var lineLength = model.getLine(problem.line - 1, false).length;
				problem.start = Math.max(1, problem.start);
				problem.start = Math.min(problem.start, lineLength);
				problem.end = Math.min(problem.end, lineLength);
				problem.end = Math.max(problem.start, problem.end);
			}
		}
	};
	return SyntaxChecker;
}());
return eclipse;	
});
