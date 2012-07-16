/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define*/
define(['orion/serviceTracker'], function(ServiceTracker) {
	var PROPERTY_CLASSES = 'classes', PROPERTY_DESIGNATES = 'designates'; //$NON-NLS-0$ //$NON-NLS-1$
	var METATYPE_SERVICE = 'orion.cm.metatype';
	var PropertyTypeImpl, ObjectClassImpl;

	/**
	 * @name orion.metatype.MetaTypeRegistry
	 * @class
	 * @description
	 * @param {orion.serviceRegistry.ServiceRegistry} serviceRegistry
	 */
	function MetaTypeRegistry(serviceRegistry) {
		function forEach(serviceRef, propertyName, func) {
			var array = serviceRef.getProperty(propertyName);
			if (array instanceof Array) {
				array.forEach(func);
			}
		}
		var tracker = new ServiceTracker(serviceRegistry, METATYPE_SERVICE); //$NON-NLS-0$
		var ocsMap = this.ocsMap = {};	// OC Id {String} -> {ObjectClass}
		var pidsMap = this.pidsMap = {}; // PID {String} -> {ObjectClass}
		tracker.addingService = function(serviceRef) {
			forEach(serviceRef, PROPERTY_CLASSES, function(oc) {
				var ocImpl = new ObjectClassImpl(oc);
				ocsMap[ocImpl.getId()] = ocImpl;
			});
			forEach(serviceRef, PROPERTY_DESIGNATES, function(designate) {
				var pid = designate.pid, ocId = designate.classId;
				if (pid && ocId) {
					// Assume the ObjectClass has been defined already, either by this service or a service registered earlier.
					pidsMap[pid] = ocsMap[ocId];
				}
			});
			return serviceRegistry.getService(serviceRef);
		};
		tracker.removedService = function(serviceRef, service) {
			forEach(serviceRef, PROPERTY_CLASSES, function(oc) {
				delete ocsMap[oc.id];
			});
			forEach(serviceRef, PROPERTY_DESIGNATES, function(designate) {
				delete pidsMap[designate.pid];
			});
		};
		tracker.open();
	}
	MetaTypeRegistry.prototype = /** @lends orion.metatype.MetaTypeRegistry.prototype */ {
		/**
		 * Returns the object class for a given PID.
		 * @param {String} pid The PID to look up.
		 * @returns {orion.metatype.ObjectClass} The object class, or <code>null</code> if no object class 
		 * has been designated for the given PID.
		 */
		getObjectClass: function(pid) {
			return this.pidsMap[pid] || null;
		}
	};

	/**
	 * @name orion.metatype.impl.ObjectClassImpl
	 * @private
	 */
	ObjectClassImpl = /** @ignore */ function(ocdJson) {
		this.id = ocdJson.id;
		this.name = ocdJson.name || null;
		var props = ocdJson.properties;
		if (!this.id) {
			throw 'Missing "id" property: ' + JSON.stringify(ocdJson); //$NON-NLS-0$
		}
		if (!(props instanceof Array) || !props.length) {
			throw '"properties" property is missing or empty: ' + JSON.stringify(ocdJson); //$NON-NLS-0$
		}
		this.props = [];
		for (var i=0; i < props.length; i++) {
			this.props.push(new PropertyTypeImpl(props[i]));
		}
	};
	ObjectClassImpl.prototype = {
		getPropertyTypes: function() {
			return this.props;
		},
		getId: function() {
			return this.id;
		},
		getName: function() {
			return this.name;
		}
	};

	/**
	 * @name orion.metatype.impl.PropertyTypeImpl
	 * @private
	 */
	PropertyTypeImpl = /** @ignore */ function(attrJson) {
		function isType(t) {
			switch (t) {
				case 'boolean': //$NON-NLS-0$
				case 'number': //$NON-NLS-0$
				case 'string': //$NON-NLS-0$
					return true;
			}
		}
		this.id = attrJson.id;
		this.name = attrJson.name || null;
		this.type = attrJson.type || 'string'; //$NON-NLS-0$
		if (!this.id) {
			throw 'Missing "id" property: ' + JSON.stringify(attrJson); //$NON-NLS-0$
		}
		if (!isType(this.type)) {
			throw 'Invalid "type": ' + this.type; //$NON-NLS-0$
		}
	};
	PropertyTypeImpl.prototype = {
		getId: function() {
			return this.id;
		},
		getName: function() {
			return this.name;
		},
		getType: function() {
			return this.type;
		}
	};

	/**
	 * @name orion.metatype.ObjectClass
	 * @class Describes a kind of object.
	 * @description An <code>ObjectClass</code> describes a kind of object. <p>It typically serves to describe
	 * what properties may appear in a {@link orion.cm.ConfigurationProperties} dictionary.</p>
	 */
		/**
		 * @name orion.metatype.ObjectClass#getPropertyTypes
		 * @function
		 * @description Returns the property types.
		 * @returns {orion.metatype.PropertyType[]} The property types of this object class.
		 */
		/**
		 * @name orion.metatype.ObjectClass#getId
		 * @function
		 * @description Returns the id.
		 * @returns {String} The id of this object class.
		 */
		/**
		 * @name orion.metatype.ObjectClass#getName
		 * @function
		 * @description Returns the name.
		 * @returns {String} The name of this object class. May be <code>null</code>.
		 */
	/**
	 * @name orion.metatype.PropertyType
	 * @class Describes the data type of a property.
	 * @description A <code>PropertyType</code> describes the data type of a property. <p>It typically serves to
	 * describe the type of an individual property that may appear in a {@link orion.cm.ConfigurationProperties} dictionary.</p>
	 */
		/**
		 * @name orion.metatype.PropertyType#getId
		 * @function
		 * @description Returns the id.
		 * @returns {String} The id of this PropertyType.
		 */
		/**
		 * @name orion.metatype.PropertyType#getName
		 * @function
		 * @description Returns the description.
		 * @returns {String} The name, or <code>null</code>.
		 */
		/**
		 * @name orion.metatype.PropertyType#getType
		 * @function
		 * @description Returns the type.
		 * @returns {String} The type. It is one of:
		 * <ul>
		 * <li><code>'boolean'</code></li>
		 * <li><code>'number'</code></li>
		 * <li><code>'string'</code></li>
		 * </ul>
		 */
	return {
		MetaTypeRegistry: MetaTypeRegistry
	};
});