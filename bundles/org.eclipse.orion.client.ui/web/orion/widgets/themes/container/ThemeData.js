/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 * 				 Casey Flynn - Google Inc.
 ******************************************************************************/
/*eslint-env browser, amd*/

define([
	'orion/editor/textTheme',
	'orion/widgets/themes/container/ThemeSheetWriter',
	'orion/widgets/themes/ThemeVersion'
],
	function(mTextTheme, ThemeSheetWriter, THEMES_VERSION) {

	// *******************************************************************************
	//
	// If you change any styles in this file, you must increment the version number
	// in ThemeVersion.js.
	//
	// *******************************************************************************

		function ThemeData(){
		
			this.styles = [];
			var lightPage = {
				"className": "lightPage",
				"name": "lightPage",
				"styles": {
					"#configSection": {
						"background-color": "rgba(255,255,255,1) !important",
						"color": "rgba(0,0,0,1) !important"
					},
					"#log": {
						"margin": "5px",
						"width": "calc(100% - 17px)"
					},
					".auxpane": {
						"background": "rgba(196,197,200,1) !important"
					},
					".checkedRow": {
						"background-color": "rgba(61,114,179,1) !important",
						"color": "rgba(255,255,255,1) !important",
						".commandButton": {
							"border-color": "rgba(255,255,255,1)",
							"color": "rgba(255,255,255,1)"
						},
						".commandButton:not(.primaryButton):focus": {
							"background": "rgba(61,114,179,0.50)",
							"box-shadow": "0 1px 2px 0 rgb(61, 114, 179)",
							"color": "rgba(0,0,0,1)"
						},
						".commandButton:not(.primaryButton):hover": {
							"background": "rgba(61,114,179,0.50)",
							"box-shadow": "0 1px 2px 0 rgb(61, 114, 179)",
							"color": "rgba(0,0,0,1)"
						},
						".gitStatusIcon": {
							"color": "white !important"
						},
						".gitStatusTitle": {
							"color": "white !important"
						},
						"gitStatusIcon": {
							"color": "rgba(255,255,255,1)"
						},
						"gitStatusTitle": {
							"color": "rgba(255,255,255,1)"
						}
					},
					".commandButton": {
						"background-color": "rgba(0, 0, 0, 0)",
						"border-width": "1px",
						"border-style": "solid",
						"border-color": "rgba(61,114,179,1)",
						"color": "rgba(61,114,179,1)"
					},
					".commandButton.disabled": {
						"color": "#cdcdcd"
					},
					".commandButton.orionButton.dropdownTrigger:hover": {
						"border-color": "#ccc"
					},
					".commandButton:not(.primaryButton):focus": {
						"background-color": "rgba(61,114,179,0.25)",
						"box-shadow": "0 1px 2px 0 rgb(61, 114, 179)",
						"color": "rgba(0,0,0,1)"
					},
					".commandButton:not(.primaryButton):hover": {
						"background-color": "rgba(61,114,179,0.25)",
						"box-shadow": "0 1px 2px 0 rgb(61, 114, 179)",
						"color": "rgba(0,0,0,1)"
					},
					".content-fixedHeight": {
						"background": "rgba(196,197,200,1) !important"
					},
					".core-sprite-error": {
						"color": "red"
					},
					".dialogTitle": {
						"background-color": "rgba(61,114,179,1) !important",
						"color": "rgba(255,255,255,1) !important"
					},
					".dropdownButtonWithIcon": {
						"color": "rgba(21,41,53,1) !important"
					},
					".dropdownMenu": {
						".dropdownMenuItemSelected": {
							"background": "rgba(61,114,179,0.25)",
							"border-left-color": "rgba(61,114,179,1)"
						}
					},
					".dropdownTrigger:not(.dropdownDefaultButton)": {
						"color": "rgba(21,41,53,1)"
					},
					".editorViewerHeader": {
						"background": "rgba(245,247,250,1) !important",
						"border-bottom-width": "1px",
						"border-bottom-style": "solid",
						"border-bottom-color": "rgba(245,247,250,1)",
						"color": "rgba(0,0,0,1)"
					},
					".filesystemName": {
						"color": "rgba(21,41,53,1) !important"
					},
					".fixedToolbarHolder": {
						"background": "rgba(255,255,255,1)"
					},
					".gitCommitMessage": {
						"gitCommitMessageTopRow": {
							"border-width": "1px",
							"border-style": "solid",
							"border-color": "rgb(61, 114, 179)"
						},
						".gitCommitMessageTopRow": {
							"border-color": "rgba(61,114,179,1)"
						}
					},
					".gitCommitMessageSection": {
						"background-color": "rgba(61,114,179,0.25)"
					},
					".gitCommitMore": {
						"color": "rgba(61,114,179,1) !important"
					},
					".gitStatusIcon": {
						"color": "rgba(61,114,179,1) !important"
					},
					".gitStatusSection": {
						"background-color": "rgba(61,114,179,0.25)"
					},
					".gitStatusTitle": {
						"color": "rgba(61,114,179,1) !important"
					},
					".label.parameterInput": {
						"color": "rgba(255,255,255,1) !important"
					},
					".launchConfigurationMenuItem.dropdownMenuItemActive": {
						"background": "rgba(245,247,250,1)"
					},
					".launchConfigurationsButton": {
						".commandButton.orionButton.dropdownTrigger": {
							"color": "rgba(255,255,255,1) !important"
						}
					},
					".launchConfigurationsWrapper>.launchConfigurationsButton.dropdownTrigger": {
						"background-color": "rgba(61,114,179,1) !important",
						"color": "rgba(255,255,255,1) !important"
					},
					".launchConfsDropdown": {
						".dropdownDefaultButton": {
							"background-color": "rgba(61,114,179,1) !important",
							"color": "rgba(255,255,255,1) !important"
						}
					},
					".launchConfsLabel": {
						"background-color": "rgba(61,114,179,1) !important",
						"color": "rgba(255,255,255,1) !important"
					},
					".liveUpdateLabel": {
						"color": "rgba(61,114,179,1) !important"
					},
					".mainToolbar": {
						"background-color": "rgba(255,255,255,1)",
						"color": "rgba(21,41,53,1) !important",
						".commandButton.orionButton.dropdownTrigger": {
							"border-color": "rgba(255,255,255,1) !important",
							"color": "rgba(0,0,0,1) !important",
							".dropdownTriggerButtonLabel": {
								"color": "rgba(255,255,255,1)"
							}
						},
						".commandButton.orionButton.dropdownTrigger.dropdownTriggerOpen": {
							"color": "rgba(196,197,200,1) !important"
						},
						".commandButton.orionButton.dropdownTrigger.launchConfigurationsButton": {
							"dropdownArrowDown": {
								"color": "white"
							},
							".dropdownArrowDown": {
								"color": "rgba(255,255,255,1)"
							}
						},
						".commandImage.dropdownTrigger": {
							"color": "rgb(21, 41, 53) !important"
						},
						".gitSectionLabel": {
							"background-color": "rgba(61,114,179,1) !important",
							"color": "rgba(255,255,255,1) !important"
						},
						".sectionWrapper": {
							"background-color": "rgba(61,114,179,1) !important",
							"color": "rgba(255,255,255,1) !important"
						}
					},
					".mainpane": {
						"background": "rgba(196,197,200,1) !important"
					},
					".navbar-item-selected": {
						"background-color": "rgba(61,114,179,1) !important",
						"color": "rgba(255,255,255,1) !important"
					},
					".orionSwitchLabel": {
						"background-color": "rgba(61,114,179,1) !important",
						"color": "rgba(255,255,255,1) !important"
					},
					".outlineExplorer": {
						".treeIterationCursorRow_Dotted": {
							"background-color": "rgba(61,114,179,1) !important",
							"color": "rgba(255,255,255,1) !important"
						}
					},
					".primaryButton": {
						"background-color": "rgba(61,114,179,1) !important",
						"border-width": "1px",
						"border-style": "solid",
						"border-color": "rgba(61,114,179,1) !important",
						"border-radius": "0 !important",
						"color": "rgba(255,255,255,1) !important"
					},
					".primaryButton:hover,": {
						".primaryButton:focus": {
							"background": "rgb(61, 114, 179)",
							"border-color": "rgb(61, 114, 179)"
						}
					},
					".projectNavColumn": {
						"color": "rgba(0,0,0,1)"
					},
					".searchResultsWrapperDiv": {
						".selectableNavRow:hover": {
							"background": "rgba(61,114,179,0.25)",
							"border-left-color": "rgba(61,114,179,1)"
						}
					},
					".sectionTable": {
						"background-color": "rgba(255,255,255,1)"
					},
					".sideMenu": {
						"background-color": "rgba(255,255,255,1)"
					},
					".sideMenuItem": {
						"color": "rgba(21,41,53,1) !important"
					},
					".sideMenuItem>.submenu-trigger:hover": {
						"color": "rgba(61,114,179,1) !important"
					},
					".sideMenuItemActive": {
						"background-color": "rgba(61,114,179,1) !important",
						"color": "rgba(255,255,255,1) !important"
					},
					".sideMenuItemActive:hover": {
						"background": "rgba(61,114,179,0.25) !important",
						"color": "rgba(255,255,255,1)"
					},
					".sidebarWrapper": {
						"background": "rgba(245,247,250,1) !important",
						"color": "rgba(0,0,0,1)"
					},
					".slideParameters": {
						"background-color": "rgba(61,114,179,1) !important",
						"color": "rgba(255,255,255,1) !important"
					},
					".splash": {
						"background": "rgba(245,247,250,1) !important",
						"box-shadow": "none"
					},
					".splashAbout": {
						"color": "rgba(61,114,179,1) !important"
					},
					".splashDetailedMessage": {
						"color": "rgba(0,0,0,1)"
					},
					".splashLoader": {
						"background": "rgba(245,247,250,1) !important",
						"box-shadow": "none"
					},
					".splashLoadingImage": {
						"-webkit-animation": "rotateThis .5s infinite linear",
						"animation": "rotateThis .5s infinite linear",
						"background": "none",
						"border": "2px solid #00b299",
						"border-radius": "50%",
						"border-right-color": "transparent",
						"display": "inline-block",
						"height": "20px",
						"margin": "0",
						"opacity": ".4",
						"width": "20px"
					},
					".splashLoadingImage.initial": {
						"border-width": "4px",
						"height": "40px",
						"width": "40px"
					},
					".splashMessage": {
						"color": "rgba(0,0,0,1)"
					},
					".splashVerbal": {
						"color": "rgba(61,114,179,1) !important"
					},
					".split": {
						"background": "rgba(196,197,200,1)",
						"width": "4px"
					},
					".splitThumb": {
						"background": "rgba(196,197,200,1)"
					},
					".status": {
						"color": "rgba(0,0,0,1)"
					},
					".statusContainer": {
						"background": "rgba(245,247,250,1)",
						"color": "rgba(0,0,0,1)"
					},
					".statusLight": {
						"background": "lightgray"
					},
					".statusLight.statusLightAmber": {
						"background": "#FFE141"
					},
					".statusLight.statusLightGreen": {
						"background": "#13dd6d"
					},
					".statusLight.statusLightProgress": {
						"background": "transparent",
						"border-color": "lightgray",
						"border-top-color": "transparent"
					},
					".statusLight.statusLightRed": {
						"background": "#C1272D"
					},
					".textviewTooltip": {
						".commandButton": {
							"background-color": "inherit",
							"border": "1px solid #325C80",
							"border-color": "rgba(255,255,255,1)",
							"color": "white",
							"margin-bottom": "2px"
						},
						"color": "rgba(255,255,255,1)"
					},
					".titleActionContainer": {
						"background": "rgba(245,247,250,1) !important",
						"color": "rgba(0,0,0,1)"
					},
					".tooltip": {
						"background-color": "rgba(61,114,179,1) !important",
						"border-width": "1px",
						"border-style": "solid",
						"border-color": "rgba(61,114,179,1)",
						"color": "rgba(255,255,255,1) !important",
						"h2": {
							"color": "rgba(255,255,255,1) !important"
						},
						".navlinkonpage": {
							"background-color": "rgba(61,114,179,1) !important",
							"color": "rgba(255,255,255,1) !important"
						},
						".operationError": {
							"color": "rgba(255,255,255,1) !important"
						}
					},
					".tooltipTailFromabove:after": {
						"border-top-color": "rgba(61,114,179,1)"
					},
					".tooltipTailFromabove:before": {
						"border-top-color": "rgba(61,114,179,1)"
					},
					".tooltipTailFrombelow:after": {
						"border-bottom-color": "rgba(61,114,179,1)"
					},
					".tooltipTailFrombelow:before": {
						"border-bottom-color": "rgba(61,114,179,1)"
					},
					".tooltipTailFromleft:after": {
						"border-left-color": "rgba(61,114,179,1)"
					},
					".tooltipTailFromleft:before": {
						"border-left-color": "rgba(61,114,179,1)"
					},
					".tooltipTailFromright:after": {
						"border-right-color": "rgba(61,114,179,1)"
					},
					".tooltipTailFromright:before": {
						"border-right-color": "rgba(61,114,179,1)"
					},
					".treeIterationCursorRow": {
						"background-color": "rgba(61,114,179,0.25)"
					},
					".treeIterationCursorRow_Dotted": {
						"background-color": "rgba(61,114,179,0.25)"
					},
					".workingTarget": {
						"background-color": "rgba(255,255,255,1)"
					},
					".commandImage.dropdownTrigger": {
						"color": "rgba(21,41,53,1)"
					},
					".dropdownMenuItem": {
						"color": "rgba(245,247,250,1)"
					},
					".pageToolbar": {
						".dropdownTrigger:not(.dropdownDefaultButton)": {
							"color": "rgba(196,197,200,1)"
						}
					},
					".primaryButton:hover": {
						".primaryButton:focus": {
							"background": "rgba(61,114,179,1)",
							"border-color": "rgba(61,114,179,1)"
						}
					}
				}
			}
			this.styles.push(lightPage);
			
			var orionPage = {
				"className": "orionPage",
				"name": "orionPage",
				"styles": {
					"#configSection": {
						"background-color": "rgba(38,52,63,1) !important",
						"color": "rgba(255,255,255,1) !important"
					},
					"#log": {
						"margin": "5px",
						"width": "calc(100% - 17px)"
					},
					".auxpane": {
						"background": "rgba(59,75,84,1) !important"
					},
					".checkedRow": {
						"background-color": "rgba(27,177,153,1) !important",
						"color": "rgba(211,211,211,1) !important",
						".commandButton": {
							"border-color": "rgba(38,52,63,1)",
							"color": "rgba(211,211,211,1)"
						},
						".commandButton:not(.primaryButton):focus": {
							"background": "rgba(27,177,153,0.50)",
							"box-shadow": "0 1px 2px 0 rgb(61, 114, 179)",
							"color": "rgba(255,255,255,1)"
						},
						".commandButton:not(.primaryButton):hover": {
							"background": "rgba(27,177,153,0.50)",
							"box-shadow": "0 1px 2px 0 rgb(61, 114, 179)",
							"color": "rgba(255,255,255,1)"
						},
						".gitStatusIcon": {
							"color": "white !important"
						},
						".gitStatusTitle": {
							"color": "white !important"
						},
						"gitStatusIcon": {
							"color": "rgba(211,211,211,1)"
						},
						"gitStatusTitle": {
							"color": "rgba(211,211,211,1)"
						}
					},
					".commandButton": {
						"background-color": "rgba(0, 0, 0, 0)",
						"border-width": "1px",
						"border-style": "solid",
						"border-color": "rgba(27,177,153,1)",
						"color": "rgba(27,177,153,1)"
					},
					".commandButton.disabled": {
						"color": "#cdcdcd"
					},
					".commandButton.orionButton.dropdownTrigger:hover": {
						"border-color": "#ccc"
					},
					".commandButton:not(.primaryButton):focus": {
						"background-color": "rgba(27,177,153,0.25)",
						"box-shadow": "0 1px 2px 0 rgb(61, 114, 179)",
						"color": "rgba(255,255,255,1)"
					},
					".commandButton:not(.primaryButton):hover": {
						"background-color": "rgba(27,177,153,0.25)",
						"box-shadow": "0 1px 2px 0 rgb(61, 114, 179)",
						"color": "rgba(255,255,255,1)"
					},
					".content-fixedHeight": {
						"background": "rgba(59,75,84,1) !important"
					},
					".core-sprite-error": {
						"color": "red"
					},
					".dialogTitle": {
						"background-color": "rgba(27,177,153,1) !important",
						"color": "rgba(211,211,211,1) !important"
					},
					".dropdownButtonWithIcon": {
						"color": "rgba(255,255,255,1) !important"
					},
					".dropdownMenu": {
						".dropdownMenuItemSelected": {
							"background": "rgba(27,177,153,0.25)",
							"border-left-color": "rgba(27,177,153,1)"
						}
					},
					".dropdownTrigger:not(.dropdownDefaultButton)": {
						"color": "rgba(255,255,255,1)"
					},
					".editorViewerHeader": {
						"background": "rgba(59,75,84,1) !important",
						"border-bottom-width": "1px",
						"border-bottom-style": "solid",
						"border-bottom-color": "rgba(59,75,84,1)",
						"color": "rgba(255,255,255,1)"
					},
					".filesystemName": {
						"color": "rgba(255,255,255,1) !important"
					},
					".fixedToolbarHolder": {
						"background": "rgba(38,52,63,1)"
					},
					".gitCommitMessage": {
						"gitCommitMessageTopRow": {
							"border-width": "1px",
							"border-style": "solid",
							"border-color": "rgb(61, 114, 179)"
						},
						".gitCommitMessageTopRow": {
							"border-color": "rgba(27,177,153,1)"
						}
					},
					".gitCommitMessageSection": {
						"background-color": "rgba(27,177,153,0.25)"
					},
					".gitCommitMore": {
						"color": "rgba(27,177,153,1) !important"
					},
					".gitStatusIcon": {
						"color": "rgba(27,177,153,1) !important"
					},
					".gitStatusSection": {
						"background-color": "rgba(27,177,153,0.25)"
					},
					".gitStatusTitle": {
						"color": "rgba(27,177,153,1) !important"
					},
					".label.parameterInput": {
						"color": "rgba(211,211,211,1) !important"
					},
					".launchConfigurationMenuItem.dropdownMenuItemActive": {
						"background": "rgba(59,75,84,1)"
					},
					".launchConfigurationsButton": {
						".commandButton.orionButton.dropdownTrigger": {
							"color": "rgba(211,211,211,1) !important"
						}
					},
					".launchConfigurationsWrapper>.launchConfigurationsButton.dropdownTrigger": {
						"background-color": "rgba(27,177,153,1) !important",
						"color": "rgba(211,211,211,1) !important"
					},
					".launchConfsDropdown": {
						".dropdownDefaultButton": {
							"background-color": "rgba(27,177,153,1) !important",
							"color": "rgba(211,211,211,1) !important"
						}
					},
					".launchConfsLabel": {
						"background-color": "rgba(27,177,153,1) !important",
						"color": "rgba(211,211,211,1) !important"
					},
					".liveUpdateLabel": {
						"color": "rgba(27,177,153,1) !important"
					},
					".mainToolbar": {
						"background-color": "rgba(38,52,63,1)",
						"color": "rgba(255,255,255,1) !important",
						".commandButton.orionButton.dropdownTrigger": {
							"border-color": "rgba(38,52,63,1) !important",
							"color": "rgba(255,255,255,1) !important",
							".dropdownTriggerButtonLabel": {
								"color": "rgba(211,211,211,1)"
							}
						},
						".commandButton.orionButton.dropdownTrigger.dropdownTriggerOpen": {
							"color": "rgba(59,75,84,1) !important"
						},
						".commandButton.orionButton.dropdownTrigger.launchConfigurationsButton": {
							"dropdownArrowDown": {
								"color": "white"
							},
							".dropdownArrowDown": {
								"color": "rgba(211,211,211,1)"
							}
						},
						".commandImage.dropdownTrigger": {
							"color": "rgb(21, 41, 53) !important"
						},
						".gitSectionLabel": {
							"background-color": "rgba(27,177,153,1) !important",
							"color": "rgba(211,211,211,1) !important"
						},
						".sectionWrapper": {
							"background-color": "rgba(27,177,153,1) !important",
							"color": "rgba(211,211,211,1) !important"
						}
					},
					".mainpane": {
						"background": "rgba(59,75,84,1) !important"
					},
					".navbar-item-selected": {
						"background-color": "rgba(27,177,153,1) !important",
						"color": "rgba(211,211,211,1) !important"
					},
					".orionSwitchLabel": {
						"background-color": "rgba(27,177,153,1) !important",
						"color": "rgba(211,211,211,1) !important"
					},
					".outlineExplorer": {
						".treeIterationCursorRow_Dotted": {
							"background-color": "rgba(27,177,153,1) !important",
							"color": "rgba(211,211,211,1) !important"
						}
					},
					".primaryButton": {
						"background-color": "rgba(27,177,153,1) !important",
						"border-width": "1px",
						"border-style": "solid",
						"border-color": "rgba(27,177,153,1) !important",
						"border-radius": "0 !important",
						"color": "rgba(211,211,211,1) !important"
					},
					".primaryButton:hover,": {
						".primaryButton:focus": {
							"background": "rgb(61, 114, 179)",
							"border-color": "rgb(61, 114, 179)"
						}
					},
					".projectNavColumn": {
						"color": "rgba(255,255,255,1)"
					},
					".searchResultsWrapperDiv": {
						".selectableNavRow:hover": {
							"background": "rgba(27,177,153,0.25)",
							"border-left-color": "rgba(27,177,153,1)"
						}
					},
					".sectionTable": {
						"background-color": "rgba(255,255,255,1)"
					},
					".sideMenu": {
						"background-color": "rgba(38,52,63,1)"
					},
					".sideMenuItem": {
						"color": "rgba(255,255,255,1) !important"
					},
					".sideMenuItem>.submenu-trigger:hover": {
						"color": "rgba(27,177,153,1) !important"
					},
					".sideMenuItemActive": {
						"background-color": "rgba(27,177,153,1) !important",
						"color": "rgba(211,211,211,1) !important"
					},
					".sideMenuItemActive:hover": {
						"background": "rgba(27,177,153,0.25) !important",
						"color": "rgba(211,211,211,1)"
					},
					".sidebarWrapper": {
						"background": "rgba(59,75,84,1) !important",
						"color": "rgba(255,255,255,1)"
					},
					".slideParameters": {
						"background-color": "rgba(27,177,153,1) !important",
						"color": "rgba(211,211,211,1) !important"
					},
					".splash": {
						"background": "rgba(59,75,84,1) !important",
						"box-shadow": "none"
					},
					".splashAbout": {
						"color": "rgba(27,177,153,1) !important"
					},
					".splashDetailedMessage": {
						"color": "rgba(255,255,255,1)"
					},
					".splashLoader": {
						"background": "rgba(59,75,84,1) !important",
						"box-shadow": "none"
					},
					".splashLoadingImage": {
						"-webkit-animation": "rotateThis .5s infinite linear",
						"animation": "rotateThis .5s infinite linear",
						"background": "none",
						"border": "2px solid #00b299",
						"border-radius": "50%",
						"border-right-color": "transparent",
						"display": "inline-block",
						"height": "20px",
						"margin": "0",
						"opacity": ".4",
						"width": "20px"
					},
					".splashLoadingImage.initial": {
						"border-width": "4px",
						"height": "40px",
						"width": "40px"
					},
					".splashMessage": {
						"color": "rgba(255,255,255,1)"
					},
					".splashVerbal": {
						"color": "rgba(27,177,153,1) !important"
					},
					".split": {
						"background": "rgba(59,75,84,1)",
						"width": "4px"
					},
					".splitThumb": {
						"background": "rgba(59,75,84,1)"
					},
					".status": {
						"color": "rgba(255,255,255,1)"
					},
					".statusContainer": {
						"background": "rgba(59,75,84,1)",
						"color": "rgba(255,255,255,1)"
					},
					".statusLight": {
						"background": "lightgray"
					},
					".statusLight.statusLightAmber": {
						"background": "#FFE141"
					},
					".statusLight.statusLightGreen": {
						"background": "#13dd6d"
					},
					".statusLight.statusLightProgress": {
						"background": "transparent",
						"border-color": "lightgray",
						"border-top-color": "transparent"
					},
					".statusLight.statusLightRed": {
						"background": "#C1272D"
					},
					".textviewTooltip": {
						".commandButton": {
							"background-color": "inherit",
							"border": "1px solid #325C80",
							"border-color": "rgba(38,52,63,1)",
							"color": "white",
							"margin-bottom": "2px"
						},
						"color": "rgba(211,211,211,1)"
					},
					".titleActionContainer": {
						"background": "rgba(59,75,84,1) !important",
						"color": "rgba(255,255,255,1)"
					},
					".tooltip": {
						"background-color": "rgba(27,177,153,1) !important",
						"border-width": "1px",
						"border-style": "solid",
						"border-color": "rgba(27,177,153,1)",
						"color": "rgba(211,211,211,1) !important",
						"h2": {
							"color": "rgba(211,211,211,1) !important"
						},
						".navlinkonpage": {
							"background-color": "rgba(27,177,153,1) !important",
							"color": "rgba(211,211,211,1) !important"
						},
						".operationError": {
							"color": "rgba(211,211,211,1) !important"
						}
					},
					".tooltipTailFromabove:after": {
						"border-top-color": "rgba(27,177,153,1)"
					},
					".tooltipTailFromabove:before": {
						"border-top-color": "rgba(27,177,153,1)"
					},
					".tooltipTailFrombelow:after": {
						"border-bottom-color": "rgba(27,177,153,1)"
					},
					".tooltipTailFrombelow:before": {
						"border-bottom-color": "rgba(27,177,153,1)"
					},
					".tooltipTailFromleft:after": {
						"border-left-color": "rgba(27,177,153,1)"
					},
					".tooltipTailFromleft:before": {
						"border-left-color": "rgba(27,177,153,1)"
					},
					".tooltipTailFromright:after": {
						"border-right-color": "rgba(27,177,153,1)"
					},
					".tooltipTailFromright:before": {
						"border-right-color": "rgba(27,177,153,1)"
					},
					".treeIterationCursorRow": {
						"background-color": "rgba(27,177,153,0.25)"
					},
					".treeIterationCursorRow_Dotted": {
						"background-color": "rgba(27,177,153,0.25)"
					},
					".workingTarget": {
						"background-color": "rgba(255,255,255,1)"
					},
					".commandImage.dropdownTrigger": {
						"color": "rgba(255,255,255,1)"
					},
					".dropdownMenuItem": {
						"color": "rgba(59,75,84,1)"
					},
					".pageToolbar": {
						".dropdownTrigger:not(.dropdownDefaultButton)": {
							"color": "rgba(59,75,84,1)"
						}
					},
					".primaryButton:hover": {
						".primaryButton:focus": {
							"background": "rgba(27,177,153,1)",
							"border-color": "rgba(27,177,153,1)"
						}
					}
				}
			};
			this.styles.push(orionPage);
		}
		
		function getStyles(){
			return this.styles;
		}
		
		ThemeData.prototype.styles = [];
		ThemeData.prototype.getStyles = getStyles;
		
		function getProtectedThemes() {
			return ["lightPage", "orionPage"]; //$NON-NLS-1$ //$NON-NLS-0$
		}

		ThemeData.prototype.getProtectedThemes = getProtectedThemes;
		
		function getThemeStorageInfo(){
			return {
				storage:'/themes',
				styleset:'containerStyles',
				defaultTheme: 'lightPage',
				selectedKey: 'containerTheme',
				version: THEMES_VERSION
			};
		}
		
		ThemeData.prototype.getThemeStorageInfo = getThemeStorageInfo;

		
		function processSettings(settings){
			var sheetMaker = new ThemeSheetWriter.ThemeSheetWriter();
			var themeClass = "orionPage";
			var theme = new mTextTheme.TextTheme.getTheme(themeClass);
			theme.setThemeClass(themeClass, sheetMaker.getSheet(themeClass, settings ));
		}
		
		ThemeData.prototype.processSettings = processSettings;

		return{
			ThemeData:ThemeData,
			getStyles:getStyles,
		};
	}
);
