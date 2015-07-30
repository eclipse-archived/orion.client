/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2014 IBM Corporation and others.
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
	'webtools/util',
	'javascript/util',
	'webtools/attributes',
	'webtools/deprecatedAttributes',
	'webtools/tags',
	'i18n!webtools/nls/messages',
	'orion/i18nUtil'
], function(mTemplates, Objects, util, jsUtil, Attributes, Deprecated, Tags, Messages, i18nUtil) {

	var simpleDocTemplate = new mTemplates.Template("", Messages['simpleDocDescription'],
		"<!DOCTYPE html>\n" + //$NON-NLS-0$
		"<html lang=\"en\">\n" + //$NON-NLS-0$
		"<head>\n" + //$NON-NLS-0$
		"\t<meta charset=\"utf-8\">\n" + //$NON-NLS-0$
		"\t<title>${title}</title>\n" + //$NON-NLS-0$
		"</head>\n" + //$NON-NLS-0$
		"<body>\n" + //$NON-NLS-0$
		"\t<h1>${header}</h1>\n" + //$NON-NLS-0$
		"\t<p>\n" + //$NON-NLS-0$
		"\t\t${cursor}\n" + //$NON-NLS-0$
		"\t</p>\n" + //$NON-NLS-0$
		"</body>\n" + //$NON-NLS-0$
		"</html>"); //$NON-NLS-0$
		
//	var templates = [
//		{
//			tag: 'img', //$NON-NLS-1$
//			prefix: "<img", //$NON-NLS-1$
//			name: "<img>", //$NON-NLS-1$
//			description: Messages['imageElementDescription'],
//			template: "<img src=\"${URI}\" alt=\"${Image}\"/>", //$NON-NLS-1$
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img" //$NON-NLS-1$
//		},
//		{
//			tag: 'a', //$NON-NLS-1$
//			prefix: "<a", //$NON-NLS-1$
//			name: "<a>", //$NON-NLS-1$
//			description: Messages['anchorElementDescription'],
//			template: "<a href=\"${cursor}\"></a>", //$NON-NLS-1$
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a" //$NON-NLS-1$
//		},
//		{
//			tag: 'ul', //$NON-NLS-1$
//			prefix: "<ul", //$NON-NLS-1$
//			name: "<ul>", //$NON-NLS-1$
//			description: Messages['ulElementDescription'],
//			template: "<ul>\n\t<li>${cursor}</li>\n</ul>", //$NON-NLS-1$
//			url: 'https://developer.mozilla.org/en/docs/Web/HTML/Element/ul' //$NON-NLS-1$
//		},
//		{
//			tag: 'ol', //$NON-NLS-1$
//			prefix: "<ol", //$NON-NLS-1$
//			name: "<ol>", //$NON-NLS-1$
//			description: Messages['olElementDescription'],
//			template: "<ol>\n\t<li>${cursor}</li>\n</ol>", //$NON-NLS-1$
//			url: 'https://developer.mozilla.org/en/docs/Web/HTML/Element/ol' //$NON-NLS-1$
//		},
//		{
//			tag: 'dl', //$NON-NLS-1$
//			prefix: "<dl", //$NON-NLS-1$
//			name: "<dl>", //$NON-NLS-1$
//			description: Messages['dlElementDescription'],
//			template: "<dl>\n\t<dt>${cursor}</dt>\n\t<dd></dd>\n</dl>", //$NON-NLS-1$
//			url: 'https://developer.mozilla.org/en/docs/Web/HTML/Element/dl' //$NON-NLS-1$
//		},
//		{
//			tag: 'table', //$NON-NLS-1$
//			prefix: "<table", //$NON-NLS-1$
//			name: "<table>", //$NON-NLS-1$
//			description: Messages['basicTableDescription'],
//			template: "<table>\n\t<tr>\n\t\t<td>${cursor}</td>\n\t</tr>\n</table>", //$NON-NLS-1$
//			url: 'https://developer.mozilla.org/en/docs/Web/HTML/Element/table' //$NON-NLS-1$
//		},
//	];
//
//	//elements that are typically placed on a single line (e.g., <b>, <h1>, etc)
//	var element, template, description, i;
//	var singleLineElements = [
//		"abbr","b","button","canvas","cite", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"command","dd","del","dfn","dt", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"em","embed","font","h1","h2", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"h3","h4","h5","h6","i", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"ins","kbd","label","li","mark", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"meter","object","option","output","progress", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"q","rp","rt","samp","small", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"strong","sub","sup","td","time", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"title","tt","u","var" //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//	];
//	for (i = 0; i < singleLineElements.length; i++) {
//		element = singleLineElements[i];
//		description = "<" + element + "></" + element + ">"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//		template = "<" + element + ">${cursor}</" + element + ">"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//		templates.push({prefix: "<" + element, description: description, template: template}); //$NON-NLS-0$
//	}
//
//	//elements that typically start a block spanning multiple lines (e.g., <p>, <div>, etc)
//	var multiLineElements = [
//		"address","article","aside","audio","bdo", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"blockquote","body","caption","code","colgroup", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"datalist","details","div","fieldset","figure", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"footer","form","head","header","hgroup", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"iframe","legend","map","menu","nav", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"noframes","noscript","optgroup","p","pre", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"ruby","script","section","select","span", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"style","tbody","textarea","tfoot","th", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
//		"thead","tr","video" //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//	];
//	for (i = 0; i < multiLineElements.length; i++) {
//		element = multiLineElements[i];
//		description = "<" + element + "></" + element + ">"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//		template = "<" + element + ">\n\t${cursor}\n</" + element + ">"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//		templates.push({prefix: "<" + element, description: description, template: template}); //$NON-NLS-0$
//	}
//
//	//elements with no closing element (e.g., <hr>, <br>, etc)
//	var emptyElements = [
//		"area","base","br","col", //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-4$
//		"hr","input","link","meta", //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-4$
//		"param","keygen","source" //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-4$
//	];
//	for (i = 0; i < emptyElements.length; i++) {
//		element = emptyElements[i];
//		template = description = "<" + element + "/>"; //$NON-NLS-1$ //$NON-NLS-2$
//		templates.push({prefix: "<" + element, description: description, template: template}); //$NON-NLS-1$
//	}

	/**
	 * @name orion.editor.HTMLContentAssistProvider
	 * @description Creates a new HTML content assist provider
	 * @class Provides content assist for HTML.
	 * @param {HtmlAstManager} htmlAstManager The backing AST manager
	 */
	function HTMLContentAssistProvider(htmlAstManager) {
		this.astmanager = htmlAstManager;
	}
	
	HTMLContentAssistProvider.prototype = new mTemplates.TemplateContentAssist([], []);
	
	Objects.mixin(HTMLContentAssistProvider.prototype, {
		/**
		 * @callback 
		 */
		computeContentAssist: function(editorContext, params) {
			var that = this;
			return this.astmanager.getAST(editorContext).then(function(ast) {
				// template - simple html document
				if (ast.source.length === 0) {
					return [simpleDocTemplate.getProposal("", params.offset, params)];
				}
				var proposals = that.computeProposalsFromAst(ast, params);
				if(proposals.length > 0 && proposals[0].unselectable) {
					//already sorted, only templates. hack until we break out template computation
					return proposals;
				}
				return proposals;
			});
		},
		/**
		 * Computes the completions from the given AST and parameter context
		 * @param {Object} ast The AST to inspect
		 * @param {Object} params The paramter context
		 * @returns {Array.<Object>} The array of proposal objects or an empty array, never null
		 * @since 10.0 
		 */
		computeProposalsFromAst: function(ast, params) {
			var proposals = [];
			var node = util.findNodeAtOffset(ast, params.offset);
			if(node) {
				if(this.inScriptOrStyle(node) || this.inClosingTag(node, params.offset, ast.source)) {
					return [];
				}
				if (this.isCompletingCommentClose(node, params.offset)){
					return this.getComment(node, false);
				} else if (this.isCompletingAttributeValue(node, ast.source, params)) {
					return this.getValuesForAttribute(node, params);
				} else if (this.isCompletingTagAttribute(node, ast.source, params)) {
					return this.getAttributesForNode(node, params);
				} else if (this.isCompletingTag(node, params)){
					if (this.isCompletingCommentOpen(node)){
						return this.getComment(node, true);
					} else {
						return this.getTags(ast.source, params);
					}
				} else {
					return this.getProposalsForTextContent(node, ast.source, params);
				}
			} else {
				// If the user has no completed tags, still offer tag templates
				// TODO Can be removed if the parser creates text node for unfinished tags Bug 472659
				if (ast.source.match(/^\s*<?\s*$/)) {
					return this.getTags(ast.source, params);
				}
			}
			return proposals;
		},
		
		/**
		 * Returns if the tag block that we are in is a style of script block
		 * @param {Object} node The node
		 * @returns {Boolean} True if the current node context is style or script
		 * @since 10.0 
		 */
		inScriptOrStyle: function(node) {
			if(node) {
				var _n = node.name ? node.name.toLowerCase() : '';
				if(node.type === 'tag' && (_n === 'script' || _n === 'style')) {
					return true;
				} else {
					return this.inScriptOrStyle(node.parent);
				}
			}
			return false;
		},  
		
		/**
		 * Returns if the offset is in a closing tag. A closing tag is determined as an 
		 * offset past the last child but before the closing range of the tag itself
		 * @param {Object} node The AST not context
		 * @param {Number} offset The curren offset
		 * @param {String} source The source 
		 */
		inClosingTag: function(node, offset, source) {
			if(node && source) {
				switch(node.type) {
					case 'tag': {
						var _s = source.slice(node.range[0], node.range[1]);
						var _r = new RegExp("<\\s*\/\\s*"+node.name+"\\s*>$");
						var _m = _r.exec(_s);
						if(_m) {
							return offset > (_m.index+node.range[0]) && offset < node.range[1];
						}
						break;
					}
					default: {
						var _p = node.parent;
						if(_p && _p.type === 'tag') {
							return Array.isArray(_p.children) && (offset > _p.children[_p.children.length-1].range[1]) && offset <= _p.range[1];
						}
						break;
					}
				}
			}
			return false;
		},
		
		/**
		 * Computes if we are trying to complete a comment start or end
		 * @param {Object} node The AST node to check with the offset
		 * @returns {Boolean} True if we are completing a comment, false otherwise 
		 * @since 10.0 
		 */
		isCompletingCommentClose: function(node, offset) {
			return node && node.type === 'comment' && offset >= node.range[0] && offset <= node.range[1];
		},
		
		/**
		 * Computes if we are trying to complete an open comment
		 * @param {Object} node The AST node to check with the offset
		 * @returns {Boolean} True if we are completing a comment, false otherwise 
		 * @since 10.0 
		 */
		isCompletingCommentOpen: function(node) {
			if(node 	&& node.type === 'tag' && node.name.match(/^!-{0,2}$/)){
				return true;
			}
			return false;
		},
		
		/**
		 * Computes if we are trying to complete tag attributes
		 * @param {Object} node The AST node to check with the offset
		 * @param {String} source The backing source
		 * @param {Object} params The parameters
		 * @returns {Boolean} True if we are completing the attributes of a tag, false otherwise 
		 * @since 10.0 
		 */
		isCompletingTagAttribute: function(node, source, params) {
			if(node) {
				var offset = params.offset;
				if(node.type === 'tag') {
					var _n = node.name;
					if(node.range[0]+_n.length < offset) {
						var idx = offset;
						while(idx < node.range[1]) {
							var char = source[idx];
							if(char === '<') {
								return false;
							} else if(char === '>') {
								return true;
							}
							idx++;
						}
					}
				} else if(node.type === 'attr') {
					return offset >= node.range[0] || offset <= node.range[1];
				}
			}
			return false;
		},
		
		/**
		 * Computes if we are trying to complete a tag
		 * @param {Object} node The AST node to check with the offset
		 * @param {Object} params The parameters
		 * @returns {Boolean} True if we are completing a tag, false otherwise 
		 * @since 10.0 
		 */
		isCompletingTag: function(node, params) {
			if(node) {
				var offset = params.offset;
				if(node.type === 'tag') {
					if (offset >= node.range[0] && offset <= node.range[1]){
						return true;
					}
 				}
			}
			return false;
		},
		
		/**
		 * Returns the tag proposals for the current offset
		 * @function
		 * @param {Object} source The source in the buffer
		 * @param {Object} params the parameters, including the offset in the source
		 * @returns returns {Array.<Object>} The array of proposals
		 */
		getTags: function(source, params) {
			var tags = Tags.tagTemplates;
			var proposals = [];
			for(var j = 0; j < tags.length; j++) {
				var tag = tags[j];
				var namePrefix = params.prefix ? params.prefix : "";
				var leadingBracket = false;
				if (source.charAt(params.offset - namePrefix.length - 1) === '<'){
					leadingBracket = true;
				}
				if(jsUtil.looselyMatches(namePrefix, tag.name)) {
					var hover = Object.create(null);
					hover.type = 'markdown'; //$NON-NLS-1$
					hover.content = "";
					if (tag.category === "Obsolete and deprecated elements"){
						hover.content += Messages['obsoleteTag'];
					}
					if (tag.doc){
						hover.content += tag.doc;
					}
					if(tag.url) {
						hover.content += i18nUtil.formatMessage(Messages['onlineDocumentation'], tag.url);
					}
					var proposalText = "";
					var desc = "";
					// TODO Allow tags to have custom templates
					tag.type = 'single'; //$NON-NLS-1$
					switch (tag.type) {
						case 'single':
							proposalText = "<" + tag.name + "></" + tag.name + ">"; //$NON-NLS-1$
//							desc = " - " + proposalText; //$NON-NLS-1$
							if (leadingBracket){
								proposalText = proposalText.substring(1);
							}
							break;
						case 'multi':
							proposalText = "<" + tag.name + ">\n\n</" + tag.name + ">"; //$NON-NLS-1$
//							desc = " - " + proposalText; //$NON-NLS-1$
							if (leadingBracket){
								proposalText = proposalText.substring(1);
							}
							break;
						case 'empty':
							proposalText = "<" + tag.name + "/>"; //$NON-NLS-1$
//							desc = " - " + proposalText; //$NON-NLS-1$
							if (leadingBracket){
								proposalText = proposalText.substring(1);
							}
							break;
						default:
							proposalText = "<" + tag.name + ">";
//							desc = " - " + proposalText; //$NON-NLS-1$
							if (leadingBracket){
								proposalText = proposalText.substring(1);
							}
							break;
					}
					if (tag.category === "Obsolete and deprecated elements"){
						desc += Messages['obsoleteTagDesc'];
					}
					var proposal = this.makeComputedProposal(proposalText, tag.name, desc, hover, params.prefix); //$NON-NLS-1$
					// The prefix not being includes prevents content assist staying open while typing
//					if (source.charAt(params.offset - prefix.length - 1) === '<'){
//						prefix = '<' + prefix;
//						proposal.prefix = prefix;
//					}
					proposal.escapePosition = params.offset - namePrefix.length + tag.name.length + 2;
					if(leadingBracket){
						proposal.escapePosition--;
					}
					proposals.push(proposal);
				}
			}
			return proposals;	
		},
		
		/**
		 * Returns the attributes that can be used in the specified tag
		 * @param {Object} node The AST node for the tag we are completing within
		 * @param {Object} params The parameters
		 * @returns {Array.<Object>} The array of proposals
		 * @since 10.0 
		 */
		getAttributesForNode: function(node, params) {
			var attrs = Attributes.getAttributesForNode(node);
			var proposals = [];
			if(Array.isArray(attrs.global)) {
				proposals = proposals.concat(this.addProposals(node, attrs.global, params));
			}
			if(Array.isArray(attrs.formevents)) {
				var arr = this.addProposals(node, attrs.formevents, params);
				if(arr.length > 0) {
					proposals.push({
							proposal: '',
							description: Messages['formeventsHeader'],
							style: 'noemphasis_title', //$NON-NLS-1$
							unselectable: true,
							kind: 'html' //$NON-NLS-1$
					});
					proposals = proposals.concat(arr);
				}

			}
			if(Array.isArray(attrs.keyboardevents)) {
				arr = this.addProposals(node, attrs.keyboardevents, params);
				if(arr.length > 0) {
					proposals.push({
							proposal: '',
							description: Messages['keyboardeventsHeader'],
							style: 'noemphasis_title', //$NON-NLS-1$
							unselectable: true,
							kind: 'html' //$NON-NLS-1$
					});
					proposals = proposals.concat(arr);
				}

			}
			if(Array.isArray(attrs.mouseevents)) {
				arr = this.addProposals(node, attrs.mouseevents, params);
				if(arr.length > 0) {
					proposals.push({
							proposal: '',
							description: Messages['mouseeventsHeader'],
							style: 'noemphasis_title', //$NON-NLS-1$
							unselectable: true,
							kind: 'html' //$NON-NLS-1$
						});
					proposals = proposals.concat(arr);
				}

			}
			if(Array.isArray(attrs.windowevents) && attrs.windowevents.length > 0) {
				arr = this.addProposals(node, attrs.windowevents, params);
				if(arr.length > 0) {
					proposals.push({
							proposal: '',
							description: Messages['windoweventsHeader'],
							style: 'noemphasis_title', //$NON-NLS-1$
							unselectable: true,
							kind: 'html' //$NON-NLS-1$
						});
					proposals = proposals.concat(arr);
				}

			}
			return proposals;	
		},
		
		addProposals: function addProposals(node, attrs, params) {
			var proposals = [];
			for(var j = 0; j < attrs.length; j++) {
				var attr = attrs[j];
				var prefix = params.prefix ? params.prefix : "";
				if(jsUtil.looselyMatches(prefix, attr.name) && !this._hasAttribute(node, attr.name)) {
					var deprecated = Deprecated.isAttributeDeprecated(node.name, attr.name);
					var hover = Object.create(null);
					var desc = "";
					hover.type = 'markdown'; //$NON-NLS-1$
					hover.content = "";
					if (deprecated){
						hover.content += i18nUtil.formatMessage(Messages['obsoleteAttr'], deprecated);
						desc += Messages['obsoleteAttrDesc'];
					}
					if (attr.doc){
						hover.content += attr.doc;
					}
					if(attr.url) {
						hover.content += i18nUtil.formatMessage(Messages['onlineDocumentation'], attr.url);
					}
					var proposalText = attr.name+'=""'; //$NON-NLS-1$
					var proposal = this.makeComputedProposal(proposalText, attr.name, desc, hover, prefix); //$NON-NLS-1$
					proposal.escapePosition = params.offset - prefix.length + attr.name.length + 2;
					proposals.push(proposal);
				}
			}
			proposals.sort(function(l,r) {
				//sort by relevance and then by name
				if(typeof(l.relevance) === 'undefined') {
					l.relevance = 1;
				}
				if(typeof(r.relevance) === 'undefined') {
					r.relevance = 1;
				}
				if (l.relevance > r.relevance) {
					return -1;
				} else if (r.relevance > l.relevance) {
					return 1;
				}
				var ldesc = l.name;
				var rdesc = r.name;
				if (ldesc < rdesc) {
					return -1;
				} else if (rdesc < ldesc) {
					return 1;
				}
				return 0;
			});
			return proposals;
		},
		
		/**
		 * Returns a comment open/close proposal or an empty array
		 * @param {Object} node The AST node for the tag we are completing within
		 * @param {Boolean} open If true will propose open comment proposals, otherwise return close comment
		 * @returns {Array.<Object>} The array of proposals
		 * @since 10.0 
		 */
		getComment: function(node, open) {
			var proposals = [];
			if (open){
				var prefix = '<' + node.name;
				proposals.push(this.makeComputedProposal("<!-- ", Messages['openCommentName'], " - <!-- -->", null, prefix)); //$NON-NLS-1$ //$NON-NLS-2$
			} else {
				if (node.data.length > 0){
					prefix = "";
					if (node.data.charAt(node.data.length-1) === '-'){
						prefix += '-';
						if (node.data.charAt(node.data.length-2) === '-'){
							prefix += '-';
						}
					}
					proposals.push(this.makeComputedProposal("-->", Messages['closeCommentName'], " - <!-- -->", null, prefix)); //$NON-NLS-1$ //$NON-NLS-2$
				}
			}
			return proposals;	
		},
		
		
		/**
		 * @description Returns true if the node has the given attribute already
		 * @param {Object} node The AST node to check
		 * @param {String} attribute the name of the attribute
		 * @returns {Boolean} True if the node has the given attribute, false otherwise
		 */
		_hasAttribute: function(node, attribute) {
			return node && node.type === 'tag' && typeof(node.attributes) === 'object' && attribute && !!node.attributes[attribute];			
		},
		
		/**
		 * Returns the options (if any) that can be used in the specified attribute
		 * @param {Object} node The AST node for the attribute we are completing within
		 * @param {Object} params The parameters
		 * @returns {Array.<Object>} The array of proposals
		 * @since 10.0 
		 */
		getValuesForAttribute: function(node, params) {
			//TODO compute the options for the given attribute
			return [];	
		},
		/**
		 * Returns any proposals (if any) for when the user is editing text contents based upon
		 * state of the AST.  Templates are added to this list.
		 * @param {Object} node The AST node for the attribute we are completing within
		 * @param {String} source The backing source
		 * @param {Object} params The parameters
		 * @returns {Array.<Object>} The array of proposals
		 * @since 10.0 
		 */
		getProposalsForTextContent: function(node, source, params) {
			if (node){
				var startTag;
				// If text content is a '/' offer to close the tag
				// If we have an uncompleted tag '</' offer to complete the tag
				if (node.type === 'text' && node.parent && node.parent.type === 'tag'){
					startTag = node.parent;
				} else if (node.type === 'tag' && (params.offset > node.range[1] || params.offset < node.range[0])){
					startTag = node;
				}
				if (startTag){
					var preceding = source.substring(0, params.offset);
					var match = preceding.match(/<?\/$/);
					if (match){
						var name = '</' + startTag.name + '>'; //$NON-NLS-1$
						var desc = i18nUtil.formatMessage(Messages['closeTagDescription'], startTag.name);
						return [this.makeComputedProposal(name, name, desc, null, match[0])];
					}
				}
			}
			return this.getTags(source, params);	
		},
		
		/**
		 * Computes if we are trying to complete attributes
		 * @param {Object} node The AST node to check with the offset
		 * @param {String} source The backing source
		 * @param {Object} params The parameters
		 * @returns {Boolean} True if we are completing the attributes of a tag, false otherwise 
		 * @since 10.0 
		 */
		isCompletingAttributeValue: function(node, source, params) {
			if(node && node.type === 'attr') {
				return this.within('"', '"', source, params.offset, node.range) || //$NON-NLS-1$ //$NON-NLS-2$
						this.within("'", "'", source, params.offset, node.range); //$NON-NLS-1$ //$NON-NLS-2$
			}
			return false;
		},
		
		/**
		 * Factory-like function to create proposal objects
		 * @param {String} proposal The proposal text
		 * @param {String} name The name for the proposal
		 * @param {String} description The description for the proposal
		 * @param {Object} hover The markdown hover object for the proposal
		 * @param {String} prefix The prefix for the proposal
		 * @since 10.0   
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
				kind: 'html' //$NON-NLS-1$
		    };
		},
		
		/**
		 * A util method to determine if the caret is within two given chars, that are found within 
		 * the given bounds
		 * @param {String} start The char to the LHS
		 * @param {String} end The char to the RHS
		 * @param {String} source The source to check against
		 * @param {Number} offset   
		 */
		within: function(start, end, source, offset, bounds) {
			var idx = offset;
			var _c;
			var before = false;
			while(idx > bounds[0]) {
				_c = source[idx];
				if(_c === start) {
					before = true;
					break;
				}
				idx--;
			}
			if(before) {
				idx = offset;
				while(idx < bounds[1]) {
					_c = source[idx];
					if(_c === end) {
						return true;
					}
					idx++;
				}
			}
			return false;
		}
	});

	return {
		HTMLContentAssistProvider: HTMLContentAssistProvider
	};
});
