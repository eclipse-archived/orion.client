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
		computePrefix: function(editorContext, offset) {
			return editorContext.getText().then(function (text) {
				return text.substring(this._getPrefixStart(text, offset), offset);
			}.bind(this));
		},
		
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
		 * Computes the completions from the given AST and parameter context
		 * @param {Object} ast The AST to inspect
		 * @param {Object} params The paramter context
		 * @returns {Array.<Object>} The array of proposal objects or an empty array, never null
		 */
		_computeProposalsFromAst: function(ast, params) {
			var node = Util.findCssNodeAtOffset(ast, params.offset);
			if(node) {
				
				// De
				
				/*if (this.inDeclarationValue(node)){
					return this.getDeclarationValue(node);
				} else*/ if (this.inPropertyDeclaration(node)){
					return this.getProperties(node, params);
//				} else if (this.inBody(node)){
					// templates?
				}
				
				// TODO We can get the Validator as well to figure out potential values
			}
			return [];			
		},
		
		inPropertyDeclaration: function(node) {
			if (node){
				if (node.type === 'Declarations'){
					return true;
				}
			}
			return false;
		},  
		
		getProperties: function(node, params) {
			var props = CSSLint.Properties;
			var propKeys = Object.keys(props);
			var proposals = [];
			var namePrefix = params.prefix ? params.prefix : "";
			for(var j = 0; j < propKeys.length; j++) {
				var prop = propKeys[j];
				if(jsUtil.looselyMatches(namePrefix, prop)) {
					var proposal = this.makeComputedProposal(prop + ': ;', prop, null, null, params.prefix);
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
		
		/**
		 * Factory-like function to create proposal objects
		 * @param {String} proposal The proposal text
		 * @param {String} name The name for the proposal
		 * @param {String} description The description for the proposal
		 * @param {Object} hover The markdown hover object for the proposal
		 * @param {String} prefix The prefix for the proposal
		 */
		makeComputedProposal: function(proposal, name, description, hover, prefix) {
			return {
				proposal: proposal,
				relevance: 100,
				name: name,
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
