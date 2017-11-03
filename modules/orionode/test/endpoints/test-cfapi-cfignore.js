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
	path = require("path"),
	testHelper = require('../support/testHelper'),
	cfIgnore = require("../../lib/cf/cfIgnore");
	
var relativePathList = []; // path(relative Path to test against), expect(true if it should be ignored)
describe("Test CFIgnore API", function() {
	before("prepare test data", function(done){
		// for default rule: '.' files
		relativePathList = relativePathList.concat([{
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
		
		// for rule: 'zxc*'
		relativePathList = relativePathList.concat([{
			path: "zxc/123",
			expect: true // different from .gitignore where * doesn't match slash
		}, {
			path: "zxcasd",
			expect: true
		}, {
			path: "zxc456/123",
			expect: true
		}, {
			path: "123/zxcasd.js",
			expect: true
		}, {
			path: "123zxcfd",
			expect: false
		}]);
		
		// for rule: 'poi'
		relativePathList = relativePathList.concat([{
			path: "123poi",
			expect: false
		}, {
			path: "poi/123",
			expect: true
		}, {
			path: "poi",
			expect: true
		}, {
			path: "poi.js",
			expect: false
		}, {
			path: "poiasd",
			expect: false
		}, {
			path: "345/poi/123",
			expect: true
		},{
			path: "123/poi",
			expect: true
		}]);
		
		// for rule: 'qwe/'
		relativePathList = relativePathList.concat([{
			path: "qwe/123",
			expect: true
		}, {
			path: "qwer/123",
			expect: false
		}, {
			path: "tyu/qwe/123",
			expect: true
		}, {
			path: "qwe",
			expect: true //this is a bit unexpected, but it is ignored
		}, {
			path: "qwe/123/456",
			expect: true
		}]);
		
		// for rule: 'tyt*/'
		relativePathList = relativePathList.concat([{
			path: "tytasd/123",
			expect: true
		}, {
			path: "tyt/123",
			expect: true
		}, {
			path: "tytfile",
			expect: true  // trailing slash doesn't mean this has to be a folder, wield but this is how it works
		}, {
			path: "123tytasd/123",
			expect: false
		}]);
		
		// for rule: '*jkl'
		relativePathList = relativePathList.concat([{
			path: "asdjkl",
			expect: true
		}, {
			path: "asdjkl.js",
			expect: false
		}, {
			path: "jkl",
			expect: true 
		}, {
			path: "jkl/123",
			expect: true
		}, {
			path: "jjjjkl/123",
			expect: true
		}, {
			path: "jkl123/123",
			expect: false
		}, {
			path: "123/jkl/123",
			expect: true
		}, {
			path: "123/jklm/123",
			expect: false
		}]);
		
		// for rule: '**jkm'
		relativePathList = relativePathList.concat([{
			path: "asdjkm",
			expect: true
		}, {
			path: "asdjkm.js",
			expect: false
		}, {
			path: "jkm",
			expect: true 
		}, {
			path: "jkm/123",
			expect: true
		}, {
			path: "jjjjkm/123",
			expect: true
		}, {
			path: "jkm123/123",
			expect: false
		}, {
			path: "123/jkm/123",
			expect: true
		}, {
			path: "123/jkm4/123",
			expect: false
		}]);
		
		// for rule: 'c*v'
		relativePathList = relativePathList.concat([{
			path: "cv",
			expect: true
		}, {
			path: "cav",
			expect: true
		},{
			path: "caasdv",
			expect: true
		}, {
			path: "cafv/123",
			expect: true 
		}, {
			path: "123/cav",
			expect: true
		}, {
			path: "123/cafv/123",
			expect: true
		}, {
			path: "acgv",
			expect: false
		}, {
			path: "cva",
			expect: false
		}, {
			path: "c/mnb/v",
			expect: false
		}, {
			path: "c/v",
			expect: false
		}, {
			path: "c/v/b",
			expect: false
		}]);
		
		// for rule: 'b**n'
		relativePathList = relativePathList.concat([{
			path: "bn",
			expect: true
		}, {
			path: "ban",
			expect: true
		},{
			path: "baasdn",
			expect: true
		}, {
			path: "bafn/123",
			expect: true 
		}, {
			path: "123/ban",
			expect: true
		}, {
			path: "123/bafn/123",
			expect: true
		}, {
			path: "abgn",
			expect: false
		}, {
			path: "bna",
			expect: false
		}, {
			path: "b/zxc/n",
			expect: true
		}, {
			path: "b/n",
			expect: true
		}, {
			path: "b/n/z",
			expect: true
		}]);
		
		// for rule: 'r/**/i'
		relativePathList = relativePathList.concat([{
			path: "r123i",
			expect: false
		}, {
			path: "r/a/i",
			expect: true
		},{
			path: "r/i",
			expect: false
		}, {
			path: "r/1/2/i",
			expect: true 
		}]);
		
		// for rule: 'd/*.html'
		relativePathList = relativePathList.concat([{
			path: "d/asd.html",
			expect: true
		}, {
			path: "asd.html",
			expect: false
		}, {
			path: "dasd.html",
			expect: false
		}, {
			path: "123/d/asd.html",
			expect: true
		}, {
			path: "d/q/asd.html",
			expect: false 
		}]);
		
		// for rule: '/tmp'
		relativePathList = relativePathList.concat([{
			path: "tmp.js",
			expect: false
		}, {
			path: "tmp",
			expect: true
		}, {
			path: "123/tmp",
			expect: false
		}, {
			path: "tmp/123",
			expect: true
		}]);
		
		// create a .cfignore file in support directory
		var cfIngoreContent = [
			"#This is cf Ignore file",
			"!thisWillBeIgnored",
			
			"zxc*",
			"poi",
			"qwe/",
			"tyt*/",
			"*jkl",
			"**jkm",
			"c*v",
			"b**n",
			"r/**/i",
			"d/*.html",
			"/tmp"
		];
		fs.writeFile(path.join(__dirname, "../support/.cfignore"), cfIngoreContent.join("\n"), "utf-8", function(err){
			done();
		});
	});
	
	after("clean cfignore file", function(done){
		fs.unlink(path.join(__dirname, "../support/.cfignore"), done);
	});
	
	it("Test CFIgnore API", function() {
		var cFIgnoreManager = new cfIgnore.CFIgnoreManager();
		return cFIgnoreManager.loadCfIgnoreFile(path.join(__dirname, "../support/"))
		.then(function(){
			var filter = cFIgnoreManager.generateFilter();
			relativePathList.forEach(function(relativePath){
				try{
					assert.equal(filter(relativePath.path), relativePath.expect, relativePath.path + " is not respected by cf ignore rules")
				}catch(err){
					console.log(err.message)
					return;
				}
			});
			return;
		})
	});
});