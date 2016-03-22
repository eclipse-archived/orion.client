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

/*eslint-env browser, amd*/
define("orion/editor/stylers/text_css/syntax", ["orion/editor/stylers/lib/syntax"], function(mLib) {
	var keywords = [
		"alignment-adjust", "alignment-baseline", "animation-delay", "animation-direction", "animation-duration", "animation-iteration-count",
		"animation-name", "animation-play-state", "animation-timing-function", "animation", "appearance",
		"azimuth", "backface-visibility", "background-attachment", "background-clip", "background-color", "background-image",
		"background-origin", "background-position", "background-repeat", "background-size", "background", "baseline-shift",
		"binding", "bleed", "bookmark-label", "bookmark-level", "bookmark-state", "bookmark-target", "border-bottom-color",
		"border-bottom-left-radius", "border-bottom-right-radius", "border-bottom-style", "border-bottom-width", "border-bottom",
		"border-collapse", "border-color", "border-image-outset", "border-image-repeat", "border-image-slice", "border-image-source",
		"border-image-width", "border-image", "border-left-color", "border-left-style", "border-left-width", "border-left",
		"border-radius", "border-right-color", "border-right-style", "border-right-width", "border-right", "border-spacing", "border-style",
		"border-top-color", "border-top-left-radius", "border-top-right-radius", "border-top-style", "border-top-width", "border-top",
		"border-width", "border", "bottom", "box-align", "box-decoration-break", "box-direction", "box-flex-group", "box-flex", "box-lines",
		"box-ordinal-group", "box-orient", "box-pack", "box-shadow", "box-sizing", "break-after", "break-before", "break-inside",
		"caption-side", "clear", "clip", "color-profile", "color", "column-count", "column-fill", "column-gap", "column-rule-color",
		"column-rule-style", "column-rule-width", "column-rule", "column-span", "column-width", "columns", "content", "counter-increment",
		"counter-reset", "crop", "cue-after", "cue-before", "cue", "cursor", "direction", "display", "dominant-baseline",
		"drop-initial-after-adjust", "drop-initial-after-align", "drop-initial-before-adjust", "drop-initial-before-align", "drop-initial-size",
		"drop-initial-value", "elevation", "empty-cells", "fit-position", "fit", "flex-align", "flex-flow", "flex-inline-pack", "flex-order",
		"flex-pack", "float-offset", "float", "font-family", "font-size-adjust", "font-size", "font-stretch", "font-style", "font-variant",
		"font-weight", "font", "grid-columns", "grid-rows", "hanging-punctuation", "height", "hyphenate-after",
		"hyphenate-before", "hyphenate-character", "hyphenate-lines", "hyphenate-resource", "hyphens", "icon", "image-orientation",
		"image-rendering", "image-resolution", "inline-box-align", "left", "letter-spacing", "line-height", "line-stacking-ruby",
		"line-stacking-shift", "line-stacking-strategy", "line-stacking", "list-style-image", "list-style-position", "list-style-type",
		"list-style", "margin-bottom", "margin-left", "margin-right", "margin-top", "margin", "mark-after", "mark-before", "mark",
		"marker-offset", "marks", "marquee-direction", "marquee-loop", "marquee-play-count", "marquee-speed", "marquee-style", "max-height",
		"max-width", "min-height", "min-width", "move-to", "nav-down", "nav-index", "nav-left", "nav-right", "nav-up", "opacity", "orphans",
		"outline-color", "outline-offset", "outline-style", "outline-width", "outline", "overflow-style", "overflow-x", "overflow-y",
		"overflow", "padding-bottom", "padding-left", "padding-right", "padding-top", "padding", "page-break-after", "page-break-before", "page-break-inside",
		"page-policy", "page", "pause-after", "pause-before", "pause", "perspective-origin", "perspective", "phonemes", "pitch-range",
		"pitch", "play-during", "position", "presentation-level", "punctuation-trim", "quotes", "rendering-intent", "resize",
		"rest-after", "rest-before", "rest", "richness", "right", "rotation-point", "rotation", "ruby-align", "ruby-overhang", "ruby-position",
		"ruby-span", "size", "speak-header", "speak-numeral", "speak-punctuation", "speak", "speech-rate", "stress", "string-set", "table-layout",
		"target-name", "target-new", "target-position", "target", "text-align-last", "text-align", "text-decoration", "text-emphasis",
		"text-height", "text-indent", "text-justify", "text-outline", "text-shadow", "text-transform", "text-wrap", "top", "transform-origin",
		"transform-style", "transform", "transition-delay", "transition-duration", "transition-property", "transition-timing-function",
		"transition", "unicode-bidi", "vertical-align", "visibility", "voice-balance", "voice-duration", "voice-family",
		"voice-pitch-range", "voice-pitch", "voice-rate", "voice-stress", "voice-volume", "volume", "white-space-collapse", "white-space",
		"widows", "width", "word-break", "word-spacing", "word-wrap", "z-index"
	];
	var colors = [
		"AliceBlue", "AntiqueWhite", "Aquamarine", "Aqua", "Azure",
		"Beige", "Bisque", "Black", "BlanchedAlmond", "BlueViolet", "Blue", "Brown", "BurlyWood",
		"CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan",
		"DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen",
		"DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey",
		"DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue",
		"FireBrick", "FloralWhite", "ForestGreen", "Fuchsia",
		"Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "GreenYellow", "Green",
		"HoneyDew", "HotPink",
		"IndianRed", "Indigo", "Ivory",
		"Khaki",
		"LavenderBlush", "Lavender", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow",
		"LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray",
		"LightSlateGrey", "LightSteelBlue", "LightYellow", "LimeGreen", "Lime", "Linen",
		"Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue",
		"MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin",
		"NavajoWhite", "Navy",
		"OldLace", "OliveDrab", "Olive", "OrangeRed", "Orange", "Orchid",
		"PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple",
		"RebeccaPurple", "Red", "RosyBrown", "RoyalBlue",
		"SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue",
		"Tan", "Teal", "Thistle", "Tomato", "Turquoise",
		"Violet",
		"Wheat", "WhiteSmoke", "White",
		"YellowGreen", "Yellow"
	];
	var directives = ["charset", "document", "font-face", "import", "keyframes", "media", "namespace", "page", "supports"];

	var grammars = [];
	grammars.push.apply(grammars, mLib.grammars);
	grammars.push({
		id: "orion.css",
		contentTypes: ["text/css"],
		patterns: [
			{include: "#string_single_multiline"},
			{include: "#string_double_multiline"},
			{include: "orion.lib#string_doubleQuote"},
			{include: "orion.lib#string_singleQuote"},
			{include: "orion.c-like#comment_block"},
			{include: "orion.lib#brace_open"},
			{include: "orion.lib#brace_close"},
			{include: "orion.lib#bracket_open"},
			{include: "orion.lib#bracket_close"},
			{include: "orion.lib#parenthesis_open"},
			{include: "orion.lib#parenthesis_close"},
			{include: "orion.lib#number_decimal"},
			{include: "#number_hex"},
			{include: "#numeric_value"},
			{include: "#color"},
			{include: "#keyword"},
			{include: "#directive"}
		],
		repository: {
			color: {
				match: "(?i)\\b(?:" + colors.join("|") + ")\\b",
				name: "constant.other.color.css"
			},
			directive: {
				match: "(^|\\s)(@("  + directives.join("|") + "))\\b",
				captures: {
					2: {name: "keyword.other.directive.css"}
				}
			},
			keyword: {
				match: "(?:-webkit-|-moz-|-ms-|-o-|\\b)(?:" + keywords.join("|") + ")\\b",
				name: "support.type.propertyName.css"
			},
			number_hex: {
				match: "#[0-9A-Fa-f]+\\b",
				name: "constant.numeric.hex.css"
			},
			numeric_value: {
				match: "(?i)\\b-?(?:\\.\\d+|\\d+\\.?\\d*)(?:%|em|ex|ch|rem|vw|vh|vmin|vmax|in|cm|mm|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?\\b",
				name: "constant.numeric.value.css"
			},
			string_double_multiline: {
				begin: '"(?:\\\\.|[^\\\\"])*\\\\$',
				end: '^(?:$|(?:\\\\.|[^\\\\"])*("|[^\\\\]$))',
				name: "string.quoted.double.css"
			},
			string_single_multiline: {
				begin: "'(?:\\\\.|[^\\\\'])*\\\\$",
				end: "^(?:$|(?:\\\\.|[^\\\\'])*('|[^\\\\]$))",
				name: "string.quoted.single.css"
			}
		}
	});
	return {
		id: grammars[grammars.length - 1].id,
		grammars: grammars,
		keywords: keywords
	};
});
