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
	var isIndexing = false;
	var appendingIndexOperation = false;

	/**
	 * updating logic:
	 * Add new: (updateIndexEntry)
	 * 	file: add one index
	 *  folder: do nothing
	 * Rename: (updateIndexEntry)
	 *  postpone whole index until all subsequent rename requests all done.
	 * Delete: (indexAfterAllDone)
	 *  postpone whole index until all subsequent delete requests all done
	 * Drag and drop files or folder: (indexAfterAllDone)
	 *  postpone whole index until all subsequent files drag in requests all done
	 * Git Page Related operations: (doIndex)
	 *  redo whole index for workspace, or scheldue another whole index if there is one going on.
	 */
	var Indexer = function (workspaceDir) {
		this.doIndex = function () {
			if(!isIndexing){
				indexing(workspaceDir);
			}else{
				appendingIndexOperation = true;	
			}
		};
		this.updateIndexEntry = function (updatePackage) {
			var oldfilePath = updatePackage.location && updatePackage.location.substring(6);
			var newFilePath = updatePackage.filepath;
			var fileName = updatePackage.name;
			if(oldfilePath){
				// Rename operation
				this.indexAfterAllDone(500);
			}else if(newFilePath){
				addOneNewIndex(newFilePath,fileName, workspaceDir);
			}
		}.bind(this);
		this.indexAfterAllDone = function(interval){
			if (this.doIndexTimeout) {
				clearTimeout(this.doIndexTimeout);
			}
			this.doIndexTimeout = setTimeout(function() {
				indexing(workspaceDir);
				this.doIndexTimeout = null;
			}.bind(this), interval);
		};
	};

	var getIndexer = exports.getIndexer = function (workspaceDir) {
		return new Indexer(workspaceDir);
	};

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
				return Promise.map(children, function (child) {
					return makedocs(workspaceDir, workspaceDir, child, refId, index);
				}, {
						concurrency: SUBDIR_SEARCH_CONCURRENCY
					});
			}).then(function () {
				return saveIndexToFile(index);
			}).then(function(){
				// However, in the 'long' process of indexing operation, if there's a new indexing request, append it.
				if(appendingIndexOperation){
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
				isIndexing = false;
				fulfill();
			});
		});
	}
	
	function addOneNewIndex(newFilePath,fileName, workspaceDir) {
		return fs.statAsync(newFilePath)
		.then(function (stats) {
			if (!stats.isDirectory()) {
				var index = initIndex();
				isIndexing = true;
				return fs.readFileAsync("orionIndex.json", "utf8").then(function (file) {
					return index = elasticlunr.Index.load(JSON.parse(file));
				}).then(function () {
					var filePathFromWorkspace = newFilePath.substring(workspaceDir.length);
					var newIndexEntry = {
						"Name": fileName,
						"Path": filePathFromWorkspace.substring(1),
						"id":  index.documentStore.length
					};
					index.addDoc(newIndexEntry);
				}).then(function(){
					return saveIndexToFile(index);
				});
			}
		})
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