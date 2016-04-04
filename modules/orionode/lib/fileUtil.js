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
/*eslint-env node*/
/*eslint-disable consistent-return*/
var ETag = require('./util/etag');
var path = require('path');
var Promise = require('bluebird');
var rimraf = require('rimraf');
var api = require('./api');

var fs = Promise.promisifyAll(require('fs'));

/*
 * Utils for representing files as objects in the Orion File API
 * http://wiki.eclipse.org/Orion/Server_API/File_API
 */

/**
 * Builds up an array of a directory's children, as File objects.
 * @param {String} parentLocation Parent location in the file api for child items (ugh)
 * @param {Array} [exclude] Filenames of children to hide. If `null`, everything is included.
 * @param {Function} callback Invoked as func(error?, children)
 * @returns A promise
 */
// TODO depth
var getChildren = exports.getChildren = function(directory, parentLocation, excludes, callback) {
	return fs.readdirAsync(directory)
	.then(function(files) {
		return Promise.map(files, function(file) {
			if (Array.isArray(excludes) && excludes.indexOf(file) !== -1) {
				return null; // omit
			}
			var filepath = path.join(directory, file);
			return fs.statAsync(filepath)
			.then(function(stat) {
				return [filepath, stat];
			})
			.catch(function(err) {
				return err; // suppress rejection
			});
		});
	})
	.then(function(childStats) {
		var results = [];
		childStats.forEach(function(cs) { // cs is [filepath, stat] or Error
			if (cs instanceof Error) {
				// TODO return failures to caller via some side channel
				return;
			}
			var childname = path.basename(cs[0]);
			var isDirectory = cs[1].isDirectory();
			var timeStamp = cs[1].mtime.getTime();
			var size = cs[1].size;
			var location = api.join(parentLocation, encodeURIComponent(childname));
			if(isDirectory && location[location.length-1] !== "/"){
				location = location +"/";
			}
			var child = {
				Name: childname,
				Id: childname,
				Length: size,
				LocalTimeStamp: timeStamp,
				Directory: isDirectory,
				Location: location
			};
			if (isDirectory) {
				child.ChildrenLocation = location + '?depth=1';
				child.ImportLocation = location.replace(/\/file/, "/xfer/import").replace(/\/$/, "");
				child.ExportLocation = location.replace(/\/file/, "/xfer/export").replace(/\/$/, "") + ".zip";
			}
			results.push(child);
		});
		return results;
	})
	.asCallback(callback);
};

/**
 * @parma {String} p A location in the local filesystem (eg C:\\Users\\whatever\\foo)
 * @throws {Error} If p is outside the workspaceDir (and thus is unsafe)
 */
