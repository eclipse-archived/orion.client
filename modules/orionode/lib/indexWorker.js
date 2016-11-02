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
	var DEBUG = false;
	var indexWorkspaceDir;
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
	 * Git Page Related operations,apply patch,rebase..: (indexAfterAllDone)
	 *  postpone whole index until all subsequent git operations requests all done
	 */
	var Indexer = function (indexDir) {
		this.LONG_WAITING = 1000;
		this.SHORT_WAITING = 500;
		this.updateIndexEntry = function (updatePackage, userworkspaceDir, userID) {
			var oldfilePath = updatePackage.location && updatePackage.location.substring(6);
			var newFilePath = updatePackage.filepath;
			var fileName = updatePackage.name;
			if(oldfilePath){
				// Rename operation
				this.indexAfterAllDone(Indexer.SHORT_WAITING, userworkspaceDir, userID);
			}else if(newFilePath){
				addOneNewIndex(newFilePath,fileName, userworkspaceDir, indexDir, userID);
			}
		}.bind(this);
		this.indexAfterAllDone = function(interval, userworkspaceDir, userID){
			if (this.doIndexTimeout) {
				clearTimeout(this.doIndexTimeout);
			}
			this.doIndexTimeout = setTimeout(function() {
				indexing(userworkspaceDir, indexDir, userID);
				this.doIndexTimeout = null;
			}.bind(this), interval);
		};
		this.doIndex = function(userworkspaceDir, userID){
			return indexing(userworkspaceDir, indexDir, userID);
		};
	};

	var getIndexer = function (indexDir) {
		return new Indexer(indexDir);
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
			}).catch(function(err){
			});
	}


	function indexing(workspaceDir, indexDir, userId) {
		var refId = {
			id: 0
		};
		var index = initIndex();
		var targetWorkspaceDir = indexWorkspaceDir ? indexWorkspaceDir : workspaceDir; // This is to handle a special case in electron, when user switch work spaces.
		return fs.readdirAsync(targetWorkspaceDir)
			.then(function (children) {
				DEBUG && console.log("indexing workspace: ",targetWorkspaceDir);
				DEBUG && console.time("indexing");
				return Promise.map(children, function (child) {
					return makedocs(targetWorkspaceDir, targetWorkspaceDir, child, refId, index);
				}, {
						concurrency: SUBDIR_SEARCH_CONCURRENCY
					});
			}).then(function () {
				DEBUG && console.timeEnd("indexing");
				return saveIndexToFile(index ,indexDir, userId);
			}).catch(function(err){
			});
	}

	function saveIndexToFile(index, indexDir, userId) {
		return new Promise(function (fulfill, reject) {
			originalFs.writeFile(path.join(indexDir,userId)+".json", JSON.stringify(index), function (err) {
				if (err) {
					reject(err);
				}
				DEBUG && console.log("index saved");
				fulfill(index);
			});
		});
	}
	
	function addOneNewIndex(newFilePath,fileName, workspaceDir, indexDir, userId) {
		return fs.statAsync(newFilePath)
		.then(function (stats) {
			if (!stats.isDirectory()) {
				var index = initIndex();
				return fs.readFileAsync(path.join(indexDir,userId)+".json", "utf8").then(function (file) {
					return index = elasticlunr.Index.load(JSON.parse(file));
				}).catch(function(){
					return;
				}).then(function () {
					var filePathFromWorkspace = newFilePath.substring(workspaceDir.length);
					var newIndexEntry = {
						"Name": fileName,
						"Path": filePathFromWorkspace.substring(1),
						"id":  index.documentStore.length
					};
					index.addDoc(newIndexEntry);
				}).then(function(){
					return saveIndexToFile(index, indexDir, userId);
				});
			}
		});
	}

	var scheduleIndex = function (workspaceDir, interval, indexDir, userId) {
		return Promise.resolve(workspaceDir).then(function (workspaceDir) {
			return waitForAWhile(interval)
				.then(function () {
					return indexing(workspaceDir, indexDir, userId)
						.then(function () {
							return scheduleIndex(workspaceDir, interval, indexDir, userId);
						}).catch(function () {
							return scheduleIndex(workspaceDir, interval, indexDir, userId);
						});
				});
		});
	};
	function waitForAWhile(interval) {
		return new Promise(function (fulfill) {
			setTimeout(function () {
				return fulfill();
			}, interval);
		});
	}
	
	if (typeof module !== "undefined") {
		module.exports.scheduleIndex = scheduleIndex;
		module.exports.getIndexer = getIndexer;
	}

	this.onmessage = function (event) {
		switch(event.data.type){
			case "startIndex":
				this.scheduleIndex(event.data.workspaceDir, event.data.inverval, event.data.indexDir, event.data.userId);
				break;
			
			case "workspaceDirChange":
				indexWorkspaceDir = event.data.workspaceDir;
				break;
		}	
	}.bind(this);

}catch (err){
	console.log(err.message);
}