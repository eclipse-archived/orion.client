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
	"multipleAnnotations": "Annotazioni multiple:", //$NON-NLS-1$ //$NON-NLS-0$
	"line": "Riga: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"breakpoint": "Punto di interruzione", //$NON-NLS-1$ //$NON-NLS-0$
	"bookmark": "Segnalibro", //$NON-NLS-1$ //$NON-NLS-0$
	"task": "Attività", //$NON-NLS-1$ //$NON-NLS-0$
	"error": "Errore", //$NON-NLS-1$ //$NON-NLS-0$
	"warning": "Avviso", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingSearch": "Ricerca corrispondente", //$NON-NLS-1$ //$NON-NLS-0$
	"currentSearch": "Ricerca corrente", //$NON-NLS-1$ //$NON-NLS-0$
	"currentLine": "Riga corrente", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingBracket": "Parentesi corrispondente", //$NON-NLS-1$ //$NON-NLS-0$
	"currentBracket": "Parentesi corrente", //$NON-NLS-1$ //$NON-NLS-0$
	
	"lineUp": "Riga su", //$NON-NLS-1$ //$NON-NLS-0$
	"lineDown": "Riga giù", //$NON-NLS-1$ //$NON-NLS-0$
	"lineStart": "Inizio riga", //$NON-NLS-1$ //$NON-NLS-0$
	"lineEnd": "Fine riga", //$NON-NLS-1$ //$NON-NLS-0$
	"charPrevious": "Carattere precedente", //$NON-NLS-1$ //$NON-NLS-0$
	"charNext": "Carattere successivo", //$NON-NLS-1$ //$NON-NLS-0$
	"pageUp": "Pagina su", //$NON-NLS-1$ //$NON-NLS-0$
	"pageDown": "Pagina giù", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageUp": "Scorri pagina su", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageDown": "Scorri pagina giù", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineUp": "Scorri di una riga in alto", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineDown": "Scorri di una riga in basso", //$NON-NLS-1$ //$NON-NLS-0$
	"wordPrevious": "Parola precedente", //$NON-NLS-1$ //$NON-NLS-0$
	"wordNext": "Parola successiva", //$NON-NLS-1$ //$NON-NLS-0$
	"textStart": "Inizio documento", //$NON-NLS-1$ //$NON-NLS-0$
	"textEnd": "Fine documento", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextStart": "Scorri inizio documento", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextEnd": "Scorri fine documento", //$NON-NLS-1$ //$NON-NLS-0$
	"centerLine": "Linea di centro", //$NON-NLS-1$ //$NON-NLS-0$
	
	"selectLineUp": "Seleziona riga su", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineDown": "Seleziona riga giù", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineUp": " Seleziona tutta la riga su", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineDown": "Seleziona tutta la riga giù", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineStart": "Seleziona inizio riga", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineEnd": "Seleziona fine riga", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharPrevious": "Seleziona carattere precedente", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharNext": "Seleziona carattere successivo", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageUp": "Seleziona pagina su", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageDown": "Seleziona pagina giù", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordPrevious": "Seleziona parola precedente", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordNext": "Seleziona parola successiva", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextStart": "Seleziona inizio documento", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextEnd": "Seleziona fine documento", //$NON-NLS-1$ //$NON-NLS-0$

	"deletePrevious": "Elimina carattere precedente", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteNext": "Elimina carattere successivo", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordPrevious": "Elimina parola precedente", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordNext": "Elimina parola successiva", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineStart": "Elimina inizio riga", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineEnd": "Elimina fine riga", //$NON-NLS-1$ //$NON-NLS-0$
	"tab": "Inserisci tabulazione", //$NON-NLS-1$ //$NON-NLS-0$
	"enter": "Inserisci delimitatore di riga", //$NON-NLS-1$ //$NON-NLS-0$
	"enterNoCursor": "Inserisci delimitatore di riga", //$NON-NLS-1$ //$NON-NLS-0$
	"selectAll": "Seleziona tutto", //$NON-NLS-1$ //$NON-NLS-0$
	"copy": "Copia", //$NON-NLS-1$ //$NON-NLS-0$
	"cut": "Taglia", //$NON-NLS-1$ //$NON-NLS-0$
	"paste": "Incolla", //$NON-NLS-1$ //$NON-NLS-0$
	
	"uppercase": "In maiuscolo", //$NON-NLS-1$ //$NON-NLS-0$
	"lowercase": "In minuscolo", //$NON-NLS-1$ //$NON-NLS-0$
	"capitalize": "Iniziale maiuscola", //$NON-NLS-1$ //$NON-NLS-0$
	"reversecase" : "Inverti maiuscolo/minuscolo", //$NON-NLS-1$ //$NON-NLS-0$
	
	"toggleWrapMode": "Attiva/disattiva modalità a capo", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleTabMode": "Attiva/disattiva modalità di tabulazione", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleOverwriteMode": "Attiva/disattiva modalità Sovrascrivi", //$NON-NLS-1$ //$NON-NLS-0$
	
	"committerOnTime": "${0} su ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//Emacs
	"emacs": "Emacs", //$NON-NLS-1$ //$NON-NLS-0$
	"exchangeMarkPoint": "Scambia contrassegno e punto", //$NON-NLS-1$ //$NON-NLS-0$
	"setMarkCommand": "Imposta contrassegno", //$NON-NLS-1$ //$NON-NLS-0$
	"clearMark": "Cancella contrassegno", //$NON-NLS-1$ //$NON-NLS-0$
	"digitArgument": "Argomento cifra ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"negativeArgument": "Argomento negativo", //$NON-NLS-1$ //$NON-NLS-0$
			
	"Comment": "Commento", //$NON-NLS-1$ //$NON-NLS-0$
	"Flat outline": "Descrizione semplice", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStr": "Ricerca incrementale: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStrNotFound": "Ricerca incrementale: ${0} (non trovata)", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStr": "Ricerca incrementale inversa: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStrNotFound": "Ricerca incrementale inversa: ${0} (non trovata)", //$NON-NLS-1$ //$NON-NLS-0$
	"find": "Trova...", //$NON-NLS-1$ //$NON-NLS-0$
	"undo": "Annulla", //$NON-NLS-1$ //$NON-NLS-0$
	"redo": "Riesegui", //$NON-NLS-1$ //$NON-NLS-0$
	"cancelMode": "Annulla modalità corrente", //$NON-NLS-1$ //$NON-NLS-0$
	"findNext": "Trova ricorrenza successiva", //$NON-NLS-1$ //$NON-NLS-0$
	"findPrevious": "Trova ricorrenza precedente", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFind": "Ricerca incrementale", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverse": "Inversione ricerca incrementale", //$NON-NLS-1$ //$NON-NLS-0$
	"indentLines": "Rientro righe", //$NON-NLS-1$ //$NON-NLS-0$
	"unindentLines": "Annulla rientro righe", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesUp": "Sposta righe verso l'alto", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesDown": "Sposta righe verso il basso", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesUp": "Copia righe in alto", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesDown": "Copia righe in basso", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLines": "Elimina righe", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "Vai alla riga...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompty": "Vai alla riga:", //$NON-NLS-1$ //$NON-NLS-0$
	"nextAnnotation": "Annotazione successiva", //$NON-NLS-1$ //$NON-NLS-0$
	"prevAnnotation": "Annotazione precedente", //$NON-NLS-1$ //$NON-NLS-0$
	"expand": "Espandi", //$NON-NLS-1$ //$NON-NLS-0$
	"collapse": "Comprimi", //$NON-NLS-1$ //$NON-NLS-0$
	"expandAll": "Espandi tutto", //$NON-NLS-1$ //$NON-NLS-0$
	"collapseAll": "Riduci tutto", //$NON-NLS-1$ //$NON-NLS-0$
	"lastEdit": "Posizione ultima modifica", //$NON-NLS-1$ //$NON-NLS-0$
	"trimTrailingWhitespaces": "Taglia spazi finali", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleLineComment": "Attiva/disattiva commento riga", //$NON-NLS-1$ //$NON-NLS-0$
	"addBlockComment": "Aggiungi commento al blocco", //$NON-NLS-1$ //$NON-NLS-0$
	"removeBlockComment": "Rimuovi commento dal blocco", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeEntered": "Entrata in modalità collegata", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeExited": "Uscita dalla modalità collegata", //$NON-NLS-1$ //$NON-NLS-0$
	"syntaxError": "Errore di sintassi", //$NON-NLS-1$ //$NON-NLS-0$
	"contentAssist": "Assistente ai contenuti", //$NON-NLS-1$ //$NON-NLS-0$
	"lineColumn": "Riga ${0} : Col ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//vi
	"vi": "vi", //$NON-NLS-1$ //$NON-NLS-0$
	"vimove": "(Sposta)", //$NON-NLS-1$ //$NON-NLS-0$
	"viyank": "(Strappa)", //$NON-NLS-1$ //$NON-NLS-0$
	"videlete": "(Elimina)", //$NON-NLS-1$ //$NON-NLS-0$
	"vichange": "(Modifica)", //$NON-NLS-1$ //$NON-NLS-0$
	"viLeft": "${0} Sinistra", //$NON-NLS-1$ //$NON-NLS-0$
	"viRight": "${0} Destra", //$NON-NLS-1$ //$NON-NLS-0$
	"viUp": "${0} Su", //$NON-NLS-1$ //$NON-NLS-0$
	"viDown": "${0} Giù", //$NON-NLS-1$ //$NON-NLS-0$
	"viw": "${0} Parola successiva", //$NON-NLS-1$ //$NON-NLS-0$
	"vib": "${0} Inizio della parola", //$NON-NLS-1$ //$NON-NLS-0$
	"viW": "${0} Parola successiva (ws stop)", //$NON-NLS-1$ //$NON-NLS-0$
	"viB": "${0} Inizio della parola (ws stop)", //$NON-NLS-1$ //$NON-NLS-0$
	"vie": "${0} Fine della parola", //$NON-NLS-1$ //$NON-NLS-0$
	"viE": "${0} Fine della parola (ws stop)", //$NON-NLS-1$ //$NON-NLS-0$
	"vi$": "${0} Fine della riga", //$NON-NLS-1$ //$NON-NLS-0$
	"vi^_": "${0} Riga corrente primo carattere non vuoto", //$NON-NLS-1$ //$NON-NLS-0$
	"vi+": "${0} Riga successiva primo carattere", //$NON-NLS-1$ //$NON-NLS-0$
	"vi-": "${0} Riga precedente primo carattere", //$NON-NLS-1$ //$NON-NLS-0$
	"vi|": "${0} ennesima colonna nella riga", //$NON-NLS-1$ //$NON-NLS-0$
	"viH": "${0} Inizio pagina", //$NON-NLS-1$ //$NON-NLS-0$
	"viM": "${0} Metà pagina", //$NON-NLS-1$ //$NON-NLS-0$
	"viL": "${0} Fine pagina", //$NON-NLS-1$ //$NON-NLS-0$
	"vi/": "${0} Ricerca avanti", //$NON-NLS-1$ //$NON-NLS-0$
	"vi?": "${0} Ricerca indietro", //$NON-NLS-1$ //$NON-NLS-0$
	"vin": "${0} Ricerca successiva", //$NON-NLS-1$ //$NON-NLS-0$
	"viN": "${0} Ricerca precedente", //$NON-NLS-1$ //$NON-NLS-0$
	"vif": "${0} Ricerca carattere avanti", //$NON-NLS-1$ //$NON-NLS-0$
	"viF": "${0} Ricerca carattere indietro", //$NON-NLS-1$ //$NON-NLS-0$
	"vit": "${0} Ricerca prima del carattere avanti", //$NON-NLS-1$ //$NON-NLS-0$
	"viT": "${0} Ricerca prima del carattere indietro", //$NON-NLS-1$ //$NON-NLS-0$
	"vi,": "${0} Ripeti ricerca carattere inverso", //$NON-NLS-1$ //$NON-NLS-0$
	"vi;": "${0} Ripeti ricerca carattere", //$NON-NLS-1$ //$NON-NLS-0$
	"viG": "${0} Vai alla riga", //$NON-NLS-1$ //$NON-NLS-0$
	"viycd": "${0} Riga corrente", //$NON-NLS-1$ //$NON-NLS-0$
	"via": "Accoda dopo cursore", //$NON-NLS-1$ //$NON-NLS-0$
	"viA": "Accoda alla fine del file", //$NON-NLS-1$ //$NON-NLS-0$
	"vii": "Inserisci prima del cursore", //$NON-NLS-1$ //$NON-NLS-0$
	"viI": "Inserisci all'inizio della riga", //$NON-NLS-1$ //$NON-NLS-0$
	"viO": "Inserisci sopra riga", //$NON-NLS-1$ //$NON-NLS-0$
	"vio": "Inserisci sotto riga", //$NON-NLS-1$ //$NON-NLS-0$
	"viR": "Inizia sovrascrittura testo", //$NON-NLS-1$ //$NON-NLS-0$
	"vis": "Sostituisci un carattere", //$NON-NLS-1$ //$NON-NLS-0$
	"viS": "Sostituisci intera riga", //$NON-NLS-1$ //$NON-NLS-0$
	"viC": "Modifica testo fino alla fine della riga", //$NON-NLS-1$ //$NON-NLS-0$
	"vip": "Incolla dopo carattere o riga", //$NON-NLS-1$ //$NON-NLS-0$
	"viP": "Incolla prima del carattere o riga", //$NON-NLS-1$ //$NON-NLS-0$
	"viStar": "Ricerca parola sotto al cursore", //$NON-NLS-1$ //$NON-NLS-0$
	
	"next": "Avanti", //$NON-NLS-1$ //$NON-NLS-0$
	"previous": "Indietro", //$NON-NLS-1$ //$NON-NLS-0$
	"replace": "Sostituisci", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceAll": "Sostituisci tutto", //$NON-NLS-1$ //$NON-NLS-0$
	"findWith": "Trova con", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceWith": "Sostituisci con", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitive": "Aa", //$NON-NLS-1$ //$NON-NLS-0$
	"regex": "/.*/", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWord": "\\b", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitiveTooltip": "Attiva/disattiva non sensibile al maiuscolo/minuscolo", //$NON-NLS-1$ //$NON-NLS-0$
	"regexTooltip": "Attiva/disattiva Regex", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWordTooltip": "Attiva/disattiva intera parola", //$NON-NLS-1$ //$NON-NLS-0$
	"closeTooltip": "Chiuso", //$NON-NLS-1$ //$NON-NLS-0$

	"replacingAll": "Sostituzione completa...", //$NON-NLS-1$ //$NON-NLS-0$
	"replacedMatches": "Sostituito ${0} corrispondenze", //$NON-NLS-1$ //$NON-NLS-0$
	"nothingReplaced": "Nessuna sostituzione", //$NON-NLS-1$ //$NON-NLS-0$
	"notFound": "Non trovato" //$NON-NLS-1$ //$NON-NLS-0$
});

