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
/*eslint-env amd */
define({
    'syntaxErrorIncomplete': 'Syntaxfehler, unvollständige Anweisung.',  //$NON-NLS-0$  //$NON-NLS-1$
    'syntaxErrorBadToken': 'Syntaxfehler bei Token \'${0}\'. Token muss gelöscht werden.',  //$NON-NLS-0$  //$NON-NLS-1$
    'esprimaParseFailure': 'Esprima konnte diese Datei nicht parsen, da ein Fehler auftrat: ${0}',  //$NON-NLS-0$ //$NON-NLS-1$
    'eslintValidationFailure': 'ESLint konnte diese Datei nicht ptüfen, da ein Fehler auftrat: ${0}',  //$NON-NLS-0$  //$NON-NLS-1$
	'curly': 'Die Anweisung muss in geschweifte Klammer eingeschlossen sein.',  //$NON-NLS-0$  //$NON-NLS-1$
	'eqeqeq' : 'Es wurde \'${0}\' an Stelle von \'${1}\' erwartet.',  //$NON-NLS-0$  //$NON-NLS-1$
	'missing-doc' : 'Fehlende Dokumentation für Funktion \'${0}\'.',  //$NON-NLS-0$  //$NON-NLS-1$
	'new-parens' : 'Im Aufruf des Konstruktors fehlen die runden Klammern.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-debugger': 'Von der Verwendung der Anweisung \'debugger\' wird abgeraten.',  //$NON-NLS-0$  //$NON-NLS-1$
	'no-dupe-keys' : 'Der Objektschlüssel \'${0}\' ist doppelt vorhanden.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-empty-block' : 'Ein leerer Block sollte entfernt oder kommentiert werden.',  //$NON-NLS-0$ //$NON-NLS-1$
	'no-eval' : 'Von der Verwendung von Aufrufen von ${0}-Funktionen wird abgeraten.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-extra-semi' : 'Nicht erforderliches Semikolon.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-fallthrough' : 'CASE in SWITCH-Anweisung wird möglicherweise wegen Durchlauf der vorherigen CASE-Angabe ausgeführt. Wenn dies beabsichtigt ist, fügen Sie in der Zeile darüber einen neuen Kommentar //$FALLTHROUGH$ hinzu.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-jslint' : 'Die Anweisung \'${0}\' wird nicht unterstützt. Verwenden Sie \'eslint-env\'.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-array' : 'Verwenden Sie die Notation für Array-Literale \'[]\'.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-func' : 'Der FunktionsKonstruktor lautet \'eval\'.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-object' : 'Verwenden Sie die Notation für Objekt-Literale \'{}\' oder aber Object.create(null).', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-wrappers' : 'Verwenden Sie \'${0}\' nicht als Konstruktor.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-redeclare' : '\'${0}\' ist bereits definiert.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-sparse-arrays': 'Deklarationen für dünn besetzte Arrays müssen vermieden werden. ',  //$NON-NLS-0$ //$NON-NLS-1$
	'no-undef-defined' : '\'${0}\' ist nicht definiert.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-undef-readonly': '\'${0}\' ist schreibgeschützt.',  //$NON-NLS-0$  //$NON-NLS-1$
	'no-unreachable' : 'Der Code kann nicht adressiert werden.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-params' : 'Der Parameter \'${0}\' wird nie verwendet.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-vars-unused' : '\'${0}\' wird nicht verwendet.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-vars-unread' : '\'${0}\' wird nicht gelesen.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-use-before-define': '\'${0}\' wurde verwendet, bevor eine Definition festgelegt wurde.', //$NON-NLS-0$  //$NON-NLS-1$
	'semi': 'Fehlendes Semikolon.', //$NON-NLS-0$  //$NON-NLS-1$
	'throw-error': 'Stattdessen sollte ein Fehler ausgelöst werden.', //$NON-NLS-0$  //$NON-NLS-1$
	'use-isnan': 'Verwenden Sie die Funktion \'isNaN\' für den Vergleich mit \'NaN\'.', //$NON-NLS-0$  //$NON-NLS-1$
	'valid-typeof' : 'Ungültiger typeof-Vergleich.',  //$NON-NLS-0$ //$NON-NLS-1$
});

