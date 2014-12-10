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
	"switchEditor": "Wechseleditor", //$NON-NLS-1$ //$NON-NLS-0$
	"Fetching": "${0} wird abgerufen", //$NON-NLS-1$ //$NON-NLS-0$
	"confirmUnsavedChanges": "Nicht gespeicherte Änderungen vorhanden. Wollen Sie trotzdem zu einer anderen Position navigieren?", //$NON-NLS-1$ //$NON-NLS-0$
	"searchFiles": "Schnellsuche...", //$NON-NLS-1$ //$NON-NLS-0$
	"searchTerm": "Suchbegriff eingeben:", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedChanges": "Nicht gespeicherte Änderungen vorhanden.", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedAutoSaveChanges": "Verbleiben Sie so lange auf der Seite, bis der Vorgang der automatischen Speicherung beendet worden ist.", //$NON-NLS-1$ //$NON-NLS-0$
	"Save": "Speichern", //$NON-NLS-1$ //$NON-NLS-0$
	"Saved": "Gespeichert", //$NON-NLS-1$ //$NON-NLS-0$
	"Blame": "Verantwortliche/r", //$NON-NLS-1$ //$NON-NLS-0$
	"BlameTooltip":"Anmerkungen der Verantwortlichen anzeigen", //$NON-NLS-1$ //$NON-NLS-0$
	"saveOutOfSync": "Die Ressource ist nicht mit dem Server synchronisiert. Möchten Sie sie trotzdem speichern?", //$NON-NLS-1$ //$NON-NLS-0$
	"loadOutOfSync": "Die Ressource ist nicht mit dem Server synchronisiert. Soll sie dennoch geladen werden? Ihre lokalen Änderungen werden hierdurch überschrieben.", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadata": "Metadaten von ${0} werden gelesen", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadataError": "Metadaten von ${0} können nicht abgerufen werden", //$NON-NLS-1$ //$NON-NLS-0$
	"Reading": "${0} wird gelesen", //$NON-NLS-1$ //$NON-NLS-0$
	"readonly": "Schreibgeschützt.", //$NON-NLS-1$ //$NON-NLS-0$
	"saveFile": "Diese Datei speichern", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleZoomRuler": "Zoomskala ein-/ausschalten", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "Gehe zu Zeile...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLineTooltip": "Zu angegebener Zeilennummer springen", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompt": "Zu Zeile springen:", //$NON-NLS-1$ //$NON-NLS-0$
	"Undo": "Widerrufen", //$NON-NLS-1$ //$NON-NLS-0$
	"Redo": "Widerruf zurücknehmen", //$NON-NLS-1$ //$NON-NLS-0$
	"Find": "Suchen von...", //$NON-NLS-1$ //$NON-NLS-0$
	"noResponse": "Vom Server wurde keine Antwort erhalten. Überprüfen Sie Ihre Internetverbindung und wiederholen Sie die Operation.", //$NON-NLS-1$ //$NON-NLS-0$
	"savingFile": "Datei ${0} wird gespeichert", //$NON-NLS-1$ //$NON-NLS-0$
	"running": "${0} wird ausgeführt", //$NON-NLS-1$ //$NON-NLS-0$
	"Saving..." : "Speichervorgang wird ausgeführt...", //$NON-NLS-1$ //$NON-NLS-0$
	"View": "Ansicht", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanel": "Seitenanzeige", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanelTooltip": "Auswählen, was im seitlichen Fensterbereich angezeigt werden soll.", //$NON-NLS-1$ //$NON-NLS-0$
	"Slideout": "Slideout", //$NON-NLS-1$ //$NON-NLS-0$
	"Actions": "Aktionen", //$NON-NLS-1$ //$NON-NLS-0$
	"Navigator": "Navigator", //$NON-NLS-1$ //$NON-NLS-0$
	"FolderNavigator": "Ordnernavigator", //$NON-NLS-1$ //$NON-NLS-0$
	"Project": "Projekt", //$NON-NLS-1$ //$NON-NLS-0$
	"New": "Neu", //$NON-NLS-1$ //$NON-NLS-0$
	"File": "Datei", //$NON-NLS-1$ //$NON-NLS-0$
	"Edit": "Bearbeiten", //$NON-NLS-1$ //$NON-NLS-0$
	"Tools": "Tools", //$NON-NLS-1$ //$NON-NLS-0$
	"Add": "Hinzufügen", //$NON-NLS-1$ //$NON-NLS-0$
	"noActions": "Für die aktuelle Auswahl sind keine Aktionen vorhanden.", //$NON-NLS-1$ //$NON-NLS-0$
	"NoFile": "Verwenden Sie ${0}, um neue Dateien und Ordner zu erstellen. Klicken Sie auf eine Datei, um mit der Codierung zu beginnen.", //$NON-NLS-1$ //$NON-NLS-0$
	"LocalEditorSettings": "Lokale Einstellungen für Editor", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProject": "${0} ist kein Projekt. Verwenden Sie ${1}, um es in ein Projekt zu konvertieren.", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProjects": "Ihr Arbeitsbereich enthält keine Projekte. Verwenden Sie das ${0}-Menü, um Projekte zu erstellen.", //$NON-NLS-1$ //$NON-NLS-0$
	"Disconnected": "${0} (Verbindung getrennt)", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFS": "Dateisystem auswählen", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFSTooltip": "Dateisystem auswählen, das angezeigt werden soll.", //$NON-NLS-1$ //$NON-NLS-0$
	"FSTitle": "${0} (${1})", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy": "Bereitstellen", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy As": "Bereitstellen als", //$NON-NLS-1$ //$NON-NLS-0$
	"Import": "Importieren", //$NON-NLS-1$ //$NON-NLS-0$
	"Export": "Exportieren", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenWith": "Öffnen mit", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenRelated": "Zugehörige öffnen", //$NON-NLS-1$ //$NON-NLS-0$
	"Dependency": "Abhängigkeit", //$NON-NLS-1$ //$NON-NLS-0$
	"UnnamedCommand": "Nicht benannt", //$NON-NLS-1$ //$NON-NLS-0$
	"searchInFolder": "Suchen in Ordner...",  //$NON-NLS-1$ //$NON-NLS-0$
	"Global Search": "Globale Suche...", //$NON-NLS-1$ //$NON-NLS-0$
	"ClickEditLabel": "Zum Bearbeiten klicken", //$NON-NLS-1$ //$NON-NLS-0$
	"ProjectInfo": "Projektinformationen", //$NON-NLS-1$ //$NON-NLS-0$
	"DeployInfo": "Bereitstellungsinformationen", //$NON-NLS-1$ //$NON-NLS-0$
	"Name": "Name", //$NON-NLS-1$ //$NON-NLS-0$
	"Description": "Beschreibung", //$NON-NLS-1$ //$NON-NLS-0$
	"Site": "Site", //$NON-NLS-1$ //$NON-NLS-0$
	'projectsSectionTitle': 'Projekte',  //$NON-NLS-0$  //$NON-NLS-1$
	'listingProjects': 'Projekte werden aufgelistet...',  //$NON-NLS-0$  //$NON-NLS-1$
	'gettingWorkspaceInfo': 'Arbeitsbereichsinformationen werden abgerufen...',  //$NON-NLS-0$  //$NON-NLS-1$
	"showProblems": "Probleme anzeigen...",  //$NON-NLS-1$ //$NON-NLS-0$
});

