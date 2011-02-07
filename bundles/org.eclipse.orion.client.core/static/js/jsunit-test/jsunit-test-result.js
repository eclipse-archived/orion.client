/*******************************************************************************
 * Copyright (c) 2009, 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 /*global dojo */

var eclipse = eclipse || {};

eclipse.UnitTestResult = (function() {
  function Result(renderer, createModel , options) {
	   	this._renderer = renderer;
	   	this._createModel = createModel;
	  
		this._resultDivId  = eclipse.uTestUtils.getOptionValue(options, "resultDivId", eclipse.uTestConsts.RESULT_DIV_ID);
		this._resultTreeId  = eclipse.uTestUtils.getOptionValue(options, "resultTreeId", eclipse.uTestConsts.RESULT_TREE_ID);
		this._indicator =  eclipse.uTestUtils.getOptionValue(options, "indicator", undefined);
			
		this._resultDivDomNode = dojo.byId( this._resultDivId);
		this._resultRoot = {
			children:[]
		};
		this._testFiles = [];
		this._filterDiv = dojo.byId("filterResult");
		var self = this;
		dojo.connect(this._filterDiv, "onchange", function() {
			self.onFilterChange();
		});
  }
  
  Result.prototype = {

	createResultTree: function(keepIndicator){
	  	this._resultModel = this._createModel(this._resultRoot, this._resultTreeId , this._filterDiv.checked);
	  	this.clearResultUI(keepIndicator);
	  	this._resultTree = new eclipse.TableTree({
	    	id: this._resultTreeId,
	    	model: this._resultModel,
	    	showRoot: true,
	    	parent: this._resultDivId,
	    	labelColumnIndex: 0,  // 0 if no checkboxes
	    	renderer: this._renderer
	  	});
	  	this._renderer.setTreeTable(this._resultTree);
	  	this._renderer.expandAll();
	},
	
	onFilterChange: function(){
		this.createResultTree(true);
	},
	
	clearResultUI: function(keepIndicator){
	  	var resultTreeDomNode = dojo.byId( this._resultTreeId);
	  	if(resultTreeDomNode){
	  		resultTreeDomNode.innerHTML = "";
	  		this._resultDivDomNode.removeChild(resultTreeDomNode);
	  	}
	  	this._renderer._stackRenderer.update(null);
	  	if(keepIndicator)
	  		return;
		if(this._indicator)
			this._indicator.update(0,0);
	},
	
	getTestCaseModel: function(testSuiteNo , tcName){
		var testCases = this._resultRoot.children[testSuiteNo].children;
		var len = testCases.length;
		for(var i=0 ; i < len; i++){
			if(testCases[i].name === tcName)
				return testCases[i];
		}	
		var testCase = {
			children:[],
			type: "case",
			name: tcName,
			fileUrl: "",
			line: 0,
			succeed: true
		};
		testCases.push(testCase);
		return testCase;
	},

	loadFiles: function(result){
		console.log("Load Files : " + result.success);
		this._testCounter = 0;
		this._failureCounter = 0;
		var self = this;
		var f = function(result) {
			return self.getTestNames(result);
		};
		
		this._mockSuite.testNames(f);
	},
	
	getTestNames: function(result){
		console.log("Test Names : " + result.testNames);
		var testNames = result.testNames;
		this._testNumber = testNames.length;
		var i = 0;
		var self = this;
		var f = function(result) {
			return self.runSingleTest(result);
		};
		
		for(i=0 ; i < this._testNumber; i++){
			this._mockSuite.runTest(testNames[i] , f);
		}	
	},

	runSingleTest: function(result){
		console.log("Test result : " + result);
		var splits = result.testName.split(".");
		var testCase = this.getTestCaseModel(0 , splits[0]);
		var test = {
			type: "test",
			name: splits[1],
			fileUrl: "",
			line: 0,
			succeed: result.success,
			detail: result.stack
		};
		testCase.children.push(test);
		if(!result.success){
			testCase.succeed = false;
			this._resultRoot.children[0].succeed = false;
		}
		this._testCounter++;
		if(!result.success)
			this._failureCounter++;
		if(this._testCounter == this._testNumber){
			this.createResultTree();
			if(this._indicator !== undefined)
				this._indicator.update( this._testNumber , this._failureCounter );
		}
	},

	//This function will be used for real jason data after Simon's core part is done
	loadTestResultMock: function(mockData/*,fileNames*/){
		var root = {
			children:[],
			type: "root",
			name: "Test Suite",
			fileUrl: "",
			line: 0,
			succeed: true
		};
		this._resultRoot.children = [];
		this._resultRoot.children.push(root);
		this._mockSuite = eclipse.testService.createTestSuite(mockData);
		var self = this;
		var f = function(result) {
			return self.loadFiles(result);
		};
		this._mockSuite.load([], f);
	},
	
	//Modified by Libing after 20110124
	_createIFrame: function(src) {
	    var iframe = document.createElement("iframe");
	    iframe.src = src;
	    iframe.name = src;
		var style = iframe.style;
		style.position = "absolute";
		style.left = "-2000px";
		style.top = "0px";
	    document.body.appendChild(iframe);
	    return iframe;
	},
	
	_initResultRoot: function(){
		var root = {
				children:[],
				type: "root",
				name: "Test Suite",
				fileUrl: "",
				line: 0,
				succeed: true
		};
		this._resultRoot.children = [];
		this._resultRoot.children.push(root);
		this._testNumber = 0;
		this._failureCounter = 0;
	},
	
	_buildResultRecord: function(response){
		console.log("building!!!!!!!!!!!!!!");
		var self = top.uTestResult;
		//var responseJson =  JSON.parse(response.response);
		var responseJson =  response.response;
		if(!responseJson)
				return;
		var len = responseJson.length;
		for (var i= 0 ; i < len ; i++){
			if(responseJson[i]){
				var testCaseName = responseJson[i]["testCaseName"];
				if(!testCaseName || testCaseName === "")
						continue;
				var testName = responseJson[i]["testName"];
				var result =  responseJson[i]["result"];
				var testCase = self.getTestCaseModel(0 , testCaseName);
				self._testNumber = self._testNumber + 1;
				self._failureCounter = self._failureCounter + (result === "passed" ?0:1);
				var message = "";
				if(responseJson[i].message){
					var messageJson =  JSON.parse(responseJson[i].message);
					if(messageJson.stack)
						message = messageJson.stack;
				}
				var testSucceed = result === "passed" ?true:false;
				if(!testSucceed){
					testCase.succeed = false;
					self._resultRoot.children[0].succeed = false;
				}
				var test = {
						type: "test",
						name: testName,
						fileUrl: "",
						line: 0,
						succeed: testSucceed,
						detail: message
					};
				testCase.children.push(test);
			}
		}
	},
	
	_closeResultRecord: function(response){
		console.log("closing!!!!!!!!!!!!!!");
		var self = top.uTestResult;
		self._buildResultRecord(response);
		self.createResultTree();
		if(self._indicator !== undefined)
			self._indicator.update( self._testNumber , self._failureCounter );
		
		if(self._iframe){
			//self._iframe.close();
			self._iframe = null;
		}
	},

	_startTest: function (param){
		var self = this;
		self._iframe.contentWindow.startTesting(param , self._closeResultRecord , self._buildResultRecord);
	},
	
	handleMessage: function(evt) {
		console.log("+++++++++++++" + evt.data);
		
		var messageJson =  JSON.parse(evt.data);
		var self = this;
		if("frameReady" === messageJson.type){
			self._startTest([JSON.stringify(self._testFiles)]);
		} else if ("continue" === messageJson.type){
			self._buildResultRecord(messageJson.response);		
		} else if ("close" === messageJson.type){
			self._closeResultRecord(messageJson.response);		
		}
	},

	//This function is for real test from JSTD
	loadTestResultFiles: function(configValue){
		if(configValue === null || configValue === undefined)
			return;
		var len = configValue.length;
		this._testFiles = [];
		for(var i=0 ; i < len; i++){
			var location = configValue[i].location ? configValue[i].location : configValue[i];
			this._testFiles.push({"fileSrc" : location});
		}
		//messageHandle.postMessage(JSON.stringify(param), "http://localhost:8080/jstest/IFrameRunner.html");
		var self = this;
		
		this._initResultRoot();
		this._iframe = this._createIFrame("/js/jsunit-test/jstd-iframe.html");
	}

  };
/*  
	loadTestResultFiles: function(configValue){
		if(configValue === null || configValue === undefined)
			return;
		var len = configValue.length;
		if(len === 0)
			return;
		var succeed =  len < 4;
		var root = {
			children:[],
			type: "root",
			name: "Test Suite",
			fileUrl: "",
			line: 0,
			succeed: succeed
		};
		this._resultRoot.children = [];
		this._resultRoot.children.push(root);
		for(var i=0 ; i < len; i++){
			var location = configValue[i].location ? configValue[i].location : configValue[i];
			var testCase = {
				children:[],
				type: "case",
				name: "Test Case :  " + location,
				fileUrl: "",
				line: 0,
				succeed: succeed
			};
			root.children.push(testCase);
			for(var j=0; j < 3;j++){
				var test = {
					type: "test",
					name: location + "test result   " + j,
					fileUrl: "",
					line: 0,
					succeed: succeed ? true : (j===2 ? false:true),
					detail: succeed? "" : "failed at :" + location + ":12:10   " + "test details   " + j
				};
				testCase.children.push(test);
			}
		}
		this.createResultTree();
		if(this._indicator !== undefined)
			this._indicator.update(len*3 , succeed ? 0 :  len );
	}

  };
*/
  return Result;
}());