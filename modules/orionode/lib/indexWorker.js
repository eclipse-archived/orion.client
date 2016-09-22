/*******************************************************************************
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/

try {
	var Promise = require('bluebird');
	var path = require('path');
	var originalFs = require('fs');
	var fs = Promise.promisifyAll(require('fs'));
	var elasticlunr = require('elasticlunr');
	var SUBDIR_SEARCH_CONCURRENCY = 10;

	function makedocs(workspaceDir, dirLocation, filename, refId, index) {
		var filePath = path.join(dirLocation, filename);
		return fs.statAsync(filePath)
			.then(function(stats) {
				/*eslint consistent-return:0*/
				if (stats.isDirectory()) {
					if (filename[0] === ".") {
						// do not search hidden dirs like .git
						return;
					}
					if (filePath.substring(filePath.length - 1) !== "/") filePath = filePath + "/";

					return fs.readdirAsync(filePath)
						.then(function(directoryFiles) {
							return Promise.map(directoryFiles, function(entry) {
								return makedocs(workspaceDir, filePath, entry, refId, index);
							}, {
								concurrency: SUBDIR_SEARCH_CONCURRENCY
							});
						});
				}
				var filePathFromWorkspace = filePath.substring(workspaceDir.length);
				index.addDoc({
					"Directory": stats.isDirectory(),
					"LastModified": stats.mtime.getTime(),
					"Length": stats.size,
					"Location": "/file" + filePathFromWorkspace,
					"Name": filename,
					"Path": filePathFromWorkspace.substring(1),
					"id": refId.id++
				});
			});
	}


	function indexing(workspaceDir) {
		var refId = {
			id: 0
		};
		var index = elasticlunr(function() {
			this.addField('Name');
			this.setRef("id");
			this.pipeline.reset();
			var trimmer = function(token) {
				if (token === null || token === undefined) {
					throw new Error('token should not be undefined');
				}
				return token
					.replace(/^\s+/, '')
					.replace(/\s+$/, '');
			};
			trimmer.label = "trimmer";
			this.pipeline.add(trimmer);
		});
		return fs.readdirAsync(workspaceDir)
			.then(function(children) {
				console.time("indexing");
				return Promise.map(children, function(child) {
					return makedocs(workspaceDir, workspaceDir, child, refId, index);
				}, {
					concurrency: SUBDIR_SEARCH_CONCURRENCY
				});
			}).then(function(){
				console.log(refId.id);
				console.timeEnd("indexing");
				return new Promise(function(fulfill,reject){
					originalFs.writeFile("orionIndex.json", JSON.stringify(index), function(err) {
				        if (err){
				        	reject(err);	
				        }
				        console.log('file saved');
				        fulfill();
				    });
				});
			});
	}

	function scheduleIndex(defaultWorkdir) {
		return Promise.resolve(defaultWorkdir).then(function(defaultWorkdir) {
			return waitForAWhile()
			.then(function(){
				return indexing(defaultWorkdir)
				.then(function() {
					return scheduleIndex(defaultWorkdir);
				}).catch(function() {
					return scheduleIndex(defaultWorkdir);
				});
			});
		});
	}
	function waitForAWhile(){
		return new Promise(function(fulfill){
			setTimeout(function(){
				return fulfill();
			}, 5000);
		});
	}

	if (typeof module !== "undefined") {
		module.exports.scheduleIndex = scheduleIndex;
	}

	this.onmessage = function(event) {
		scheduleIndex(event.data.workspaceDir);
	}.bind(this);
	
} catch (err) {
	console.log(err.message);
}