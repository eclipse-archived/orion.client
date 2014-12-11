/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 ******************************************************************************/
//NLS_CHARSET=UTF-8
/*eslint-env amd*/
define({
	'error': 'Error',  //$NON-NLS-0$  //$NON-NLS-1$
	'warning' : 'Aviso',  //$NON-NLS-0$  //$NON-NLS-1$
	'ignore' : 'Omitir',  //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutline' : 'Esquema fuente', //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutlineTitle': 'Esquema de fuente JavaScript',  //$NON-NLS-0$  //$NON-NLS-1$
	'contentAssist' : 'Asistencia de contenido de JavaScript', //$NON-NLS-0$  //$NON-NLS-1$
	'eslintValidator' : 'Validador de JavaScript', //$NON-NLS-0$  //$NON-NLS-1$
	'missingCurly' : 'Sentencias no encerradas entre llaves:', //$NON-NLS-0$  //$NON-NLS-1$
	'noCaller' : 'Uso de \'arguments.caller\' o \'arguments.callee\' no recomendado:', //$NON-NLS-0$  //$NON-NLS-1$
	'noEqeqeq' : 'Uso de \'==\' no recomendado:', //$NON-NLS-0$  //$NON-NLS-1$
	'noDebugger' : 'Uso de la sentencia \'debugger\' no recomendado:', //$NON-NLS-0$  //$NON-NLS-1$
	'noEval' : 'Uso de \'eval()\' no recomendado:', //$NON-NLS-0$  //$NON-NLS-1$
	'noDupeKeys' : 'Claves de objeto duplicadas:', //$NON-NLS-0$  //$NON-NLS-1$
	'useIsNaN' : 'NaN no se compara con isNaN():', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncDecl' : 'No hay JSDoc en declaraciones de funciones:', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncExpr' : 'No hay JSDoc en expresiones de funciones:', //$NON-NLS-0$  //$NON-NLS-1$
	'noUnreachable' : 'Código no alcanzable:', //$NON-NLS-0$  //$NON-NLS-1$
	'noFallthrough' : 'Recorrido de casos switch:', //$NON-NLS-0$  //$NON-NLS-1$
	'useBeforeDefine' : 'Miembro utilizado antes de la definición:', //$NON-NLS-0$  //$NON-NLS-1$
	'noEmptyBlock' : 'Bloque vacío no documentado:', //$NON-NLS-0$  //$NON-NLS-1$
	'newParens' : 'Faltan paréntesis en la llamada de constructor:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewArray': '\'new Array()\' no recomendado:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewFunc': '\'new Function()\' no recomendado:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewObject': '\'new Object()\' no recomendado:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewWrappers': 'Objetos de envoltura no recomendados:', //$NON-NLS-0$  //$NON-NLS-1$
	'missingSemi' : 'Puntos y coma faltantes:', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedVars' : 'Variables no utilizadas:', //$NON-NLS-0$  //$NON-NLS-1$
	'varRedecl' : 'Redeclaraciones de variable:', //$NON-NLS-0$  //$NON-NLS-1$
	'varShadow': 'Copia continua de variable:', //$NON-NLS-0$  //$NON-NLS-1$
	'undefMember' : 'Referencia global no declarada:', //$NON-NLS-0$  //$NON-NLS-1$
	'unnecessarySemis' : 'Puntos y coma no necesarios:', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedParams' : 'Parámetros no utilizados:', //$NON-NLS-0$  //$NON-NLS-1$
	'unsupportedJSLint' : 'Directiva de entorno no soportada:',  //$NON-NLS-0$  //$NON-NLS-1$
	'throwError': 'No-error utilizado en \'throw\':',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocName' : 'Generar comentario de elemento',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocTooltip' : 'Generar un comentario de estilo JSDoc para el elemento JavaScript seleccionado',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclName' : 'Abrir declaración',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclTooltip' : 'Abrir la declaración del elemento seleccionado',  //$NON-NLS-0$  //$NON-NLS-1$
	'validTypeof': 'Comparación \'typeof\' no válida',  //$NON-NLS-0$ //$NON-NLS-1$
	'noSparseArrays': 'Declaraciones de matriz dispersa', //$NON-NLS-0$ //$NON-NLS-1$
	'jsHover': 'Proveedor de JavaScript Hover', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixName': 'Eliminar punto y coma extra', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixTooltip': 'Elimina el punto y coma que sobra', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixName': 'Añadir comentario $FALLTHROUGH$', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixTooltip': 'Añadir la línea de comentario $FALLTHROUGH$', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixName': 'Comentar bloque vacío', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixTooltip': 'Añadir un comentario TODO al bloque vacío', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixName': 'Añadir a directiva eslint-env', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixTooltip': 'Añadir a directiva eslint-env para filtrar el miembro conocido', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixName': 'Añadir a directiva global', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixTooltip': 'Añadir a directiva global para filtrar el miembro desconocido', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixName': 'Eliminar parámetro', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixTooltip': 'Eliminar el parámetro no utilizado, conservando efectos secundarios', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixName': 'Añadir @callback a función', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixTooltip': 'Documentar la función con @callback, pasando por alto los parámetros no utilizados', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixName': 'Actualizar operador', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixTooltip': 'Actualizar el operador con el esperado', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixName': 'Eliminar código no accesible', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixTooltip': 'Eliminar el código no accesible', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixName': 'Convertir en matriz normal', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixTooltip': 'Eliminar entradas dispersas y convertirlas en una matriz normal', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixName': 'Añadir \';\' que falta', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixTooltip': 'Añadir el signo \';\' que falta', //$NON-NLS-0$ //$NON-NLS-1$
	'radix': 'Falta parámetro radix en parseInt()', //$NON-NLS-0$ //$NON-NLS-1$
});

