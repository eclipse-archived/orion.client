/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*jslint amd:true*/
define([
	'javascript/contentAssist/typesFromIndexFile',
	'orion/objects'
], function(mTypes, objects) {
	/**
	 * @name javascript.Indexer
	 * @class
	 * @description
	 */
	function TernIndexer() {
		this.catalog = null;
	}

	objects.mixin(TernIndexer.prototype, /** @lends javascript.Indexer.prototype */ {
		setIndexData: function(typeDefs) {
			// TODO each index should be requested lazily from Editor Context, then cached
			var catalog = Object.create(null);
			typeDefs.forEach(function(data) {
				var name;
				if (!(name = data["!name"])) {
					throw new Error("Missing !name in typeDef: " + data);
				}
				catalog[name] = data;
			});
			this.catalog = catalog;
		},
		/**
		 * @returns {Object} An object mapping fileName {String} to {@link javascript.Summary}
		 */
		retrieveGlobalSummaries: function() {
			// for now we assume no globals can leak out of dependencies so there is nothing to return
		},
		/**
		 * @param {String} moduleName
		 * @returns {javascript.Summary}
		 */
		retrieveSummary: function(moduleName) {
			if (Object.prototype.hasOwnProperty.call(this.catalog, moduleName)) {
				// TODO mTypes is implicit static global. Should be parameter to Indexer and ContentAssist, and have better defined life cycle.
				var indexData = this.catalog[moduleName];
				var globalsAndTypes = mTypes.getGlobalsAndTypes(moduleName, indexData);
				return toSummary(moduleName, globalsAndTypes);
			}
			return null;
		}
	});

	function toSummary(moduleName, globalsAndTypes) {
		return {
			provided: moduleName,
			types: globalsAndTypes.types
		}
	}

	/**
	 * @name javascript.Summary
	 * @class
	 * @description Summary of types in a dependent module.
	 * provided : { name -> typeName }
	 * types : { typeName -> { name -> typeName } }
	 */
	return TernIndexer;
});