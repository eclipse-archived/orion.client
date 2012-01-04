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

var SyntaxChecker = (function () {
	function SyntaxChecker(serviceRegistry, editor) {
		this.registry = serviceRegistry;
		this.editor = editor;
	}
	SyntaxChecker.prototype = {
		/* Looks up applicable validator services, calls validators, passes result to the marker service. */
		checkSyntax: function (contentType, title, message, contents) {
			function getValidators(registry, contentType) {
				var contentTypeService = registry.getService("orion.file.contenttypes");
				function getFilteredValidator(registry, validator, contentType) {
					var contentTypeIds = validator.getProperty("contentType");
					return contentTypeService.isSomeExtensionOf(contentType, contentTypeIds).then(function(result) {
						return result ? validator : null;
					});
				}
				var validators = registry.getServiceReferences("orion.edit.validator");
				var filteredValidators = [];
				for (var i=0; i < validators.length; i++) {
					var serviceReference = validators[i];
					var pattern = serviceReference.getProperty("pattern"); // backwards compatibility
					if (serviceReference.getProperty("contentType")) {
						filteredValidators.push(getFilteredValidator(registry, serviceReference, contentType));
					} else if (pattern && new RegExp(pattern).test(title)) {
						var d = new dojo.Deferred();
						d.callback(serviceReference);
						filteredValidators.push(d);
					}
				}
				// Return a promise that gives the validators that aren't null
				return new dojo.DeferredList(filteredValidators).then(
					function(validators) {
						var capableValidators = [];
						for (var i=0; i < validators.length; i++) {
							var validator = validators[i][1];
							if (validator !== null) {
								capableValidators.push(validator);
							}
						}
						return capableValidators;
					});
			}
			
			if (!contentType) {
				return;
			}
			if (!message) {
				var self = this;
				getValidators(this.registry, contentType).then(function(validators) {
					var extractProblems = function(data) {
						return data.problems || data.errors;
					};
					var problemPromises = [];
					for (var i=0; i < validators.length; i++) {
						var validator = validators[i];
						problemPromises.push(self.registry.getService(validator).checkSyntax(title, contents).then(extractProblems));
					}
					
					new dojo.DeferredList(problemPromises)
						.then(function(result) {
							var problems = [];
							for (i=0; i < result.length; i++) {
								var probs = result[i] && result[i][1];
								if (probs) {
									self._fixup(probs);
									problems = problems.concat(probs);
								}
							}
							self.registry.getService("orion.core.marker")._setProblems(problems);
						});
				});
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
return {SyntaxChecker: SyntaxChecker};
});
