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
	var scanner = new Packages.java.util.Scanner(file, "UTF-8").useDelimiter("\\Z");
	var code = String(scanner.next());
	scanner.close();
	eval(code);
}());

var Project = Packages.org.apache.tools.ant.Project;
var buildFile = attributes.get("buildfile");

var modules = orion.build.getBuildObject(buildFile).modules || [];
if (!modules.length)
	self.log("No modules found in build file " + buildFile, Project.MSG_WARN);

modules.forEach(function(module) {
	var bundle = module.bundle;
	
	// Determine @pageDir and base @name
	var segments = module.name.split("/");
	var baseName = module._baseName = segments.pop(); // last segment
	var pageDir = segments.join("/");
	if (!pageDir.length) {
		pageDir = ".";
	}
	module._pageDir = pageDir;

	// Determine the file name include pattern for the calling module(s). Default is {baseName}.html
	var caller;
	if (module.caller) {
		caller = Array.isArray(module.caller) ? module.caller.join(", ") : module.caller;
	} else {
		caller = baseName + ".html";
	}
	module._caller = caller;

	// Invoke updateModuleID macro
	var task = project.createTask("updateModuleID");
	task.setOwningTarget(self.getOwningTarget()); // http://stackoverflow.com/a/12282731
	task.setDynamicAttribute("out", attributes.get("out"));
	task.setDynamicAttribute("name", baseName);
	task.setDynamicAttribute("bundle", bundle);
	task.setDynamicAttribute("pagedir", pageDir);
	task.setDynamicAttribute("caller", caller);
	task.perform();
});

// Copy optimized files back into bundle folders.
modules.forEach(function(module) {
	// Invoke copybackModule macro
	var task = project.createTask("copybackModule");
	task.setOwningTarget(self.getOwningTarget()); // http://stackoverflow.com/a/12282731
	task.setDynamicAttribute("out", attributes.get("out"));
	task.setDynamicAttribute("name", module._baseName);
	task.setDynamicAttribute("bundle", module.bundle);
	task.setDynamicAttribute("pagedir", module._pageDir);
	task.setDynamicAttribute("caller", module._caller);
	task.perform();
});
