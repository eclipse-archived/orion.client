/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global exports require*/
var crypto = require('crypto');
var fs = require('fs');
var pfs = require('promised-io/fs');
var PromisedIO = require('promised-io');
var Deferred = PromisedIO.Deferred;
var path = require('path');
var url = require('url');
var api = require('./api');

/*
 * Utils for representing files as objects in the Orion File API
 * http://wiki.eclipse.org/Orion/Server_API/File_API
 */

/**
 * Builds up an array of a directory's children, as File objects.
 * @param {String} parentLocation Parent location in the file api for child items (ugh)
 * @param {Array} [exclude] Filenames of children to hide. If omitted, everything is included.
 * @param {Function} callback
 * @returns {Array}
 */
// TODO depth
exports.getChildren = function(directory, parentLocation, excludes, callback) {
	// If 'excludes' is omitted, the callback can be given as the 3rd argument
	callback = excludes || callback;
	pfs.readdir(directory).then(function(files) {
		// stat each file to find if it's a Directory -- ugh
		var childStatPromises = files.map(function(file) {
			if (Array.isArray(excludes) && excludes.indexOf(file) !== -1) {
				return null; // omit
			}
			var filepath = path.join(directory, file);
			return pfs.stat(filepath).then(function(stat) {
				return [filepath, stat];
			});
		}).filter(function(f) { return f; }); // skip omitted stuff
		PromisedIO.all(childStatPromises).then(function(childStats) {
			var children = childStats.map(function(cs) {
				var childname = path.basename(cs[0]);
				var isDirectory = cs[1].isDirectory();
				var timeStamp = cs[1].mtime.getTime();
				var size = cs[1].size;
				var location = api.join(parentLocation, encodeURIComponent(childname));
				if(isDirectory && location[location.length-1] !== "/"){
					location = location +"/";
				}
				return {
					Name: childname,
					Id: childname,
					Length: size,
					LocalTimeStamp: timeStamp,
					Directory: isDirectory,
					Location: location,
					ChildrenLocation: isDirectory ? api.join(parentLocation, childname) + '?depth=1' : null
				};
			});
			callback(children); //yay
		});
	});
};

/**
 * @parma {String} p A location in the local filesystem (eg C:\\Users\\whatever\\foo)
 * @throws {Error} If p is outside the workspaceDir (and thus is unsafe)
 */
var _safeFilePath = exports.safePath = function(workspaceDir, p) {
	workspaceDir = path.normalize(workspaceDir);
	p = path.normalize(p);
	var relativePath = path.relative(workspaceDir, p);
	if (relativePath.indexOf('..' + path.sep) === 0) {
		throw new Error('Path ' + p + ' is outside workspace');
	}
	return p;
};

/**
 * @param {String} filepath The URL-encoded path, for example 'foo/My%20Work/baz.txt'
 * @returns {String} The filesystem path represented by interpreting 'path' relative to the workspace dir.
 * The returned value is URL-decoded.
 * @throws {Error} If rest is outside of the workspaceDir (and thus is unsafe)
 */
exports.safeFilePath = function(workspaceDir, filepath) {
	return _safeFilePath(workspaceDir, path.join(workspaceDir, decodeURIComponent(filepath)));
};

/**
 * @param {Object} debugMeta The meta data of the debug URL
 * @param {String} hostName Optional If not defined use the debugMeta.hostname
 * @returns {String} The debug URL enclosed with "[" and "]".
 * The returned value is URL-decoded.
 * @throws {Error} If rest is outside of the workspaceDir (and thus is unsafe)
 */
exports.generateDebugURL = function(debugMeta, hostName) {
	var hName = hostName ? hostName : debugMeta.hostname;
	return "[" + url.format({
			protocol: debugMeta.protocol,
			hostname: hName,
			port:  debugMeta.port,
			pathname: debugMeta.pathname
		}) + "]";
};

/**
 * Performs the equivalent of rm -rf on a directory.
 * @param {Function} callback Invoked as callback(error)
 */
exports.rumRuff = function rumRuff(dirpath, callback) {
	var unlinkRecursive, processDir, rmdirs;
	/** @returns A promise that resolves once all files in the tree rooted at 'root' have been unlinked.
	 * @param {Array} List of directories, in deepest-first order, that will have to be removed later.
	 */
	unlinkRecursive = function(root, dirlist) {
		var stack = [root];
		var treeDone = new Deferred();
		(function handleNextDir() {
			if (!stack.length) {
				treeDone.resolve();
				return;
			}
			var dir = stack.pop();
			dirlist.unshift(dir);
			processDir(stack, dir).then(handleNextDir);
		}());
		return treeDone;
	};
	/** @returns A promise that resolves once all items in 'dir' have been either: deleted (if simple file) or 
	 * pushed to 'stack' for later handling (if directory).
	 * @param {Array} stack
	 * @param {String} dir
	 */
	processDir = function(stack, dir) {
		return PromisedIO.all(pfs.readdir(dir).then(function(files) {
			return PromisedIO.all(files.map(function(filename) {
				var fullpath = path.join(dir, filename);
				return pfs.stat(fullpath).then(function(stat) {
					if (stat.isDirectory()) {
						stack.push(fullpath);
						return new Deferred().resolve();
					} else {
//						console.log('unlink ' + fullpath);
						return pfs.unlink(fullpath);
					}
				});
			}));
		}));
	};
	rmdirs = function(dirlist) {
//		console.log('about to remove: [' + dirlist.join(',') + ']');
		return PromisedIO.all(dirlist.map(function(d) {
//			console.log('rmdir  ' + d);
			return pfs.rmdir(d);
		}));
	};
	// recursively unlink files, then remove the (empty) dirs
	var dirlist = [];
	unlinkRecursive(dirpath, dirlist).then(function() {
		return rmdirs(dirlist);
	}).then(callback.bind(null, null), callback);
};

