/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 * 	IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define window document*/

define(["require", "orion/browserCompatibility", "orion/bootstrap", "orion/xhr", "orion/Deferred", "dockerTerm/term"],

function(require, mBrowserCompatibility, mBootstrap, xhr, Deferred, terminal) {
	var pluginRegistry, serviceRegistry, preferences;

	var connected = false;

	var docker = {
		connect: function() {
			return xhr("POST", "/docker/connect", { //$NON-NLS-1$ //$NON-NLS-0$
				headers: {
					"Orion-Version": "1", //$NON-NLS-1$ //$NON-NLS-0$
				},
				timeout: 15000
			});
		},
		disconnect: function() {
			return xhr("POST", "/docker/disconnect", { //$NON-NLS-1$ //$NON-NLS-0$
				headers: {
					"Orion-Version": "1", //$NON-NLS-1$ //$NON-NLS-0$
				},
				timeout: 15000
			});
		},
		send: function(text) {
			return xhr("POST", "/docker/send", { //$NON-NLS-1$ //$NON-NLS-0$
				headers: {
					"Orion-Version": "1", //$NON-NLS-1$ //$NON-NLS-0$
					"Content-Type": "application/json; charset=UTF-8" //$NON-NLS-1$ //$NON-NLS-0$
				},
				data: JSON.stringify({
					"text": text
				}),
				timeout: 15000,
				responseType: "text",
				handleAs: "json" //$NON-NLS-0$
			});
		}
	};

	function startScreen(term) {
		term.writeln("Orion Terminal");
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth() + 1; //January is 0!
		var yyyy = today.getFullYear();
		if (dd < 10) {
			dd = '0' + dd;
		};
		if (mm < 10) {
			mm = '0' + mm;
		};
		term.writeln(mm + '/' + dd + '/' + yyyy);
		term.writeln("                                      ,,,,");
		term.writeln("                                     ,,,,,,");
		term.writeln("                                    .,,,,,,,");
		term.writeln("                                    ,,,,,,,,");
		term.writeln("                                    ,,,,,,,,");
		term.writeln("                                    .,,,,,,:");
		term.writeln("             iitii                   ,,,,,,");
		term.writeln("           ii:   ti;                  .,,:");
		term.writeln("           i      ;i");
		term.writeln("          ii       ii iii   it   ,,,    ii   ii");
		term.writeln("          ii       ii i ;i  it  ,,,,,,  ii   ii");
		term.writeln("          ii       ii i  i  it ,,,,,,,  iti  ii");
		term.writeln("          ti       it i ti  it ,,,,,,,, iiii ii");
		term.writeln("          .i       i  iii   it ,,,,,,,, ii tiii");
		term.writeln("           it     tt  i ii  it ,,,,,,,  ii  iii");
		term.writeln("            ti   it   i ii  it  ,,,,,,  ii  ,ii");
		term.writeln("             tiiit    i  it it   ,,,,   ii   ii");
		term.writeln("                                                  ");
		term.writeln("                            ,,,");
		term.writeln("                          ,,,,,,");
		term.writeln("                          ,,,,,,,");
		term.writeln("                         ,,,,,,,,");
		term.writeln("                         ,,,,,,,,");
		term.writeln("                          ,,,,,,,");
		term.writeln("                          ,,,,,,");
		term.writeln("                           :,,,");
		term.writeln("Hit Connect to begin");
	}

	mBootstrap.startup().then(function(core) {
		pluginRegistry = core.pluginRegistry;
		serviceRegistry = core.serviceRegistry;
		preferences = core.preferences;
		var output;

		var term = new Terminal({
			cols: 80,
			rows: 30,
			screenKeys: false
		});
		term.open(document.getElementById("terminal"));
		startScreen(term);
		term.on('data', function(data) {
			docker.send(data).then(function(result) {
				output = JSON.parse(result.responseText);
				term.write(output.result);
			});
		});

		var button = document.getElementById("dockerConnect"); //$NON-NLS-0$
		button.textContent = "Connect";
		button.addEventListener("click", function(e) {
			if (!connected) {
				//connect
				docker.connect().then(function(result) {
					button.textContent = "Disconnect";
					connected = !connected;
					term.reset();
					docker.send("\n").then(function(result) {
						output = JSON.parse(result.responseText);
						term.write(output.result);
					});
				}, function(error) {
					window.console.log(error);
				});
			} else {
				docker.disconnect().then(function(result) {
					button.textContent = "Connect";
					connected = !connected;
					term.reset();
					startScreen(term);
				}, function(error) {
					window.console.log(error);
				});
			}

		});
	});
});