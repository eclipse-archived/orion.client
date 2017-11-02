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
var assert = require("assert"),
	fs = require("fs"),
	cfIgnore = require("../../lib/cf/cfIgnore");
	
var relativePathList = [];
describe("Test CFIgnore API", function() {
	before("prepare test data", function(done){
		// for default rule: '.' files
		relativePathList.concat([{
			path: ".git/123",
			expect: true
		}, {
			path: "asd/.git/123",
			expect: true
		}, {
			path: ".cfignore",
			expect: true
		}, {
			path: "asd/app.js",
			expect: false
		}, {
			path: "server.js",
			expect: false
		}]);
		
		// for rule: 'qwe/'
//		relativePathList.concat([{
//			path: "qwe/123",
//			expect: true
//		}, {
//			path: "qwer/123",
//			expect: false
//		}, {
//			path: "tyu/qwe/123",
//			expect: true // not sure Need test
//		}, {
//			path: "qwe", // this is a file
//			expect: false
//		}, {
//			path: "qwe/123/456",
//			expect: true
//		}]);
		
		// for rule: 'zxc*'
		relativePathList.concat([{
			path: "zxc/123",
			expect: true // wildcard will not match slash(not sure)
		}, {
			path: "zxcasd",
			expect: true
		}, {
			path: "123/zxcasd.js",
			expect: true // not sure Need test
		}, {
			path: "123zxcfd", // this is a file
			expect: false
		}]);
		
		// create a .cfignore file in support directory
		var cfIngoreContent = 
			"zxc*\n"+
			"poi\n";
		fs.writeFile("../support/.cfignore", cfIngoreContent, "utf-8", function(err){
			done();
		});
	});
	
	it("Test CFIgnore API", function(done) {
		var cFIgnoreManager = new cfIgnore.CFIgnoreManager();
		cFIgnoreManager.loadCfIgnoreFile('../support')
		.then(function(){
			var filter = cFIgnoreManager.generateFilter();
			relativePathList.forEach(function(relativePath){
				assert.equal(filter(relativePath.path), relativePath.expect, relativePath + "is not respected by cf ignore rules")
			});
			done();
		});
	});
});