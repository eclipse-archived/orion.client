/*******************************************************************************
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
		dojo.connect(this.editor, "onInputChange", this, this.checkSyntax);
	}
	SyntaxChecker.prototype = {
		checkSyntax: function (title, message, contents, contentsSaved) {
			if (!message) {
				var t = title;
				var c = contents;
				var validator;
				var validators = this.registry.getServiceReferences("orion.edit.validator");
				for (var i=0; i<validators.length; i++) {
					var serviceReference = validators[i];
					var pattern = serviceReference.getProperty("pattern");
					if (pattern && new RegExp(pattern).test(title)) {
						validator = serviceReference;
					}
				}
				// TODO support multiple validators
				if (validator) {
					this.registry.getService(validator)
						.then(function(validationService) {
							return validationService.checkSyntax(title, contents);
						})
						.then(dojo.hitch(this, function (data) {
							this.registry.getService("orion.core.marker").then(function(markerService) {
								markerService._setProblems(data.errors);
							});
						}));
				}
			}
		}
	};
	return SyntaxChecker;
}());
return eclipse;	
});
