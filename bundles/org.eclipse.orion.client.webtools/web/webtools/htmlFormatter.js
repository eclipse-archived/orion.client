/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd */
define("webtools/htmlFormatter", [
'orion/objects',
'orion/Deferred',
'beautifier/beautifier'
], function(Objects, Deferred, Beautifier) {
	var config = {
		// 0:off, 1:warning, 2:error
		/*
		 *     The options are (default in brackets):
    indent_inner_html (default false)  - indent <head> and <body> sections,
    indent_size (default 4)            - indentation size,
    indent_char (default space)        - character to indent with,
    wrap_line_length (default 250)            -  maximum amount of characters per line (0 = disable)
    brace_style (default "collapse") - "collapse" | "expand" | "end-expand" | "none"
            put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line, or attempt to keep them where they are.
    unformatted (defaults to inline tags) - list of tags, that shouldn't be reformatted
    indent_scripts (default normal)  - "keep"|"separate"|"normal"
    preserve_newlines (default true) - whether existing line breaks before elements should be preserved
                                        Only works before elements, not inside tags or for text.
    max_preserve_newlines (default unlimited) - maximum number of line breaks to be preserved in one chunk
    indent_handlebars (default false) - format and indent {{#foo}} and {{/foo}}
    end_with_newline (false)          - end with a newline
    extra_liners (default [head,body,/html]) -List of tags that should have an extra newline before them.
    eol
		 * 
		 */
		defaults: {
			"indent_size": 4,
			"indent_char": " ",
			"indent_inner_html" : false,
			"eol": "\n",
			"end_with_newline": false,
			"wrap_line_length" : 250,
			"brace_style" : "collapse",
			"indent_scripts" : "normal",
			"preserve_newlines" : true,
			"max_preserve_newlines" : 10,
			"indent_handlebars" : false,
			"extra_liners" : "head,body,html",
			"newline_between_rules" : true,
			"space_around_selector_separator" : false,
			"indent_level": 0,
			"space_after_anon_function": false,
			"keep_array_indentation": false,
			"keep_function_indentation": false,
			"space_before_conditional": true,
			"break_chained_methods": false,
			"eval_code": false,
			"unescape_strings": false,
			"wrap_attributes": "auto",
			"wrap_attributes_indent_size": 4,
		},
		
		setOption: function(ruleId, value, key) {
			if(Array.isArray(this.rules[ruleId])) {
				var ruleConfig = this.rules[ruleId];
				if (key) {
					ruleConfig[1] = ruleConfig[1] || {};
					ruleConfig[1][key] = value;
				} else {
					ruleConfig[0] = value;
				}
			}
			else {
				this.rules[ruleId] = value;
			}
		},
		
		/**
		 * @description Resets the rules to their default values
		 * @function
		 */
		setDefaults: function setDefaults() {
			this.rules = Object.create(null);
			var keys = Object.keys(this.defaults);
			for(var i = 0; i < keys.length; i++) {
				var key = keys[i];
				this.rules[key] = this.defaults[key];
			}
		}
	};

	/**
	 * @name javascript.HtmlFormatter
	 * @description creates a new instance of the html formatter
	 * @constructor
	 * @public
	 */
	function HtmlFormatter() {
		config.setDefaults();
	}
	
	Objects.mixin(HtmlFormatter.prototype, /** @lends javascript.HtmlFormatter.prototype*/ {
		
		/**
		 * @description Callback from the editor to format the source code
		 * @function
		 * @public 
		 * @memberof javascript.HtmlFormatter.prototype
		 * @param {orion.edit.EditorContext} editorContext The current editor context
		 * @param {Object} context The current selection context
		 */
		format: function(editorContext, context) {
			var deferred = new Deferred();
			this._format(editorContext, deferred, config.rules);
			return deferred;
		},
	
		/**
		 * @description Format the given editor
		 * @function
		 * @private
		 * @param {orion.edit.EditorContext} editorContext The given editor context
		 * @param {Deferred} deferred the given deferred object
		 * @param {Object} configuration the given configuration
		 * @since 6.0
		 */
		_format: function(editorContext, deferred, configuration) {
			return editorContext.getSelection().then(function(selection) {
				var start = selection.start;
				var end = selection.end;
				if (end !== start) {
					return editorContext.getText(start, end).then(function(text) {
						var formatted = Beautifier.html_beautify(text, configuration);
						if (formatted) {
							deferred.resolve(editorContext.setText(formatted.text, start, end));
						} else {
							deferred.reject();
						}
						return deferred;
					}.bind(this));
				}
				return editorContext.getText().then(function(text) {
					var formatted = Beautifier.html_beautify(text, configuration);
					if (formatted) {
						deferred.resolve(editorContext.setText(formatted));
					} else {
						deferred.reject();
					}
					return deferred;
				}.bind(this));
			}.bind(this));
		},
		
		/**
		 * @description Callback from orion.cm.managedservice
		 * @function
		 * @public
		 * @param {Object} properties The properties that have been changed
		 */
		updated: function(properties) {
			if (!properties) {
				return;
			}
			var oldconfig = properties.pid === 'jsbeautify.config.css';
			var keys = Object.keys(properties);
			var i, key, ruleId, originalKey;
			for(i = 0; i < keys.length; i++) {
				key = keys[i];
				originalKey = key;
				/*
				 * Do the key mapping for common options between css, js and html formatters
				 */
				key = key.replace(/^css_/, "");
				ruleId = key;
				if(oldconfig && config.rules[key] !== config.defaults[key]) {
					//don't overwrite a new setting with an old one
					continue;
				}
				config.setOption(ruleId, properties[originalKey]);
			}
			
			oldconfig = properties.pid === 'jsbeautify.config.js';
			keys = Object.keys(properties);
			for(i = 0; i < keys.length; i++) {
				key = keys[i];
				originalKey = key;
				/*
				 * Do the key mapping for common options between css, js and html formatters
				 */
				key = key.replace(/^js_/, "");
				ruleId = key;
				if(oldconfig && config.rules[key] !== config.defaults[key]) {
					//don't overwrite a new setting with an old one
					continue;
				}
				config.setOption(ruleId, properties[originalKey]);
			}

			oldconfig = properties.pid === 'jsbeautify.config.html';
			keys = Object.keys(properties);
			for(i = 0; i < keys.length; i++) {
				key = keys[i];
				originalKey = key;
				/*
				 * Do the key mapping for common options between css, js and html formatters
				 */
				key = key.replace(/^html_/, "");
				ruleId = key;
				if(oldconfig && config.rules[key] !== config.defaults[key]) {
					//don't overwrite a new setting with an old one
					continue;
				}
				config.setOption(ruleId, properties[originalKey]);
			}
		},
	});
	
	return {
		HtmlFormatter: HtmlFormatter
	};
});