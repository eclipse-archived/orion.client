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
/*eslint-disable no-shadow, no-sync*/
var assert = require('assert');
var express = require('express');
var path = require('path');
var supertest = require('supertest');
var testData = require('./support/test_data');
var fs = require('fs');
var git;
try {
	git = require('nodegit');
} catch (e) {
}

var CONTEXT_PATH = '';
var WORKSPACE = path.join(__dirname, '.test_workspace');

var app = express()
.use(/* @callback */ function(req, res, next) {
	req.user = { workspaceDir: WORKSPACE };
	next();
})
.use(CONTEXT_PATH + '/task', require('../lib/tasks').router({
	root: '/task',
}))
.use(CONTEXT_PATH + "/workspace*", require('../lib/workspace')({
	root: '/workspace',
	fileRoot: '/file',
}))
.use(CONTEXT_PATH + "/file*", require('../lib/file')({
	root: '/file',
	workspaceRoot: '/workspace',
}))
.use(CONTEXT_PATH + "/gitapi", require('../lib/git')({
	root: '/gitapi',
	fileRoot: '/file',
}));

var request = supertest.bind(null, app);

var TEST_REPO_NAME, repoPath;

function setup(done) {
	TEST_REPO_NAME = 'test';
	repoPath = path.join(WORKSPACE, TEST_REPO_NAME);
	testData.setUp(WORKSPACE, done);
}

function setupRepo(done) {
	TEST_REPO_NAME = "Spoon-Knife";
	repoPath = path.join(WORKSPACE, TEST_REPO_NAME);
	testData.setUp(WORKSPACE, function() {
		git.Clone.clone("https://github.com/octocat/Spoon-Knife.git", repoPath).then(done.bind(null, null), done);
	});
}
		
function getGitResponse(res2) {
	return new Promise(function(fulfill, reject) {
		function check(res) {
			if (res.statusCode === 202 || !res.body.Result) {
				return setTimeout(function() {
					request()
					.get(CONTEXT_PATH + res2.body.Location)
					.end(function(err, res1) {
						if (err) {
							return reject(err);
						}
						check(res1);
					});
				}, 100);
			} else if (res.statusCode === 200) {
				fulfill(res.body.Result);
			} else {
				reject({message: "git response error"});
			}
		}
		check(res2);
	});
}

// Skip tests if nodegit is not installed
function maybeDescribe() {
	return git ? describe.apply(null, arguments) : describe.skip.apply(null, arguments);
}

