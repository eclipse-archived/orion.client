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
 * Helper script for Orion build-time minification. Reads modules from @{buildfile} and invokes
 * the finishModule task on each module.
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

var modules = orion.build.getBuildObject(buildFile).modules || [];
if (!modules.length)
	self.log("No modules found in build file " + buildFile, Project.MSG_WARN);

modules.forEach(function(module) {
	var path = module.name, bundle = module.bundle;
	
	// Determine @pageDir and base @name
	var segments = path.split("/");
	var baseName = segments.pop(); // last segment
	var pageDir = segments.join("/");
	if (!pageDir.length) {
		pageDir = ".";
	}

	// Invoke finishModule macro
	var task = project.createTask("finishModule");
	task.setOwningTarget(self.getOwningTarget()); // http://stackoverflow.com/a/12282731
	task.setDynamicAttribute("out", attributes.get("out"));
	task.setDynamicAttribute("bundles", attributes.get("bundles"));
	task.setDynamicAttribute("name", baseName);
	task.setDynamicAttribute("bundle", bundle);
	task.setDynamicAttribute("pagedir", pageDir);
	task.perform();
});