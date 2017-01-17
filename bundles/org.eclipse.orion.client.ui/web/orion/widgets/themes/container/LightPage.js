/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Casey Flynn - Google Inc - initial API and implementation
 ******************************************************************************/
 /*eslint-env browser,amd*/
define({
	"className": "lightPage",
	"name": "lightPage",
	"styles": {
		"#configSection": {
			"background-color": "#FFFFFF !important",
			"color": "#000000 !important"
		},
		"#log": {
			"margin": "5px",
			"width": "calc(100% - 17px)"
		},
		".auxpane": {
			"background": "#C4C5C8 !important"
		},
		".checkedRow": {
			"background-color": "#3D72B3 !important",
			"color": "#FFFFFF !important",
			".commandButton": {
				"border-color": "#FFFFFF",
				"color": "#FFFFFF"
			},
			".commandButton:not(.primaryButton):focus": {
				"background": "rgba(61,114,179,0.50)",
				"box-shadow": "0 1px 2px 0 rgb(61, 114, 179)",
				"color": "#000000"
			},
			".commandButton:not(.primaryButton):hover": {
				"background": "rgba(61,114,179,0.50)",
				"box-shadow": "0 1px 2px 0 rgb(61, 114, 179)",
				"color": "#000000"
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
			"border-color": "#3D72B3",
			"color": "#3D72B3"
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
			"color": "#000000"
		},
		".commandButton:not(.primaryButton):hover": {
			"background-color": "rgba(61,114,179,0.25)",
			"box-shadow": "0 1px 2px 0 rgb(61, 114, 179)",
			"color": "#000000"
		},
		".content-fixedHeight": {
			"background": "#C4C5C8 !important"
		},
		".core-sprite-error": {
			"color": "red"
		},
		".dialogTitle": {
			"background-color": "#3D72B3 !important",
			"color": "#FFFFFF !important"
		},
		".dropdownButtonWithIcon": {
			"color": "#152935 !important"
		},
		".dropdownCommandName": {
			"color": "#000000 !important"
		},
		".dropdownArrowRight" : {
			"color": "#000000 !important"
		},
		".dropdownMenu": {
			".dropdownMenuItemSelected": {
				"background": "rgba(61,114,179,0.25)",
				"border-left-color": "#3D72B3"
			}
		},
		".dropdownTrigger:not(.dropdownDefaultButton)": {
			"color": "#152935 !important"
		},
		".editorViewerHeader": {
			"background": "#F5F7FA !important",
			"border-bottom-width": "1px",
			"border-bottom-style": "solid",
			"border-bottom-color": "#F5F7FA",
			"color": "#152935 !important"
		},
		".filesystemName": {
			"color": "#152935 !important"
		},
		".fixedToolbarHolder": {
			"background": "#FFFFFF"
		},
		".gitCommitMessage": {
			"gitCommitMessageTopRow": {
				"border-width": "1px",
				"border-style": "solid",
				"border-color": "rgb(61, 114, 179)"
			},
			".gitCommitMessageTopRow": {
				"border-color": "#3D72B3"
			}
		},
		".gitCommitMessageSection": {
			"background-color": "rgba(61,114,179,0.25)"
		},
		".gitCommitMore": {
			"color": "#3D72B3 !important"
		},
		".gitStatusIcon": {
			"color": "#3D72B3 !important"
		},
		".gitStatusSection": {
			"background-color": "rgba(61,114,179,0.25)"
		},
		".gitStatusTitle": {
			"color": "#3D72B3 !important"
		},
		".label.parameterInput": {
			"color": "#FFFFFF !important"
		},
		".launchConfigurationMenuItem.dropdownMenuItemActive": {
			"background": "#F5F7FA"
		},
		".launchConfigurationsButton": {
			".commandButton.orionButton.dropdownTrigger": {
				"color": "#FFFFFF !important"
			}
		},
		".launchConfigurationsWrapper>.launchConfigurationsButton.dropdownTrigger": {
			"background-color": "#3D72B3 !important",
			"color": "#FFFFFF !important"
		},
		".launchConfsDropdown": {
			".dropdownDefaultButton": {
				"background-color": "#3D72B3 !important",
				"color": "#FFFFFF !important"
			}
		},
		".launchConfsLabel": {
			"background-color": "#3D72B3 !important",
			"color": "#FFFFFF !important"
		},
		".liveUpdateLabel": {
			"color": "#3D72B3 !important"
		},
		".mainToolbar": {
			"background-color": "#FFFFFF",
			"color": "#152935 !important",
			".commandButton.orionButton.dropdownTrigger": {
				"border-color": "#FFFFFF",
				"color": "#000000 !important",
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
				"color": "rgb(21, 41, 53) !important"
			},
			".gitSectionLabel": {
				"background-color": "#3D72B3 !important",
				"color": "#FFFFFF !important"
			},
			".sectionWrapper": {
				"background-color": "#3D72B3 !important",
				"color": "#FFFFFF !important"
			}
		},
		".mainpane": {
			"background": "#C4C5C8 !important"
		},
		".navbar-item-selected": {
			"background-color": "#3D72B3 !important",
			"color": "#FFFFFF !important"
		},
		".orionSwitchLabel": {
			"background-color": "#3D72B3 !important",
			"color": "#FFFFFF !important"
		},
		".outlineExplorer": {
			".treeIterationCursorRow_Dotted": {
				"background-color": "#3D72B3 !important",
				"color": "#FFFFFF !important"
			}
		},
		".primaryButton": {
			"background-color": "#3D72B3 !important",
			"border-width": "1px",
			"border-style": "solid",
			"border-color": "#3D72B3 !important",
			"border-radius": "0 !important",
			"color": "#FFFFFF !important"
		},
		".primaryButton:hover,": {
			".primaryButton:focus": {
				"background": "rgb(61, 114, 179)",
				"border-color": "rgb(61, 114, 179)"
			}
		},
		".projectNavColumn": {
			"color": "#000000"
		},
		".searchResultsWrapperDiv": {
			".selectableNavRow:hover": {
				"background": "rgba(61,114,179,0.25)",
				"border-left-color": "#3D72B3"
			}
		},
		".sectionTable": {
			"background-color": "#FFFFFF",
			".preview_td": {
				"border-bottom": "1px solid #F5F7FA",
				"color": "#152935"
			}
		},
		".sideMenu": {
			"background-color": "#FFFFFF"
		},
		".sideMenuItem": {
			"color": "#152935 !important"
		},
		".sideMenuItem>.submenu-trigger:hover": {
			"color": "#3D72B3 !important"
		},
		".sideMenuItemActive": {
			"background-color": "#3D72B3 !important",
			"color": "#FFFFFF !important"
		},
		".sideMenuItemActive:hover": {
			"background": "rgba(61,114,179,0.25) !important",
			"color": "#FFFFFF"
		},
		".sidebarWrapper": {
			"background": "#F5F7FA !important",
			"color": "#000000"
		},
		".slideParameters": {
			"background-color": "#3D72B3 !important",
			"color": "#FFFFFF !important"
		},
		".splash": {
			"background": "#F5F7FA !important",
			"box-shadow": "none"
		},
		".splashAbout": {
			"color": "#3D72B3 !important"
		},
		".splashDetailedMessage": {
			"color": "#000000"
		},
		".splashLoader": {
			"background": "#F5F7FA !important",
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
			"color": "#000000"
		},
		".splashVerbal": {
			"color": "#3D72B3 !important"
		},
		".split": {
			"background": "#C4C5C8",
			"width": "4px"
		},
		".splitThumb": {
			"background": "#C4C5C8"
		},
		".status": {
			"color": "#000000"
		},
		".statusContainer": {
			"background": "#F5F7FA",
			"color": "#000000"
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
				"border-color": "#FFFFFF",
				"color": "white",
				"margin-bottom": "2px"
			},
			"color": "#FFFFFF"
		},
		".titleActionContainer": {
			"background": "#F5F7FA !important",
			"color": "#000000"
		},
		".tooltip": {
			"background-color": "#3D72B3 !important",
			"border-width": "1px",
			"border-style": "solid",
			"border-color": "#3D72B3",
			"color": "#FFFFFF !important",
			"h2": {
				"color": "#FFFFFF !important"
			},
			".navlinkonpage": {
				"background-color": "#3D72B3 !important",
				"color": "#FFFFFF !important"
			},
			".operationError": {
				"color": "#FFFFFF !important"
			}
		},
		".tooltipTailFromabove:after": {
			"border-top-color": "#3D72B3"
		},
		".tooltipTailFromabove:before": {
			"border-top-color": "#3D72B3"
		},
		".tooltipTailFrombelow:after": {
			"border-bottom-color": "#3D72B3"
		},
		".tooltipTailFrombelow:before": {
			"border-bottom-color": "#3D72B3"
		},
		".tooltipTailFromleft:after": {
			"border-left-color": "#3D72B3"
		},
		".tooltipTailFromleft:before": {
			"border-left-color": "#3D72B3"
		},
		".tooltipTailFromright:after": {
			"border-right-color": "#3D72B3"
		},
		".tooltipTailFromright:before": {
			"border-right-color": "#3D72B3"
		},
		".treeIterationCursorRow": {
			"background-color": "rgba(61,114,179,0.25)"
		},
		".treeIterationCursorRow_Dotted": {
			"background-color": "rgba(61,114,179,0.25)"
		},
		".treeTableRow": {
			"span.core-sprite-closedarrow:hover" : {
				"color": "#3D72B3"
			},
			"span.core-sprite-openarrow:hover" : {
				"color": "#3D72B3"
			}
		},
		".workingTarget": {
			"background-color": "#FFFFFF"
		},
		".commandImage.dropdownTrigger": {
			"color": "#152935"
		},
		".dropdownMenuItem": {
			"color": "#F5F7FA"
		},
		".pageToolbar": {
			".dropdownTrigger:not(.dropdownDefaultButton)": {
				"color": "#C4C5C8"
			}
		},
		".primaryButton:hover": {
			".primaryButton:focus": {
				"background": "#3D72B3",
				"border-color": "#3D72B3"
			}
		}
	}
});
