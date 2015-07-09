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
	'i18n!webtools/nls/messages',
	'orion/i18nUtil'
], function(mTemplates, Objects, util, jsUtil, Attributes, Messages, i18nUtil) {

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
		
	var templates = [
		{
			tag: 'img', //$NON-NLS-1$
			prefix: "<img", //$NON-NLS-1$
			name: "<img>", //$NON-NLS-1$
			description: Messages['imageElementDescription'],
			template: "<img src=\"${URI}\" alt=\"${Image}\"/>", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img" //$NON-NLS-1$
		},
		{
			tag: 'a', //$NON-NLS-1$
			prefix: "<a", //$NON-NLS-1$
			name: "<a>", //$NON-NLS-1$
			description: Messages['anchorElementDescription'],
			template: "<a href=\"${cursor}\"></a>", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a" //$NON-NLS-1$
		},
		{
			tag: 'ul', //$NON-NLS-1$
			prefix: "<ul", //$NON-NLS-1$
			name: "<ul>", //$NON-NLS-1$
			description: Messages['ulElementDescription'],
			template: "<ul>\n\t<li>${cursor}</li>\n</ul>", //$NON-NLS-1$
			url: 'https://developer.mozilla.org/en/docs/Web/HTML/Element/ul' //$NON-NLS-1$
		},
		{
			tag: 'ol', //$NON-NLS-1$
			prefix: "<ol", //$NON-NLS-1$
			name: "<ol>", //$NON-NLS-1$
			description: Messages['olElementDescription'],
			template: "<ol>\n\t<li>${cursor}</li>\n</ol>", //$NON-NLS-1$
			url: 'https://developer.mozilla.org/en/docs/Web/HTML/Element/ol' //$NON-NLS-1$
		},
		{
			tag: 'dl', //$NON-NLS-1$
			prefix: "<dl", //$NON-NLS-1$
			name: "<dl>", //$NON-NLS-1$
			description: Messages['dlElementDescription'],
			template: "<dl>\n\t<dt>${cursor}</dt>\n\t<dd></dd>\n</dl>", //$NON-NLS-1$
			url: 'https://developer.mozilla.org/en/docs/Web/HTML/Element/dl' //$NON-NLS-1$
		},
		{
			tag: 'table', //$NON-NLS-1$
			prefix: "<table", //$NON-NLS-1$
			name: "<table>", //$NON-NLS-1$
			description: Messages['basicTableDescription'],
			template: "<table>\n\t<tr>\n\t\t<td>${cursor}</td>\n\t</tr>\n</table>", //$NON-NLS-1$
			url: 'https://developer.mozilla.org/en/docs/Web/HTML/Element/table' //$NON-NLS-1$
		},
		{
			prefix: "<!--", //$NON-NLS-1$
			name: "<!-- -->", //$NON-NLS-1$
			description: Messages['htmlCommentDescription'],
			template: "<!-- ${cursor} -->", //$NON-NLS-1$
			url: 'https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Introduction#Comments_and_doctype' //$NON-NLS-1$
		}
	];

	//elements that are typically placed on a single line (e.g., <b>, <h1>, etc)
	var element, template, description, i;
	var singleLineElements = [
		"abbr","b","button","canvas","cite", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"command","dd","del","dfn","dt", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"em","embed","font","h1","h2", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"h3","h4","h5","h6","i", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"ins","kbd","label","li","mark", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"meter","object","option","output","progress", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"q","rp","rt","samp","small", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"strong","sub","sup","td","time", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"title","tt","u","var" //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	];
	for (i = 0; i < singleLineElements.length; i++) {
		element = singleLineElements[i];
		description = "<" + element + "></" + element + ">"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		template = "<" + element + ">${cursor}</" + element + ">"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		templates.push({prefix: "<" + element, description: description, template: template}); //$NON-NLS-0$
	}

	//elements that typically start a block spanning multiple lines (e.g., <p>, <div>, etc)
	var multiLineElements = [
		"address","article","aside","audio","bdo", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"blockquote","body","caption","code","colgroup", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"datalist","details","div","fieldset","figure", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"footer","form","head","header","hgroup", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"iframe","legend","map","menu","nav", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"noframes","noscript","optgroup","p","pre", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"ruby","script","section","select","span", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"style","tbody","textarea","tfoot","th", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
		"thead","tr","video" //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	];
	for (i = 0; i < multiLineElements.length; i++) {
		element = multiLineElements[i];
		description = "<" + element + "></" + element + ">"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		template = "<" + element + ">\n\t${cursor}\n</" + element + ">"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		templates.push({prefix: "<" + element, description: description, template: template}); //$NON-NLS-0$
	}

	//elements with no closing element (e.g., <hr>, <br>, etc)
	var emptyElements = [
		"area","base","br","col", //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-4$
		"hr","input","link","meta", //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-4$
		"param","keygen","source" //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-4$
	];
	for (i = 0; i < emptyElements.length; i++) {
		element = emptyElements[i];
		template = description = "<" + element + "/>"; //$NON-NLS-1$ //$NON-NLS-2$
		templates.push({prefix: "<" + element, description: description, template: template}); //$NON-NLS-1$
	}

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
		getPrefix: function(buffer, offset, context) {
			var prefix = "";
			var index = offset;
			while (index && /[A-Za-z0-9<!-]/.test(buffer.charAt(index - 1))) {
				index--;
				prefix = buffer.substring(index, offset);
				// If the user has opened a new tag, stop the prefix there
				if (buffer.charAt(index) === '<'){
					return prefix;
				}
			}
			return prefix;
		},
		/**
		 * @callback 
		 */
		computeProposals: function(source, offset, params) {
			var proposals = mTemplates.TemplateContentAssist.prototype.computeProposals.call(this, source, params.offset, params);
			for(var i = 0; i < proposals.length; i++) {
				if(!proposals[i].proposal) {
					continue;
				}
				proposals[i].style = 'emphasis'; //$NON-NLS-1$
				var obj = Object.create(null);
		        obj.type = 'markdown'; //$NON-NLS-1$
		        obj.content = Messages['templateSourceHeading'];
		        obj.content += proposals[i].proposal;
		        if(proposals[i].url) {
		        	obj.content += i18nUtil.formatMessage(Messages['onlineDocumentation'], proposals[i].url);
		        }
		        proposals[i].hover = obj;
			}
			return proposals;
		},
		/**
		 * @callback 
		 */
		getTemplates: function() {
			if(this._templates && this._templates.length > 1) {
				return this._templates;
			} else {
				//init them
			}
			for (var j = 0; j < templates.length; j++) {
				var _t = new mTemplates.Template(templates[j].prefix, templates[j].description, templates[j].template, templates[j].name);
				if(templates[j].url) {
					_t.url = templates[j].url;
				}
				this._templates.push(_t);
			}
			return this._templates;
		},
		getTemplateProposals: function(prefix, offset, context) {
			var proposals = [];
			var _templates = this.getTemplates();
			for (var t = 0; t < _templates.length; t++) {
				var _template = _templates[t];
				if (_template.match(prefix)) {
					var proposal = _template.getProposal(prefix, offset, context);
					if(_template.url) {
						proposal.url = _template.url;
					}
					this.removePrefix(prefix, proposal);
					proposal.kind = 'html'; //$NON-NLS-1$
					proposals.push(proposal);
				}
			}
			
			if (0 < proposals.length) {
				//sort the proposals by name
				proposals.sort(function(p1, p2) {
					if (p1.name < p2.name) return -1;
					if (p1.name > p2.name) return 1;
					return 0;
				});
				// if any templates were added to the list of 
				// proposals, add a title as the first element
				proposals.splice(0, 0, {
					proposal: '',
					description: 'Templates', //$NON-NLS-0$
					style: 'noemphasis_title', //$NON-NLS-0$
					unselectable: true
				});
			}
			
			return proposals;
		},
		/**
		 * Called by the framework to initialize this provider before any <tt>computeContentAssist</tt> calls.
		 */
		initialize: function() {
		    //override
		},
        
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
				return proposals.sort(function(l,r) {
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
				//are we in the attrib area or between tag elements?
				if(this.completingAttributes(node, ast.source, params)) {
					return this.getOptionsForAttribute(node, params);
				} else if(this.completingTagAttributes(node, ast.source, params)) {
					return this.getAttributesForNode(node, params);
				} else {
					var textContentProposals = this.getProposalsForTextContent(node, ast.source, params);
					if (textContentProposals.length > 0){
						return textContentProposals;
					}
					return this.computeProposals(ast.source, params.offset, params);
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
		 * Computes if we are trying to complete tag attributes
		 * @param {Object} node The AST node to check with the offset
		 * @param {String} source The backing source
		 * @param {Object} params The parameters
		 * @returns {Boolean} True if we are completing the attributes of a tag, false otherwise 
		 * @since 10.0 
		 */
		completingTagAttributes: function(node, source, params) {
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
		 * Returns the attributes that can be used in the specified tag
		 * @param {Object} node The AST node for the tag we are completing within
		 * @param {Object} params The parameters
		 * @returns {Array.<Object>} The array of proposals
		 * @since 10.0 
		 */
		getAttributesForNode: function(node, params) {
			var attrs = Attributes.getAttributesForNode(node);
			var proposals = [];
			for(var i = 0; i < attrs.length; i++) {
				var attr = attrs[i];
				if(jsUtil.looselyMatches(params.prefix, attr.name)) {
					var _h = Object.create(null);
					 _h.type = 'markdown'; //$NON-NLS-1$
			         _h.content = attr.doc;
			        if(attr.url) {
			        	_h.content += i18nUtil.formatMessage(Messages['onlineDocumentation'], attr.url);
			        }
			        var _p = this.makeComputedProposal(attr.name, " ", _h, params.prefix); //$NON-NLS-1$
			        _p.proposal = attr.name+'=""'; //$NON-NLS-1$
			        _p.escapePosition = params.offset - params.prefix.length + attr.name.length + 2;
					proposals.push(_p);
				}
			}
			return proposals;	
		},
		/**
		 * Returns the options (if any) that can be used in the specified attribute
		 * @param {Object} node The AST node for the attribute we are completing within
		 * @param {Object} params The parameters
		 * @returns {Array.<Object>} The array of proposals
		 * @since 10.0 
		 */
		getOptionsForAttribute: function(node, params) {
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
			if (node && node.parent && node.parent.type === 'tag'){
				var preceding = this.getPrecedingCharacters(source, params.offset, 10);
				var match = preceding.match(/<?\s*\/\s*$/)
				if (match){
					var name = '</' + node.parent.name + '>'; //$NON-NLS-1$
					var desc = ' - Close the ' + node.parent.name + ' tag';
					return [this.makeComputedProposal(name, desc, null, match[0])];
				}
			}
			return [];	
		},
		
		/**
		 * @name getPrecedingCharacters
		 * @description Returns the characters previous to the offset up to the given count
		 * @function
		 * @param source {String} source to lookup characters in
		 * @param offset {Number} the offset to begin counting at
		 * @param count {Number} the number of preceding characters to return, defaults to 1
		 * @returns returns {String} containing the preceding characters or an empty string
		 * @private
		 */
		getPrecedingCharacters: function getPrecedingCharacters(source, offset, count) {
			var result = "";
			if (!source || !offset){
				return result;
			}
			var index = count ? count : 1;
			while (index > 0 && (offset-index > 0) && (offset-index) < source.length){
				result += source[offset-index];
				index--;
			}
			return result;
		},
		
		/**
		 * Computes if we are trying to complete attributes
		 * @param {Object} node The AST node to check with the offset
		 * @param {String} source The backing source
		 * @param {Object} params The parameters
		 * @returns {Boolean} True if we are completing the attributes of a tag, false otherwise 
		 * @since 10.0 
		 */
		completingAttributes: function(node, source, params) {
			if(node && node.type === 'attr') {
				return this.within('"', '"', source, params.offset, node.range) || //$NON-NLS-1$ //$NON-NLS-2$
						this.within("'", "'", source, params.offset, node.range); //$NON-NLS-1$ //$NON-NLS-2$
			}
			return false;
		},
		
		/**
		 * Factory-like function to create proposal objects
		 * @param {String} name The name for the proposal
		 * @param {String} description The description for the proposal
		 * @param {Object} hover The markdown hover object for the proposal
		 * @param {String} prefix The prefix for the proposal
		 * @since 10.0   
		 */
		makeComputedProposal: function(name, description, hover, prefix) {
			return {
				proposal: name,
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
