/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node, mocha*/
var assert = require('assert');
var path = require('path');
var testData = require('./support/test_data');
var git = require('nodegit');
var fs = require('fs');
var rmdir = require('rimraf');

var CONTEXT_PATH = '/orionn';
var PREFIX = CONTEXT_PATH + '/workspace', PREFIX_FILE = CONTEXT_PATH + '/file';
var WORKSPACE = path.join(__dirname, '.test_workspace');
var DEFAULT_WORKSPACE_NAME = 'Orionode Workspace';

var app = testData.createApp()
		.use(CONTEXT_PATH, require('../lib/tasks').orionTasksAPI({
			root: '/task',
		}))
		.use(CONTEXT_PATH, require('../lib/workspace')({
			root: '/workspace',
			fileRoot: '/file',
			workspaceDir: WORKSPACE
		}))
		.use(CONTEXT_PATH, require('../lib/file')({
			root: '/file',
			workspaceRoot: '/workspace',
			workspaceDir: WORKSPACE
		}))
		.use(CONTEXT_PATH, require('../lib/git')({
			root: '/gitapi',
			fileRoot: '/file',
			workspaceDir: WORKSPACE
		}));

var TEST_REPO_NAME = 'test';
var repoPath = path.join(WORKSPACE, TEST_REPO_NAME);

function byName(a, b) {
	return String.prototype.localeCompare(a.Name, b.Name);
}

// Retrieves the 0th Workspace in the list and invoke the callback
function withDefaultWorkspace(callback) {
	app.request()
	.get(PREFIX)
	.end(function(err, res) {
		assert.ifError(err);
		callback(res.body.Workspaces[0]);
	});
}

/**
 * see http://wiki.eclipse.org/Orion/Server_API/Workspace_API
 */

