/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 ******************************************************************************/

/*eslint-env browser, amd*/
//NLS_CHARSET=UTF-8

define({
	"Editor": "Editor", //$NON-NLS-1$ //$NON-NLS-0$
	"switchEditor": "Conmutar editor", //$NON-NLS-1$ //$NON-NLS-0$
	"Fetching": "Captando: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"confirmUnsavedChanges": "Hay cambios no guardados. ¿Desea salir de todos modos?", //$NON-NLS-1$ //$NON-NLS-0$
	"searchFiles": "Búsqueda rápida...", //$NON-NLS-1$ //$NON-NLS-0$
	"searchTerm": "Especifique el término de búsqueda:", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedChanges": "Hay cambios no guardados.", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedAutoSaveChanges": "Permanezca en la página hasta que el Guardado automático haya finalizado.", //$NON-NLS-1$ //$NON-NLS-0$
	"Save": "Guardar", //$NON-NLS-1$ //$NON-NLS-0$
	"Saved": "Guardado", //$NON-NLS-1$ //$NON-NLS-0$
	"Blame": "Culpa", //$NON-NLS-1$ //$NON-NLS-0$
	"BlameTooltip":"Mostrar anotaciones de culpa", //$NON-NLS-1$ //$NON-NLS-0$
	"saveOutOfSync": "El recurso no está sincronizado con el servidor. ¿Desea guardarlo de todos modos?", //$NON-NLS-1$ //$NON-NLS-0$
	"loadOutOfSync": "El recurso no está sincronizado con el servidor. ¿Desea cargarlo de todos modos? Se sobrescribirán los cambios locales.", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadata": "Leyendo metadatos de ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadataError": "No se pueden obtener los metadatos de ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"Reading": "Leyendo ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"readonly": "Solo de lectura.", //$NON-NLS-1$ //$NON-NLS-0$
	"saveFile": "Guardar este archivo", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleZoomRuler": "Conmutar regla de zoom", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "Ir a la línea...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLineTooltip": "Ir al número de línea especificado", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompt": "Ir a la línea:", //$NON-NLS-1$ //$NON-NLS-0$
	"Undo": "Deshacer", //$NON-NLS-1$ //$NON-NLS-0$
	"Redo": "Rehacer", //$NON-NLS-1$ //$NON-NLS-0$
	"Find": "Buscar...", //$NON-NLS-1$ //$NON-NLS-0$
	"noResponse": "No hay respuesta del servidor. Compruebe la conexión de Internet e inténtelo de nuevo.", //$NON-NLS-1$ //$NON-NLS-0$
	"savingFile": "Guardando archivo ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"running": "Ejecutando ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"Saving..." : "Guardando...", //$NON-NLS-1$ //$NON-NLS-0$
	"View": "Ver", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanel": "Panel lateral", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanelTooltip": "Elija qué desea mostrar en el panel lateral.", //$NON-NLS-1$ //$NON-NLS-0$
	"Slideout": "Deslizar", //$NON-NLS-1$ //$NON-NLS-0$
	"Actions": "Acciones", //$NON-NLS-1$ //$NON-NLS-0$
	"Navigator": "Navegador", //$NON-NLS-1$ //$NON-NLS-0$
	"FolderNavigator": "Navegador de carpeta", //$NON-NLS-1$ //$NON-NLS-0$
	"Project": "Proyecto", //$NON-NLS-1$ //$NON-NLS-0$
	"New": "Nuevo", //$NON-NLS-1$ //$NON-NLS-0$
	"File": "Archivo", //$NON-NLS-1$ //$NON-NLS-0$
	"Edit": "Editar", //$NON-NLS-1$ //$NON-NLS-0$
	"Tools": "Herramientas", //$NON-NLS-1$ //$NON-NLS-0$
	"Add": "Añadir", //$NON-NLS-1$ //$NON-NLS-0$
	"noActions": "No hay acciones para la selección actual.", //$NON-NLS-1$ //$NON-NLS-0$
	"NoFile": "Utilizar ${0} para crear nuevos archivos y carpetas. Pulse un archivo para iniciar la codificación.", //$NON-NLS-1$ //$NON-NLS-0$
	"LocalEditorSettings": "Valores del editor local", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProject": "${0} no es un proyecto. Para convertirlo en un proyecto, utilice ${1}.", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProjects": "No hay proyectos en el espacio de trabajo. Utilice el menú ${0} para crear proyectos.", //$NON-NLS-1$ //$NON-NLS-0$
	"Disconnected": "${0} (desconectado)", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFS": "Elegir sistema de archivos", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFSTooltip": "Elija el sistema de archivos que desea ver.", //$NON-NLS-1$ //$NON-NLS-0$
	"FSTitle": "${0} (${1})", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy": "Desplegar", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy As": "Desplegar como", //$NON-NLS-1$ //$NON-NLS-0$
	"Import": "Importar", //$NON-NLS-1$ //$NON-NLS-0$
	"Export": "Exportar", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenWith": "Abrir con", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenRelated": "Abrir relacionado", //$NON-NLS-1$ //$NON-NLS-0$
	"Dependency": "Dependencia", //$NON-NLS-1$ //$NON-NLS-0$
	"UnnamedCommand": "Sin nombre", //$NON-NLS-1$ //$NON-NLS-0$
	"searchInFolder": "Buscar en carpeta...",  //$NON-NLS-1$ //$NON-NLS-0$
	"Global Search": "Búsqueda global...", //$NON-NLS-1$ //$NON-NLS-0$
	"ClickEditLabel": "Pulse para editar", //$NON-NLS-1$ //$NON-NLS-0$
	"ProjectInfo": "Información de proyecto", //$NON-NLS-1$ //$NON-NLS-0$
	"DeployInfo": "Información de despliegue", //$NON-NLS-1$ //$NON-NLS-0$
	"Name": "Nombre", //$NON-NLS-1$ //$NON-NLS-0$
	"Description": "Descripción", //$NON-NLS-1$ //$NON-NLS-0$
	"Site": "Sitio", //$NON-NLS-1$ //$NON-NLS-0$
	'projectsSectionTitle': 'Proyectos',  //$NON-NLS-0$  //$NON-NLS-1$
	'listingProjects': 'Listando proyectos...',  //$NON-NLS-0$  //$NON-NLS-1$
	'gettingWorkspaceInfo': 'Obteniendo información de espacio de trabajo...',  //$NON-NLS-0$  //$NON-NLS-1$
	"showProblems": "Mostrar problemas...",  //$NON-NLS-1$ //$NON-NLS-0$
});

