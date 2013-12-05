/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define*/

define("orion/editor/keywords", [], function() { //$NON-NLS-0$

	var JS_KEYWORDS = [
		"break", //$NON-NLS-0$
		"case", "class", "catch", "continue", "const", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"debugger", "default", "delete", "do", //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"else", "enum", "export", "extends", //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"false", "finally", "for", "function", //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"if", "implements", "import", "in", "instanceof", "interface", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"let", //$NON-NLS-0$
		"new", "null", //$NON-NLS-1$ //$NON-NLS-0$
		"package", "private", "protected", "public", //$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
		"return", //$NON-NLS-0$
		"static", "super", "switch", //$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$
		"this", "throw", "true", "try", "typeof", //$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
		"undefined", //$NON-NLS-0$
		"var", "void", //$NON-NLS-0$ //$NON-NLS-1$
		"while", "with", //$NON-NLS-0$ //$NON-NLS-1$
		"yield" //$NON-NLS-0$
	];

	var CSS_KEYWORDS = [
		"alignment-adjust", "alignment-baseline", "animation-delay", "animation-direction", "animation-duration", "animation-iteration-count", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"animation-name", "animation-play-state", "animation-timing-function", "animation", "appearance", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"azimuth", "backface-visibility", "background-attachment", "background-clip", "background-color", "background-image", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"background-origin", "background-position", "background-repeat", "background-size", "background", "baseline-shift", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"binding", "bleed", "bookmark-label", "bookmark-level", "bookmark-state", "bookmark-target", "border-bottom-color", //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"border-bottom-left-radius", "border-bottom-right-radius", "border-bottom-style", "border-bottom-width", "border-bottom", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"border-collapse", "border-color", "border-image-outset", "border-image-repeat", "border-image-slice", "border-image-source", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"border-image-width", "border-image", "border-left-color", "border-left-style", "border-left-width", "border-left", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"border-radius", "border-right-color", "border-right-style", "border-right-width", "border-right", "border-spacing", "border-style", //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"border-top-color", "border-top-left-radius", "border-top-right-radius", "border-top-style", "border-top-width", "border-top", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"border-width", "border", "bottom", "box-align", "box-decoration-break", "box-direction", "box-flex-group", "box-flex", "box-lines", //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"box-ordinal-group", "box-orient", "box-pack", "box-shadow", "box-sizing", "break-after", "break-before", "break-inside", //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"caption-side", "clear", "clip", "color-profile", "color", "column-count", "column-fill", "column-gap", "column-rule-color", //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"column-rule-style", "column-rule-width", "column-rule", "column-span", "column-width", "columns", "content", "counter-increment", //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"counter-reset", "crop", "cue-after", "cue-before", "cue", "cursor", "direction", "display", "dominant-baseline", //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"drop-initial-after-adjust", "drop-initial-after-align", "drop-initial-before-adjust", "drop-initial-before-align", "drop-initial-size", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"drop-initial-value", "elevation", "empty-cells", "fit-position", "fit", "flex-align", "flex-flow", "flex-inline-pack", "flex-order", //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"flex-pack", "float-offset", "float", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"font-weight", "font", "grid-columns", "grid-rows", "hanging-punctuation", "height", "hyphenate-after", //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"hyphenate-before", "hyphenate-character", "hyphenate-lines", "hyphenate-resource", "hyphens", "icon", "image-orientation", //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"image-rendering", "image-resolution", "inline-box-align", "left", "letter-spacing", "line-height", "line-stacking-ruby", //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"line-stacking-shift", "line-stacking-strategy", "line-stacking", "list-style-image", "list-style-position", "list-style-type", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"list-style", "margin-bottom", "margin-left", "margin-right", "margin-top", "margin", "mark-after", "mark-before", "mark", //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"marker-offset", "marks", "marquee-direction", "marquee-loop", "marquee-play-count", "marquee-speed", "marquee-style", "max-height", //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"max-width", "min-height", "min-width", "move-to", "nav-down", "nav-index", "nav-left", "nav-right", "nav-up", "opacity", "orphans", //$NON-NLS-10$ //$NON-NLS-9$ //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"outline-color", "outline-offset", "outline-style", "outline-width", "outline", "overflow-style", "overflow-x", "overflow-y", //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"overflow", "padding-bottom", "padding-left", "padding-right", "padding-top", "padding", "page-break-after", "page-break-before", "page-break-inside", //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"page-policy", "page", "pause-after", "pause-before", "pause", "perspective-origin", "perspective", "phonemes", "pitch-range", //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"pitch", "play-during", "position", "presentation-level", "punctuation-trim", "quotes", "rendering-intent", "resize", //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"rest-after", "rest-before", "rest", "richness", "right", "rotation-point", "rotation", "ruby-align", "ruby-overhang", "ruby-position", //$NON-NLS-9$ //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"ruby-span", "size", "speak-header", "speak-numeral", "speak-punctuation", "speak", "speech-rate", "stress", "string-set", "table-layout", //$NON-NLS-9$ //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"target-name", "target-new", "target-position", "target", "text-align-last", "text-align", "text-decoration", "text-emphasis", //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"text-height", "text-indent", "text-justify", "text-outline", "text-shadow", "text-transform", "text-wrap", "top", "transform-origin", //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"transform-style", "transform", "transition-delay", "transition-duration", "transition-property", "transition-timing-function", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"transition", "unicode-bidi", "vertical-align", "visibility", "voice-balance", "voice-duration", "voice-family", //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"voice-pitch-range", "voice-pitch", "voice-rate", "voice-stress", "voice-volume", "volume", "white-space-collapse", "white-space", //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"widows", "width", "word-break", "word-spacing", "word-wrap", "z-index" //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	];
	
	var JAVA_KEYWORDS = [
		"abstract", //$NON-NLS-0$
		"boolean", "break", "byte", //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"case", "catch", "char", "class", "continue", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"default", "do", "double", //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"else", "extends", //$NON-NLS-1$ //$NON-NLS-0$
		"false", "final", "finally", "float", "for", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"if", "implements", "import", "instanceof", "int", "interface", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"long", //$NON-NLS-0$
		"native", "new", "null", //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"package", "private", "protected", "public", //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"return", //$NON-NLS-0$
		"short", "static", "super", "switch", "synchronized", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"this", "throw", "throws", "transient", "true", "try", //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"void", "volatile", //$NON-NLS-1$ //$NON-NLS-0$
		"while" //$NON-NLS-0$
	];

	return {
		JSKeywords: JS_KEYWORDS,
		CSSKeywords: CSS_KEYWORDS,
		JAVAKeywords: JAVA_KEYWORDS
	};
});