describe('Use Case 1: init repo, add file, commit file, add remote, get list of remotes, fetch from remote, delete repo', function(done) {
	before(function(done) { // testData.setUp.bind(null, parentDir)
		testData.setUp(WORKSPACE, done);
	});

	describe('Creates a new directory and init repository', function() {
		it('GET clone (initializes a git repo)', function(finished) {
			app.request()
			.post(CONTEXT_PATH + "/gitapi/clone/")
			.send({
				"Name":  TEST_REPO_NAME,
				"Location": PREFIX
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Location, "/gitapi/clone/file/" + TEST_REPO_NAME)
				finished();
			})
		});

		it('Check the directory was made', function() {
			var stat = fs.statSync(repoPath);
			assert(stat.isDirectory());
		})

		it('Check nodegit that the repo was initialized', function(finished) {
			git.Repository.open(repoPath)
			.then(function(repo) {
				return repo.getReferenceCommit("HEAD");
			})
			.then(function(commit) {
				assert(commit.message(), "Initial commit")
			})
			.catch(function(err) {
				assert.ifError(err);
			})
			.done(function() {
				finished();
			})
		})
	});

	describe('Creating and adding a new file', function() {
		var filename = "test.txt"
		var filecontent = "hello world!"

		before(function(done) {
			fs.writeFile(path.join(repoPath, filename), filecontent, function (err) {
				done(err);
			});
		})

		it('PUT index (staging a file)', function(finished) {
			app.request()
			.put(CONTEXT_PATH + "/gitapi/index/file/" + TEST_REPO_NAME + "/" + filename)
			.expect(200)
			.end(function(err, res) {
				finished();
			})
		})

		it('GET status (check status for git repo)', function(finished) {
			app.request()
			.get(CONTEXT_PATH + "/gitapi/status/file/"+ TEST_REPO_NAME + "/")
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Added[0].Name, filename);
				finished();
			})
		})
	});

	describe('Committing an added file', function() {
		var message = "Test commit!"
		var author = "test"
		var authorEmail = "test@test.com"
		var committer = "test"
		var committerEmail = "test@test.com"

		it('POST commit (committing all files in the index)', function(finished) {
			app.request()
			.post(CONTEXT_PATH + "/gitapi/commit/HEAD/file/" + TEST_REPO_NAME)
			.send({
				Message: message,
				AuthorName: author,
				AuthorEmail: authorEmail,
				CommitterName: committer,
				CommitterEmail: committerEmail
			})
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.AuthorEmail, authorEmail);
				assert.equal(res.body.CommitterEmail, committerEmail);
				assert.equal(res.body.Message, message);
				assert.equal(res.body.Diffs[0].ChangeType, "ADDED");
				finished();
			})
		});

		it('GET commit (listing commits revision)', function(finished) {
			app.request()
			.get(CONTEXT_PATH + '/gitapi/commit/master..master/file/' + TEST_REPO_NAME)
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Children[0].Message, message);
				finished();
			})
		});

		it('Check nodegit for commits', function(finished) {
			git.Repository.open(repoPath)
			.then(function(repo) {
				return repo.getReferenceCommit("HEAD");
			})
			.then(function(commit) {
				assert(commit.message(), message);
			})
			.catch(function(err) {
				assert.ifError(err);
			})
			.done(function() {
				finished();
			});
		});
	});
	
	var remoteName = "origin";

	describe('Adding a remote', function() {
		var remoteURI = "https://github.com/eclipse/sketch.git"; // small example repo from Eclipse

		it('POST remote (adding a new remote)', function(finished) {
			app.request()
			.post(CONTEXT_PATH + "/gitapi/remote/file/" + TEST_REPO_NAME)
			.send({
				Remote: remoteName,
				RemoteURI: remoteURI
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Location, "/gitapi/remote/" + remoteName + "/file/" + TEST_REPO_NAME);
				finished();
			})
		})
	});

	describe('Get list of remotes',  function() {
		var numRemotes;

		it('GET remote (getting the list of remotes)', function(finished) {
			app.request()
			.get(CONTEXT_PATH + "/gitapi/remote/file/" + TEST_REPO_NAME)
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Children[0].Name, remoteName);
				numRemotes = res.body.Children.length;
				finished();
			})
		})

		it('Check nodegit for list of remotes', function(finished) {
			git.Repository.open(repoPath)
			.then(function(repo) {
				return git.Remote.list(repo);
			})
			.then(function(list) {
				assert.equal(list.length, numRemotes);
				assert(list[0], remoteName);
			})
			.catch(function(err) {
				assert.ifError(err);
			})
			.done(function() {
				finished();
			})
		})
	})

	describe('Fetching a remote', function() {

		it('POST remote (fetching changes from a remote)', function(finished) {
			this.timeout(20000); // increase timeout for fetching from remote
			app.request()
			.post(CONTEXT_PATH + "/gitapi/remote/" + remoteName + "/file/" + TEST_REPO_NAME)
			.send({
				Fetch: "true"
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Message, "Fetching " + remoteName + "...");
				finished();
			})
		})
	});

	describe ('Deleting a remote', function() {

		it('DELETE remote (removing a remote)', function(finished) {
			app.request()
			.delete(CONTEXT_PATH + "/gitapi/remote/" + remoteName + "/file/" + TEST_REPO_NAME)
			.expect(200)
			.end(finished);
		})

		it('Check nodegit for deleted remote', function(finished) {
			git.Repository.open(repoPath)
			.then(function(repo) {
				return git.Remote.lookup(repo, remoteName);
			})
			.catch(function(err) {
				return err;
			})
			.done(function(err) {
				assert(err); // returns an error because remote does not exist, which is what we want
				finished();
			});
		});
	})

	describe('Add a new remote and push to it', function() {
		
		var remoteURI = "https://github.com/oriongittester/orion-test-repo.git"; // small test repo
		var remoteName = "origin"
		var branchName = "master"

		// Credentials for a github user made for testing... Perhaps need a better solution.
		var username = "oriongittester";
		var password = "testpassword1";

		it('POST remote (adding a new remote)', function(finished) {
			app.request()
			.post(CONTEXT_PATH + "/gitapi/remote/file/" + TEST_REPO_NAME)
			.send({
				Remote: remoteName,
				RemoteURI: remoteURI
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Location, "/gitapi/remote/" + remoteName + "/file/" + TEST_REPO_NAME);
				finished();
			})
		})

		it('POST remote (pushing to a new remote)', function(finished) {

			this.timeout(5000);

			app.request()
			.post(CONTEXT_PATH + "/gitapi/remote/" + remoteName + "/" + branchName + "/file/" + TEST_REPO_NAME)
			.send({
				Force: true, // force push so it doesn't matter what's on the repo.
				GitSshUsername: username,
				GitSshPassword: password,
				PushSrcRef: "HEAD"
			})
			.expect(202)
			.end(function(err, res) {
				assert.ifError(err);
				assert(res.body.Location);

				var location = res.body.Location; 

				// Pushing a remote returns a task. Poll the task location
				// until it completes.
				function checkComplete() {
					app.request()
					.get(CONTEXT_PATH + location)
					.expect(200)
					.end(function(err, res) {
						assert.ifError(err);
						assert(res.body)
						if (res.body.type === "loadend") {
							return finished();
						}

						location = res.body.Location; 
						setTimeout(checkComplete, 500);
					})
				}

				setTimeout(checkComplete, 500);
			})
		})

	})

	describe('Removing a repository', function() {

		it('DELETE clone (delete a repository)', function(finished) {
			app.request()
			.delete(CONTEXT_PATH + "/gitapi/clone/file/" + TEST_REPO_NAME)
			.expect(200)
			.end(finished);
		});

		it('Check nodegit for deleted repo', function(finished) {
			git.Repository.open(repoPath)
			.catch(function(err) {
				return err;
			})
			.done(function(err) {
				assert(err); // returns an error because repo does not exist, which is what we want
				finished();
			});
		});

	});

});

