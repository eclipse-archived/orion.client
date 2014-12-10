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
	"switchEditor": "Cambia editor", //$NON-NLS-1$ //$NON-NLS-0$
	"Fetching": "Richiamo dati: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"confirmUnsavedChanges": "Esistono modifiche non salvate. Si desidera ancora navigare?", //$NON-NLS-1$ //$NON-NLS-0$
	"searchFiles": "Ricerca rapida...", //$NON-NLS-1$ //$NON-NLS-0$
	"searchTerm": "Immetti termine di ricerca:", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedChanges": "Esistono modifiche non salvate.", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedAutoSaveChanges": "Non cambiare pagina fino a quando il salvataggio automatico è completato.", //$NON-NLS-1$ //$NON-NLS-0$
	"Save": "Salva", //$NON-NLS-1$ //$NON-NLS-0$
	"Saved": "Salvato", //$NON-NLS-1$ //$NON-NLS-0$
	"Blame": "Blame", //$NON-NLS-1$ //$NON-NLS-0$
	"BlameTooltip":"Mostra annotazioni blame", //$NON-NLS-1$ //$NON-NLS-0$
	"saveOutOfSync": "La risorsa non è sincronizzata con il server. Si desidera salvarla comunque?", //$NON-NLS-1$ //$NON-NLS-0$
	"loadOutOfSync": "La risorsa non è sincronizzata con il server. Si desidera caricarla comunque? Ciò sovrascriverà le modifiche locali.", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadata": "Lettura di metadati di ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadataError": "Impossibile acquisire i metadati di ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"Reading": "Lettura in corso ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"readonly": "Sola lettura.", //$NON-NLS-1$ //$NON-NLS-0$
	"saveFile": "Salva questo file", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleZoomRuler": "Attiva/disattiva righello zoom", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "Vai alla riga...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLineTooltip": "Vai alla riga specificata", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompt": "Vai alla riga:", //$NON-NLS-1$ //$NON-NLS-0$
	"Undo": "Annulla", //$NON-NLS-1$ //$NON-NLS-0$
	"Redo": "Riesegui", //$NON-NLS-1$ //$NON-NLS-0$
	"Find": "Trova...", //$NON-NLS-1$ //$NON-NLS-0$
	"noResponse": "Nessuna risposta dal server. Controllare la connessione Internet e riprovare.", //$NON-NLS-1$ //$NON-NLS-0$
	"savingFile": "Salvataggio file ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"running": "Esecuzione di ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"Saving..." : "Salvataggio in corso...", //$NON-NLS-1$ //$NON-NLS-0$
	"View": "Vista", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanel": "Pannello laterale", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanelTooltip": "Scegliere cosa mostrare nel pannello laterale.", //$NON-NLS-1$ //$NON-NLS-0$
	"Slideout": "Sfila", //$NON-NLS-1$ //$NON-NLS-0$
	"Actions": "Azioni", //$NON-NLS-1$ //$NON-NLS-0$
	"Navigator": "Navigator", //$NON-NLS-1$ //$NON-NLS-0$
	"FolderNavigator": "Navigator della cartella", //$NON-NLS-1$ //$NON-NLS-0$
	"Project": "Progetto", //$NON-NLS-1$ //$NON-NLS-0$
	"New": "Nuovo", //$NON-NLS-1$ //$NON-NLS-0$
	"File": "File", //$NON-NLS-1$ //$NON-NLS-0$
	"Edit": "Modifica", //$NON-NLS-1$ //$NON-NLS-0$
	"Tools": "Strumenti", //$NON-NLS-1$ //$NON-NLS-0$
	"Add": "Aggiungi", //$NON-NLS-1$ //$NON-NLS-0$
	"noActions": "Non vi sono azioni per la selezione corrente.", //$NON-NLS-1$ //$NON-NLS-0$
	"NoFile": "Utilizzare ${0} per creare nuovi file e cartelle. Fare clic su un file per avviare la codifica.", //$NON-NLS-1$ //$NON-NLS-0$
	"LocalEditorSettings": "Impostazioni dell'editor locali", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProject": "${0} non è un progetto. Per convertirlo in un progetto utilizzare ${1}.", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProjects": "Non vi sono progetti nel proprio spazio di lavoro. Utilizzare il menu ${0} per creare i progetti.", //$NON-NLS-1$ //$NON-NLS-0$
	"Disconnected": "${0} (scollegato)", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFS": "Scegli filesystem", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFSTooltip": "Scegliere il file system che si desidera visualizzare.", //$NON-NLS-1$ //$NON-NLS-0$
	"FSTitle": "${0} (${1})", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy": "Distribuisci", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy As": "Distribuisci come", //$NON-NLS-1$ //$NON-NLS-0$
	"Import": "Importa", //$NON-NLS-1$ //$NON-NLS-0$
	"Export": "Esporta", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenWith": "Apri con", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenRelated": "Apri elemento correlato", //$NON-NLS-1$ //$NON-NLS-0$
	"Dependency": "Dipendenza", //$NON-NLS-1$ //$NON-NLS-0$
	"UnnamedCommand": "Senza nome", //$NON-NLS-1$ //$NON-NLS-0$
	"searchInFolder": "Ricerca nella cartella...",  //$NON-NLS-1$ //$NON-NLS-0$
	"Global Search": "Ricerca globale...", //$NON-NLS-1$ //$NON-NLS-0$
	"ClickEditLabel": "Fare clic per modificare", //$NON-NLS-1$ //$NON-NLS-0$
	"ProjectInfo": "Informazioni sul progetto", //$NON-NLS-1$ //$NON-NLS-0$
	"DeployInfo": "Informazioni sulla distribuzione", //$NON-NLS-1$ //$NON-NLS-0$
	"Name": "Nome", //$NON-NLS-1$ //$NON-NLS-0$
	"Description": "Descrizione", //$NON-NLS-1$ //$NON-NLS-0$
	"Site": "Sito", //$NON-NLS-1$ //$NON-NLS-0$
	'projectsSectionTitle': 'Progetti',  //$NON-NLS-0$  //$NON-NLS-1$
	'listingProjects': 'Elenco dei progetti...',  //$NON-NLS-0$  //$NON-NLS-1$
	'gettingWorkspaceInfo': 'Acquisizione informazioni sullo spazio di lavoro...',  //$NON-NLS-0$  //$NON-NLS-1$
	"showProblems": "Mostra problemi...",  //$NON-NLS-1$ //$NON-NLS-0$
});

