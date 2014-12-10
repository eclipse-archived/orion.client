/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: 
 *		Felipe Heidrich (IBM Corporation) - initial API and implementation
 *		Silenio Quarti (IBM Corporation) - initial API and implementation
 ******************************************************************************/

//NLS_CHARSET=UTF-8

/*eslint-env browser, amd*/

define({
	"multipleAnnotations": "Varias anotaciones:", //$NON-NLS-1$ //$NON-NLS-0$
	"line": "Línea: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"breakpoint": "Punto de interrupción", //$NON-NLS-1$ //$NON-NLS-0$
	"bookmark": "Marcador", //$NON-NLS-1$ //$NON-NLS-0$
	"task": "Tarea", //$NON-NLS-1$ //$NON-NLS-0$
	"error": "Error", //$NON-NLS-1$ //$NON-NLS-0$
	"warning": "Aviso", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingSearch": "Búsqueda coincidente", //$NON-NLS-1$ //$NON-NLS-0$
	"currentSearch": "Búsqueda actual", //$NON-NLS-1$ //$NON-NLS-0$
	"currentLine": "Línea actual", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingBracket": "Corchete coincidente", //$NON-NLS-1$ //$NON-NLS-0$
	"currentBracket": "Corchete actual", //$NON-NLS-1$ //$NON-NLS-0$
	
	"lineUp": "Retroceso línea", //$NON-NLS-1$ //$NON-NLS-0$
	"lineDown": "Avance línea", //$NON-NLS-1$ //$NON-NLS-0$
	"lineStart": "Inicio de línea", //$NON-NLS-1$ //$NON-NLS-0$
	"lineEnd": "Final de línea", //$NON-NLS-1$ //$NON-NLS-0$
	"charPrevious": "Carácter anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"charNext": "Carácter siguiente", //$NON-NLS-1$ //$NON-NLS-0$
	"pageUp": "Retroceder página", //$NON-NLS-1$ //$NON-NLS-0$
	"pageDown": "Avanzar página", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageUp": "Desplazar página hacia arriba", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageDown": "Desplazar página hacia abajo", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineUp": "Desplazar línea hacia arriba", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineDown": "Desplazar línea hacia abajo", //$NON-NLS-1$ //$NON-NLS-0$
	"wordPrevious": "Palabra anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"wordNext": "Palabra siguiente", //$NON-NLS-1$ //$NON-NLS-0$
	"textStart": "Inicio de documento", //$NON-NLS-1$ //$NON-NLS-0$
	"textEnd": "Fin de documento", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextStart": "Desplazar a inicio de documento", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextEnd": "Desplazar a fin de documento", //$NON-NLS-1$ //$NON-NLS-0$
	"centerLine": "Línea central", //$NON-NLS-1$ //$NON-NLS-0$
	
	"selectLineUp": "Seleccionar línea de arriba", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineDown": "Seleccionar línea de abajo", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineUp": " Seleccionar línea de arriba completa", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineDown": "Seleccionar línea de abajo completa", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineStart": "Seleccionar hasta el inicio de línea", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineEnd": "Seleccionar hasta el final de línea", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharPrevious": "Seleccionar carácter anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharNext": "Seleccionar carácter siguiente", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageUp": "Seleccionar hasta el inicio de página", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageDown": "Seleccionar hasta el final de página", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordPrevious": "Seleccionar palabra anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordNext": "Seleccionar palabra siguiente", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextStart": "Seleccionar inicio de documento", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextEnd": "Seleccionar fin de documento", //$NON-NLS-1$ //$NON-NLS-0$

	"deletePrevious": "Suprimir carácter anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteNext": "Suprimir carácter siguiente", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordPrevious": "Suprimir palabra anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordNext": "Suprimir palabra siguiente", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineStart": "Suprimir inicio de línea", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineEnd": "Suprimir final de línea", //$NON-NLS-1$ //$NON-NLS-0$
	"tab": "Insertar tabulador", //$NON-NLS-1$ //$NON-NLS-0$
	"enter": "Insertar delimitador de línea", //$NON-NLS-1$ //$NON-NLS-0$
	"enterNoCursor": "Insertar delimitador de línea", //$NON-NLS-1$ //$NON-NLS-0$
	"selectAll": "Seleccionar todo", //$NON-NLS-1$ //$NON-NLS-0$
	"copy": "Copiar", //$NON-NLS-1$ //$NON-NLS-0$
	"cut": "Cortar", //$NON-NLS-1$ //$NON-NLS-0$
	"paste": "Pegar", //$NON-NLS-1$ //$NON-NLS-0$
	
	"uppercase": "En mayúsculas", //$NON-NLS-1$ //$NON-NLS-0$
	"lowercase": "En minúsculas", //$NON-NLS-1$ //$NON-NLS-0$
	"capitalize": "Mayúscula inicial", //$NON-NLS-1$ //$NON-NLS-0$
	"reversecase" : "Invertir mayúsculas/minúsculas", //$NON-NLS-1$ //$NON-NLS-0$
	
	"toggleWrapMode": "Conmutar modalidad de recorte", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleTabMode": "Conmutar modalidad de tabulación", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleOverwriteMode": "Conmutar modalidad de sobrescritura", //$NON-NLS-1$ //$NON-NLS-0$
	
	"committerOnTime": "${0} en ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//Emacs
	"emacs": "Emacs", //$NON-NLS-1$ //$NON-NLS-0$
	"exchangeMarkPoint": "Intercambiar marca y punto", //$NON-NLS-1$ //$NON-NLS-0$
	"setMarkCommand": "Establecer marca", //$NON-NLS-1$ //$NON-NLS-0$
	"clearMark": "Borrar marca", //$NON-NLS-1$ //$NON-NLS-0$
	"digitArgument": "Argumento de dígito ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"negativeArgument": "Argumento negativo", //$NON-NLS-1$ //$NON-NLS-0$
			
	"Comment": "Comentario", //$NON-NLS-1$ //$NON-NLS-0$
	"Flat outline": "Esquema plano", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStr": "Búsqueda incremental: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStrNotFound": "Búsqueda incremental: ${0} (no encontrado)", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStr": "Búsqueda incremental inversa: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStrNotFound": "Búsqueda incremental inversa: ${0} (no encontrado)", //$NON-NLS-1$ //$NON-NLS-0$
	"find": "Buscar...", //$NON-NLS-1$ //$NON-NLS-0$
	"undo": "Deshacer", //$NON-NLS-1$ //$NON-NLS-0$
	"redo": "Rehacer", //$NON-NLS-1$ //$NON-NLS-0$
	"cancelMode": "Cancelar modalidad actual", //$NON-NLS-1$ //$NON-NLS-0$
	"findNext": "Buscar siguiente aparición", //$NON-NLS-1$ //$NON-NLS-0$
	"findPrevious": "Buscar aparición anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFind": "Búsqueda incremental", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverse": "Búsqueda incremental inversa", //$NON-NLS-1$ //$NON-NLS-0$
	"indentLines": "Sangrar líneas", //$NON-NLS-1$ //$NON-NLS-0$
	"unindentLines": "Deshacer sangrado de líneas", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesUp": "Subir líneas", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesDown": "Bajar líneas", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesUp": "Copiar líneas arriba", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesDown": "Copiar líneas abajo", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLines": "Suprimir líneas", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "Ir a línea...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompty": "Ir a línea:", //$NON-NLS-1$ //$NON-NLS-0$
	"nextAnnotation": "Siguiente anotación", //$NON-NLS-1$ //$NON-NLS-0$
	"prevAnnotation": "Anotación anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"expand": "Expandir", //$NON-NLS-1$ //$NON-NLS-0$
	"collapse": "Contraer", //$NON-NLS-1$ //$NON-NLS-0$
	"expandAll": "Expandir todo", //$NON-NLS-1$ //$NON-NLS-0$
	"collapseAll": "Contraer todo", //$NON-NLS-1$ //$NON-NLS-0$
	"lastEdit": "Última ubicación de edición", //$NON-NLS-1$ //$NON-NLS-0$
	"trimTrailingWhitespaces": "Recortar espacios en blanco finales", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleLineComment": "Conmutar comentario de línea", //$NON-NLS-1$ //$NON-NLS-0$
	"addBlockComment": "Añadir comentario de bloque", //$NON-NLS-1$ //$NON-NLS-0$
	"removeBlockComment": "Eliminar comentario de bloque", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeEntered": "Modalidad enlazada en la que se ha entrado", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeExited": "Modalidad enlazada de la que se ha salido", //$NON-NLS-1$ //$NON-NLS-0$
	"syntaxError": "Error de sintaxis", //$NON-NLS-1$ //$NON-NLS-0$
	"contentAssist": "Asistencia de contenido", //$NON-NLS-1$ //$NON-NLS-0$
	"lineColumn": "Línea ${0} : Col ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//vi
	"vi": "vi", //$NON-NLS-1$ //$NON-NLS-0$
	"vimove": "(Mover)", //$NON-NLS-1$ //$NON-NLS-0$
	"viyank": "(Copiar)", //$NON-NLS-1$ //$NON-NLS-0$
	"videlete": "(Suprimir)", //$NON-NLS-1$ //$NON-NLS-0$
	"vichange": "(Cambiar)", //$NON-NLS-1$ //$NON-NLS-0$
	"viLeft": "${0} Izquierda", //$NON-NLS-1$ //$NON-NLS-0$
	"viRight": "${0} Derecha", //$NON-NLS-1$ //$NON-NLS-0$
	"viUp": "${0} Arriba", //$NON-NLS-1$ //$NON-NLS-0$
	"viDown": "${0} Abajo", //$NON-NLS-1$ //$NON-NLS-0$
	"viw": "${0} Palabra siguiente", //$NON-NLS-1$ //$NON-NLS-0$
	"vib": "${0} Inicio de palabra", //$NON-NLS-1$ //$NON-NLS-0$
	"viW": "${0} Palabra siguiente (detención de ws)", //$NON-NLS-1$ //$NON-NLS-0$
	"viB": "${0} Inicio de palabra (detención de ws)", //$NON-NLS-1$ //$NON-NLS-0$
	"vie": "${0} Fin de palabra", //$NON-NLS-1$ //$NON-NLS-0$
	"viE": "${0} Fin de palabra (detención de ws)", //$NON-NLS-1$ //$NON-NLS-0$
	"vi$": "${0} Fin de la línea", //$NON-NLS-1$ //$NON-NLS-0$
	"vi^_": "${0} Primer carácter no en blanco de línea actual", //$NON-NLS-1$ //$NON-NLS-0$
	"vi+": "${0} Primer carácter de línea siguiente", //$NON-NLS-1$ //$NON-NLS-0$
	"vi-": "${0} Primer carácter de línea anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"vi|": "${0} Enésima columna de la línea", //$NON-NLS-1$ //$NON-NLS-0$
	"viH": "${0} Inicio de página", //$NON-NLS-1$ //$NON-NLS-0$
	"viM": "${0} Mitad de página", //$NON-NLS-1$ //$NON-NLS-0$
	"viL": "${0} Final de página", //$NON-NLS-1$ //$NON-NLS-0$
	"vi/": "${0} Buscar hacia delante", //$NON-NLS-1$ //$NON-NLS-0$
	"vi?": "${0} Buscar hacia atrás", //$NON-NLS-1$ //$NON-NLS-0$
	"vin": "${0} Búsqueda siguiente", //$NON-NLS-1$ //$NON-NLS-0$
	"viN": "${0} Búsqueda anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"vif": "${0} Buscar carácter hacia delante", //$NON-NLS-1$ //$NON-NLS-0$
	"viF": "${0} Buscar carácter hacia atrás", //$NON-NLS-1$ //$NON-NLS-0$
	"vit": "${0} Buscar antes de carácter hacia delante", //$NON-NLS-1$ //$NON-NLS-0$
	"viT": "${0} Buscar antes de carácter hacia atrás", //$NON-NLS-1$ //$NON-NLS-0$
	"vi,": "${0} Repetir búsqueda de carácter inversa", //$NON-NLS-1$ //$NON-NLS-0$
	"vi;": "${0} Repetir búsqueda de carácter", //$NON-NLS-1$ //$NON-NLS-0$
	"viG": "${0} Ir a línea", //$NON-NLS-1$ //$NON-NLS-0$
	"viycd": "${0} Línea actual", //$NON-NLS-1$ //$NON-NLS-0$
	"via": "Añadir tras cursor", //$NON-NLS-1$ //$NON-NLS-0$
	"viA": "Añadir al final de línea", //$NON-NLS-1$ //$NON-NLS-0$
	"vii": "Insertar antes de cursor", //$NON-NLS-1$ //$NON-NLS-0$
	"viI": "Insertar al principio de la línea", //$NON-NLS-1$ //$NON-NLS-0$
	"viO": "Insertar línea encima", //$NON-NLS-1$ //$NON-NLS-0$
	"vio": "Insertar línea debajo", //$NON-NLS-1$ //$NON-NLS-0$
	"viR": "Empezar a sobrescribir texto", //$NON-NLS-1$ //$NON-NLS-0$
	"vis": "Sustituir un carácter", //$NON-NLS-1$ //$NON-NLS-0$
	"viS": "Sustituir toda la línea", //$NON-NLS-1$ //$NON-NLS-0$
	"viC": "Cambiar texto hasta el final de la línea", //$NON-NLS-1$ //$NON-NLS-0$
	"vip": "Pegar detrás del carácter o la línea", //$NON-NLS-1$ //$NON-NLS-0$
	"viP": "Pegar antes del carácter o la línea", //$NON-NLS-1$ //$NON-NLS-0$
	"viStar": "Buscar palabra bajo cursor", //$NON-NLS-1$ //$NON-NLS-0$
	
	"next": "Siguiente", //$NON-NLS-1$ //$NON-NLS-0$
	"previous": "Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"replace": "Sustituir", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceAll": "Sustituir todo", //$NON-NLS-1$ //$NON-NLS-0$
	"findWith": "Buscar con", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceWith": "Sustituir por", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitive": "Aa", //$NON-NLS-1$ //$NON-NLS-0$
	"regex": "/.*/", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWord": "\\b", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitiveTooltip": "Conmutar insensibilidad a mayúsculas/minúsculas", //$NON-NLS-1$ //$NON-NLS-0$
	"regexTooltip": "Conmutar expresión regular", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWordTooltip": "Conmutar palabra completa", //$NON-NLS-1$ //$NON-NLS-0$
	"closeTooltip": "Cerrar", //$NON-NLS-1$ //$NON-NLS-0$

	"replacingAll": "Sustituir todo...", //$NON-NLS-1$ //$NON-NLS-0$
	"replacedMatches": "Se han sustituido ${0} coincidencias", //$NON-NLS-1$ //$NON-NLS-0$
	"nothingReplaced": "Nada sustituido", //$NON-NLS-1$ //$NON-NLS-0$
	"notFound": "No encontrado" //$NON-NLS-1$ //$NON-NLS-0$
});

