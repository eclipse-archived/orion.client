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
	'error': 'Fehler',  //$NON-NLS-0$  //$NON-NLS-1$
	'warning' : 'Warnung',  //$NON-NLS-0$  //$NON-NLS-1$
	'ignore' : 'Ignorieren',  //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutline' : 'Gliederung der Quelle', //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutlineTitle': 'Gliederung der JavaScript-Quelle',  //$NON-NLS-0$  //$NON-NLS-1$
	'contentAssist' : 'JavaScript-Inhaltshilfe', //$NON-NLS-0$  //$NON-NLS-1$
	'eslintValidator' : 'JavaScript-Prüfprogramm', //$NON-NLS-0$  //$NON-NLS-1$
	'missingCurly' : 'Nicht in geschweifte Klammern eingeschlossene Anweisungen:', //$NON-NLS-0$  //$NON-NLS-1$
	'noCaller' : 'Verwendung von \'arguments.caller\' oder \'arguments.callee\' nicht empfohlen:', //$NON-NLS-0$  //$NON-NLS-1$
	'noEqeqeq' : 'Verwendung von \'==\' nicht empfohlen:', //$NON-NLS-0$  //$NON-NLS-1$
	'noDebugger' : 'Verwendung der Anweisung \'debugger\' nicht empfohlen:', //$NON-NLS-0$  //$NON-NLS-1$
	'noEval' : 'Verwendung von \'eval()\' nicht empfohlen:', //$NON-NLS-0$  //$NON-NLS-1$
	'noDupeKeys' : 'Objektschlüssel doppelt vorhanden:', //$NON-NLS-0$  //$NON-NLS-1$
	'useIsNaN' : '\'NaN\' nicht verglichen mit \'isNaN()\':', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncDecl' : 'Kein JSDoc bei Funktionsdeklarationen:', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncExpr' : 'Kein JSDoc bei Funktionsausdrücken:', //$NON-NLS-0$  //$NON-NLS-1$
	'noUnreachable' : 'Nicht adressierbarer Code:', //$NON-NLS-0$  //$NON-NLS-1$
	'noFallthrough' : 'Fallthrough für \'switch case\'-Anweisung:', //$NON-NLS-0$  //$NON-NLS-1$
	'useBeforeDefine' : 'Member wurde vor Definition verwendet:', //$NON-NLS-0$  //$NON-NLS-1$
	'noEmptyBlock' : 'Nicht dokumentierter leerer Block:', //$NON-NLS-0$  //$NON-NLS-1$
	'newParens' : 'Fehlende runde Klammern in Konstruktoraufruf:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewArray': 'Verwendung von \'new Array()\' nicht empfohlen:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewFunc': 'Verwendung von \'new Function()\' nicht empfohlen:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewObject': 'Verwendung von \'new Object()\' nicht empfohlen:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewWrappers': 'Verwendung von Wrapperobjekten nicht empfohlen:', //$NON-NLS-0$  //$NON-NLS-1$
	'missingSemi' : 'Fehlende Semikolons:', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedVars' : 'Nicht verwendete Variablen:', //$NON-NLS-0$  //$NON-NLS-1$
	'varRedecl' : 'Neudeklarationen von Variablen:', //$NON-NLS-0$  //$NON-NLS-1$
	'varShadow': 'Abbildung von Variablen:', //$NON-NLS-0$  //$NON-NLS-1$
	'undefMember' : 'Nicht deklarierter globaler Verweis:', //$NON-NLS-0$  //$NON-NLS-1$
	'unnecessarySemis' : 'Nich erforderliche Semikolons:', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedParams' : 'Nicht verwendete Parameter:', //$NON-NLS-0$  //$NON-NLS-1$
	'unsupportedJSLint' : 'Nicht unterstützte Umgebungsanweisung:',  //$NON-NLS-0$  //$NON-NLS-1$
	'throwError': 'In \'throw\' wurde \'Non-Error\' verwendet:',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocName' : 'Elementkommentar generieren',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocTooltip' : 'JSDoc-ähnlichen Kommentar für das ausgewählte JavaScript-Element generieren',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclName' : 'Deklaration öffnen',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclTooltip' : 'Die Deklaration für das ausgewählte Element öffnen',  //$NON-NLS-0$  //$NON-NLS-1$
	'validTypeof': 'Ungültiger \'typeof\'-Vergleich',  //$NON-NLS-0$ //$NON-NLS-1$
	'noSparseArrays': 'Deklarationen für dünn besetzte Arrays', //$NON-NLS-0$ //$NON-NLS-1$
	'jsHover': 'JavaScript-Hover-Provider', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixName': 'Zusätzliches Semikolon entfernen', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixTooltip': 'Entfernt das zusätzliche Semikolon', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixName': '$FALLTHROUGH$-Kommentar hinzufügen', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixTooltip': '$FALLTHROUGH$-Kommentarzeile hinzufügen', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixName': 'Leeren Block kommentieren', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixTooltip': 'Kommentar für unerledigte Aufgabe zum leeren Block hinzufügen', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixName': 'Zu Anweisung \'eslint-env\' hinzufügen', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixTooltip': 'Zu Anweisung \'eslint-env\' hinzufügen, um nach dem bekannten Member zu filtern', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixName': 'Zu Anweisung \'globals\' hinzufügen', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixTooltip': 'Zu Anweisung \'globals\' hinzufügen, um nach dem unbekannten Member zu filtern', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixName': 'Parameter entfernen', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixTooltip': 'Nicht verwendete Parameter entfernen, Nebeneffekte beibehalten', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixName': '@callback zur Funktion hinzufügen', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixTooltip': 'Die Funktion mit @callback dokumentieren, dabei nicht verwendete Parameter ignorieren', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixName': 'Operator aktualisieren', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixTooltip': 'Den Operator auf den erwarteten Operator aktualisieren', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixName': 'Nicht adressierbaren Code entfernen', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixTooltip': 'Den nicht adressierbaren Code entfernen', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixName': 'In normales Array konvertieren', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixTooltip': 'Dünn besetzte Einträge entfernen und in normales Array konvertieren', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixName': 'Fehlendes \';\' hinzufügen', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixTooltip': 'Das fehlende \';\' hinzufügen', //$NON-NLS-0$ //$NON-NLS-1$
	'radix': 'Basisparameter für parseInt() fehlt', //$NON-NLS-0$ //$NON-NLS-1$
});