describe('Use Case 2: clone a repo, delete repo', function(done) {
	before(function(done) { // testData.setUp.bind(null, parentDir)
		testData.setUp(WORKSPACE, done);
	});

	describe('Cloning a new repository', function() {

		it('POST clone (creating a respository clone)', function(finished) {
			var gitURL = "https://github.com/eclipse/sketch.git"
			this.timeout(20000); // increase timeout for cloning from repo
			app.request()
			.post(CONTEXT_PATH + "/gitapi/clone/")
			.send({
				GitUrl: gitURL
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Message, "Cloning " + WORKSPACE + " @ " + gitURL);
				finished();
			})
		})

		it('Check the directory was made', function() {
			var stat = fs.statSync(WORKSPACE + "/sketch");
			assert(stat.isDirectory());
		})

	});

	describe('Listing tags', function() {

		it('GET tag (listing tags)', function(finished) {
			this.timeout(20000);
			app.request()
			.get(CONTEXT_PATH + "/gitapi/tag/file/" + "sketch")
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				// tag is from cloned repo
				// one reason it could break is if the tag was removed from the cloned repo
				assert.equal(res.body.Children[0].Name, '0.0.1')
				finished();
			})

		})
	})

	describe('Removing a repository', function() {

		it('DELETE clone (delete a repository)', function(finished) {
			app.request()
			.delete(CONTEXT_PATH + "/gitapi/clone/file/" + TEST_REPO_NAME)
			.expect(200)
			.end(finished);
		});

		it('Check nodegit for deleted repo', function(finished) {
			git.Repository.open(repoPath)
			.catch(function(err) {
				return err;
			})
			.done(function(err) {
				assert(err); // returns an error because repo does not exist, which is what we want
				finished();
			});
		});

	});

});

