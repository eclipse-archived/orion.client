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
/*
 * Helper script for Orion build-time minification. 
 * Must be executed from an Ant <scriptdef> using Rhino.
 */
/*global Packages orion:true project*/

//importPackage(java.io);
//importPackage(java.nio.file);
//importPackage(java.nio.charset);
//importPackage(org.apache.tools.ant);

if (typeof orion === "undefined" || orion === null) {
	orion = {};
}
orion.build = orion.build || {};

(function() {
	function deserialize(buildFileText) {
		return new Function("var o = " + buildFileText + "; return o;")();
	}
	
	function getBuildObject(path) {
		var Files = Packages.java.nio.file.Files, Paths = Packages.java.nio.file.Paths;
		var Charset = Packages.java.nio.charset.Charset;
	
		var jpath = project.resolveFile(path).toPath();
		var text = Files.readAllLines(Paths.get(jpath), Charset.forName("UTF-8")).toArray().join("\n");
		return deserialize(text);
	}

	orion.build.getBuildObject = getBuildObject;
}());
