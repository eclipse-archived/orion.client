/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 ******************************************************************************/
/* eslint-env amd */
define({//Default message bundle
	"html" : "HTML Validation",
	"htmlFormatter" : "HTML Formatter",
	"htmlOutline" : "HTML Outline",   
	"htmlHover" : "HTML Hover",   
	"htmlContentAssist" : "HTML Content Assist",
	"htmlValidator": "HTML Validator",
	"css" : "CSS Validation",
	"cssOutline" : "CSS Rule Outline",   
	"cssContentAssist" : "CSS Content Assist",   
	"cssFormatter" : "CSS Formatter",
	"cssHover" : "CSS Hover",   
	"csslintValidator" : "CSS Validator",   
	"pluginName": "Orion Web Tools Support",   
	"pluginDescription": "This plug-in provides web language tools support for Orion, including HTML and CSS.",   
	"fontHoverExampleText": "Lorem ipsum dolor...",

	// CSS and HTML formatting options names
	"indentation_space" : "space",
	"indentation_tab" : "tab",
	"indentation_unix" : "Unix",
	"indentation_mac" : "Mac",
	"indentation_windows" : "Windows",
	"collapse_preserve_inline" : "Collapse Preserve inline",
	"collapse" : "Collapse",
	"expand" : "Expand",
	"end_expand" : "End expand",
	"none" : "None",
	"normal" : "Normal",
	"keep" : "Keep",
	"separate" : "Separate",
	"auto" : "Auto",
	"force" : "Force",
	
	// CSS Formatter Settings
	"cssFormattingSettings" : "Formatting Settings for CSS",
	"cssFormatting" : "CSS Formatting",
	"css_indent_size" : "Indentation size:" ,
	"css_indent_char" : "Indentation character:",
	"css_eol" : "Charater(s) to use as line terminators:",
	"css_end_with_newline" : "End ouput with newline:",
	"selector_separator_newline" : "Add a newline between multiple selectors:",
	"newline_between_rules" : "Add a newline between CSS rules:",
	"space_around_selector_separator" : "Ensure space around selector separators:",

	// HTML Formatter Settings
	"htmlFormattingOptions" : "Formatting Settings for HTML",
	"htmlFormatting" : "HTML Formatting",
	"html_indent_size" : "Indentation size:",
	"html_indent_char" : "Indentation character:",
	"html_eol" : "Charater(s) to use as line terminators:",
	"html_end_with_newline" : "End ouput with newline:",
	"html_preserve_new_lines" : "Preserve line-breaks:",
	"html_max_preserve_new_lines" : "Number of line-breaks to be preserved in one chunk:",
	"html_brace_style" : "Brace Style:",
	"html_wrap_line_length" : "Wrap lines at next opportunity after N characters: (0 for unlimited)",
	"indent_inner_html" : "Indent <head> and <body> sections:",
	"indent_handlebars" : "Format and indent {{#foo}} and {{/foo}}:",
	"wrap_attributes" : "Wrap attributes to new lines:",
	"wrap_attributes_indent_size" : "Indent wrapped attributes to after N characters:",
	"extra_liners" : "List of tags that should have an extra newline before them (separate with commas):",
	"indent_scripts" : "Indent scripts:",

	
	// Validator Severities
	"ignore" : "Ignore",
	"warning" : "Warning",
	"error" : "Error",
	
	// HTML Validator Settings
	"attr_bans": "Disallow the following attributes: align, background, bgcolor, frameborder, longdesc, marginwidth, marginheight, scrolling, style, width:",
	"fig_req_figcaption": "Require all <figure> tags to have a <figcaption> tag:",
	"img_req_alt": "Require all <img> tags to have the alt attribute:",
	"tag_close": "Require all open tags have matching close tags:",

	// CSS Validator Settings
	"adjoining-classes": "Disallow adjoining classes:",   
	"box-model": "Beware of broken box size:",   
	"box-sizing": "Disallow use of box-sizing:",   
	"bulletproof-font-face": "Use the bulletproof @font-face syntax:",   
	"compatible-vendor-prefixes": "Require compatible vendor prefixes:",   
	"display-property-grouping": "Require properties appropriate for display:",   
	"duplicate-background-images": "Disallow duplicate background images:",   
	"duplicate-properties": "Disallow duplicate properties:",   
	"empty-rules": "Disallow empty rules:",   
	"fallback-colors": "Require fallback colors:",   
	"floats": "Disallow too many floats:",   
	"font-faces": "Don't use too many web fonts:",   
	"font-sizes": "Disallow too many font sizes:",   
	"gradients": "Require all gradient definitions:",   
	"ids": "Disallow IDs in selectors:",   
	"import": "Disallow @import:",   
	"important": "Disallow !important:",   
	"known-properties": "Require use of known properties:",   
	"outline-none": "Disallow outline: none:",   
	"overqualified-elements": "Disallow overqualified elements:",   
	"qualified-headings": "Disallow qualified headings:",   
	"regex-selectors": "Disallow selectors that look like regexs:",   
	"rules-count": "Rules Count:",   
	"selector-max-approaching": "Warn when approaching the 4095 selector limit for IE:",   
	"selector-max": "Error when past the 4095 selector limit for IE:",   
	"shorthand": "Require shorthand properties:",   
	"star-property-hack": "Disallow properties with a star prefix:",   
	"text-indent": "Disallow negative text-indent:",   
	"underscore-property-hack": "Disallow properties with an underscore prefix:",   
	"unique-headings": "Headings should only be defined once:",   
	"universal-selector": "Disallow universal selector:",   
	"unqualified-attributes": "Disallow unqualified attribute selectors:",   
	"vendor-prefix": "Require standard property with vendor prefix:",   
	"zero-units": "Disallow units for 0 values:",   
	
	// CSS Quick Fixes
	"quickfix-empty-rules": "Remove the rule.",   
	"quickfix-important": "Remove '!important' annotation.",   
	"quickfix-zero-units": "Remove 'px' qualifier.",   
	
	//HTML content assist
	"simpleDocDescription": "Simple HTML document",
	"onlineDocumentation": "\n\n[Online documentation](${0})",
	"closeTagDescription": " - Close the ${0} tag",
	"openCommentName": "Open comment",
	"closeCommentName": "Close comment",
	"obsoleteTag": "*Obsolete: This tag is obsolete. Its use is discouraged since it may not work in some browsers.*\n\n",
	"obsoleteTagDesc": " [Obsolete]",
	"obsoleteAttr": "*Obsolete: This attribute is obsolete since ${0}. Its use is discouraged.*\n\n",
	"obsoleteAttrDesc": " [Obsolete]",
	"possibleValues": " Possible values are:",
	"valueNameDocMarkdown": "\n* ${0}: ${1}",
	"formeventsHeader": "Form Events",
	"keyboardeventsHeader": "Keyboard Events",
	"mouseeventsHeader": "Mouse Events",
	"windoweventsHeader": "Window Events",
	"addQuotesToAttributes": " - Add quotes to the current attribute",
	
	//CSS content assist
	"ruleTemplateDescription": "rule - class selector rule",
	"idSelectorTemplateDescription": "rule - id selector rule",
	"outlineStyleTemplateDescription": "outline - outline style",
	"backgroundImageTemplateDescription": "background-image - image style",
	"urlImageTemplateDescription": "url - url image",
	"rgbColourTemplateDescription": "rgb - rgb color",
	"importTemplateDescription": "import - import style sheet",
	"csslintTemplateDescription": "csslint - add embedded rule severity",
	"keywordsAssistTitle": "Keywords",
	"templateAssistHeader": "Templates",
	"templateHoverHeader": "Template source code:\n\n"
});