var safePath = exports.safePath = function(workspaceDir, p) {
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
var safeFilePath = exports.safeFilePath = function(workspaceDir, filepath) {
	return safePath(workspaceDir, path.join(workspaceDir, decodeURIComponent(filepath)));
};

var getParents = exports.getParents = function(fileRoot, relativePath) {
	var segs = relativePath.split('/');
	if(segs && segs.length > 0 && segs[segs.length-1] === ""){// pop the last segment if it is empty. In this case wwwpath ends with "/".
		segs.pop();
	}
	segs.pop();//The last segment now is the directory itself. We do not need it in the parents array.
	var loc = fileRoot;
	var parents = [];
	for (var i=0; i < segs.length; i++) {
		var seg = segs[i];
		loc = api.join(loc, seg);
		parents.push({
			Name: decodeURIComponent(seg),
			ChildrenLocation: loc + '?depth=1', 
			Location: loc
		});
	}
	return parents.reverse();
};

/**
 * Performs the equivalent of rm -rf on a directory.
 * @param {Function} callback Invoked as callback(error)
 */
exports.rumRuff = function(dirpath, callback) {
	rimraf(dirpath, callback);
};

// @returns promise or invokes callback
function _copyDir(srcPath, destPath, callback) {
	var _copyRecursive, processDir, cpDir, cpFile;
	destPath = destPath[destPath.length-1] === path.sep ? destPath : destPath + path.sep;

	/** @returns A promise that resolves once all directories in the tree rooted at 'root' have been copied.
	 * @param {Array} List of the mix of files and directories, in the top down order, that will be copied first for all folders then files.
	 */
	_copyRecursive = function(root, dirlist) {
		var stack = [{path: root, dir: true}];
		return new Promise(function(resolve) {
			(function handleNextDir() {
				if (!stack.length) {
					resolve();
					return;
				}
				var dir = stack.shift();
				dirlist.push(dir);
				processDir(stack, dir, dirlist).then(handleNextDir);
			}());
		});
	};
	/** @returns A promise that resolves once all items in 'dir' have been either: deleted (if simple file) or 
	 * pushed to 'stack' for later handling (if directory).
	 * @param {Array} stack
	 * @param {String} dir
	 * @param {Array} List of the mix of files and directories, in the top down order, that will be copied first for all folders then files.
	 */
	processDir = function(stack, dir, dirlist) {
		return fs.readdirAsync(dir.path).then(function(files) {
			return Promise.all(files.map(function(filename) {
				var fullpath = path.join(dir.path, filename);
				return fs.statAsync(fullpath).then(function(stat) {
					if (stat.isDirectory()) {
						stack.push({path: fullpath, dir: true});
					} else {
						dirlist.push({path: fullpath, dir: false});
					}
					return Promise.resolve();
				});
			}));
		});
	};
	cpDir = function(dirlist) {
		return Promise.each(dirlist, function(d) {
			var currentDestFolderPath = d.path.replace(srcPath, destPath);
			if (d.dir) {
				return fs.mkdirAsync(currentDestFolderPath);
			}
			// file
			var rs = fs.createReadStream(d.path);
			var ws = fs.createWriteStream(currentDestFolderPath);
			rs.pipe(ws);
			// TODO resolve once writing has finished?
			// return new Promise((resolve) => rs.on('end', resolve))
			return Promise.resolve();
		});
	};
	cpFile = function(dirlist) {
		dirlist.forEach(function(item) {
			if(!item.dir){
				var currentDestFolderPath = item.path.replace(srcPath, destPath);
				var rs = fs.createReadStream(item.path);
				var ws = fs.createWriteStream(currentDestFolderPath);
				rs.pipe(ws);
				// TODO resolve once writing has finished?
			}
		});
	};
	// recursively copy directories, then copy all the files cached
	var dirlist = [];
	return _copyRecursive(srcPath, dirlist)
	.then(function() {
		return cpDir(dirlist);
	}).then(function() {
		return cpFile(dirlist);
	})
	.thenReturn(null)
	.asCallback(callback);
}

/**
 * Copy srcPath to destPath
 * @param {String} srcPath
 * @param {String} destPath
 * @param {Function} callback Invoked as callback(error?, destPath)
 * @returns promise
 */
var copy = exports.copy = function(srcPath, destPath, callback) {
	return fs.statAsync(srcPath)
	.then(function(stats) {
		if (stats.isDirectory()) {
			return _copyDir(srcPath, destPath);
		} else if (stats.isFile()) {
			return new Promise(function(resolve, reject) {
				var rs = fs.createReadStream(srcPath);
				rs.pipe(fs.createWriteStream(destPath));
				rs.on('error', reject);
				rs.on('end', resolve);
			});
		}
		throw new Error("Unknown file type"); // not a file or a directory
	})
	.thenReturn(destPath)
	.asCallback(callback);
};

/**
 * @param {Function} callback Invoked as callback(error, stats)
 * @deprecated just use Promise.promisify(fs).statAsync() instead
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
 * Gets the stats for filepath and calculates the ETag based on the bytes in the file.
 * @param {Function} callback Invoked as callback(error, stats, etag) -- the etag can be null if filepath represents a directory.
 */
exports.withStatsAndETag = function(filepath, callback) {
	fs.stat(filepath, function(error, stats) {
		if (error) {
			callback(error);
			return;
		}
		if (!stats.isFile()) {
			// no etag
			callback(null, stats, null);
			return;
		}
		var etag = ETag();
		var stream = fs.createReadStream(filepath);
		stream.pipe(etag);
		stream.on('error', callback);
		stream.on('end', function() {
			callback(null, stats, etag.read());
		});
	});
};
exports.withETag = function(filepath, callback) {
	var etag = ETag();
	var stream = fs.createReadStream(filepath);
	stream.pipe(etag);
	stream.on('error', callback);
	stream.on('end', function() {
		callback(null, etag.read());
	});
};

/**
 * @returns {String} The Location of for a file resource.
 */
function getFileLocation(fileRoot, wwwpath, isDir) {
	return api.join(fileRoot, wwwpath) + (isDir ? '/' : '');
}

/**
 * Gets a boolean associated with a key. Copes with Orion server REST API's use of "true" and "false" strings.
 * @param {Object} obj
 * @param {String} key
 * @returns {Boolean} Returns <code>false</code> if there is no such key, or if the value is not the boolean <code>true</code> 
 * or the string <code>"true"</code>.
 */
function getBoolean(obj, key) {
	var val = obj[key];
	return Object.prototype.hasOwnProperty.call(obj, key) && (val === true || val === 'true');
}

/**
 * Helper for fulfilling a file metadata GET request.
 * @param {String} fileRoot The "/file" prefix or equivalent.
 * @param {Object} res HTTP response object
 * @param {String} wwwpath The WWW path of the file relative to the fileRoot.
 * @param {String} filepath The physical path to the file on the server.
 * @param {Object} stats
 * @param {String} etag
 * @param {Boolean} [includeChildren=false]
 * @param {Object} [metadataMixins] Additional metadata to mix in to the response object.
 */
var writeFileMetadata = exports.writeFileMetadata = function(fileRoot, res, wwwpath, filepath, stats, etag, includeChildren, metadataMixins) {
	includeChildren = includeChildren || false;
	var isDir = stats.isDirectory();
	var metaObj = {
		Name: decodeURIComponent(path.basename(filepath)),
		Location: getFileLocation(fileRoot, wwwpath, isDir),
		Directory: isDir,
		LocalTimeStamp: stats.mtime.getTime(),
		Parents: getParents(fileRoot, wwwpath),
		//Charset: "UTF-8",
		Attributes: {
			// TODO fix this
			ReadOnly: false, //!(stats.mode & USER_WRITE_FLAG === USER_WRITE_FLAG),
			Executable: false //!(stats.mode & USER_EXECUTE_FLAG === USER_EXECUTE_FLAG)
		}
	};
	if (metadataMixins) {
		Object.keys(metadataMixins).forEach(function(property) {
			metaObj[property] = metadataMixins[property];
		});
	}
	if (etag) {
		metaObj.ETag = etag;
		res.setHeader('ETag', etag);
	}
	if (!isDir) {
		api.write(null, res, null, metaObj);
		return;
	}
	// Orion's File Client expects ChildrenLocation to always be present
	metaObj.ChildrenLocation = metaObj.Location + '?depth=1';
	metaObj.ImportLocation = metaObj.Location.replace(/\/file/, "/xfer/import").replace(/\/$/, "");
	metaObj.ExportLocation = metaObj.Location.replace(/\/file/, "/xfer/export").replace(/\/$/, "") + ".zip";
	if (!includeChildren) {
		api.write(null, res, null, metaObj);
		return;
	}
	getChildren(filepath, api.join(fileRoot, wwwpath)/*this dir*/, null/*omit nothing*/)
	.then(function(children) {
		var name = path.basename(filepath);
		if (name[name.length-1] === path.sep) {
			name = name.substring(0, name.length-1);
		}
		metaObj.Children = children;
		api.write(null, res, null, metaObj);
	})
	.catch(api.writeError.bind(null, 500, res));
};

/**
 * Helper for fulfilling a file POST request (for example, copy, move, or create).
 * @param {String} fileRoot The route of the /file handler (not including context path)
 * @param {Object} req
 * @parma {Object} res
 * @param {String} wwwpath
 * @param {String} destFilepath
 * @param {Object} [metadata] Additional metadata to be mixed in to the File response.
 * @param {Number} [statusCode] Status code to send on a successful response. By default, `201 Created` is sent if
 * a new resource was created, and and `200 OK` if an existing resource was overwritten.
 */
exports.handleFilePOST = function(workspaceDir, fileRoot, req, res, wwwpath, destFilepath, metadataMixins, statusCode) {
	var isDirectory = req.body && getBoolean(req.body, 'Directory');
	if (typeof req.contextPath !== "string") {
		throw new Error("Missing context path");
	}
	var fileRootUrl = req.contextPath + fileRoot;
	var writeResponse = function(isOverwrite) {
		// TODO: maybe set ReadOnly and Executable based on fileAtts
		if (typeof statusCode === 'number') {
			res.status(statusCode);
		} else {
			// Status code 200 indicates that an existing resource was replaced, or we're POSTing to a URL
			res.status(isOverwrite ? 200 : 201);
		}
		return fs.statAsync(destFilepath)
		.then(function(stats) {
			writeFileMetadata(fileRootUrl, res, wwwpath, destFilepath, stats, /*etag*/null, /*includeChildren*/false, metadataMixins);
		})
		.catch(api.writeError.bind(null, 500, res));
	};

	fs.statAsync(destFilepath)
	.catchReturn({ code: 'ENOENT' }, null) // suppress reject when file does not exist
	.then(function(stats) {
		return !!stats; // just return whether the file existed
	})
	.then(function(destExists) {
		var xCreateOptions = (req.headers['x-create-options'] || "").split(",");
		var isCopy = xCreateOptions.indexOf('copy') !== -1, isMove = xCreateOptions.indexOf('move') !== -1;
		if (isCopy && isMove) {
			return api.write(400, res, null, 'Illegal combination of X-Create-Options.');
		}
		if (xCreateOptions.indexOf('no-overwrite') !== -1 && destExists) {
			return api.writeError(412, res, new Error('A file or folder with the same name already exists at this location.'));
		}

		if (isCopy || isMove) {
			var sourceUrl = req.body.Location;
			if (!sourceUrl) {
				return api.writeError(400, res, 'Missing Location property in request body');
			}
			var sourceFilepath = safeFilePath(req.user.workspaceDir, api.rest(fileRootUrl, api.matchHost(req, sourceUrl)));
			return fs.statAsync(sourceFilepath)
			.then(function(/*stats*/) {
				return isCopy ? copy(sourceFilepath, destFilepath) : fs.renameAsync(sourceFilepath, destFilepath);
			})
			.then(writeResponse.bind(null, destExists))
			.catch(function(err) {
				if (err.code === 'ENOENT') {
					return api.writeError(404, res, 'File not found:' + sourceUrl);
				}
				return api.writeError(500, res, err);
			});
		}
		// Just a regular file write
		return Promise.resolve()
		.then(destExists ? fs.unlinkAsync(destFilepath) : null)
		.then(function() {
			return isDirectory ? fs.mkdirAsync(destFilepath) : fs.writeFileAsync(destFilepath, '');
		})
		.then(writeResponse.bind(null, destExists))
		.catch(api.writeError.bind(null, 500, res));
	});
};
