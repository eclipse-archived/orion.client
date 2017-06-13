/*******************************************************************************
 * @license
 * Copyright (c) 2016, 2017 IBM Corporation, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *   IBM Corporation - Various improvements
 ******************************************************************************/
/*eslint-env amd, browser, node */
define([
	'orion/objects',
	'i18n!javascript/nls/messages',
	'orion/i18nUtil',
	'javascript/hover',
	'javascript/util',
	'orion/editor/templates',
	'plugins/languages/json/visitor'
], function(Objects, Messages, i18nUtil, Hover, Util, mTemplates, JsonVisitor) {

	var templates = [];

	var astManager;

	/**
	 * @description Create a new instance of the content assist support for package.json files
	 * @param {JsonAstManager} jsonAstManager
	 * @returns {PackageJsonAssist} A new instance of the class
	 * @since 15.0
	 */
	function PackageJsonAssist(jsonAstManager) {
		astManager = jsonAstManager;
	}

	/**
	 * @description Collects the templates for the given prefix
	 * @param {String} prefix The prefix or the empty string
	 * @returns {Array.<mTemplates.Template>} The array of template objects
	 */
	function getTemplatesForPrefix(prefix) {
		var ts = [];
		templates.forEach(function(entry) {
			if (Util.looselyMatches(prefix, entry.prefix)) {
				var t = new mTemplates.Template(prefix, entry.description, entry.template, entry.name);
				if (entry.doc) {
					t.doc = entry.doc;
				}
				if (entry.url) {
					t.url = entry.url;
				}
				ts.push(t);
			}
		});
		return ts;
	}

	/**
	 * @description Returns the Orion completion proposal from the given template and params
	 * @param {mTemplate.Template} template The template
	 * @param {Object} params The params
	 * @returns {Object} The Orion completion proposal
	 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#The_Proposal_object
	 */
	function getProposalFromTemplate(template, params) {
		var proposal = template.getProposal(params.prefix, params.offset, params);
		var _h;
		if (template.doc) {
			_h = Hover.formatMarkdownHover(template.doc);
		} else {
			_h = Object.create(null);
			_h.type = 'markdown'; //$NON-NLS-1$
			_h.content = Messages['templateHoverHeader'];
			_h.content += proposal.proposal;
		}
		if (template.url) {
			_h.content += i18nUtil.formatMessage.call(null, Messages['onlineDocumentationProposalEntry'], template.url);
		}
		proposal.hover = _h;
		proposal.style = 'emphasis'; //$NON-NLS-1$
		removePrefix(params.prefix, proposal);
		proposal.kind = 'packagejson'; //$NON-NLS-1$
		return proposal;
	}

	/**
	 * @description Remove the prefix from the proposal
	 * @param {String} prefix the prefix to remove
	 * @param {Object} proposal The proposal to remove the prefix from
	 */
	function removePrefix(prefix, proposal) {
		var overwrite = proposal.overwrite = proposal.proposal.substring(0, prefix.length) !== prefix;
		if (!overwrite) {
			proposal.proposal = proposal.proposal.substring(prefix.length);
		}
	}

	/**
	 * The root set of options for a .tern-project file
	 */
	var rootOptions = {
		
	};

	function addProposal(_name, item, proposals) {
		var proposal = {
			relevance: 100,
			name: _name,
			proposal: item.proposal,
			style: 'emphasis', //$NON-NLS-1$
			overwrite: true,
			kind: 'packagejson' //$NON-NLS-1$
		};
		var _h = '';
		if (item.doc) {
			_h = Hover.formatMarkdownHover(item.doc);
		}
		if (item.url) {
			_h.content += i18nUtil.formatMessage.call(null, Messages['onlineDocumentationProposalEntry'], item.url);
		}
		proposal.hover = _h;
		proposals.push(proposal);
	}

	Objects.mixin(PackageJsonAssist.prototype, {
		/**
		 * @description Computes completion proposals for the given source and parameters
		 * @param {EditorContext} editorContext The editor context
		 * @param {?} params The parameters from the Orion API callback
		 * @returns {Array.<Object>} returns
		 */
		computeContentAssist: function computeContentAssist(editorContext, params) {
			return astManager.getAST(editorContext, "package.json").then(function(ast) {
				var proposals = [];
				if (!ast) {
					var _templates = getTemplatesForPrefix(params.prefix);
					_templates.forEach(function(_template) {
						proposals.push(getProposalFromTemplate(_template, params));
					});
					return proposals;
				}
				var node = JsonVisitor.findNodeAtOffset(ast, params.offset);
				if (node) {
					if (node.type === 'object') {
						if (!node.parent) {
							// at the root
							Object.keys(rootOptions).forEach(function(item) {
								addProposal(item, rootOptions[item], proposals);
							});
						}
					}
					if (node.type === 'property') {

					}
					return proposals;
				}
				return [];
			});
		}
	});

	return PackageJsonAssist;
});