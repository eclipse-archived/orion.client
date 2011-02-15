/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

(function(test, assert) {
	
var tests = {};
tests.testRegisterAndGetService = function(){
	var count = 0;
	
	var registry = new eclipse.ServiceRegistry();
	var registration = registry.registerService("testRegister",{test:function(){return count+1;}},{test:1});
	var reference = registration.getServiceReference();
	assert.equal("testRegister", reference.getName());
	assert.equal(1, reference.getProperty("test"));
	
	var service1;
	assert.equal(0,count);
	registry.getService("testRegister").then(function(service) {
		service1 = service;
		service1.test().then(function(newcount) {
			count = newcount;
		});
	});
	assert.equal(1,count);
	
	var service2;
	registry.getService(reference).then(function(service) {
		service2 = service;
		service2.test().then(function(newcount) {
			count = newcount;
		});
	});
	assert.equal(2,count);

	
	//contrived
	assert.equal(service1,service2);
	registration.unregister();
	assert.throws(function() {
		service2.test().then(function(newcount){count = newcount;});
	});
	count++;
	assert.equal(3,count);
};

tests.testGetServiceDelayed = function(){
	var count = 0;
	var registry = new eclipse.ServiceRegistry();
	registry.getService("testGetServiceDelayed", 0).then(null, function(e){
		count++;
	});
	assert.equal(1,count);
	
	registry.getService("testGetServiceDelayed").then(function(service){return service.test();}).then(function(newcount){count = newcount;});
	assert.equal(1,count);
	var registration = registry.registerService("testGetServiceDelayed",{test:function(){return count+1;}});
	assert.equal(2,count);
};

tests.testEvents = function(){
	var serviceAddedCount= 0;
	var serviceRemovedCount = 0;
	var eventResult;
	
	var registry = new eclipse.ServiceRegistry();
	var sahandler = function() {serviceAddedCount++;};
	var srhandler = function() {serviceRemovedCount++;};
	registry.addEventListener("serviceAdded", sahandler);
	registry.addEventListener("serviceRemoved", srhandler);
	
	assert.equal(0,serviceAddedCount);
	assert.equal(0,serviceRemovedCount);
	var registration = registry.registerService("testEvents",{test:function(){return count+1;}});
	assert.equal(1,serviceAddedCount);
	assert.equal(0,serviceRemovedCount);
	
	registry.getService(registration.getServiceReference()).then(function(service) {
		var eventHandler = function(result) { eventResult = result;};
		service.addEventListener("event", eventHandler);
		assert.equal(null, eventResult);
		registration.dispatchEvent("nonevent", "bad");
		assert.equal(null, eventResult);
		registration.dispatchEvent("event", "good");
		assert.equal("good", eventResult);
		service.removeEventListener("event", eventHandler);
		registration.dispatchEvent("event", "bad");
		assert.equal("good", eventResult);
	});

	registration.unregister();
	assert.equal(1,serviceAddedCount);
	assert.equal(1,serviceRemovedCount);
};

var testPromise = test.runAsynch(tests);
testPromise.then(function(result) {console.log("Failures: " + result);});
	
}(orion.Test, orion.Assert));
