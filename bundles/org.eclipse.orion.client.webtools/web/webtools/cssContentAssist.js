/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define("webtools/cssContentAssist", [
	'orion/Deferred',
	'orion/editor/templates',
	'orion/editor/stylers/text_css/syntax',
	'orion/objects',
	'webtools/util',
	'javascript/compilationUnit',
	'csslint/csslint',
	'webtools/cssVisitor',
	'i18n!webtools/nls/messages'
], function(Deferred, mTemplates, mCSS, Objects, Util, CU, CSSLint, Visitor, Messages) {

/* eslint-disable missing-nls */
	var overflowValues = {
		type: "link",
		values: ["visible", "hidden", "scroll", "auto", "no-display", "no-content"]
	};
	var fontStyleValues = {
		type: "link",
		values: ["italic", "normal", "oblique", "inherit"]
	};
	var fontWeightValues = {
		type: "link",
		values: [
			"bold", "normal", "bolder", "lighter",
			"100", "200", "300", "400", "500", "600",
			"700", "800", "900", "inherit"
		]
	};
	var displayValues = {
		type: "link",
		values: [
			"none", "block", "box", "flex", "inline", "inline-block", "inline-flex", "inline-table",
			"list-item", "table", "table-caption", "table-cell", "table-column", "table-column-group",
			"table-footer-group", "table-header-group", "table-row", "table-row-group", "inherit"
		]
	};
	var visibilityValues = {
		type: "link",
		values: ["hidden", "visible", "collapse", "inherit"]
	};
	var positionValues = {
		type: "link",
		values: ["absolute", "fixed", "relative", "static", "inherit"]
	};
	var whitespaceValues = {
		type: "link",
		values: ["pre", "pre-line", "pre-wrap", "nowrap", "normal", "inherit"]
	};
	var wordwrapValues = {
		type: "link",
		values: ["normal", "break-word"] 
	};
	var floatValues = {
		type: "link",
		values: ["left", "right", "none", "inherit"] 
	};
	var borderStyles = {
		type: "link",
		values: ["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"]
	};
	var widths = {
		type: "link",
		values: []
	};
	widths.values.push('0');
	for (var i=1; i<10; i++) {
		widths.values.push(i.toString() + 'px');
	}
	var colorValues = {
		type: "link",
		values: Object.keys(CSSLint.Colors)
	};
	var cursorValues = {
		type: "link",
		values: [
			"auto",
			"crosshair",
			"default",
			"e-resize",
			"help",
			"move",
			"n-resize",
			"ne-resize",
			"nw-resize",
			"pointer",
			"progress",
			"s-resize",
			"se-resize",
			"sw-resize",
			"text",
			"w-resize",
			"wait",
			"inherit"
		]
	};
	var csslintRules = {
		type: "link",
		values: [
			"adjoining-classes",
			"box-model",
			"box-sizing",
			"bulletproof-font-face",
			"compatible-vendor-prefixes",
			"display-property-grouping",
			"duplicate-background-images",
			"duplicate-properties",
			"empty-rules",
			"fallback-colors",
			"floats",
			"font-faces",
			"font-sizes",
			"gradients",
			"ids",
			"import",
			"important",
			"known-properties",
			"outline-none",
			"overqualified-elements",
			"qualified-headings",
			"regex-selectors",
			"rules-count",
			"selector-max-approaching",
			"selector-max",
			"shorthand",
			"star-property-hack",
			"text-indent",
			"underscore-property-hack",
			"unique-headings",
			"universal-selector",
			"unqualified-attributes",
			"vendor-prefix",
			"zero-units"
		]
	};
	var severityValues = {
		type: "link",
		values: [
			"false",
			"true",
			"0",
			"1",
			"2"
		]
	};
	
	var valuesProperties = [
		{prop: "display", values: displayValues},
		{prop: "overflow", values: overflowValues},
		{prop: "overflow-x", values: overflowValues},
		{prop: "overflow-y", values: overflowValues},
		{prop: "float", values: floatValues},
		{prop: "position", values: positionValues},
		{prop: "cursor", values: cursorValues},
		{prop: "color", values: colorValues},
		{prop: "border-top-color", values: colorValues},
		{prop: "border-bottom-color", values: colorValues},
		{prop: "border-right-color", values: colorValues},
		{prop: "border-left-color", values: colorValues},
		{prop: "background-color", values: colorValues},
		{prop: "font-style", values: fontStyleValues},
		{prop: "font-weight", values: fontWeightValues},
		{prop: "white-space", values: whitespaceValues},
		{prop: "word-wrap", values: wordwrapValues},
		{prop: "visibility", values: visibilityValues}
	];
	
	var pixelProperties = [
		"width", "height", "top", "bottom", "left", "right",
		"min-width", "min-height", "max-width", "max-height",
		"margin", "padding", "padding-left", "padding-right",
		"padding-top", "padding-bottom", "margin-left", "margin-top",
		"margin-bottom", "margin-right"
	];
	
	var borderProperties = ["border", "border-top", "border-bottom", "border-left", "border-right"];
/* eslint-enable missing-nls */

	function fromJSON(o) {
		return JSON.stringify(o).replace("}", "\\}");  //$NON-NLS-1$
	}
	
	var templates = [
		{
			prefix: "rule", //$NON-NLS-1$
			description: Messages['ruleTemplateDescription'],
			template: ".${class} {\n\t${cursor}\n}" //$NON-NLS-1$
		},
		{
			prefix: "rule", //$NON-NLS-1$
			description: Messages['idSelectorTemplateDescription'],
			template: "#${id} {\n\t${cursor}\n}" //$NON-NLS-1$
		},
		{
			prefix: "outline", //$NON-NLS-1$
			description: Messages['outlineStyleTemplateDescription'],
			template: "outline: ${color:" + fromJSON(colorValues) + "} ${style:" + fromJSON(borderStyles) + "} ${width:" + fromJSON(widths) + "};" //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
		},
		{
			prefix: "background-image", //$NON-NLS-1$
			description: Messages['backgroundImageTemplateDescription'],
			template: "background-image: url(\"${uri}\");" //$NON-NLS-1$
		},
		{
			prefix: "url", //$NON-NLS-1$
			description: Messages['urlImageTemplateDescription'],
			template: "url(\"${uri}\");" //$NON-NLS-1$
		},
		{
			prefix: "rgb", //$NON-NLS-1$
			description: Messages['rgbColourTemplateDescription'],
			template: "rgb(${red},${green},${blue});" //$NON-NLS-1$
		},
		{
			prefix: "@import", //$NON-NLS-1$
			description: Messages['importTemplateDescription'],
			template: "@import \"${uri}\";" //$NON-NLS-1$
		},
		{
			prefix: "csslint", //$NON-NLS-1$
			description: Messages['csslintTemplateDescription'],
			template: "\/*csslint ${:" + fromJSON(csslintRules) + "}: ${a:" + fromJSON(severityValues) + "} *\/" //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
		}
	];
	
	var prop;
	for (i=0; i<valuesProperties.length; i++) {
		prop = valuesProperties[i];
		templates.push({
			prefix: prop.prop,
			description: prop.prop + " - " + prop.prop + " style", //$NON-NLS-1$ //$NON-NLS-2$
			template: prop.prop + ": ${value:" + fromJSON(prop.values) + "};" //$NON-NLS-1$ //$NON-NLS-2$
		});
	}	
	
	for (i=0; i<pixelProperties.length; i++) {
		prop = pixelProperties[i];
		templates.push({
			prefix: prop,
			description: prop + " - " + prop + " pixel style", //$NON-NLS-1$ //$NON-NLS-2$
			template: prop  + ": ${value}px;" //$NON-NLS-1$
		});
	}
	var fourWidthsProperties = ["padding", "margin"]; //$NON-NLS-1$ //$NON-NLS-2$
	for (i=0; i<fourWidthsProperties.length; i++) {
		prop = fourWidthsProperties[i];
		templates.push({
			prefix: prop,
			description: prop + " - " + prop + " top right bottom left style", //$NON-NLS-1$ //$NON-NLS-2$
			template: prop  + ": ${top}px ${left}px ${bottom}px ${right}px;" //$NON-NLS-1$
		});
		templates.push({
			prefix: prop,
			description: prop + " - " + prop + " top right,left bottom style", //$NON-NLS-1$ //$NON-NLS-2$
			template: prop  + ": ${top}px ${right_left}px ${bottom}px;" //$NON-NLS-1$
		});
		templates.push({
			prefix: prop,
			description: prop + " - " + prop + " top,bottom right,left style", //$NON-NLS-1$ //$NON-NLS-2$
			template: prop  + ": ${top_bottom}px ${right_left}px" //$NON-NLS-1$
		});
	}
	
	for (i=0; i<borderProperties.length; i++) {
		prop = borderProperties[i];
		templates.push({
			prefix: prop,
			description: prop + " - " + prop + " style", //$NON-NLS-1$ //$NON-NLS-2$
			template: prop + ": ${width:" + fromJSON(widths) + "} ${style:" + fromJSON(borderStyles) + "} ${color:" + fromJSON(colorValues) + "};" //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
		});
	}
	
	/**
	 * @description Create a proxy template provider
	 * @returns {TemplateProvider} A new TemplateProvider
	 * @since 10.0
	 */
	function TemplateProvider() {
	}
	
	TemplateProvider.prototype = new mTemplates.TemplateContentAssist(mCSS.keywords, templates);
	
	Objects.mixin(TemplateProvider.prototype, {
		/**
         * @callback 
         */
        getKeywordProposals: function(prefix) {
			var proposals = [];
			var keywords = this.getKeywords();
			if (keywords) {
				for (i = 0; i < keywords.length; i++) {
					if (keywords[i].indexOf(prefix) === 0) {
						var _p = keywords[i].substring(prefix.length);
						proposals.push({
							proposal: _p, 
							description: keywords[i], 
							style: 'emphasis', //$NON-NLS-1$
							kind: 'css' //$NON-NLS-1$
						});
					}
				}
				
				if (0 < proposals.length) {
					proposals.sort(function(p1, p2) {
						if (p1.name < p2.name) return -1;
						if (p1.name > p2.name) return 1;
						if (p1.description < p2.description) return -1;
						if (p1.description > p2.description) return 1;
						return 0;
					});
					proposals.splice(0, 0,{
						proposal: '',
						description: Messages['keywordsAssistTitle'],
						style: 'noemphasis_title_keywords', //$NON-NLS-1$
						unselectable: true,
						kind: 'css' //$NON-NLS-1$
					});	
				}
			}
			return proposals;
		},
		/**
		 * @callback 
		 */
		getTemplateProposals: function(prefix, offset, context) {
			var proposals = [];
			var _tmplates = this.getTemplates();
			for (var t = 0; t < _tmplates.length; t++) {
				var template = _tmplates[t];
				if (template.match(prefix)) {
					var proposal = template.getProposal(prefix, offset, context);
					proposal.style = 'emphasis'; //$NON-NLS-1$
					var obj = Object.create(null);
			        obj.type = 'markdown'; //$NON-NLS-1$
			        obj.content = Messages['templateHoverHeader'];
			        obj.content += proposal.proposal;
			        proposal.hover = obj;
			        proposal.kind = 'css'; //$NON-NLS-1$
			        this.removePrefix(prefix, proposal);
					proposals.push(proposal);
				}
			}
			
			if (0 < proposals.length) {
				proposals.sort(function(p1, p2) {
					if (p1.name < p2.name) return -1;
					if (p1.name > p2.name) return 1;
					if (p1.description < p2.description) return -1;
					if (p1.description > p2.description) return 1;
					return 0;
				});
				// if any templates were added to the list of 
				// proposals, add a title as the first element
				proposals.splice(0, 0, {
					proposal: '',
					description: Messages['templateAssistHeader'],
					style: 'noemphasis_title', //$NON-NLS-0$
					unselectable: true
				});
			}
			
			return proposals;
		}
	});
	
	/**
	 * @name orion.editor.CssContentAssistProvider
	 * @class Provides content assist for CSS keywords.
	 * @param {CssResultManager} resultManager The backing result manager
	 */
	function CssContentAssistProvider(resultManager) {
	    this._resultManager = resultManager;
	}
	var templateAssist = new TemplateProvider();
	
	Objects.mixin(CssContentAssistProvider.prototype, {
		/**
		 * @private
		 */
		_getPrefixStart: function(text, offset) {
			var index = offset;
			while (index > 0) {
				var char = text.substring(index - 1, index);
				if (/[A-Za-z\-\@]/.test(char)) {
					index--;
				} else {
					break;
				}
			}
			return index;
		},
		/**
		 * @callback 
		 */
		computePrefix: function(editorContext, offset) {
			return editorContext.getText().then(function (text) {
				return text.substring(this._getPrefixStart(text, offset), offset);
			}.bind(this));
		},
        /**
         * @callback
         * @since 8.0
         */
        computeContentAssist: function computeContentAssist(editorContext, params) {
            var that = this;
            return Deferred.when(editorContext.getFileMetadata(), function(meta) {
               if(meta.contentType.id === 'text/html') {
                  return editorContext.getText().then(function(text) {
                     var blocks = Util.findStyleBlocks(text, params.offset);
                     if(blocks && blocks.length > 0) {
                         var cu = new CU(blocks, meta);
                         return that._computeProposals(cu.getEditorContext(), text, params);
                     }
                  });
               }
               return editorContext.getText().then(function(text) {
                  return that._computeProposals(editorContext, text, params);
               });
            });
        },
        
        /**
         * @description Computes the proposals from the given offset, also returns all keyword and template proposals
         * @since 8.0
         * @callback
         */
        _computeProposals: function _computeProposals(editorContext, buffer, context) {
            var _ctxt = this._getCompletionContext(editorContext, context);
            if(_ctxt) {
            	context.kind = _ctxt.value;
            }
            return [].concat(templateAssist.computeProposals(buffer, context.offset, context));
        },
        
        /**
         * @description Computes the kind of completion we are attempting. For example 'color: <assist>' would return 'color'
         * @function
         * @private
         * @param {Object} context The completion contest from #computeProposals
         * @returns {String} The completion context or <code>null</code>
         * @since 8.0
         */
        _getCompletionContext: function _getCompletionContext(editorContext, context) {
            if(this._resultManager) {
            	var that = this;
                return this._resultManager.getResult(editorContext).then(function(results) {
                   if(results && results.ast) {
                       var node = that.findNodeAtOffset(results.ast, context.offset);
                       if(node && node.type === 'Rule') {
                       		return 'rule'; //$NON-NLS-1$
                       }
                   }
                   return null;
                });
            }
            return null;
        },
        
        /**
		 * Returns the ast node at the given offset or the parent node enclosing it
		 * @param {Object} ast The AST to inspect
		 * @param {Number} offset The offset into the source 
		 * @returns {Object} The AST node at the given offset or null 
		 * @since 10.0
		 */
		findNodeAtOffset: function(ast, offset) {
			var found = null;
			 Visitor.visit(ast, {
	            visitNode: function(node) {
					if(node.range[0] <= offset) {
						found = node;
					} else {
					    return Visitor.BREAK;
					}      
	            },
	            endVisitNode: function(node) {
	            	if(found && offset > found.range[1] && offset > node.range[0]) {
	            		found = node;
	            	}
	            }
	        });
	        return found;
		}
	});

	return {
		CssContentAssistProvider: CssContentAssistProvider
	};
});
