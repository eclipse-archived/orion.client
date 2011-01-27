/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
var ServiceRegistryTestCase = TestCase("ServiceRegistryTestCase");

ServiceRegistryTestCase.prototype.testRegisterAndGetService = function(){
	var count = 0;
	
	var registry = new eclipse.ServiceRegistry();
	var registration = registry.registerService("testRegister",{test:function(){return count+1;}},{test:1});
	var reference = registration.getServiceReference();
	assertEquals("testRegister", reference.getName());
	assertEquals(1, reference.getProperty("test"));
	
	var service1;
	assertEquals(0,count);
	registry.getService("testRegister").then(function(service) {
		service1 = service;
		service1.test().then(function(newcount) {
			count = newcount;
		});
	});
	assertEquals(1,count);
	
	var service2;
	registry.getService(reference).then(function(service) {
		service2 = service;
		service2.test().then(function(newcount) {
			count = newcount;
		});
	});
	assertEquals(2,count);

	
	//contrived
	assertEquals(service1,service2);
	registration.unregister();
	try {
		service2.test().then(function(newcount){count = newcount;});
		fail();
	} catch(e) {
		count++; //expected
	}
	assertEquals(3,count);
};

ServiceRegistryTestCase.prototype.testGetServiceDelayed = function(){
	var count = 0;
	var registry = new eclipse.ServiceRegistry();
	registry.getService("testGetServiceDelayed", 0).then(null, function(e){count++;});
	assertEquals(1,count);
	
	registry.getService("testGetServiceDelayed").then(function(service){return service.test();}).then(function(newcount){count = newcount;});
	assertEquals(1,count);
	var registration = registry.registerService("testGetServiceDelayed",{test:function(){return count+1;}});
	assertEquals(2,count);
};

ServiceRegistryTestCase.prototype.testEvents = function(){
	var serviceAddedCount= 0;
	var serviceRemovedCount = 0;
	var eventResult;
	
	var registry = new eclipse.ServiceRegistry();
	var sahandler = function() {serviceAddedCount++;};
	var srhandler = function() {serviceRemovedCount++;};
	registry.addEventListener("serviceAdded", sahandler);
	registry.addEventListener("serviceRemoved", srhandler);
	
	assertEquals(0,serviceAddedCount);
	assertEquals(0,serviceRemovedCount);
	var registration = registry.registerService("testEvents",{test:function(){return count+1;}});
	assertEquals(1,serviceAddedCount);
	assertEquals(0,serviceRemovedCount);
	
	registry.getService(registration.getServiceReference()).then(function(service) {
		var eventHandler = function(result) { eventResult = result;};
		service.addEventListener("event", eventHandler);
		assertEquals(null, eventResult);
		registration.dispatchEvent("nonevent", "bad");
		assertEquals(null, eventResult);
		registration.dispatchEvent("event", "good");
		assertEquals("good", eventResult);
		service.removeEventListener("event", eventHandler);
		registration.dispatchEvent("event", "bad");
		assertEquals("good", eventResult);
	});

	registration.unregister();
	assertEquals(1,serviceAddedCount);
	assertEquals(1,serviceRemovedCount);
};
