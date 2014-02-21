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
 * Helper script for Orion build-time minification. Reads bundles from the provided @{buildfile}
 * and copies their web folders to @{todir}.
 */
/*global importPackage orion Packages project attributes self*/

// Load helper library
(function() {
	var file = project.resolveFile(project.replaceProperties("${builder}/scripts/helpers.js"));
	var code = String(new Packages.java.lang.String(Packages.java.nio.file.Files.readAllBytes(file.toPath()), "UTF-8"));
	eval(code);
}());

var Project = Packages.org.apache.tools.ant.Project;
var buildFile = attributes.get("buildfile");
var todir = attributes.get("todir");

if (!buildFile || !todir)
	throw new Error("Missing attribute");
	
var bundles = orion.build.getBuildObject(buildFile).bundles || [];
if (!bundles.length)
	self.log("No bundles found in build file " + buildFile, Project.MSG_WARN);

// Create a fileset for every bundle's web/ folder
var _self = self;
var filesets = bundles.map(function(bundle) {
	bundle = project.replaceProperties(bundle);
	var dir = project.resolveFile(bundle + Packages.java.io.File.separator + "web");
	if (!dir.exists() || !dir.isDirectory()) {
		_self.log("Bundle folder " + dir.getPath() + " does not exist", Project.MSG_WARN);
		return null;
	}
	_self.log("Found bundle web folder: " + dir.getPath());

	var fileset = project.createDataType("fileset");
	fileset.setDir(dir);
	fileset.setIncludes("**");
	fileset.setExcludes("**/node_modules/**");
	return fileset;
}).filter(function(fileset) {
	return !!fileset;
});

// Copy all the filesets to the `todir`
var task = project.createTask("copy");
filesets.forEach(function(fileset) {
	task.addFileset(fileset);
});
task.setTodir(new Packages.java.io.File(todir));
task.perform();
