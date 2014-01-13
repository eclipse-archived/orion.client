/*******************************************************************************
 *
 * @license
 * Copyright (c) 2010, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*jslint browser:true devel:true sub:true*/
/*global define eclipse:true orion:true window*/

define([
], function() {
	var ContentTypes = [{	id: "text/plain",
			name: "Text",
			extension: ["txt"],
			imageClass: "file-sprite-text modelDecorationSprite"
		},
		{	id: "application/javascript",
			"extends": "text/plain",
			name: "JavaScript",
			extension: ["js"],
			imageClass: "file-sprite-javascript modelDecorationSprite"
		},
		{	id: "text/html",
			"extends": "text/plain",
			name: "HTML",
			extension: ["html", "htm"],
			imageClass: "file-sprite-html modelDecorationSprite"
		},
		{	id: "text/css",
			"extends": "text/plain",
			name: "CSS",
			extension: ["css"],
			imageClass: "file-sprite-css modelDecorationSprite"
		},
		{	id: "application/json",
			"extends": "text/plain",
			name: "JSON",
			extension: ["json"],
			imageClass: "file-sprite-text modelDecorationSprite"
		},
		{	id: "application/xml",
			"extends": "text/plain",
			name: "XML",
			extension: ["xml"],
			imageClass: "file-sprite-xml"
		},
		{	id: "text/x-java-source",
			"extends": "text/plain",
			name: "Java",
			extension: ["java"]
		},
		{	id: "text/x-markdown",
			"extends": "text/plain",
			name: "Markdown",
			extension: ["md"]
		},
		{	id: "text/x-yaml",
			"extends": "text/plain",
			name: "YAML",
			extension: ["yaml", "yml"]
		},
		{	id: "text/conf",
			"extends": "text/plain",
			name: "Conf",
			extension: ["conf"]
		},
		{	id: "text/sh",
			"extends": "text/plain",
			name: "sh",
			extension: ["sh"]
		},
		// Image types
		{	id: "image/gif",
			name: "GIF",
			extension: ["gif"],
			imageClass: "file-sprite-image modelDecorationSprite"
		},
		{	id: "image/jpeg",
			name: "JPG",
			extension: ["jpg", "jpeg", "jpe"],
			imageClass: "file-sprite-image modelDecorationSprite"
		},
		{	id: "image/ico",
			name: "ICO",
			extension: ["ico"],
			imageClass: "file-sprite-image modelDecorationSprite"
		},
		{	id: "image/png",
			name: "PNG",
			extension: ["png"],
			imageClass: "file-sprite-image modelDecorationSprite"
		},
		{	id: "image/tiff",
			name: "TIFF",
			extension: ["tif", "tiff"],
			imageClass: "file-sprite-image modelDecorationSprite"
		},
		{	id: "image/svg",
			name: "SVG",
			extension: ["svg"],
			imageClass: "file-sprite-image modelDecorationSprite"
	}];
	return {ContentTypes: ContentTypes};
});
