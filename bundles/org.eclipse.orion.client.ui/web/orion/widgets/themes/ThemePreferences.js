/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:  IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/

define(['orion/Deferred'], function(Deferred) {

	function ThemePreferences(preferences, themeData) {
		this._preferences = preferences;
		this._themeData = themeData;
		var themeInfo = themeData.getThemeStorageInfo();
		this._themeVersion = themeInfo.version;
		var that = this;
		var storageKey = preferences.listenForChangedSettings(themeInfo.storage, 2, function(e) {
			if (e.key === storageKey) {
				Deferred.when(that._themePreferences, function(prefs) {
					// Need to sync because the memory cached is out of date.
					prefs.sync().then(function() { that.apply(); });
				});
			}
		});
		this._themePreferences = this._preferences.getPreferences(themeInfo.storage, 2);
	}

	ThemePreferences.prototype = /** @lends orion.editor.ThemePreferences.prototype */ {
		_initialize: function(themeInfo, themeData, prefs) {
			var styles, selected;
			if (this._themeVersion === undefined || prefs.get('version') === this._themeVersion) { //$NON-NLS-0$
				// Version matches (or ThemeData hasn't provided an expected version). Trust prefs
				styles = prefs.get(themeInfo.styleset);
				selected = prefs.get('selected'); //$NON-NLS-0$
				if (selected) {
					selected = JSON.parse(selected);
				}
			} else {
				// Stale theme prefs. Overwrite everything
				styles = null;
				selected = null;
			}

			if (!styles){
				styles = themeData.getStyles();
				prefs.put(themeInfo.styleset, JSON.stringify(styles));
			}
			if (!selected || selected[themeInfo.selectedKey] === undefined) {
				selected = selected || {};
				selected[themeInfo.selectedKey] = themeInfo.defaultTheme;
				prefs.put('selected', JSON.stringify(selected)); //$NON-NLS-0$
			}
			// prefs have now been updated
			prefs.put('version', this._themeVersion); //$NON-NLS-0$
		},
		_convertThemeStylesToHierarchicalFormat: function(styles) {
			return {
				name: styles.name,
				className: styles.name,
				styles: {
					/* top-level properties */
					backgroundColor: styles.background,
					color: styles.text,
					fontFamily: styles.fontFamily,
					fontSize: styles.fontSize,

					/* from textview.css */
					textviewRightRuler: {
						borderLeft: "1px solid " + styles.annotationRuler //$NON-NLS-0$
					},
					textviewLeftRuler: {
						borderRight: "1px solid " + styles.annotationRuler //$NON-NLS-0$
					},

					/* from rulers.css */
					ruler: {
						backgroundColor: styles.annotationRuler,
						overview: {
							backgroundColor: styles.overviewRuler
						}
					},
					rulerLines: {
						even: {
							color: styles.lineNumberEven
						},
						odd: {
							color: styles.lineNumberOdd
						}
					},

					/* from annotations.css */
					annotationLine: {
						currentLine: {
							backgroundColor: styles.currentLine
						}
					},

					/* from textstyler.css */
					comment: {
						color: styles.comment
					},
					constant: {
						color: "blue" //$NON-NLS-0$
					},
					entity: {
						name: {
							color: "#98937B", //$NON-NLS-0$
							"function": { //$NON-NLS-0$
								fontWeight: "bold", //$NON-NLS-0$
								color: "#67BBB8" //$NON-NLS-0$
							}
						},
						other: {
							"attribute-name": { //$NON-NLS-0$
								color: styles.attribute
							}
						}
					},
					keyword: {
						control: {
							color: styles.keyword,
							fontWeight: "bold" //$NON-NLS-0$
						},
						operator: {
							color: styles.keyword,
							fontWeight: "bold" //$NON-NLS-0$
						},
						other: {
							documentation: {
								color: "#7F9FBF" //$NON-NLS-0$
							}
						}
					},
					markup: {
						bold: {
							fontWeight: "bold" //$NON-NLS-0$
						},
						heading: {
							color: "blue" //$NON-NLS-0$
						},
						italic: {
							fontStyle: "italic" //$NON-NLS-0$
						},
						list: {
							color: "#CC4C07" //$NON-NLS-0$
						},
						other: {
							separator: {
								color: "#00008F" //$NON-NLS-0$
							},
							strikethrough: {
								textDecoration: "line-through" //$NON-NLS-0$
							},
							table: {
								color: "#3C802C" //$NON-NLS-0$
							}
						},
						quote: {
							color: "#446FBD" //$NON-NLS-0$
						},
						raw: {
							fontFamily: "monospace" //$NON-NLS-0$
						},
						underline: {
							link: {
								textDecoration: "underline" //$NON-NLS-0$
							}
						}
					},
					meta: {
						documentation: {
							annotation: {
								color: "#7F9FBF" //$NON-NLS-0$
							},
							tag: {
								color: "#7F7F9F" //$NON-NLS-0$
							}
						},
						tag: {
							color: styles.tag
						}
					},
					string: {
						color: styles.string
					},
					support: {
						type: {
							propertyName: {
								color: "#7F0055" //$NON-NLS-0$
							}
						}
					},
					variable: {
						language: {
							color: "#7F0055", //$NON-NLS-0$
							fontWeight: "bold" //$NON-NLS-0$
						},
						other: {
							color: "#E038AD" //$NON-NLS-0$
						},
						parameter: {
							color: "#D1416F" //$NON-NLS-0$
						}
					}
				}
			};
		},
		apply: function() {
			this.setTheme();
		},
		getTheme: function(callback) {
			var themeData = this._themeData;
			var themeInfo = themeData.getThemeStorageInfo();
			Deferred.when(this._themePreferences, function(prefs) {
				this._initialize(themeInfo, themeData, prefs);
				var selected = JSON.parse(prefs.get('selected')); //$NON-NLS-0$
				var styles = JSON.parse(prefs.get(themeInfo.styleset)), style;
				if (styles) {
					/*
					 * Convert the read theme info into the new supported format if the
					 * old format is detected.
					 */
					if (styles.length && styles[0].keyword) { /* indicates old format */
						for (var i = 0; i < styles.length; i++) {
							styles[i] = this._convertThemeStylesToHierarchicalFormat(styles[i]);
						}
					}
					for (i = 0; i < styles.length; i++) {
						if (styles[i].name === selected[themeInfo.selectedKey]) {
							style = styles[i];
							break;
						}
					}
				}
				callback({
					style: style,
					styles: styles
				});
			}.bind(this));
		},
		setTheme: function(name, styles) {
			var themeData = this._themeData;
			var themeInfo = themeData.getThemeStorageInfo();
			Deferred.when(this._themePreferences, function(prefs) {
				this._initialize(themeInfo, themeData, prefs);
				var selected = JSON.parse(prefs.get('selected')); //$NON-NLS-0$
				if (!name) {
					name = selected[themeInfo.selectedKey];
				}
				selected[themeInfo.selectedKey] = name;
				prefs.put('selected', JSON.stringify(selected)); //$NON-NLS-0$
				if (styles) {
					prefs.put(themeInfo.styleset, JSON.stringify(styles));
				} else {
					styles = JSON.parse(prefs.get(themeInfo.styleset));
				}
				for (var i = 0; i <styles.length; i++) {
					if (styles[i].name === selected[themeInfo.selectedKey]) {
						themeData.processSettings(styles[i]);
						break;
					}
				}
				prefs.put('version', this._themeVersion); //$NON-NLS-0$
			}.bind(this));
		},
		setFontSize: function(size) {
			var themeData = this._themeData;
			var themeInfo = themeData.getThemeStorageInfo();
			Deferred.when(this._themePreferences, function(prefs) {
				this._initialize(themeInfo, themeData, prefs);
				var selected = JSON.parse(prefs.get('selected')); //$NON-NLS-0$
				var styles = JSON.parse(prefs.get(themeInfo.styleset)), style;
				if (styles) {
					for( var s = 0; s < styles.length; s++ ){
						styles[s].styles.fontSize = size;
						if( styles[s].name ===  selected[themeInfo.selectedKey] ){
							style = styles[s];
						}
					}
				}
				prefs.put(themeInfo.styleset , JSON.stringify(styles));
				themeData.processSettings(style);
			}.bind(this));
		}
	};

	return{
		ThemePreferences: ThemePreferences
	};
});