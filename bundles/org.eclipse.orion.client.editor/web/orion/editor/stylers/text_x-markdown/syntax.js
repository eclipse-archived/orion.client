/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*jslint amd:true*/
define("orion/editor/stylers/text_x-markdown/syntax", [], function() { //$NON-NLS-0$
	var grammars = [];
	grammars.push({
		id: "orion.markdown",
		contentTypes: ["text/x-markdown"],
		patterns: [
			{include: "#heading_setext"},
			{include: "#heading_atx"},
			{include: "#block_quote"},
			{include: "#horizontal_rule"},
			{include: "#list_ordered"},
			{include: "#list_unordered"},
			{include: "#block_code"},
			{include: "#emphasis"},
			{include: "#link_inline"},
			{include: "#link_reference"},
			{include: "#link_label"},

			// Paragraphs
			// Blockquotes
			// **** Block Elements ****
			// Lists
			// http://daringfireball.net/projects/markdown/syntax#list
//			{	begin: "^( )*([\\*\\+\\-]|(\\d.)) ",
//				end: "^$",
//				captures: {
//					2: {name: "keyword.list"}
//				},
//				patterns: [
////					{
////						match: "\\[.*\\]",
////						name: "keyword.list"
////					}
//				]
//			},
//			// Generic code blocks (indented by 4 spaces)
//			{
//				begin: "^( {4,}|\\t)",
//				end: "^$|\\n", // empty line ends it
//				captures: {},
//				contentName: "comment.meta.code", // TODO: abuse of tag names
//			},
			// Fenced code blocks (GitHub extension) -- js
			{
				begin: "^(```(?:js|javascript))",
				end: "^(```)",
				captures: {
					1: { name: "entity.name.fenced" }
				},
				contentName: "source.markdown.embedded.js",
				patterns: [
					{
						include: "orion.js"
					}
				]
			},
			// Fenced code blocks (GitHub extension) -- generic
			{
				begin: "^(```)", //begin: "^(```)(?!js|javascript)",
				end: "^(```)",
				captures: {
					1: { name: "entity.name.fenced" }
				},
				contentName: "comment.meta.code"  // TODO: abuse of tag names
			},
			// **** Span Elements ****
			// Links
			// http://daringfireball.net/projects/markdown/syntax#link
//			{	match: "(^\\[.*\\]: ?[\\w:/.\\?\\&=_-]+( \".*\")?$)|(\\[.*\\](\\(.*\\))?)",
//				name: "entity.name.link"
//			},
			// Inline code
			{
				match: "(`{1,})( ?)(.*?)\\2(\\1)", // one or more backticks, optional space, contents, matching optional space, matching backticks.
				captures: {
					1: { name: "entity.name.code.inline" },
					3: { name: "comment.meta.code" },        // TODO: abuse of tag names
					4: { name: "entity.name.code.inline" }
				}
			},
		],
		repository: {
			block_code: {
				begin: "^([ ]{4,}|\\t)\\s*\\S+",
				end: "^(?!([ ]{4,}|\\t))",
				name: "markup.raw.code.markdown"
			},
			block_quote: {
				begin: "^\\s*>",
				end: "^\\s*$",
				name: "markup.quote.block.markdown",
				patterns: [
					{include: "#heading_setext"},
					{include: "#heading_atx"}
				]
			},
			// HERE
			emphasis: {
				match: "(__|\\*\\*|_|\\*)+?\\1",
				name: "markup.italic.emphasis"
			},
			heading_setext: {
				match: "^(?:={2,}|-{2,})$",
				name: "markup.heading.setext.markdown"
			},
			heading_atx: {
				match: "^#{1,6}.*$",
				name: "markup.heading.atx.markdown"
			},
			horizontal_rule: {
				match: "^(-|\\*|_)[ ]*(?:\\1[ ]*){2,}$",
				name: "markup.other.separator.horizontal.markdown"
			},
			link_inline: {
				match: "\\[[^\\]]+\\]\\([^)]*\\)",
				name: "markup.underline.link.inline.markdown"
			},
			link_label: {
				match: "^\\[[^\\]]+\\]:[\\t ]+[^\\t ]+(?:[\\t ]+(?:(\"|')[^\\1]*\\1|\\([^)]*\\)))?[\\t ]*$",
				name: "markup.underline.link.label.markdown"
			},
			link_reference: {
				match: "\\[[^\\]]+\\][ ]?\\[[^\\]]*\\]",
				name: "markup.underline.link.reference.markdown"
			},			
			list_ordered: {
				begin: "^[ ]{0,3}\\d+\\.[\\t ]",
				end: "^\\s*$",
				name: "markup.list.numbered.markdown"
			},
			list_unordered: {
				begin: "^[ ]{0,3}[\\*\\+\\-][\\t ]",
				end: "^\\s*$",
				name: "markup.list.unnumbered.markdown"
			},
		}
	});
	return {
		id: grammars[grammars.length - 1].id,
		grammars: grammars,
		keywords: []
	};
});
