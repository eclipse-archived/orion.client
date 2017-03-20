/*******************************************************************************
 * @license
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd */
define([
	'orion/editor/templates',
	'orion/objects',
	'csslint/csslint',
	'webtools/util',
	'javascript/util',
	'webtools/compilationUnit',
	'i18n!webtools/nls/messages'
], function(mTemplates, Objects, CSSLint, Util, jsUtil, CU, Messages) {

	function CssContentAssistProvider(cssResultManager) {
		this.cssResultManager = cssResultManager;
	}
	
	CssContentAssistProvider.prototype = new mTemplates.TemplateContentAssist([], []);
	
	
	// TODO Support additional templates
	var sheetTemplates = [
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
//		{
//			prefix: "outline", //$NON-NLS-1$
//			description: Messages['outlineStyleTemplateDescription'],
//			template: "outline: ${color:" + fromJSON(colorValues) + "} ${style:" + fromJSON(borderStyles) + "} ${width:" + fromJSON(widths) + "};" //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
//		},
//		{
//			prefix: "background-image", //$NON-NLS-1$
//			description: Messages['backgroundImageTemplateDescription'],
//			template: "background-image: url(\"${uri}\");" //$NON-NLS-1$
//		},
//		{
//			prefix: "url", //$NON-NLS-1$
//			description: Messages['urlImageTemplateDescription'],
//			template: "url(\"${uri}\");" //$NON-NLS-1$
//		},
//		{
//			prefix: "rgb", //$NON-NLS-1$
//			description: Messages['rgbColourTemplateDescription'],
//			template: "rgb(${red},${green},${blue});" //$NON-NLS-1$
//		},
		{
			prefix: "@import", //$NON-NLS-1$
			description: Messages['importTemplateDescription'],
			template: "@import \"${uri}\";" //$NON-NLS-1$
		},
//		{
//			prefix: "csslint", //$NON-NLS-1$
//			description: Messages['csslintTemplateDescription'],
//			template: "\/*csslint ${:" + fromJSON(csslintRules) + "}: ${a:" + fromJSON(severityValues) + "} *\/" //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
//		}
	];
	
	Objects.mixin(CssContentAssistProvider.prototype, {

        computeContentAssist: function computeContentAssist(editorContext, params) {
        	return editorContext.getFileMetadata().then(function(meta) {
        		if(meta && meta.contentType.id === "text/html") {
			        return editorContext.getText().then(function(text) {
    			         var blocks = Util.findStyleBlocks(text, params.offset);
    			         if(blocks && blocks.length > 0) {
    			             var cu = new CU(blocks, meta, editorContext);
    			             return this.cssResultManager.getResult(cu.getEditorContext()).then(function(results) {
                			    if(results) {
                			         return this._computeProposalsFromAst(results.ast, params);
                			    }
                			    return null;
        			         }.bind(this));
    			         }
			         }.bind(this));
			    }
			    return this.cssResultManager.getResult(editorContext).then(function(results) {
    			    if(results) {
    			         return this._computeProposalsFromAst(results.ast, params);
    			    }
    			    return null;
    			}.bind(this));
			}.bind(this));
		},
		
		/**
		 * @callback 
		 */
		computePrefix: function computePrefix(editorContext, offset) {
			return editorContext.getText().then(function (text) {
				return text.substring(this._getPrefixStart(text, offset), offset);
			}.bind(this));
		},
		
		/**
		 * @private
		 */
		_getPrefixStart: function _getPrefixStart(text, offset) {
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
		 * Computes the completions from the given AST and parameter context
		 * @param {Object} ast The AST to inspect
		 * @param {Object} params The paramter context
		 * @returns {Array.<Object>} The array of proposal objects or an empty array, never null
		 */
		_computeProposalsFromAst: function _computeProposalsFromAst(ast, params) {
			var node = Util.findCssNodeAtOffset(ast, params.offset);
			if(node) {
				if (this.inPropertyValue(node)){
					return this.getPropertyValueProposals(params, node);
				} else if (this.inProperty(node)){
					return this.getPropertyProposals(params);
				}
				return this.getRootProposals(params);
			}
			return [];			
		},
		
		inPropertyValue: function inPropertyValue(node) {
			if (node){
				if (node.type === 'PropertyValue'){
					return true;
				}
			}
			return false;
		}, 
		
		inProperty: function inProperty(node) {
			if (node){
				if (node.type === 'Property'){
					return true;
				}
				if (node.type === 'Declaration'){
					return true;
				}
				if (node.type === 'DeclarationBody'){
					return true;
				}
			}
			return false;
		},
		
		getPropertyValueProposals: function getPropertyValueProposals(params, node) {
			var proposals = [];
			var nodeParent = node.parent;
			if (nodeParent && nodeParent.property){
				var property = nodeParent.property.text;
				if (typeof property === 'string'){
					var valString = CSSLint.Properties[property];
					this._getComplexValueProposals(params, proposals, valString);
				}
			}
			return proposals;
		},
		
		_getComplexValueProposals: function _getComplexValueProposals(params, proposals, value){
			if (!value || typeof value !== 'string' || value.length === 0){
				return;
			}
			var namePrefix = params.prefix ? params.prefix : "";
			
			// Check for # or {1,4} postfix
			var test = /^(.*)(?:\#|\{.*\})$/.exec(value);
			if (test){
				this._getComplexValueProposals(params, proposals, test[1]);
			} else {
				// Check for [ a | b ] style values
				test = /^\[(.*)\]$/.exec(value);
				if (test) {
					this._getComplexValueProposals(params, proposals, test[1]);
				} else {
					// Check for OR'd values a | b
					var vals = value.split(/\s*\|\s*/);
					var val;
					if (vals.length === 1){
						val = vals[0].trim();
						if (value.match(/^\<.*\>$/)){
							// Typed value, lookup details
							if (value === '<background-image>' || value === '<color>' || value === '<image>'){
								// List all colors
								var colors = Object.keys(CSSLint.Colors);
								for (var i = 0; i < colors.length; i++) {
									if(jsUtil.looselyMatches(namePrefix, colors[i])) {
										// TODO Use value for documentation in hover
										var proposal = this.makeComputedProposal(colors[i], colors[i], null, null, params.prefix);
										proposals.push(proposal);
									}
								}
							} else {
								// Lookup in value type table
								var type = CSSLint.ValidationTypes.simple[value];
								if (!type){
									type = CSSLint.ValidationTypes.complex[value];
								}
								if (type && typeof type === 'string'){
									this._getComplexValueProposals(params, proposals, type);
								} else if (proposals.length === 0){
									// Provide default inherit and initial proposals if we have nothing else
									if(jsUtil.looselyMatches(namePrefix, 'inherit')) { //$NON-NLS-1$
										proposals.push(this.makeComputedProposal('inherit', 'inherit', null, null, params.prefix)); //$NON-NLS-1$ //$NON-NLS-2$
									}
									if(jsUtil.looselyMatches(namePrefix, 'initial')) { //$NON-NLS-1$
										proposals.push(this.makeComputedProposal('initial', 'initial', null, null, params.prefix)); //$NON-NLS-1$ //$NON-NLS-2$
									}
								}
							}
						} else if (jsUtil.looselyMatches(namePrefix, val)) {
							// Actual string value, offer a proposal
							proposal = this.makeComputedProposal(val, val, null, null, params.prefix);
							proposals.push(proposal);
						}
					} else {
						// Multiple OR values, recurse over each
						for (i = 0; i < vals.length; i++) {
							val = vals[i].trim();
							this._getComplexValueProposals(params, proposals, val);
						}
					}
				}
			}
		},
		
		getPropertyProposals: function getPropertyProposals(params) {
			var props = CSSLint.Properties;
			var propKeys = Object.keys(props);
			var proposals = [];
			var namePrefix = params.prefix ? params.prefix : "";
			for(var j = 0; j < propKeys.length; j++) {
				var prop = propKeys[j];
				if(jsUtil.looselyMatches(namePrefix, prop)) {
					// TODO Use templates to make drop down of potential values
					// TODO Add doc link to MDN
					// TODO Look ahead for an existing semicolon
					var proposal = this.makeComputedProposal(prop + ': ;', prop, null, null, params.prefix); //$NON-NLS-1$
					proposal.escapePosition = params.offset - namePrefix.length + prop.length + 2;
					proposals.push(proposal);
					
					
//					var hover = Object.create(null);
//					hover.type = 'markdown'; //$NON-NLS-1$
//					hover.content = "";
//					if (prop.doc){
//						hover.content += tag.doc;
//					}
//					if(prop.url) {
//						hover.content += i18nUtil.formatMessage(Messages['onlineDocumentation'], tag.url);
//					}
					
//					var proposalText = "";
//					var desc = "";
//					switch (tag.type) {
//						case 'single':
//							proposalText = "<" + tag.name + "></" + tag.name + ">"; //$NON-NLS-1$
////							desc = " - " + proposalText;
//							if (leadingBracket){
//								proposalText = proposalText.substring(1);
//							}
//							break;
//						case 'multi':
//							proposalText = "<" + tag.name + ">\n\n</" + tag.name + ">"; //$NON-NLS-1$
////							desc = " - " + proposalText;
//							if (leadingBracket){
//								proposalText = proposalText.substring(1);
//							}
//							break;
//						case 'empty':
//							proposalText = "<" + tag.name + "/>"; //$NON-NLS-1$
////							desc = " - " + proposalText;
//							if (leadingBracket){
//								proposalText = proposalText.substring(1);
//							}
//							break;
//						default:
//							proposalText = "<" + tag.name + ">";
////							desc = " - " + proposalText;
//							if (leadingBracket){
//								proposalText = proposalText.substring(1);
//							}
//							break;
//					}
//					if (tag.category === "Obsolete and deprecated elements"){
//						desc += Messages['obsoleteTagDesc'];
//					}
//					var proposal = this.makeComputedProposal(proposalText, tag.name, desc, hover, params.prefix);
//					// The prefix not being includes prevents content assist staying open while typing
////					if (source.charAt(params.offset - prefix.length - 1) === '<'){
////						prefix = '<' + prefix;
////						proposal.prefix = prefix;
////					}
//					proposal.escapePosition = params.offset - namePrefix.length + tag.name.length + 2;
//					if(leadingBracket){
//						proposal.escapePosition--;
//					}
//					proposals.push(proposal);
				}
			}
			return proposals;	
		},
		
		getRootProposals: function getRootProposals(params) {
			var proposals = [];
			var namePrefix = params.prefix ? params.prefix : "";
			for(var j = 0; j < sheetTemplates.length; j++) {
				var template = sheetTemplates[j];
				if(jsUtil.looselyMatches(namePrefix, template.prefix)) {
					var t = new mTemplates.Template(template.prefix, template.description, template.template);
					var prop = t.getProposal(params.prefix, params.offset, params);
					// TODO Fix insertion to remove prefix
//					prop.prefix = params.prefix;
					prop.style = 'emphasis'; //$NON-NLS-1$
					prop.kind = 'css'; //$NON-NLS-1$
					proposals.push(prop);
				}
			}
			return proposals;	
		},
		
		/**
		 * Factory-like function to create proposal objects
		 * @param {String} proposal The proposal text
		 * @param {String} name The name for the proposal
		 * @param {String} description The description for the proposal
		 * @param {Object} hover The markdown hover object for the proposal
		 * @param {String} prefix The prefix for the proposal
		 */
		makeComputedProposal: function(proposal, propName, description, hover, prefix) {
			return {
				proposal: proposal,
				relevance: 100,
				name: propName,
				description: description,
				hover: hover,
				prefix: prefix,
				style: 'emphasis', //$NON-NLS-1$
				overwrite: true,
				kind: 'css' //$NON-NLS-1$
		    };
		},
	});

	return {
		CssContentAssistProvider: CssContentAssistProvider
	};
});