maybeDescribe("git", function() {
	if (!git) {
		it("*** nodegit is not installed -- git tests skipped", Function.prototype);
	}

	/**
	 * init repo, add file, commit file, add remote, get list of remotes, fetch from remote, delete repo
	 */
	describe('Use case 1', function(/*done*/) {
		before(setup);

		describe('Creates a new directory and init repository', function() {
			it('GET clone (initializes a git repo)', function(finished) {
				request()
				.post(CONTEXT_PATH + "/gitapi/clone/")
				.send({
					"Name":  TEST_REPO_NAME,
					"Location": CONTEXT_PATH + '/workspace',
					"GitName": "test",
					"GitMail": "test@test.com"
				})
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Location, "/gitapi/clone/file/" + TEST_REPO_NAME);
					finished();
				});
			});

			it('Check the directory was made', function() {
				var stat = fs.statSync(repoPath);
				assert(stat.isDirectory());
			});

			it('Check nodegit that the repo was initialized', function(finished) {
				git.Repository.open(repoPath)
				.then(function(repo) {
					return repo.getReferenceCommit("HEAD");
				})
				.then(function(commit) {
					assert(commit.message(), "Initial commit");
				})
				.catch(function(err) {
					assert.ifError(err);
				})
				.done(function() {
					finished();
				});
			});
		});

		describe('Creating and adding a new file', function() {
			var filename = "test.txt";
			var filecontent = "hello world!";

			before(function(done) {
				fs.writeFile(path.join(repoPath, filename), filecontent, function (err) {
					done(err);
				});
			});

			it('PUT index (staging a file)', function(finished) {
				request()
				.put(CONTEXT_PATH + "/gitapi/index/file/" + TEST_REPO_NAME + "/" + filename)
				.expect(200)
				.end(function() {
					finished();
				});
			});

			it('GET status (check status for git repo)', function(finished) {
				request()
				.get(CONTEXT_PATH + "/gitapi/status/file/"+ TEST_REPO_NAME + "/")
				.expect(200)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Added[0].Name, filename);
					finished();
				});
			});
		});
		
		describe('Committing an added file', function() {
			var message = "Test commit!";
			var author = "test";
			var authorEmail = "test@test.com";
			var committer = "test";
			var committerEmail = "test@test.com";

			it('POST commit (committing all files in the index)', function(finished) {
				request()
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
					assert.equal(res.body.Diffs.Children[0].ChangeType, "ADD");
					finished();
				});
			});

			it('GET commit (listing commits revision)', function(finished) {
				request()
				.get(CONTEXT_PATH + '/gitapi/commit/master%5E..master/file/' + TEST_REPO_NAME)
				.expect(200)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Children[0].Message, message);
					finished();
				});
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
				request()
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
				});
			});
		});

		describe('Get list of remotes',  function() {
			var numRemotes;

			it('GET remote (getting the list of remotes)', function(finished) {
				request()
				.get(CONTEXT_PATH + "/gitapi/remote/file/" + TEST_REPO_NAME)
				.expect(200)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Children[0].Name, remoteName);
					numRemotes = res.body.Children.length;
					finished();
				});
			});

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
				});
			});
		});

		describe('Fetching a remote', function() {

			it('POST remote (fetching changes from a remote)', function(finished) {
				this.timeout(20000); // increase timeout for fetching from remote
				request()
				.post(CONTEXT_PATH + "/gitapi/remote/" + remoteName + "/file/" + TEST_REPO_NAME)
				.send({
					Fetch: "true"
				})
				.end(function(err, res2) {
					assert.ifError(err);
					getGitResponse(res2).then(function(res) {
						assert.equal(res.Message, "OK");
						finished();
					})
					.catch(function(err) {
						assert.ifError(err);
						finished();
					});
				});
			});
		});

		describe ('Deleting a remote', function() {

			it('DELETE remote (removing a remote)', function(finished) {
				request()
				.delete(CONTEXT_PATH + "/gitapi/remote/" + remoteName + "/file/" + TEST_REPO_NAME)
				.expect(200)
				.end(finished);
			});

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
		});

		describe('Add a new remote and push to it', function() {
			
			var remoteURI = "https://github.com/oriongittester/orion-test-repo.git"; // small test repo
			var remoteName = "origin";
			var branchName = "master";

			// Credentials for a github user made for testing... Perhaps need a better solution.
			var username = "oriongittester";
			var password = "testpassword1";

			it('POST remote (adding a new remote)', function(finished) {
				request()
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
				});
			});

			it('POST remote (pushing to a new remote)', function(finished) {

				this.timeout(5000);

				request()
				.post(CONTEXT_PATH + "/gitapi/remote/" + remoteName + "/" + branchName + "/file/" + TEST_REPO_NAME)
				.send({
					Force: true, // force push so it doesn't matter what's on the repo.
					GitSshUsername: username,
					GitSshPassword: password,
					PushSrcRef: "HEAD"
				})
				.end(function(err, res2) {
					assert.ifError(err);
					getGitResponse(res2).then(function(res) {
						assert.equal(res.Message, "OK");
						finished();
					})
					.catch(function(err) {
						assert.ifError(err);
						finished();
					});
				});
			});

		});

		describe('Removing a repository', function() {

			it('DELETE clone (delete a repository)', function(finished) {
				request()
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

	/**
	 * Clone a repo, delete repo
	 */
	describe('Use case 2', function() {
		before(function(done) { // testData.setUp.bind(null, parentDir)
			testData.setUp(WORKSPACE, done);
		});

		describe('Cloning a new repository', function() {
			it('POST clone (creating a respository clone)', function(finished) {
				var gitURL = "https://github.com/eclipse/sketch.git";
				this.timeout(20000); // increase timeout for cloning from repo
				request()
				.post(CONTEXT_PATH + "/gitapi/clone/")
				.send({
					GitUrl: gitURL
				})
				.end(function(err, res2) {
					assert.ifError(err);
					getGitResponse(res2).then(function(res) {
						assert.equal(res.Message, "OK");
						finished();
					})
					.catch(function(err) {
						assert.ifError(err);
						finished();
					});
				});
			});

			it('Check the directory was made', function() {
				var stat = fs.statSync(WORKSPACE + "/sketch");
				assert(stat.isDirectory());
			});

		});
		
		describe('Listing tags', function() {

			it('GET tag (listing tags)', function(finished) {
				this.timeout(20000);
				request()
				.get(CONTEXT_PATH + "/gitapi/tag/file/sketch")
				.expect(200)
				.end(function(err, res) {
					assert.ifError(err);
					// tag is from cloned repo
					// one reason it could break is if the tag was removed from the cloned repo
					assert.equal(res.body.Children[0].Name, '0.0.1');
					finished();
				});
			});
		});

		describe('Removing a repository', function() {

			it('DELETE clone (delete a repository)', function(finished) {
				request()
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

	}); // describe("Use case 2")

	/**
	 * Init a repo, add a remote, create branch, list branches, delete branch, delete repo
	 */
	describe('Use case 3', function() {
		before(function(done) { // testData.setUp.bind(null, parentDir)
			testData.setUp(WORKSPACE, done);
		});

		describe('Creates a new directory and init repository', function() {
			it('GET clone (initializes a git repo)', function(finished) {
				request()
				.post(CONTEXT_PATH + "/gitapi/clone/")
				.send({
					"Name":  TEST_REPO_NAME,
					"Location": CONTEXT_PATH + '/workspace',
					"GitName": "test",
					"GitMail": "test@test.com"
				})
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Location, "/gitapi/clone/file/" + TEST_REPO_NAME);
					finished();
				});
			});

			it('Check the directory was made', function() {
				var stat = fs.statSync(repoPath);
				assert(stat.isDirectory());
			});

			it('Check nodegit that the repo was initialized', function(finished) {
				git.Repository.open(repoPath)
				.then(function(repo) {
					return repo.getReferenceCommit("HEAD");
				})
				.then(function(commit) {
					assert(commit.message(), "Initial commit");
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
			var remoteURI = "https://github.com/albertcui/orion-test-repo.git"; // small example repo from Eclipse

			it('POST remote (adding a new remote)', function(finished) {
				request()
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
				});
			});
		});

		var branchName = "test-branch";

		describe('Adding a branch', function() {

			it('POST branch (creating a branch)', function(finished) {
				request()
				.post(CONTEXT_PATH + "/gitapi/branch/file/" + TEST_REPO_NAME)
				.send({
					Name: branchName
				})
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.CommitLocation, "/gitapi/commit/refs%252Fheads%252F" + branchName + "/file/" + TEST_REPO_NAME);
					assert.equal(res.body.Location, "/gitapi/branch/" + branchName + "/file/" + TEST_REPO_NAME);
					finished();
				});
			});

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
				});
			});
		});

		describe('Getting list of branches', function() {

			it('GET branch (listing branches)', function(finished) {
				request()
				.get(CONTEXT_PATH + "/gitapi/branch/file/" + TEST_REPO_NAME)
				.expect(200)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Children[0].FullName, "refs/heads/master");
					assert.equal(res.body.Children[1].FullName, "refs/heads/" + branchName);
					finished();
				});
			});
		});

		describe('Deleting a branch', function() {

			it('DELETE branch (removing a branch)', function(finished) {
				request()
				.delete(CONTEXT_PATH + "/gitapi/branch/" + branchName + "/file/" + TEST_REPO_NAME)
				.expect(200)
				.end(finished);
			});

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
			});
		});

		describe('Removing a repository', function() {

			it('DELETE clone (delete a repository)', function(finished) {
				request()
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
	}); // describe("Use case 3")

	describe("config", function() {
		this.timeout(10000);

		function repoConfig() {
			return request()
			.get(CONTEXT_PATH + "/gitapi/config/clone/file/" + TEST_REPO_NAME);
		}

		// @returns first item in arr for which pred(arr) returns truthy
		function find(arr, pred) {
			var found = null;
			Array.prototype.some.call(arr, function(item, i, array) {
				if (pred(item, i, array)) {
					found = item;
					return true;
				}
				return false;
			});
			return found;
		}

		before(setupRepo);

		it("gets repo config", function(done) {
			return repoConfig()
			.expect(200)
			.expect(function(res) {
				assert.equal(res.body.Type, "Config", "Is a config");
				assert.ok(res.body.Children.length > 0, "has Children");
			})
			.end(done);
		});
		it("gets key", function(done) {
			return repoConfig()
			.end(function(err, res) {
				assert.ifError(err);
				// Ensure we can GET a child's Location to retrieve it individually
				var child = res.body.Children[0];

				request()
				.get(CONTEXT_PATH + child.Location)
				.expect(200)
				.expect(function(res2) {
					assert.equal(child.Key, res2.body.Key, "Got the correct key");
				})
				.end(done);
			});
		});
		it("updates key", function(done) {
			return repoConfig()
			.end(function(err, res) {
				assert.ifError(err);
				// Find the core.filemode config and toggle it
				var child = find(res.body.Children, function(c) { return c.Key === "core.filemode"; });
				var newValue = String(!child.Value);

				request()
				.put(CONTEXT_PATH + child.Location)
				.send({ Value: [newValue] })
				.expect(200)
				.end(function(err/*, res*/) {
					assert.ifError(err);
					// Ensure the value was actually changed in the repo
					git.Repository.open(repoPath).then(function(repo) {
						return repo.config().then(function(config) {
							return config.getString(child.Key).then(function(value) {
								assert.equal(value, newValue, "Value was changed");
							});
						});
					})
					.then(done.bind(null, null))
					.catch(done);
				});
			});
		});
	}); // describe("config")

}); // describe("Git")