/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 /*global window dojo*/

define(['dojo'], function(dojo) {

var eclipse = eclipse || {};
eclipse.SyntaxChecker = (function () {
	function SyntaxChecker(serviceRegistry, editorContainer) {
		this.registry = serviceRegistry;
		this.editorContainer = editorContainer;
		dojo.connect(this.editorContainer, "onInputChange", this, this.checkSyntax);
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
				if (validator) {
					var syntaxCheckerCallback = dojo.hitch(this, function (data) {
						this.registry.getService("orion.core.marker").then(function(service) {
							service._setProblems(data.errors);
						});
						this.registry.getService("orion.edit.outline").then(function(service) {
							service._setItems({"title": t, "contents": c, "data": data});
						});
					});
					this.registry.getService(validator)
						.then(function(service) {
							return service.checkSyntax(title, contents);
						})
						.then(syntaxCheckerCallback);
				} else {
					this.registry.getService("orion.edit.outline").then(function(service) {
						service._setItems({title: t, contents: c});
					});
				}
			}
		}
	};
	return SyntaxChecker;
}());
return eclipse;	
});
