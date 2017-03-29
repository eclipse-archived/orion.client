/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/

define([
		'orion/editor/textTheme',
		'orion/widgets/themes/ThemeVersion',
		'orion/Deferred',
		'orion/objects',

], function(mTextTheme, THEMES_VERSION, Deferred, objects) {

	// *******************************************************************************
	//
	// If you change any styles in this file, you must increment the version number
	// in ThemeVersion.js.
	//
	// *******************************************************************************

		/* Synchronizing colors and styles for HTML, CSS and JS files like this ...
	
			Using Prospecto as an example:
			
			-----------------------------------------------
							CSS         HTML        JS
			-----------------------------------------------
			ORANGE          Class       Tag         Keyword
			darkSlateGray   Text        Text        Text
			darkSeaGreen    Comments    Comments    Comments
			cornFlowerblue  String      String      String
			----------------------------------------------- */
		
		var defaultFont = '"Consolas", "Monaco", "Vera Mono", monospace'; //$NON-NLS-0$
		var defaultFontSize = '12px'; //$NON-NLS-0$
		var prospecto, darker, ceol;

		function ThemeData() {

			this.styles = [];
			
			prospecto = {
				"className": "prospecto",
				"name": "Prospecto",
				"styles": {
					"annotationLine": {
						"currentLine": {
							"backgroundColor": "#EAF2FE"
						}
					},
					"annotationRange": {
						"currentBracket": {
							"backgroundColor": "#ADFFAD"
						},
						"matchingBracket": {
							"backgroundColor": "#ADFFAD"
						},
						"matchingSearch": {
							"backgroundColor": "#c3e1ff",
							"currentSearch": {
								"backgroundColor": "#53d1ff"
							}
						},
						"writeOccurrence": {
							"backgroundColor": "#ECD099"
						}
					},
					"backgroundColor": "#ffffff",
					"color": "#151515",
					"comment": {
						"color": "#357d21"
					},
					"constant": {
						"color": "#9932CC",
						"numeric": {
							"color": "#9932CC",
							"hex": {
								"color": "#9932CC"
							}
						}
					},
					"entity": {
						"name": {
							"color": "#7D7755",
							"function": {
								"color": "#007b78",
								"fontWeight": "bold"
							}
						},
						"other": {
							"attribute-name": {
								"color": "#5F9EA0"
							}
						}
					},
					"fontFamily": defaultFont,
					"fontSize": defaultFontSize,
					"keyword": {
						"control": {
							"color": "#c04600",
							"fontWeight": "bold"
						},
						"operator": {
							"color": "#9F4177",
							"fontWeight": "bold"
						},
						"other": {
							"documentation": {
								"color": "#37739f",
								"task": {
									"color": "#006DD4"
								}
							}
						}
					},
					"markup": {
						"bold": {
							"fontWeight": "bold"
						},
						"heading": {
							"color": "#0000FF"
						},
						"italic": {
							"fontStyle": "italic"
						},
						"list": {
							"color": "#c04600"
						},
						"other": {
							"separator": {
								"color": "#00008F"
							},
							"strikethrough": {
								"textDecoration": "line-through"
							},
							"table": {
								"color": "#357d21"
							}
						},
						"quote": {
							"color": "#314dce"
						},
						"raw": {
							"fontFamily": "monospace",
							"html": {
								"backgroundColor": "#E4F7EF"
							}
						},
						"underline": {
							"link": {
								"textDecoration": "underline"
							}
						}
					},
					"meta": {
						"documentation": {
							"annotation": {
								"color": "#37739f"
							},
							"tag": {
								"color": "#7F7F9F"
							}
						},
						"preprocessor": {
							"color": "#A4A4A4"
						},
						"tag": {
							"color": "#c04600",
							"attribute": {
								"color": "#58727e"
							}
						}
					},
					"punctuation": {
						"operator": {
							"color":"#CD2B65"
						}
					},
					"ruler": {
						"annotations": {
							"backgroundColor": "#ffffff"
						},
						"backgroundColor": "#ffffff",
						"overview": {
							"backgroundColor": "#ffffff"
						}
					},
					"rulerLines": {
						"color": "#767676"
					},
					"string": {
						"color": "#314dce",
						"interpolated": {
							"color": "#151515"
						}
					},
					"support": {
						"type": {
							"propertyName": {
								"color": "#9F4177"
							}
						}
					},
					"textviewContent ::-moz-selection": {
						"backgroundColor": "rgba(180,213,255,0.99)"
					},
					"textviewContent ::selection": {
						"backgroundColor": "rgba(180,213,255,0.99)"
					},
					"textviewLeftRuler": {
						"borderColor": "#ffffff"
					},
					"textviewRightRuler": {
						"borderColor": "#ffffff"
					},
					"textviewSelection": {
						"backgroundColor": "rgba(180,213,255,0.99)"
					},
					"textviewSelectionUnfocused": {
						"backgroundColor": "rgba(180,213,255,0.99)"
					},
					"variable": {
						"language": {
							"color": "#7F0055",
							"fontWeight": "bold"
						},
						"other": {
							"color": "#DB0FA6"
						},
						"parameter": {
							"color": "#CD2B65"
						}
					}
				}
			};
			this.styles.push(prospecto);

			darker = {
				"className": "darker",
				"name": "Dark",
				"styles": {
					"fontFamily": defaultFont,
					"fontSize": defaultFontSize,
					"annotationLine": {
						"currentLine": {
							"backgroundColor": "#3B4B53"
						}
					},
					"annotationRange": {
						"currentBracket": {
							"backgroundColor": "#006E00"
						},
						"currentSearch": {
							"backgroundColor": "#5d5d5d"
						},
						"matchingBracket": {
							"backgroundColor": "#006E00"
						},
						"matchingSearch": {
							"backgroundColor": "#363636",
							"currentSearch": {
								"backgroundColor": "#465e47"
							}
						},
						"writeOccurrence": {
							"backgroundColor": "#093f59"
						},
						"selectedLinkedGroup": {
							"backgroundColor": "rgb(16,106,91)"
						},
						"currentLinkedGroup": {
							"backgroundColor": "rgba(16,106,91,0.8)"
						}
					},
					"backgroundColor": "#1A252D",
					"color": "#07ADCF",
					"comment": {
						"color": "#93A2AA",
					},
					"constant": {
						"color": "#F47D64",
					},
					"entity": {
						"name": {
							"color": "#98937B",
							"function": {
								"color": "#67BBB8",
								"fontWeight": "bold"
							}
						},
						"other": {
							"attribute-name": {
								"color": "#01B199"
							}
						}
					},
					"keyword": {
						"control": {
							"color": "#FCD600",
							"fontWeight": "bold"
						},
						"operator": {
							"color": "#FFFFFF",
							"fontWeight": "bold"
						},
						"other": {
							"documentation": {
								"color": "#7F9FBF",
								"task": {
									"color": "#8db6f1"
								}
							}
						}
					},
					"markup": {
						"bold": {
							"fontWeight": "bold"
						},
						"heading": {
							"color": "#91c23d"
						},
						"italic": {
							"fontStyle": "italic"
						},
						"list": {
							"color": "#CC4C07"
						},
						"other": {
							"separator": {
								"color": "#e8d075"
							},
							"strikethrough": {
								"textDecoration": "line-through"
							},
							"table": {
								"color": "#3C802C"
							}
						},
						"quote": {
							"color": "#446FBD"
						},
						"raw": {
							"fontFamily": "monospace",
							"html": {
								"backgroundColor": "#696969",
								"color": "white"
							}
						},
						"underline": {
							"link": {
								"textDecoration": "underline"
							}
						}
					},
					"meta": {
						"documentation": {
							"annotation": {
								"color": "#7F9FBF"
							},
							"tag": {
								"color": "#7F7F9F"
							}
						},
						"preprocessor": {
							"color": "#A4A4A4"
						},
						"tag": {
							"color": "#8781BD"
						}
					},
					"punctuation": {
						"operator": {
							"color":"#FF8C00"
						}
					},
					"ruler": {
						"backgroundColor": "#1A252D"
					},
					"rulerLines": {
						"color": "#93A2AA",
					},
					"string": {
						"color": "#01B199",
						"interpolated": {
							"color": "#dadada"
						}
					},
					"support": {
						"type": {
							"propertyName": {
								"color": "#FFFFFF"
							}
						}
					},
					"textviewContent ::-moz-selection": {
						"backgroundColor": "rgba(16,106,91,0.99)"
					},
					"textviewContent ::selection": {
						"backgroundColor": "rgba(16,106,91,0.99)"
					},
					"textviewLeftRuler": {
						"borderRight": "1px solid #424C53"
					},
					"textviewRightRuler": {
						"borderLeft": "1px solid #424C53"
					},
					"textviewSelection": {
						"backgroundColor": "rgba(16,106,91,0.99)"
					},
					"textviewSelectionUnfocused": {
						"backgroundColor": "rgba(16,106,91,0.99)"
					},
					"variable": {
						"language": {
							"color": "#8781BD",
							"fontWeight": "bold"
						},
						"other": {
							"color": "#E038AD"
						},
						"parameter": {
							"color": "#D1416F"
						}
					}
				}
			};
			this.styles.push(darker);

			ceol = {
				"className": "ceol",
				"name": "Ceol",
				"styles": {
					"annotationLine": {
						"currentLine": {
							"backgroundColor": "#152935"
						}
					},
					"annotationRange": {
						"currentBracket": {
							"backgroundColor": "#4178be"
						},
						"matchingBracket": {
							"backgroundColor": "#4178be"
						},
						"matchingSearch": {
							"backgroundColor": "#A6266E",
							"currentSearch": {
								"backgroundColor": "#008571"
							}
						},
						"writeOccurrence": {
							"backgroundColor": "#ffff00"
						}
					},
					"backgroundColor": "#152935",
					"color": "#ffa5b4",
					"comment": {
						"color": "#406d89"
					},
					"constant": {
						"color": "#7cc7ff",
						"numeric": {
							"color": "#71c9ff",
							"hex": {
								"color": "#71c9ff"
							}
						}
					},
					"entity": {
						"name": {
							"color": "#7D7755",
							"function": {
								"color": "#67BBB8",
								"fontWeight": "bold"
							}
						},
						"other": {
							"attribute-name": {
								"color": "#5F9EA0"
							}
						}
					},
					"fontFamily": defaultFont,
					"fontSize": defaultFontSize,
					"keyword": {
						"control": {
							"color": "#a7fae6",
							"fontWeight": "bold"
						},
						"operator": {
							"color": "#a7fae6",
							"fontWeight": "bold"
						},
						"other": {
							"documentation": {
								"color": "#7F9FBF",
								"task": {
									"color": "#5595ff"
								}
							}
						}
					},
					"markup": {
						"bold": {
							"fontWeight": "bold"
						},
						"heading": {
							"color": "#0000FF"
						},
						"italic": {
							"fontStyle": "italic"
						},
						"list": {
							"color": "#CC4C07"
						},
						"other": {
							"separator": {
								"color": "#00008F"
							},
							"strikethrough": {
								"textDecoration": "line-through"
							},
							"table": {
								"color": "#3C802C"
							}
						},
						"quote": {
							"color": "#446FBD"
						},
						"raw": {
							"fontFamily": "monospace",
							"html": {
								"backgroundColor": "#E4F7EF"
							}
						},
						"underline": {
							"link": {
								"textDecoration": "underline"
							}
						}
					},
					"meta": {
						"documentation": {
							"annotation": {
								"color": "#7F9FBF"
							},
							"tag": {
								"color": "#7F7F9F"
							}
						},
						"preprocessor": {
							"color": "#A4A4A4"
						},
						"tag": {
							"attribute": {
								"color": "#eed2ff"
							},
							"color": "#a7fae7"
						}
					},
					"punctuation": {
						"operator": {
							"color": "#ba8ff7"
						}
					},
					"ruler": {
						"annotations": {
							"backgroundColor": "#112935"
						},
						"backgroundColor": "#112935",
						"overview": {
							"backgroundColor": "#112935"
						}
					},
					"rulerLines": {
						"color": "#396f8a",
						"even": {
							"color": "#396f8a"
						},
						"odd": {
							"color": "#396f8a"
						}
					},
					"string": {
						"color": "#61cdff",
						"interpolated": {
							"color": "#151515"
						}
					},
					"support": {
						"type": {
							"propertyName": {
								"color": "#a7fae7"
							}
						}
					},
					"textviewContent ::-moz-selection": {
						"backgroundColor": "rgba(50,92,128,0.99)"
					},
					"textviewContent ::selection": {
						"backgroundColor": "rgba(50,92,128,0.99)"
					},
					"textviewLeftRuler": {
						"borderColor": "#112935"
					},
					"textviewRightRuler": {
						"borderColor": "#112935"
					},
					"textviewSelection": {
						"backgroundColor": "rgba(50,92,128,0.99)"
					},
					"textviewSelectionUnfocused": {
						"backgroundColor": "rgba(50,92,128,0.99)"
					},
					"variable": {
						"language": {
							"color": "#a2f9e7",
							"fontWeight": "bold"
						},
						"other": {
							"color": "#DB0FA6"
						},
						"parameter": {
							"color": "#a2f9e7"
						}
					}
				}
			};
			this.styles.push(ceol);
		}
		
		function getStyles(){
			var d = new Deferred();
			d.resolve(this.styles);
			return d;
		}
		
		ThemeData.prototype.styles = [];
		ThemeData.prototype.getStyles = getStyles;

		function getBaseTheme(options) {
			/* return a copy of the appropriate theme definition */
			return JSON.parse(JSON.stringify((options || {}).dark ? darker : prospecto));
		}
		ThemeData.prototype.getBaseTheme = getBaseTheme;
		
		function getDefaultTheme() {
			var d = new Deferred();
			var useLightTheme = document.body.classList.contains("lightPage");
			var defaultTheme = useLightTheme ? 'Prospecto' : 'Dark';
			d.resolve(defaultTheme);
			return d;
		}
		ThemeData.prototype.getDefaultTheme = getDefaultTheme;
		
		function getProtectedThemes() {
			var d = new Deferred();
			d.resolve(["Prospecto", "Dark"]);
			return d;
		}

		ThemeData.prototype.getProtectedThemes = getProtectedThemes;

		var fontSettable = true;
		
		ThemeData.prototype.fontSettable = fontSettable;
		
		function getThemeVersion() {
			var d = new Deferred();
			d.resolve(THEMES_VERSION);
			return d;
		}
		
		ThemeData.prototype.getThemeVersion = getThemeVersion;
		
		function getThemeStorageInfo(){	
			var useLightTheme = document.body.classList.contains("lightPage");
			return {
				storage: '/themes', //$NON-NLS-0$
				styleset: 'editorstyles', //$NON-NLS-0$
				selectedKey: 'editorSelected', //$NON-NLS-0$
			}; 
		}
		ThemeData.prototype.getThemeStorageInfo = getThemeStorageInfo;

		function processSettings(settings) {
			var themeClass = "editorTheme"; //$NON-NLS-0$
			var theme = mTextTheme.TextTheme.getTheme();
			theme.setThemeClass(themeClass, theme.buildStyleSheet(themeClass, settings));
		}
		ThemeData.prototype.processSettings = processSettings;

		return {
			ThemeData: ThemeData,
			getStyles: getStyles,
			getBaseTheme: getBaseTheme
		};
	}
);