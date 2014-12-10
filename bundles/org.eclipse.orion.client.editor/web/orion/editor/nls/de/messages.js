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
	"multipleAnnotations": "Mehrere Anmerkungen:", //$NON-NLS-1$ //$NON-NLS-0$
	"line": "Zeile: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"breakpoint": "Unterbrechungspunkt", //$NON-NLS-1$ //$NON-NLS-0$
	"bookmark": "Lesezeichen", //$NON-NLS-1$ //$NON-NLS-0$
	"task": "Aufgabe", //$NON-NLS-1$ //$NON-NLS-0$
	"error": "Fehler", //$NON-NLS-1$ //$NON-NLS-0$
	"warning": "Warnung", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingSearch": "Übereinstimmung mit Suchbegriff", //$NON-NLS-1$ //$NON-NLS-0$
	"currentSearch": "Aktuelle Suche", //$NON-NLS-1$ //$NON-NLS-0$
	"currentLine": "Aktuelle Zeile", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingBracket": "Übereinstimmende eckige Klammer", //$NON-NLS-1$ //$NON-NLS-0$
	"currentBracket": "Aktuelle eckige Klammer", //$NON-NLS-1$ //$NON-NLS-0$
	
	"lineUp": "Zeile nach oben", //$NON-NLS-1$ //$NON-NLS-0$
	"lineDown": "Zeile nach unten", //$NON-NLS-1$ //$NON-NLS-0$
	"lineStart": "Zeilenanfang", //$NON-NLS-1$ //$NON-NLS-0$
	"lineEnd": "Zeilenende", //$NON-NLS-1$ //$NON-NLS-0$
	"charPrevious": "Vorheriges Zeichen", //$NON-NLS-1$ //$NON-NLS-0$
	"charNext": "Nächstes Zeichen", //$NON-NLS-1$ //$NON-NLS-0$
	"pageUp": "Zurückblättern", //$NON-NLS-1$ //$NON-NLS-0$
	"pageDown": "Vorblättern", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageUp": "Seite zurückblättern", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageDown": "Seite vorblättern", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineUp": "Zeile zurückblättern", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineDown": "Zeile vorblättern", //$NON-NLS-1$ //$NON-NLS-0$
	"wordPrevious": "Vorheriges Wort", //$NON-NLS-1$ //$NON-NLS-0$
	"wordNext": "Nächstes Wort", //$NON-NLS-1$ //$NON-NLS-0$
	"textStart": "Dokumentanfang", //$NON-NLS-1$ //$NON-NLS-0$
	"textEnd": "Dokumentende", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextStart": "Zum Dokumentanfang blättern", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextEnd": "Zum Dokumentende blättern", //$NON-NLS-1$ //$NON-NLS-0$
	"centerLine": "Mittellinie", //$NON-NLS-1$ //$NON-NLS-0$
	
	"selectLineUp": "Vorherige Zeile auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineDown": "Folgezeile auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineUp": " Ganze vorherige Zeile auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineDown": "Ganze Folgezeile auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineStart": "Bis Zeilenanfang auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineEnd": "Bis Zeilenende auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharPrevious": "Vorheriges Zeichen auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharNext": "Nächstes Zeichen auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageUp": "Bis Seitenanfang auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageDown": "Bis Seitenende auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordPrevious": "Vorheriges Wort auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordNext": "Nächstes Wort auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextStart": "Bis Dokumentanfang auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextEnd": "Bis Dokumentende auswählen", //$NON-NLS-1$ //$NON-NLS-0$

	"deletePrevious": "Vorheriges Zeichen löschen", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteNext": "Nächstes Zeichen löschen", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordPrevious": "Vorheriges Wort löschen", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordNext": "Nächstes Wort löschen", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineStart": "Bis Zeilenanfang löschen", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineEnd": "Bis Zeilenende auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"tab": "Tabulator einfügen", //$NON-NLS-1$ //$NON-NLS-0$
	"enter": "Zeilenbegrenzer einfügen", //$NON-NLS-1$ //$NON-NLS-0$
	"enterNoCursor": "Zeilenbegrenzer einfügen", //$NON-NLS-1$ //$NON-NLS-0$
	"selectAll": "Alles auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"copy": "Kopieren", //$NON-NLS-1$ //$NON-NLS-0$
	"cut": "Ausschneiden", //$NON-NLS-1$ //$NON-NLS-0$
	"paste": "Einfügen", //$NON-NLS-1$ //$NON-NLS-0$
	
	"uppercase": "In Großbuchstaben", //$NON-NLS-1$ //$NON-NLS-0$
	"lowercase": "In Kleinbuchstaben", //$NON-NLS-1$ //$NON-NLS-0$
	"capitalize": "In Großbuchstaben", //$NON-NLS-1$ //$NON-NLS-0$
	"reversecase" : "Schreibung umkehren", //$NON-NLS-1$ //$NON-NLS-0$
	
	"toggleWrapMode": "Umbruchmodus umschalten", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleTabMode": "Tabulatormodus umschalten", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleOverwriteMode": "Überschreibungsmodus umschalten", //$NON-NLS-1$ //$NON-NLS-0$
	
	"committerOnTime": "${0} am ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//Emacs
	"emacs": "Emacs", //$NON-NLS-1$ //$NON-NLS-0$
	"exchangeMarkPoint": "Markierung und Punkt austauschen", //$NON-NLS-1$ //$NON-NLS-0$
	"setMarkCommand": "Markierung setzen", //$NON-NLS-1$ //$NON-NLS-0$
	"clearMark": "Markierung löschen", //$NON-NLS-1$ //$NON-NLS-0$
	"digitArgument": "Ziffernargument ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"negativeArgument": "Negatives Argument", //$NON-NLS-1$ //$NON-NLS-0$
			
	"Comment": "Kommentar", //$NON-NLS-1$ //$NON-NLS-0$
	"Flat outline": "Unstrukturierte Gliederung", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStr": "Schrittweise suchen: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStrNotFound": "Schrittweise suchen: ${0} (nicht gefunden)", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStr": "Schrittweise Suche zurücksetzen: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStrNotFound": "Schrittweise Suche zurücksetzen: ${0} (nicht gefunden)", //$NON-NLS-1$ //$NON-NLS-0$
	"find": "Suchen...", //$NON-NLS-1$ //$NON-NLS-0$
	"undo": "Widerrufen", //$NON-NLS-1$ //$NON-NLS-0$
	"redo": "Widerruf zurücknehmen", //$NON-NLS-1$ //$NON-NLS-0$
	"cancelMode": "Aktuellen Modus abbrechen", //$NON-NLS-1$ //$NON-NLS-0$
	"findNext": "Nächstes Vorkommen suchen", //$NON-NLS-1$ //$NON-NLS-0$
	"findPrevious": "Vorheriges Vorkommen suchen", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFind": "Schrittweise suchen", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverse": "Schrittweise Suche rückwärts", //$NON-NLS-1$ //$NON-NLS-0$
	"indentLines": "Zeilen einrücken", //$NON-NLS-1$ //$NON-NLS-0$
	"unindentLines": "Zeileneinrückung aufheben", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesUp": "Zeilen nach oben verschieben", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesDown": "Zeilen nach unten verschieben", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesUp": "Zeilen nach oben kopieren", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesDown": "Zeilen nach unten kopieren", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLines": "Zeilen löschen", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "Wechseln zu Zeile...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompty": "Weiter mit Zeile:", //$NON-NLS-1$ //$NON-NLS-0$
	"nextAnnotation": "Nächste Anmerkung", //$NON-NLS-1$ //$NON-NLS-0$
	"prevAnnotation": "Vorherige Anmerkung", //$NON-NLS-1$ //$NON-NLS-0$
	"expand": "Einblenden", //$NON-NLS-1$ //$NON-NLS-0$
	"collapse": "Ausblenden", //$NON-NLS-1$ //$NON-NLS-0$
	"expandAll": "Alles einblenden", //$NON-NLS-1$ //$NON-NLS-0$
	"collapseAll": "Alles ausblenden", //$NON-NLS-1$ //$NON-NLS-0$
	"lastEdit": "Letzte Bearbeitungsposition", //$NON-NLS-1$ //$NON-NLS-0$
	"trimTrailingWhitespaces": "Abschließende Leerzeichen abschneiden", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleLineComment": "Kommentarzeile ein-/ausschalten", //$NON-NLS-1$ //$NON-NLS-0$
	"addBlockComment": "Blockkommentar hinzufügen", //$NON-NLS-1$ //$NON-NLS-0$
	"removeBlockComment": "Blockkommentar entfernen", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeEntered": "Verknüpfter Modus aktiviert", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeExited": "Verknüpfter Modus beendet", //$NON-NLS-1$ //$NON-NLS-0$
	"syntaxError": "Syntaxfehler", //$NON-NLS-1$ //$NON-NLS-0$
	"contentAssist": "Inhaltshilfe", //$NON-NLS-1$ //$NON-NLS-0$
	"lineColumn": "Zeile ${0} : Spalte ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//vi
	"vi": "vi", //$NON-NLS-1$ //$NON-NLS-0$
	"vimove": "(Verschieben)", //$NON-NLS-1$ //$NON-NLS-0$
	"viyank": "(In den Speicher stellen)", //$NON-NLS-1$ //$NON-NLS-0$
	"videlete": "(Löschen)", //$NON-NLS-1$ //$NON-NLS-0$
	"vichange": "(Ändern)", //$NON-NLS-1$ //$NON-NLS-0$
	"viLeft": "${0} Links", //$NON-NLS-1$ //$NON-NLS-0$
	"viRight": "${0} Rechts", //$NON-NLS-1$ //$NON-NLS-0$
	"viUp": "${0} Nach oben", //$NON-NLS-1$ //$NON-NLS-0$
	"viDown": "${0} Nach unten", //$NON-NLS-1$ //$NON-NLS-0$
	"viw": "${0} Nächstes Wort", //$NON-NLS-1$ //$NON-NLS-0$
	"vib": "${0} Beginn des Worts", //$NON-NLS-1$ //$NON-NLS-0$
	"viW": "${0} Nächstes Wort (ws stop)", //$NON-NLS-1$ //$NON-NLS-0$
	"viB": "${0} Beginn des Worts (ws stop)", //$NON-NLS-1$ //$NON-NLS-0$
	"vie": "${0} Ende des Worts", //$NON-NLS-1$ //$NON-NLS-0$
	"viE": "${0} Ende des Worts (ws stop)", //$NON-NLS-1$ //$NON-NLS-0$
	"vi$": "${0} Ende der Zeile", //$NON-NLS-1$ //$NON-NLS-0$
	"vi^_": "${0} Erstes belegtes Zeichen in der aktuellen Zeile", //$NON-NLS-1$ //$NON-NLS-0$
	"vi+": "${0} Erstes Zeichen nächste Zeile", //$NON-NLS-1$ //$NON-NLS-0$
	"vi-": "${0} Erstes Zeichen vorherige Zeile", //$NON-NLS-1$ //$NON-NLS-0$
	"vi|": "${0} nte Spalte in Zeile", //$NON-NLS-1$ //$NON-NLS-0$
	"viH": "${0} Seitenanfang", //$NON-NLS-1$ //$NON-NLS-0$
	"viM": "${0} Seitenmitte", //$NON-NLS-1$ //$NON-NLS-0$
	"viL": "${0} Seitenende", //$NON-NLS-1$ //$NON-NLS-0$
	"vi/": "${0} Vorwärts suchen", //$NON-NLS-1$ //$NON-NLS-0$
	"vi?": "${0} Rückwärts suchen", //$NON-NLS-1$ //$NON-NLS-0$
	"vin": "${0} Nächste Suche", //$NON-NLS-1$ //$NON-NLS-0$
	"viN": "${0} Vorherige Suche", //$NON-NLS-1$ //$NON-NLS-0$
	"vif": "${0} Zeichen vorwärts suchen", //$NON-NLS-1$ //$NON-NLS-0$
	"viF": "${0} Zeichen rückwärts suchen", //$NON-NLS-1$ //$NON-NLS-0$
	"vit": "${0} Vor dem Zeichen vorwärts suchen", //$NON-NLS-1$ //$NON-NLS-0$
	"viT": "${0} Nach dem Zeichen rückwärts suchen", //$NON-NLS-1$ //$NON-NLS-0$
	"vi,": "${0} Umgekehrte Zeichensuche wiederholen", //$NON-NLS-1$ //$NON-NLS-0$
	"vi;": "${0} Zeichensuche wiederholen", //$NON-NLS-1$ //$NON-NLS-0$
	"viG": "${0} Gehe zu Zeile", //$NON-NLS-1$ //$NON-NLS-0$
	"viycd": "${0} Aktuelle Zeile", //$NON-NLS-1$ //$NON-NLS-0$
	"via": "Nach Cursor anhängen", //$NON-NLS-1$ //$NON-NLS-0$
	"viA": "An Zeilenende anhängen", //$NON-NLS-1$ //$NON-NLS-0$
	"vii": "Vor Cursor einfügen", //$NON-NLS-1$ //$NON-NLS-0$
	"viI": "Am Zeilenanfang einfügen", //$NON-NLS-1$ //$NON-NLS-0$
	"viO": "Zeile darüber einfügen", //$NON-NLS-1$ //$NON-NLS-0$
	"vio": "Zeile darunter einfügen", //$NON-NLS-1$ //$NON-NLS-0$
	"viR": "Überschreiben von Text beginnen", //$NON-NLS-1$ //$NON-NLS-0$
	"vis": "Zeichen ersetzen", //$NON-NLS-1$ //$NON-NLS-0$
	"viS": "Gesamte Zeile ersetzen", //$NON-NLS-1$ //$NON-NLS-0$
	"viC": "Bis Zeilenende ändern", //$NON-NLS-1$ //$NON-NLS-0$
	"vip": "Einfügen nach Zeichen oder Zeile", //$NON-NLS-1$ //$NON-NLS-0$
	"viP": "Einfügen vor Zeichen oder Zeile", //$NON-NLS-1$ //$NON-NLS-0$
	"viStar": "Wort nach Cursor suchen", //$NON-NLS-1$ //$NON-NLS-0$
	
	"next": "Nächste", //$NON-NLS-1$ //$NON-NLS-0$
	"previous": "Vorherige", //$NON-NLS-1$ //$NON-NLS-0$
	"replace": "Ersetzen", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceAll": "Global ersetzen", //$NON-NLS-1$ //$NON-NLS-0$
	"findWith": "Suchen mit", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceWith": "Ersetzen durch", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitive": "Aa", //$NON-NLS-1$ //$NON-NLS-0$
	"regex": "/.*/", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWord": "\\b", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitiveTooltip": "Beachtung von Groß-/Kleinschreibung umschalten", //$NON-NLS-1$ //$NON-NLS-0$
	"regexTooltip": "Regulären Ausdruck wechseln", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWordTooltip": "Ganzes Wort umschalten", //$NON-NLS-1$ //$NON-NLS-0$
	"closeTooltip": "Schließen", //$NON-NLS-1$ //$NON-NLS-0$

	"replacingAll": "Alle ersetzen...", //$NON-NLS-1$ //$NON-NLS-0$
	"replacedMatches": "${0} Übereinstimmungen ersetzt", //$NON-NLS-1$ //$NON-NLS-0$
	"nothingReplaced": "Nichts ersetzt", //$NON-NLS-1$ //$NON-NLS-0$
	"notFound": "Nicht gefunden" //$NON-NLS-1$ //$NON-NLS-0$
});

