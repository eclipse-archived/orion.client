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
	var METATYPE_SERVICE = 'orion.cm.metatype'; //$NON-NLS-0$
	var PropertyTypeImpl, ObjectClassImpl;

	/**
	 * @name orion.metatype.MetaTypeRegistry
	 * @class Maintains a registry of metatype information.
	 * @description A MetaTypeRegistry provides access to metatype information from the service registry.
	 * @param {orion.serviceRegistry.ServiceRegistry} serviceRegistry The service registry to monitor.
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
		getObjectClassForPid: function(pid) {
			return this.pidsMap[pid] || null;
		},
		/**
		 * Returns the object class with the given ID.
		 * @param {String} classId The object class ID to look up.
		 * @returns {orion.metatype.ObjectClass} The object class, or <code>null</code> if no object class 
		 * with the given ID exists.
		 */
		getObjectClass: function(classId) {
			return this.ocsMap[classId] || null;
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
		this.options = attrJson.options || null;
		this.type = attrJson.type || 'string'; //$NON-NLS-0$
		this.defaultValue = attrJson.defaultValue || null;
		if (!this.id) {
			throw 'Missing "id" property: ' + JSON.stringify(attrJson); //$NON-NLS-0$
		}
		if (!isType(this.type)) {
			throw 'Invalid "type": ' + this.type; //$NON-NLS-0$
		}
		if (this.options) {
			this.options.forEach(function(option) {
				if (typeof option.value === 'undefined') { //$NON-NLS-0$
					throw 'Missing option value: ' + JSON.stringify(option); //$NON-NLS-0$
				}
			});
		}
	};
	PropertyTypeImpl.prototype = {
		getId: function() {
			return this.id;
		},
		getName: function() {
			return this.name;
		},
		getOptionLabels: function() {
			return this.options && this.options.map(function(o) {
				return o.label;
			});
		},
		getOptionValues: function() {
			return this.options && this.options.map(function(o) {
				return o.value;
			});
		},
		getType: function() {
			return this.type;
		},
		getDefaultValue: function() {
			return this.defaultValue;
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
		 * @name orion.metatype.PropertyType#getOptionValues
		 * @function
		 * @description Returns the option values that this property can take.
		 * @returns {Object[]|null} The option values. The ordering of the returned array matches the ordering of the labels
		 * array returned by {@link #getOptionLabels}. If there are no option values available, <code>null</code> is returned.
		 */
		/**
		 * @name orion.metatype.PropertyType#getOptionLabels
		 * @function
		 * @description Returns a list of labels for option values.
		 * @returns {String[]|null} The option labels. The ordering of the returned array matches the ordering of the values
		 * array returned by {@link #getOptionValues}. If there are no option labels available, <code>null</code> is returned.
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
		/**
		 * @name orion.metatype.PropertyType#getDefaultValue
		 * @function
		 * @description Returns the default value.
		 * @returns {Object} The default value, or <code>null</code> if no default exists.
		 */
	return {
		MetaTypeRegistry: MetaTypeRegistry
	};
});