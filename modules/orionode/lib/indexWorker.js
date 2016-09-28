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
	var appendingIndexOperation = false;

	var Indexer = function (workspaceDir) {
		this.workspaceDir = workspaceDir;
		EventEmitter.call(this);
		this.doIndex = function () {
			this.emit('index');
		}
		this.updateIndexEntry = function (updatePackage) {
			this.emit("updateIndexEntry", updatePackage);
		}
	}
	util.inherits(Indexer, EventEmitter);

	var getIndexer = exports.getIndexer = function (workspaceDir) {
		var indexer = new Indexer(workspaceDir);
		indexer.on('index', function () {
			if(!isIndexing){
				indexing(indexer.workspaceDir);
			}else{
				console.log("appending next index: ");
				appendingIndexOperation = true;	
			}
		});
		indexer.on('updateIndexEntry', function (updatePackage) {
			updateIndexing(updatePackage, indexer.workspaceDir);
		});
		return indexer;
	}

	function initIndex() {
		return elasticlunr(function () {
			this.addField('Name');
			this.setRef("id");
			this.pipeline.reset();
			var trimmer = function (token) {
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
	}

	function makedocs(workspaceDir, dirLocation, filename, refId, index) {
		var filePath = path.join(dirLocation, filename);
		return fs.statAsync(filePath)
			.then(function (stats) {
				/*eslint consistent-return:0*/
				if (stats.isDirectory()) {
					if (filename[0] === ".") {
						// do not search hidden dirs like .git
						return;
					}
					if (filePath.substring(filePath.length - 1) !== "/") filePath = filePath + "/";

					return fs.readdirAsync(filePath)
						.then(function (directoryFiles) {
							return Promise.map(directoryFiles, function (entry) {
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
		// When start doing index, append index operation is unnecessary.
		appendingIndexOperation = false;
		isIndexing = true;
		var index = initIndex();
		return fs.readdirAsync(workspaceDir)
			.then(function (children) {
				console.time("indexing");
				return Promise.map(children, function (child) {
					return makedocs(workspaceDir, workspaceDir, child, refId, index);
				}, {
						concurrency: SUBDIR_SEARCH_CONCURRENCY
					});
			}).then(function () {
				console.log(refId.id);
				console.timeEnd("indexing");
				return saveIndexToFile(index);
			}).then(function(){
				// However, in the 'long' process of indexing operation, if there's a new indexing request, append it.
				if(appendingIndexOperation){
					console.log("Going to do next index!");
					return indexing(workspaceDir);
				}
			})
	}

	function saveIndexToFile(index) {
		return new Promise(function (fulfill, reject) {
			originalFs.writeFile("orionIndex.json", JSON.stringify(index), function (err) {
				if (err) {
					reject(err);
				}
				console.log('file saved');
				isIndexing = false;
				fulfill();
			});
		});
	}

	function updateIndexing(updatePackage, workspaceDir) {
		var oldfilePath = updatePackage.location && updatePackage.location.substring(6);
		var newFilePath = updatePackage.filepath;
		var fileName = updatePackage.name;
		isIndexing = true;
		var index = initIndex();
		console.time("UpdateIndexing");
		return fs.readFileAsync("orionIndex.json", "utf8").then(function (file) {
			return index = elasticlunr.Index.load(JSON.parse(file));
		}).then(function () {
			// Delete old index first if the file exsit.
			var currentTotalIndexAccount = index.documentStore.length;
			if (oldfilePath) {
				var oldIndexEntry;
				for (var i = 0; i < currentTotalIndexAccount; i++) {
					var temp = index.documentStore.docs[i].Path;
					if (path.resolve(oldfilePath) === path.resolve(temp)) {
						oldIndexEntry = index.documentStore.docs[i];
						break;
					}
				}

				var oldId = oldIndexEntry.id;
				index.removeDoc(oldIndexEntry);
			}
			// Add new index then in cases of add new file or rename old file.
			if (newFilePath) {
				var addNewIndexPromise = fs.statAsync(newFilePath)
					.then(function (stats) {
						if (fileName) {
							var filePathFromWorkspace = newFilePath.substring(workspaceDir.length);
							var newIndexEntry = {
								"Directory": stats.isDirectory(),
								"LastModified": stats.mtime.getTime(),
								"Length": stats.size,
								"Location": "/file" + filePathFromWorkspace,
								"Name": fileName,
								"Path": filePathFromWorkspace.substring(1),
								"id": oldId || currentTotalIndexAccount
							};
						}
						if (fileName) {
							index.addDoc(newIndexEntry);
						}
					})
			}
			Promise.resolve(addNewIndexPromise).then(function () {
				console.timeEnd("UpdateIndexing");
				return saveIndexToFile(index);
			});
		});
	}

	var scheduleIndex = exports.scheduleIndex = function (defaultWorkdir, interval) {
		return Promise.resolve(defaultWorkdir).then(function (defaultWorkdir) {
			return waitForAWhile(interval)
				.then(function () {
					return indexing(defaultWorkdir)
						.then(function () {
							return scheduleIndex(defaultWorkdir, interval);
						}).catch(function () {
							return scheduleIndex(defaultWorkdir, interval);
						});
				});
		});
	}
	function waitForAWhile(interval) {
		return new Promise(function (fulfill) {
			setTimeout(function () {
				return fulfill();
			}, interval);
		});
	}

	this.onmessage = function (event) {
		this.postMessage({
			result: "Indexing"
		});
		scheduleIndex(event.data.workspaceDir, event.data.inverval);
	}.bind(this);

} catch (err) {
	console.log(err.message);
}