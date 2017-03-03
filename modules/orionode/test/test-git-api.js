/*******************************************************************************
 * Copyright (c) 2013, 2017 IBM Corporation and others.
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
var util = require("../lib/git/util");
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
	taskRoot: CONTEXT_PATH + '/task',
	singleUser: true
}))
.use(CONTEXT_PATH + "/workspace*", require('../lib/workspace')({
	workspaceRoot: CONTEXT_PATH + '/workspace', 
	fileRoot: CONTEXT_PATH + '/file', 
	gitRoot: CONTEXT_PATH + '/gitapi'
}))
.use(CONTEXT_PATH + "/file*", require('../lib/file')({
	gitRoot: CONTEXT_PATH + '/gitapi', 
	fileRoot: CONTEXT_PATH + '/file'
}))
.use(CONTEXT_PATH + "/gitapi", require('../lib/git')({
	gitRoot: CONTEXT_PATH + '/gitapi', 
	fileRoot: CONTEXT_PATH + '/file', 
	workspaceRoot: CONTEXT_PATH + '/workspace'
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

function GitClient(name) {
	this.name = name;
	this.tasks = [];
}

GitClient.prototype = {
	getName: function() {
		return this.name;
	},

	start: function() {
		var client = this;
		return new Promise(function(resolve) {
			client.next(resolve);
		});
	},

	next: function(resolve, value) {
		if (this.tasks.length !== 0) {
			this.tasks.shift().call(null, resolve);
		} else {
			resolve(value);
		}
	},

	init: function() {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.post(CONTEXT_PATH + "/gitapi/clone/")
			.send({
				"Name":  client.getName(),
				"Location": CONTEXT_PATH + '/workspace',
				"GitName": "test",
				"GitMail": "test@test.com"
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Location, "/gitapi/clone/file/" + client.getName());
				client.next(resolve, res.body);
			});
		});
	},

	postFile: function(parentFolder, name, isDirectory) {
		var client = this;
		this.tasks.push(function(resolve) {
			var encodedName = encodeURIComponent(name);
			request()
			.post(CONTEXT_PATH + '/file/' + client.getName() + parentFolder)
			.send({ Name: name, Directory: isDirectory })
			.expect(201)
			.end(function(err, res) {
				var body = res.body
				assert.ifError(err);
				assert.equal(body.Name, name);
				assert.equal(body.Directory, isDirectory);
				client.next(resolve, body);
			});
		});
	},

	createFile: function(parentFolder, name) {
		this.postFile(parentFolder, name, false);
	},

	createFolder: function(parentFolder, name) {
		this.postFile(parentFolder, name, true);
	},

	setFileContents: function(name, contents) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.put(CONTEXT_PATH + "/file/" + client.getName() + "/" + name)
			.send(contents)
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				var body = res.body;
				assert.equal(body.Directory, false);
				assert.ok(body.ETag, 'has an ETag');
				assert.equal(body.Location, CONTEXT_PATH + "/file/" + client.getName() + "/" + name);
				assert.equal(body.Name, name);
				client.next(resolve, res.body);
			});
		});
	},

	/**
	 * Deletes the file or folder at the given path relative to the Orion workspace.
	 * This path must not be URL encoded.
	 * 
	 * @param {String} path the file or folder to delete from the server
	 */
	delete: function(path) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.delete(CONTEXT_PATH + "/file/" + client.getName() + "/" + encodeURIComponent(path))
			.expect(204)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	commit: function() {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.post(CONTEXT_PATH + "/gitapi/commit/HEAD/file/" + client.getName())
			.send({
				Message: "Test commit!",
				AuthorName: "test",
				AuthorEmail: "test@test.com",
				CommitterName: "test",
				CommitterEmail: "test@test.com"
			})
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	stage: function(name) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.put(CONTEXT_PATH + "/gitapi/index/file/" + client.getName() + "/" + util.encodeURIComponent(name))
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	status: function(state) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.get(CONTEXT_PATH + "/gitapi/status/file/" + client.getName())
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(state, res.body.RepositoryState);
				client.next(resolve, res.body);
			});
		});
	},

	createBranch: function(branchName) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.post(CONTEXT_PATH + "/gitapi/branch/file/" + client.getName())
			.send({
				Name: branchName
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.CommitLocation,
					"/gitapi/commit/refs%252Fheads%252F" + util.encodeURIComponent(branchName) + "/file/" + client.getName());
				assert.equal(res.body.Location,
					"/gitapi/branch/" + util.encodeURIComponent(branchName) + "/file/" + client.getName());
				client.next(resolve, res.body);
			});
		});
	},

	deleteBranch: function(branchName) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.delete(CONTEXT_PATH + "/gitapi/branch/" + util.encodeURIComponent(branchName) + "/file/" + client.getName())
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	listBranches: function() {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.get(CONTEXT_PATH + "/gitapi/branch/file/" + client.getName())
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Type, "Branch");
				client.next(resolve, res.body.Children);
			});
		});
	},

	createTag: function(commitSHA, tagName, annotated, message) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.put(CONTEXT_PATH + "/gitapi/commit/" + commitSHA + "/file/" + client.getName())
			.send({
				Name: tagName,
				Annotated: annotated,
				Message: message
			})
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	deleteTag: function(tagName) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.delete(CONTEXT_PATH + "/gitapi/tag/" + util.encodeURIComponent(tagName) + "/file/" + client.getName())
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	getTag: function(tagName, annotated, commitSHA) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.get(CONTEXT_PATH + "/gitapi/tag/" + tagName + "/file/" + client.getName())
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Name, tagName);
				assert.equal(res.body.FullName, "refs/tags/" + tagName);
				assert.equal(res.body.Type, "Tag");
				assert.equal(res.body.TagType, annotated ? "ANNOTATED" : "LIGHTWEIGHT");
				assert.equal(res.body.CloneLocation, "/gitapi/clone/file/" + client.getName());
				assert.equal(res.body.CommitLocation, "/gitapi/commit/" + commitSHA + "/file/" + client.getName());
				assert.equal(res.body.TreeLocation, "/gitapi/tree/file/" + client.getName() + "/" + tagName);
				client.next(resolve, res.body);
			});
		});
	},

	listTags: function(commitSHA, tagName, annotated, message) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.get(CONTEXT_PATH + "/gitapi/tag/file/" + client.getName())
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Type, "Tag");
				client.next(resolve, res.body.Children);
			});
		});
	},

	/**
	 * Pops the first entry in the stash and applies it on top of the current working tree state.
	 * 
	 * @param {number} [statusCode] an optional HTTP status code that will be returned by the request,
	 *                              if not set, a 200 OK will be expected
	 */
	stashPop: function(statusCode) {
		if (typeof statusCode !== 'number') {
			statusCode = 200;
		}

		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.put(CONTEXT_PATH + "/gitapi/stash/file" + client.getName())
			.expect(statusCode)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	reset: function(type, id) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.post(CONTEXT_PATH + "/gitapi/index/file/" + client.getName())
			.send({
				"Reset": type,
				"Commit": id
			})
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	merge: function(branchToMerge, result) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.post(CONTEXT_PATH + "/gitapi/commit/HEAD/file/" + client.getName())
			.send({
				Merge: branchToMerge
			})
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	compare: function(source, target) {
		var client = this;
		this.tasks.push(function(resolve) {
			source = util.encodeURIComponent(source);
			target = util.encodeURIComponent(target);

			request()
			.get(CONTEXT_PATH + "/gitapi/commit/" + source + ".." + target + "/file/" + client.getName())
			.expect(202)
			.end(function(err, res) {
				assert.ifError(err);
				getGitResponse(res).then(function(res2) {
					client.next(resolve, res2.JsonData);
				})
				.catch(function(err) {
					assert.ifError(err);
				});
			});
		});
	},

	log: function() {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.get(CONTEXT_PATH + '/gitapi/commit/master/file/' + client.getName())
			.expect(202)
			.end(function(err, res) {
				assert.ifError(err);
				getGitResponse(res).then(function(res2) {
					client.next(resolve, res2.JsonData);
				})
				.catch(function(err) {
					assert.ifError(err);
				});
			});
		});
	}
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
				.expect(202)
				.end(function(err, res) {
					assert.ifError(err);
					getGitResponse(res).then(function(res2) {
						assert.equal(res2.JsonData.Children[0].Message, message);
						finished();
					})
					.catch(function(err) {
						assert.ifError(err);
						finished();
					});
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

	describe("Merge", function() {
		before(setup);

		describe("Conflicts", function() {
			it("POST commit will resolve merge in progress", function(finished) {
				var name = "conflicts.txt";
				var name2 = "unrelated.txt";
				var initial, otherBranch, main;

				var client = new GitClient("merge-conflicts");
				client.init();
				// init file with content A
				client.setFileContents(name, "A");
				// stage and commit
				client.stage(name);
				client.commit();

				return client.start().then(function(commit) {
					initial = commit.Id;

					var client = new GitClient("merge-conflicts");
					// set file to content B
					client.setFileContents(name, "B");
					// stage and commit
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					otherBranch = commit.Id;
					var client = new GitClient("merge-conflicts");
					// create a branch with content B
					client.createBranch("left");
					// reset back to original content A
					client.reset("HARD", initial);
					// set file to content C
					client.setFileContents(name, "C");
					// stage and commit
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					main = commit.Id;
					var client = new GitClient("merge-conflicts");
					// merge branch with content B
					client.merge("left");
					// merge conflict
					client.status("MERGING");
					// init unrelated file with content Z
					client.setFileContents(name2, "Z");
					// bug 511076, stage unrelated file while conflicted file exists
					client.stage(name2);
					// just stage the file as-is and resolve the conflict
					client.stage(name);
					// commit
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					assert.equal(main, commit.Parents[0].Name);
					assert.equal(otherBranch, commit.Parents[1].Name);
					var client = new GitClient("merge-conflicts");
					client.status("SAFE");
					return client.start();
				})
				.then(function() {
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});
		}); // describe("Conflicts")
	}); // describe("Merge")

	describe("Log", function() {
		before(setup);

		describe("Compare", function() {
			it("libgit2 #4102", function(finished) {
				var client = new GitClient("libgit2-4102");
				// init a new Git repository
				client.init();
				// there's a commit already, create a branch here
				client.createBranch("other");
				client.commit();
				// compare master with the created branch
				client.compare("refs/heads/master", "refs/heads/other");
				return client.start().then(function() {
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});
		}); // describe("Compare")
	}); // describe("Log")

	describe("Branches", function() {
		before(setup);

		describe("Delete", function() {

			it("bug 512877", function(finished) {
				var client = new GitClient("bug512877");
				client.init();
				// create a branch with a name that needs to be encoded
				client.createBranch("a%b");
				// delete the branch
				client.deleteBranch("a%b");
				// list branches to verify deletion
				client.listBranches();
				return client.start().then(function(children) {
					// only one branch, the master branch
					assert.equal(children.length, 1);
					assert.equal(children[0].FullName, "refs/heads/master");
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});
		}); // describe("Delete")
	}); // describe("Branches")

	 describe("Tags", function() {
	 	before(setup);

		function assertTag(tag, tagName, annotated, testName, commitSHA) {
			assert.equal(tag.Name, tagName);
			assert.equal(tag.FullName, "refs/tags/" + tagName);
			assert.equal(tag.Type, "Tag");
			assert.equal(tag.TagType, annotated ? "ANNOTATED" : "LIGHTWEIGHT");
			assert.equal(tag.CloneLocation, "/gitapi/clone/file/" + testName);
			assert.equal(tag.CommitLocation, "/gitapi/commit/" + commitSHA + "/file/" + testName);
			assert.equal(tag.TreeLocation, "/gitapi/tree/file/" + testName + "/" + util.encodeURIComponent(tagName));
		}

		describe("Create", function() {

			/**
			 * Tests that a tag can be created.
			 * 
			 * @param {Function} finished the function to invoke to notify that the test has completed
			 * @param {String} testName the name of the test to be used for the created Git repository
			 * @param {boolean} annotated <tt>true</tt> if an annotated tag should be created,
			 *                            <tt>false</tt> if a lightweight should be created9
			 */
			function testCreateTag(finished, testName, annotated) {
				var tagName = "tagName";
				var commitSHA;

				var client = new GitClient(testName);
				client.init();
				// init file with content A
				client.setFileContents("tag.txt", "A");
				// stage and commit
				client.stage("tag.txt");
				client.commit();

				return client.start().then(function(commit) {
					commitSHA = commit.Id;

					var client = new GitClient(testName);
					// create the tag
					client.createTag(commit.Id, tagName, annotated, null);
					// list all tags
					client.listTags();
					return client.start();
				})
				.then(function(tags) {
					// only created one tag
					assert.equal(tags.length, 1);
					assertTag(tags[0], tagName, annotated, testName, commitSHA);

					var client = new GitClient(testName);
					// verify that we can retrieve that one tag
					client.getTag(tagName, annotated, commitSHA);
					client.log();
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children[0].Tags.length, 1);
					assertTag(log.Children[0].Tags[0], tagName, annotated, testName, commitSHA);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}

			it("lightweight", function(finished) {
				testCreateTag(finished, "tag-create-lightweight", false);
			});

			it("annotated", function(finished) {
				testCreateTag(finished, "tag-create-annotated", true);
			});
		}); // describe("Create")

		describe("Delete", function() {

			/**
			 * Tests that a tag can be created and deleted.
			 * 
			 * @param {Function} finished the function to invoke to notify that the test has completed
			 * @param {String} testName the name of the test to be used for the created Git repository
			 * @param {String} tagName the name of the tag to create and delete
			 * @param {boolean} annotated <tt>true</tt> if an annotated tag should be created,
			 *                            <tt>false</tt> if a lightweight should be created
			 */
			function testDeleteTag(finished, testName, tagName, annotated) {
				var commitSHA;
				var client = new GitClient(testName);
				client.init();
				// init file with content A
				client.setFileContents("tag.txt", "A");
				// stage and commit
				client.stage("tag.txt");
				client.commit();
				return client.start().then(function(commit) {
					commitSHA = commit.Id;
					// create the tag
					client.createTag(commitSHA, tagName, annotated);
					// list all tags
					client.listTags();
					return client.start();
				})
				.then(function(tags) {
					// only created one tag
					assert.equal(tags.length, 1);
					assertTag(tags[0], tagName, annotated, testName, commitSHA);
					// delete the tag
					client.deleteTag(tagName);
					// list all tags
					client.listTags();
					return client.start();
				})
				.then(function(tags) {
					// deleted the tag so there should be no tags
					assert.equal(tags.length, 0);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}

			it("lightweight", function(finished) {
				testDeleteTag(finished, "tag-delete-lightweight", "a%b", false);
			});

			it("annotated", function(finished) {
				testDeleteTag(finished, "tag-delete-annotated", "a%b", true);
			});
		}); // describe("Delete")
	}); // describe("Tags")

	describe("Index", function() {
		before(setup);

		describe("Stage", function() {

			/**
			 * Stage a file with a name that needs to be URL encoded.
			 */
			it("bug 512285", function(finished) {
				var client = new GitClient("bug512285");
				// init a new Git repository
				client.init();
				client.createFile("/", "a%b.txt");
				client.stage("a%b.txt");
				client.status("SAFE");
				return client.start().then(function(index) {
					assert.equal(index.Added.length, 1);
					assert.equal(index.Added[0].Name, "a%b.txt");
					assert.equal(index.Added[0].Path, "a%b.txt");
					assert.equal(index.Added[0].Location, "/file/bug512285/" + util.encodeURIComponent("a%b.txt"));
					assert.equal(index.Untracked.length, 0);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("bug 512285")"
		}); // describe("Stage")
	}); // describe("Index")

	describe("Status", function() {
		before(setup);

		describe("DiffLocation", function() {

			/**
			 * Tests that the DiffLocation property of the returned JSON from
			 * the status API is correctly URL encoded.
			 * 
			 * /a%b.txt						-> /a%2525b.txt
			 * /a b/test.txt				-> /a%2520b/test.txt
			 * /modules/orionode/hello.js	-> /modules/orionode/hello.js
			 */
			it("bug 512061", function(finished) {
				var client = new GitClient("bug512061");
				// init a new Git repository
				client.init();
				// create a few folders
				client.createFolder("/", "a b");
				client.createFolder("/", "modules");
				client.createFolder("/modules/", "orionode");

				// tests > /a%b.txt
				client.createFile("/", "a%b.txt");
				client.status("SAFE");
				return client.start().then(function(status) {
					var git = status.Untracked[0].Git;
					assert.equal(git.CommitLocation,
						"/gitapi/commit/HEAD/file/bug512061/" + util.encodeURIComponent("a%b.txt"));
					assert.equal(git.DiffLocation,
						"/gitapi/diff/Default/file/bug512061/" + util.encodeURIComponent("a%b.txt"));
					assert.equal(git.IndexLocation,
						"/gitapi/index/file/bug512061/" + util.encodeURIComponent("a%b.txt"));

					client.delete("/a%b.txt");
					// tests > /a b/test.txt
					client.createFile("/a b/", "test.txt");
					client.status("SAFE");
					return client.start();
				})
				.then(function(status) {
					var git = status.Untracked[0].Git;
					assert.equal(git.CommitLocation,
						"/gitapi/commit/HEAD/file/bug512061/" + util.encodeURIComponent("a b") + "/test.txt");
					assert.equal(git.DiffLocation,
						"/gitapi/diff/Default/file/bug512061/" + util.encodeURIComponent("a b") + "/test.txt");
					assert.equal(git.IndexLocation,
						"/gitapi/index/file/bug512061/" + util.encodeURIComponent("a b") + "/test.txt");

					client.delete("/a b/test.txt");
					// tests > /modules/orionode/hello.js
					client.createFile("/modules/orionode/", "hello.js");
					client.status("SAFE");
					return client.start();
				})
				.then(function(status) {
					var git = status.Untracked[0].Git;
					assert.equal(git.CommitLocation,
						"/gitapi/commit/HEAD/file/bug512061/modules/orionode/hello.js");
					assert.equal(git.DiffLocation,
						"/gitapi/diff/Default/file/bug512061/modules/orionode/hello.js");
					assert.equal(git.IndexLocation,
						"/gitapi/index/file/bug512061/modules/orionode/hello.js");
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("bug 512061")"
		}); // describe("DiffLocation")
	}); // describe("Status")

	describe("Stash", function() {
		describe("Pop", function() {

			/**
			 * Pop the stash while it is empty.
			 */
			it("empty stash", function(finished) {
				var client = new GitClient("stash-pop-empty");
				// init a new Git repository
				client.init();
				client.stashPop(400);
				return client.start().then(function(body) {
					assert.equal('Failed to apply stashed changes due to an empty stash.', body.Message);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("empty stash")"
		}); // describe("Pop")
	}); // describe("Stash")

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