function _copyDir(srcPath, destPath, callback) {
	var _copyRecursive, processDir, cpDir, cpFile;
	/** @returns A promise that resolves once all directories in the tree rooted at 'root' have been copied.
	 * @param {Array} List of the mix of files and directories, in the top down order, that will be copied first for all folders then files.
	 */
	_copyRecursive = function(root, dirlist) {
		var stack = [{path: root, dir: true}];
		var treeDone = new Deferred();
		(function handleNextDir() {
			if (!stack.length) {
				treeDone.resolve();
				return;
			}
			var dir = stack.shift();
			dirlist.push(dir);
			processDir(stack, dir, dirlist).then(handleNextDir);
		}());
		return treeDone;
	};
	/** @returns A promise that resolves once all items in 'dir' have been either: deleted (if simple file) or 
	 * pushed to 'stack' for later handling (if directory).
	 * @param {Array} stack
	 * @param {String} dir
	 * @param {Array} List of the mix of files and directories, in the top down order, that will be copied first for all folders then files.
	 */
	processDir = function(stack, dir, dirlist) {
		return PromisedIO.all(pfs.readdir(dir.path).then(function(files) {
			return PromisedIO.all(files.map(function(filename) {
				var fullpath = path.join(dir.path, filename);
				return pfs.stat(fullpath).then(function(stat) {
					if (stat.isDirectory()) {
						stack.push({path: fullpath, dir: true});
					} else {
						dirlist.push({path: fullpath, dir: false});
					}
					return new Deferred().resolve();
				});
			}));
		}));
	};
	cpDir = function(dirlist) {
		return PromisedIO.all(dirlist.map(function(d) {
			if(d.dir){
				var currentDestFolderPath = d.path.replace(srcPath, destPath);
				return pfs.mkdir(currentDestFolderPath);
			} else {
				return function(){
					var currentDestFolderPath = d.path.replace(srcPath, destPath);
					var rs = pfs.createReadStream(d.path);
					var ws = pfs.createWriteStream(currentDestFolderPath);
					rs.pipe(ws);
				};
			}
		}));
	};
	cpFile = function(dirlist) {
		dirlist.forEach(function(item) {
			if(!item.dir){
				var currentDestFolderPath = item.path.replace(srcPath, destPath);
				var rs = fs.createReadStream(item.path);
				var ws = fs.createWriteStream(currentDestFolderPath);
				rs.pipe(ws);
			}
		});
	};
	// recursively copy directories, then copy all the files cached
	var dirlist = [];
	_copyRecursive(srcPath, dirlist).then(function() {
		return cpDir(dirlist);
	}).then(function() {
		cpFile(dirlist);
		callback();
	}, function(error) {
		callback(error);
	});
}


/**
 * Copy srcPath to destPath
 * @param {String} srcPath
 * @param {String} destPath
 * @param {Function} callback Invoked as callback(error, destPath)
 */
exports.copy = function(srcPath, destPath, callback) {
	fs.stat(srcPath, function(error, stats) {
		if (error) { callback(error); }
		else {
			if (stats.isDirectory()) {
				_copyDir( srcPath, destPath, callback);
			} else if (stats.isFile()) {
				var rs = fs.createReadStream(srcPath);
				var ws = fs.createWriteStream(destPath);
				rs.pipe(ws);
				rs.on('error', callback);
				rs.on('end', callback.bind(null, null, destPath));
			}
		}
	});
};

/**
 * @param {Function} callback Invoked as callback(error, stats)
 */
exports.withStats = function(filepath, callback) {
	fs.stat(filepath, function(error, stats) {
		if (error) { callback(error); }
		else {
			callback(null, stats);
		}
	});
};

/**
 * @name orion.node.ETag
 * @class Represents an ETag for a stream.
 */
function ETag(stream) {
	var hash = crypto.createHash('sha1');
	var _this = this;
	stream.on('data', function(d) {
		hash.update(d);
	});
	stream.on('end', function() {
		_this.value = hash.digest('base64');
	});
}
ETag.prototype = /** @lends orion.node.ETag.prototype */ {
	getValue: function() {
		return this.value;
	}
};
exports.ETag = ETag;

/**
 * Gets the stats for filepath and calculates the ETag based on the bytes in the file.
 * @param {Function} callback Invoked as callback(error, stats, etag) -- the etag can be null if filepath represents a directory.
 */
exports.withStatsAndETag = function(filepath, callback) {
	fs.stat(filepath, function(error, stats) {
		if (error) {
			callback(error);
		} else if (stats.isFile()) {
			var stream = fs.createReadStream(filepath);
			var etag = new ETag(stream);
			stream.on('error', function(error) {
				callback(error);
			});
			stream.on('end', function() {
				callback(null, stats, etag.getValue());
			});
		} else {
			// no etag
			callback(null, stats, null);
		}
	});
};
