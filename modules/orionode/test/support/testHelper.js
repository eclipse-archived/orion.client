/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

var path = require('path'),
	fs = require('fs');

 /**
  * The server context path, default value is the empty string
  * @since 16.0
  */
exports.CONTEXT_PATH = CONTEXT_PATH = '';
/**
 * The absolute path to the test workspace. Default value is __dirname + .test_workspace
 * @since 16.0
 */
exports.WORKSPACE = WORKSPACE = path.join(__dirname, '.test_workspace');
/**
 * The absolute path to the test metadata. Default value is __dirname + .test_metadata
 * @since 16.0
 */
exports.METADATA = METADATA = path.join(__dirname, '.test_metadata');
/**
 * The id of the test workspace. Value is orionode
 * @since 16.0
 */
exports.WORKSPACE_ID = WORKSPACE_ID = "anonymous-OrionContent";
/**
 * The path of the file endpoint, including the CONTEXT_PATH. Default value is /file
 * @since 16.0
 */
exports.FILE_PATH = FILE_PATH = CONTEXT_PATH + '/file';
/**
 * The path to the workspace endpoint
 * @since 16.0
 */
exports.WORKSPACE_PATH = WORKSPACE_PATH = CONTEXT_PATH + '/workspace';

/**
 * The complete file enpoint prefix. Default value is FILE_PATH + / + WORKSPACE_ID
 * @since 16.0
 */
exports.PREFIX = PREFIX = FILE_PATH + '/' + WORKSPACE_ID;

/**
 * @name createDir
 * @description Create a directory with the given name
 * @param {Request} request The request to use to create the directory
 * @param {string} dirName The name of the directory to create
 * @returns {Promise} A promise from the #expect callback
 * @since 16.0
 */
exports.createDir = function createDir(request, prefix, dirName) {
	return request()
			.post(PREFIX + prefix)
			.type('json')
			.send({ Name: dirName, Directory: true})
			.expect(201);
};

/**
 * @name createFile
 * @description Create a file with the optional contents
 * @param {Request} request The request to use to create the file
 * @param {string} fileNameOrJson The name of the file or the JSON wad
 * @param {string} contents The optional string contents for the file
 * @returns {Promise} A promise from the #expect callback
 * @since 16.0
 */
exports.createFile = function createFile(request, prefix, fileNameOrJson, contents) {
    var json = fileNameOrJson;
    if(typeof fileNameOrJson === 'string') {
        json = {"Name": fileNameOrJson};
    }
    var fileName = json.Name;
	var p = request()
			.post(PREFIX + prefix)
			.type('json')
			.send(json)
			.expect(201);
	
	return p;
};

/**
 * Set the contents of the file
 * @param {?} request The backing request to use
 * @param {string} The full file location to send to
 * @param {string} contents The contents to set
 * @since 16.0
 */
exports.setFileContents = function setFileContents(request, fileLoc, contents) {
	return request()
		.put(fileLoc)
		.send(contents)
		.expect(200);
};

/**
 * @description Creates a directory or directories directly under the WORKSPACE full path.
 * This function will split up and create multipath directories in one call. This functon creates 
 * resources directly in the filesystem using synchronous calls.
 * 
 * @param {string} root The root directory to start creating the new director(y/ies) in
 * @param {string} directoryPath The path to the directory / directories to create
 * @since 16.0
 */
exports.mkdirp = function mkdirp(root, directoryPath) {
	var parts = directoryPath.split(path.sep);
	if(Array.isArray(parts)) {
		var fullPath = root;
		parts.forEach(function(part) {
			fullPath = path.join(fullPath, part);
			if(!fs.existsSync(fullPath)) {
				fs.mkdirSync(fullPath);
			}
		})
	}
};

/**
 * @description Requests the default workspace. Callers must handle calling <code>.end(function(err, res){})</code>
 * on the result
 * @returns {?} Request result promise
 * @since 16.0
 */
exports.withWorkspace = function withWorkspace(request, prefix, workspaceId) {
	return request().get(prefix + '/' + workspaceId);
};

/**
 * @description Throws the cause like `assert.ifError` but allows the message to be overridden
 * 
 * @param {?} cause The cause of the error
 * @param {?} message The message
 * @throws {Error}
 * @since 16.0
 */
exports.throwIfError = throwIfError = function throwIfError(cause, message) {
	if (!cause || !cause instanceof Error && Object.prototype.toString.call(cause) !== '[object Error]' && cause !== 'error') {
		return;
	}
	var err = new Error(message + ": " + cause.message);
	err.cause = cause;
	throw err;
};

/**
 * @description Default error handling for endpoints
 * @param {Express.app} app The app the attach to
 * @param {?} logger The optional logger
 * @since 16.0
 */
exports.handleErrors = handleErrors = function handleErrors(app, logger) {
	app.use(function(err, req, res) {
		if(logger) {
			logger.error(req.originalUrl, err);
		}
		if (res.finished) {
			return;
		}
		if (err) {
			res.status(err.status || 500);
		} else {
			res.status(404);
		}
		// respond with json
		if (req.accepts('json')) {
			return res.send({ error: err ? err.message : 'Not found' });
		}
		// default to plain-text. send()
		res.type('txt').send(err ? err.message : 'Not found');
	});
};