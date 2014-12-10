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
	"Compare": "Confronta", //$NON-NLS-0$  //$NON-NLS-1$
	"View the side-by-side compare": "Visualizza confronto", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirVer": "Apri directory di lavoro", //$NON-NLS-0$  //$NON-NLS-1$
	"Working Directory": "Directory di lavoro", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewWorkingDirVer": "Visualizzare la versione della directory di lavoro del file", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading...": "Caricamento...", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories": "Tutti i repository Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repo": "Repository", //$NON-NLS-0$  //$NON-NLS-1$
	"0 on 1 - Git": "${0} su ${1} - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Git": "Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in eclipse.org": "Mostra in eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in GitHub": "Mostra in GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in GitHub": "Mostra questo repository in GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit Details": "Dettagli commit", //$NON-NLS-0$  //$NON-NLS-1$
	"No Commits": "Nessun commit", //$NON-NLS-0$  //$NON-NLS-1$
	"commit: 0": "commit: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"parent: 0": "parent: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"authored by 0 (1) on 2": "creato da ${0} <${1}> su ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"committed by 0 (1)": "sottoposto a commit da ${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"committedby": "sottoposto a commit da ", //$NON-NLS-0$  //$NON-NLS-1$
	"authoredby": "autore ", //$NON-NLS-0$  //$NON-NLS-1$
	"on": " attivo ", //$NON-NLS-0$  //$NON-NLS-1$
	"nameEmail": "${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags:": "Tag:", //$NON-NLS-0$  //$NON-NLS-1$
	"No Tags": "Nessuna tag", //$NON-NLS-0$  //$NON-NLS-1$
	"Diffs": "Modifiche", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirChanges": "Modifiche alla directory di lavoro", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChanges": "Applica le modifiche", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChangesDialog": "Applica le modifiche", //$NON-NLS-0$  //$NON-NLS-1$
	"more": "di più ...", //$NON-NLS-0$  //$NON-NLS-1$
	"less": "di meno ...", //$NON-NLS-0$  //$NON-NLS-1$
	"More": "Altro", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFiles" : "Altri file", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFilesProgress": "Caricamento di altri file...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommits": "Ulteriori commit per \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommitsProgress": "Caricamento di ulteriori commit per \"${0}\"...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranches": "Ulteriori rami per \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranchesProgress": "Caricamento di ulteriori rami per \"${0}\"...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTags": "Ulteriori tag", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTagsProgress": "Caricamento di ulteriori tag...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashes": "Altri stash", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashesProgress": "Caricamento di altri stash in corso...", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading git log...": "Caricamento log git in corso...", //$NON-NLS-0$  //$NON-NLS-1$
	"local": "locale", //$NON-NLS-0$  //$NON-NLS-1$
	"remote": "remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"View All": "Visualizza tutto", //$NON-NLS-0$  //$NON-NLS-1$
	"Error ${0}: ": "Errore ${0}: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading ": "Caricamento ", //$NON-NLS-0$  //$NON-NLS-1$
	"Message": "Messaggio", //$NON-NLS-0$  //$NON-NLS-1$
	"Author": "Autore", //$NON-NLS-0$  //$NON-NLS-1$
	"Date": "Data", //$NON-NLS-0$  //$NON-NLS-1$
	"fromDate:": "Data di inizio:", //$NON-NLS-0$  //$NON-NLS-1$
	"toDate:": "Data di fine:", //$NON-NLS-0$  //$NON-NLS-1$
	"Actions": "Azioni", //$NON-NLS-0$  //$NON-NLS-1$
	"Branches": "Sezioni", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags": "Tag", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage": "Fase", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged removal": "Rimozione unstaged", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage": "Unstage", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged removal": "Rimozione Staged", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged change": "Modifica unstaged", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged change": "Modifica staged", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged add": "Aggiunta unstaged", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged add": "Aggiunta Staged", //$NON-NLS-0$  //$NON-NLS-1$
	"Addition": "Aggiunta", //$NON-NLS-0$  //$NON-NLS-1$
	"Deletion": "Eliminazione", //$NON-NLS-0$  //$NON-NLS-1$
	"Resolve Conflict": "Risolvi il conflitto", //$NON-NLS-0$  //$NON-NLS-1$
	"Conflicting": "In conflitto", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message": "Messaggio commit", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit": "Commit", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitTooltip": "Eseguire il commit dei file selezionati con il messaggio fornito.", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthMsgLink":"Autenticazione obbligatoria per: ${0}. <a target=\"_blank\" href=\"${1}\">${2}</a> e ritentare la richiesta. </span>", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCommit": "Immetti il messaggio di commit", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCountCommit": "File di commit ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend last commit": "Rettifica ultimo commit", //$NON-NLS-0$  //$NON-NLS-1$
	" Amend": " Rettifica", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress. Choose action:": "Modifica in corso. Seleziona azione:", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgress": "Modifica in corso", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseTip": "Modifica dei commit eliminandoli dal ramo attivo, avviando di nuovo il ramo attivo sulla base dello stato più recente di \"${0}\" e applicando di nuovo ciascun commit al ramo attivo aggiornato.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebasingRepo": "Rimodifica in corso del repository git", //$NON-NLS-0$  //$NON-NLS-1$
	"AddingConfig": "Aggiunta in corso della proprietà di configurazione git: key=${0} value=${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"EditingConfig": "Modifica proprietà di configurazione git: key=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"DeletingConfig": "Eliminazione della proprietà di configurazione git: key=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"AddClone": "Clonazione del repository: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgressDetails": "Modifica del ramo.\n\n\tUtilizzare Continua dopo aver unito i conflitti e selezionato tutti i file;\n\tUtilizzare Ignora per evitare la patch corrente;\n\tUtilizzare Interrompi per terminare le modifiche in qualsiasi momento.", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer name:": "Nome committer:", //$NON-NLS-0$  //$NON-NLS-1$
	"Name:": "Nome:", //$NON-NLS-0$  //$NON-NLS-1$
	"email:": "email:", //$NON-NLS-0$  //$NON-NLS-1$
	"Email:": "Email:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author name: ": "Nome autore: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged": "Unstaged", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged": "In staging", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangedFiles": "File modificati", //$NON-NLS-0$  //$NON-NLS-1$
	"Recent commits on": "Commit recenti su", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status": "Stato Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Status": "Aprire la pagina Stato Git per il repository contenente questo file o cartella.", //$NON-NLS-0$  //$NON-NLS-1$
	"GetGitIncomingMsg": "Ricerca modifiche git in entrata...", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout": "Check-out", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out...": "Check-out in corso...", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage the change": "Stage la modifica", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging...": "Staging...", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutSelectedFiles": "Esegui check-out di tutti i file selezionati ignorando tutte le modifiche", //$NON-NLS-0$  //$NON-NLS-1$
	"AddFilesToGitignore" : "Aggiungere tutti i file selezionati ai file .gitignore", //$NON-NLS-0$  //$NON-NLS-1$
	"Writing .gitignore rules" : "Scrittura di regole .gitignore", //$NON-NLS-0$  //$NON-NLS-1$ 
	"Save Patch": "Salva patch", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage the change": "Unstage la modifica", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaging...": "Unstaging...", //$NON-NLS-0$  //$NON-NLS-1$
	"Undo": "Annulla", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoTooltip": "Ripristinare questo commit, conservando tutti i file modificati e non apportando alcuna modifica alla directory di lavoro.", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoConfirm": "Il contenuto del ramo attivo verrà sostituito con commit \"${0}\". Tutte le modifiche nel commit e nella directory di lavoro verranno conservate. Continuare?", //$NON-NLS-0$  //$NON-NLS-1$
	"Reset": "Reimposta", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetConfirm": "Tutte le modifiche staged e unstaged nella directory di lavoro e l'indice di lavoro andranno persi e non potranno essere recuperati.", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutConfirm" : "Le modifiche apportate ai file selezionati verranno eliminate e non sarà possibile recuperarle.\n\nSi è sicuri di voler continuare?", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetBranchDiscardChanges": "Ripristina il ramo ignorando tutte le modifiche staged e unstaged", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesIndexDiscardedMsg": "Tutte le modifiche staged e unstaged nella directory ed indice di lavoro andranno perse e non potranno essere recuperate.", //$NON-NLS-0$  //$NON-NLS-1$
	"ContinueMsg": "Continuare?", //$NON-NLS-0$  //$NON-NLS-1$
	"KeepWorkDir" : "Conserva la directory di lavoro", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes...": "Ripristino delle modifiche locali...", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue rebase...": "Continua modifica...", //$NON-NLS-0$  //$NON-NLS-1$
	"Skipping patch...": "Ignora patch...", //$NON-NLS-0$  //$NON-NLS-1$
	"Aborting rebase...": "Modifica non riuscita...", //$NON-NLS-0$  //$NON-NLS-1$
	"Complete log": "Log completo", //$NON-NLS-0$  //$NON-NLS-1$
	"local VS index": "Indice VS locale", //$NON-NLS-0$  //$NON-NLS-1$
	"index VS HEAD": "Indice VS HEAD", //$NON-NLS-0$  //$NON-NLS-1$
	"Compare(${0} : ${1})": "Confronta(${0} : ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading status...": "Stato caricamento...", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing...": "Esecuzione del commit in corso...", //$NON-NLS-0$  //$NON-NLS-1$
	"The author name is required.": "Il nome dell'autore è obbligatorio.", //$NON-NLS-0$  //$NON-NLS-1$
	"The author mail is required.": "L'email dell'autore è obbligatoria.", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoConflict": ". Il repository contiene ancora conflitti.", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoUnmergedPathResolveConflict": ". Il repository contiene percorsi non integrati. Risolvi prima i conflitti.", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering ${0}": "Rendering ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Configuration": "Configurazione", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting configuration of": "Richiamo configurazione di ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting git repository details": "Acquisizione dei dettagli del repository git", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting changes": "Acquisizione delle modifiche", //$NON-NLS-0$  //$NON-NLS-1$
	" - Git": " - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories - Git": "Repository - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository": "Repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository Not Found": "Repository non trovato", //$NON-NLS-0$  //$NON-NLS-1$
	"No Repositories": "Nessun repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repository": "Caricamento repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repositories": "Caricamento repository", //$NON-NLS-0$  //$NON-NLS-1$
	"(no remote)": "(non remoto)", //$NON-NLS-0$  //$NON-NLS-1$
	"location: ": "ubicazione: ", //$NON-NLS-0$  //$NON-NLS-1$
	"NumFilesStageAndCommit": "${0} file per lo stage e ${1} file per il commit.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Nothing to commit.": "Nulla su cui eseguire il commit.", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing to push.": "Nulla da eseguire.", //$NON-NLS-0$  //$NON-NLS-1$
	"NCommitsToPush": "${0} commit di cui eseguire l'inoltro.", //$NON-NLS-0$  //$NON-NLS-1$
	"You have no changes to commit.": "Non esiste alcuna modifica per cui eseguire il commit.", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress!": "Modifica in corso!", //$NON-NLS-0$  //$NON-NLS-1$
	"View all local and remote tracking branches": "Visualizza tutti i rami di traccia locali e remoti", //$NON-NLS-0$  //$NON-NLS-1$
	"tracksNoBranch": "non traccia alcun ramo", //$NON-NLS-0$  //$NON-NLS-1$
	"tracks": "traccia ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"last modified ${0} by ${1}": "Ultimo modificato ${0} da ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remote Branches": "Nessun ramo remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering branches": "Rendering rami", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits": "Commit", //$NON-NLS-0$  //$NON-NLS-1$
	"GettingCurrentBranch": "Richiamo ramo corrente per ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Log": "Visualizza log completo", //$NON-NLS-0$  //$NON-NLS-1$
	"See the full log": "Visualizza il log completo", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting commits for \"${0}\" branch": "Richiamo commit per \"${0}\" ramo", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering commits": "Rendering commit", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting outgoing commits": "Richiamo commit in uscita", //$NON-NLS-0$  //$NON-NLS-1$
	"The branch is up to date.": "Il ramo è aggiornato.", //$NON-NLS-0$  //$NON-NLS-1$
	"NoOutgoingIncomingCommits": "Non si hanno commit in entrata o in uscita.", //$NON-NLS-0$  //$NON-NLS-1$
 	") by ": ") da ", //$NON-NLS-0$  //$NON-NLS-1$
	" (SHA ": " (SHA ", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting tags": "Richiamo tag", //$NON-NLS-0$  //$NON-NLS-1$
	"View all tags": "Visualizza tutte i tag", //$NON-NLS-0$  //$NON-NLS-1$
	" on ": " attivo ", //$NON-NLS-0$  //$NON-NLS-1$
	" by ": " per ", //$NON-NLS-0$  //$NON-NLS-1$
	"Remotes": "Remoti", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering remotes": "Rendering remoti", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remotes": "Nessun remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged addition": "Aggiunta unstaged", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged addition": "Aggiunta staged", //$NON-NLS-0$  //$NON-NLS-1$
	" (Rebase in Progress)": " Modifica in corso)", //$NON-NLS-0$  //$NON-NLS-1$
	"Status": "Stato", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0)": "Registro (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0) - 1": "Registro (${0}) - ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Status for ${0} - Git ": "Stato per  ${0} - Git ", //$NON-NLS-0$  //$NON-NLS-1$
	"No Unstaged Changes": "Nessuna modifica unstaged", //$NON-NLS-0$  //$NON-NLS-1$
	"No Staged Changes": "Nessuna modifica staged", //$NON-NLS-0$  //$NON-NLS-1$
	"Changes for \"${0}\" branch": "Modifiche per ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch": "Commit per ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch against": "Commit per ramo \"${0}\" e", //$NON-NLS-0$  //$NON-NLS-1$
	"Add Remote": "Aggiungi remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Name:": "Nome remoto:", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote URI:": "URI remoto:", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply Patch": "Applica patch", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyPatchDialog": "Applica patch", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Repository": "Repository Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the git repository": "Aprire la pagina Repository Git per questo file o cartella.", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Git Repository": "Clona repository Git", //$NON-NLS-0$  //$NON-NLS-1$
	"CloneGitRepositoryDialog": "Clona repository Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository URL:": "URL repository:", //$NON-NLS-0$  //$NON-NLS-1$
	"Existing directory:": "Directory esistente:", //$NON-NLS-0$  //$NON-NLS-1$
	"New folder:": "Nuova cartella:", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseFolderDialog": "Seleziona una cartella", //$NON-NLS-0$  //$NON-NLS-1$
	"Message:": "Messaggio:", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend:": "Rettifica:", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartAmend": "Correggi commit precedente", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangeId:": "ChangeId:", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartChangeId": "Aggiungi messaggio Cambio ID", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Name:": "Nome committer:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Email:": "Email committer:", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorNamePlaceholder": "Immetti nome autore", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorEmailPlaceholder": "Immetti email autore", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterNamePlaceholder": "Immetti nome committer", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterEmailPlaceholder": "Immetti email committer", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Name:": "Nome autore:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Email:": "Email autore:", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit message is required.": "Il messaggio di commit è richiesto.", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Credentials": "Credenziali Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Username:": "Nome utente:", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key:": "Chiave privata:", //$NON-NLS-0$  //$NON-NLS-1$
	"Passphrase (optional):": "Passphrase (facoltativa):", //$NON-NLS-0$  //$NON-NLS-1$
	"commit:": "commit: ", //$NON-NLS-0$  //$NON-NLS-1$
	"parent:": "principale: ", //$NON-NLS-0$  //$NON-NLS-1$
	"branches: ": "rami: ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags: ": "tag: ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags": "tag", //$NON-NLS-0$  //$NON-NLS-1$
	" authored by ${0} {${1}) on ${2}": " creato da ${0} (${1}) il ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"Content": "Contenuto", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to ${0} section": "Andare alla sezione ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Type the commit name (sha1):": "Immetti nome commit (sha1):", //$NON-NLS-0$  //$NON-NLS-1$
	"Search": "Cerca", //$NON-NLS-0$  //$NON-NLS-1$
	"Searching...": "Ricerca in corso...", //$NON-NLS-0$  //$NON-NLS-1$
	"SelectAll": "Seleziona tutto", //$NON-NLS-0$  //$NON-NLS-1$
	"Looking for the commit": "Ricerca commit", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch:": "Nuovo ramo:", //$NON-NLS-0$  //$NON-NLS-1$
	"No remote selected": "Nessuna risorsa remota selezionata", //$NON-NLS-0$  //$NON-NLS-1$
	"Enter a name...": "Immettere un nome...", //$NON-NLS-0$  //$NON-NLS-1$
	"OK": "OK", //$NON-NLS-0$  //$NON-NLS-1$
	"Cancel": "Annulla", //$NON-NLS-0$  //$NON-NLS-1$
	"Clear": "Cancella", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter": "Filtro", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommits": "Filtra commit", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommitsTip": "Attiva/disattiva pannello di filtro commit", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeCmd": "Ingrandisci", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeTip": "Attiva/Disattiva la dimensione massima dell'editor", //$NON-NLS-0$  //$NON-NLS-1$
	" [New branch]": " [Nuovo ramo]", //$NON-NLS-0$  //$NON-NLS-1$
	"AddKeyToHostContinueOp": "Si desidera aggiungere la chiave ${0} per l'host ${1} per continuare l'operazione? L'impronta digitale della chiave è ${2}.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Link Repository": "Link repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Folder name:": "Nome cartella:", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository was linked to ": "Il repository è stato collegato a ", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutCommitTooltip": "Eseguire il check out di questo commit, creando un ramo locale sulla base del suo contenuto.", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutTagTooltip": "Eseguire il check out di questo tag, creando un ramo locale sulla base del suo contenuto.", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out ${0}": "Esecuzione del check out di ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutBranchMsg": "Esegui check out del ramo o del ramo corrispondente locale e rendilo attivo. Se il ramo di traccia remoto non ha un corrispondente ramo locale, verrà prima creato il ramo locale.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Checking out branch...": "Esecuzione check-out ramo in corso...", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding branch ${0}...": "Aggiunta ramo ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing branch ${0}...": "Rimozione ramo ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding remote ${0}...": "Aggiunta ${0} remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote ${0}...": "Rimozione ${0} remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing repository ${0}": "Rimozione repository ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding tag {$0}": "Aggiunta tag {$0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing tag {$0}": "Rimozione tag {$0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Merging ${0}": "Unione in ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	'Unstaging changes' : 'unstage modifiche', //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out branch ${0}...": "Esecuzione check out ramo ${0}...", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch checked out.": "Check out ramo eseguito.", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch": "Nuovo ramo", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new local branch to the repository": "Aggiungi un nuovo ramo locale al repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch name": "Nome ramo", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete": "Elimina", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the local branch from the repository": "Elimina il ramo locale dal repository", //$NON-NLS-0$  //$NON-NLS-1$
	"DelBrConfirm": "Si è sicuri di voler eliminare il ramo ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote tracking branch from the repository": "Elimina il ramo di traccia remoto dal repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure?": "Continuare?", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoveRemoteBranchConfirm": "Si sta per eliminare il ramo remoto \"${0}\" e per inserire la modifica.\n\nSi è sicuri?", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote branch: ": "Rimozione ramo remoto: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete Remote Branch": "Elimina ramo remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"New Remote": "Nuovo remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Remote": "Git remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Remote": "Aprire la pagina Log Git remota per questo file o cartella.", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new remote to the repository": "Aggiungi un nuovo remoto al repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote from the repository": "Elimina il remoto dal repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete remote ${0}?": "Si è sicuri di voler eliminare il remoto ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull": "Esegui pull", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull from the repository": "Estrai dal repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Pulling: ": "Estrazione : ", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull Git Repository": "Estrai dal repository git", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Log": "Log git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Log": "Aprire la pagina Log Git locale per questo file o cartella.", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the branch": "Apri il log per il ramo", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the repository": "Apri il log per il repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the status for the repository": "Apri lo stato per il repository", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditor": "Mostra nell'editor", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditorTooltip": "Mostra la cartella di repository nell'editor", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareEach": "Confronta l'uno con l'altro", //$NON-NLS-0$  //$NON-NLS-1$
 	"Compare With Working Tree": "Confronta con la struttura ad albero di lavoro", //$NON-NLS-0$  //$NON-NLS-1$
	"Open": "Aperto", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenGitCommitTip": "Visualizza la struttura ad albero di questo commit", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitVersion": "Apri commit", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewCommitVersionTip": "Visualizza la versione del file sottoposta a commit", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch": "Recupera", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote": "Richiama dati dal remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Password:": "Password:", //$NON-NLS-0$  //$NON-NLS-1$
	"User Name:": "Nome utente:", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching remote: ": "Richiamo dati remoto: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Fetch": "Forza richiamo dati", //$NON-NLS-0$  //$NON-NLS-1$
	"FetchRemoteBranch": "Richiama dati dal ramo remoto nel ramo di traccia remoto sostituendo il suo contenuto attuale", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentRemoteTrackingBr": "Si sta per sostituire il contenuto del ramo di traccia remoto. Ciò può causare la perdita del commit per il ramo.", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge": "Unisci", //$NON-NLS-0$  //$NON-NLS-1$
	"MergeContentFrmBr": "Unisci il contenuto del ramo al ramo attivo", //$NON-NLS-0$  //$NON-NLS-1$
 	". Go to ${0}.": ". Passa a ${0}.", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status page": "Pagina Stato git", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase": "Modifica", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsMsg": "Modifica i commit eliminandoli dal ramo attivo, avvia il ramo attivo nuovamente sulla base dello stato più recente del ramo selezionato ", //$NON-NLS-0$  //$NON-NLS-1$
 	"Rebase on top of ": "Modifica nella parte superiore ", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseSTOPPED": ". Si sono verificati alcuni conflitti. Risolverli e continuare, ignorare le patch o interrompere le modifiche", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_WRONG_REPOSITORY_STATE": ". Lo stato del repository non è valido (ad esempio già durante la modifica).", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_UNMERGED_PATHS": ". Il repository contiene percorsi non integrati.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_PENDING_CHANGES": ". Il repository contiene modifiche in sospeso Eseguire il commit o ignorarli (mediante stash).", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseUNCOMMITTED_CHANGES": ". Sono presenti modifiche senza commit.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsByRmvingThem": "Modifica i commit eliminandoli dal ramo attivo ", //$NON-NLS-0$  //$NON-NLS-1$
	"StartActiveBranch": "avvia nuovamente il ramo attivo in base all'ultimo stato", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyEachCommitAgain": "e esegui nuovamente tutti i commit al ramo attivo aggiornato.", //$NON-NLS-0$  //$NON-NLS-1$
	"Push All": "Inoltra tutti", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocal": "Inoltra i commit e i tag dal ramo locale al ramo remoto", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push Branch": "Inoltra ramo", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushResult": "Inoltra risultato:", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushCommitsWithoutTags": "Inoltra i commit senza tag dal proprio ramo locale al ramo remoto", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push for Review": "Inoltra per revisione", //$NON-NLS-0$  //$NON-NLS-1$
	"Push commits to Gerrit Code Review": "Inoltra commit per revisione codice Gerrit", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push Branch": "Forza inoltra ramo", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsWithoutTagsOverridingCurrentContent": "Inoltra i commit senza tag dal proprio ramo locale al ramo remoto sostituendone il contenuto corrente", //$NON-NLS-0$  //$NON-NLS-1$
 	"Pushing remote: ": "Inoltro remoto: ", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseBranchDialog": "Seleziona ramo", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose the remote branch.": "Scegli il ramo remoto.", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push All": "Forza Inoltra tutti", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocalBr": "Inoltra i commit e i tag dal ramo locale al ramo remoto sostituendo il contenuto attuale", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentOfRemoteBr": "Si sta per sostituire il contenuto del ramo remoto. Ciò può causare la perdita di commit per il repository.", //$NON-NLS-0$  //$NON-NLS-1$
	"< Previous Page": "<Pagina precedente", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git log": "Mostra pagina precedente del log git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git tags" : "Mostra pagina precedente dei tag git", //$NON-NLS-0$  //$NON-NLS-1$
	"Next Page >": "Pagina successiva >", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git log": "Mostra pagina successiva del log git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git tags" : "Mostra pagina successiva dei tag git", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the selected remote branch": "Inoltra dal ramo locale al ramo remoto selezionato", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetActiveBr": "Reimposta il ramo attivo allo stato di questo riferimento. Annulla tutte le modifiche staged e unstaged.", //$NON-NLS-0$  //$NON-NLS-1$
 	"GitResetIndexConfirm": "Il contenuto del ramo attivo verrà sostituito con commit \"${0}\". Tutte le modifiche staged e unstaged verranno annullate e non potranno essere ripristinate se \"${1}\" non è selezionato. Continuare?", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting index...": "Reimpostazione indice...", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting git index for ${0}" : "Reimposta indice git per ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag": "Tag", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a tag for the commit": "Crea un tag per il commit", //$NON-NLS-0$  //$NON-NLS-1$
	"ProjectSetup": "È in corso la configurazione del progetto. Potrebbe essere necessario un minuto...", //$NON-NLS-0$  //$NON-NLS-1$
	"LookingForProject": "Ricerca del progetto: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag name": "Nome tag", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the tag from the repository": "Elimina i tag dal repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete tag ${0}?": "Si è sicuri di voler eliminare il tag  ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Cherry-Pick": "Selezione personale", //$NON-NLS-0$  //$NON-NLS-1$
	"CherryPicking": "Commit Selezione personale: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RevertingCommit": "Ritorno al commit: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the change introduced by the commit to your active branch": "Esegui la modifica introdotta dal commit al ramo attivo", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing changed.": "Nessuna modifica", //$NON-NLS-0$  //$NON-NLS-1$
	". Some conflicts occurred": ". Si sono verificati alcuni conflitti.", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote branch into your remote tracking branch": "Richiama dati dal ramo remoto al ramo di traccia remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch Git Repository": "Richiamo dati repository git", //$NON-NLS-0$  //$NON-NLS-1$
	"Push": "Inoltra", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the remote branch": "Inoltra dal ramo locale al ramo remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Push Git Repository": "Inoltra repository git", //$NON-NLS-0$  //$NON-NLS-1$
	"Key:": "Chiave:", //$NON-NLS-0$  //$NON-NLS-1$
	"Value:": "Valore:", //$NON-NLS-0$  //$NON-NLS-1$
	"New Configuration Entry": "Nuova voce di configurazione", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit": "Modifica", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit the configuration entry": "Modifica voce di configurazione", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the configuration entry": "Elimina voce di configurazione", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete ${0}?": "Eliminare ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Repository": "Clona repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone an existing Git repository to a folder": "Clona un repository git esistente in una cartella", //$NON-NLS-0$  //$NON-NLS-1$
	"Cloning repository: ": "Clonazione repository: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Repository": "Inizializza repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a new Git repository in a new folder": "Crea un nuovo repository Git in una nuova cartella", //$NON-NLS-0$  //$NON-NLS-1$
	"Initializing repository: ": "Inizializzazione repository ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Git Repository": "Inizializza repository git", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the repository": "Elimina il repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want do delete ${0} repositories?": "Si è sicuri di voler eliminare i repository ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply a patch on the selected repository": "Applica una patch al repository selezionato", //$NON-NLS-0$  //$NON-NLS-1$
	"Show content": "Mostra contenuto", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit name:": "Nome commit:", //$NON-NLS-0$  //$NON-NLS-1$
	"Open Commit": "Apri commit", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitDialog": "Apri commit", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the commit with the given name": "Apri commit con il nome dato", //$NON-NLS-0$  //$NON-NLS-1$
	"No commits found": "Nessun commit trovato", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging changes": "Sospendi modifiche", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message:": "Messaggio commit:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing changes": "Commit delle modifiche", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching previous commit message": "Recupero del messaggio di commit precedente", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes": "Ripristina modifiche locali", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout files, discarding all changes": "Esegui check out dei file ignorando tutte le modifiche", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Patch": "Mostra patch", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading default workspace": "Caricamento dello spazio di lavoro predefinito", //$NON-NLS-0$  //$NON-NLS-1$
	"Show workspace changes as a patch": "Mostra modifiche dello spazio dei nomi come patch", //$NON-NLS-0$  //$NON-NLS-1$
	"Show checked changes as a patch": "Mostra modifiche controllate come patch", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowCommitPatchTip": "Mostra la patch per le modifiche in questo commit", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue": "Continua", //$NON-NLS-0$  //$NON-NLS-1$
	"Contibue Rebase": "Continua modifica", //$NON-NLS-0$  //$NON-NLS-1$
	"Skip Patch": "Ignora patch", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort": "Interrompi", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort Rebase": "Annulla modifica", //$NON-NLS-0$  //$NON-NLS-1$
	"Discard": "Elimina", //$NON-NLS-0$  //$NON-NLS-1$
	"Ignore": "Ignora", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesSelectedFilesDiscard": "Le modifiche ai file selezionati verranno ignorate e non sarà possibile recuperarle", //$NON-NLS-0$  //$NON-NLS-1$
 	"Getting git log": "Richiamo del log git", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting stashed changes...": "Richiamo delle modifiche nascoste...", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch (${0})": "Ramo attivo (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch (${0})": "Ramo (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag (${0})": "Tag (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit (${0})": "Commit (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommit (${0})": "Stash (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"WIPStash": "WIP su ${0}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"IndexStash": "indice su ${0}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranch (${0})": "Ramo remoto (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch Log": "Git Log (Ramo attivo)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the active local branch": "Mostra il log per il ramo locale attivo", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Branch Log": "Git Log (Ramo remoto)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the corresponding remote tracking branch": "Mostra il log per il corrispondente ramo di traccia remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Status" : "Visualizza stato completo", //$NON-NLS-0$  //$NON-NLS-1$
	"See the status" : "Visualizza lo stato", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose target location" : "Scegli ubicazione di destinazione", //$NON-NLS-0$  //$NON-NLS-1$
	"Default target location" : "Ubicazione di destinazione predefinita", //$NON-NLS-0$  //$NON-NLS-1$
	"Change..." : "Cambia...", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge Squash": "Merge Squash", //$NON-NLS-0$  //$NON-NLS-1$
	"Squash the content of the branch to the index" : "Integrare il contenuto del ramo nell'indice", //$NON-NLS-0$  //$NON-NLS-1$
	"Local Branch Name:" : "Nome ramo locale:", //$NON-NLS-0$  //$NON-NLS-1$
	"Local": "locale", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter items" : "Filtra elementi", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter filter" : "Filtra messaggi", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter author" : "Filtra autore", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter committer" : "Filtra esecutore del commit", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter sha1" : "Filtra sha1", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter fromDate" : "Filtra da data YYYY-MM-DD o 1(h d w m y)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter toDate" : "Filtra a data YYYY-MM-DD o 1(h d w m y)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter path" : "Filtra percorso", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter remote branches" : "Filtra rami remoti", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote branches" : "Richiamo rami remoti ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote details": "Richiamo dettagli remoti: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchApplied": "Patch applicata correttamente", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchFailed": "Applicazione patch non riuscita. ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting branches" : "Richiamo rami ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Paste link in email or IM" : "Incolla il collegamento nell'email o nell'IM", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in GitHub" : "Mostra commit in GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in GitHub" : "Mostra repository in GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in GitHub": "Mostra il commit in GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in eclipse.org": "Mostra commit in eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in eclipse.org" : "Mostra il commit in eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in eclipse.org":"Mostra repository in eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in eclipse.org":"Mostra il repository in eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review" : "Chiedi una revisione", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review tooltip" : "Invia l'email con la richiesta di revisione del commit", //$NON-NLS-0$  //$NON-NLS-1$
	"Reviewer name" : "Nome revisore", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request" : "Richiesta revisione contributo", //$NON-NLS-0$  //$NON-NLS-1$
	"Send the link to the reviewer" : "Invia il collegamento al revisore", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key file (optional):" : "File chiave privata (facoltativo):", //$NON-NLS-0$  //$NON-NLS-1$
	"Don't prompt me again:" : "Non chiedere nuovamente:", //$NON-NLS-0$  //$NON-NLS-1$
	"Your private key will be saved in the browser for further use" : "La chiave privata verrà salvata nel browser per ulteriori utilizzi", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading Contribution Review Request..." : "Caricamento richiesta revisione contributo...", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit can be found in the following repositories" : "Impossibile trovare il commit nei seguenti repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Try to update your repositories" : "Provare ad aggiornare i propri repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Create new repository" : "Crea nuovo repository", //$NON-NLS-0$  //$NON-NLS-1$
	"Attach the remote to one of your existing repositories" : "Collegare l'elemento remoto a uno dei propri repository esistenti", //$NON-NLS-0$  //$NON-NLS-1$
	"You are reviewing contribution ${0} from ${1}" : "Si sta eseguendo la revisione del contributo ${0} da ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitNotFoundInWorkspace" : "Non è possibile trovare il commit nel proprio spazio di lavoro. Per visualizzarlo effettuare una delle seguenti operazioni: ", //$NON-NLS-0$  //$NON-NLS-1$
 	"To review the commit you can also:" : "Per revisionare il commit è possibile anche:", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request for ${0} on ${1}" : "Richiesta di revisione contributo per ${0} su ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Failing paths: ${0}": "Percorsi non funzionanti: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Problem while performing the action": "Problema durante l'esecuzione dell'azione", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the Orion repositories page to provide a git repository URL. Once the repository is created, it will appear in the Navigator.": "Vai alla pagina di repository Orion per fornire un URL del repository git. Una volta creato il repository, verrà visualizzato nel navigator.", //$NON-NLS-0$  //$NON-NLS-1$
	"URL:": "URL:", //$NON-NLS-0$  //$NON-NLS-1$
	"File:": "File:", //$NON-NLS-0$  //$NON-NLS-1$
	"Submit": "Inoltra", //$NON-NLS-0$  //$NON-NLS-1$
	"git url:": "url git: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert": "Ripristina", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert changes introduced by the commit into your active branch": "Ripristina la modifica introdotta dal commit al ramo attivo", //$NON-NLS-0$  //$NON-NLS-1$
	". Could not revert into active branch": ". Impossibile ripristinare nel ramo attivo.", //$NON-NLS-0$  //$NON-NLS-1$
	"Login": "Accesso", //$NON-NLS-0$  //$NON-NLS-1$
	"Authentication required for: ${0}. ${1} and re-try the request.": "Autenticazione obbligatoria per: ${0}. ${1} e ritentare la richiesta.", //$NON-NLS-0$  //$NON-NLS-1$
	"Save":"Salva", //$NON-NLS-0$  //$NON-NLS-1$
	"Remember my committer name and email:":"Ricorda il mio nome ed email committer:", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully edited ${0} to have value ${1}":"${0} modificato correttamente per ottenere il valore ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully added ${0} with value ${1}":"${0} aggiunto correttamente con valore ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Signed-off-by: ":"Sign-off eseguito da: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Change-Id: ":"Change-Id: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Push_REJECTED_NONFASTFORWARD":"L'operazione di inoltro (push) è di tipo non-fastforward ed è stata rifiutata. Utilizzare l'operazione di richiamo (recupero) per visualizzare i nuovi commit che devono essere integrati.", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit and Push" : "Esegui commit e inoltra", //$NON-NLS-0$  //$NON-NLS-1$
	"Sync" : "Sincronizza", //$NON-NLS-0$  //$NON-NLS-1$
	"SyncTooltip" : "Eseguire il richiamo dal ramo remoto. Modificare i commit eliminandoli dal ramo locale, avviare il ramo locale nuovamente sulla base dello stato più recente del ramo remoto e applicare ciascun commit al ramo locale aggiornato. Inoltrare i commit ed i tag dal ramo locale al ramo remoto.", //$NON-NLS-0$  //$NON-NLS-1$
	"NoCommits" : "Nessuna modifica", //$NON-NLS-0$  //$NON-NLS-1$
	"NoContent" : "Nessun contenuto", //$NON-NLS-0$  //$NON-NLS-1$
	"Incoming" : "In entrata", //$NON-NLS-0$  //$NON-NLS-1$
	"Outgoing" : "In uscita", //$NON-NLS-0$  //$NON-NLS-1$
	"IncomingWithCount" : "In entrata (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"OutgoingWithCount" : "In uscita (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Synchronized" : "Cronologia", //$NON-NLS-0$  //$NON-NLS-1$
	"Uncommited" : "Commit non eseguito", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository:" : "Repository:", //$NON-NLS-0$  //$NON-NLS-1$
	"Reference:" : "Riferimento:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author:" : "Autore:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer:" : "Esecutore del commit", //$NON-NLS-0$  //$NON-NLS-1$
	"SHA1:" : "SHA1:", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchCmd" : "Mostra ramo attivo", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceCmd": "Mostra riferimento", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceTip": "Visualizza la cronologia di ${1} \"${2}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchTip": "Visualizza la cronologia di \"${0}\" relativa a ${1} \"${2}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitType": "commit", //$NON-NLS-0$  //$NON-NLS-1$
	"BranchType": "ramo", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranchType": "ramo remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"TagType": "tag", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommitType": "stash", //$NON-NLS-0$  //$NON-NLS-1$
	"Path:" : "Percorso:", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChanges" : "Modifiche alla directory di lavoro", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChangesDetails" : "Dettagli della directory di lavoro", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareChanges" : "Confronta (${0} => ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"NoBranch" : "Nessun ramo", //$NON-NLS-0$  //$NON-NLS-1$
	"NoActiveBranch" : "Nessun ramo attivo", //$NON-NLS-0$  //$NON-NLS-1$
	"NoRef" : "Nessun riferimento selezionato", //$NON-NLS-0$  //$NON-NLS-1$
	"None": "Nessuna", //$NON-NLS-0$  //$NON-NLS-1$
	"FileSelected": "${0} file selezionato", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesSelected": "${0} file selezionati", //$NON-NLS-0$  //$NON-NLS-1$
	"FileChanged": "${0} file modificato", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChanged": "${0} file modificati", //$NON-NLS-0$  //$NON-NLS-1$
	"file": "file", //$NON-NLS-0$  //$NON-NLS-1$
	"files": "file", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitConfirm": "Non vi sono file selezionati. Continuare?", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitWarning": "Il commit è vuoto", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChangedVsReadyToCommit": "modificato ${0} ${1}. pronto per essere sottoposto a commit ${2} ${3}.", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitPush": "Esegui commit e inoltra", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits and pushes files to the default remote": "Esegue il commit ed inoltra i file al ramo remoto predefinito", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash" : "Stash", //$NON-NLS-0$  //$NON-NLS-1$
	"stashIndex" : "stash@{${0}}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash all current changes away" : "Ignora tutte le modifiche correnti", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop" : "Trascina", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop the commit from the stash list" : "Rilascia il commit dall'elenco di stash", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply" : "Applica", //$NON-NLS-0$  //$NON-NLS-1$
	"Pop Stash" : "Stash a comparsa", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the most recently stashed change to your active branch and drop it from the stashes" : "Applica la modifica nascosta più recente al ramo attivo e rilascia dagli stash", //$NON-NLS-0$  //$NON-NLS-1$
	"stashes" : "stash", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyName': "Repository Git", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyTooltip': "Associa un repository git a questo progetto.",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectName': "Repository Git",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectTooltip': "Crea un progetto da un repository git.",  //$NON-NLS-0$  //$NON-NLS-1$
	'fetchGroup': 'Recupera',  //$NON-NLS-0$  //$NON-NLS-1$
	'pushGroup' : 'Inoltra',  //$NON-NLS-0$  //$NON-NLS-1$
	'Url:' : 'Url:', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Private Key:' : 'Chiave privata ssh:', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Passphrase:' : 'Passphrase Ssh:', //$NON-NLS-0$  //$NON-NLS-1$
	'confirmUnsavedChanges': 'Esistono modifiche non salvate. Salvarle?' //$NON-NLS-1$ //$NON-NLS-0$
});

