/*******************************************************************************
 * @license
 * Copyright (c) 2015-2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Casey Flynn - Google Inc - initial API and implementation
 ******************************************************************************/
 /*eslint-env browser,amd*/
define({
	"className": "orionPage",
	"name": "Dark",
	"styles": {
		"#configSection": {
			"background-color": "#26343F !important",
			"color": "#FFFFFF !important"
		},
		"#log": {
			"margin": "5px",
			"width": "calc(100% - 17px)"
		},
		".auxpane": {
			"background": "#3B4B54 !important"
		},
		".checkedRow": {
			"background-color": "#1BB199 !important",
			"color": "#FFFFFF !important",
			".commandButton": {
				"border-color": "#26343F",
				"color": "#FFFFFF"
			},
			".commandButton:not(.primaryButton):focus": {
				"background": "rgba(27,177,153,0.50)",
				"box-shadow": "0 1px 2px 0 rgb(27, 177, 153)",
				"color": "#FFFFFF"
			},
			".commandButton:not(.primaryButton):hover": {
				"background": "rgba(27,177,153,0.50)",
				"box-shadow": "0 1px 2px 0 rgb(27, 177, 153)",
				"color": "#FFFFFF"
			},
			".gitStatusIcon": {
				"color": "white !important"
			},
			".gitStatusTitle": {
				"color": "white !important"
			},
			"gitStatusIcon": {
				"color": "#FFFFFF"
			},
			"gitStatusTitle": {
				"color": "#FFFFFF"
			}
		},
		".checkedRow>td>span>a":{
			"color": "#FFFFFF !important"
		},

		".commandButton": {
			"background-color": "rgba(0, 0, 0, 0)",
			"border-width": "1px",
			"border-style": "solid",
			"border-color": "#1BB199",
			"color": "#1BB199"
		},
		".commandButton.disabled": {
			"color": "#cdcdcd"
		},
		".commandButton.orionButton.dropdownTrigger:hover": {
			"border-color": "#ccc"
		},
		".commandButton:not(.primaryButton):focus": {
			"background-color": "rgba(27,177,153,0.25)",
			"box-shadow": "0 1px 2px 0 rgb(27, 177, 153)",
			"color": "#FFFFFF"
		},
		".commandButton:not(.primaryButton):hover": {
			"background-color": "rgba(27,177,153,0.25)",
			"box-shadow": "0 1px 2px 0 rgb(27, 177, 153)",
			"color": "#FFFFFF"
		},
		".content-fixedHeight": {
			"background": "#3B4B54 !important"
		},
		".core-sprite-error": {
			"color": "red"
		},
		".dialogTitle": {
			"background-color": "#1BB199 !important",
			"color": "#FFFFFF !important"
		},
		".dropdownButtonWithIcon": {
			"color": "#FFFFFF !important"
		},
		".dropdownCommandName": {
			"color": "#000000 !important"
		},
		".dropdownArrowRight" : {
			"color": "#000000 !important"
		},
		".dropdownMenu": {
			".dropdownMenuItemSelected": {
				"background": "rgba(27,177,153,0.25)",
				"border-left-color": "#1BB199"
			}
		},
		".dropdownTrigger:not(.dropdownDefaultButton)": {
			"color": "#FFFFFF !important"
		},
		".editorViewerHeader": {
			"background": "#3B4B54 !important",
			"color": "#FFFFFF !important"
		},
		".filesystemName": {
			"color": "#FFFFFF !important"
		},
		".fixedToolbarHolder": {
			"background": "#26343F"
		},
		".gitCommitMessage": {
			"gitCommitMessageTopRow": {
				"border-width": "1px",
				"border-style": "solid",
				"border-color": "rgb(60, 113, 179)"
			},
			".gitCommitMessageTopRow": {
				"border-color": "#1BB199"
			}
		},
		".gitCommitMessageSection": {
			"background-color": "rgba(27,177,153,0.25)"
		},
		".gitCommitMore": {
			"color": "#1BB199 !important"
		},
		".gitStatusIcon": {
			"color": "#1BB199 !important"
		},
		".gitStatusSection": {
			"background-color": "rgba(27,177,153,0.25)"
		},
		".gitStatusTitle": {
			"color": "#1BB199 !important"
		},
		".label.parameterInput": {
			"color": "#FFFFFF !important"
		},
		".launchConfigurationMenuItem.dropdownMenuItemActive": {
			"background": "#3B4B54"
		},
		".launchConfigurationsButton": {
			".commandButton.orionButton.dropdownTrigger": {
				"color": "#FFFFFF !important"
			}
		},
		".launchConfigurationsWrapper>.launchConfigurationsButton.dropdownTrigger": {
			"background-color": "#1BB199 !important",
			"color": "#FFFFFF !important"
		},
		".launchConfsDropdown": {
			".dropdownDefaultButton": {
				"background-color": "#1BB199 !important",
				"color": "#FFFFFF !important"
			}
		},
		".launchConfsLabel": {
			"background-color": "#1BB199 !important",
			"color": "#FFFFFF !important"
		},
		".liveUpdateLabel": {
			"color": "#1BB199 !important"
		},
		".mainToolbar": {
			"background-color": "#26343F",
			"color": "#FFFFFF !important",
			".commandButton.orionButton.dropdownTrigger": {
				"border-color": "#26343F",
				"color": "#FFFFFF !important",
				".dropdownTriggerButtonLabel": {
					"color": "#FFFFFF"
				}
			},
			".commandButton.orionButton.dropdownTrigger.dropdownTriggerOpen": {
				"color": "#000000 !important"
			},
			".commandButton.orionButton.dropdownTrigger.launchConfigurationsButton": {
				"dropdownArrowDown": {
					"color": "white"
				},
				".dropdownArrowDown": {
					"color": "#FFFFFF"
				}
			},
			".commandImage.dropdownTrigger": {
				"color": "#FFFFFF !important"
			},
			".commandImage.dropdownTrigger.dropdownTriggerOpen": {
				"color": "#26343F !important"
			},
			".gitSectionLabel": {
				"background-color": "#1BB199 !important",
				"color": "#FFFFFF !important"
			},
			".sectionWrapper": {
				"background-color": "#1BB199 !important",
				"color": "#FFFFFF !important"
			}
		},
		".mainpane": {
			"background": "#3B4B54 !important"
		},
		".navbar-item-selected": {
			"background-color": "#1BB199 !important",
			"color": "#FFFFFF !important"
		},
		".orionSwitchLabel": {
			"background-color": "#1BB199 !important",
			"color": "#FFFFFF !important"
		},
		".outlineExplorer": {
			".treeIterationCursorRow_Dotted": {
				"background-color": "#1BB199 !important",
				"color": "#FFFFFF !important"
			}
		},
		".primaryButton": {
			"background-color": "#1BB199 !important",
			"border-width": "1px",
			"border-style": "solid",
			"border-color": "#1BB199 !important",
			"border-radius": "0 !important",
			"color": "#FFFFFF !important"
		},
		".primaryButton:hover,": {
			".primaryButton:focus": {
				"background": "rgb(60, 113, 179)",
				"border-color": "rgb(60, 113, 179)"
			}
		},
		".projectNavColumn": {
			"color": "#FFFFFF"
		},
		".searchResultsWrapperDiv": {
			".selectableNavRow:hover": {
				"background": "rgba(27,177,153,0.25)",
				"border-left-color": "#1BB199"
			}
		},
		".sectionTable": {
			"background-color": "#FFFFFF",
			".preview_td": {
				"border-bottom": "1px solid #3B4B54",
				"color": "#FFFFFF"
			}
		},
		".sideMenu": {
			"background-color": "#26343F"
		},
		".sideMenuItem": {
			"color": "#FFFFFF !important"
		},
		".sideMenuItem>.submenu-trigger:hover": {
			"color": "#1BB199 !important"
		},
		".sideMenuItemActive": {
			"background-color": "#1BB199 !important",
			"color": "#FFFFFF !important"
		},
		".sideMenuItemActive:hover": {
			"background": "rgba(27,177,153,0.25) !important",
			"color": "#FFFFFF"
		},
		".sidebarWrapper": {
			"background": "#3B4B54 !important",
			"color": "#FFFFFF"
		},
		".slideParameters": {
			"background-color": "#1BB199 !important",
			"color": "#FFFFFF !important"
		},
		".splash": {
			"background": "#3B4B54 !important",
			"box-shadow": "none"
		},
		".splashAbout": {
			"color": "#1BB199 !important"
		},
		".splashDetailedMessage": {
			"color": "#FFFFFF"
		},
		".splashLoader": {
			"background": "#3B4B54 !important",
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
			"color": "#FFFFFF"
		},
		".splashVerbal": {
			"color": "#1BB199 !important"
		},
		".split": {
			"background": "#3B4B54",
			"width": "4px"
		},
		".splitThumb": {
			"background": "#3B4B54"
		},
		".status": {
			"color": "#FFFFFF"
		},
		".statusContainer": {
			"background": "#3B4B54",
			"color": "#FFFFFF"
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
				"border-color": "#26343F",
				"color": "white",
				"margin-bottom": "2px"
			},
			"color": "#FFFFFF"
		},
		".titleActionContainer": {
			"background": "#3B4B54 !important",
			"color": "#FFFFFF"
		},
		".tooltip": {
			"background-color": "#1BB199 !important",
			"border-width": "1px",
			"border-style": "solid",
			"border-color": "#1BB199",
			"color": "#FFFFFF !important",
			"h2": {
				"color": "#FFFFFF !important"
			},
			".navlinkonpage": {
				"background-color": "#1BB199 !important",
				"color": "#FFFFFF !important"
			},
			".operationError": {
				"color": "#FFFFFF !important"
			}
		},
		".tooltipTailFromabove:after": {
			"border-top-color": "#1BB199"
		},
		".tooltipTailFromabove:before": {
			"border-top-color": "#1BB199"
		},
		".tooltipTailFrombelow:after": {
			"border-bottom-color": "#1BB199"
		},
		".tooltipTailFrombelow:before": {
			"border-bottom-color": "#1BB199"
		},
		".tooltipTailFromleft:after": {
			"border-left-color": "#1BB199"
		},
		".tooltipTailFromleft:before": {
			"border-left-color": "#1BB199"
		},
		".tooltipTailFromright:after": {
			"border-right-color": "#1BB199"
		},
		".tooltipTailFromright:before": {
			"border-right-color": "#1BB199"
		},
		".treeIterationCursorRow": {
			"background-color": "rgba(27,177,153,0.25)"
		},
		".treeIterationCursorRow_Dotted": {
			"background-color": "rgba(27,177,153,0.25)"
		},
		".treeTableRow": {
			"span.core-sprite-closedarrow:hover" : {
				"color": "#1BB199"
			},
			"span.core-sprite-openarrow:hover" : {
				"color": "#1BB199"
			}
		},
		".workingTarget": {
			"background-color": "#FFFFFF"
		},
		".commandImage.dropdownTrigger": {
			"color": "#FFFFFF"
		},
		".dropdownMenuItem": {
			"color": "#3B4B54"
		},
		".pageToolbar": {
			".dropdownTrigger:not(.dropdownDefaultButton)": {
				"color": "#3B4B54"
			}
		},
		".primaryButton:hover": {
			".primaryButton:focus": {
				"background": "#1BB199",
				"border-color": "#1BB199"
			}
		},
		".editorTabCloseButton:hover": {
			"background-color": "#1BB199",
			"color": "#FFFFFF"
		},
		".editorTab": {
			"border-top": "1px solid #26343F",
			"border-right": "1px solid #26343F"
		},
		".focusedEditorTab": {
			"background-color": "#26343F",
			"color": "#FFFFFF"
		}
	}
});
