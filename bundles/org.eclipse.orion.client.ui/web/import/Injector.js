/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define console window*/
define(['require', 'orion/Deferred', 'orion/xhr', 'orion/form', 'orion/URL-shim'], function(require, Deferred, xhr, form, _) {
	function debug(msg) { console.log('orion injector: ' + msg); }

	/**
	 * Transformer for errors returned by XHRs
	 */
	function xhrErrorSanitizer(err) {
		if (err && typeof err.xhr === 'object') {
			delete err.xhr;
		}
		return err;
	}

	function Injector(fileClient, serviceRegistry) {
		this.fileClient = fileClient;
		this.serviceRegistry = serviceRegistry;
	}
	/**
	 * @param {Boolean} createUser True to create a new user, false to use an existing user.
	 * @param {Object} [userInfo=null] User data for creating new user, or for logging in.
	 * When <code>createUser</code> is true, a guest user may be created by providing the following parameters in userInfo:
	 * <dl>
	 *  <dt>{Boolean} userInfo.Guest</dt> <dd><code>true</code></dd>
	 *  <dt>{String} [userInfo.Name]</dt> <dd>Optional, provides the display name for the guest user.</dd>
	 * </ul>
	 * Alternatively, a regular Orion account may created by providing the following parameters in userInfo:
	 * <dl>
	 *  <dt>{String} userInfo.Email</dt> <dd>Required. May be user for email validation.</dd>
	 *  <dt>{String} userInfo.Login</dt> <dd>Required.</dd>
	 *  <dt>{String} userInfo.Password</dt> <dd>Required.</dd>
	 *  <dt>{String} [userInfo.Name]</dt> <dd>Optional.</dd>
	 * </dl>
	 * If <code>createUser</code> is false and userInfo is not provided, the client assumed to be authenticated already.
	 * @param {Blob} projectZipData
	 * @param {String} projectName
	 */
	Injector.prototype.inject = function(isCreateUser, userInfo, projectZipData, projectName) {
		projectName = projectName || 'Project';
		var fileClient = this.fileClient;
		var serviceRegistry = this.serviceRegistry;
		var authService = serviceRegistry.getService('orion.core.auth'); //$NON-NLS-0$
		var userService = serviceRegistry.getService('orion.core.user'); //$NON-NLS-0$
		if (!authService || !userService) {
			throw "Missing auth or user service";
		}

		// Log in -- TODO no service API for this, so it's hardcoded
		var doLogin = function(login, password) {
			debug('logging in...');
			var formData = {
				login: login
			};
			if (typeof password === 'string') {
				formData.password = password;
			}
			return xhr('POST', '../login/form', {
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Orion-Version': '1'
				},
				data: form.encodeFormData(formData)
			}).then(function(xhrResult) {
				return JSON.parse(xhrResult.response);
			});
		};
		var getLoggedInUser = function() {
			return authService.getUser().then(function(user) {
				if (!user) {
					return new Deferred().reject("Not logged in");
				}
				return userService.getUserInfo(user.Location);
			});
		};
		var ensureUserLoggedIn = function() {
			if (isCreateUser) {
				var displayName = userInfo.Name;
				return userService.createUser(userInfo).then(function(user) {
					debug('user created');
					return user;
				}).then(function(user) {
					debug('login: ' + user.login);
					debug('password: ' + user.password);
					return doLogin(user.login, user.password);
				}).then(function(user) {
					debug('set display name of ' + user.login + ' to ' + displayName);
					user.Name = displayName;
					return userService.updateUserInfo(user.Location, user).then(function(/*xhrResult*/) {
						return user;
					});
				});
			} else if (userInfo) {
				return doLogin(userInfo.login, userInfo.password);
			} else {
				// !createUser and !userInfo implies we're already authenticated, so just get the user
				return getLoggedInUser();
			}
		};
		// Creates project if necessary, and returns its metadata
		var ensureProjectExists = function(location, name) {
			return fileClient.createProject(location, name).then(function(p) {
				console.log('Created project: ' + p.Location);
				return fileClient.read(p.ContentLocation, true);
			}, function(e) {
				e = e.response || e;
				// This is awful, but there's no better way to check if a project exists?
				if (typeof e === 'string' && e.toLowerCase().indexOf('duplicate') !== -1) {
					return fileClient.read(location, true).then(function(workspace) {
						var projects = workspace.Children, project;
						projects.some(function(p) {
							if (p.Name === name) {
								project = p;
								console.log('Got existing project: ' + p.Location);
								return true;
							}
						});
						return project || new Deferred().reject(e);
					});
				}
				return new Deferred.reject(e);
			});
		};
		var readProject = function(project) {
			return fileClient.read(project.ChildrenLocation, true);
		};
		var uploadZip = function(importLocation, zipData) {
			// TODO why don't file service impls support this??
			return xhr('POST', importLocation, {
				headers: {
					Slug: 'data.zip' // Doesn't matter -- will be unzipped anyway
				},
				data: zipData
			});
		};
		var importContent = function() {
			return fileClient.loadWorkspace().then(function(workspace) {
				console.log('loaded workspace ' + workspace.Location);
				return ensureProjectExists(workspace.ChildrenLocation, projectName).then(function(project) {
					return readProject(project).then(function(projectMetadata) {
						console.log('Unzipping (importing) to ' + projectMetadata.ImportLocation);
						return uploadZip(projectMetadata.ImportLocation, projectZipData).then(function() {
							return readProject(project).then(function(projectMetadata) {
								return projectMetadata;
							});
						});
					});
				});
			});
		};

		return ensureUserLoggedIn().then(function(loggedInUser) {
			return importContent();
		}).then(null, xhrErrorSanitizer);
	};
	return Injector;
});