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
	var EventEmitter = require('events').EventEmitter;
	var util = require('util');
	var isIndexing = false;
	
	var Indexer = function (workspaceDir){
		this.workspaceDir = workspaceDir;
		EventEmitter.call(this);
		this.doIndex = function(){
			this.emit('index');
		}
		this.updateIndexEntry = function(updatePackage){
			this.emit("updateIndexEntry",updatePackage);
		}
	}
	util.inherits(Indexer, EventEmitter);
	
	var getIndexer = exports.getIndexer = function(workspaceDir){
		var indexer = new Indexer(workspaceDir);
		indexer.on('index',function(){
			if(!isIndexing){
				indexing(indexer.workspaceDir);
			}
		});
		indexer.on('updateIndexEntry',function(updatePackage){
			 upDateIndexing(updatePackage, indexer.workspaceDir);
		});
		return indexer;
	}

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
		isIndexing = true;
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
				        isIndexing = false;
				        fulfill();
				    });
				});
			});
	}
	
	function upDateIndexing(updatePackage, workspaceDir){
		var action = updatePackage.action;
		var filePath = updatePackage.filePath;
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
		var operation;
		switch(action){
			case "rename":
				operation = renameAction;
				break;
			case "delete":
				operation = deleteAction;
				break;
			case "add":
				operation = addAction;
				break;
		}
		var renameAction =  fs.readFileAsync("orionIndex.json", "utf8").then(function(file) {
			return index = elasticlunr.Index.load(JSON.parse(file));
		}).then(function(){
			var oldIndexEntry = index.documentStore.docs.find(function(each){
				return each.path === filePath;
			});
			var oldId = oldIndexEntry.id;
			var newName = updatePackage.newName;
			fs.statAsync(filePath)
			.then(function(stats) {
				var filePathFromWorkspace = filePath.substring(workspaceDir.length);
				index.update({
					"Directory": stats.isDirectory(),
					"LastModified": stats.mtime.getTime(),
					"Length": stats.size,
					"Location": "/file" + filePathFromWorkspace,
					"Name": newName,
					"Path": filePathFromWorkspace.substring(1),
					"id": oldId
				});
			});
			
		});
		var deleteAction;
		var addAction;
		return operation;
	}

	var scheduleIndex = exports.scheduleIndex = function (defaultWorkdir) {
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

	this.onmessage = function(event) {
		this.postMessage({
			result: "Indexing"
		});
		scheduleIndex(event.data.workspaceDir);
	}.bind(this);
	
} catch (err) {
	console.log(err.message);
}