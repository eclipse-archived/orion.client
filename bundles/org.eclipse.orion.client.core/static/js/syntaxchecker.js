/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 /*global window dojo*/

"use strict";

dojo.require("dojo._base.json");

var eclipse = eclipse || {};
eclipse.SyntaxChecker = (function () {
	function SyntaxChecker(registry, editorContainer) {
		this.registry = registry;
		this.editorContainer = editorContainer;
		dojo.connect(this.editorContainer, "onInputChange", this, this.checkSyntax);
	}
	SyntaxChecker.prototype = {
		checkSyntax: function (title, message, contents, contentsSaved) {
			if (!message) {
				var t = title;
				var c = contents;
				// FIXME this doesn't belong here, seems like we should get the right service for the given title
				if (title.indexOf(".js") === title.length - 3) {
					var syntaxCheckerCallback = dojo.hitch(this, function (data) {
						this.registry.callService("IProblemProvider", "_setProblems", null, [data.errors]);
						this.registry.callService("IOutlineProvider", "_setItems", null, [{"title": t, "contents": c, "data": data}]);
					});
					try {
						this.registry.callService("IEditorSyntaxChecker", "checkSyntax", syntaxCheckerCallback, [title, contents]);
					} catch (exc) {
						console.debug(exc.toString());
					}
				} else {
					this.registry.callService("IOutlineProvider", "_setItems", null, [{title: t, contents: c}]);
				}
			}
		}
	};
	return SyntaxChecker;
})();
