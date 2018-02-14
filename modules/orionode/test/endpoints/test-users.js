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
/*eslint-env mocha */
const assert = require('assert'),
	path = require('path'),
	testData = require('../support/test_data'),
	testHelper = require('../support/testHelper');

	
const CONTEXT_PATH = testHelper.CONTEXT_PATH,
	WORKSPACE = testHelper.WORKSPACE,
	METADATA =  testHelper.METADATA,
	WORKSPACE_ID = testHelper.WORKSPACE_ID;
	
let request = testData.setupOrionServer();

// Like `assert.ifError` but allows the message to be overridden
function throwIfError(cause, message) {
	if (!cause || !cause instanceof Error && Object.prototype.toString.call(cause) !== '[object Error]' && cause !== 'error') {
		return;
	}
	var err = new Error(message + ": " + cause.message);
	err.cause = cause;
	throw err;
}

/**
 * These test are all skipped until we have proper authentication support
 */
describe("Users endpoint", function() {
	beforeEach(function(done) { // testData.setUp.bind(null, parentDir)
		testData.setUp(WORKSPACE, function() {
			testData.setUpWorkspace(request, done);
		});
	});
	afterEach("Remove .test_workspace", function(done) {
		testData.tearDown(testHelper.WORKSPACE, function(){
			testData.tearDown(path.join(METADATA, '.orion'), function(){
				testData.tearDown(METADATA, done)
			})
		});
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.users.BasicUsersTest.java
	 */
	describe("Single user mode", function() {
		it("testGetUsersList", function(done) {
			request()
				.get(CONTEXT_PATH + '/users')
				.set('Orion-Version', 1)
				.expect(403, done);
		});
		it("testGetUser - anonymous", function(done) {
			request()
				.get(CONTEXT_PATH + '/users/anonymous')
				.set('Orion-Version', 1)
				.expect(200)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					assert(res, "There should have been a user record returned for 'anonymous' in single user mode");
					done();
				});
		});
	});
	describe.skip("Multi-tenant mode", function() {
		it("testMoveUser");
		it("testReadAllUsers");
		it("testGetUserHomeWithNullArgument");
		it("testGetUserHome");
		it("testReadUser");
		it("testUpdateUser");
		it("testAddUserProperty");
		it("testDeleteUserProperty");
		it("testNoUserProperty");
		it("testUpdateUserProperty");
		it("testReadUserByEmailConfirmationProperty");
		it("testReadUserByPasswordResetIdProperty");
		it("testReadUserByDiskUsageAndTimestampProperty");
		it("testReadUserByBlockedProperty");
		it("testReadUserByEmailProperty");
		it("testReadUserByOauthProperty");
		it("testReadUserByOpenidProperty");
		it("testReadUserByPasswordProperty");
		it("testReadUserByUserNameProperty");
		it("testReadUserThatDoesNotExist");
		it("testCreateDuplicateUser", function(done) {
			var json = {UserName: "testCreateDuplicateUser", Email: 'testCreateDuplicateUser@bar.org', FullName: "testCreateDuplicateUser Bar", Password: "1234"};
			request()
				.post(CONTEXT_PATH + '/users')
				.type('json')
				.send(json)
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					request()
						.post('/users')
						.type('json')
						.send(json)
						.expect(400)
						.end(done);
				});
		});
		it("testCreateUserWithNoUserName", function(done) {
			var json = {Email: 'testCreateDuplicateUser@bar.org', FullName: "testCreateDuplicateUser Bar", Password: "1234"};
			request()
				.post(CONTEXT_PATH + '/users')
				.type('json')
				.send(json)
				.expect(400)
				.end(done);
		});
		it("testCreateUserWithNoEmail", function(done) {
			var json = {UserName: 'testCreateUserWithNoEmail', FullName: "testCreateDuplicateUser Bar", Password: "1234"};
			request()
				.post(CONTEXT_PATH + '/users')
				.type('json')
				.send(json)
				.expect(400)
				.end(done);
		});
		it("testCreateUserDuplicateEmail", function(done) {
			var json = {UserName: "testCreateUserDuplicateEmail", Email: 'testCreateUserDuplicateEmail@bar.org', FullName: "testCreateUserDuplicateEmail Bar", Password: "1234"};
			request()
				.post(CONTEXT_PATH + '/users')
				.type('json')
				.send(json)
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					json.UserName = "bazz";
					json.FullName = "Bazz Foo"
					request()
						.post('/users')
						.type('json')
						.send(json)
						.expect(400)
						.end(done);
				});
		});
		it("testCreateUserEmailDifferentCase", function(done) {
			var json = {UserName: "testCreateUserEmailDifferentCase", Email: 'testCreateUserEmailDifferentCase@bar.org', FullName: "testCreateUserEmailDifferentCase Bar", Password: "1234"};
			request()
				.post(CONTEXT_PATH + '/users')
				.type('json')
				.send(json)
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					json.UserName = "bazz";
					json.FullName = "Bazz Foo";
					json.Email = "Foo@Bar.org"
					request()
						.post('/users')
						.type('json')
						.send(json)
						.expect(400)
						.end(done);
				});
		});
		it("testCreateUserInvalidName", function(done) {
			var json = {UserName: "foo", Email: 'foo@bar.org', FullName: "Foo Bar", Password: "1234"};
			var badChars = " !@#$%^&*()-=_+[]{}\";':\\/><.,`~";
			for(var i = 0, len = badChars.length; i < len; i++) {
				json.UserName = "bad" + badChars.charAt(i) + "name";
				request()
					.post(CONTEXT_PATH + '/users')
					.type('json')
					.send(json)
					.expect(400)
					.end(function(err, res) {
						throwIfError(err);
					});
				if(i === len-1) {
					done();
				}
			}
		});
		it("testCreateDeleteUsers", function(done) {
			var json = {UserName: "testCreateDeleteUsers", Email: 'testCreateDeleteUsers@bar.org', FullName: "testCreateDeleteUsers Bar", Password: "1234"};
			request()
				.post(CONTEXT_PATH + '/users')
				.type('json')
				.send(json)
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					assert(res.body, "There should have been a body");
					assert(res.body.Location, "There should have been a location for the user");
					request()
						.delete(res.body.Location)
						.expect(200)
						.end(done);
				});
		});
		/**
		 * TODO we currently don't have a unique ID implementation in the node server
		 */
		it("testDeleteUserByUniqueIdProperty", function(done) {
			var json = {UserName: "testDeleteUserByUniqueIdProperty", Email: 'testDeleteUserByUniqueIdProperty@bar.org', FullName: "testDeleteUserByUniqueIdProperty Bar", Password: "1234"};
			request()
				.post(CONTEXT_PATH + '/users')
				.type('json')
				.send(json)
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					assert(res.body, "There should have been a body");
					assert(res.body.Location, "There should have been a location for the user");
					request()
						.delete(res.body.Location) //This would be the unique ID, not the location
						.expect(200)
						.end(done);
				});
		});
		it("testUpdateUsers", function(done) {
			var json = {UserName: "testUpdateUsers", Email: 'testUpdateUsers@bar.org', FullName: "testUpdateUsers Bar", Password: "1234"};
			request()
				.post(CONTEXT_PATH + '/users')
					.type('json')
					.send(json)
					.expect(201)
					.end(function(err, res) {
						throwIfError(err);
						assert(res.body, "There should have been a body");
						assert(res.body.Location, "There should have been a location in the body");
						request()
							.put(res.body.Location)
							.type('json')
							.send({FullName: "testUpdateUsers0 Bar", OldPassword: "1234", Password: "new1234"})
							.expect(200)
							.end(done)
					});
		});
		it("testResetUser", function(done) {
			var json = {roles: "admin", UserName: "testResetUser", Email: 'testResetUser@bar.org', FullName: "testResetUser Bar", Password: "1234"};
			request()
				.post(CONTEXT_PATH + '/users')
					.type('json')
					.send(json)
					.expect(201)
					.end(function(err, res) {
						throwIfError(err);
						assert(res.body, "There should have been a body");
						assert(res.body.Location, "There should have been a location in the body");
						request()
							.put(res.body.Location)
							.type('json')
							.send({UserName: "testResetUser", Password: "new1234", Reset: true})
							.expect(200)
							.end(done)
					});
		});
		it("testCreateUser", function(done) {
			var json = {UserName: "testCreateUser", Email: 'testCreateUser@bar.org', FullName: "testCreateUser Bar", Password: "1234"};
			request()
				.post(CONTEXT_PATH + '/users')
				.type('json')
				.send(json)
				.expect(201)
				.end(done);
		});
		it("testChangeUserName", function(done) {
			var json = {UserName: "testChangeUserName", Email: 'testChangeUserName@bar.org', FullName: "testChangeUserName Bar", Password: "1234"};
			request()
				.post(CONTEXT_PATH + '/users')
					.type('json')
					.send(json)
					.expect(201)
					.end(function(err, res) {
						throwIfError(err);
						assert(res.body, "There should have been a body");
						assert(res.body.Location, "There should have been a location in the body");
						request()
							.put(res.body.Location)
							.type('json')
							.send({UserName: "testChangeUserNameNew"})
							.expect(200)
							.end(done)
					});
		});
		it("testCreateDeleteRights");
	});
});