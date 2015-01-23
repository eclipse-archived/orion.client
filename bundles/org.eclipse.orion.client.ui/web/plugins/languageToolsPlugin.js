/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define([
	'orion/plugin',
	'plugins/languages/arduino/arduinoPlugin',
	'plugins/languages/c/cPlugin',
	'plugins/languages/cpp/cppPlugin',
	'plugins/languages/csharp/csharpPlugin',
	'plugins/languages/docker/dockerPlugin',
	'plugins/languages/erlang/erlangPlugin',
	'plugins/languages/go/goPlugin',
	'plugins/languages/haml/hamlPlugin',
	'plugins/languages/java/javaPlugin',
	'plugins/languages/lua/luaPlugin',
	'plugins/languages/markdown/markdownPlugin',
	'plugins/languages/objectiveC/objectiveCPlugin',
	'plugins/languages/php/phpPlugin',
	'plugins/languages/python/pythonPlugin',
	'plugins/languages/ruby/rubyPlugin',
	'plugins/languages/swift/swiftPlugin',
	'plugins/languages/vb/vbPlugin',
	'plugins/languages/xml/xmlPlugin',
	'plugins/languages/xquery/xqueryPlugin',
	'plugins/languages/yaml/yamlPlugin'], function(
		PluginProvider, mArduinoPlugin, mCPlugin, mCppPlugin, mCSharpPlugin, mDockerfilePlugin, mErlangPlugin, mGoPlugin, mHamlPlugin, mJavaPlugin, mLuaPlugin,
		mMarkdownPlugin, mObjectiveCPlugin, mPhpPlugin, mPythonPlugin, mRubyPlugin, mSwiftPlugin, mVbPlugin, mXmlPlugin, mXQueryPlugin, mYamlPlugin) {

	var languagePlugins = [
		mArduinoPlugin, mCPlugin, mCppPlugin, mCSharpPlugin, mDockerfilePlugin, mErlangPlugin, mGoPlugin, mHamlPlugin, mJavaPlugin, mLuaPlugin,
		mMarkdownPlugin, mObjectiveCPlugin, mPhpPlugin, mPythonPlugin, mRubyPlugin, mSwiftPlugin, mVbPlugin, mXmlPlugin, mXQueryPlugin, mYamlPlugin
	];

	var headers = {
		name: "Orion Languages Tool Support",
		version: "1.0",
		description: "This plugin provides tooling for languages that are not included in other core Orion plugins."
	};
	var pluginProvider = new PluginProvider(headers);
	languagePlugins.forEach(function(plugin) {
		plugin.registerServiceProviders(pluginProvider);
	});
	pluginProvider.connect();
});
