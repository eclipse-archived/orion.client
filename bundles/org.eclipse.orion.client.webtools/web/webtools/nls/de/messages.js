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
	'htmlOutline' : 'HTML-Struktur', //$NON-NLS-0$  //$NON-NLS-1$
	'cssOutline' : 'CSS-Regelstruktur', //$NON-NLS-0$  //$NON-NLS-1$
	'htmlContentAssist' : 'HTML-Inhaltshilfe', //$NON-NLS-0$  //$NON-NLS-1$
	'cssContentAssist' : 'CSS-Inhaltshilfe', //$NON-NLS-0$  //$NON-NLS-1$
	
	'csslintValidator' : 'CSS-Prüfprogramm',
	'ignore' : 'Ignorieren',
	'warning' : 'Warnung',
	'error' : 'Fehler',
	
	'adjoining-classes': 'Angrenzende Klassen nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'box-model': 'Vorsicht bei fehlerhafter Feldgröße:', //$NON-NLS-0$  //$NON-NLS-1$
	'box-sizing': 'Verwendung von Feldgrößenanpassung nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'bulletproof-font-face': '@font-face-Syntax mit hoher Sicherheit verwenden:', //$NON-NLS-0$  //$NON-NLS-1$
	'compatible-vendor-prefixes': 'Kompatible Anbieterpräfixe anfordern:', //$NON-NLS-0$  //$NON-NLS-1$
	'display-property-grouping': 'Für Anzeige geeignete Eigenschaften anfordern:', //$NON-NLS-0$  //$NON-NLS-1$
	'duplicate-background-images': 'Doppelte Hintergrundbilder nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'duplicate-properties': 'Doppelte Eigenschaften nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'empty-rules': 'Regeln ohne Inhalt nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'fallback-colors': 'Rücksetzungsfarben anfordern:', //$NON-NLS-0$  //$NON-NLS-1$
	'floats': 'Zu viele Floatelemente nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'font-faces': 'Nicht zu viele Webfonts verwenden:', //$NON-NLS-0$  //$NON-NLS-1$
	'font-sizes': 'Zu viele Schriftartgrößen nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'gradients': 'Alle Gradientendefinitionen anfordern:', //$NON-NLS-0$  //$NON-NLS-1$
	'ids': 'IDs in Selektoren nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'import': '@import nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'important': '!important nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'known-properties': 'Verwendung bekannter Eigenschaften anfordern:', //$NON-NLS-0$  //$NON-NLS-1$
	'outline-none': 'Gliederung nicht zulassen: keine', //$NON-NLS-0$  //$NON-NLS-1$
	'overqualified-elements': 'Überqualifizierte Elemente nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'qualified-headings': 'Qualifizierte Kopfzeilen nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'regex-selectors': 'Selektoren mit dem Erscheinungsbild regulärer Ausdrücke nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'rules-count': 'Regelanzahl:', //$NON-NLS-0$  //$NON-NLS-1$
	'selector-max-approaching': 'Warnung bei Annäherung an 4095-Selektorlimit für IE:', //$NON-NLS-0$  //$NON-NLS-1$
	'selector-max': 'Fehler bei Überschreiten des 4095-Selektorlimits für IE:', //$NON-NLS-0$  //$NON-NLS-1$
	'shorthand': 'Kurzformeigenschaften anfordern:', //$NON-NLS-0$  //$NON-NLS-1$
	'star-property-hack': 'Eigenschaften mit Sternpräfix nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'text-indent': 'Negative Texteinrückung nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'underscore-property-hack': 'Eigenschaften mit Unterstrichpräfix nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'unique-headings': 'Kopfzeilen dürfen nur einmal definiert werden:', //$NON-NLS-0$  //$NON-NLS-1$
	'universal-selector': 'Universellen Selektor nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'unqualified-attributes': 'Nicht qualifizierte Attributselektoren nicht zulassen:', //$NON-NLS-0$  //$NON-NLS-1$
	'vendor-prefix': 'Standardeigenschaft bei Anbieterpräfix anfordern:', //$NON-NLS-0$  //$NON-NLS-1$
	'zero-units': 'Einheiten für 0 Werte nicht zulassen:' //$NON-NLS-0$  //$NON-NLS-1$
});

