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
		".desktopmode": {
			".selectableNavRow:hover": {
				"background-color": "rgba(0, 123, 79, 0.25)"
			}
		},
		".checkedRow": {
			"background-color": "#007b4f !important",
			"color": "#FFFFFF !important",
			".commandButton": {
				"border-color": "white",
				"color": "#FFFFFF"
			},
			".commandButton:not(.primaryButton):focus": {
				"background": "rgba(0, 123, 79,0.50)",
				"box-shadow": "0 1px 2px 0 rgb(0, 123, 79)",
				"color": "#FFFFFF"
			},
			".commandButton:not(.primaryButton):hover": {
				"background": "rgba(0, 123, 79,0.50)",
				"box-shadow": "0 1px 2px 0 rgb(0, 123, 79)",
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
			"border-color": "#007b4f",
			"color": "#007b4f"
		},
		".commandButton.disabled": {
			"color": "#cdcdcd"
		},
		".commandButton.orionButton.dropdownTrigger:hover": {
			"border-color": "#ccc"
		},
		".commandButton:not(.primaryButton):focus": {
			"background-color": "rgba(0, 123, 79,0.25)",
			"box-shadow": "0 1px 2px 0 rgb(0, 123, 79)",
			"color": "#FFFFFF"
		},
		".commandButton:not(.primaryButton):hover": {
			"background-color": "rgba(0, 123, 79,0.25)",
			"box-shadow": "0 1px 2px 0 rgb(0, 123, 79)",
			"color": "#FFFFFF"
		},
		".content-fixedHeight": {
			"background": "#3B4B54 !important"
		},
		".core-sprite-error": {
			"color": "red"
		},
		".dialogTitle": {
			"background-color": "#007b4f !important",
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
				"background": "rgba(0, 123, 79,0.25)",
				"border-left-color": "#007b4f"
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
				"border-color": "#007b4f"
			},
			".gitCommitMore":{
				"color": "#004e00 !important"
			}
		},
		".gitCommitMessageSection": {
			"background-color": "rgba(0, 123, 79,0.25)"
		},
		".gitCommitMore": {
			"color": "#006800 !important"
		},
		".gitStatusIcon": {
			"color": "#007b4f !important"
		},
		".gitStatusSection": {
			"background-color": "rgba(0, 123, 79,0.25)",
			".stretch":{
				"color": "#5e5e5e"
			}
		},
		".gitChangeListCheckLabel":{
			"color": "#5e5e5e"
		},
		".gitChangeListChangedStatus":{
			"color": "#5e5e5e"
		},
		".gitStatusTitle": {
			"color": "#005200 !important"
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
			"background-color": "#007b4f !important",
			"color": "#FFFFFF !important"
		},
		".launchConfsDropdown": {
			".dropdownDefaultButton": {
				"background-color": "#007b4f !important",
				"color": "#FFFFFF !important"
			}
		},
		".launchConfsLabel": {
			"background-color": "#007b4f !important",
			"color": "#FFFFFF !important"
		},
		".liveUpdateLabel": {
			"color": "#007b4f !important"
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
				"background-color": "#007B4F !important",
				"color": "#FFFFFF !important"
			},
			".sectionWrapper": {
				"background-color": "#007b4f !important",
				"color": "#FFFFFF !important"
			}
		},
		".mainpane": {
			"background": "#3B4B54 !important"
		},
		".navbar-item-selected": {
			"background-color": "#007b4f !important",
			"color": "#FFFFFF !important"
		},
		".orionSwitchLabel": {
			"background-color": "#007b4f !important",
			"color": "#FFFFFF !important"
		},
		".outlineExplorer": {
			".treeIterationCursorRow_Dotted": {
				"background-color": "#007b4f !important",
				"color": "#FFFFFF !important"
			}
		},
		".primaryButton": {
			"background-color": "#007b4f !important",
			"border-width": "1px",
			"border-style": "solid",
			"border-color": "#007b4f !important",
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
				"background": "rgba(0, 123, 79,0.25)",
				"border-left-color": "#007b4f"
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
			"color": "#007b4f !important"
		},
		".sideMenuItemActive": {
			"background-color": "#007b4f !important",
			"color": "#FFFFFF !important"
		},
		".sideMenuItemActive:hover": {
			"background": "rgba(0, 123, 79,0.25) !important",
			"color": "#FFFFFF"
		},
		".sidebarWrapper": {
			"background": "#3B4B54 !important",
			"color": "#FFFFFF"
		},
		".slideParameters": {
			"background-color": "#007b4f !important",
			"color": "#FFFFFF !important"
		},
		".splash": {
			"background": "#3B4B54 !important",
			"box-shadow": "none"
		},
		".splashAbout": {
			"color": "#007b4f !important"
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
			"color": "#007b4f !important"
		},
		".split": {
			"background": "#3B4B54"
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
				"border": "1px solid white",
				"border-color": "white",
				"color": "white",
				"margin-bottom": "2px"
			},
			"color": "#FFFFFF",
			"background-color": "rgb(27, 177, 153)",
			".commandButton:not(.primaryButton):hover":{
				"color": "white",
    			"background-color": "rgba(59, 75, 84,0.25)"
			},
			".commandButton:not(.primaryButton):focus":{
				"color": "white",
    			"background-color": "rgba(59, 75, 84,0.25)"			
    		}
		},
		".titleActionContainer": {
			"background": "#3B4B54 !important",
			"color": "#FFFFFF"
		},
		".tooltip": {
			"background-color": "#007b4f !important",
			"border-width": "1px",
			"border-style": "solid",
			"border-color": "#007b4f",
			"color": "#FFFFFF !important",
			"h2": {
				"color": "#FFFFFF !important"
			},
			".navlinkonpage": {
				"background-color": "#007b4f !important",
				"color": "#FFFFFF !important"
			},
			".operationError": {
				"color": "#FFFFFF !important"
			}
		},
		".tooltipTailFromabove:after": {
			"border-top-color": "#007b4f"
		},
		".tooltipTailFromabove:before": {
			"border-top-color": "#007b4f"
		},
		".tooltipTailFrombelow:after": {
			"border-bottom-color": "#007b4f"
		},
		".tooltipTailFrombelow:before": {
			"border-bottom-color": "#007b4f"
		},
		".tooltipTailFromleft:after": {
			"border-left-color": "#007b4f"
		},
		".tooltipTailFromleft:before": {
			"border-left-color": "#007b4f"
		},
		".tooltipTailFromright:after": {
			"border-right-color": "#007b4f"
		},
		".tooltipTailFromright:before": {
			"border-right-color": "#007b4f"
		},
		".treeIterationCursorRow": {
			"background-color": "rgba(0, 123, 79,0.25)"
		},
		".treeIterationCursorRow_Dotted": {
			"background-color": "rgba(0, 123, 79,0.25)"
		},
		".treeTableRow": {
			"span.core-sprite-closedarrow:hover" : {
<<<<<<< HEAD
				"color": "#707070",
				"background-color": "#A5B5BC"
			},
			"span.core-sprite-openarrow:hover" : {
				"color": "#707070",
				"background-color": "#A5B5BC"
			}
		},
		".treeTableRow.checkedRow": {
			"span.core-sprite-closedarrow:hover" : {
				"color": "white",
				"background-color": "#A5B5BC"
			},
			"span.core-sprite-openarrow:hover" : {
				"color": "white",
				"background-color": "#A5B5BC"
=======
				"color": "#007b4f"
			},
			"span.core-sprite-openarrow:hover" : {
				"color": "#007b4f"
>>>>>>> 131322f2c83f10945227eab109e0d886ec5e95d8
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
				"background": "#007b4f",
				"border-color": "#007b4f"
			}
		},
		".editorTabCloseButton:hover": {
			"background-color": "rgba(0, 123, 79, 1)",
			"color": "#FFFFFF"
		},
		".editorTab": {
			"border-top": "1px solid #26343F",
			"border-right": "1px solid #26343F"
		},
		".focusedEditorTab": {
			"background-color": "#26343F",
			"color": "#FFFFFF"
		},
		".contentassist .selected":{
			"background-color": "#1BB199",
			"background": "#1BB199"
		}
	}
});
