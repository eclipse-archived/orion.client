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
var assert = require('assert'),
	express = require('express'),
	path = require('path'),
	supertest = require('supertest'),
	testData = require('../support/test_data'),
	util = require("../../lib/git/util"),
	fs = require('fs'),
	storeFactory = require('../../lib/metastore/fs/store'),
	checkRights = require('../../lib/accessRights').checkRights,
	store = require('../../lib/metastore/fs/store'),
	tasks = require('../../lib/tasks'),
	workspace = require('../../lib/workspace'),
	file = require('../../lib/file'),
	gitapi = require('../../lib/git');

var git;
try {
	git = require('nodegit');
} catch (e) {
}

var CONTEXT_PATH = '',
	WORKSPACE = path.join(__dirname, '.test_workspace'),
	MEATASTORE =  path.join(__dirname, '.test_metadata'),
	WORKSPACE_ID = "anonymous-OrionContent",
	configParams = { 
		"orion.single.user": true, 
		"orion.single.user.metaLocation": MEATASTORE
	},
	FILE_ROOT = "/file/" + WORKSPACE_ID + "/";

	var userMiddleware = function(req, res, next) {
	req.user.checkRights = checkRights;
	next();
};

var app = express();
app.locals.metastore = store({workspaceDir: WORKSPACE, configParams: configParams});
app.locals.metastore.setup(app);
app.use(userMiddleware)
.use(CONTEXT_PATH + '/task', tasks.router({
	taskRoot: CONTEXT_PATH + '/task',
	metastore: storeFactory({workspaceDir: WORKSPACE, configParams: configParams})
}))
.use(CONTEXT_PATH + "/workspace*", workspace({
	workspaceRoot: CONTEXT_PATH + '/workspace', 
	fileRoot: CONTEXT_PATH + '/file', 
	gitRoot: CONTEXT_PATH + '/gitapi',
	configParams: configParams
}))
.use(CONTEXT_PATH + "/file*", file({
	workspaceRoot: CONTEXT_PATH + '/workspace', 
	gitRoot: CONTEXT_PATH + '/gitapi', 
	fileRoot: CONTEXT_PATH + '/file',
	configParams: configParams
}))
.use(CONTEXT_PATH + "/gitapi", gitapi({
	gitRoot: CONTEXT_PATH + '/gitapi', 
	fileRoot: CONTEXT_PATH + '/file', 
	workspaceRoot: CONTEXT_PATH + '/workspace',
	configParams: configParams
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
				"Location": CONTEXT_PATH + '/workspace/' + WORKSPACE_ID,
				"GitName": "test",
				"GitMail": "test@test.com"
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Location, "/gitapi/clone" + FILE_ROOT + client.getName());
				client.next(resolve, res.body);
			});
		});
	},

	createFolder: function(name) {
		var client = this;
		this.tasks.push(function(resolve) {
			var folder = path.join(WORKSPACE, client.getName());
			var fullPath = path.join(folder, name);
			fs.mkdirSync(fullPath);
			client.next(resolve, null);
		});
	},

	setFileContents: function(name, contents) {
		var client = this;
		this.tasks.push(function(resolve) {
			var folder = path.join(WORKSPACE, client.getName());
			var fullPath = path.join(folder, name);
			fs.writeFileSync(fullPath, contents);
			client.next(resolve, null);
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
			.delete(CONTEXT_PATH +  FILE_ROOT + client.getName() + "/" + encodeURIComponent(path))
			.expect(204)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	clone: function(url, name) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.post(CONTEXT_PATH + "/gitapi/clone/")
			.send({
				GitUrl: url,
				Location: FILE_ROOT,
				Name: name
			})
			.expect(202)
			.end(function(err, res) {
				assert.ifError(err);
				getGitResponse(res).then(function(res2) {
					assert.equal(res2.HttpCode, 200);
					assert.equal(res2.Message, "OK");
					assert.equal(res2.JsonData.Location, "/gitapi/clone"+ FILE_ROOT + name);
					client.next(resolve, res2.JsonData);
				})
				.catch(function(err) {
					assert.ifError(err);
				});
			});
		});
	},

	listRepositories: function(url, name) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.get(CONTEXT_PATH + "/gitapi/clone/workspace/" + WORKSPACE_ID)
			// .send({
			// 	GitUrl: url,
			// 	Location: FILE_ROOT,
			// 	Name: name
			// })
			.expect(200)
			.end(function(err, res) {
				assert.equal(res.body.Type, "Clone");
				client.next(resolve, res.body);
			});
		});
	},

	commit: function() {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.post(CONTEXT_PATH + "/gitapi/commit/HEAD" + FILE_ROOT + client.getName())
			.send({
				Message: "Test commit at " + Date.now(),
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
			.put(CONTEXT_PATH + "/gitapi/index" + FILE_ROOT + client.getName() + "/" + name.replace(/\%/g, "%25"))
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
			.get(CONTEXT_PATH + "/gitapi/status" + FILE_ROOT + util.encodeURIComponent(client.getName()))
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
			.post(CONTEXT_PATH + "/gitapi/branch" + FILE_ROOT + client.getName())
			.send({
				Name: branchName
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				var encodeBranch = util.encodeURIComponent(branchName).replace(/\%/g, "%25");
				assert.equal(res.body.CommitLocation,
					"/gitapi/commit/refs%25252Fheads%25252F" + encodeBranch + FILE_ROOT + client.getName());
				assert.equal(res.body.Location,
					"/gitapi/branch/" + encodeBranch + FILE_ROOT + client.getName());
				client.next(resolve, res.body);
			});
		});
	},

	checkoutBranch: function(branchName) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.put(CONTEXT_PATH + "/gitapi/clone" + FILE_ROOT + client.getName())
			.send({
				Branch: branchName
			})
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	deleteBranch: function(branchName) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.delete(CONTEXT_PATH + "/gitapi/branch/" + util.encodeURIComponent(branchName) + FILE_ROOT + client.getName())
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
			.get(CONTEXT_PATH + "/gitapi/branch" + FILE_ROOT + client.getName())
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Type, "Branch");
				client.next(resolve, res.body.Children);
			});
		});
	},

	createTag: function(commitSHA, tagName, annotated, message, expectedStatusCode) {
		if (expectedStatusCode === undefined) {
			expectedStatusCode = 200;
		}

		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.put(CONTEXT_PATH + "/gitapi/commit/" + commitSHA + FILE_ROOT + client.getName())
			.send({
				Name: tagName,
				Annotated: annotated,
				Message: message
			})
			.expect(expectedStatusCode)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	checkoutTag: function(tagName, branchName) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.put(CONTEXT_PATH + "/gitapi/clone" + FILE_ROOT + client.getName())
			.send({
				Tag: tagName,
				Branch: branchName
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
			.delete(CONTEXT_PATH + "/gitapi/tag/" + util.encodeURIComponent(tagName) + FILE_ROOT + client.getName())
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
			.get(CONTEXT_PATH + "/gitapi/tag/" + tagName + FILE_ROOT + client.getName())
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Name, tagName);
				assert.equal(res.body.FullName, "refs/tags/" + tagName);
				assert.equal(res.body.Type, "Tag");
				assert.equal(res.body.TagType, annotated ? "ANNOTATED" : "LIGHTWEIGHT");
				assert.equal(res.body.CloneLocation, "/gitapi/clone" + FILE_ROOT + client.getName());
				assert.equal(res.body.CommitLocation, "/gitapi/commit/" + commitSHA + FILE_ROOT + client.getName());
				assert.equal(res.body.TreeLocation, "/gitapi/tree" + FILE_ROOT + client.getName() + "/" + tagName);
				client.next(resolve, res.body);
			});
		});
	},

	listTags: function(commitSHA, tagName, annotated, message) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.get(CONTEXT_PATH + "/gitapi/tag" + FILE_ROOT + client.getName())
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Type, "Tag");
				client.next(resolve, res.body.Children);
			});
		});
	},

	stash: function(includeUntracked, statusCode) {
		if (typeof statusCode !== 'number') {
			statusCode = 200;
		}

		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.post(CONTEXT_PATH + "/gitapi/stash" + FILE_ROOT + client.getName())
			.send({
				IncludeUntracked: includeUntracked,
			})
			.expect(statusCode)
			.end(function(err, res) {
				assert.ifError(err);
				if (statusCode === 404) {
					assert.equal(res.body.Message, "cannot stash changes - there is nothing to stash.");
				}
				client.next(resolve, res.body);
			});
		});
	},

	/**
	 * Applies the entry in the stash that matches the given revision
	 * on top of the current working tree state. If no revision is
	 * specified, the 0-th entry in the stash will be applied and
	 * dropped akin to an invocation of `git stash pop` on the
	 * command line.
	 * 
	 * @param {string} [revision] the SHA hash of the revision to apply,
	 *                            if not set, the entry at the 0-th index
	 *                            in the stash will be applied and dropped
	 *                            from the stash
	 * @param {number} [statusCode] an optional HTTP status code expected from the server,
	 *                              if not set, a 200 OK will be expected
	 * @param {string} [message] an optional error message that the server
	 *                           is expected to send back if statusCode is 400
	 */
	stashApply: function(revision, statusCode, message) {
		if (revision === undefined) {
			revision = "";
		}
		if(revision !== ""){
			revision = "/" + revision;
		}

		if (typeof statusCode !== 'number') {
			statusCode = 200;
		}

		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.put(CONTEXT_PATH + "/gitapi/stash" + revision + FILE_ROOT + client.getName())
			.expect(statusCode)
			.end(function(err, res) {
				assert.ifError(err);
				if (statusCode === 400) {
					assert.equal(res.body.Message, message);
				}
				client.next(resolve, res.body);
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
		this.stashApply("", statusCode, "Failed to apply stashed changes due to an empty stash.");
	},

	listStash: function(statusCode) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.get(CONTEXT_PATH + "/gitapi/stash" + FILE_ROOT + client.getName())
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.CloneLocation, "/gitapi/clone" + FILE_ROOT + client.getName());
				assert.equal(res.body.Location, "/gitapi/stash" + FILE_ROOT + client.getName());
				assert.equal(res.body.Type, "StashCommit");
				client.next(resolve, res.body);
			});
		});
	},

	stashDrop: function(revision, statusCode, message) {
		if (typeof statusCode !== 'number') {
			statusCode = 200;
		}

		if (revision === undefined) {
			revision = "";
		}

		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.delete(CONTEXT_PATH + "/gitapi/stash/" + revision + FILE_ROOT + client.getName())
			.expect(statusCode)
			.end(function(err, res) {
				assert.ifError(err);
				if (statusCode !== 200) {
					assert.equal(res.body.Message, message);
				}
				client.next(resolve, res.body);
			});
		});
	},

	reset: function(type, id) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.post(CONTEXT_PATH + "/gitapi/index" + FILE_ROOT + client.getName())
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

	rebase: function(branchToRebase, operation) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.post(CONTEXT_PATH + "/gitapi/commit/HEAD" + FILE_ROOT + client.getName())
			.send({
				Rebase: branchToRebase,
				Operation: operation
			})
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	merge: function(branchToMerge, squash) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.post(CONTEXT_PATH + "/gitapi/commit/HEAD" + FILE_ROOT + client.getName())
			.send({
				Merge: branchToMerge,
				Squash: squash
			})
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	cherryPick: function(commitSHA) {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.post(CONTEXT_PATH + "/gitapi/commit/HEAD" + FILE_ROOT + client.getName())
			.send({
				"Cherry-Pick": commitSHA
			})
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				client.next(resolve, res.body);
			});
		});
	},

	compare: function(source, target, parameters) {
		var client = this;
		this.tasks.push(function(resolve) {
			source = util.encodeURIComponent(source);
			target = util.encodeURIComponent(target);

			request()
			.get(CONTEXT_PATH + "/gitapi/commit/" + target + ".." + source + FILE_ROOT + client.getName())
			.query(parameters)
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

	/**
	 * Requests a log of the given branch from the server.
	 * 
	 * @param branch the name of the interested branch
	 * @param toRef the name of the resolved reference, this should only be
	 *              different if <tt>branch</tt> is <tt>HEAD</tt>, in which
	 *              case <tt>toRef</tt> should be the name of the branch that
	 *              <tt>HEAD</tt> is pointing to
	 * @param parameters the query parameters to include in the request
	 */
	log: function(branch, toRef, path, parameters) {
		if (toRef === undefined) {
			toRef = branch;
		}

		if (path === undefined) {
			path = "";
		}

		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.get(CONTEXT_PATH + '/gitapi/commit/' + util.encodeURIComponent(branch) + FILE_ROOT + client.getName() + "/" + path)
			.expect(202)
			.query(parameters)
			.end(function(err, res) {
				assert.ifError(err);
				getGitResponse(res).then(function(res2) {
					assert.equal(res2.JsonData.Type, "Commit");
					assert.equal(res2.JsonData.Location, "/gitapi/commit/" + util.encodeURIComponent(branch) + FILE_ROOT + client.getName() + "/" + path);
					assert.equal(res2.JsonData.CloneLocation, "/gitapi/clone" + FILE_ROOT + client.getName());

					assert.equal(res2.JsonData.toRef.Name, toRef);
					assert.equal(res2.JsonData.toRef.FullName, "refs/heads/" + toRef);
					assert.equal(res2.JsonData.toRef.CloneLocation, "/gitapi/clone" + FILE_ROOT + client.getName());
					assert.equal(res2.JsonData.toRef.CommitLocation, "/gitapi/commit/" + util.encodeURIComponent("refs/heads/" + toRef) + FILE_ROOT+ client.getName());
					assert.equal(res2.JsonData.toRef.DiffLocation, "/gitapi/diff/" + util.encodeURIComponent(toRef) + FILE_ROOT + client.getName());
					assert.equal(res2.JsonData.toRef.Location, "/gitapi/branch/" + util.encodeURIComponent(toRef) + FILE_ROOT + client.getName());
					assert.equal(res2.JsonData.toRef.TreeLocation, "/gitapi/tree" + FILE_ROOT + client.getName() + "/" + util.encodeURIComponent("refs/heads/" + toRef));
					assert.equal(res2.JsonData.toRef.Type, "Branch");
					
					client.next(resolve, res2.JsonData);
				})
				.catch(function(err) {
					assert.ifError(err);
				});
			});
		});
	},

	getConfig: function() {
		var client = this;
		this.tasks.push(function(resolve) {
			request()
			.get(CONTEXT_PATH + "/gitapi/config/clone" + FILE_ROOT + util.encodeURIComponent(client.getName()))
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.ok(res.body.Children.length > 0);
				assert.equal(res.body.Type, "Config");
				client.next(resolve, res.body);
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
	before(function(done) { // testData.setUp.bind(null, parentDir)
		testData.setUp(WORKSPACE, function(){
			testData.setUpWorkspace(WORKSPACE, MEATASTORE, done);
		});
	});
	after("Remove .test_workspace", function(done) {
		testData.tearDown(WORKSPACE, function(){
			testData.tearDown(path.join(MEATASTORE, '.orion'), function(){
				testData.tearDown(MEATASTORE, done)
			})
		});
	});
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
					"Location": CONTEXT_PATH + '/workspace/' + WORKSPACE_ID,
					"GitName": "test",
					"GitMail": "test@test.com"
				})
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Location, "/gitapi/clone" + FILE_ROOT + TEST_REPO_NAME);
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
				.put(CONTEXT_PATH + "/gitapi/index"+ FILE_ROOT + TEST_REPO_NAME + "/" + filename)
				.expect(200)
				.end(function() {
					finished();
				});
			});

			it('GET status (check status for git repo)', function(finished) {
				request()
				.get(CONTEXT_PATH + "/gitapi/status"+FILE_ROOT+ TEST_REPO_NAME + "/")
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
				.post(CONTEXT_PATH + "/gitapi/commit/HEAD" + FILE_ROOT + TEST_REPO_NAME)
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
				.get(CONTEXT_PATH + '/gitapi/commit/master%5E..master' + FILE_ROOT + TEST_REPO_NAME)
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
				.post(CONTEXT_PATH + "/gitapi/remote" + FILE_ROOT + TEST_REPO_NAME)
				.send({
					Remote: remoteName,
					RemoteURI: remoteURI
				})
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Location, "/gitapi/remote/" + remoteName + FILE_ROOT + TEST_REPO_NAME);
					finished();
				});
			});
		});

		describe('Get list of remotes',  function() {
			var numRemotes;

			it('GET remote (getting the list of remotes)', function(finished) {
				request()
				.get(CONTEXT_PATH + "/gitapi/remote" + FILE_ROOT + TEST_REPO_NAME)
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
				.post(CONTEXT_PATH + "/gitapi/remote/" + remoteName + FILE_ROOT + TEST_REPO_NAME)
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
				.delete(CONTEXT_PATH + "/gitapi/remote/" + remoteName + FILE_ROOT + TEST_REPO_NAME)
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
				.post(CONTEXT_PATH + "/gitapi/remote" + FILE_ROOT + TEST_REPO_NAME)
				.send({
					Remote: remoteName,
					RemoteURI: remoteURI
				})
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Location, "/gitapi/remote/" + remoteName + FILE_ROOT + TEST_REPO_NAME);
					finished();
				});
			});

			it('POST remote (pushing to a new remote)', function(finished) {

				this.timeout(5000);

				request()
				.post(CONTEXT_PATH + "/gitapi/remote/" + remoteName + "/" + branchName + FILE_ROOT + TEST_REPO_NAME)
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
				.delete(CONTEXT_PATH + "/gitapi/clone" + FILE_ROOT + TEST_REPO_NAME)
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
					GitUrl: gitURL,
					Location: FILE_ROOT
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
				.get(CONTEXT_PATH + "/gitapi/tag" + FILE_ROOT + "sketch")
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
				.delete(CONTEXT_PATH + "/gitapi/clone" + FILE_ROOT + TEST_REPO_NAME)
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
					"Location": CONTEXT_PATH + '/workspace/' + WORKSPACE_ID,
					"GitName": "test",
					"GitMail": "test@test.com"
				})
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Location, "/gitapi/clone" + FILE_ROOT + TEST_REPO_NAME);
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
				.post(CONTEXT_PATH + "/gitapi/remote" + FILE_ROOT + TEST_REPO_NAME)
				.send({
					Remote: remoteName,
					RemoteURI: remoteURI
				})
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Location, "/gitapi/remote/" + remoteName + FILE_ROOT + TEST_REPO_NAME);
					finished();
				});
			});
		});

		var branchName = "test-branch";

		describe('Adding a branch', function() {

			it('POST branch (creating a branch)', function(finished) {
				request()
				.post(CONTEXT_PATH + "/gitapi/branch" + FILE_ROOT + TEST_REPO_NAME)
				.send({
					Name: branchName
				})
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.CommitLocation, "/gitapi/commit/refs%25252Fheads%25252F" + branchName + FILE_ROOT + TEST_REPO_NAME);
					assert.equal(res.body.Location, "/gitapi/branch/" + branchName + FILE_ROOT + TEST_REPO_NAME);
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
				.get(CONTEXT_PATH + "/gitapi/branch" + FILE_ROOT + TEST_REPO_NAME)
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
				.delete(CONTEXT_PATH + "/gitapi/branch/" + branchName + FILE_ROOT + TEST_REPO_NAME)
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
				.delete(CONTEXT_PATH + "/gitapi/clone" + FILE_ROOT + TEST_REPO_NAME)
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

	describe("Rebase", function() {
		before(setup);

		describe("Skip", function() {
			it("skip single conflict", function(finished) {
				var conflicts = "conflicts.txt";
				var fullConflicts = path.join(path.join(WORKSPACE, "skip-single"), conflicts);
				var unrelated = "unrelated.txt";
				var untracked = "untracked.txt";
				var initial, other, beforeRebase;

				var client = new GitClient("skip-single");
				client.init();
				// init file
				client.setFileContents(conflicts, "");
				// init unrelated file
				client.setFileContents(unrelated, "unrelated");
				// stage and commit
				client.stage(conflicts);
				client.stage(unrelated);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;
					client.setFileContents(conflicts, "A");
					client.stage(conflicts);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					other = commit.Id;
					// create a branch
					client.createBranch("other");
					// reset back to original content
					client.reset("HARD", initial);
					// set file to content C
					client.setFileContents(conflicts, "B");
					// stage and commit
					client.stage(conflicts);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					beforeRebase = commit.Id;
					client.rebase("other", "BEGIN");
					return client.start();
				})
				.then(function(body) {
					assert.equal("STOPPED", body.Result);
					client.listBranches();
					return client.start();
				})
				.then(function(body) {
					// check that we've detached HEAD
					assert.equal(body[0].HeadSHA, other);
					assert.equal(body[0].Current, true);
					assert.equal(body[0].Detached, true);
					// check our file for conflict markers
					var expected =
						"<<<<<<< HEAD\n" +
						"A\n" + 
						"=======\n" +
						"B\n" +
						">>>>>>> " + other + "\n";
					var content = fs.readFileSync(fullConflicts).toString();
					assert.equal(content, expected);
					// create changes in the index
					client.setFileContents(unrelated, "index");
					client.stage(unrelated);
					// create changes in the working directory
					client.setFileContents(unrelated, "working dir");
					client.setFileContents(untracked, "to-be-deleted");
					// skip the rebase
					client.rebase("other", "SKIP");
					return client.start();
				})
				.then(function(body) {
					assert.equal("OK", body.Result);
					client.status("SAFE");
					return client.start();
				})
				.then(function(index) {
					assert.equal(index.Added.length, 0);
					assert.equal(index.Changed.length, 0);
					assert.equal(index.Conflicting.length, 0);
					assert.equal(index.Modified.length, 0);
					assert.equal(index.Missing.length, 0);
					assert.equal(index.Removed.length, 0);
					assert.equal(index.Untracked.length, 0);
					client.listBranches();
					return client.start();
				})
				.then(function(children) {
					assert.equal(children[0].Name, "master");
					assert.equal(children[0].HeadSHA, other);
					assert.equal(children[0].Current, true);
					assert.equal(children[0].Detached, false);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("skip middle", function(finished) {
				var first = "first.txt";
				var second = "second.txt";
				var conflicts = "conflicts.txt";
				var fullFirst = path.join(path.join(WORKSPACE, "skip-middle"), first);
				var fullSecond = path.join(path.join(WORKSPACE, "skip-middle"), second);
				var fullConflicts = path.join(path.join(WORKSPACE, "skip-middle"), conflicts);
				var initial, other;

				var client = new GitClient("skip-middle");
				client.init();
				// init conflicts
				client.setFileContents(conflicts, "");
				// init other files
				client.setFileContents(first, "first");
				client.setFileContents(second, "second");
				// stage and commit
				client.stage(conflicts);
				client.stage(first);
				client.stage(second);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;
					client.setFileContents(conflicts, "A");
					client.stage(conflicts);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					other = commit.Id;
					// create a branch
					client.createBranch("other");
					// reset back to original content
					client.reset("HARD", initial);
					// change the first unrelated file
					client.setFileContents(first, "first safe");
					// stage and commit
					client.stage(first);
					client.commit();
					return client.start();
				})
				.then(function() {
					// modify the conflicted file
					client.setFileContents(conflicts, "B");
					// stage and commit
					client.stage(conflicts);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					// change the second unrelated file
					client.setFileContents(second, "second safe");
					// stage and commit
					client.stage(second);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					client.rebase("other", "BEGIN");
					return client.start();
				})
				.then(function(body) {
					assert.equal("STOPPED", body.Result);
					client.listBranches();
					return client.start();
				})
				.then(function(body) {
					// check that we've detached HEAD
					assert.equal(body[0].Current, true);
					assert.equal(body[0].Detached, true);
					// check our file for conflict markers
					var expected =
						"<<<<<<< HEAD\n" +
						"A\n" + 
						"=======\n" +
						"B\n" +
						">>>>>>> " + other + "\n";
					var content = fs.readFileSync(WORKSPACE + "/skip-middle/" + conflicts).toString();
					assert.equal(content, expected);
					// skip the rebase
					client.rebase("other", "SKIP");
					return client.start();
				})
				.then(function(body) {
					assert.equal("OK", body.Result);
					content = fs.readFileSync(fullFirst).toString();
					assert.equal(content, "first safe");
					content = fs.readFileSync(fullSecond).toString();
					assert.equal(content, "second safe");
					content = fs.readFileSync(fullConflicts).toString();
					assert.equal(content, "A");
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});
		}); // describe("Skip")
	}); // describe("Rebase")

	describe("Branch", function() {
		before(setup);

		describe("Checkout", function() {

			/**
			 * Ensures that the user can checkout a branch.
			 * 
			 * @param finished the callback for notifying the test harness that the test has completed
			 * @param testName the name of this test
			 * @param branchName the name of the branch to create and subsequently checkout
			 * @param createConflictingTag <tt>true</tt> if a tag with the same name should be created,
			 *                             <tt>false</tt> otherwise
			 */
			function testBug513503(finished, testName, branchName, createConflictingTag) {
				var tagCommit;

				var client = new GitClient("bug513503-checkout-branch-" + testName);
				client.init();
				client.commit();
				client.start().then(function(commit) {
					tagCommit = commit.Id;

					// create the branch
					client.createBranch(branchName);
					if (createConflictingTag) {
						// create a tag with the same name
						client.createTag(tagCommit, branchName);
					}
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					client.checkoutBranch(branchName);
					client.log("HEAD", branchName);
					return client.start();
				})
				.then(function(body) {
					assert.equal(body.toRef.HeadSHA, tagCommit);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			};

			it("bug 513503 no conflicting tag (tag)", function(finished) {
				testBug513503(finished, "safe-tag", "tag", false);
			});

			it("bug 513503 no conflicting tag (refs/heads/tag)", function(finished) {
				testBug513503(finished, "safe-refs-heads-tag", "refs/heads/tag", false);
			});

			it("bug 513503 no conflicting tag (refs/tags/tag)", function(finished) {
				testBug513503(finished, "safe-refs-tags-tag", "refs/tags/tag", false);
			});

			it("bug 513503 conflicting tag (tag)", function(finished) {
				testBug513503(finished, "conflict-tag", "tag", true);
			});

			it("bug 513503 conflicting tag (refs/heads/tag)", function(finished) {
				testBug513503(finished, "conflict-refs-heads-tag", "refs/heads/tag", true);
			});

			it("bug 513503 conflicting tag (refs/tags/tag)", function(finished) {
				testBug513503(finished, "conflict-refs-tags-tag", "refs/tags/tag", true);
			});
		}); // describe("Checkout")
	}); // describe("Branch")

	describe("Merge", function() {
		before(setup);

		/**
		 * Test suite for merging two branches that don't share a common ancestor.
		 */
		describe("Unrelated", function() {
			it("identical content", function(finished) {
				var testName = "merge-unrelated-identical-content";
				var repository;
				var initial, modify, extra, extra2;
				var name = "test.txt";
				var unrelated = "unrelated.txt";

				var client = new GitClient(testName);
				client.init();
				// create a file with content "A" in it
				client.setFileContents(name, "A");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;
					// open the repository using NodeGit
					var testPath = path.join(WORKSPACE, "merge-unrelated-identical-content");
					return git.Repository.open(testPath);
				})
				.then(function(repo) {
					repository = repo;
					return repository.refreshIndex();
				})
				.then(function(index) {
					// get the oid of the current repository state
					return index.writeTree();
				})
				.then(function(oid) {
					// using that oid, create a commit in another branch with no parent commit
					return repository.createCommit("refs/heads/other",
						git.Signature.default(repository),
						git.Signature.default(repository),
							"unrelated", oid, [ ]);
					})
				.then(function() {
					// merge in the branch with an unrelated history
					client.merge("other");
					return client.start();
				})
				.then(function(result) {
					// should have succeeded, content was in fact identical
					assert.equal(result.Result, "MERGED");
					assert.equal(result.FailingPaths, undefined);

					// check that the status is clean
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

			it("dirty working dir", function(finished) {
				var testName = "merge-unrelated-dirty-working-dir";
				var repository;
				var initial, modify, extra, extra2;
				var name = "test.txt";
				var unrelated = "unrelated.txt";

				var client = new GitClient(testName);
				client.init();
				client.setFileContents(name, "1\n2\n3");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;
					client.setFileContents(name, "a\nb\nc");
					client.stage(name);
					return client.start();
				})
				.then(function() {
					// open the repository using NodeGit
					var testPath = path.join(WORKSPACE, testName);
					return git.Repository.open(testPath);
				})
				.then(function(repo) {
					repository = repo;
					return repository.refreshIndex();
				})
				.then(function(index) {
					// get the oid of the current repository state
					return index.writeTree();
				})
				.then(function(oid) {
					// using that oid, create a commit in another branch with no parent commit
					return repository.createCommit("refs/heads/other",
						git.Signature.default(repository),
						git.Signature.default(repository),
							"unrelated", oid, [ ]);
					})
				.then(function() {
					// reset and make the working directory dirty
					client.reset("HARD", initial);
					client.setFileContents(name, "B");
					// merge in the branch with an unrelated history
					client.merge("other");
					return client.start();
				})
				.then(function(result) {
					// should have failed because of the dirty working dir
					assert.equal(result.Result, "FAILED");
					assert.equal(Object.keys(result.FailingPaths).length, 1);
					assert.equal(result.FailingPaths[name], "");
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("dirty index", function(finished) {
				var testName = "merge-unrelated-dirty-index";
				var repository;
				var initial, modify, extra, extra2;
				var name = "test.txt";
				var unrelated = "unrelated.txt";

				var client = new GitClient(testName);
				client.init();
				client.setFileContents(name, "1\n2\n3");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;
					client.setFileContents(name, "a\nb\nc");
					client.stage(name);
					return client.start();
				})
				.then(function() {
					// open the repository using NodeGit
					var testPath = path.join(WORKSPACE, testName);
					return git.Repository.open(testPath);
				})
				.then(function(repo) {
					repository = repo;
					return repository.refreshIndex();
				})
				.then(function(index) {
					// get the oid of the current repository state
					return index.writeTree();
				})
				.then(function(oid) {
					// using that oid, create a commit in another branch with no parent commit
					return repository.createCommit("refs/heads/other",
						git.Signature.default(repository),
						git.Signature.default(repository),
							"unrelated", oid, [ ]);
					})
				.then(function() {
					// reset and make the working directory dirty
					client.reset("HARD", initial);
					client.setFileContents(name, "B");
					client.stage(name);
					// merge in the branch with an unrelated history
					client.merge("other");
					return client.start();
				})
				.then(function(result) {
					// should have failed because of the dirty working dir
					assert.equal(result.Result, "FAILED");
					assert.equal(Object.keys(result.FailingPaths).length, 1);
					assert.equal(result.FailingPaths[name], "");
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});
		});

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

				client.start().then(function(commit) {
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

			it("dirty working dir prevents checkout", function(finished) {
				var name = "conflicts.txt";
				var initial, tip;

				var client = new GitClient("merge-conflicts-dirty-wd");
				client.init();
				client.setFileContents(name, "A");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					client.setFileContents(name, "B");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					otherBranch = commit.Id;

					client.createBranch("other");
					client.reset("HARD", initial);
					client.setFileContents(name, "C");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					tip = commit.Id;
					// make the working directory version dirty
					client.setFileContents(name, "D");
					client.merge("other");
					return client.start();
				})
				.then(function(result) {
					assert.equal(result.Result, "FAILED");
					assert.equal(Object.keys(result.FailingPaths).length, 1);
					assert.equal(result.FailingPaths[name], "");

					client.log("master");
					return client.start();
				})
				.then(function(log) {
					// ensure that the branch hasn't moved
					assert.equal(log.Children[0].Id, tip);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("dirty index prevents checkout", function(finished) {
				var name = "conflicts.txt";
				var initial, tip;

				var client = new GitClient("merge-conflicts-dirty-index");
				client.init();
				client.setFileContents(name, "A");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					client.setFileContents(name, "B");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					otherBranch = commit.Id;

					client.createBranch("other");
					client.reset("HARD", initial);
					client.setFileContents(name, "C");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					tip = commit.Id;
					// make the index version dirty
					client.setFileContents(name, "D");
					client.stage(name);
					client.merge("other");
					return client.start();
				})
				.then(function(result) {
					assert.equal(result.Result, "FAILED");
					assert.equal(Object.keys(result.FailingPaths).length, 1);
					assert.equal(result.FailingPaths[name], "");

					client.log("master");
					return client.start();
				})
				.then(function(log) {
					// ensure that the branch hasn't moved
					assert.equal(log.Children[0].Id, tip);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});
		}); // describe("Conflicts")

		describe("Squash", function() {
			it("already up-to-date self", function(finished) {
				var testName = "merge-squash-up-to-date-self"
				var initial, other;

				var client = new GitClient(testName);
				client.init();
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					client.merge("master", true);
					return client.start();
				})
				.then(function(result) {
					assert.equal(result.Result, "ALREADY_UP_TO_DATE");
					assert.equal(result.FailingPaths, undefined);
					
					client.log("master");
					return client.start();
				})
				.then(function(log) {
					// make sure that we haven't advanced in history
					assert.equal(log.Children[0].Id, initial);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("already up-to-date older commit", function(finished) {
				var testName = "merge-squash-up-to-date-older-commit"
				var initial, other;

				var client = new GitClient(testName);
				client.init();
				client.createBranch("other");
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					client.merge("other", true);
					return client.start();
				})
				.then(function(result) {
					assert.equal(result.Result, "ALREADY_UP_TO_DATE");
					assert.equal(result.FailingPaths, undefined);

					client.log("master");
					return client.start();
				})
				.then(function(log) {
					// make sure that we haven't advanced in history
					assert.equal(log.Children[0].Id, initial);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("fast-forward", function(finished) {
				var testName = "merge-squash-ff"
				var name = "test.txt";
				var unrelated = "unrelated.txt";
				var fullPath = path.join(path.join(WORKSPACE, testName), name);
				var initial, other;

				var client = new GitClient(testName);
				client.init();
				client.setFileContents(name, "");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					// change the file to contain "A"
					client.setFileContents(name, "A");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					client.createBranch("other");
					// reset back to the initial state of ""
					client.reset("HARD", initial);
					// create an unrelated, untracked file which shouldn't stop the merge
					client.setFileContents(unrelated, "B");
					client.merge("other", true);
					return client.start();
				})
				.then(function(result) {
					assert.equal(result.Result, "FAST_FORWARD_SQUASHED");
					assert.equal(result.FailingPaths, undefined);
					// verify the squash merge
					var content = fs.readFileSync(fullPath).toString();
					assert.equal(content, "A");

					client.log("master");
					return client.start();
				})
				.then(function(log) {
					// make sure that we haven't advanced in history
					assert.equal(log.Children[0].Id, initial);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("fast-forward dirty working tree", function(finished) {
				var testName = "merge-squash-ff-dirty-wd"
				var name = "test.txt";
				var fullPath = path.join(path.join(WORKSPACE, testName), name);
				var initial;

				var client = new GitClient(testName);
				client.init();
				client.setFileContents(name, "");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					// change the file to contain "A"
					client.setFileContents(name, "A");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					client.createBranch("other");
					// reset back to the initial state of ""
					client.reset("HARD", initial);
					// now make the working directory version dirty
					client.setFileContents(name, "B");
					client.merge("other", true);
					return client.start();
				})
				.then(function(result) {
					assert.equal(result.Result, "FAILED");
					assert.equal(Object.keys(result.FailingPaths).length, 1);
					assert.equal(result.FailingPaths[name], "");
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("fast-forward dirty index", function(finished) {
				var testName = "merge-squash-ff-dirty-index"
				var name = "test.txt";
				var fullPath = path.join(path.join(WORKSPACE, testName), name);
				var initial;

				var client = new GitClient(testName);
				client.init();
				client.setFileContents(name, "");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					// change the file to contain "A"
					client.setFileContents(name, "A");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					client.createBranch("other");
					// reset back to the initial state of ""
					client.reset("HARD", initial);
					// now make the index version dirty
					client.setFileContents(name, "B");
					client.stage(name);
					client.merge("other", true);
					return client.start();
				})
				.then(function(result) {
					assert.equal(result.Result, "FAILED");
					assert.equal(Object.keys(result.FailingPaths).length, 1);
					assert.equal(result.FailingPaths[name], "");
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("simple", function(finished) {
				var testName = "merge-squash-simple"
				var name = "test.txt";
				var unrelated = "unrelated.txt";
				var fullPath = path.join(path.join(WORKSPACE, testName), name);
				var initial, current;

				var client = new GitClient(testName);
				client.init();
				client.setFileContents(name, "");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					// change the file to contain "A"
					client.setFileContents(name, "A");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					client.createBranch("other");
					// reset back to the initial state of ""
					client.reset("HARD", initial);
					// make another commit so that it's not a fast-forward
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					current = commit.Id;

					// create an unrelated, untracked file which shouldn't stop the merge
					client.setFileContents(unrelated, "B");
					client.merge("other", true);
					return client.start();
				})
				.then(function(result) {
					assert.equal(result.Result, "MERGED_SQUASHED");
					assert.equal(result.FailingPaths, undefined);
					// verify the squash merge
					var content = fs.readFileSync(fullPath).toString();
					assert.equal(content, "A");

					client.log("master");
					return client.start();
				})
				.then(function(log) {
					// make sure that we haven't advanced in history
					assert.equal(log.Children[0].Id, current);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("simple dirty working tree", function(finished) {
				var testName = "merge-squash-simple-wd"
				var name = "test.txt";
				var fullPath = path.join(path.join(WORKSPACE, testName), name);
				var initial;

				var client = new GitClient(testName);
				client.init();
				client.setFileContents(name, "");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					// change the file to contain "A"
					client.setFileContents(name, "A");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					client.createBranch("other");
					// reset back to the initial state of ""
					client.reset("HARD", initial);
					// make another commit so that it's not a fast-forward
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					current = commit.Id;

					// now make the working directory version dirty
					client.setFileContents(name, "B");
					client.merge("other", true);
					return client.start();
				})
				.then(function(result) {
					assert.equal(result.Result, "FAILED");
					assert.equal(Object.keys(result.FailingPaths).length, 1);
					assert.equal(result.FailingPaths[name], "");

					client.log("master");
					return client.start();
				})
				.then(function(log) {
					// make sure that we haven't advanced in history
					assert.equal(log.Children[0].Id, current);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("simple dirty index", function(finished) {
				var testName = "merge-squash-simple-index"
				var name = "test.txt";
				var fullPath = path.join(path.join(WORKSPACE, testName), name);
				var initial;

				var client = new GitClient(testName);
				client.init();
				client.setFileContents(name, "");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					// change the file to contain "A"
					client.setFileContents(name, "A");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					client.createBranch("other");
					// reset back to the initial state of ""
					client.reset("HARD", initial);
					// make another commit so that it's not a fast-forward
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					current = commit.Id;

					// now make the working directory version dirty
					client.setFileContents(name, "B");
					client.stage(name);
					client.merge("other", true);
					return client.start();
				})
				.then(function(result) {
					assert.equal(result.Result, "FAILED");
					assert.equal(Object.keys(result.FailingPaths).length, 1);
					assert.equal(result.FailingPaths[name], "");

					client.log("master");
					return client.start();
				})
				.then(function(log) {
					// make sure that we haven't advanced in history
					assert.equal(log.Children[0].Id, current);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("conflicts", function(finished) {
				var testName = "merge-squash-conflicts"
				var name = "test.txt";
				var fullPath = path.join(path.join(WORKSPACE, testName), name);
				var initial;

				var client = new GitClient(testName);
				client.init();
				client.setFileContents(name, "");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					// change the file to contain "A"
					client.setFileContents(name, "A");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					client.createBranch("other");
					// reset back to the initial state of ""
					client.reset("HARD", initial);
					// make a conflicting commit
					client.setFileContents(name, "B");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					current = commit.Id;

					client.merge("other", true);
					return client.start();
				})
				.then(function(result) {
					// check the conflict markers
					var expected = "<<<<<<< ours\n" +
						"B\n" +
						"=======\n" +
						"A\n" + 
						">>>>>>> theirs\n";
					var content = fs.readFileSync(fullPath).toString();
					assert.equal(content, expected);
					assert.equal(result.Result, "CONFLICTING");
					assert.equal(result.FailingPaths, undefined);


					client.log("master");
					return client.start();
				})
				.then(function(log) {
					// make sure that we haven't advanced in history
					assert.equal(log.Children[0].Id, current);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});
		}); // describe("Squash")
	}); // describe("Merge")

	describe("Cherry-Pick", function() {
		before(setup);

		describe("Conflicts", function() {
			it("CONFLICTING result returned", function(finished) {
				var name = "conflicts.txt";
				var initial;

				var client = new GitClient("cherry-pick-conflicts");
				client.init();
				// init file with content A
				client.setFileContents(name, "A");
				// stage and commit
				client.stage(name);
				client.commit();

				client.start().then(function(commit) {
					initial = commit.Id;
					// set file to content B
					client.setFileContents(name, "B");
					// stage and commit
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					// reset back to original content A
					client.reset("HARD", initial);
					// set file to content C
					client.setFileContents(name, "C");
					// stage and commit
					client.stage(name);
					client.commit();
					client.cherryPick(commit.Id);
					return client.start();
				})
				.then(function(body) {
					assert.equal(body.HeadUpdated, true);
					assert.equal(body.Result, "CONFLICTING");

					client.status("CHERRY_PICKING");
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
	}); // describe("Cherry-Pick")

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
				client.compare("refs/heads/master", "refs/heads/other", { mergeBase: true });
				client.start().then(function(result) {
					assert.equal(result.AheadCount, 1);
					assert.equal(result.BehindCount, 0);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("bug 515428", function(finished) {
				var repository;
				var initial, modify, extra, extra2;
				var name = "test.txt";
				var unrelated = "unrelated.txt";

				var client = new GitClient("Log-Compare-bug 515428");
				client.init();
				// create a file with content "A" in it
				client.setFileContents(name, "A");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;
					// open the repository using NodeGit
					var testPath = path.join(WORKSPACE, "Log-Compare-bug 515428");
					return git.Repository.open(testPath);
				})
				.then(function(repo) {
					repository = repo;
					return repository.refreshIndex();
				})
				.then(function(index) {
					// get the oid of the current repository state
					return index.writeTree();
				})
				.then(function(oid) {
					// using that oid, create a commit in another branch with no parent commit
					return repository.createCommit("refs/heads/other",
						git.Signature.default(repository),
						git.Signature.default(repository),
							"unrelated", oid, [ ]);
					})
				.then(function() {
					// merge in the branch with an unrelated history
					client.compare("refs/heads/master", "refs/heads/other", { mergeBase: true });
					return client.start();
				})
				.then(function(result) {
					assert.equal(result.AheadCount, 2);
					assert.equal(result.BehindCount, 1);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});
		}); // describe("Compare")

		describe("Branch", function() {

			/**
			 * Check that requesting for the log of a branch with a
			 * name that needs to be URL encoded succeeds.
			 */
			it("bug 513537", function(finished) {
				var client = new GitClient("bug513537");
				// init a new Git repository
				client.init();
				// there's a commit already, create a branch here
				client.createBranch("a%b");
				client.log("a%b");
				client.start().then(function() {
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});
		}); // describe("Branch")

		describe("History", function() {

			/**
			 * 1. Create a change in a branch.
			 * 2. Create another change in a different branch.
			 * 3. Merge the other branch in to create a merge commit.
			 * 4. The returned history should include the merge commit.
			 */
			it("file merge", function(finished) {
				var initial, other, local;
				var name = "test.txt";

				var client = new GitClient("history-file-merge");
				client.init();
				client.setFileContents(name, "1\n2\n3");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					client.setFileContents(name, "1a\n2\n3");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					other = commit.Id;

					client.createBranch("other");
					client.reset("HARD", initial);
					client.setFileContents(name, "1\n2\n3a");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					local = commit.Id;

					client.merge("other");
					client.log("master", "master", name);
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 4);
					// merge commit with two parents
					assert.equal(log.Children[0].Parents.length, 2);
					assert.equal(log.Children[0].Parents[0].Name, local);
					assert.equal(log.Children[0].Parents[1].Name, other);
					assert.equal(log.Children[1].Id, other);
					assert.equal(log.Children[1].Parents.length, 1);
					assert.equal(log.Children[1].Parents[0].Name, initial);
					assert.equal(log.Children[2].Id, local);
					assert.equal(log.Children[2].Parents.length, 1);
					assert.equal(log.Children[2].Parents[0].Name, initial);
					assert.equal(log.Children[3].Id, initial);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			/**
			 * 1. Create a file.
			 * 2. Create some changes in branch 1.
			 * 3. Create a different change in branch 2.
			 * 4. Merge the other branch 1 in.
			 * 5. Discard the other branch 1's changes.
			 * 6. The history should not include the merge commit.
			 * 
			 * In the following example, only commits A and E will
			 * be included as all the changes in B, C, and D have been
			 * discarded in favour of E. The merge commit will not
			 * be included as it does not actually include any content
			 * change for the file in question.
			 * 
			 * M
			 * |\
			 * | \
			 * |  D
			 * |  |
			 * E  C
			 * |  |
			 * |  B
			 * | /
			 * |/
			 * A
			 */
			it("file merge discard", function(finished) {
				var initial, modify, local;
				var name = "test.txt";

				var client = new GitClient("history-file-merge-discard");
				client.init();
				client.setFileContents(name, "A");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					// create some other changes
					client.setFileContents(name, "B");
					client.stage(name);
					client.commit();
					client.setFileContents(name, "C");
					client.stage(name);
					client.commit();
					client.setFileContents(name, "D");
					client.stage(name);
					client.commit();
					client.createBranch("other");
					client.reset("HARD", initial);
					client.setFileContents(name, "E");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					modify = commit.Id;

					client.merge("other");
					// override the content with the current branch's
					client.setFileContents(name, "E");
					// stage and resolve the conflict
					client.stage(name);
					// create the merge commit
					client.commit();
					client.log("master", "master", name);
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 2);
					assert.equal(log.Children[0].Id, modify);
					assert.equal(log.Children[0].Parents.length, 1);
					assert.equal(log.Children[0].Parents[0].Name, initial);
					assert.equal(log.Children[1].Id, initial);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			/**
			 * 1. Create a file in commit A.
			 * 2. Create a change for the file in commit B in a branch.
			 * 3. Create another change for a different file in commit X in another branch.
			 * 4. Merge the other branch in to create a merge commit M.
			 * 5. The history should not include the merge commit.
			 * 
			 * In the following example, the merge commit M is only bringing in
			 * an unrelated change X and does not modify the original file. Hence,
			 * the returned history will only include commits A and B.
			 * 
			 * M
			 * |\
			 * | \
			 * B  X
			 * | /
			 * |/
			 * A
			 */
			it("file unrelated merge", function(finished) {
				var initial, modify, local;
				var name = "test.txt";
				var unrelated = "unrelated.txt";

				var client = new GitClient("history-file-unrelated-merge");
				client.init();
				client.setFileContents(name, "A");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					client.setFileContents(name, "B");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					modify = commit.Id;

					client.createBranch("other");
					client.reset("HARD", initial);
					client.setFileContents(unrelated, "unrelated");
					client.stage(unrelated);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					client.merge("other");
					client.log("master", "master", name);
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 2);
					assert.equal(log.Children[0].Id, modify);
					assert.equal(log.Children[0].Parents.length, 1);
					assert.equal(log.Children[0].Parents[0].Name, initial);
					assert.equal(log.Children[1].Id, initial);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			/**
			 * 1. Create a file.
			 * 2. Delete the file.
			 * 3. Recreate the file.
			 * 4. The returned history should include all three commits.
			 */
			it("file recreate", function(finished) {
				var add, remove, readd;
				var name = "test.txt";

				var client = new GitClient("history-file-recreate");
				client.init();
				client.setFileContents(name, "1\n2\n3");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					add = commit.Id;

					client.delete(name);
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					remove = commit.Id;

					client.setFileContents(name, "recreate");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					readd = commit.Id;

					client.log("master", "master", name);
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 3);
					assert.equal(log.Children[0].Id, readd);
					assert.equal(log.Children[1].Id, remove);
					assert.equal(log.Children[2].Id, add);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			/**
			 * 1. Create a file.
			 * 2. Rename the file.
			 * 3. The returned history should include both commits.
			 */
			it("file rename", function(finished) {
				var add, remove, readd;
				var name = "test.txt";
				var name2 = "test2.txt";

				var client = new GitClient("history-file-rename");
				client.init();
				client.setFileContents(name, "1\n2\n3");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					add = commit.Id;

					// delete and create the other file, essentially a rename
					client.delete(name);
					client.setFileContents(name2, "1\n2\n3");
					// stage both changes
					client.stage(name);
					client.stage(name2);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					rename = commit.Id;

					client.log("master", "master", name2);
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 1);
					assert.equal(log.Children[0].Id, rename);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			/**
			 * 1. Create a file in a branch.
			 * 2. Merge that branch in.
			 * 3. The returned history should not include the merge commit.
			 */
			it("file merge new", function(finished) {
				this.timeout(0);
				var initial, modify, local;
				var name = "test.txt";
				var unrelated = "unrelated.txt";

				var client = new GitClient("history-file-merge-new");
				client.init();
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					client.setFileContents(name, "A");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					modify = commit.Id;

					client.createBranch("other");
					client.reset("HARD", initial);
					client.commit();
					client.merge("other");
					client.log("master", "master", name);
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 1);
					assert.equal(log.Children[0].Id, modify);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			/**
			 * 1. Make 21 changes to a file.
			 * 3. Check that 20 commits (the default page size) are returned from the history and not 21.
			 * 4. Increase the paging size to 30 and send the request again.
			 * 5. All 21 commits should be returned.
			 */
			it("paging", function(finished) {
				this.timeout(10000);
				var add, remove, readd;
				var initial;
				var name = "test.txt";

				var client = new GitClient("history-file-paging");
				client.init();
				client.setFileContents(name, "initial");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					for (var i = 0; i < 20; i++) {
						client.setFileContents(name, i.toString());
						client.stage(name);
						client.commit();
					}
					client.log("master", "master", name);
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 20);
					// even though the first chagne is not included in the returned json,
					// make sure the parent information is correct and pointing at the
					// missing commit
					assert.equal(log.Children[19].Parents.length, 1);
					assert.equal(log.Children[19].Parents[0].Name, initial);
					// increase the page size to 30
					client.log("master", "master", name, { pageSize: 30 });
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 21);
					// only fetch the second page
					client.log("master", "master", name, { page: 2 });
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 1);
					assert.equal(log.Children[0].Name, initial);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});
		}) // describe("History");

		describe("Graph", function() {

			it("simple", function(finished) {
				var first, second, third;

				var client = new GitClient("history-graph-simple");
				client.init();
				client.commit();
				client.start().then(function(commit) {
					first = commit.Id;
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					second = commit.Id;
					client.commit();
					client.log("master", "master");
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children[0].Parents.length, 1);
					assert.equal(log.Children[0].Parents[0].Name, second);
					assert.equal(log.Children[1].Parents.length, 1);
					assert.equal(log.Children[1].Parents[0].Name, first);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			it("file gap", function(finished) {
				var first, second, third;
				var name = "test.txt";

				var client = new GitClient("history-graph-file-gap");
				client.init();
				client.setFileContents(name, "1");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					first = commit.Id;

					client.commit();
					client.setFileContents(name, "2");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					second = commit.Id;

					client.commit();
					client.setFileContents(name, "3");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					third = commit.Id;

					client.commit();
					client.log("master", "master", name);
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 3);
					assert.equal(log.Children[0].Name, third);
					assert.equal(log.Children[0].Parents.length, 1);
					assert.equal(log.Children[0].Parents[0].Name, second);
					assert.equal(log.Children[1].Name, second);
					assert.equal(log.Children[1].Parents.length, 1);
					assert.equal(log.Children[1].Parents[0].Name, first);
					assert.equal(log.Children[2].Name, first);
					assert.equal(log.Children[2].Parents.length, 1);

					client.log("master", "master", name, { page: 1, pageSize: 1 });
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 1);
					assert.equal(log.Children[0].Name, third);
					assert.equal(log.Children[0].Parents.length, 1);
					assert.equal(log.Children[0].Parents[0].Name, second);

					client.log("master", "master", name, { page: 2, pageSize: 1 });
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 1);
					assert.equal(log.Children[0].Name, second);
					assert.equal(log.Children[0].Parents.length, 1);
					assert.equal(log.Children[0].Parents[0].Name, first);

					client.log("master", "master", name, { page: 3, pageSize: 1 });
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 1);
					assert.equal(log.Children[0].Name, first);
					assert.equal(log.Children[0].Parents.length, 1);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			/**
			 * Confirm the parent history information of the following graph.
			 * Commit U is a commit that doesn't modify the file. The merge
			 * commit M also doesn't modify anything. The returned history
			 * should only consist of commits A and B.
			 * 
			 * Actual repository history:
			 * 
			 * M
			 * |\
			 * | \
			 * |  \
			 * U   B
			 * |  /
			 * | /
			 * |/
			 * A
			 * 
			 * Returned history for the file:
			 * 
			 * B
			 * |
			 * A
			 */
			it("file merge unchanged branch", function(finished) {
				var commitA, commitB, local;
				var name = "test.txt";

				var client = new GitClient("history-graph-file-merge-unchnaged-branch");
				client.init();
				// create the file at commit A
				client.setFileContents(name, "A");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					commitA = commit.Id;

					// make the extra commit U
					client.commit();
					client.createBranch("other");
					// reset
					client.reset("HARD", commitA);
					// create commit B
					client.setFileContents(name, "B");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					commitB = commit.Id;

					// merge the unrelated branch
					client.merge("other");
					client.log("master", "master", name);
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 2);
					assert.equal(log.Children[0].Id, commitB);
					assert.equal(log.Children[0].Parents.length, 1);
					assert.equal(log.Children[0].Parents[0].Name, commitA);
					assert.equal(log.Children[1].Id, commitA);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			/**
			 * Confirm the parent history information of the following graph.
			 * The merge commit has B as its first parent and C as its second
			 * parent. It keeps the changes from C after the merge.
			 * Commits A, B, and C all modify the file.
			 * 
			 * Actual repository history:
			 * 
			 * M
			 * |\
			 * | \
			 * |  \
			 * U   C
			 * |  /
			 * | /
			 * |/
			 * B
			 * |
			 * A
			 * 
			 * Returned history for the file:
			 * 
			 * C
			 * |
			 * B
			 * |
			 * A
			 */
			it("bug518591", function(finished) {
				var commitA, commitB, commitC, local;
				var name = "test.txt";
				var testName = "bug518591";
				var fullPath = path.join(WORKSPACE, testName);
				var client = new GitClient(testName);
				client.init();
				// create the file at commit A
				client.setFileContents(name, "A");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					commitA = commit.Id;
					// modify to B
					client.setFileContents(name, "B");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					commitB = commit.Id;
					// create commit C
					client.setFileContents(name, "C");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					commitC = commit.Id;
					// branch
					client.createBranch("other");
					// reset to B
					client.reset("HARD", commitB);
					return client.start();
				})
				.then(function() {
					return git.Repository.open(fullPath);
				})
				.then(function(repo) {
					// merge the other branch without fast-forwarding using NodeGit APIs
					return repo.mergeBranches("HEAD", "other", null, git.Merge.PREFERENCE.NO_FASTFORWARD);
				})
				.then(function() {
					client.log("master", "master", name);
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 3);
					assert.equal(log.Children[0].Id, commitC);
					assert.equal(log.Children[0].Parents.length, 1);
					assert.equal(log.Children[0].Parents[0].Name, commitB);
					assert.equal(log.Children[1].Id, commitB);
					assert.equal(log.Children[1].Parents.length, 1);
					assert.equal(log.Children[1].Parents[0].Name, commitA);
					assert.equal(log.Children[2].Id, commitA);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			/**
			 * Confirm the parent history information of the following graph.
			 * We want to make sure that the extraneous commits A, B, C, and D
			 * don't affect the returned history information of the modified file.
			 * 
			 * Actual repository history:
			 * 
			 * O
			 * |\
			 * | \
			 * |  \
			 * B   D
			 * |   |
			 * O   O
			 * |  /
			 * A C
			 * |/
			 * O
			 * 
			 * Returned history for the file:
			 * 
			 * O
			 * |\
			 * | \
			 * |  \
			 * O   O
			 * |  /
			 * | /
			 * |/
			 * O
			 */
			it("file merge gaps", function(finished) {
				var initial, other, local;
				var name = "test.txt";

				var client = new GitClient("history-graph-file-merge-gaps");
				client.init();
				client.setFileContents(name, "1\n2\n3");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					// make the extra commit A
					client.commit();
					client.setFileContents(name, "1a\n2\n3");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					other = commit.Id;
					// make the extra commit B
					client.commit();

					client.createBranch("other");
					client.reset("HARD", initial);
					// make the extra commit C
					client.commit();
					client.setFileContents(name, "1\n2\n3a");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					local = commit.Id;

					// make the extra commit D
					client.commit();
					client.merge("other");
					client.log("master", "master", name);
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 4);
					// merge commit with two parents
					assert.equal(log.Children[0].Parents.length, 2);
					assert.equal(log.Children[0].Parents[0].Name, local);
					assert.equal(log.Children[0].Parents[1].Name, other);
					assert.equal(log.Children[1].Id, other);
					assert.equal(log.Children[1].Parents[0].Name, initial);
					assert.equal(log.Children[2].Id, local);
					assert.equal(log.Children[2].Parents[0].Name, initial);
					assert.equal(log.Children[3].Id, initial);

					client.log("master", "master", name, { page: 1, pageSize: 1 });
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 1);
					// merge commit with two parents
					assert.equal(log.Children[0].Parents.length, 2);
					assert.equal(log.Children[0].Parents[0].Name, local);
					assert.equal(log.Children[0].Parents[1].Name, other);

					client.log("master", "master", name, { page: 1, pageSize: 2 });
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 2);
					// merge commit with two parents
					assert.equal(log.Children[0].Parents.length, 2);
					assert.equal(log.Children[0].Parents[0].Name, local);
					assert.equal(log.Children[0].Parents[1].Name, other);
					assert.equal(log.Children[1].Id, other);
					assert.equal(log.Children[1].Parents[0].Name, initial);

					client.log("master", "master", name, { page: 2, pageSize: 2 });
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 2);
					assert.equal(log.Children[0].Id, local);
					assert.equal(log.Children[0].Parents[0].Name, initial);
					assert.equal(log.Children[1].Id, initial);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			/**
			 * Actual repository history:
			 * 
			 * O
			 * |
			 * O
			 * |
			 * M
			 * |\
			 * | \
			 * X  O
			 * | /
			 * |/
			 * O
			 * 
			 * Returned history for the file:
			 * 
			 * O
			 * |
			 * O
			 * |
			 * O
			 * |
			 * O
			 */
			it("file unrelated merge", function(finished) {
				var initial, modify, extra, extra2;
				var name = "test.txt";
				var unrelated = "unrelated.txt";

				var client = new GitClient("graph-file-unrelated-merge");
				client.init();
				client.setFileContents(name, "A");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;

					client.setFileContents(name, "B");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					modify = commit.Id;
					client.createBranch("other");
					client.reset("HARD", initial);
					// create an unrelated file
					client.setFileContents(unrelated, "unrelated");
					client.stage(unrelated);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					client.merge("other");
					// create two other commits at the tip of the branch
					client.setFileContents(name, "C");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					extra = commit.Id;

					client.setFileContents(name, "D");
					client.stage(name);
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					extra2 = commit.Id;

					client.log("master", "master", name, { page: 1, pageSize: 2 });
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 2);
					assert.equal(log.Children[0].Id, extra2);
					assert.equal(log.Children[0].Parents.length, 1);
					assert.equal(log.Children[0].Parents[0].Name, extra);
					assert.equal(log.Children[1].Id, extra);
					assert.equal(log.Children[1].Parents.length, 1);
					assert.equal(log.Children[1].Parents[0].Name, modify);

					client.log("master", "master", name, { page: 2, pageSize: 2 });
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 2);
					assert.equal(log.Children[0].Id, modify);
					assert.equal(log.Children[0].Parents.length, 1);
					assert.equal(log.Children[0].Parents[0].Name, initial);
					assert.equal(log.Children[1].Id, initial);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});

			/**
			 * 1. Create a file in branch A in commit O.
			 * 2. Create the same file with the same content in branch B
			 *    with a fresh history in commit O'.
			 * 3. Add an empty commit in branch B.
			 * 4. Merge branch B into branch A.
			 * 5. The returned history should only contain commit O.
			 * 
			 * Actual repository history:
			 * 
			 * M
			 * |\
			 * | \
			 * O U
			 *   |
			 *   O'
			 * 
			 * Returned history for the file:
			 * 
			 * O
			 */
			it("unrelated identical content", function(finished) {
				var repository;
				var initial, indexOid;
				var name = "test.txt";

				var client = new GitClient("graph-unrelated-identical-content");
				client.init();
				// create a file with content "A" in it
				client.setFileContents(name, "A");
				client.stage(name);
				client.commit();
				client.start().then(function(commit) {
					initial = commit.Id;
					// open the repository using NodeGit
					var testPath = path.join(WORKSPACE, "graph-unrelated-identical-content");
					return git.Repository.open(testPath);
				})
				.then(function(repo) {
					repository = repo;
					return repository.refreshIndex();
				})
				.then(function(index) {
					// get the oid of the current repository state
					return index.writeTree();
				})
				.then(function(oid) {
					indexOid = oid;
					// using that oid, create a commit in another branch with no parent commit
					return repository.createCommit("refs/heads/other",
						git.Signature.default(repository),
						git.Signature.default(repository),
							"unrelated", indexOid, [ ]);
				})
				.then(function(commit) {
					return repository.createCommit("refs/heads/other",
						git.Signature.default(repository),
						git.Signature.default(repository),
							"unrelated", indexOid, [ commit ])
				})
				.then(function() {
					// merge in the branch with an unrelated history
					client.merge("other");
					client.log("master", "master", name);
					return client.start();
				})
				.then(function(log) {
					assert.equal(log.Children.length, 1);
					assert.equal(log.Children[0].Id, initial);
					assert.equal(log.Children[0].Parents.length, 1);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});
		}) // describe("Graph");
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
				client.start().then(function(children) {
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
			assert.equal(tag.CloneLocation, "/gitapi/clone" + FILE_ROOT + testName);
			assert.equal(tag.CommitLocation, "/gitapi/commit/" + commitSHA + FILE_ROOT + testName);
			assert.equal(tag.TreeLocation, "/gitapi/tree" + FILE_ROOT + testName + "/" + util.encodeURIComponent(tagName).replace(/%/g, "%25"));
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
					client.log("master");
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

			/**
			 * 1. Create a tag with a name.
			 * 2. Create a tag on the same commit with the same name.
			 * 3. Check that the server isn't trying to set headers
			 *    after a response has been sent.
			 */
			it("bug 515315", function(finished) {
				var testName = "tag-bug515315";
				var tagName = "tag515315";
				var commitSHA;

				var client = new GitClient(testName);
				client.init();
				client.commit();
				client.start().then(function(commit) {
					commitSHA = commit.Id;

					client.createTag(commitSHA, tagName, false, null);
					client.listTags();
					return client.start();
				})
				.then(function(tags) {
					// only created one tag
					assert.equal(tags.length, 1);
					assertTag(tags[0], tagName, false, testName, commitSHA);

					// create a tag with the same name, this should cause a 403
					client.createTag(commitSHA, tagName, false, null, 403);
					client.listTags();
					return client.start();
				})
				.then(function(tags) {
					// still only one tag
					assert.equal(tags.length, 1);
					assertTag(tags[0], tagName, false, testName, commitSHA);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			});
		}); // describe("Create")

		describe("Checkout", function() {

			/**
			 * Ensures that the user can checkout a tag by creating a local branch off of the tag.
			 * 
			 * @param finished the callback for notifying the test harness that the test has completed
			 * @param testName the name of this test
			 * @param tagName the name of the tag to create
			 * @param branchName the name of the branch to create off of the tag
			 */
			function testBug513503(finished, testName, tagName, branchName) {
				var tagCommit;

				var client = new GitClient("bug513503-checkout-tag-" + testName);
				client.init();
				client.commit();
				client.start().then(function(commit) {
					tagCommit = commit.Id;

					// create the tag
					client.createTag(tagCommit, tagName);
					// make another commit so we're further in history
					client.commit();
					return client.start();
				})
				.then(function(commit) {
					// checkout the tag
					client.checkoutTag(tagName, branchName);
					// make sure we've checked out the branch
					client.log("HEAD", branchName);
					return client.start();
				})
				.then(function(body) {
					assert.equal(body.toRef.HeadSHA, tagCommit);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			};

			it("bug 513503 no conflicting tag (tag)", function(finished) {
				testBug513503(finished, "safe-tag", "tag", "tag2");
			});

			it("bug 513503 no conflicting tag (refs/heads/tag)", function(finished) {
				testBug513503(finished, "safe-refs-heads-tag", "refs/heads/tag", "refs/heads/tag2");
			});

			it("bug 513503 no conflicting tag (refs/tags/tag)", function(finished) {
				testBug513503(finished, "safe-refs-tags-tag", "refs/tags/tag", "refs/tags/tag2");
			});

			it("bug 513503 conflicting tag (tag)", function(finished) {
				testBug513503(finished, "conflict-tag", "tag", "tag");
			});

			it("bug 513503 conflicting tag (refs/heads/tag)", function(finished) {
				testBug513503(finished, "conflict-refs-heads-tag", "refs/heads/tag", "refs/heads/tag");
			});

			it("bug 513503 conflicting tag (refs/tags/tag)", function(finished) {
				testBug513503(finished, "conflict-refs-tags-tag", "refs/tags/tag", "refs/tags/tag");
			});
		}); // describe("Checkout")

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
				client.setFileContents("a%b.txt");
				client.stage("a%b.txt");
				client.status("SAFE");
				client.start().then(function(index) {
					assert.equal(index.Added.length, 1);
					assert.equal(index.Added[0].Name, "a%b.txt");
					assert.equal(index.Added[0].Path, "a%b.txt");
					assert.equal(index.Added[0].Location,  FILE_ROOT + "bug512285/" + "a%b.txt".replace(/\%/g, "%25"));
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

		describe("Get", function() {
			it("bug 516088", function(finished) {
				var client = new GitClient("status-bug516088-あいうえお");
				client.init();
				client.status("SAFE");
				client.start().then(function(res) {
					finished();
				})
			});
		});

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
				client.createFolder("a b");
				client.createFolder("modules");
				client.createFolder("modules/orionode");

				// tests > /a%b.txt
				client.setFileContents("a%b.txt");
				client.status("SAFE");
				client.start().then(function(status) {
					var git = status.Untracked[0].Git;
					var encodeName = "a%b.txt".replace(/\%/g, "%25");
					assert.equal(git.CommitLocation,
						"/gitapi/commit/HEAD" + FILE_ROOT + "bug512061/" + encodeName);
					assert.equal(git.DiffLocation,
						"/gitapi/diff/Default" + FILE_ROOT + "bug512061/" + encodeName);
					assert.equal(git.IndexLocation,
						"/gitapi/index" + FILE_ROOT + "bug512061/" + encodeName);

					client.delete("/a%b.txt");
					// tests > /a b/test.txt
					client.setFileContents("a b/test.txt");
					client.status("SAFE");
					return client.start();
				})
				.then(function(status) {
					var git = status.Untracked[0].Git;
					var encodeName = "a b";
					assert.equal(git.CommitLocation,
						"/gitapi/commit/HEAD" + FILE_ROOT + "bug512061/" + encodeName + "/test.txt");
					assert.equal(git.DiffLocation,
						"/gitapi/diff/Default" + FILE_ROOT + "bug512061/" + encodeName + "/test.txt");
					assert.equal(git.IndexLocation,
						"/gitapi/index" + FILE_ROOT + "bug512061/" + encodeName + "/test.txt");

					client.delete("/a b/test.txt");
					// tests > /modules/orionode/hello.js
					client.setFileContents("/modules/orionode/hello.js");
					client.status("SAFE");
					return client.start();
				})
				.then(function(status) {
					var git = status.Untracked[0].Git;
					assert.equal(git.CommitLocation,
						"/gitapi/commit/HEAD" + FILE_ROOT + "bug512061/modules/orionode/hello.js");
					assert.equal(git.DiffLocation,
						"/gitapi/diff/Default" + FILE_ROOT + "bug512061/modules/orionode/hello.js");
					assert.equal(git.IndexLocation,
						"/gitapi/index" + FILE_ROOT + "bug512061/modules/orionode/hello.js");
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("bug 512061")"
		}); // describe("DiffLocation")
	}); // describe("Status")

	describe("Stash", function() {
		before(setup);

		describe("List", function() {
			it("simple", function(finished) {
				var client = new GitClient("stash-list-simple");
				client.init();
				client.listStash();
				client.start().then(function(body) {
					assert.equal(body.Children.length, 0);

					client.setFileContents("a.txt", "abc");
					client.stage("a.txt");
					client.commit();
					client.setFileContents("a.txt", "def");
					client.stash();
					client.listStash();
					return client.start();
				})
				.then(function(body) {
					assert.equal(body.Children.length, 1);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("empty stash")"
		}); // describe("List")

		describe("Save", function() {
			it("dirty working directory", function(finished) {
				var testName = "stash-save-dirty-wd";
				var file = "a.txt";
				var filePath = path.join(path.join(WORKSPACE, testName), file);
				var client = new GitClient(testName);
				client.init();
				// track this file
				client.setFileContents(file, "abc");
				client.stage(file);
				client.commit();

				// modify the file
				client.setFileContents(file, "abcx");
				// client.setFileContents(file, "def");
				client.stash();
				client.start().then(function(body) {
					var content = fs.readFileSync(filePath).toString();
					assert.equal(content, "abc");
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("dirty working directory")

			it("dirty index", function(finished) {
				var testName = "stash-save-dirty-index";
				var file = "a.txt";
				var filePath = path.join(path.join(WORKSPACE, testName), file);
				var client = new GitClient(testName);
				client.init();
				// track this file
				client.setFileContents(file, "abc");
				client.stage(file);
				client.commit();

				// modify the file
				client.setFileContents(file, "abcx");
				client.stage(file);
				client.stash();
				client.start().then(function(body) {
					var content = fs.readFileSync(filePath).toString();
					assert.equal(content, "abc");
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("dirty index")

			function stashUntracked(testName, includeUntracked, finished) {
				var file = "a.txt";
				var filePath = path.join(path.join(WORKSPACE, testName), "b.txt");
				var client = new GitClient(testName);
				client.init();
				// track this file
				client.setFileContents(file, "abc");
				client.stage(file);
				client.commit();

				// create the other file
				client.setFileContents("b.txt", "other");
				client.stash(includeUntracked, includeUntracked ? 200 : 404);
				client.start().then(function(body) {
					// the stash should have deleted/ignored the file depending on
					// whether untracked files should be included
					assert.equal(fs.existsSync(filePath), !includeUntracked);
					if (!includeUntracked) {
						// untracked files not included, content should be unchanged
						var content = fs.readFileSync(filePath).toString();
						assert.equal(content, "other");
					}
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}

			it("untracked ignored", function(finished) {
				stashUntracked("stash-save-untracked-ignored", false, finished);
			}); // it("untracked ignored")

			it("untracked stashed", function(finished) {
				stashUntracked("stash-save-untracked-stashed", true, finished);
			}); // it("untracked ignored")
		}); // describe("Save")

		describe("Pop", function() {

			/**
			 * Pop the stash while it is empty.
			 */
			it("empty stash", function(finished) {
				var client = new GitClient("stash-pop-empty");
				// init a new Git repository
				client.init();
				client.stashPop(400);
				client.start().then(function(body) {
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("empty stash")"

			it("simple", function(finished) {
				var testName = "stash-pop-simple";
				var file = "a.txt";
				var filePath = path.join(path.join(WORKSPACE, testName), file);
				var client = new GitClient(testName);
				client.init();
				// track this file
				client.setFileContents(file, "abc");
				client.stage(file);
				client.commit();

				client.setFileContents(file, "abcx");
				client.stash();
				client.listStash();
				client.start().then(function(body) {
					assert.equal(body.Children.length, 1);
					var content = fs.readFileSync(filePath).toString();
					assert.equal(content, "abc");

					client.stashPop();
					client.listStash();
					return client.start();
				})
				.then(function(body) {
					content = fs.readFileSync(filePath).toString();
					assert.equal(content, "abcx");
					assert.equal(body.Children.length, 0);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("simple")
		}); // describe("Pop")

		describe("Apply", function() {

			it("empty stash", function(finished) {
				var client = new GitClient("stash-apply-empty");
				// init a new Git repository
				client.init();
				client.stashApply("rev123", 400, "Failed to apply stashed changes due to an empty stash.");
				client.start().then(function(body) {
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("empty stash")"

			it("invalid stash rev", function(finished) {
				var file = "a.txt";
				var client = new GitClient("stash-apply-invalid");
				client.init();
				// track this file
				client.setFileContents(file, "abc");
				client.stage(file);
				client.commit();

				// modify the file
				client.setFileContents(file, "abcx");
				client.stash();
				client.stashApply("rev123", 400, "Invalid stash reference rev123.");
				client.listStash();
				client.start().then(function(body) {
					assert.equal(body.Children.length, 1);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("invalid stash rev")
		}); // describe("Apply")

		describe("Drop", function() {

			/**
			 * Drop the stash when it is empty.
			 */
			it("empty stash", function(finished) {
				var client = new GitClient("stash-drop-empty");
				// init a new Git repository
				client.init();
				// try dropping the whole stash
				client.stashDrop(null, 400, "Failed to drop stashed changes due to an empty stash.");
				client.start().then(function(body) {
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("empty stash")"

			/**
			 * Drop a given stash revision when the stash is empty.
			 */
			it("empty stash with stash rev", function(finished) {
				var client = new GitClient("stash-drop-empty-stash-rev");
				// init a new Git repository
				client.init();
				// try dropping a stash revision while the stash is not empty
				client.stashDrop("rev123", 400, "Failed to drop stashed changes due to an empty stash.");
				client.start().then(function(body) {
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("empty stash with invalid stash rev")"

			/**
			 * Put something in the stash and then ask Orion to drop an invalid stash revision from the stash.
			 */
			it("invalid stash rev", function(finished) {
				var file = "a.txt";
				var client = new GitClient("stash-drop-invalid");
				client.init();
				// track this file
				client.setFileContents(file, "abc");
				client.stage(file);
				client.commit();

				// modify the file
				client.setFileContents(file, "abcx");
				client.stash();
				client.stashDrop("rev123", 400, "Invalid stash reference rev123.");
				client.listStash();
				client.start().then(function(body) {
					assert.equal(body.Children.length, 1);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("invalid stash rev")"

			/**
			 * Stash something and then ask Orion to drop the entire stash.
			 */
			it("all", function(finished) {
				var file = "a.txt";
				var client = new GitClient("stash-drop-all");
				client.init();
				// track this file
				client.setFileContents(file, "abc");
				client.stage(file);
				client.commit();

				// modify the file
				client.setFileContents(file, "abcx");
				client.stash();
				client.stashDrop();
				client.listStash();
				client.start().then(function(body) {
					assert.equal(body.Children.length, 0);
					finished();
				})
				.catch(function(err) {
					finished(err);
				});
			}); // it("invalid stash rev")"
		}); // describea("Drop")
	}); // describe("Stash")

	describe("config", function() {
		this.timeout(10000);
		function repoConfig() {
			return request()
			.get(CONTEXT_PATH + "/gitapi/config/clone" + FILE_ROOT + TEST_REPO_NAME);
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
			repoConfig()
			.expect(200)
			.expect(function(res) {
				assert.equal(res.body.Type, "Config", "Is a config");
				assert.ok(res.body.Children.length > 0, "has Children");
			})
			.end(done);
		});
		it("gets key", function(done) {
			repoConfig()
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
			repoConfig()
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

		it("bug 516088", function(finished) {
			var client = new GitClient("bug516088-config-あいうえお");
			client.init();
			client.getConfig();
			client.start().then(function(res) {
				finished();
			})
		});
	}); // describe("config")

}); // describe("Git")