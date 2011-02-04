/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
window.onload = function() {
	var jsLintService = {
			checkSyntax : function(title, contents) {
				JSLINT(contents, {white: false, onevar: false, undef: true, nomen: false, eqeqeq: true, plusplus: false, bitwise: false, regexp: true, newcap: true, immed: true, strict: false});
				var result = JSLINT.data();
				this.dispatchEvent("syntaxChecked", {title: title, result: result});
				return result;
			}
	};
	
	var provider = new eclipse.PluginProvider();
	var serviceProvider = provider.registerServiceProvider("IEditorSyntaxChecker", jsLintService);
	jsLintService.dispatchEvent = serviceProvider.dispatchEvent;
	provider.connect();
};
