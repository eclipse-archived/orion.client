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
		'i18n!orion/settings/nls/messages',
		'orion/editor/textTheme',
		'orion/widgets/themes/ThemeVersion'
], function(messages, mTextTheme, THEMES_VERSION) {

	// *******************************************************************************
	//
	// If you change any styles in this file, you must increment the version number
	// in ThemeVersion.js.
	//
	// *******************************************************************************

		/* Synchronizing colors and styles for HTML, CSS and JS files like this ...
	
			Using Prospecto as an example:
			
			-----------------------------------------------
							CSS			HTML		JS
			-----------------------------------------------
			ORANGE			Class		Tag			Keyword
			darkSlateGray	Text		Text		Text
			darkSeaGreen	Comments	Comments	Comments
			cornFlowerblue	String		String		String
			----------------------------------------------- */

		function StyleSet(){
		
		}
		
		var defaultFont = '"Consolas", "Monaco", "Vera Mono", monospace';
		var defaultFontSize = '12px';

		function ThemeData() {

		this.styles = [];
		
		var seti = {
		   "name":"Seti",  //$NON-NLS-1 //$NON-NLS-0$ 
		   "className":"seti", //$NON-NLS-1 //$NON-NLS-0$ 
		   "styles":{ //$NON-NLS-0$
		      "annotationRange":{ //$NON-NLS-0$
		          "matchingSearch":{ //$NON-NLS-0$
		              "backgroundColor":"#2B333C" //$NON-NLS-1 //$NON-NLS-0$ 
		          },
		          "currentSearch":{ //$NON-NLS-0$
		              "backgroundColor":"#2B333C", //$NON-NLS-1 //$NON-NLS-0$ 
		              "text-decoration":"underline" //$NON-NLS-1 //$NON-NLS-0$ 
		          }
		      },
		      "backgroundColor":"#151718", //$NON-NLS-1 //$NON-NLS-0$ 
		      "color":"#d4d7d6", //$NON-NLS-1 //$NON-NLS-0$ 
		      "fontFamily":"\"Consolas\", \"Monaco\", \"Vera Mono\", monospace", //$NON-NLS-1 //$NON-NLS-0$ 
		      "fontSize":"16px", //$NON-NLS-1 //$NON-NLS-0$ 
		      "textviewRightRuler":{ //$NON-NLS-0$
		         "borderLeft":"1px solid #0e1112" //$NON-NLS-1 //$NON-NLS-0$ 
		      },
		      "textviewLeftRuler":{ //$NON-NLS-0$
		         "borderRight":"1px solid #0e1112" //$NON-NLS-1 //$NON-NLS-0$ 
		      },
		      "ruler":{ //$NON-NLS-0$
		         "backgroundColor":"#0e1112", //$NON-NLS-1 //$NON-NLS-0$ 
		         "overview":{ //$NON-NLS-0$
		            "backgroundColor":"#0e1112" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "annotations":{ //$NON-NLS-0$
		            "backgroundColor":"#0e1112" //$NON-NLS-1 //$NON-NLS-0$ 
		         }
		      },
		      "rulerLines":{ //$NON-NLS-0$
		         "color":"#404b53", //$NON-NLS-1 //$NON-NLS-0$ 
		         "odd":{ //$NON-NLS-0$
		            "color":"#404b53" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "even":{ //$NON-NLS-0$
		            "color":"#404b53" //$NON-NLS-1 //$NON-NLS-0$ 
		         }
		      },
		      "annotationLine":{ //$NON-NLS-0$
		         "currentLine":{ //$NON-NLS-0$
		            "backgroundColor":"#101112" //$NON-NLS-1 //$NON-NLS-0$ 
		         }
		      },
		      "comment":{ //$NON-NLS-0$
		         "color":"#41535b", //$NON-NLS-1 //$NON-NLS-0$ 
		         "block":{ //$NON-NLS-0$
		            "color":"#41535b" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "line":{ //$NON-NLS-0$
		            "color":"#41535b" //$NON-NLS-1 //$NON-NLS-0$ 
		         }
		      },
		      "constant":{ //$NON-NLS-0$
		         "color":"#cd3f45", //$NON-NLS-1 //$NON-NLS-0$ 
		         "numeric":{ //$NON-NLS-0$
		            "color":"#cd3f45", //$NON-NLS-1 //$NON-NLS-0$ 
		            "hex":{ //$NON-NLS-0$
		               "color":"#cd3f45" //$NON-NLS-1 //$NON-NLS-0$ 
		            }
		         }
		      },
		      "entity":{ //$NON-NLS-0$
		         "name":{ //$NON-NLS-0$
		            "color":"#55b5db", //$NON-NLS-1 //$NON-NLS-0$ 
		            "function":{ //$NON-NLS-0$
		               "fontWeight":"normal", //$NON-NLS-1 //$NON-NLS-0$ 
		               "color":"#55b5db" //$NON-NLS-1 //$NON-NLS-0$ 
		            }
		         },
		         "other":{ //$NON-NLS-0$
		            "attribute-name":{ //$NON-NLS-0$
		               "color":"cadetBlue" //$NON-NLS-1 //$NON-NLS-0$ 
		            }
		         }
		      },
		      "keyword":{ //$NON-NLS-0$
		         "control":{ //$NON-NLS-0$
		            "color":"#9fca56", //$NON-NLS-1 //$NON-NLS-0$ 
		            "fontWeight":"normal" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "operator":{ //$NON-NLS-0$
		            "color":"#e6cd69", //$NON-NLS-1 //$NON-NLS-0$ 
		            "fontWeight":"normal" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "other":{ //$NON-NLS-0$
		            "documentation":{ //$NON-NLS-0$
		               "color":"#7F9FBF" //$NON-NLS-1 //$NON-NLS-0$ 
		            }
		         }
		      },
		      "markup":{ //$NON-NLS-0$
		         "bold":{ //$NON-NLS-0$
		            "fontWeight":"bold" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "heading":{ //$NON-NLS-0$
		            "color":"blue" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "italic":{ //$NON-NLS-0$
		            "fontStyle":"italic" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "list":{ //$NON-NLS-0$
		            "color":"#CC4C07" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "other":{ //$NON-NLS-0$
		            "separator":{ //$NON-NLS-0$
		               "color":"#00008F" //$NON-NLS-1 //$NON-NLS-0$ 
		            },
		            "strikethrough":{ //$NON-NLS-0$
		               "textDecoration":"line-through" //$NON-NLS-1 //$NON-NLS-0$ 
		            },
		            "table":{ //$NON-NLS-0$
		               "color":"#3C802C" //$NON-NLS-1 //$NON-NLS-0$ 
		            }
		         },
		         "quote":{ //$NON-NLS-0$
		            "color":"#55b5db" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "raw":{ //$NON-NLS-0$
		            "fontFamily":"monospace" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "underline":{ //$NON-NLS-0$
		            "link":{ //$NON-NLS-0$
		               "textDecoration":"underline" //$NON-NLS-1 //$NON-NLS-0$ 
		            }
		         }
		      },
		      "meta":{ //$NON-NLS-0$
		         "documentation":{ //$NON-NLS-0$
		            "annotation":{ //$NON-NLS-0$
		               "color":"#7F9FBF" //$NON-NLS-1 //$NON-NLS-0$ 
		            },
		            "tag":{ //$NON-NLS-0$
		               "color":"#7F7F9F" //$NON-NLS-1 //$NON-NLS-0$ 
		            }
		         },
		         "tag":{ //$NON-NLS-0$
		            "color":"#CC4C07" //$NON-NLS-1 //$NON-NLS-0$ 
		         }
		      },
		      "string":{ //$NON-NLS-0$
		         "color":"#55b5db", //$NON-NLS-1 //$NON-NLS-0$ 
		         "quoted":{ //$NON-NLS-0$
		            "single":{ //$NON-NLS-0$
		               "color":"#55b5db" //$NON-NLS-1 //$NON-NLS-0$ 
		            },
		            "double":{ //$NON-NLS-0$
		               "color":"#55b5db" //$NON-NLS-1 //$NON-NLS-0$ 
		            }
		         }
		      },
		      "support":{ //$NON-NLS-0$
		         "type":{ //$NON-NLS-0$
		            "propertyName":{ //$NON-NLS-0$
		               "color":"#9F4177" //$NON-NLS-1 //$NON-NLS-0$ 
		            }
		         }
		      },
		      "variable":{ //$NON-NLS-0$
		         "language":{ //$NON-NLS-0$
		            "color":"#9fca56", //$NON-NLS-1 //$NON-NLS-0$ 
		            "fontWeight":"normal" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "other":{ //$NON-NLS-0$
		            "color":"#E038AD" //$NON-NLS-1 //$NON-NLS-0$ 
		         },
		         "parameter":{ //$NON-NLS-0$
		            "color":"#55b5db" //$NON-NLS-1 //$NON-NLS-0$ 
		         }
		      }
		   }
		};
		this.styles.push(seti);

		var eclipse = {
			name: messages["eclipseThemeName"],
			className: "eclipse", //$NON-NLS-0$
			styles: {
				/* top-level properties */
				backgroundColor: "white", //$NON-NLS-0$
				color: "darkSlateGray", //$NON-NLS-0$
				fontFamily: defaultFont,
				fontSize: defaultFontSize,

				/* from textview.css */
				textviewRightRuler: {
					borderLeft: "1px solid #DDDDDD", //$NON-NLS-0$
				},
				textviewLeftRuler: {
					borderRight: "1px solid #DDDDDD" //$NON-NLS-0$
				},

				/* from rulers.css */
				ruler: {
					backgroundColor: "white" //$NON-NLS-0$
				},
				rulerLines: {
					color: "#444", //$NON-NLS-0$
				},

				/* from annotations.css */
				annotationLine: {
					currentLine: {
						backgroundColor: "#EAF2FE" //$NON-NLS-0$
					}
				},

				/* from textstyler.css */
				comment: {
					color: "green", //$NON-NLS-0$
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
							color: "cadetBlue" //$NON-NLS-0$
						}
					}
				},
				keyword: {
					control: {
						color: "#7F0055", //$NON-NLS-0$
						fontWeight: "bold" //$NON-NLS-0$
					},
					operator: {
						color: "#7F0055", //$NON-NLS-0$
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
						color: "darkorange" //$NON-NLS-0$
					}
				},
				string: {
					color: "blue" //$NON-NLS-0$
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
		this.styles.push(eclipse);

		var prospecto = {
			name: messages["prospectoThemeName"],
			className: "prospecto", //$NON-NLS-0$
			styles: {
				/* top-level properties */
				backgroundColor: "white", //$NON-NLS-0$
				color: "#333", //$NON-NLS-0$
				fontFamily: defaultFont,
				fontSize: defaultFontSize,

				/* from textview.css */
				textviewRightRuler: {
					borderLeft: "1px solid #EEEEEE", //$NON-NLS-0$
				},
				textviewLeftRuler: {
					borderRight: "1px solid #EEEEEE" //$NON-NLS-0$
				},

				/* from rulers.css */
				ruler: {
					backgroundColor: "white" //$NON-NLS-0$
				},
				rulerLines: {
					color: "#CCCCCC", //$NON-NLS-0$
				},

				/* from annotations.css */
				annotationLine: {
					currentLine: {
						backgroundColor: "#EAF2FE" //$NON-NLS-0$
					}
				},

				/* from textstyler.css */
				comment: {
					color: "#3C802C", //$NON-NLS-0$
				},
				constant: {
					color: "darkOrchid" //$NON-NLS-0$
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
							color: "cadetBlue" //$NON-NLS-0$
						}
					}
				},
				keyword: {
					control: {
						color: "#CC4C07", //$NON-NLS-0$
						fontWeight: "bold" //$NON-NLS-0$
					},
					operator: {
						color: "#9F4177", //$NON-NLS-0$
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
						color: "#CC4C07" //$NON-NLS-0$
					}
				},
				string: {
					color: "#446FBD" //$NON-NLS-0$
				},
				support: {
					type: {
						propertyName: {
							color: "#9F4177" //$NON-NLS-0$
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
		this.styles.push(prospecto);

		var darker = {
			name: messages["darkerThemeName"],
			className: "darker", //$NON-NLS-0$
			styles: {
				/* top-level properties */
				backgroundColor: "#272822", //$NON-NLS-0$
				color: "#F8F8F2", //$NON-NLS-0$
				fontFamily: defaultFont,
				fontSize: defaultFontSize,
				
				/* from textview.css */
				textviewRightRuler: {
					borderLeft: "1px solid #272822", //$NON-NLS-0$
				},
				textviewLeftRuler: {
					borderRight: "1px solid #272822" //$NON-NLS-0$
				},

				/* from rulers.css */
				ruler: {
					backgroundColor: "#272822" //$NON-NLS-0$
				},
				rulerLines: {
					color: "#999999", //$NON-NLS-0$
				},

				/* from annotations.css */
				annotationLine: {
					currentLine: {
						backgroundColor: "#32322A" //$NON-NLS-0$
					}
				},
				annotationRange: {
					writeOccurrence: {
						backgroundColor: "steelblue" //$NON-NLS-0$
					}
				},

				/* from textstyler.css */
				comment: {
					color: "#75715E", //$NON-NLS-0$
				},
				constant: {
					color: "#C48CFF" //$NON-NLS-0$
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
							color: "#CFBFAD" //$NON-NLS-0$
						}
					}
				},
				keyword: {
					control: {
						color: "orangered", //$NON-NLS-0$
						fontWeight: "bold" //$NON-NLS-0$
					},
					operator: {
						color: "#52E3F6", //$NON-NLS-0$
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
						color: "skyblue" //$NON-NLS-0$
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
						color: "greenyellow" //$NON-NLS-0$
					}
				},
				string: {
					color: "#F0E383" //$NON-NLS-0$
				},
				support: {
					type: {
						propertyName: {
							color: "#52E3F6" //$NON-NLS-0$
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
		this.styles.push(darker);

		var blue = {
			name: messages["blueThemeName"],
			className: "blue", //$NON-NLS-0$
			styles: {
				/* top-level properties */
				backgroundColor: "aliceBlue", //$NON-NLS-0$
				color: "navy", //$NON-NLS-0$
				fontFamily: defaultFont,
				fontSize: defaultFontSize,

				/* from textview.css */
				textviewRightRuler: {
					borderLeft: "1px solid white", //$NON-NLS-0$
				},
				textviewLeftRuler: {
					borderRight: "1px solid white" //$NON-NLS-0$
				},

				/* from rulers.css */
				ruler: {
					backgroundColor: "lavender" //$NON-NLS-0$
				},
				rulerLines: {
					color: "darkSlateGray", //$NON-NLS-0$
				},

				/* from annotations.css */
				annotationLine: {
					currentLine: {
						backgroundColor: "white" //$NON-NLS-0$
					}
				},

				/* from textstyler.css */
				comment: {
					color: "indigo", //$NON-NLS-0$
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
							color: "cadetBlue" //$NON-NLS-0$
						}
					}
				},
				keyword: {
					control: {
						color: "cornFlowerBlue", //$NON-NLS-0$
						fontWeight: "bold" //$NON-NLS-0$
					},
					operator: {
						color: "cornFlowerBlue", //$NON-NLS-0$
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
						color: "cornFlowerBlue" //$NON-NLS-0$
					}
				},
				string: {
					color: "cornFlowerBlue" //$NON-NLS-0$
				},
				support: {
					type: {
						propertyName: {
							color: "cornFlowerBlue" //$NON-NLS-0$
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
		this.styles.push(blue);

		var ambience = {
			name: messages["ambienceThemeName"],
			className: "ambience", //$NON-NLS-0$
			styles: {
				/* top-level properties */
				backgroundColor: "darkgrey", //$NON-NLS-0$
				color: "darkseagreen", //$NON-NLS-0$
				fontFamily: defaultFont,
				fontSize: defaultFontSize,

				/* from textview.css */
				textviewRightRuler: {
					borderLeft: "1px solid #BAA289", //$NON-NLS-0$
				},
				textviewLeftRuler: {
					borderRight: "1px solid #BAA289" //$NON-NLS-0$
				},

				/* from rulers.css */
				ruler: {
					backgroundColor: "#3D3D3D", //$NON-NLS-0$
					overview: {
						backgroundColor: "white" //$NON-NLS-0$
					}
				},
				rulerLines: {
					color: "black", //$NON-NLS-0$
				},

				/* from annotations.css */
				annotationLine: {
					currentLine: {
						backgroundColor: "lightcyan" //$NON-NLS-0$
					}
				},

				/* from textstyler.css */
				comment: {
					color: "mediumslateblue", //$NON-NLS-0$
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
							color: "cadetBlue" //$NON-NLS-0$
						}
					}
				},
				keyword: {
					control: {
						color: "cornFlowerBlue", //$NON-NLS-0$
						fontWeight: "bold" //$NON-NLS-0$
					},
					operator: {
						color: "cornFlowerBlue", //$NON-NLS-0$
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
						color: "cornFlowerBlue" //$NON-NLS-0$
					}
				},
				string: {
					color: "lightcoral" //$NON-NLS-0$
				},
				support: {
					type: {
						propertyName: {
							color: "cornFlowerBlue" //$NON-NLS-0$
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
		this.styles.push(ambience);

		var tierra = {
			name: messages["tierraThemeName"],
			className: "tierra", //$NON-NLS-0$
			styles: {
				/* top-level properties */
				backgroundColor: "lemonchiffon", //$NON-NLS-0$
				color: "#555555", //$NON-NLS-0$
				fontFamily: defaultFont,
				fontSize: defaultFontSize,

				/* from textview.css */
				textviewRightRuler: {
					borderLeft: "1px solid #BAA289", //$NON-NLS-0$
				},
				textviewLeftRuler: {
					borderRight: "1px solid #BAA289" //$NON-NLS-0$
				},

				/* from rulers.css */
				ruler: {
					backgroundColor: "moccasin" //$NON-NLS-0$
				},
				rulerLines: {
					color: "chocolate", //$NON-NLS-0$
				},

				/* from annotations.css */
				annotationLine: {
					currentLine: {
						backgroundColor: "#BAA289" //$NON-NLS-0$
					}
				},

				/* from textstyler.css */
				comment: {
					color: "darkseagreen", //$NON-NLS-0$
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
							color: "cadetBlue" //$NON-NLS-0$
						}
					}
				},
				keyword: {
					control: {
						color: "darkred", //$NON-NLS-0$
						fontWeight: "bold" //$NON-NLS-0$
					},
					operator: {
						color: "darkred", //$NON-NLS-0$
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
						color: "darkred" //$NON-NLS-0$
					}
				},
				string: {
					color: "orangered" //$NON-NLS-0$
				},
				support: {
					type: {
						propertyName: {
							color: "darkred" //$NON-NLS-0$
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
		this.styles.push(tierra);


		var nimbus = {
			name: messages["nimbusThemeName"],
			className: "nimbus", //$NON-NLS-0$
			styles: {
				/* top-level properties */
				backgroundColor: "#333333", //$NON-NLS-0$
				color: "#DDDDDD", //$NON-NLS-0$
				fontFamily: defaultFont,
				fontSize: defaultFontSize,

				/* from textview.css */
				textviewRightRuler: {
					borderLeft: "1px solid #3A3A3A", //$NON-NLS-0$
				},
				textviewLeftRuler: {
					borderRight: "1px solid #3A3A3A" //$NON-NLS-0$
				},

				/* from rulers.css */
				ruler: {
					backgroundColor: "#232323" //$NON-NLS-0$
				},
				rulerLines: {
					color: "#555555", //$NON-NLS-0$
				},

				/* from annotations.css */
				annotationLine: {
					currentLine: {
						backgroundColor: "dimgrey" //$NON-NLS-0$
					}
				},
				annotationRange: {
					writeOccurrence: {
						backgroundColor: "steelblue" //$NON-NLS-0$
					}
				},

				/* from textstyler.css */
				comment: {
					color: "darkseagreen", //$NON-NLS-0$
				},
				constant: {
					color: "#01B199" //$NON-NLS-0$
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
							color: "cadetBlue" //$NON-NLS-0$
						}
					}
				},
				keyword: {
					control: {
						color: "darkorange", //$NON-NLS-0$
						fontWeight: "bold" //$NON-NLS-0$
					},
					operator: {
						color: "darkorange", //$NON-NLS-0$
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
						color: "darkorange" //$NON-NLS-0$
					}
				},
				string: {
					color: "cornflowerblue" //$NON-NLS-0$
				},
				support: {
					type: {
						propertyName: {
							color: "darkorange" //$NON-NLS-0$
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
		this.styles.push(nimbus);

		var adelante = {
			name: messages["adelanteThemeName"],
			className: "adelante", //$NON-NLS-0$
			styles: {
				/* top-level properties */
				backgroundColor: "#F1E7C8", //$NON-NLS-0$
				color: "dimgray", //$NON-NLS-0$
				fontFamily: defaultFont,
				fontSize: defaultFontSize,

				/* from textview.css */
				textviewRightRuler: {
					borderLeft: "1px solid #9E937B", //$NON-NLS-0$
				},
				textviewLeftRuler: {
					borderRight: "1px solid #9E937B" //$NON-NLS-0$
				},

				/* from rulers.css */
				ruler: {
					backgroundColor: "#E2D2B2" //$NON-NLS-0$
				},
				rulerLines: {
					color: "#AF473B", //$NON-NLS-0$
				},

				/* from annotations.css */
				annotationLine: {
					currentLine: {
						backgroundColor: "#9E937B" //$NON-NLS-0$
					}
				},

				/* from textstyler.css */
				comment: {
					color: "#5D774E", //$NON-NLS-0$
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
							color: "cadetBlue" //$NON-NLS-0$
						}
					}
				},
				keyword: {
					control: {
						color: "#AF473B", //$NON-NLS-0$
						fontWeight: "bold" //$NON-NLS-0$
					},
					operator: {
						color: "#AF473B", //$NON-NLS-0$
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
						color: "#AF473B" //$NON-NLS-0$
					}
				},
				string: {
					color: "#DE5D3B" //$NON-NLS-0$
				},
				support: {
					type: {
						propertyName: {
							color: "#AF473B" //$NON-NLS-0$
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
		this.styles.push(adelante);

		var raspberry = {
			name: messages["raspberryPiThemeName"],
			className: "raspberry", //$NON-NLS-0$
			styles: {
				/* top-level properties */
				backgroundColor: "seashell", //$NON-NLS-0$
				color: "dimgray", //$NON-NLS-0$
				fontFamily: defaultFont,
				fontSize: defaultFontSize,

				/* from textview.css */
				textviewRightRuler: {
					borderLeft: "1px solid #FBDFDE", //$NON-NLS-0$
				},
				textviewLeftRuler: {
					borderRight: "1px solid #FBDFDE" //$NON-NLS-0$
				},

				/* from rulers.css */
				ruler: {
					backgroundColor: "seashell" //$NON-NLS-0$
				},
				rulerLines: {
					color: "#E73E36", //$NON-NLS-0$
					even: {
						color: "#F6B8B6", //$NON-NLS-0$
					},
					odd: {
						color: "#F6B8B6", //$NON-NLS-0$
					}
				},

				/* from annotations.css */
				annotationLine: {
					currentLine: {
						backgroundColor: "#F5B1AE" //$NON-NLS-0$
					}
				},

				/* from textstyler.css */
				comment: {
					color: "#66B32F", //$NON-NLS-0$
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
							color: "cadetBlue" //$NON-NLS-0$
						}
					}
				},
				keyword: {
					control: {
						color: "#E73E36", //$NON-NLS-0$
						fontWeight: "bold" //$NON-NLS-0$
					},
					operator: {
						color: "#E73E36", //$NON-NLS-0$
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
						color: "#E73E36" //$NON-NLS-0$
					}
				},
				string: {
					color: "darkorange" //$NON-NLS-0$
				},
				support: {
					type: {
						propertyName: {
							color: "#E73E36" //$NON-NLS-0$
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
		this.styles.push(raspberry);

		}
		
		function getStyles(){
			return this.styles;
		}
		
		ThemeData.prototype.styles = [];
		ThemeData.prototype.getStyles = getStyles;
		
		var fontSettable = true;
		
		ThemeData.prototype.fontSettable = fontSettable;
		
		function getThemeStorageInfo(){
			return {
				storage:'/themes',
				styleset:'editorstyles',
				defaultTheme:'Prospecto',
				selectedKey: 'editorSelected',
				version: THEMES_VERSION
			}; 
		}

		ThemeData.prototype.getThemeStorageInfo = getThemeStorageInfo;

		function getViewData() {

		var dataset = {};
		dataset.top = 10;
		dataset.left = 10;
		dataset.width = 400;
		dataset.height = 350;

		var LEFT = dataset.left;
		var TOP = dataset.top;

		dataset.shapes = [{
			type: 'RECTANGLE',
			name: messages.Background,
			x: LEFT + 46,
			y: TOP,
			width: 290,
			height: dataset.height,
			family: 'backgroundColor',
			fill: 'white'
		},
		{
			type: 'TEXT',
			name: messages.SingleQuotedStrings,
			label: "'text/javascript'",
			x: LEFT + 134,
			y: TOP + 20,
			fill: 'darkorange',
			family: 'string.quoted.single',
			font: '9pt sans-serif'
		},
		
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: '=',
			x: LEFT + 124,
			y: TOP + 20,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},

		
		{
			type: 'RECTANGLE',
			name: messages["Current Line"],
			x: LEFT + 46,
			y: TOP + 87,
			width: 290,
			height: 18,
			family: 'annotationLine.currentLine',
			fill: '#eaf2fd'
		},
		
		{
			type: 'TEXT',
			name: messages["Attribute Names"],
			label: 'type',
			x: LEFT + 98,
			y: TOP + 20,
			fill: 'darkGray',
			family: 'entity.other.attribute-name',
			font: '9pt sans-serif'
		},
		
		{
			type: 'RECTANGLE',
			name: messages["Overview Ruler"],
			x: LEFT + 336,
			y: TOP,
			width: 14,
			height: dataset.height,
			family: 'ruler.overview',
			fill: 'white'
		},	
		{
			type: 'TEXT',
			name: messages.BlockComments,
			label: '/* comment */',
			x: LEFT + 75,
			y: TOP + 40,
			fill: 'darkSeaGreen',
			family: 'comment.block',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages["Tags"],
			label: '<script',
			x: LEFT + 55,
			y: TOP + 20,
			fill: 'darkorange',
			family: 'meta.tag',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages["Tags"],
			label: '>',
			x: LEFT + 213,
			y: TOP + 20,
			fill: 'darkorange',
			family: 'meta.tag',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.DoubleQuotedStrings,
			label: '"Result"',
			x: LEFT + 164,
			y: TOP + 80,
			fill: 'cornflowerBlue',
			family: 'string.quoted.double',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.LineComments,
			label: '// $NON-NLS-0$',
			x: LEFT + 224,
			y: TOP + 80,
			fill: 'cornflowerBlue',
			family: 'comment.line',
			font: '9pt sans-serif'
		},
		
		
		{
			type: 'TEXT',
			name: messages.FunctionNames,
			label: 'area',
			x: LEFT + 120,
			y: TOP + 60,
			fill: 'darkSlateGray',
			family: 'entity.name.function',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: '(',
			x: LEFT + 148,
			y: TOP + 60,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Parameters,
			label: 'rad',
			x: LEFT + 152,
			y: TOP + 60,
			fill: 'darkSlateGray',
			family: 'variable.parameter',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: ') {',
			x: LEFT + 170,
			y: TOP + 60,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},

		{
			type: 'TEXT',
			name: messages.OperatorKeywords,
			label: 'function',
			x: LEFT + 75,
			y: TOP + 60,
			fill: 'darkorange',
			family: 'keyword.operator',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.OperatorKeywords,
			label: 'var',
			x: LEFT + 95,
			y: TOP + 80,
			fill: 'darkorange',
			family: 'keyword.operator',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: 'output = ',
			x: LEFT + 115,
			y: TOP + 80,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: ';',
			x: LEFT + 205,
			y: TOP + 80,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.OperatorKeywords,
			label: 'var',
			x: LEFT + 95,
			y: TOP + 100,
			fill: 'darkorange',
			family: 'keyword.operator',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: 'result = Math.pi * Math.pow(rad,',
			x: LEFT + 115,
			y: TOP + 100,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages["DecimalNumbers"],
			label: '2',
			x: LEFT + 288,
			y: TOP + 100,
			fill: 'darkSlateGray',
			family: 'constant.numeric',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: ');',
			x: LEFT + 295,
			y: TOP + 100,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.ControlKeywords,
			label: 'return',
			x: LEFT + 95,
			y: TOP + 120,
			fill: 'darkorange',
			family: 'keyword.control',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: 'output + result;',
			x: LEFT + 132,
			y: TOP + 120,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: '}',
			x: LEFT + 75,
			y: TOP + 140,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages["Tags"],
			label: '</script>',
			x: LEFT + 55,
			y: TOP + 160,
			fill: 'darkorange',
			family: 'meta.tag',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages["Tags"],
			label: '<style',
			x: LEFT + 55,
			y: TOP + 200,
			fill: 'darkorange',
			family: 'meta.tag',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages["Attribute Names"],
			label: 'type',
			x: LEFT + 93,
			y: TOP + 200,
			fill: 'darkGray',
			family: 'entity.other.attribute-name',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: '=',
			x: LEFT + 119,
			y: TOP + 200,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.SingleQuotedStrings,
			label: "'text/css'",
			x: LEFT + 129,
			y: TOP + 200,
			fill: 'darkorange',
			family: 'string.quoted.single',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages["Tags"],
			label: '>',
			x: LEFT + 178,
			y: TOP + 200,
			fill: 'darkorange',
			family: 'meta.tag',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: '.some-class {',
			x: LEFT + 75,
			y: TOP + 220,
			fill: 'darkorange',
			family: 'color',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages["Property Names"],
			label: 'color',
			x: LEFT + 95,
			y: TOP + 240,
			fill: 'darkSlateGray',
			family: 'support.type.propertyName',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: ':',
			x: LEFT + 122,
			y: TOP + 240,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.HexNumber,
			label: '#123456',
			x: LEFT + 130,
			y: TOP + 240,
			fill: 'darkSlateGray',
			family: 'constant.numeric.hex',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: ';',
			x: LEFT + 180,
			y: TOP + 240,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages.Foreground,
			label: '}',
			x: LEFT + 75,
			y: TOP + 260,
			fill: 'darkSlateGray',
			family: 'color',
			font: '9pt sans-serif'
		},
		{
			type: 'TEXT',
			name: messages["Tags"],
			label: '</style>',
			x: LEFT + 55,
			y: TOP + 280,
			fill: 'darkorange',
			family: 'meta.tag',
			font: '9pt sans-serif'
		},
		/* <style type='text/css'></style> */
		{
			type: 'RECTANGLE',
			name: messages["Annotation Ruler"],
			x: LEFT,
			y: TOP,
			width: 46,
			height: dataset.height,
			family: 'ruler.annotations',
			fill: 'white'
		}];

		for (var line = 0; line < 16; line++) {
			var isOdd = (line + 1) % 2 === 1;
			dataset.shapes.push({
				type: 'TEXT',
				name: isOdd ? messages["Odd Line Numbers"] : messages["Even Line Numbers"],
				label: line + 1,
				x: LEFT + 20,
				y: TOP + (20 * line) + 20,
				fill: 'darkSlateGray',
				family: isOdd ? 'rulerLines.odd' : 'rulerLines.even',
				font: '9pt sans-serif'
			});
		}

		return dataset;
	}
		
		function parseToXML(text) {
			try {
				var parser = new DOMParser();
				var xml = parser.parseFromString(text, "text/xml"); //$NON-NLS-0$
				var found = xml.getElementsByTagName("parsererror"); //$NON-NLS-0$
				if (!found || !found.length || !found[0].childNodes.length) {
					return xml;
				}
			} catch (e) { /* suppress */ }
			return null;
		}

		ThemeData.prototype.parseToXML = parseToXML;
		
		function selectFontSize(size) {
			window.console.log("fontsize: " + size ); //$NON-NLS-0$
		}
		
		ThemeData.prototype.selectFontSize = selectFontSize;
		
		// Changes XML to JSON
		function xmlToJson(xml) {
			// Create the return object
			var obj = {};
			if (xml.nodeType == 1) { // element
				// do attributes
				if (xml.attributes.length > 0) {
					for (var j = 0; j < xml.attributes.length; j++) {
						var attribute = xml.attributes.item(j);
						obj[attribute.nodeName] = attribute.nodeValue;
					}
				}
			} else if (xml.nodeType == 3) { // text
				obj = xml.nodeValue.trim(); // add trim here
			}
			// do children
			if (xml.hasChildNodes()) {
				for(var i = 0; i < xml.childNodes.length; i++) {
					var item = xml.childNodes.item(i);
					var nodeName = item.nodeName;
					if (typeof(obj[nodeName]) == "undefined") { //$NON-NLS-0$
						var tmp = xmlToJson(item);
						if(tmp != "") // if not empty string
							obj[nodeName] = tmp;
					} else {
						if (typeof(obj[nodeName].push) == "undefined") { //$NON-NLS-0$
							var old = obj[nodeName];
							obj[nodeName] = [];
							obj[nodeName].push(old);
						}
						var tmp = xmlToJson(item);
						if(tmp != "") // if not empty string
							obj[nodeName].push(tmp);
					}
				}
			}
			return obj;
		}		
		
		function importTheme(data) {
			var body = data.parameters.valueFor("name"); //$NON-NLS-0$
			var xml = this.parseToXML(body);
			
			if(xml.children[0].tagName === "plist"){ //$NON-NLS-0$ //assume it uses tmTheme structure
				var themeJson = xmlToJson(xml); //convert to Json
				var newStyle = new StyleSet(); //sets the default styling
				newStyle = {"name":"default","className":"default","styles":{"annotationRange":{"matchingSearch":{"backgroundColor":""}, "currentSearch":{"backgroundColor":"","text-decoration":"underline"}},"backgroundColor":"","color":"","fontFamily":"\"Consolas\", \"Monaco\", \"Vera Mono\", monospace","fontSize":"16px","textviewRightRuler":{"borderLeft":"1px solid rgba(131, 131, 131, 0.05)"},"textviewLeftRuler":{"borderRight":"1px solid rgba(131, 131, 131, 0.05)"},"ruler":{"backgroundColor":"","overview":{"backgroundColor":""},"annotations":{"backgroundColor":""}},"rulerLines":{"color":"","odd":{"color":""},"even":{"color":""}},"annotationLine":{"currentLine":{"backgroundColor":"rgba(255, 255, 255, 0.05)"}},"comment":{"color":"","block":{"color":""},"line":{"color":""}},"constant":{"color":"","numeric":{"color":"","hex":{"color":""}}},"entity":{"name":{"color":"","function":{"fontWeight":"normal","color":""}},"other":{"attribute-name":{"color":""}}},"keyword":{"control":{"color":"","fontWeight":"normal"},"operator":{"color":"","fontWeight":"normal"},"other":{"documentation":{"color":""}}},"markup":{"bold":{"fontWeight":"bold"},"heading":{"color":"blue"},"italic":{"fontStyle":"italic"},"list":{"color":"#CC4C07"},"other":{"separator":{"color":"#00008F"},"strikethrough":{"textDecoration":"line-through"},"table":{"color":"#3C802C"}},"quote":{"color":"#55b5db"},"raw":{"fontFamily":"monospace"},"underline":{"link":{"textDecoration":"underline"}}},"meta":{"documentation":{"annotation":{"color":""},"tag":{"color":""}},"tag":{"color":""}},"string":{"color":"","quoted":{"single":{"color":""},"double":{"color":""}}},"support":{"type":{"propertyName":{"color":"#9F4177"}}},"variable":{"language":{"color":"","fontWeight":"normal"},"other":{"color":""},"parameter":{"color":""}}}				} //$NON-NLS-0$
				//finds the name tag
				for(var i = 0; i < themeJson.plist[1].dict.key.length; i++){
					if(themeJson.plist[1].dict.key[i]["#text"] === "name"){ //$NON-NLS-0$
						newStyle.name = themeJson.plist[1].dict.string[i]["#text"];
						newStyle.className = newStyle.name.replace(/\s+/g, '');
					}
				}
				var dictKey = themeJson.plist[1].dict.array.dict[0].dict.key;
				var dictString = themeJson.plist[1].dict.array.dict[0].dict.string;
				
				//finds the general attributes
				for(var i = 0; i<dictKey.length; i++){
					if(dictKey[i]["#text"] === "background" && dictString[i]["#text"].length < 8){ //$NON-NLS-0$
						newStyle.styles.backgroundColor = dictString[i]["#text"];
					}
					else if(dictKey[i]["#text"] === "foreground" && dictString[i]["#text"].length < 8){ //$NON-NLS-0$
						newStyle.styles.color = dictString[i]["#text"];
					}
					else if(dictKey[i]["#text"] === "lineHighlight" && dictString[i]["#text"].length < 8){ //$NON-NLS-0$
						newStyle.styles.annotationLine.currentLine.backgroundColor = dictString[i]["#text"];
					}////annotationRange matchingSearch
					else if(dictKey[i]["#text"] === "selection" && dictString[i]["#text"].length < 8){ //$NON-NLS-0$
						newStyle.styles.annotationRange.matchingSearch.backgroundColor = dictString[i]["#text"];
						newStyle.styles.annotationRange.currentSearch.backgroundColor = dictString[i]["#text"];
					}
				}
				//finds the scope attributes
				var restKey = themeJson.plist[1].dict.array.dict;
				for(var i = 1; i< restKey.length; i++){
					try{
						var target = restKey[i].string[0]["#text"].split(",");
						for (var k = 0; k < target.length; k++){
							var found = false;
							if(target[k].trim() === "Comment"){ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.comment.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.comment.block.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.comment.line.color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.comment.color = restKey[i].dict.string["#text"];
										newStyle.styles.comment.block.color = restKey[i].dict.string["#text"];
										newStyle.styles.comment.line.color = restKey[i].dict.string["#text"];
									}
								}
							}
							else if(target[k].trim() === "Keyword"){ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.keyword.control.color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.keyword.control.color = restKey[i].dict.string["#text"];
									}
								}
							}
							else if(target[k].trim() === "Variable" || target[k].trim() === "Function argument"){ //$NON-NLS-1$ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.variable.language.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.variable.other.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.variable.parameter.color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.variable.language.color = restKey[i].dict.string["#text"];
										newStyle.styles.variable.other.color = restKey[i].dict.string["#text"];
										newStyle.styles.variable.parameter.color = restKey[i].dict.string["#text"];
									}
								}
							}
							else if(target[k].trim() === "Constant" || target[k].trim() === "Number"){ //$NON-NLS-1$ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.constant.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.constant.numeric.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.constant.numeric.hex.color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.constant.color = restKey[i].dict.string["#text"];
										newStyle.styles.constant.numeric.color = restKey[i].dict.string["#text"];
										newStyle.styles.constant.numeric.hex.color = restKey[i].dict.string["#text"];
									}
								}
							}
							else if(target[k].trim() === "String"){ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.string.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.string.quoted.single.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.string.quoted.double.color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.string.color = restKey[i].dict.string["#text"];
										newStyle.styles.string.quoted.single.color = restKey[i].dict.string["#text"];
										newStyle.styles.string.quoted.double.color = restKey[i].dict.string["#text"];
									}
								}
							}
							else if(target[k].trim() === "Storage" || target[k].trim() === "Storage type"){ //$NON-NLS-1$ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.keyword.operator.color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.keyword.operator.color = restKey[i].dict.string["#text"];
									}
								}
							}
							else if(target[k].trim() === "Function" || target[k].trim() === "Entity" || target[k].trim() === "Function name"){ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
								found = true;
								if (restKey[i].dict.key instanceof Array){
									for(var l = 0; l< restKey[i].dict.key.length; l++){
										if (restKey[i].dict.key[l]["#text"] === "foreground"){ //$NON-NLS-0$
											newStyle.styles.entity.name.color = restKey[i].dict.string[l]["#text"];
											newStyle.styles.entity.name["function"].color = restKey[i].dict.string[l]["#text"];
										}
									}
								}
								else{
									if (restKey[i].dict.key["#text"] === "foreground"){ //$NON-NLS-0$
										newStyle.styles.entity.name.color = restKey[i].dict.string["#text"];
											newStyle.styles.entity.name["function"].color = restKey[i].dict.string["#text"];
									}
								}
							}
							
							if(found === false)
								console.log("Theme scope ignored : " + target[k].trim()); //$NON-NLS-0$
						}
					}
					catch (e){
						console.log("Exception : " + e); //$NON-NLS-0$
					}
				}
			}
			else if (xml) {
				/* old-style theme definition */
				var newStyle = new StyleSet();
				
				newStyle.name = xml.getElementsByTagName("colorTheme")[0].attributes[1].value;
				newStyle.annotationRuler = xml.getElementsByTagName("background")[0].attributes[0].value; 
				newStyle.background = xml.getElementsByTagName("background")[0].attributes[0].value;
				newStyle.comment = xml.getElementsByTagName("singleLineComment")[0].attributes[0].value;
				newStyle.keyword = xml.getElementsByTagName("keyword")[0].attributes[0].value;
				newStyle.text = xml.getElementsByTagName("foreground")[0].attributes[0].value;
				newStyle.string = xml.getElementsByTagName("string")[0].attributes[0].value;
				newStyle.overviewRuler = xml.getElementsByTagName("background")[0].attributes[0].value;
				newStyle.lineNumberOdd = xml.getElementsByTagName("lineNumber")[0].attributes[0].value;
				newStyle.lineNumberEven = xml.getElementsByTagName("lineNumber")[0].attributes[0].value;
				newStyle.lineNumber = xml.getElementsByTagName("lineNumber")[0].attributes[0].value;
				newStyle.currentLine = xml.getElementsByTagName("selectionBackground")[0].attributes[0].value;
			} else {
				/* parsing the data as xml failed, now try the new-style theme definition (JSON) */
				try {
					newStyle = JSON.parse(body);
				} catch (e) {}
			}

			if (newStyle) {
				data.items.addTheme(newStyle);
			} else {
				// TODO no
			}
		}
		
		ThemeData.prototype.importTheme = importTheme;
		
		function processSettings(settings, preferences) {
			var themeClass = "editorTheme"; //$NON-NLS-0$
			var theme = mTextTheme.TextTheme.getTheme();
			theme.setThemeClass(themeClass, theme.buildStyleSheet(themeClass, settings));
		}

		ThemeData.prototype.processSettings = processSettings;

		ThemeData.prototype.getViewData = getViewData;

		return {
			ThemeData:ThemeData,
			getStyles:getStyles
		};
	}
);
