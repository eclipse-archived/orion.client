/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*jslint devel:true regexp:false laxbreak:true*/
/*global dojo orion:true */

/**
 * @namespace The top-level Orion namespace.
 */
orion = orion || {};

/**
 * @namespace The namespace for stylers.
 */
orion.styler = orion.styler || {};

/**
 * Constructs a new JsonStyler for the given editor.
 * @name orion.styler.JsonStyler
 * @class A styler that's capable of handling .json files.
 * @param {eclipse.Editor} editor The editor to provide styling for.
 */
orion.styler.JsonStyler = (function() {
	function JsonStyler(editor) {
		this.initialize(editor);
	}
	orion.styler.AbstractStyler.extend(JsonStyler, {
		// Converted from JSON.tmLanguage
		jsonGrammar : {
		    "fileTypes": [ "json" ],
		    "foldingStartMarker": "(?x:       # turn on extended mode\\n                          ^        # a line beginning with\\n                          \\s*      # some optional space\\n                          [{\\[]    # the start of an object or array\\n                          (?!      # but not followed by\\n                            .*     # whatever\\n                            [}\\]]  # and the close of an object or array\\n                            ,?     # an optional comma\\n                            \\s*    # some optional space\\n                            $      # at the end of the line\\n                          )\\n                          |        # ...or...\\n                          [{\\[]    # the start of an object or array\\n                          \\s*      # some optional space\\n                          $        # at the end of the line\\n                        )",
		    "foldingStopMarker": "(?x:     # turn on extended mode\\n                         ^      # a line beginning with\\n                         \\s*    # some optional space\\n                         [}\\]]  # and the close of an object or array\\n                       )",
		    "keyEquivalent": "^~J",
		    "name": "JSON",
		    "patterns": [
		        {
		            "include": "#value"
		        }
		    ],
		    "repository": {
		        "array": {
		            "begin": "\\[",
		            "beginCaptures": {
		                "0": {
		                    "name": "punctuation.definition.array.begin.json"
		                }
		            },
		            "end": "\\]",
		            "endCaptures": {
		                "0": {
		                    "name": "punctuation.definition.array.end.json"
		                }
		            },
		            "name": "meta.structure.array.json",
		            "patterns": [
		                {
		                    "include": "#value"
		                },
		                {
		                    "match": ",",
		                    "name": "punctuation.separator.array.json"
		                },
		                {
		                    "match": "[^\\s\\]]",
		                    "name": "invalid.illegal.expected-array-separator.json"
		                }
		            ]
		        },
		        "constant": {
		            "match": "\\b(?:true|false|null)\\b",
		            "name": "constant.language.json"
		        },
		        "number": {
		            "comment": "handles integer and decimal numbers",
		            "match": "(?x:         # turn on extended mode\\n\t\t\t             -?         # an optional minus\\n\t\t\t             (?:\\n\t\t\t               0        # a zero\\n\t\t\t               |        # ...or...\\n\t\t\t               [1-9]    # a 1-9 character\\n\t\t\t               \\d*      # followed by zero or more digits\\n\t\t\t             )\\n\t\t\t             (?:\\n\t\t\t               (?:\\n\t\t\t                 \\.     # a period\\n\t\t\t                 \\d+    # followed by one or more digits\\n\t\t\t               )?\\n\t\t\t               (?:\\n\t\t\t                 [eE]   # an e character\\n\t\t\t                 [+-]?  # followed by an option +/-\\n\t\t\t                 \\d+    # followed by one or more digits\\n\t\t\t               )?       # make exponent optional\\n\t\t\t             )?         # make decimal portion optional\\n\t\t\t           )",
		            "name": "constant.numeric.json"
		        },
		        "object": {
		            "begin": "\\{",
		            "beginCaptures": {
		                "0": {
		                    "name": "punctuation.definition.dictionary.begin.json"
		                }
		            },
		            "comment": "a JSON object",
		            "end": "\\}",
		            "endCaptures": {
		                "0": {
		                    "name": "punctuation.definition.dictionary.end.json"
		                }
		            },
		            "name": "meta.structure.dictionary.json",
		            "patterns": [
		                {
		                    "comment": "the JSON object key",
		                    "include": "#string"
		                },
		                {
		                    "begin": ":",
		                    "beginCaptures": {
		                        "0": {
		                            "name": "punctuation.separator.dictionary.key-value.json"
		                        }
		                    },
		                    "end": "(,)|(?=\\})",
		                    "endCaptures": {
		                        "1": {
		                            "name": "punctuation.separator.dictionary.pair.json"
		                        }
		                    },
		                    "name": "meta.structure.dictionary.value.json",
		                    "patterns": [
		                        {
		                            "comment": "the JSON object value",
		                            "include": "#value"
		                        },
		                        {
		                            "match": "[^\\s,]",
		                            "name": "invalid.illegal.expected-dictionary-separator.json"
		                        }
		                    ]
		                },
		                {
		                    "match": "[^\\s\\}]",
		                    "name": "invalid.illegal.expected-dictionary-separator.json"
		                }
		            ]
		        },
		        "string": {
		            "begin": "\"",
		            "beginCaptures": {
		                "0": {
		                    "name": "punctuation.definition.string.begin.json"
		                }
		            },
		            "end": "\"",
		            "endCaptures": {
		                "0": {
		                    "name": "punctuation.definition.string.end.json"
		                }
		            },
		            "name": "string.quoted.double.json",
		            "patterns": [
		                {
		                    "match": "(?x:                # turn on extended mode\\n                     \\\\                # a literal backslash\\n                     (?:               # ...followed by...\\n                       [\"\\\\/bfnrt]     # one of these characters\\n                       |               # ...or...\\n                       u               # a u\\n                       [0-9a-fA-F]{4}  # and four hex digits\\n                     )\\n                   )",
		                    "name": "constant.character.escape.json"
		                },
		                {
		                    "match": "\\\\.",
		                    "name": "invalid.illegal.unrecognized-string-escape.json"
		                }
		            ]
		        },
		        "value": {
		            "comment": "the 'value' diagram at http://json.org",
		            "patterns": [
		                {
		                    "include": "#constant"
		                },
		                {
		                    "include": "#number"
		                },
		                {
		                    "include": "#string"
		                },
		                {
		                    "include": "#array"
		                },
		                {
		                    "include": "#object"
		                }
		            ]
		        }
		    },
		    "scopeName": "source.json",
		    "uuid": "0C3868E4-F96B-4E55-B204-1DCB5A20748B"
		},
		_onLineStyle: function(e) {
			// TODO: restyle regions when changed
			//console.debug("lineIndex: " + e.lineIndex + ", lineStart: " + e.lineStart + ", lineText: " + e.lineText);
		},
		_onModelChanged: function(e) {
			// FIXME incremental changes
			var allLines = this.editor.getText().split(/\r?\n/);
			new orion.styler.TextMateStyler(this.jsonGrammar).parse(allLines);
		}
	}); // extend()
	return JsonStyler;
}());

