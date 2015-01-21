/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define(["orion/plugin", "orion/Deferred", "i18n!my/nls/commands"], function(PluginProvider, Deferred, messages) {
	var provider = new PluginProvider({
		name: "3rd party i18n NLS API test",
		description: "Testing some painful i18n APIs",
	});

	console.log("locale: " + (navigator.language || navigator.userLanguage));
	console.log(messages);

	var commandName = messages.MyCommandName,
	    commandTooltip = messages.MyCommandTooltip;

	provider.registerService("orion.edit.command", {
		run: function() {
			return "I set some text in the editor.";
		}
	}, {
		id: "example.nls.textsetter",
		name: commandName,
		tooltip: commandTooltip,
	});

	var statusThing = function(useEditorContext, plainText, editorContext, options) {
		var markdown = "Here **is** some [Markdown](http://example.org) _for you_\n\n<b onmouseover='alert(\"rekt\")'>hover over me</b>";
		var text = "Here is an error message. This looks pretty normal.";

		var status = {
			Message: plainText ? text : markdown,
			Severity: "Error", //"Warning",
		};
		if (useEditorContext) {
			return editorContext.setStatus(status);
		} else {
			return { Status: status };
		}
	};

	provider.registerService("orion.edit.command", {
		execute: statusThing.bind(null, true, false) // useEditorContext == true, plaintext = false
	}, {
		id: "example.nls.message",
		name: "Show message -- editorContext#setStatus()",
	});
	provider.registerService("orion.edit.command", {
		run: statusThing.bind(null, false, false) // useEditorContext == false, plaintext = false
	}, {
		id: "example.nls.message2",
		name: "Show message -- legacy #run() return value",
	});
	provider.registerService("orion.edit.command", {
		execute: statusThing.bind(null, true, false) // useEditorContext == true, plaintext = false
	}, {
		id: "example.nls.message3",
		name: "Show message -- #execute() return value",
	});
	provider.registerService("orion.edit.command", {
		execute: statusThing.bind(null, true, true) // useEditorContext == true, plaintext = true
	}, {
		id: "example.nls.message4",
		name: "Show message -- #execute() return value -- plain text",
	});


	// Test consistency of orion.eidt.command and orion.project.deploy
	var status = {
		Message : "Successful __deployment__ **bro**",
		Severity : "Info" //$NON-NLS-0$
	},
	wrappedResult = {
		Status: {
			Message : "Successful __deployment__ **bro**",
			Severity : "Info" //$NON-NLS-0$
		}
	};
	provider.registerService("orion.project.deploy", { //$NON-NLS-0$
			deploy : function(project, launchConf) {
				return new Deferred().resolve(status).promise;
			}
		}, {
			id: "deploy1111",
			name: "Deploy resolving to status"
		});
	// Is this SUPPOSED to work? I guess not
	provider.registerService("orion.edit.command", { //$NON-NLS-0$
			run : function(selectedText, text, selection, resource) {
				return new Deferred().resolve(wrappedResult).promise;
			}
		}, {
			id: "command1111",
			name: "z run() command resolving to wrapped status",
		});
	provider.registerService("orion.edit.command", { //$NON-NLS-0$
			execute : function() {
				return new Deferred().resolve(wrappedResult).promise;
			}
		}, {
			id: "command122222",
			name: "z execute() command resolving to wrapped status",
		});

	provider.registerService("orion.edit.command", { //$NON-NLS-0$
			execute : function() {
				return new Deferred().reject(status).promise;
			}
		}, {
			id: "command133333",
			name: "z execute() command rejecting with a status",
	});

	provider.registerService("orion.edit.command", { //$NON-NLS-0$
			execute : function() {
				return new Deferred().reject({
					Severity: "Error",
					type: "markdown",
					content: "***barf*** [dude](http://whatever) __fjf__"
				}).promise;
			}
		}, {
			id: "command4444444",
			name: "z execute() command returning some typed markdown",
	});

	provider.registerService("orion.navigate.command", null, {
			id: "navo",
			name: "Some Nav command",
			uriTemplate: "fsjojsfo",
	});
	provider.registerService("orion.page.link.related", null, {
			id: "some_related_link",
			name: "Related link",
			uriTemplate: "http://fsjojsfo",
			category: "mycat",
	});
	
	provider.registerService("orion.page.link.category", null, {
		id: "mycat",
		name: "Mycat",
		imageClass: "core-sprite-wrench",
	});

	provider.connect();
});
