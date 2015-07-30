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
	'htmlOutline' : 'HTML Outline',   
	'htmlHover' : 'HTML Hover',   
	'htmlContentAssist' : 'HTML Content Assist',   
	'css' : 'CSS Validation',
	'cssOutline' : 'CSS Rule Outline',   
	'cssContentAssist' : 'CSS Content Assist',   
	'cssHover' : 'CSS Hover',   
	'csslintValidator' : 'CSS Validator',   
	'pluginName': 'Orion Web Tools Support',   
	'pluginDescription': 'This plug-in provides web language tools support for Orion, including HTML and CSS.',   
	'fontHoverExampleText': 'Lorem ipsum dolor...',   
	
	// Validator Severities
	'ignore' : 'Ignore',   
	'warning' : 'Warning',   
	'error' : 'Error',   
	
	// CSS Validator Settings
	'adjoining-classes': 'Disallow adjoining classes:',   
	'box-model': 'Beware of broken box size:',   
	'box-sizing': 'Disallow use of box-sizing:',   
	'bulletproof-font-face': 'Use the bulletproof @font-face syntax:',   
	'compatible-vendor-prefixes': 'Require compatible vendor prefixes:',   
	'display-property-grouping': 'Require properties appropriate for display:',   
	'duplicate-background-images': 'Disallow duplicate background images:',   
	'duplicate-properties': 'Disallow duplicate properties:',   
	'empty-rules': 'Disallow empty rules:',   
	'fallback-colors': 'Require fallback colors:',   
	'floats': 'Disallow too many floats:',   
	'font-faces': 'Don\'t use too many web fonts:',   
	'font-sizes': 'Disallow too many font sizes:',   
	'gradients': 'Require all gradient definitions:',   
	'ids': 'Disallow IDs in selectors:',   
	'import': 'Disallow @import:',   
	'important': 'Disallow !important:',   
	'known-properties': 'Require use of known properties:',   
	'outline-none': 'Disallow outline: none:',   
	'overqualified-elements': 'Disallow overqualified elements:',   
	'qualified-headings': 'Disallow qualified headings:',   
	'regex-selectors': 'Disallow selectors that look like regexs:',   
	'rules-count': 'Rules Count:',   
	'selector-max-approaching': 'Warn when approaching the 4095 selector limit for IE:',   
	'selector-max': 'Error when past the 4095 selector limit for IE:',   
	'shorthand': 'Require shorthand properties:',   
	'star-property-hack': 'Disallow properties with a star prefix:',   
	'text-indent': 'Disallow negative text-indent:',   
	'underscore-property-hack': 'Disallow properties with an underscore prefix:',   
	'unique-headings': 'Headings should only be defined once:',   
	'universal-selector': 'Disallow universal selector:',   
	'unqualified-attributes': 'Disallow unqualified attribute selectors:',   
	'vendor-prefix': 'Require standard property with vendor prefix:',   
	'zero-units': 'Disallow units for 0 values:',   
	
	// CSS Quick Fixes
	'quickfix-empty-rules': 'Remove the rule.',   
	'quickfix-important': 'Remove \'!important\' annotation.',   
	'quickfix-zero-units': 'Remove \'px\' qualifier.',   
	
	//HTML content assist
	'simpleDocDescription': 'Simple HTML document',
	'onlineDocumentation': '\n\n[Online documentation](${0})',
	'closeTagDescription': ' - Close the ${0} tag',
	'openCommentName': 'Open comment',
	'closeCommentName': 'Close comment',
	'obsoleteTag': '*Obsolete: This tag is obsolete. Its use is discouraged since it may not work in some browsers.*\n\n',
	'obsoleteTagDesc': ' [Obsolete]',
	'obsoleteAttr': '*Obsolete: This attribute is obsolete since ${0}. Its use is discouraged.*\n\n',
	'obsoleteAttrDesc': ' [Obsolete]',
	'formeventsHeader': 'Form Events',
	'keyboardeventsHeader': 'Keyboard Events',
	'mouseeventsHeader': 'Mouse Events',
	'windoweventsHeader': 'Window Events',
	
	//CSS content assist
	'ruleTemplateDescription': 'rule - class selector rule',
	'idSelectorTemplateDescription': 'rule - id selector rule',
	'outlineStyleTemplateDescription': 'outline - outline style',
	'backgroundImageTemplateDescription': 'background-image - image style',
	'urlImageTemplateDescription': 'url - url image',
	'rgbColourTemplateDescription': 'rgb - rgb color',
	'importTemplateDescription': 'import - import style sheet',
	'csslintTemplateDescription': 'csslint - add embedded rule severity',
	'keywordsAssistTitle': 'Keywords',
	'templateAssistHeader': 'Templates',
	'templateHoverHeader': 'Template source code:\n\n'
});
