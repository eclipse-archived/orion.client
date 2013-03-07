/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved.
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define console window*/
define(['orion/Deferred', 'orion/xhr', 'orion/URL-shim'], function(Deferred, xhr, _) {

	function Injector(fileClient, usersClient) {
		this.fileClient = fileClient;
		this.usersClient = usersClient;
	}
	Injector.prototype.inject = function(user, projectZipData) {
		var fileClient = this.fileClient;
//		var usersClient = this.usersClient;
		// FIXME: this needs to create a user and login
		// right now it assumes you're already logged in
		var createUserAndLogin = function() {
			return new Deferred().resolve();
		};
//		var createUserAndLogin = function() {
//			var d = new Deferred();
//			usersClient.createUser(user.Name, user.Password, user.Email).then(function(r) {
//				d.resolve(r);
//			}, function(e) {
//				if (e && e.Message && e.Message.indexOf('already exists') !== -1) {
//					// TODO need to get the user here
//					return d.resolve();
//				}
//				return d.reject(e);
//			});
//			return d;
//		};
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
		var uploadZip = function(importLocation, zipData) {
			// TODO why don't file service impls support this??
			return xhr('POST', importLocation, {
				headers: {
					Slug: 'data.zip' // Doesn't matter -- will be unzipped anyway
				},
				data: zipData
			});
		};

		return createUserAndLogin().then(function() {
			return fileClient.loadWorkspaces().then(function(workspaces) {
				// TODO which workspace?
				return fileClient.loadWorkspace(workspaces[0].Location).then(function(workspace) {
					console.log('loaded workspace ' + workspace.Location);
					return ensureProjectExists(workspace.ChildrenLocation, 'Code Samples').then(function(project) {
						return fileClient.read(project.ChildrenLocation, true).then(function(projectMetadata) {
							console.log('Unzipping (importing) to ' + projectMetadata.ImportLocation);
							return uploadZip(projectMetadata.ImportLocation, projectZipData).then(function() {
								return projectMetadata;
							});
						});
					});
				});
			});
		});
	};
	return Injector;
});