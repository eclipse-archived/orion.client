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
	"Compare": "Vergleichen", //$NON-NLS-0$  //$NON-NLS-1$
	"View the side-by-side compare": "Gegenüberstellenden Vergleich anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirVer": "Arbeitsverzeichnis öffnen", //$NON-NLS-0$  //$NON-NLS-1$
	"Working Directory": "Arbeitsverzeichnis", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewWorkingDirVer": "Arbeitsverzeichnisversion der Datei anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading...": "Laden...", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories": "Alle Git-Repositorys", //$NON-NLS-0$  //$NON-NLS-1$
	"Repo": "Repositorys", //$NON-NLS-0$  //$NON-NLS-1$
	"0 on 1 - Git": "${0} in ${1} - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Git": "Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in eclipse.org": "In eclipse.org anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in GitHub": "In GitHub anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in GitHub": "Dieses Repository in GitHub anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit Details": "Festschreibungsdetails", //$NON-NLS-0$  //$NON-NLS-1$
	"No Commits": "Keine Festschreibung", //$NON-NLS-0$  //$NON-NLS-1$
	"commit: 0": "Festschreiben: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"parent: 0": "Übergeordnet: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"authored by 0 (1) on 2": "verfasst von ${0} <${1}> am ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"committed by 0 (1)": "festgeschrieben von ${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"committedby": "festgeschrieben von ", //$NON-NLS-0$  //$NON-NLS-1$
	"authoredby": "verfasst von ", //$NON-NLS-0$  //$NON-NLS-1$
	"on": " ein ", //$NON-NLS-0$  //$NON-NLS-1$
	"nameEmail": "${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags:": "Tags:", //$NON-NLS-0$  //$NON-NLS-1$
	"No Tags": "Keine Tags", //$NON-NLS-0$  //$NON-NLS-1$
	"Diffs": "Änderungen", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirChanges": "Änderungen am Arbeitsverzeichnis", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChanges": "Änderungen festschreiben", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChangesDialog": "Änderungen festschreiben", //$NON-NLS-0$  //$NON-NLS-1$
	"more": "mehr...", //$NON-NLS-0$  //$NON-NLS-1$
	"less": "weniger...", //$NON-NLS-0$  //$NON-NLS-1$
	"More": "Mehr", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFiles" : "Weitere Dateien", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFilesProgress": "Weitere Dateien werden geladen...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommits": "Mehr Festschreibungen für \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommitsProgress": "Weitere Festschreibungen für \"${0}\" werden geladen...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranches": "Mehr Verzweigungen für \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranchesProgress": "Weitere Verzweigungen für \"${0}\" werden geladen...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTags": "Weitere Tags", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTagsProgress": "Weitere Tags werden geladen...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashes": "Mehr Stashes", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashesProgress": "Weitere Stashes werden geladen...", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading git log...": "Git-Protokoll wird geladen...", //$NON-NLS-0$  //$NON-NLS-1$
	"local": "lokal", //$NON-NLS-0$  //$NON-NLS-1$
	"remote": "fern", //$NON-NLS-0$  //$NON-NLS-1$
	"View All": "Alle anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Error ${0}: ": "Fehler ${0}: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading ": "Ladevorgang läuft ", //$NON-NLS-0$  //$NON-NLS-1$
	"Message": "Nachricht", //$NON-NLS-0$  //$NON-NLS-1$
	"Author": "Autor", //$NON-NLS-0$  //$NON-NLS-1$
	"Date": "Datum", //$NON-NLS-0$  //$NON-NLS-1$
	"fromDate:": "Anfangstermin:", //$NON-NLS-0$  //$NON-NLS-1$
	"toDate:": "Endtermin:", //$NON-NLS-0$  //$NON-NLS-1$
	"Actions": "Aktionen", //$NON-NLS-0$  //$NON-NLS-1$
	"Branches": "Verzweigungen", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags": "Tags", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage": "Stufe", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged removal": "Nicht zwischengelagerte Entfernung", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage": "Nicht zwischenlagern", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged removal": "Zwischengelagerte Entfernung", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged change": "Nicht zwischengelagerte Änderung", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged change": "Zwischengelagerte Änderung", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged add": "Nicht zwischengelagerte Hinzufügung", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged add": "Zwischengelagerte Hinzufügung", //$NON-NLS-0$  //$NON-NLS-1$
	"Addition": "Hinzufügung", //$NON-NLS-0$  //$NON-NLS-1$
	"Deletion": "Löschung", //$NON-NLS-0$  //$NON-NLS-1$
	"Resolve Conflict": "Konflikt auflösen", //$NON-NLS-0$  //$NON-NLS-1$
	"Conflicting": "Mit Konflikt", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message": "Festschreibungsnachricht", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit": "Festschreiben", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitTooltip": "Schreibt die ausgewählte(n) Datei(en) mit der angegebenen Nachricht fest.", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthMsgLink":"Für ${0} ist eine Authentifizierung erforderlich. <a target=\"_blank\" href=\"${1}\">${2}</a> und wiederholen Sie die Anforderung. </span>", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCommit": "Festschreibungsnachricht eingeben", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCountCommit": "Datei(en) ${0} festschreiben", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend last commit": "Letzte Festschreibung korrigieren", //$NON-NLS-0$  //$NON-NLS-1$
	" Amend": " Korrigieren", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress. Choose action:": "Aktualisierung mit Referenzversionen in Bearbeitung. Aktion auswählen:", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgress": "Aktualisierung mit Referenzversionen in Bearbeitung", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseTip": "Führen Sie für Ihre Festschreibungen (Commits) eine Aktualisierung mit Referenzversionen durch, indem Sie sie aus der aktiven Verzweigung entfernen, die aktive Verzweigung dann auf der Basis des letzten Status von \"${0}\" erneut starten und jede Festschreibung erneut auf die aktualisierte aktive Verzweigung anwenden.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebasingRepo": "Aktualisierung mit Referenzversionen für Git-Repository", //$NON-NLS-0$  //$NON-NLS-1$
	"AddingConfig": "Git-Konfigurationseigenschaft wird hinzugefügt: Schlüssel=${0} Wert=${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"EditingConfig": "Git-Konfigurationseigenschaft wird bearbeitet: Schlüssel=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"DeletingConfig": "Git-Konfigurationseigenschaft wird gelöscht: Schlüssel=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"AddClone": "Repository wird geklont: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgressDetails": "Aktualisierung der Verzweigung mit Referenzversionen.\n\n\tVerwenden Sie 'Fortfahren', nachdem Sie die Konflikte gemischt und alle Dateien ausgewählt haben.\n\Verwenden Sie 'Überspringen', um den aktuellen Patch zu überspringen.\n\tVerwenden Sie jederzeit 'Stoppen', um die Aktualisierung mit Referenzversionen zu beenden.", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer name:": "Name des Festschreibungsverantwortlichen:", //$NON-NLS-0$  //$NON-NLS-1$
	"Name:": "Name:", //$NON-NLS-0$  //$NON-NLS-1$
	"email:": "E-Mail:", //$NON-NLS-0$  //$NON-NLS-1$
	"Email:": "E-Mail:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author name: ": "Name des Autors: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged": "Nicht zwischengelagert", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged": "Zwischengelagert", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangedFiles": "Geänderte Dateien", //$NON-NLS-0$  //$NON-NLS-1$
	"Recent commits on": "Kürzliche Festschreibungen in", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status": "Git-Status", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Status": "Öffnet die Seite 'Git-Status' für das Repository, das diese Datei oder diesen Ordner enthält.", //$NON-NLS-0$  //$NON-NLS-1$
	"GetGitIncomingMsg": "Eingehende Git-Änderungen werden abgerufen...", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout": "Auschecken", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out...": "Check-out läuft...", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage the change": "Änderung zwischenlagern", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging...": "Zwischenlagerung wird ausgeführt...", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutSelectedFiles": "Alle ausgewählten Dateien auschecken und alle Änderungen verwerfen", //$NON-NLS-0$  //$NON-NLS-1$
	"AddFilesToGitignore" : "Alle ausgewählten Dateien zu Datei(en) vom Typ .gitignore hinzufügen", //$NON-NLS-0$  //$NON-NLS-1$
	"Writing .gitignore rules" : ".gitignore-Regeln werden geschrieben", //$NON-NLS-0$  //$NON-NLS-1$ 
	"Save Patch": "Patch speichern", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage the change": "Zwischenlagerung der Änderung aufheben", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaging...": "Aufhebung der Zwischenlagerung wird ausgeführt...", //$NON-NLS-0$  //$NON-NLS-1$
	"Undo": "Widerrufen", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoTooltip": "Hebt diese Festschreibung auf, wobei alle geänderten Dateien beibehalten und keine Änderungen am Arbeitsverzeichnis vorgenommen werden.", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoConfirm": "Der Inhalt Ihrer aktiven Verzweigung wird ersetzt durch Festschreibung \"${0}\". Alle Änderungen im Festschreibungs- und im Arbeitsverzeichnis bleiben erhalten. Möchten Sie fortfahren?", //$NON-NLS-0$  //$NON-NLS-1$
	"Reset": "Zurücksetzen", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetConfirm": "Alle nicht zwischengelagerten und zwischengelagerten Änderungen im Arbeitsverzeichnis und im Index werden verworfen und können nicht wiederhergestellt werden.\n\nMöchten Sie tatsächlich fortfahren?", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutConfirm" : "Ihre Änderungen an den ausgewählten Dateien werden verworfen und können nicht wiederhergestellt werden.\n\nMöchten Sie tatsächlich fortfahren?", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetBranchDiscardChanges": "Verzweigung zurücksetzen und alle zwischengelagerten und nicht zwischengelagerten Änderungen verwerfen", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesIndexDiscardedMsg": "Alle nicht zwischengelagerten und zwischengelagerten Änderungen im Arbeitsverzeichnis und im Index werden verworfen und können nicht wiederhergestellt werden.", //$NON-NLS-0$  //$NON-NLS-1$
	"ContinueMsg": "Möchten Sie wirklich fortfahren?", //$NON-NLS-0$  //$NON-NLS-1$
	"KeepWorkDir" : "Arbeitsverzeichnis beibehalten", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes...": "Lokale Änderungen werden zurückgesetzt...", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue rebase...": "Aktualisierung mit Referenzversionen fortsetzen...", //$NON-NLS-0$  //$NON-NLS-1$
	"Skipping patch...": "Patch überspringen...", //$NON-NLS-0$  //$NON-NLS-1$
	"Aborting rebase...": "Aktualisierung mit Referenzversionen abbrechen...", //$NON-NLS-0$  //$NON-NLS-1$
	"Complete log": "Protokoll abschließen", //$NON-NLS-0$  //$NON-NLS-1$
	"local VS index": "Lokaler VS-Index", //$NON-NLS-0$  //$NON-NLS-1$
	"index VS HEAD": "VS HEAD - Index", //$NON-NLS-0$  //$NON-NLS-1$
	"Compare(${0} : ${1})": "Vergleich (${0} : ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading status...": "Status wird geladen...", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing...": "Festschreibung wird ausgeführt...", //$NON-NLS-0$  //$NON-NLS-1$
	"The author name is required.": "Der Name des Autors ist erforderlich.", //$NON-NLS-0$  //$NON-NLS-1$
	"The author mail is required.": "Die E-Mail des Autors ist erforderlich.", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoConflict": ". Das Repository enthält weiterhin Konflikte.", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoUnmergedPathResolveConflict": ". Das Repository enthält nicht zusammengeführte Pfade. Beheben Sie zuerst die Konflikte.", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering ${0}": "${0} wird dargestellt", //$NON-NLS-0$  //$NON-NLS-1$
	"Configuration": "Konfiguration", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting configuration of": "Konfiguration von ${0} wird abgerufen", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting git repository details": "Git-Repository-Details werden abgerufen...", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting changes": "Änderungen werden abgerufen", //$NON-NLS-0$  //$NON-NLS-1$
	" - Git": " - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories - Git": "Repositorys - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository": "Repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository Not Found": "Repository nicht gefunden", //$NON-NLS-0$  //$NON-NLS-1$
	"No Repositories": "Keine Repositorys", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repository": "Repository wird geladen", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repositories": "Repositorys werden geladen", //$NON-NLS-0$  //$NON-NLS-1$
	"(no remote)": "(kein Fernzugriff)", //$NON-NLS-0$  //$NON-NLS-1$
	"location: ": "Standort: ", //$NON-NLS-0$  //$NON-NLS-1$
	"NumFilesStageAndCommit": "${0} Datei(en) zwischenzulagern und ${1} Datei(en) festzuschreiben.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Nothing to commit.": "Nichts festzuschreiben.", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing to push.": "Nichts mit Push-Operation zu übertragen.", //$NON-NLS-0$  //$NON-NLS-1$
	"NCommitsToPush": "${0} mit Push-Operation zu übertragende Festschreibung(en).", //$NON-NLS-0$  //$NON-NLS-1$
	"You have no changes to commit.": "Sie haben keine festzuschreibenden Änderungen.", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress!": "Aktualisierung mit Referenzversionen wird verarbeitet!", //$NON-NLS-0$  //$NON-NLS-1$
	"View all local and remote tracking branches": "Alle lokalen und fernen Verfolgungsverzweigungen anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"tracksNoBranch": "verfolgt keine Verzweigung", //$NON-NLS-0$  //$NON-NLS-1$
	"tracks": "verfolgt ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"last modified ${0} by ${1}": "letzte Änderung ${0} durch ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remote Branches": "Keine fernen Verzweigungen", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering branches": "Verzweigungen darstellen", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits": "Festschreibungen", //$NON-NLS-0$  //$NON-NLS-1$
	"GettingCurrentBranch": "Aktuelle Verzweigung für ${0} wird abgerufen", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Log": "Vollständiges Protokoll anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"See the full log": "Informationen enthält das vollständige Protokoll", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting commits for \"${0}\" branch": "Festschreibungen für Verzweigung \"${0}\" werden abgerufen", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering commits": "Festschreibungen werden dargestellt", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting outgoing commits": "Abgehende Festschreibungen werden abgerufen", //$NON-NLS-0$  //$NON-NLS-1$
	"The branch is up to date.": "Die Verzweigung ist auf dem neuesten Stand.", //$NON-NLS-0$  //$NON-NLS-1$
	"NoOutgoingIncomingCommits": "Sie haben keine abgehenden oder eingehenden Festschreibungen.", //$NON-NLS-0$  //$NON-NLS-1$
 	") by ": ") von ", //$NON-NLS-0$  //$NON-NLS-1$
	" (SHA ": " (SHA ", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting tags": "Tags werden abgerufen", //$NON-NLS-0$  //$NON-NLS-1$
	"View all tags": "Alle Tags anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	" on ": " ein ", //$NON-NLS-0$  //$NON-NLS-1$
	" by ": " nach ", //$NON-NLS-0$  //$NON-NLS-1$
	"Remotes": "Ferne", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering remotes": "Ferne werden dargestellt", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remotes": "Keine fernen", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged addition": "Nicht zwischengelagerte Addition", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged addition": "Zwischengelagerte Addition", //$NON-NLS-0$  //$NON-NLS-1$
	" (Rebase in Progress)": " (Aktualisierung mit Referenzversionen in Bearbeitung)", //$NON-NLS-0$  //$NON-NLS-1$
	"Status": "Status", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0)": "Protokoll (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0) - 1": "Protokoll (${0}) - ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Status for ${0} - Git ": "Status für ${0} - Git ", //$NON-NLS-0$  //$NON-NLS-1$
	"No Unstaged Changes": "Keine nicht zwischengelagerten Änderungen", //$NON-NLS-0$  //$NON-NLS-1$
	"No Staged Changes": "Keine zwischengelagerten Änderungen", //$NON-NLS-0$  //$NON-NLS-1$
	"Changes for \"${0}\" branch": "Änderungen für ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch": "Änderungen für ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch against": "Festschreibungen für die Verzweigung \"${0}\" für", //$NON-NLS-0$  //$NON-NLS-1$
	"Add Remote": "Ferne hinzufügen", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Name:": "Name der fernen Einheit:", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote URI:": "URI der fernen Einheit:", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply Patch": "Patch anwenden", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyPatchDialog": "Patch anwenden", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Repository": "Git-Repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the git repository": "Öffnet die Git-Repository-Seite für diese Datei oder diesen Ordner.", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Git Repository": "Git-Repository klonen", //$NON-NLS-0$  //$NON-NLS-1$
	"CloneGitRepositoryDialog": "Git-Repository klonen", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository URL:": "Repository-URL:", //$NON-NLS-0$  //$NON-NLS-1$
	"Existing directory:": "Vorhandenes Verzeichnis:", //$NON-NLS-0$  //$NON-NLS-1$
	"New folder:": "Neuer Ordner:", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseFolderDialog": "Ordner auswählen", //$NON-NLS-0$  //$NON-NLS-1$
	"Message:": "Nachricht:", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend:": "Korrigieren:", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartAmend": "Vorherige Festschreibung ändern", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangeId:": "Änderungs-ID:", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartChangeId": "Änderungs-ID zu Nachricht hinzufügen", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Name:": "Name des Festschreibungsverantwortlichen:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Email:": "E-Mail des Festschreibungsverantwortlichen:", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorNamePlaceholder": "Name des Autors eingeben", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorEmailPlaceholder": "E-Mail des Autors eingeben", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterNamePlaceholder": "Name des Festschreibungsverantwortlichen eingeben", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterEmailPlaceholder": "E-Mail des Festschreibungsverantwortlichen eingeben", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Name:": "Autorenname:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Email:": "E-Mail des Autors:", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit message is required.": "Die Festschreibungsnachricht ist erforderlich.", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Credentials": "Git-Berechtigungsnachweise", //$NON-NLS-0$  //$NON-NLS-1$
	"Username:": "Benutzername:", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key:": "Privater Schlüssel:", //$NON-NLS-0$  //$NON-NLS-1$
	"Passphrase (optional):": "Kennphrase (optional):", //$NON-NLS-0$  //$NON-NLS-1$
	"commit:": "Festschreiben: ", //$NON-NLS-0$  //$NON-NLS-1$
	"parent:": "Übergeordnetes Element: ", //$NON-NLS-0$  //$NON-NLS-1$
	"branches: ": "Verzweigungen: ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags: ": "Tags: ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags": "Tags", //$NON-NLS-0$  //$NON-NLS-1$
	" authored by ${0} {${1}) on ${2}": " verfasst von ${0} (${1}) am ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"Content": "Inhalt", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to ${0} section": "Gehe zum Abschnitt ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Type the commit name (sha1):": "Geben Sie den Festschreibungsnamen (sha1) ein:", //$NON-NLS-0$  //$NON-NLS-1$
	"Search": "Suchen", //$NON-NLS-0$  //$NON-NLS-1$
	"Searching...": "Suchen...", //$NON-NLS-0$  //$NON-NLS-1$
	"SelectAll": "Alles auswählen", //$NON-NLS-0$  //$NON-NLS-1$
	"Looking for the commit": "Festschreibung wird gesucht", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch:": "Neue Verzweigung:", //$NON-NLS-0$  //$NON-NLS-1$
	"No remote selected": "Keine fernen ausgewählt", //$NON-NLS-0$  //$NON-NLS-1$
	"Enter a name...": "Namen eingeben...", //$NON-NLS-0$  //$NON-NLS-1$
	"OK": "OK", //$NON-NLS-0$  //$NON-NLS-1$
	"Cancel": "Abbrechen", //$NON-NLS-0$  //$NON-NLS-1$
	"Clear": "Inhalt löschen", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter": "Filter", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommits": "Festschreibungen filtern", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommitsTip": "Aktiviert bzw. inaktiviert die Anzeige 'Festschreibungen filtern'", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeCmd": "Maximieren", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeTip": "Aktiviert bzw. inaktiviert den Maximierungsstatus des Editors", //$NON-NLS-0$  //$NON-NLS-1$
	" [New branch]": " [Neue Verzweigung]", //$NON-NLS-0$  //$NON-NLS-1$
	"AddKeyToHostContinueOp": "Wollen Sie den Schlüssel ${0} für den Host ${1} hinzufügen, um die Operation fortzusetzen? Schlüssel für elektronischen Fingerabdruck ist ${2}.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Link Repository": "Link-Repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Folder name:": "Ordnername:", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository was linked to ": "Repository wurde verknüpft mit ", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutCommitTooltip": "Checkt diese Festschreibung aus und erstellt dabei eine lokale Verzweigung auf der Basis des Inhalts.", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutTagTooltip": "Checkt diesen Tag aus und erstellt dabei eine lokale Verzweigung auf der Basis des Inhalts.", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out ${0}": "${0} wird ausgecheckt", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutBranchMsg": "Checken Sie die Verzweigung oder die entsprechende lokale Verzweigung aus und aktivieren Sie sie. Wenn die ferne Verfolgungsverzweigung nicht über eine entsprechende lokale Verzweigung verfügt, dann wird die lokale Verzweigung zuerst erstellt.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Checking out branch...": "Verzweigung wird ausgecheckt", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding branch ${0}...": "Verzweigung ${0} wird hinzugefügt", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing branch ${0}...": "Verzweigung ${0} wird entfernt", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding remote ${0}...": "${0} (fern) wird hinzugefügt", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote ${0}...": "${0} (fern) wird entfernt", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing repository ${0}": "Repository ${0} wird entfernt", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding tag {$0}": "Tag ${0} wird hinzugefügt", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing tag {$0}": "Tag ${0} wird entfernt", //$NON-NLS-0$  //$NON-NLS-1$
	"Merging ${0}": "Merge-Operation für ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	'Unstaging changes' : 'Aufhebung der Zwischenlagerung für Änderungen wird ausgeführt', //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out branch ${0}...": "Verzweigung ${0} wird ausgecheckt", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch checked out.": "Verzweigung wurde ausgecheckt.", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch": "Neue Verzweigung", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new local branch to the repository": "Neue lokale Verzweigung zum Repository hinzufügen", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch name": "Name der Verzweigung", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete": "Löschen", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the local branch from the repository": "Lokale Verzweigung aus Repository löschen", //$NON-NLS-0$  //$NON-NLS-1$
	"DelBrConfirm": "Soll die Verzweigung ${0} wirklich gelöscht werden?", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote tracking branch from the repository": "Ferne Verfolgungsverzweigung aus Repository löschen", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure?": "Möchten Sie fortfahren?", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoveRemoteBranchConfirm": "Sie sind dabei, die ferne Verzweigung \"${0}\" zu löschen und die Änderung mit einer Push-Operation zu übertragen.\n\nMöchten Sie tatsächlich fortfahren?", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote branch: ": "Ferne Verzweigung wird entfernt: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete Remote Branch": "Ferne Verzweigung löschen", //$NON-NLS-0$  //$NON-NLS-1$
	"New Remote": "Neu - Fern", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Remote": "Git - Fern", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Remote": "Öffnet die ferne Seite 'Git-Protokoll' für diese Datei oder diesen Ordner.", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new remote to the repository": "Neues fernes Element zum Repository hinzufügen", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote from the repository": "Fernes Element aus dem Repository löschen", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete remote ${0}?": "Soll das ferne Element ${0} wirklich gelöscht werden?", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull": "Pull-Operation", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull from the repository": "Mit Pull-Operation aus dem Repository extrahieren", //$NON-NLS-0$  //$NON-NLS-1$
	"Pulling: ": "Pull-Operation wird ausgeführt: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull Git Repository": "Git-Repository mit Pull-Operation extrahieren", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Log": "Git-Protokoll", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Log": "Öffnet die lokale Seite 'Git-Protokoll' für diese Datei oder diesen Ordner.", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the branch": "Protokoll für Verzweigung öffnen", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the repository": "Protokoll für Repository öffnen", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the status for the repository": "Status für Repository öffnen", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditor": "In Editor anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditorTooltip": "Repositoryordner in Editor anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareEach": "Miteinander vergleichen", //$NON-NLS-0$  //$NON-NLS-1$
 	"Compare With Working Tree": "Mit Arbeitsbaumstruktur vergleichen", //$NON-NLS-0$  //$NON-NLS-1$
	"Open": "Öffnen", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenGitCommitTip": "Baumstruktur für diese Festschreibung anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitVersion": "Festschreibung öffnen", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewCommitVersionTip": "Die festgeschriebene Version der Datei anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch": "Abruf", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote": "Aus fernem Element abrufen", //$NON-NLS-0$  //$NON-NLS-1$
	"Password:": "Kennwort:", //$NON-NLS-0$  //$NON-NLS-1$
	"User Name:": "Benutzername:", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching remote: ": "Fernes Element abrufen: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Fetch": "Abruf erzwingen", //$NON-NLS-0$  //$NON-NLS-1$
	"FetchRemoteBranch": "Aus ferner Verzweigung abrufen und in ferne Verfolgungsverzweigung einlesen und dabei den aktuellen Inhalt überschreiben", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentRemoteTrackingBr": "Sie sind dabei, den Inhalt der fernen Verfolgungsverzweigung zu überschreiben. Dadurch gehen die Festschreibungen der Verzweigung möglicherweise verloren.", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge": "Mischen", //$NON-NLS-0$  //$NON-NLS-1$
	"MergeContentFrmBr": "Inhalt aus der Verzweigung in die aktive Verzweigung mischen", //$NON-NLS-0$  //$NON-NLS-1$
 	". Go to ${0}.": ". Wechseln zu ${0}.", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status page": "Seite 'Git-Status'", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase": "Aktualisierung mit Referenzversionen", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsMsg": "Führen Sie für Ihre Festschreibungen eine Aktualisierung mit Referenzversionen durch, indem Sie sie aus der aktiven Verzweigung entfernen und die aktive Verzweigung dann auf der Basis des letzten Status der ausgewählten Verzweigung starten. ", //$NON-NLS-0$  //$NON-NLS-1$
 	"Rebase on top of ": "Aktualisierung mit Referenzversionen über ", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseSTOPPED": ". Es sind Konflikte aufgetreten. Beheben Sie sie und setzen Sie die Verarbeitung dann fort, überspringen Sie den Patch oder brechen Sie die Aktualisierung mit Referenzversionen ab.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_WRONG_REPOSITORY_STATE": ". Der Repository-Status ist ungültig (d. h. bereits während der Aktualisierung mit Referenzversionen).", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_UNMERGED_PATHS": ". Das Repository enthält nicht zusammengeführte Pfade.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_PENDING_CHANGES": ". Das Repository enthält anstehende Änderungen. Festschreibung oder Stash dafür duchführen.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseUNCOMMITTED_CHANGES": ". Es sind nicht festgeschriebene Änderungen vorhanden.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsByRmvingThem": "Führen Sie für Ihre Festschreibungen eine Aktualisierung mit Referenzversionen durch, indem Sie sie aus der aktiven Verzweigung entfernen und ", //$NON-NLS-0$  //$NON-NLS-1$
	"StartActiveBranch": "und die aktive Verzweigung dann auf der Basis des letzten Status der", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyEachCommitAgain": "und wenden Sie jede Festschreibung erneut auf die aktualisierte, aktive Verzweigung an.", //$NON-NLS-0$  //$NON-NLS-1$
	"Push All": "Alles mit Push-Operation übertragen", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocal": "Festschreibungen und Tags mit einer Push-Operation von der lokalen Verzweigung in die ferne Verzweigung übertragen", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push Branch": "Push-Operation für Verzweigung durchführen", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushResult": "Push-Operation für Ergebnis durchführen:", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushCommitsWithoutTags": "Festschreibungen und Tags mit Push-Operation von der lokalen Verzweigung in die ferne Verzweigung übertragen", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push for Review": "Push-Operation für Überprüfung durchführen", //$NON-NLS-0$  //$NON-NLS-1$
	"Push commits to Gerrit Code Review": "Festschreibungen mit Push-Operation an Gerrit-Codeüberprüfung übertragen", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push Branch": "Push-Operation für Verzweigung erzwingen", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsWithoutTagsOverridingCurrentContent": "Festschreibungen ohne Tags mit Push-Operation von der lokalen Verzweigung in die ferne Verzweigung übertragen und dabei den aktuellen Inhalt überschreiben", //$NON-NLS-0$  //$NON-NLS-1$
 	"Pushing remote: ": "Ferne Elemente mit Push-Operation übertragen: ", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseBranchDialog": "Verzweigung auswählen", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose the remote branch.": "Wählen Sie die ferne Verzweigung aus.", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push All": "Übertragung aller Elemente mit einer Push-Operation erzwingen", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocalBr": "Festschreibungen und Tags mit einer Push-Operation von der lokalen Verzweigung in die ferne Verzweigung übertragen und dabei den aktuellen Inhalt überschreiben", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentOfRemoteBr": "Sie sind dabei, den Inhalt der fernen Verzweigung zu überschreiben. Dadurch gehen die Festschreibungen im fernen Repository möglicherweise verloren.", //$NON-NLS-0$  //$NON-NLS-1$
	"< Previous Page": "< Vorherige Seite", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git log": "Vorherige Seite des Git-Protokolls anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git tags" : "Vorherige Seite der Git-Tags anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Next Page >": "Nächste Seite >", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git log": "Nächste Seite des Git-Protokolls anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git tags" : "Nächste Seite der Git-Tags anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the selected remote branch": "Mit Push-Operation von der lokalen Verzweigung in die ausgewählte ferne Verzweigung übertragen", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetActiveBr": "Setzen Sie die aktive Verzweigung in den Status dieser Referenz zurück. Verwerfen Sie alle zwischengelagerten und nicht zwischengelagerten Änderungen.", //$NON-NLS-0$  //$NON-NLS-1$
 	"GitResetIndexConfirm": "Der Inhalt Ihrer aktiven Verzweigung wird ersetzt durch Festschreibung \"${0}\". Alle nicht zwischengelagerten und zwischengelagerten Änderungen werden verworfen und können nicht wiederhergestellt werden, wenn \"${1}\" nicht überprüft wird. Möchten Sie fortfahren?", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting index...": "Index wird zurückgesetzt...", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting git index for ${0}" : "Git-Index ${0} wird zurückgesetzt", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag": "Tag", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a tag for the commit": "Tag für Festschreibung erstellen", //$NON-NLS-0$  //$NON-NLS-1$
	"ProjectSetup": "Ihr Projekt wird eingerichtet. Dies kann eine Minute dauern...", //$NON-NLS-0$  //$NON-NLS-1$
	"LookingForProject": "Projekt wird gesucht: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag name": "Tag-Name", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the tag from the repository": "Tag aus Repository löschen", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete tag ${0}?": "Soll der Tag ${0} wirklich gelöscht werden?", //$NON-NLS-0$  //$NON-NLS-1$
	"Cherry-Pick": "Cherry-Pick", //$NON-NLS-0$  //$NON-NLS-1$
	"CherryPicking": "Cherry-Picking für Festschreibung: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RevertingCommit": "Revert-Operation für Festschreibung: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the change introduced by the commit to your active branch": "Durch Festschreibung definierte Änderung in aktiver Verzweigung anwenden", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing changed.": "Keine Änderungen vorgenommen.", //$NON-NLS-0$  //$NON-NLS-1$
	". Some conflicts occurred": ". Es sind Konflikte aufgetreten.", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote branch into your remote tracking branch": "Aus ferner Verzweigung abrufen und in ferne Verfolgungsverzweigung einlesen", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch Git Repository": "Git-Repository abrufen", //$NON-NLS-0$  //$NON-NLS-1$
	"Push": "Push-Operation", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the remote branch": "Mit Push-Operation von der lokalen Verzweigung in die ferne Verzweigung übertragen", //$NON-NLS-0$  //$NON-NLS-1$
	"Push Git Repository": "Git-Repository mit Push-Operation übertragen", //$NON-NLS-0$  //$NON-NLS-1$
	"Key:": "Schlüssel:", //$NON-NLS-0$  //$NON-NLS-1$
	"Value:": "Wert:", //$NON-NLS-0$  //$NON-NLS-1$
	"New Configuration Entry": "Neuer Konfigurationseintrag", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit": "Bearbeiten", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit the configuration entry": "Konfigurationseintrag bearbeiten", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the configuration entry": "Konfigurationseintrag löschen", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete ${0}?": "Sind Sie sicher, dass Sie ${0} löschen möchten?", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Repository": "Repository klonen", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone an existing Git repository to a folder": "Vorhandenes Git-Repository in einem Ordner klonen", //$NON-NLS-0$  //$NON-NLS-1$
	"Cloning repository: ": "Repository wird geklont: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Repository": "Repository initialisieren", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a new Git repository in a new folder": "Neues Git-Repository in einem neuen Ordner erstellen", //$NON-NLS-0$  //$NON-NLS-1$
	"Initializing repository: ": "Repository initialisieren: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Git Repository": "Git-Repository initialisieren", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the repository": "Repository löschen", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want do delete ${0} repositories?": "Sollen die ${0} Repositorys wirklich gelöscht werden?", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply a patch on the selected repository": "Patch auf ausgewähltes Repository anwenden", //$NON-NLS-0$  //$NON-NLS-1$
	"Show content": "Inhalt anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit name:": "Name der Festschreibung:", //$NON-NLS-0$  //$NON-NLS-1$
	"Open Commit": "Festschreibung öffnen", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitDialog": "Festschreibung öffnen", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the commit with the given name": "Festschreibung mit angegebenem Namen öffnen", //$NON-NLS-0$  //$NON-NLS-1$
	"No commits found": "Keine Festschreibungen gefunden", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging changes": "Änderungen werden zwischengelagerten", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message:": "Festschreibungsnachricht:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing changes": "Änderungen werden festgeschrieben", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching previous commit message": "Vorherige Festschreibungsnachricht wird abgerufen", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes": "Lokale Änderungen werden zurückgesetzt", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout files, discarding all changes": "Dateien auschecken und alle Änderungen verwerfen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Patch": "Patch anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading default workspace": "Standadrdarbeitsbereich wird geladen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show workspace changes as a patch": "Arbeitsbereichsänderungen als Patch anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show checked changes as a patch": "Geprüfte Änderungen als Patch anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowCommitPatchTip": "Patch für Änderungen in dieser Festschreibung anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue": "Weiter", //$NON-NLS-0$  //$NON-NLS-1$
	"Contibue Rebase": "Mit der Aktualisierung mit Referenzversionen fortsetzen", //$NON-NLS-0$  //$NON-NLS-1$
	"Skip Patch": "Patch überspringen", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort": "Stoppen", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort Rebase": "Aktualisierung mit Referenzversionen abbrechen", //$NON-NLS-0$  //$NON-NLS-1$
	"Discard": "Verwerfen", //$NON-NLS-0$  //$NON-NLS-1$
	"Ignore": "Ignorieren", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesSelectedFilesDiscard": "Ihre Änderungen an den ausgewählten Dateien werden gelöscht und können nicht wiederhergestellt werden.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Getting git log": "Git-Protokoll wird abgerufen", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting stashed changes...": "Stash-Änderungen werden abgerufen...", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch (${0})": "Aktive Verzweigung (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch (${0})": "Verzweigung (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag (${0})": "Tag (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit (${0})": "Festschreibung (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommit (${0})": "Stash (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"WIPStash": "Bearbeitung läuft für ${0}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"IndexStash": "Indexierung läuft für ${0}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranch (${0})": "Ferne Verzweigung (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch Log": "Git-Protokoll (aktive Verzweigung)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the active local branch": "Protokoll der aktiven lokalen Verzweigung anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Branch Log": "Git-Protokoll (ferne Verzweigung)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the corresponding remote tracking branch": "Protokoll der entsprechenden fernen Verfolgungsverzweigung anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Status" : "Informationen finden Sie unter dem vollständigen Status", //$NON-NLS-0$  //$NON-NLS-1$
	"See the status" : "Informationen finden Sie unter dem Status", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose target location" : "Zielposition auswählen", //$NON-NLS-0$  //$NON-NLS-1$
	"Default target location" : "Standardzielposition", //$NON-NLS-0$  //$NON-NLS-1$
	"Change..." : "Ändern...", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge Squash": "Zusammenführen und Komprimieren", //$NON-NLS-0$  //$NON-NLS-1$
	"Squash the content of the branch to the index" : "Inhalt der Verzweigung im Index komprimieren", //$NON-NLS-0$  //$NON-NLS-1$
	"Local Branch Name:" : "Name der lokalen Verzweigung:", //$NON-NLS-0$  //$NON-NLS-1$
	"Local": "lokal", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter items" : "Elemente filtern", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter filter" : "Nachricht filtern", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter author" : "Autor filtern", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter committer" : "Festschreibungsverantwortlichen filtern", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter sha1" : "Filter sha1", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter fromDate" : "Filtern von Datum JJJJ-MM-TT oder 1(h d w m y)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter toDate" : "Filtern bis Datum JJJJ-MM-TT oder 1(h d w m y)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter path" : "Pfad filtern", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter remote branches" : "Ferne Verzweigungen filtern", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote branches" : "Ferne Verzweigungen ${0} werden abgerufen", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote details": "Ferne Details werden abgerufen: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchApplied": "Patch wurde erfolgreich angewendet", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchFailed": "Anwendung des Patch fehlgeschlagen. ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting branches" : "Verzweigungen ${0} werden abgerufen", //$NON-NLS-0$  //$NON-NLS-1$
	"Paste link in email or IM" : "Link in E-Mail oder IM einfügen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in GitHub" : "Festschreibung in GitHub anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in GitHub" : "Repository in GitHub anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in GitHub": "Diese Festschreibung in GitHub anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in eclipse.org": "Festschreibung in eclipse.org anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in eclipse.org" : "Diese Festschreibung in eclipse.org anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in eclipse.org":"Repository in eclipse.org anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in eclipse.org":"Dieses Repository in eclipse.org anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review" : "nach Prüfung fragen", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review tooltip" : "E-Mail mit Anfrage für Festschreibungsprüfung senden", //$NON-NLS-0$  //$NON-NLS-1$
	"Reviewer name" : "Prüfername", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request" : "Anforderung zur Beitragsprüfung", //$NON-NLS-0$  //$NON-NLS-1$
	"Send the link to the reviewer" : "Link an den Prüfer senden", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key file (optional):" : "Private schlüsseldatei (optional):", //$NON-NLS-0$  //$NON-NLS-1$
	"Don't prompt me again:" : "Nicht wieder anfragen:", //$NON-NLS-0$  //$NON-NLS-1$
	"Your private key will be saved in the browser for further use" : "Ihr privater Schlüssel wird im Browser zur weiteren Verwendung gespeichert.", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading Contribution Review Request..." : "Anforderung zur Beitragsprüfung wird geladen...", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit can be found in the following repositories" : "Die Festschreibung ist in den folgenden Repositorys zu finden:", //$NON-NLS-0$  //$NON-NLS-1$
	"Try to update your repositories" : "Versuchen Sie, Ihre Repositorys zu aktualisieren.", //$NON-NLS-0$  //$NON-NLS-1$
	"Create new repository" : "Neues Repository erstellen", //$NON-NLS-0$  //$NON-NLS-1$
	"Attach the remote to one of your existing repositories" : "Fernes Repository an eines der vorhandenen Repositorys anhängen", //$NON-NLS-0$  //$NON-NLS-1$
	"You are reviewing contribution ${0} from ${1}" : "Sie prüfen momentan den Beitrag ${0} von ${1}.", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitNotFoundInWorkspace" : "Die Festschreibung wurde leider in Ihrem Arbeitsbereich nicht gefunden. Versuchen Sie es mit einer der folgenden Aktionen, um es anzuzeigen: ", //$NON-NLS-0$  //$NON-NLS-1$
 	"To review the commit you can also:" : "Zum Prüfen der Festschreibung stehen Ihnen auch die folgenden Möglichkeiten zur Verfügung:", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request for ${0} on ${1}" : "Anforderung zur Beitragsprüfung für ${0} auf ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Failing paths: ${0}": "Fehlgeschlagene Pfade: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Problem while performing the action": "Problem bei Ausführung der Aktion", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the Orion repositories page to provide a git repository URL. Once the repository is created, it will appear in the Navigator.": "Rufen Sie die Orion-Repository-Seite auf, um die URL für ein Git-Repository anzugeben. Nach der Erstellung des Repositorys wird es im Navigator angezeigt.", //$NON-NLS-0$  //$NON-NLS-1$
	"URL:": "URL:", //$NON-NLS-0$  //$NON-NLS-1$
	"File:": "Datei:", //$NON-NLS-0$  //$NON-NLS-1$
	"Submit": "Übergeben", //$NON-NLS-0$  //$NON-NLS-1$
	"git url:": "Git-URL: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert": "Zurücksetzen", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert changes introduced by the commit into your active branch": "Änderungen umkehren, die durch Festschreibung in aktiver Verzweigung stattfanden", //$NON-NLS-0$  //$NON-NLS-1$
	". Could not revert into active branch": ". Zurücksetzen in die aktive Verzweigung war nicht möglich.", //$NON-NLS-0$  //$NON-NLS-1$
	"Login": "Anmelden", //$NON-NLS-0$  //$NON-NLS-1$
	"Authentication required for: ${0}. ${1} and re-try the request.": "Für ${0} ist eine Authentifizierung erforderlich. ${1} und wiederholen Sie die Anforderung.", //$NON-NLS-0$  //$NON-NLS-1$
	"Save":"Speichern", //$NON-NLS-0$  //$NON-NLS-1$
	"Remember my committer name and email:":"Meinen Namen als Festschreibungsverantwortlicher und meine E-Mail-Adresse merken:", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully edited ${0} to have value ${1}":"Erfolgreiche Bearbeitung von ${0} mit dem Wert ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully added ${0} with value ${1}":"Erfolgreiches Ergänzen von ${0} mit dem Wert ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Signed-off-by: ":"Abgezeichnet durch: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Change-Id: ":"Änderungs-ID: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Push_REJECTED_NONFASTFORWARD":"Die Push-Operation ist nicht vorwärts gerichtet und wurde abgelehnt. Verwenden Sie 'Fetch', damit neue Festschreibungen angezeigt werden, die gemischt werden müssen.", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit and Push" : "Festschreibung und mit Push-Operation übertragen", //$NON-NLS-0$  //$NON-NLS-1$
	"Sync" : "Sync", //$NON-NLS-0$  //$NON-NLS-1$
	"SyncTooltip" : "Ruft aus der fernen Verzweigung ab. Führen Sie für Ihre Festschreibungen eine Aktualisierung mit Referenzversionen durch, indem Sie sie aus der lokalen Verzweigung entfernen, die lokale Verzweigung dann auf der Basis des letzten Status der fernen Verzweigung erneut starten und jede Festschreibung auf die aktualisierte lokale Verzweigung anwenden. Festschreibungen und Tags werden mit einer Push-Operation von der lokalen Verzweigung in die ferne Verzweigung übertragen.", //$NON-NLS-0$  //$NON-NLS-1$
	"NoCommits" : "Keine Änderungen", //$NON-NLS-0$  //$NON-NLS-1$
	"NoContent" : "Kein Inhalt", //$NON-NLS-0$  //$NON-NLS-1$
	"Incoming" : "Eingehend", //$NON-NLS-0$  //$NON-NLS-1$
	"Outgoing" : "Abgehend", //$NON-NLS-0$  //$NON-NLS-1$
	"IncomingWithCount" : "Eingehend (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"OutgoingWithCount" : "Abgehend (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Synchronized" : "Verlaufsprotokoll", //$NON-NLS-0$  //$NON-NLS-1$
	"Uncommited" : "Nicht festgeschrieben", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository:" : "Repository:", //$NON-NLS-0$  //$NON-NLS-1$
	"Reference:" : "Verweis:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author:" : "Autor:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer:" : "Festschreibungsverantwortlicher:", //$NON-NLS-0$  //$NON-NLS-1$
	"SHA1:" : "SHA1:", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchCmd" : "Aktive Verzweigung anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceCmd": "Verweis anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceTip": "Verlaufsprotokoll von ${1} \"${2}\" anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchTip": "Verlaufsprotokoll von \"${0}\" relativ zu ${1} \"${2}\" anzeigen", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitType": "Festschreibung", //$NON-NLS-0$  //$NON-NLS-1$
	"BranchType": "Verzweigung", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranchType": "Ferne Verzweigung", //$NON-NLS-0$  //$NON-NLS-1$
	"TagType": "Tag", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommitType": "Stash", //$NON-NLS-0$  //$NON-NLS-1$
	"Path:" : "Pfad:", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChanges" : "Änderungen am Arbeitsverzeichnis", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChangesDetails" : "Details des Arbeitsverzeichnisses", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareChanges" : "Vergleich (${0} => ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"NoBranch" : "Keine Verzweigung", //$NON-NLS-0$  //$NON-NLS-1$
	"NoActiveBranch" : "Keine aktive Verzweigung", //$NON-NLS-0$  //$NON-NLS-1$
	"NoRef" : "Keine ausgewählte Referenz", //$NON-NLS-0$  //$NON-NLS-1$
	"None": "Keine Angabe", //$NON-NLS-0$  //$NON-NLS-1$
	"FileSelected": "${0} Datei ausgewählt", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesSelected": "${0} Dateien ausgewählt.", //$NON-NLS-0$  //$NON-NLS-1$
	"FileChanged": "${0} Datei geändert", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChanged": "${0} Dateien geändert", //$NON-NLS-0$  //$NON-NLS-1$
	"file": "Datei", //$NON-NLS-0$  //$NON-NLS-1$
	"files": "Dateien", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitConfirm": "Sie haben keine Dateien ausgewählt. Möchten Sie fortfahren?", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitWarning": "Die Festschreibung ist leer", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChangedVsReadyToCommit": "${0} ${1} geändert. ${2} ${3} für Festschreibung bereit.", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitPush": "Festschreibung und mit Push-Operation übertragen", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits and pushes files to the default remote": "Schreibt Dateien fest und überträgt sie mit Push-Operation an die ferne Standardposition", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash" : "Stash", //$NON-NLS-0$  //$NON-NLS-1$
	"stashIndex" : "stash@{${0}}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash all current changes away" : "Stash für alle aktuellen Änderungen", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop" : "Freigeben", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop the commit from the stash list" : "Die Festschreibung aus der Stash-Liste freigeben", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply" : "Anwenden", //$NON-NLS-0$  //$NON-NLS-1$
	"Pop Stash" : "Pop-Stash", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the most recently stashed change to your active branch and drop it from the stashes" : "Die aktuellste Stash-Änderung in der aktiven Verzweigung anwenden und diese aus den Stashes freigeben", //$NON-NLS-0$  //$NON-NLS-1$
	"stashes" : "Stashes", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyName': "Git-Repository", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyTooltip': "Diesem Projekt ein Git-Repository zuordnen.",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectName': "Git-Repository",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectTooltip': "Ein Projekt aus einem Git-Repository erstellen.",  //$NON-NLS-0$  //$NON-NLS-1$
	'fetchGroup': 'Abruf',  //$NON-NLS-0$  //$NON-NLS-1$
	'pushGroup' : 'Push-Operation',  //$NON-NLS-0$  //$NON-NLS-1$
	'Url:' : 'URL:', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Private Key:' : 'Privater SSH-Schlüssel:', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Passphrase:' : 'SSH-Kennphrase:', //$NON-NLS-0$  //$NON-NLS-1$
	'confirmUnsavedChanges': 'Nicht gespeicherte Änderungen vorhanden. Möchten Sie sie speichern?' //$NON-NLS-1$ //$NON-NLS-0$
});

