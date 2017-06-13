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
	'orion/i18nUtil',
	'csslint/csslint',
	'webtools/util',
	'javascript/util',
	'webtools/compilationUnit',
	'i18n!webtools/nls/messages'
], function(mTemplates, Objects, i18nUtil, CSSLint, Util, jsUtil, CU, Messages) {

	function CssContentAssistProvider(cssResultManager) {
		this.cssResultManager = cssResultManager;
	}
	
	CssContentAssistProvider.prototype = new mTemplates.TemplateContentAssist([], []);
	
	
	// TODO Support additional templates
	var ruleTemplates = [
		{
			prefix: "Rule", //$NON-NLS-1$
			description: Messages['elementRuleDescription'],
			template: "${element} {\n\t${cursor}\n}", //$NON-NLS-1$
			doc: Messages['elementRuleDoc'],
			url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax#CSS_rulesets" //$NON-NLS-1$
		},
		{
			prefix: "Rule", //$NON-NLS-1$
			description: Messages['idRuleDescription'],
			template: "#${id} {\n\t${cursor}\n}", //$NON-NLS-1$
			doc: Messages['idRuleDoc'],
			url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax#CSS_rulesets" //$NON-NLS-1$
		},
		{
			prefix: "Rule", //$NON-NLS-1$
			description: Messages['classRuleDescription'],
			template: "#${id} {\n\t${cursor}\n}", //$NON-NLS-1$
			doc: Messages['classRuleDoc'],
			url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax#CSS_rulesets" //$NON-NLS-1$
		},
	];
	//https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule
	var rootAtRuleTemplates = [
		{
			prefix: "@charset", //$NON-NLS-1$
			description: '@charset', //$NON-NLS-1$
			template: "@charset \"${charset}\";", //$NON-NLS-1$
			doc: Messages['charsetTemplateDoc'],
			url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@charset" //$NON-NLS-1$
		},
		{
			prefix: "@import", //$NON-NLS-1$
			description: '@import', //$NON-NLS-1$
			template: "@import \"${url}\";", //$NON-NLS-1$
			doc: Messages['importTemplateDoc'],
			url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@import" //$NON-NLS-1$
		},
		{
			prefix: "@namespace", //$NON-NLS-1$
			description: '@namespace', //$NON-NLS-1$
			template: "@namespace \"${url}\";", //$NON-NLS-1$
			doc: Messages['namespaceTemplateDoc'],
			url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@namespace" //$NON-NLS-1$ //$NON-NLS-1$
		}
	];
	//https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule
	var nestedAtRuleTemplates = [
		{
			prefix: "@media", //$NON-NLS-1$
			description: '@media', //$NON-NLS-1$
			template: "@media ${media-query-list} {\n\t${cursor}\n}", //$NON-NLS-1$
			doc: Messages['mediaTemplateDoc'],
			url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@media" //$NON-NLS-1$ //$NON-NLS-1$
		},
		{
			prefix: "@supports", //$NON-NLS-1$
			description: '@supports', //$NON-NLS-1$
			template: "@supports (${condition}) {\n\t${cursor}\n}", //$NON-NLS-1$
			doc: Messages['supportsTemplateDoc'],
			url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@supports" //$NON-NLS-1$ //$NON-NLS-1$
		},
		{
			prefix: "@page", //$NON-NLS-1$
			description: '@page', //$NON-NLS-1$
			template: "@page ${page-selector-list} {\n\t${cursor}\n}", //$NON-NLS-1$
			doc: Messages['pageTemplateDoc'],
			url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@page" //$NON-NLS-1$ //$NON-NLS-1$
		},
		{
			prefix: "@font-face", //$NON-NLS-1$
			description: '@font-face', //$NON-NLS-1$
			template: "@font-face {\n\tfont-family: \"${family-name}\";\n\tsrc: \"${url}\";\n}", //$NON-NLS-1$
			doc: Messages['font-faceTemplateDoc'],
			url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face" //$NON-NLS-1$ //$NON-NLS-1$
		},
		{
			prefix: "@keyframes", //$NON-NLS-1$
			description: '@keyframes', //$NON-NLS-1$
			template: "@keyframes ${name} {\n\t${cursor}\n}", //$NON-NLS-1$
			doc: Messages['keyframesTemplateDoc'],
			url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes" //$NON-NLS-1$ //$NON-NLS-1$
		},
//		{
//			prefix: "rgb", //$NON-NLS-1$
//			description: Messages['rgbColourTemplateDescription'],
//			template: "rgb(${red},${green},${blue});" //$NON-NLS-1$
//		},
//		{
//			prefix: "csslint", //$NON-NLS-1$
//			description: Messages['csslintTemplateDescription'],
//			template: "\/*csslint ${:" + fromJSON(csslintRules) + "}: ${a:" + fromJSON(severityValues) + "} *\/" //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
//		}
	];
	
	// TODO Selector templates
//		"elementSelector": "element",
//	"idSelector": "#id",
//	"classSelector": ".class",
//	"attributeSelector": "[attribute]",
	
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
				} else if (this.inConditionalAtRule(node)){
					return this.getConditionalAtRuleProposals(params);
				} else if (this.inRoot(node)){
					return this.getRootProposals(params);
				}
				// TODO This allows property completions inside of @page and other at-rules
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
		
		inConditionalAtRule: function inConditionalAtRule(node) {
			if (node){
				if (node.type === 'MediaBody'){
					return true;
				}
				if (node.type === 'SupportsBody'){
					return true;
				}
			}
			return false;
		},
		
		inRoot: function inRoot(node) {
			if (node){
				if (node.type === 'StyleSheet'){
					return true;
				}
				if (node.type === 'Selector'){
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
										var proposal = this._makeComputedProposal(colors[i], colors[i], null, null, params.prefix);
										proposal.tags = [{color: colors[i]}];
										proposals.push(proposal);
									}
								}
							} else {
								// Lookup in value type table
								var type = CSSLint.ValidationTypes.simple[value];
								if (!type){
									type = CSSLint.ValidationTypes.complex[value];
								}
								if (typeof type === 'string'){
									this._getComplexValueProposals(params, proposals, type);
								} else if (typeof type === 'object' && type.match && type.toString()){
									// Matcher object has a data string we can parse
									this._getComplexValueProposals(params, proposals, type.toString());
								} else if (proposals.length === 0){
									// Provide default inherit and initial proposals if we have nothing else
									if(jsUtil.looselyMatches(namePrefix, 'inherit')) { //$NON-NLS-1$
										proposals.push(this._makeComputedProposal('inherit', 'inherit', null, null, params.prefix)); //$NON-NLS-1$ //$NON-NLS-2$
									}
									if(jsUtil.looselyMatches(namePrefix, 'initial')) { //$NON-NLS-1$
										proposals.push(this._makeComputedProposal('initial', 'initial', null, null, params.prefix)); //$NON-NLS-1$ //$NON-NLS-2$
									}
								}
							}
						} else if (jsUtil.looselyMatches(namePrefix, val)) {
							// Actual string value, offer a proposal
							proposal = this._makeComputedProposal(val, val, null, null, params.prefix);
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
					// TODO Add doc link to MDN
					// TODO Look ahead for an existing semicolon
					var proposal = this._makeComputedProposal(prop + ': ;', prop, null, null, params.prefix); //$NON-NLS-1$
					proposal.escapePosition = params.offset - namePrefix.length + prop.length + 2;
					proposals.push(proposal);
					
				}
			}
			return proposals;	
		},
		
		getRootProposals: function getRootProposals(params) {
			var proposals = [];
			for(var i = 0; i < ruleTemplates.length; i++) {
				var prop = this._makeTemplateProposal(params, ruleTemplates[i]);
				if (prop){
					proposals.push(prop);
				}
			}
			for(var j = 0; j < rootAtRuleTemplates.length; j++) {
				prop = this._makeTemplateProposal(params, rootAtRuleTemplates[j]);
				if (prop){
					proposals.push(prop);
				}
			}
			for(var j = 0; j < nestedAtRuleTemplates.length; j++) {
				prop = this._makeTemplateProposal(params, nestedAtRuleTemplates[j]);
				if (prop){
					proposals.push(prop);
				}
			}
			return proposals;	
		},
		
		getConditionalAtRuleProposals: function getConditionalAtRuleProposals(params) {
			var proposals = [];
			for(var i = 0; i < ruleTemplates.length; i++) {
				var prop = this._makeTemplateProposal(params, ruleTemplates[i]);
				if (prop){
					proposals.push(prop);
				}
			}
			for(var j = 0; j < nestedAtRuleTemplates.length; j++) {
				prop = this._makeTemplateProposal(params, nestedAtRuleTemplates[j]);
				if (prop){
					proposals.push(prop);
				}
			}
			return proposals;	
		},
		
		_makeTemplateProposal: function _makeTemplateProposal(params, template){
			var namePrefix = params.prefix ? params.prefix : "";
			if(jsUtil.looselyMatches(namePrefix, template.prefix)) {
				var t = new mTemplates.Template(template.prefix, template.description, template.template);
				var prop = t.getProposal(params.prefix, params.offset, params);
				prop.prefix = params.prefix;
				prop.overwrite = true;
				prop.style = 'emphasis'; //$NON-NLS-1$
				prop.kind = 'css'; //$NON-NLS-1$
				
				if (template.doc || template.url){
					var hover = Object.create(null);
					hover.type = 'markdown'; //$NON-NLS-1$
					hover.content = "";
					if (template.doc){
						hover.content += template.doc;
					}
					if(template.url) {
						hover.content += i18nUtil.formatMessage(Messages['onlineDocumentation'], template.url);
					}
					prop.hover = hover;
				}
				return prop;
			}
		},
		
		/**
		 * Factory-like function to create proposal objects
		 * @param {String} proposal The proposal text
		 * @param {String} name The name for the proposal
		 * @param {String} description The description for the proposal
		 * @param {Object} hover The markdown hover object for the proposal
		 * @param {String} prefix The prefix for the proposal
		 */
		_makeComputedProposal: function _makeComputedProposal(proposal, propName, description, hover, prefix) {
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
