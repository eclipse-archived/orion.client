/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*jslint forin:true regexp:false*/
/*global define require eclipse JSLINT window*/
window.onload = function() {
	function jslint(contents) {
		JSLINT(contents, {white: false, onevar: false, undef: true, nomen: false, eqeqeq: true, plusplus: false, bitwise: false, regexp: true, newcap: true, immed: true, strict: false, indent: 1});
		return JSLINT.data();
	}
	
	function cleanup(error) {
		var warnings = [
			["Expected '==='"],
			["Expected '!=='"],
			["Expected '{'", "Statement body should be inside '{ }' braces."],
			["Do not use 'new' for side effects"],
			["The body of a for in should be wrapped"],
			["Don't make functions within a loop"]
		];
		var description = error.description;
		for (var i=0; i < warnings.length; i++) {
			var warning = warnings[i];
			if (description.indexOf(warning[0]) !== -1) {
				error.severity = "warning";
				if (warning.length > 1) {
					error.description = warning[1];
				}
			}
		}
	}
	
	var validationService = {
			checkSyntax : function(title, contents) {
				var result = jslint(contents);
				//this.dispatchEvent("syntaxChecked", {title: title, result: result});
				var problems = [];
				var i;
				if (result.errors) {
					var errors = result.errors;
					for (i=0; i < errors.length; i++) {
						var error = errors[i];
						if (error) {
							var start = error.character - 1,
							    end = start + 1;
							if (error.evidence) {
								var index = error.evidence.substring(start).search(/.\b/);
								if (index > -1) {
									end += index;
								}
							}
							// Convert to format expected by validation service
							error.description = error.reason;
							error.start = error.character;
							error.end = end;
							cleanup(error);
							problems.push(error);
						}
					}
				}
				if (result.functions) {
					var functions = result.functions;
					var lines;
					for (i=0; i < functions.length; i++) {
						var func = functions[i];
						var unused = func.unused;
						if (!unused || unused.length === 0) {
							continue;
						}
						if (!lines) {
							lines = contents.split(/\r?\n/);
						}
						var nameGuessed = func.name[0] === '"';
						var name = nameGuessed ? func.name.substring(1, func.name.length - 1) : func.name;
						var line = lines[func.line - 1];
						for (var j=0; j < unused.length; j++) {
							// Find "function" token in line based on where fName appears.
							// nameGuessed implies "foo:function()" or "foo = function()", and !nameGuessed implies "function foo()"
							var nameIndex = line.indexOf(name);
							var funcIndex = nameGuessed ? line.indexOf("function", nameIndex) : line.lastIndexOf("function", nameIndex);
							if (funcIndex !== -1) {
								problems.push({
									reason: "Function declares unused variable '" + unused[j] + "'.",
									line: func.line,
									character: funcIndex + 1,
									end: funcIndex + "function".length,
									severity: "warning"
								});
							}
						}
					}
				}
				return { problems: problems };
			}
	};
	
	// Converts jslint's "functions" list to a flat outline model
	function toOutlineModel(title, jslintResult) {
		var outline = [],
		    functions = jslintResult.functions;
		for (var func in functions) {
			var f = functions[func],
			    name = f.name,
			    isAnonymousFunction = (name[0]==='"');
			if (isAnonymousFunction) {
				f.name = name = name.substring(1, name.length-1);
			}
			name += "(";
			if (f.param) {
				var params = [];
				for (var p in f.param) {
					params.push(f.param[p]);
				}
				name += params.join(",");
			}
			name += ")";
			var element = {
				label: name,
				children: null,
				line: f.line,
				text: f.name
			};
			outline.push(element);
		}
		return outline;
	}
	var outlineService = {
			getOutline : function(contents, title) {
				if (/\.js$/.test(title)) {
					var jslintResult = jslint(contents);
					return toOutlineModel(title, jslintResult);
				} else if (/\.html?$/.test(title)) {
					var outline = [];
					var pattern = /id=['"]\S*["']/gi, // experimental: |<head[^>]*|<body[^>]*|<script[^>]*/gi;
					    match;
					while ((match = pattern.exec(contents)) !== null) {
						var start = match.index,
						    name = match[0],
						    end;
						if (name[0]==='<') {
							name = "&lt;" + name.substring(1) + "&gt;";
							start += 1;
							end = start + name.length;
						} else {
							start += 4;
							name = name.substring(4, name.length-1);
							end = start+name.length;
						}
						var element = {
							label: name,
							children: null,
							start: start,
							end: end
						};
						outline.push(element);
					}
					return outline;
				}
			}
	};
	
	var provider = new eclipse.PluginProvider();
	provider.registerServiceProvider("orion.edit.validator", validationService, {
		pattern: "\\.js$"
	});
	provider.registerServiceProvider("orion.edit.outliner", outlineService, {
		pattern: "\\.(js|html)$",	// TODO separate out HTML outline
		name: "Flat outline",
		id: "orion.edit.outliner.jslint"
	});
	//validationService.dispatchEvent = serviceProvider.dispatchEvent;
	provider.connect();

};