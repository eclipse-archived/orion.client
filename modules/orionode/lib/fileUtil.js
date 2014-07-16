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
var crypto = require('crypto');
var fs = require('fs');
var dfs = require('deferred-fs'), Deferred = dfs.Deferred;
var path = require('path');
var rimraf = require('rimraf');
var url = require('url');
var api = require('./api');
var async = require('./async');

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
var getChildren = exports.getChildren = function(directory, parentLocation, excludes, callback) {
	// If 'excludes' is omitted, the callback can be given as the 3rd argument
	callback = excludes || callback;
	dfs.readdir(directory).then(function(files) {
		// stat each file to find if it's a Directory -- ugh
		var childStatPromises = files.map(function(file) {
			if (Array.isArray(excludes) && excludes.indexOf(file) !== -1) {
				return null; // omit
			}
			var filepath = path.join(directory, file);
			return dfs.stat(filepath).then(function(stat) {
				return [filepath, stat];
			});
		}).filter(function(f) { return f; }); // skip omitted stuff
		Deferred.all(childStatPromises).then(function(childStats) {
			var children = childStats.map(function(cs) {
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
				if (isDirectory)
					child.ChildrenLocation = api.join(parentLocation, childname) + '?depth=1';
				return child;
			});
			callback(children); //yay
		});
	});
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

/**
 * @param {Object} debugMeta The meta data of the debug URL
 * @param {String} hostName Optional If not defined use the debugMeta.hostname
 * @returns {String} The debug URL enclosed with "[" and "]".
 * The returned value is URL-decoded.
 * @throws {Error} If rest is outside of the workspaceDir (and thus is unsafe)
 */
exports.generateDebugURL = function(debugMeta, hostName) {
	var hName = hostName ? hostName : debugMeta.hostname;
	return url.format({
			protocol: debugMeta.protocol,
			hostname: hName,
			port:  debugMeta.port,
			pathname: debugMeta.pathname,
			query: debugMeta.query
		});
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

function _copyDir(srcPath, destPath, callback) {
	var _copyRecursive, processDir, cpDir, cpFile;
	destPath = destPath[destPath.length-1] === path.sep ? destPath : destPath + path.sep;

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
		return dfs.readdir(dir.path).then(function(files) {
			return Deferred.all(files.map(function(filename) {
				var fullpath = path.join(dir.path, filename);
				return dfs.stat(fullpath).then(function(stat) {
					if (stat.isDirectory()) {
						stack.push({path: fullpath, dir: true});
					} else {
						dirlist.push({path: fullpath, dir: false});
					}
					return new Deferred().resolve();
				});
			}));
		});
	};
	cpDir = function(dirlist) {
		return async.sequence(dirlist.map(function(d) {
			if(d.dir){
				var currentDestFolderPath = d.path.replace(srcPath, destPath);
				return function() {
					return dfs.mkdir(currentDestFolderPath);
				};
			} else {
				return function(){
					var currentDestFolderPath = d.path.replace(srcPath, destPath);
					var rs = dfs.createReadStream(d.path);
					var ws = dfs.createWriteStream(currentDestFolderPath);
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
var copy = exports.copy = function(srcPath, destPath, callback) {
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
var withStats = exports.withStats = function(filepath, callback) {
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
 * @param input A stream or a string.
 */
function ETag(input) {
	var hash = crypto.createHash('sha1'), _this = this;
	var update = function(data) {
		hash.update(data);
	};
	var end = function() {
		_this.value = hash.digest('base64');
	};

	if (typeof input === "string") {
		update(input);
		end();
		return;
	}
	input.on('data', update);
	input.on('end', end);
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
			ReadOnly: false,//!(stats.mode & USER_WRITE_FLAG === USER_WRITE_FLAG),
			Executable: false//!(stats.mode & USER_EXECUTE_FLAG === USER_EXECUTE_FLAG)
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
	} else {
		// Orion's File Client expects ChildrenLocation to always be present
		metaObj.ChildrenLocation = api.join(fileRoot, wwwpath) + '?depth=1';
		if (!includeChildren) {
			api.write(null, res, null, metaObj);
		} else {
			getChildren(filepath, api.join(fileRoot, wwwpath)/*this dir*/, null/*omit nothing*/, function(children) {
				var name = path.basename(filepath);
				if (name[name.length-1] === path.sep) {
					name = name.substring(0, name.length-1);
				}
				metaObj.Children = children;
//				var childrenJSON = JSON.stringify(children);
//				var folder = JSON.stringify({
//					ChildrenLocation: api.join(fileRoot, rest) + '?depth=1',
//					LocalTimeStamp: stats.mtime.getTime(),
//					Location: api.join(fileRoot, rest),
//					Name: decodeURIComponent(name),
//					Parents: getParents(filepath, rest)
//				});
//				api.write(200, res, null, folder)
				api.write(null, res, null, metaObj);
			});
		}
	}
};

/**
 * The connect framework removes leading path segments that precede the path Orion is mounted at. This function
 * returns the leading segments.
 * @param {Request} req Request object.
 */
var getContextPath = exports.getContextPath = function(req) {
	var orig = req.originalUrl, _url = req.url;
	return orig.substr(0, orig.length - _url.length);
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
	var getSafeFilePath = safeFilePath.bind(null, workspaceDir);
	var isDirectory = req.body && getBoolean(req.body, 'Directory');
	var fileRootUrl = getContextPath(req) + fileRoot;

	fs.exists(destFilepath, function(destExists) {
		function checkXCreateOptions(opts) {
			// Can't have both copy and move
			return opts.indexOf('copy') === -1 || opts.indexOf('move') === -1;
		}
		function writeCreatedFile(error) {
			if (error) {
				api.writeError(500, res, error);
				return;
			} else if (req.body) {
				// var fileAtts = req.body.Attributes;
				// TODO: maybe set ReadOnly and Executable based on fileAtts
			}
			if (typeof statusCode === 'number') {
				res.statusCode = statusCode;
			} else {
				// Status code 200 indicates that an existing resource was replaced, or we're POSTing to a URL
				res.statusCode = destExists ? 200 : 201;
			}
			withStats(destFilepath, function(error, stats) {
				if (error) {
					api.writeError(500, res, error);
					return;
				}
				writeFileMetadata(fileRootUrl, res, wwwpath, destFilepath, stats, /*etag*/null, /*includeChildren*/false, metadataMixins);
			});
		}
		function createFile() {
			if (isDirectory) {
				fs.mkdir(destFilepath, writeCreatedFile);
			} else {
				fs.writeFile(destFilepath, '', writeCreatedFile);
			}
		}
		function doCopyOrMove(isCopy) {
			var sourceUrl = req.body.Location;
			if (!sourceUrl) {
				api.writeError(400, res, 'Missing Location property in request body');
				return;
			}
			var sourceFilepath = getSafeFilePath(api.rest(fileRootUrl, api.matchHost(req, sourceUrl)));
			fs.exists(sourceFilepath, function(sourceExists) {
				if (!sourceExists) {
					api.write(404, res, null, 'File not found: ' + sourceUrl);
					return;
				}
				if (isCopy) {
					copy(sourceFilepath, destFilepath, writeCreatedFile);
				} else {
					fs.rename(sourceFilepath, destFilepath, writeCreatedFile);
				}
			});
		}

		var xCreateOptions = (req.headers['x-create-options'] || "").split(",");
		if (!checkXCreateOptions(xCreateOptions)) {
			api.write(400, res, null, 'Illegal combination of X-Create-Options.');
			return;
		}
		if (xCreateOptions.indexOf('no-overwrite') !== -1 && destExists) {
			res.setHeader('Content-Type', 'application/json');
			res.statusCode = 412;
			res.end(JSON.stringify({Message: 'A file or folder with the same name already exists at this location.'}));
			return;
		} 
		var isCopy;
		if ((isCopy = xCreateOptions.indexOf('copy') !== -1) || (xCreateOptions.indexOf('move') !== -1)) {
			doCopyOrMove(isCopy);
		} else {
			if (destExists) {
				fs.unlink(destFilepath, createFile);
			} else {
				createFile();
			}
		}
	});	
};