describe('Use Case 3: init a repo, add a remote, create branch, list branches, delete branch, delete repo', function(done) {
	before(function(done) { // testData.setUp.bind(null, parentDir)
		testData.setUp(WORKSPACE, done);
	});

	describe('Creates a new directory and init repository', function() {
		it('GET clone (initializes a git repo)', function(finished) {
			app.request()
			.post(CONTEXT_PATH + "/gitapi/clone/")
			.send({
				"Name":  TEST_REPO_NAME,
				"Location": PREFIX
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Location, "/gitapi/clone/file/" + TEST_REPO_NAME)
				finished();
			})
		});

		it('Check the directory was made', function() {
			var stat = fs.statSync(repoPath);
			assert(stat.isDirectory());
		})

		it('Check nodegit that the repo was initialized', function(finished) {
			git.Repository.open(repoPath)
			.then(function(repo) {
				return repo.getReferenceCommit("HEAD");
			})
			.then(function(commit) {
				assert(commit.message(), "Initial commit")
			})
			.catch(function(err) {
				assert.ifError(err);
			})
			.done(function() {
				finished();
			})
		})
	});

	var remoteName = "origin";

	describe('Adding a remote', function() {
		var remoteURI = "https://github.com/albertcui/orion-test-repo.git"; // small example repo from Eclipse

		it('POST remote (adding a new remote)', function(finished) {
			app.request()
			.post(CONTEXT_PATH + "/gitapi/remote/file/" + TEST_REPO_NAME)
			.send({
				Remote: remoteName,
				RemoteURI: remoteURI
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Location, "/gitapi/remote/" + remoteName + "/file/" + TEST_REPO_NAME);
				finished();
			})
		})
	});

	var branchName = "test-branch"

	describe('Adding a branch', function() {

		it('POST branch (creating a branch)', function(finished) {
			app.request()
			.post(CONTEXT_PATH + "/gitapi/branch/file/" + TEST_REPO_NAME)
			.send({
				Name: branchName
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.CommitLocation, "/gitapi/commit/" + branchName + "/file/" + TEST_REPO_NAME);
				assert.equal(res.body.Location, "/gitapi/branch/" + branchName + "/file/" + TEST_REPO_NAME);
				finished();
			})
		})

		it('Check nodegit that branch exists', function(finished) {
			git.Repository.open(repoPath)
			.then(function(repo) {
				return repo.getBranch(branchName);
			})
			.then(function(ref) {
				assert(ref.name(), "refs/head/" + branchName);
			})
			.catch(function(err) {
				assert.ifError(err);
			})
			.done(function() {
				finished();
			})
		})
	})

	describe('Getting list of branches', function() {

		it('GET branch (listing branches)', function(finished) {
			app.request()
			.get(CONTEXT_PATH + "/gitapi/branch/file/" + TEST_REPO_NAME)
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Children[0].FullName, "refs/heads/master");
				assert.equal(res.body.Children[1].FullName, "refs/heads/" + branchName);
				finished();
			})
		})
	});

	describe('Deleting a branch', function() {

		it('DELETE branch (removing a branch)', function(finished) {
			app.request()
			.delete(CONTEXT_PATH + "/gitapi/branch/" + branchName + "/file/" + TEST_REPO_NAME)
			.expect(200)
			.end(finished);
		})

		it('Check nodegit that branch exists', function(finished) {
			git.Repository.open(repoPath)
			.then(function(repo) {
				return repo.getBranch(branchName);
			})
			.catch(function(err) {
				return err;
			})
			.done(function(err) {
				assert(err); // returns an error because branch does not exist, which is what we want
				finished();
			});
		})
	});

	describe('Removing a repository', function() {

		it('DELETE clone (delete a repository)', function(finished) {
			app.request()
			.delete(CONTEXT_PATH + "/gitapi/clone/file/" + TEST_REPO_NAME)
			.expect(200)
			.end(finished);
		});

		it('Check nodegit for deleted repo', function(finished) {
			git.Repository.open(repoPath)
			.catch(function(err) {
				return err;
			})
			.done(function(err) {
				assert(err); // returns an error because repo does not exist, which is what we want
				finished();
			});
		});

	});

});