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
define(['dojo', 'examples/textview/textStyler', 'orion/editor/textMateStyler', 'orion/editor/asyncStyler',
			'examples/textview/textStylerOptions'], 
		function(dojo, mTextStyler, mTextMateStyler, mAsyncStyler, mTextStylerOptions) {
	/**
	 * Returns a promise that will provide a styler for the given content type.
	 * @static
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 * @param {orion.file.ContentTypeService} contentTypeService
	 * @param {orion.file.ContentType} contentType
	 * @param {orion.textview.TextView} textView
	 * @param {orion.textview.AnnotationModel} annotationModel
	 * @param {String} [fileName] Deprecated.
	 * @returns {Dojo.Deferred}
	 */
	function createStyler(serviceRegistry, contentTypeService, contentType, textView, annotationModel, fileName) {
		// Returns a promise (if provider matches) or null (if it doesn't match).
		function getPromise(provider, extension) {
			var contentTypeIds = provider.getProperty("contentType"),
			    fileTypes = provider.getProperty("fileTypes"); // backwards compatibility
			if (contentTypeIds) {
				return contentTypeService.isSomeExtensionOf(contentType, contentTypeIds).then(
					function (isMatch) {
						return isMatch ? provider : null;
					});
			} else if (extension && fileTypes && fileTypes.indexOf(extension) !== -1) {
				var d = new dojo.Deferred();
				d.callback(provider);
				return d;
			}
			return null;
		}
		function createDefaultStyler(contentType) {
			var styler = null;
			switch (contentType && contentType.id) {
				case "text.javascript":
				case "text.json":
					styler = new mTextStyler.TextStyler(textView, "js", annotationModel);
					break;
				case "text.java":
					styler = new mTextStyler.TextStyler(textView, "java", annotationModel);
					break;
				case "text.css":
					styler = new mTextStyler.TextStyler(textView, "css", annotationModel);
					break;
			}
			if (styler) {
				// Temporary. Add support for the preference page.
				new mTextStylerOptions.TextStylerOptions(styler);
			}
			return styler;
		}
		// Check default styler
		var styler = createDefaultStyler(contentType);
		if (styler) {
			var result = new dojo.Deferred();
			result.callback(styler);
			return result;
		}

		// Check services
		var extension = fileName && fileName.split(".").pop().toLowerCase();
		var serviceRefs = serviceRegistry.getServiceReferences("orion.edit.highlighter");
		var grammars = [], promises = [];
		for (var i=0; i < serviceRefs.length; i++) {
			var serviceRef = serviceRefs[i];
			if (serviceRef.getProperty("type") === "grammar") {
				grammars.push(serviceRef.getProperty("grammar"));
			}
			var promise = getPromise(serviceRef, extension);
			if (promise) {
				promises.push(promise);
			}
		}
		return new dojo.DeferredList(promises).then(function(promises) {
			// Take the last matching provider. Could consider ranking them here.
			var provider;
			for (var i = promises.length - 1; i >= 0; i--) {
				var promise = promises[i][1];
				if (promise) {
					provider = promise;
					break;
				}
			}
			var styler;
			if (provider) {
				var type = provider.getProperty("type");
				if (type === "highlighter") {
					styler = new mAsyncStyler.AsyncStyler(textView, serviceRegistry, annotationModel);
					styler.setContentType(contentType);
				} else if (type === "grammar" || typeof type === "undefined") {
					var grammar = provider.getProperty("grammar");
					styler = new mTextMateStyler.TextMateStyler(textView, grammar, grammars);
				}
			}
			return styler;
		});
	}
	/**
	 * @name orion.highlight.SyntaxHighlighter
	 * @class
	 * @description 
	 * <p>Requires service {@link orion.file.ContentTypeService}</p>
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry Registry to look up highlight providers from.
	 */
	function SyntaxHighlighter(serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
		this.styler = null;
	}
	SyntaxHighlighter.prototype = /** @lends orion.highlight.SyntaxHighlighter.prototype */ {
		/**
		 * @param {orion.file.ContentType} contentType
		 * @param {orion.textview.TextView} textView
		 * @param {orion.textview.AnnotationModel} annotationModel
		 * @param {String} [fileName] <i>Deprecated.</i> For backwards compatibility only, service-contributed highlighters
		 * will be checked against the file extension instead of contentType.
		 * @returns {dojo.Deferred} A promise that is resolved when this highlighter has been set up.
		 */
		setup: function(fileContentType, textView, annotationModel, fileName) {
			if (this.styler) {
				if (this.styler.destroy) {
					this.styler.destroy();
				}
				this.styler = null;
			}
			var self = this;
			return createStyler(this.serviceRegistry, this.serviceRegistry.getService("orion.file.contenttypes"),
				fileContentType, textView, annotationModel, fileName).then(
					function(styler) {
						self.styler = styler;
						return styler;
					});
		},
		getStyler: function() {
			return this.styler;
		}
	};
	return {
		createStyler: createStyler,
		SyntaxHighlighter: SyntaxHighlighter
	};
});