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
	"Compare": "Comparer", //$NON-NLS-0$  //$NON-NLS-1$
	"View the side-by-side compare": "Afficher la comparaison côte à côte", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirVer": "Ouvrir le répertoire de travail", //$NON-NLS-0$  //$NON-NLS-1$
	"Working Directory": "Répertoire de travail", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewWorkingDirVer": "Afficher la version du répertoire de travail du fichier", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading...": "Chargement...", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories": "Tous les référentiels Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repo": "Référentiels", //$NON-NLS-0$  //$NON-NLS-1$
	"0 on 1 - Git": "${0} de ${1} - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Git": "Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in eclipse.org": "Afficher dans eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in GitHub": "Afficher dans GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in GitHub": "Afficher ce référentiel dans GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit Details": "Détails de la validation", //$NON-NLS-0$  //$NON-NLS-1$
	"No Commits": "Pas de validation", //$NON-NLS-0$  //$NON-NLS-1$
	"commit: 0": "validation : ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"parent: 0": "parent : ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"authored by 0 (1) on 2": "créé par ${0} <${1}> le ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"committed by 0 (1)": "validé par ${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"committedby": "validé par ", //$NON-NLS-0$  //$NON-NLS-1$
	"authoredby": "créé par ", //$NON-NLS-0$  //$NON-NLS-1$
	"on": " le ", //$NON-NLS-0$  //$NON-NLS-1$
	"nameEmail": "${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags:": "Etiquettes :", //$NON-NLS-0$  //$NON-NLS-1$
	"No Tags": "Aucune étiquette", //$NON-NLS-0$  //$NON-NLS-1$
	"Diffs": "Modifications", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirChanges": "Modifications du répertoire de travail", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChanges": "Valider les changements", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChangesDialog": "Valider les changements", //$NON-NLS-0$  //$NON-NLS-1$
	"more": "plus ...", //$NON-NLS-0$  //$NON-NLS-1$
	"less": "moins ...", //$NON-NLS-0$  //$NON-NLS-1$
	"More": "Plus", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFiles" : "Fichiers supplémentaires", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFilesProgress": "Chargement de fichiers supplémentaires...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommits": "Validations supplémentaires pour \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommitsProgress": "Chargement de validations supplémentaires pour \"${0}\"...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranches": "Branches supplémentaires pour \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranchesProgress": "Chargement de branches supplémentaires pour \"${0}\"...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTags": "Etiquettes supplémentaires", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTagsProgress": "Chargement d'étiquettes supplémentaires...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashes": "Stocks supplémentaires", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashesProgress": "Chargement de stocks supplémentaires...", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading git log...": "Chargement du journal Git en cours...", //$NON-NLS-0$  //$NON-NLS-1$
	"local": "local", //$NON-NLS-0$  //$NON-NLS-1$
	"remote": "distant", //$NON-NLS-0$  //$NON-NLS-1$
	"View All": "Afficher tout", //$NON-NLS-0$  //$NON-NLS-1$
	"Error ${0}: ": "Erreur ${0}: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading ": "Chargement ", //$NON-NLS-0$  //$NON-NLS-1$
	"Message": "Message", //$NON-NLS-0$  //$NON-NLS-1$
	"Author": "Auteur", //$NON-NLS-0$  //$NON-NLS-1$
	"Date": "Date", //$NON-NLS-0$  //$NON-NLS-1$
	"fromDate:": "Date de début :", //$NON-NLS-0$  //$NON-NLS-1$
	"toDate:": "Date de fin :", //$NON-NLS-0$  //$NON-NLS-1$
	"Actions": "Actions", //$NON-NLS-0$  //$NON-NLS-1$
	"Branches": "Branches", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags": "Etiquettes", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage": "Ajouter du contenu à l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged removal": "Suppression avec retrait du contenu de l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage": "Retirer le contenu de l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged removal": "Suppression avec ajout de contenu à l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged change": "Contenu retiré de l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged change": "Contenu ajouté à l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged add": "Ajout avec retrait de contenu de l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged add": "Ajout avec ajout de contenu à l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Addition": "Ajout", //$NON-NLS-0$  //$NON-NLS-1$
	"Deletion": "Suppression", //$NON-NLS-0$  //$NON-NLS-1$
	"Resolve Conflict": "Résoudre le conflit", //$NON-NLS-0$  //$NON-NLS-1$
	"Conflicting": "En conflit", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message": "Valider le message", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit": "Valider", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitTooltip": "Valider les fichiers sélectionnés avec le message indiqué.", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthMsgLink":"Authentification requise pour : ${0}. <a target=\"_blank\" href=\"${1}\">${2}</a> et relancez la demande. </span>", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCommit": "Entrez le message de validation", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCountCommit": "Valider ${0} fichier(s)", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend last commit": "Modifier la dernière validation", //$NON-NLS-0$  //$NON-NLS-1$
	" Amend": " Modifier", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress. Choose action:": "Resynchronisation en cours. Choisissez une action :", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgress": "Resynchronisation en cours", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseTip": "Resynchronisez vos validations en les retirant de la branche active, en redémarrant la branche active en fonction de l'état le plus récent de \"${0}\" et en appliquant chaque validation à nouveau à la branche active mise à jour.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebasingRepo": "Resynchronisation du référentiel Git", //$NON-NLS-0$  //$NON-NLS-1$
	"AddingConfig": "Ajout de la propriété de configuration Git suivante : clé=${0} valeur=${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"EditingConfig": "Edition de la propriété de configuration Git suivante : clé=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"DeletingConfig": "Suppression de la propriété de configuration Git suivante : clé=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"AddClone": "Clonage du référentiel : ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgressDetails": "Branche de resynchronisation.\n\n\tUtilisez Continuer après avoir fusionné les conflits et sélectionné tous les fichiers ;\n\tIgnorer pour ignorer le correctif en cours ;\n\tAnnuler pour terminer la resynchronisation à tout moment.", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer name:": "Nom du valideur :", //$NON-NLS-0$  //$NON-NLS-1$
	"Name:": "Nom :", //$NON-NLS-0$  //$NON-NLS-1$
	"email:": "Courrier électronique :", //$NON-NLS-0$  //$NON-NLS-1$
	"Email:": "Adresse électronique :", //$NON-NLS-0$  //$NON-NLS-1$
	"Author name: ": "Nom de l'auteur : ", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged": "Avec retrait du contenu de l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged": "Avec ajout de contenu à l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangedFiles": "Fichiers modifiés", //$NON-NLS-0$  //$NON-NLS-1$
	"Recent commits on": "Validations récentes sur", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status": "Statut de Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Status": "Ouvrez la page Statut de Git pour le référentiel contenant ce fichier ou ce dossier.", //$NON-NLS-0$  //$NON-NLS-1$
	"GetGitIncomingMsg": "Obtention des changements entrants Git...", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout": "Réservation", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out...": "Réservation en cours...", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage the change": "Ajouter le contenu du changement à l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging...": "Ajout de contenu à l'index en cours...", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutSelectedFiles": "Réserver tous les fichiers sélectionnés en annulant tous les changements", //$NON-NLS-0$  //$NON-NLS-1$
	"AddFilesToGitignore" : "Ajoutez tous les fichiers sélectionné au(x) fichier(s) .gitignore", //$NON-NLS-0$  //$NON-NLS-1$
	"Writing .gitignore rules" : "Ecriture des règles du fichier .gitignore", //$NON-NLS-0$  //$NON-NLS-1$ 
	"Save Patch": "Enregistrer le correctif", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage the change": "Retirer le contenu du changement de l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaging...": "Retrait du contenu de l'index...", //$NON-NLS-0$  //$NON-NLS-1$
	"Undo": "Annuler", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoTooltip": "Annuler cette validation, en conservant tous les fichiers modifiés et sans apporter de modification dans le répertoire de travail.", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoConfirm": "Le contenu de votre branche active sera remplacé par la validation \"${0}\". Toutes les modifications dans les répertoires de validation et de travail seront conservées. Voulez-vous vraiment effectuer cette opération ?", //$NON-NLS-0$  //$NON-NLS-1$
	"Reset": "Réinitialiser", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetConfirm": "Tous les changements avec ajout ou retrait de contenu dans le répertoire de travail et dans l'index seront annulés et ne pourront pas être restaurés.\n\nVoulez-vous vraiment continuer ?", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutConfirm" : "Les changements apportés aux fichiers sélectionnés seront annulés et ne pourront pas être restaurés.\n\nVoulez-vous vraiment continuer ?", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetBranchDiscardChanges": "Réinitialiser la branche en annulant tous les changements avec ajout ou retrait du contenu de l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesIndexDiscardedMsg": "Tous les changements avec ajout ou retrait de contenu dans le répertoire de travail et dans l'index seront annulés et ne pourront pas être restaurés.", //$NON-NLS-0$  //$NON-NLS-1$
	"ContinueMsg": "Voulez-vous vraiment continuer ?", //$NON-NLS-0$  //$NON-NLS-1$
	"KeepWorkDir" : "Conserver le répertoire de travail", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes...": "Réinitialisation des changements locaux en cours...", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue rebase...": "Continuer la resynchronisation...", //$NON-NLS-0$  //$NON-NLS-1$
	"Skipping patch...": "Ignorer le correctif...", //$NON-NLS-0$  //$NON-NLS-1$
	"Aborting rebase...": "Abandon de la resynchronisation...", //$NON-NLS-0$  //$NON-NLS-1$
	"Complete log": "Journal complet", //$NON-NLS-0$  //$NON-NLS-1$
	"local VS index": "index VS local", //$NON-NLS-0$  //$NON-NLS-1$
	"index VS HEAD": "EN-TETE VS d'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Compare(${0} : ${1})": "Comparer (${0} : ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading status...": "Chargement du statut en cours...", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing...": "Validation...", //$NON-NLS-0$  //$NON-NLS-1$
	"The author name is required.": "Le nom de l'auteur est obligatoire.", //$NON-NLS-0$  //$NON-NLS-1$
	"The author mail is required.": "Le mail de l'auteur est obligatoire.", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoConflict": ". Le référentiel contient toujours des conflits.", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoUnmergedPathResolveConflict": ". Le référentiel contient des chemins non fusionnés. Traitez d'abord les conflits.", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering ${0}": "Affichage de ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Configuration": "Configuration", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting configuration of": "Obtention de la configuration de ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting git repository details": "Obtention des informations du référentiel Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting changes": "Obtention des modifications", //$NON-NLS-0$  //$NON-NLS-1$
	" - Git": " - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories - Git": "Référentiels - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository": "Référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository Not Found": "Référentiel introuvable", //$NON-NLS-0$  //$NON-NLS-1$
	"No Repositories": "Aucun référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repository": "Chargement du référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repositories": "Chargement des référentiels", //$NON-NLS-0$  //$NON-NLS-1$
	"(no remote)": "(aucun contenu distant)", //$NON-NLS-0$  //$NON-NLS-1$
	"location: ": "emplacement : ", //$NON-NLS-0$  //$NON-NLS-1$
	"NumFilesStageAndCommit": "${0} fichier(s) dont le contenu doit être ajouté à l'index et ${1} fichier(s) à valider.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Nothing to commit.": "Rien à valider.", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing to push.": "Rien à envoyer.", //$NON-NLS-0$  //$NON-NLS-1$
	"NCommitsToPush": "${0} validation(s) à envoyer.", //$NON-NLS-0$  //$NON-NLS-1$
	"You have no changes to commit.": "Vous n'avez pas de changements à valider.", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress!": "Resynchronisation en cours.", //$NON-NLS-0$  //$NON-NLS-1$
	"View all local and remote tracking branches": "Afficher toutes les branches de suivi locales et distantes", //$NON-NLS-0$  //$NON-NLS-1$
	"tracksNoBranch": "n'effectue le suivi d'aucune branche", //$NON-NLS-0$  //$NON-NLS-1$
	"tracks": "effectue le suivi de ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"last modified ${0} by ${1}": "dernière modification ${0} par ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remote Branches": "Aucune branche distante", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering branches": "Affichage des branches", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits": "Validations", //$NON-NLS-0$  //$NON-NLS-1$
	"GettingCurrentBranch": "Obtention de la branche en cours pour ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Log": "Consultez le journal complet.", //$NON-NLS-0$  //$NON-NLS-1$
	"See the full log": "Consultez le journal complet", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting commits for \"${0}\" branch": "Obtention de validations pour la branche \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering commits": "Affichage des validations", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting outgoing commits": "Obtention des validations sortantes", //$NON-NLS-0$  //$NON-NLS-1$
	"The branch is up to date.": "La branche est à jour.", //$NON-NLS-0$  //$NON-NLS-1$
	"NoOutgoingIncomingCommits": "Vous n'avez pas de validations sortantes ou entrantes.", //$NON-NLS-0$  //$NON-NLS-1$
 	") by ": ") par ", //$NON-NLS-0$  //$NON-NLS-1$
	" (SHA ": " (SHA ", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting tags": "Obtention des étiquettes", //$NON-NLS-0$  //$NON-NLS-1$
	"View all tags": "Afficher toutes les étiquettes", //$NON-NLS-0$  //$NON-NLS-1$
	" on ": " le ", //$NON-NLS-0$  //$NON-NLS-1$
	" by ": " par ", //$NON-NLS-0$  //$NON-NLS-1$
	"Remotes": "Contenu distant", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering remotes": "Affichage du contenu distant", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remotes": "Aucun contenu distant", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged addition": "Ajout contenu retiré de l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged addition": "Ajout avec contenu ajouté à l'index", //$NON-NLS-0$  //$NON-NLS-1$
	" (Rebase in Progress)": " (Resynchronisation en cours)", //$NON-NLS-0$  //$NON-NLS-1$
	"Status": "Etat", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0)": "Journal (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0) - 1": "Journal (${0}) - ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Status for ${0} - Git ": "Statut de ${0} - Git ", //$NON-NLS-0$  //$NON-NLS-1$
	"No Unstaged Changes": "Aucun contenu retiré de l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"No Staged Changes": "Aucun contenu ajouté à l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Changes for \"${0}\" branch": "Modifications pour ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch": "Validations pour ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch against": "Validations pour la branche \"${0}\" par rapport à", //$NON-NLS-0$  //$NON-NLS-1$
	"Add Remote": "Ajouter du contenu distant", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Name:": "Nom du contenu distant :", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote URI:": "URI distant :", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply Patch": "Appliquer un correctif", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyPatchDialog": "Appliquer un correctif", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Repository": "Référentiel Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the git repository": "Ouvrir la page Référentiel Git pour ce fichier ou ce dossier.", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Git Repository": "Cloner un référentiel Git", //$NON-NLS-0$  //$NON-NLS-1$
	"CloneGitRepositoryDialog": "Cloner un référentiel Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository URL:": "URL de référentiel :", //$NON-NLS-0$  //$NON-NLS-1$
	"Existing directory:": "Répertoire existant :", //$NON-NLS-0$  //$NON-NLS-1$
	"New folder:": "Nouveau dossier :", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseFolderDialog": "Sélectionnez un dossier", //$NON-NLS-0$  //$NON-NLS-1$
	"Message:": "Message :", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend:": "Modifier :", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartAmend": "Modifier la validation précédente", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangeId:": "ID de modification :", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartChangeId": "Ajouter l'ID de la modification au message", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Name:": "Nom du valideur :", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Email:": "Adresse électronique du valideur :", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorNamePlaceholder": "Entrez le nom de l'auteur", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorEmailPlaceholder": "Entrez l'adresse électronique de l'auteur", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterNamePlaceholder": "Entrez le nom du valideur", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterEmailPlaceholder": "Entrez l'adresse électronique du valideur", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Name:": "Nom de l'auteur :", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Email:": "E-mail de l'auteur :", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit message is required.": "Le message de validation est obligatoire.", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Credentials": "Données d'identification Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Username:": "Nom d'utilisateur :", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key:": "Clé privée :", //$NON-NLS-0$  //$NON-NLS-1$
	"Passphrase (optional):": "Phrase passe (facultative) :", //$NON-NLS-0$  //$NON-NLS-1$
	"commit:": "validation : ", //$NON-NLS-0$  //$NON-NLS-1$
	"parent:": "Parent : ", //$NON-NLS-0$  //$NON-NLS-1$
	"branches: ": "branches : ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags: ": "étiquettes : ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags": "étiquettes", //$NON-NLS-0$  //$NON-NLS-1$
	" authored by ${0} {${1}) on ${2}": " créé par ${0} (${1}) le ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"Content": "Contenu", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to ${0} section": "Passer à la section ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Type the commit name (sha1):": "Entrez le nom de la validation (sha1) :", //$NON-NLS-0$  //$NON-NLS-1$
	"Search": "Rechercher", //$NON-NLS-0$  //$NON-NLS-1$
	"Searching...": "Recherche en cours...", //$NON-NLS-0$  //$NON-NLS-1$
	"SelectAll": "Sélectionner tout", //$NON-NLS-0$  //$NON-NLS-1$
	"Looking for the commit": "Recherche de la validation", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch:": "Nouvelle branche :", //$NON-NLS-0$  //$NON-NLS-1$
	"No remote selected": "Aucun contenu distant sélectionné", //$NON-NLS-0$  //$NON-NLS-1$
	"Enter a name...": "Entrer un nom...", //$NON-NLS-0$  //$NON-NLS-1$
	"OK": "OK", //$NON-NLS-0$  //$NON-NLS-1$
	"Cancel": "Annuler", //$NON-NLS-0$  //$NON-NLS-1$
	"Clear": "Effacer", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter": "Filtrer", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommits": "Filtrer les validations", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommitsTip": "Affiche/masque le panneau de filtrage des validations", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeCmd": "Agrandir", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeTip": "Affiche la taille maximale de l'éditeur", //$NON-NLS-0$  //$NON-NLS-1$
	" [New branch]": " [Nouvelle branche]", //$NON-NLS-0$  //$NON-NLS-1$
	"AddKeyToHostContinueOp": "Voulez-vous ajouter la clé ${0} pour que l'hôte ${1} continue à fonctionner ? L'empreinte digitale de la clé est ${2}.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Link Repository": "Lier le référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Folder name:": "Nom du dossier :", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository was linked to ": "Le référentiel a été lié à ", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutCommitTooltip": "Réservez cette validation pour créer une branche locale basée sur son contenu.", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutTagTooltip": "Réservez cette étiquette pour créer une branche locale basée sur son contenu.", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out ${0}": "Réservation de ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutBranchMsg": "Réservez et activez la branche ou la branche locale correspondante. Si la branche de suivi à distance n'est pas associée à une branche locale, celle-ci est créée automatiquement en premier.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Checking out branch...": "Réservation de la branche", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding branch ${0}...": "Ajout de la branche ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing branch ${0}...": "Retrait de la branche ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding remote ${0}...": "Ajout du descripteur ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote ${0}...": "Retrait du descripteur ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing repository ${0}": "Retrait du référentiel ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding tag {$0}": "Ajout de l'étiquette {$0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing tag {$0}": "Retrait de l'étiquette {$0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Merging ${0}": "Fusion de ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	'Unstaging changes' : 'Modifications avec retrait de contenu', //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out branch ${0}...": "Réservation de la branche ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch checked out.": "Branche réservée.", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch": "Nouvelle branche", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new local branch to the repository": "Ajouter une branche locale au référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch name": "Nom de la branche", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete": "Suppression", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the local branch from the repository": "Supprimer la branche locale du référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"DelBrConfirm": "Voulez-vous vraiment supprimer la branche ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote tracking branch from the repository": "Supprimer la branche de suivi à distance du référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure?": "Voulez-vous vraiment effectuer cette opération ?", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoveRemoteBranchConfirm": "Vous allez supprimer la branche distante \"${0}\" et envoyer la modification.\n\nVoulez-vous vraiment effectuer cette opération ?", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote branch: ": "Suppression de la branche distante en cours : ", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete Remote Branch": "Supprimer la branche distante", //$NON-NLS-0$  //$NON-NLS-1$
	"New Remote": "Nouveau contenu distant", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Remote": "Contenu distant Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Remote": "Ouvrir la page Journal Git distante pour ce fichier ou ce dossier.", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new remote to the repository": "Ajouter un nouveau contenu distant au référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote from the repository": "Supprimer le contenu distant du référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete remote ${0}?": "Voulez-vous vraiment supprimer le contenu distant ${0} ?", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull": "Extraire", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull from the repository": "Extraire du référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Pulling: ": "Extraction en cours : ", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull Git Repository": "Extraire le référentiel Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Log": "Journal Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Log": "Ouvrir la page Journal Git locale pour ce fichier ou ce dossier.", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the branch": "Ouvrir le journal de la branche", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the repository": "Ouvrir le journal du référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the status for the repository": "Ouvrir le statut du référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditor": "Afficher dans l'éditeur", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditorTooltip": "Afficher le dossier du référentiel dans l'éditeur", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareEach": "Comparer l'un à l'autre", //$NON-NLS-0$  //$NON-NLS-1$
 	"Compare With Working Tree": "Comparer avec l'arborescence de travail", //$NON-NLS-0$  //$NON-NLS-1$
	"Open": "Ouvrir", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenGitCommitTip": "Afficher l'arborescence pour cette validation", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitVersion": "Ouvrir la validation", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewCommitVersionTip": "Afficher la version validée du fichier", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch": "Extraire", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote": "Extraire du contenu distant", //$NON-NLS-0$  //$NON-NLS-1$
	"Password:": "Mot de passe :", //$NON-NLS-0$  //$NON-NLS-1$
	"User Name:": "Nom d'utilisateur :", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching remote: ": "Extraction du contenu distant : ", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Fetch": "Forcer l'extraction", //$NON-NLS-0$  //$NON-NLS-1$
	"FetchRemoteBranch": "Extraire de la branche distante dans la branche de suivi à distance en remplaçant son contenu en cours", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentRemoteTrackingBr": "Vous allez remplacer le contenu de la branche de suivi à distance. Suite à cette action, la branche peut perdre des validations.", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge": "Fusionner", //$NON-NLS-0$  //$NON-NLS-1$
	"MergeContentFrmBr": "Fusionner le contenu de la branche dans la branche active", //$NON-NLS-0$  //$NON-NLS-1$
 	". Go to ${0}.": ". Accéder à ${0}.", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status page": "Page de statut de Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase": "Resynchroniser", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsMsg": "Resynchronisez vos validations en les retirant de la branche active et en redémarrant celle-ci sur la base du dernier état de la branche sélectionnée ", //$NON-NLS-0$  //$NON-NLS-1$
 	"Rebase on top of ": "Resynchronisation en plus de ", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseSTOPPED": ". Des conflits se sont produits. Des conflits se sont produits.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_WRONG_REPOSITORY_STATE": ". L'état du référentiel n'est pas valide (la resynchronisation est déjà en cours).", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_UNMERGED_PATHS": ". Le référentiel contient des chemins non fusionnés.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_PENDING_CHANGES": ". Le référentiel contient des changements en attente. Validez ou stockez ces changements.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseUNCOMMITTED_CHANGES": ". Des modifications n'ont pas été validées.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsByRmvingThem": "Resynchronisez vos validations en les retirant de la branche active ", //$NON-NLS-0$  //$NON-NLS-1$
	"StartActiveBranch": "en redémarrant celle-ci sur la base du dernier état de '", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyEachCommitAgain": "et en appliquant de nouveau chaque validation à la branche active mise à jour.", //$NON-NLS-0$  //$NON-NLS-1$
	"Push All": "Insérer tout", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocal": "Insérer les validations et les étiquettes de la branche locale dans la branche distante", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push Branch": "Insérer la branche", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushResult": "Résultat de la commande push :", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushCommitsWithoutTags": "Insérer les validations sans étiquettes de la branche locale dans la branche distante", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push for Review": "Insérer pour la révision", //$NON-NLS-0$  //$NON-NLS-1$
	"Push commits to Gerrit Code Review": "Insérer des validations pour la révision du code Gerrit", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push Branch": "Forcer l'insertion de branche", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsWithoutTagsOverridingCurrentContent": "Insérer les validations sans étiquettes de la branche locale dans la branche distante en remplaçant le contenu en cours", //$NON-NLS-0$  //$NON-NLS-1$
 	"Pushing remote: ": "Insertion du contenu distant : ", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseBranchDialog": "Sélectionner une branche", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose the remote branch.": "Sélectionnez la branche distante.", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push All": "Forcer l'insertion de tous les éléments", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocalBr": "Insérer les validations et les étiquettes de la branche locale dans la branche distante en remplaçant le contenu en cours", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentOfRemoteBr": "Vous allez remplacer le contenu de la branche distante. Suite à cette action, le référentiel distant peut perdre des validations.", //$NON-NLS-0$  //$NON-NLS-1$
	"< Previous Page": "< - Page précédente", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git log": "Afficher la page précédente du journal Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git tags" : "Afficher la page précédente des étiquettes Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Next Page >": "Page suivante >", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git log": "Afficher la page suivante du journal Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git tags" : "Afficher la page suivante des étiquettes Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the selected remote branch": "Insérer de la branche locale dans la branche distante sélectionnée", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetActiveBr": "Réinitialisez votre branche active à l'état de cette référence. Supprimez tout le contenu ajouté à l'index et retiré de celui-ci.", //$NON-NLS-0$  //$NON-NLS-1$
 	"GitResetIndexConfirm": "Le contenu de votre branche active sera remplacé par la validation \"${0}\". Tous les changements avec ajout ou retrait de contenu seront annulés et ne pourront pas être restaurés si \"${1}\" n'est pas sélectionné. Voulez-vous vraiment effectuer cette opération ?", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting index...": "Réinitialisation de l'index...", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting git index for ${0}" : "Réinitialisation de l'index Git pour ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag": "Etiquette", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a tag for the commit": "Créer une étiquette pour la validation", //$NON-NLS-0$  //$NON-NLS-1$
	"ProjectSetup": "Votre projet est en cours de configuration. Cette opération peut prendre une minute...", //$NON-NLS-0$  //$NON-NLS-1$
	"LookingForProject": "Recherche du projet : ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag name": "Nom de l'étiquette", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the tag from the repository": "Supprimer l'étiquette du référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete tag ${0}?": "Voulez-vous vraiment supprimer l'étiquette ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Cherry-Pick": "Sélectionner", //$NON-NLS-0$  //$NON-NLS-1$
	"CherryPicking": "Validation de la sélection des meilleurs éléments : ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RevertingCommit": "Rétablissement de la validation : ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the change introduced by the commit to your active branch": "Appliquer les changements apportés par la validation à la branche active", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing changed.": "Rien n'a été modifié.", //$NON-NLS-0$  //$NON-NLS-1$
	". Some conflicts occurred": ". Des conflits se sont produits.", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote branch into your remote tracking branch": "Extraire de la branche distante dans la branche de suivi à distance", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch Git Repository": "Extraire le référentiel Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Push": "Insérer", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the remote branch": "Insérer de la branche locale dans la branche distante", //$NON-NLS-0$  //$NON-NLS-1$
	"Push Git Repository": "Extraire le référentiel Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Key:": "Clé :", //$NON-NLS-0$  //$NON-NLS-1$
	"Value:": "Valeur :", //$NON-NLS-0$  //$NON-NLS-1$
	"New Configuration Entry": "Nouvelle entrée de configuration", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit": "Edition", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit the configuration entry": "Editer l'entrée de configuration", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the configuration entry": "Supprimer l'entrée de configuration", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete ${0}?": "Voulez-vous vraiment supprimer ${0} ?", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Repository": "Cloner le référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone an existing Git repository to a folder": "Cloner un référentiel Git dans un dossier", //$NON-NLS-0$  //$NON-NLS-1$
	"Cloning repository: ": "Clonage du référentiel : ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Repository": "Initialiser le référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a new Git repository in a new folder": "Créer un nouveau référentiel Git dans un nouveau dossier", //$NON-NLS-0$  //$NON-NLS-1$
	"Initializing repository: ": "Initialisation du référentiel en cours : ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Git Repository": "Initialiser le référentiel Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the repository": "Supprimer le référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want do delete ${0} repositories?": "Voulez-vous vraiment supprimer les référentiels ${0} ?", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply a patch on the selected repository": "Appliquer un correctif sur le référentiel sélectionné", //$NON-NLS-0$  //$NON-NLS-1$
	"Show content": "Afficher le contenu", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit name:": "Nom de la validation :", //$NON-NLS-0$  //$NON-NLS-1$
	"Open Commit": "Ouvrir la validation", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitDialog": "Ouvrir la validation", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the commit with the given name": "Ouvrir la validation avec le nom donné", //$NON-NLS-0$  //$NON-NLS-1$
	"No commits found": "Aucune validation trouvée", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging changes": "Ajout de contenu à l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message:": "Message de validation :", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing changes": "Validation des modifications", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching previous commit message": "Extraction du message de validation précédent", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes": "Réinitialisation des changements en local", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout files, discarding all changes": "Réserver les fichiers en annulant tous les changements", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Patch": "Afficher le correctif", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading default workspace": "Chargement de l'espace de travail par défaut", //$NON-NLS-0$  //$NON-NLS-1$
	"Show workspace changes as a patch": "Afficher les changements de l'espace de travail en tant que correctif", //$NON-NLS-0$  //$NON-NLS-1$
	"Show checked changes as a patch": "Afficher les changements vérifiés en tant que correctif", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowCommitPatchTip": "Afficher le correctif pour les changements de cette validation", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue": "Continuer", //$NON-NLS-0$  //$NON-NLS-1$
	"Contibue Rebase": "Poursuivre la resynchronisation", //$NON-NLS-0$  //$NON-NLS-1$
	"Skip Patch": "Ignorer le correctif", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort": "Abandonner", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort Rebase": "Abandonner la resynchronisation", //$NON-NLS-0$  //$NON-NLS-1$
	"Discard": "Eliminer", //$NON-NLS-0$  //$NON-NLS-1$
	"Ignore": "Ignorer", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesSelectedFilesDiscard": "Les changements apportés aux fichiers sélectionnés seront perdus et ne pourront pas être restaurés.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Getting git log": "Obtention du journal Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting stashed changes...": "Obtention des modifications stockées...", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch (${0})": "Branche active (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch (${0})": "Branche (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag (${0})": "Etiquette (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit (${0})": "Validation (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommit (${0})": "Stock (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"WIPStash": "Travail en cours sur ${0} : ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"IndexStash": "index sur ${0} : ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranch (${0})": "Branche distante (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch Log": "Journal Git (branche active)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the active local branch": "Afficher le journal de la branche locale active", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Branch Log": "Journal Git (branche distante)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the corresponding remote tracking branch": "Afficher le journal de la branche de suivi à distance correspondante", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Status" : "Consulter le statut intégral", //$NON-NLS-0$  //$NON-NLS-1$
	"See the status" : "Consulter le statut", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose target location" : "Choisir l'emplacement cible", //$NON-NLS-0$  //$NON-NLS-1$
	"Default target location" : "Emplacement cible par défaut", //$NON-NLS-0$  //$NON-NLS-1$
	"Change..." : "Modifier...", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge Squash": "Fusionner Squash", //$NON-NLS-0$  //$NON-NLS-1$
	"Squash the content of the branch to the index" : "Ecarter le contenu de la branche sur l'index", //$NON-NLS-0$  //$NON-NLS-1$
	"Local Branch Name:" : "Nom de la branche locale :", //$NON-NLS-0$  //$NON-NLS-1$
	"Local": "local", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter items" : "Filtrer les éléments", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter filter" : "Filtrer le message", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter author" : "Filtrer l'auteur", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter committer" : "Filtrer le valideur", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter sha1" : "Filtrer sha1", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter fromDate" : "Filtrer depuis la date AAAA-MM-JJ ou 1(h d s m a)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter toDate" : "Filtrer jusqu'à la date AAAA-MM-JJ ou 1(h d s m a)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter path" : "Filtrer le chemin", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter remote branches" : "Filtrer les branches distantes", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote branches" : "Obtention des branches distantes ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote details": "Obtention des détails distants : ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchApplied": "Correctif appliqué", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchFailed": "L'application du correctif a échoué. ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting branches" : "Obtention des branches ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Paste link in email or IM" : "Coller le lien dans un courrier électronique ou dans IM", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in GitHub" : "Afficher la validation dans GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in GitHub" : "Afficher le référentiel dans GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in GitHub": "Afficher cette validation dans GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in eclipse.org": "Afficher la validation dans eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in eclipse.org" : "Afficher cette validation dans eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in eclipse.org":"Afficher le référentiel dans eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in eclipse.org":"Afficher ce référentiel dans eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review" : "Demander la révision", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review tooltip" : "Envoyer un courrier électronique avec une demande pour valider la révision", //$NON-NLS-0$  //$NON-NLS-1$
	"Reviewer name" : "Nom du réviseur", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request" : "Demande de révision de contribution", //$NON-NLS-0$  //$NON-NLS-1$
	"Send the link to the reviewer" : "Envoyer le lien au réviseur", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key file (optional):" : "Fichier de clés privé (facultatif)", //$NON-NLS-0$  //$NON-NLS-1$
	"Don't prompt me again:" : "Ne plus me demander :", //$NON-NLS-0$  //$NON-NLS-1$
	"Your private key will be saved in the browser for further use" : "Votre clé privée sera enregistrée dans le navigateur pour une utilisation ultérieure", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading Contribution Review Request..." : "Chargement de la demande de révision de contribution...", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit can be found in the following repositories" : "La validation se trouve dans les référentiels suivants", //$NON-NLS-0$  //$NON-NLS-1$
	"Try to update your repositories" : "Essayez de mettre à jour vos référentiels", //$NON-NLS-0$  //$NON-NLS-1$
	"Create new repository" : "Créer un référentiel", //$NON-NLS-0$  //$NON-NLS-1$
	"Attach the remote to one of your existing repositories" : "Joindre le référentiel distant à l'un de vos référentiels existants", //$NON-NLS-0$  //$NON-NLS-1$
	"You are reviewing contribution ${0} from ${1}" : "Vous êtes en train de réviser la contribution ${0} de ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitNotFoundInWorkspace" : "La validation est introuvable dans votre espace de travail. Pour l'afficher, effectuez l'une des opérations suivantes : ", //$NON-NLS-0$  //$NON-NLS-1$
 	"To review the commit you can also:" : "Pour réviser la validation, vous pouvez aussi :", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request for ${0} on ${1}" : "Demande de révision de contribution pour ${0} dans le référentiel dont l'adresse URL est ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Failing paths: ${0}": "Chemins défaillants : ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Problem while performing the action": "Problème lors de l'exécution de l'action", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the Orion repositories page to provide a git repository URL. Once the repository is created, it will appear in the Navigator.": "Accédez à la page de référentiels Orion pour fournir une URL de référentiel Git. Une fois créé, le référentiel apparaît dans le navigateur.", //$NON-NLS-0$  //$NON-NLS-1$
	"URL:": "URL :", //$NON-NLS-0$  //$NON-NLS-1$
	"File:": "Fichier :", //$NON-NLS-0$  //$NON-NLS-1$
	"Submit": "Soumettre", //$NON-NLS-0$  //$NON-NLS-1$
	"git url:": "Adresse URL Git : ", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert": "Rétablir", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert changes introduced by the commit into your active branch": "Annuler les modifications apportées par la validation à la branche active", //$NON-NLS-0$  //$NON-NLS-1$
	". Could not revert into active branch": ". Impossible d'annuler les modifications dans la branche active.", //$NON-NLS-0$  //$NON-NLS-1$
	"Login": "Connexion", //$NON-NLS-0$  //$NON-NLS-1$
	"Authentication required for: ${0}. ${1} and re-try the request.": "Authentification requise pour : ${0}. ${1} et relancez la demande.", //$NON-NLS-0$  //$NON-NLS-1$
	"Save":"Sauvegarder", //$NON-NLS-0$  //$NON-NLS-1$
	"Remember my committer name and email:":"Mémoriser le nom et l'adresse e-mail du valideur :", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully edited ${0} to have value ${1}":"${0} édité(e) avec succès pour obtenir la valeur ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully added ${0} with value ${1}":"${0} ajouté(e) avec succès avec la valeur ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Signed-off-by: ":"Déconnexion par : ", //$NON-NLS-0$  //$NON-NLS-1$
	"Change-Id: ":"ID modification : ", //$NON-NLS-0$  //$NON-NLS-1$
	"Push_REJECTED_NONFASTFORWARD":"L'insertion n'a pas été accélérée et a été rejetée. L'insertion n'a pas été accélérée et a été rejetée.", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit and Push" : "Valider et insérer", //$NON-NLS-0$  //$NON-NLS-1$
	"Sync" : "Synchroniser", //$NON-NLS-0$  //$NON-NLS-1$
	"SyncTooltip" : "Extraire à partir de la branche distante. Resynchronisez vos validations en les retirant de la branche locale, en redémarrant la branche locale en fonction de l'état le plus récent de la branche distante et en appliquant chaque validation à la branche locale mise à jour. Insérez les validations et les étiquettes de la branche locale dans la branche distante.", //$NON-NLS-0$  //$NON-NLS-1$
	"NoCommits" : "Pas de modification", //$NON-NLS-0$  //$NON-NLS-1$
	"NoContent" : "Pas de contenu", //$NON-NLS-0$  //$NON-NLS-1$
	"Incoming" : "Entrant", //$NON-NLS-0$  //$NON-NLS-1$
	"Outgoing" : "Sortant", //$NON-NLS-0$  //$NON-NLS-1$
	"IncomingWithCount" : "Entrant (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"OutgoingWithCount" : "Sortant (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Synchronized" : "Historique", //$NON-NLS-0$  //$NON-NLS-1$
	"Uncommited" : "Non validé", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository:" : "Référentiel :", //$NON-NLS-0$  //$NON-NLS-1$
	"Reference:" : "Référence :", //$NON-NLS-0$  //$NON-NLS-1$
	"Author:" : "Auteur :", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer:" : "Valideur :", //$NON-NLS-0$  //$NON-NLS-1$
	"SHA1:" : "SHA1 :", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchCmd" : "Afficher la branche active", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceCmd": "Afficher la référence", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceTip": "Afficher l'historique de ${1} \"${2}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchTip": "Afficher l'historique de \"${0}\" relativement à ${1} \"${2}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitType": "valider", //$NON-NLS-0$  //$NON-NLS-1$
	"BranchType": "branche", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranchType": "branche distante", //$NON-NLS-0$  //$NON-NLS-1$
	"TagType": "étiquette", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommitType": "stockage dissimulé", //$NON-NLS-0$  //$NON-NLS-1$
	"Path:" : "Chemin :", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChanges" : "Modifications du répertoire de travail", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChangesDetails" : "Détails du répertoire de travail", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareChanges" : "Comparer (${0} => ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"NoBranch" : "Aucune branche", //$NON-NLS-0$  //$NON-NLS-1$
	"NoActiveBranch" : "Aucune branche active", //$NON-NLS-0$  //$NON-NLS-1$
	"NoRef" : "Aucune référence sélectionnée", //$NON-NLS-0$  //$NON-NLS-1$
	"None": "Aucun(e)", //$NON-NLS-0$  //$NON-NLS-1$
	"FileSelected": "${0} fichier sélectionné", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesSelected": "${0} fichier(s) sélectionné(s)", //$NON-NLS-0$  //$NON-NLS-1$
	"FileChanged": "${0} fichier modifié", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChanged": "${0} fichier(s) modifié(s)", //$NON-NLS-0$  //$NON-NLS-1$
	"file": "fichier", //$NON-NLS-0$  //$NON-NLS-1$
	"files": "fichiers", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitConfirm": "Aucun fichier n'est sélectionné. Voulez-vous vraiment effectuer cette opération ?", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitWarning": "La validation est vide", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChangedVsReadyToCommit": "${0} ${1} modifié(s). ${2} ${3} prêt(s) pour validation.", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitPush": "Valider et insérer", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits and pushes files to the default remote": "Valide et insère des fichiers au contenu distant par défaut", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash" : "Stocker", //$NON-NLS-0$  //$NON-NLS-1$
	"stashIndex" : "stash@{${0}}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash all current changes away" : "Stocker toutes les modifications en cours", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop" : "Supprimer", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop the commit from the stash list" : "Supprimer la validation de la liste de stockage", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply" : "Appliquer", //$NON-NLS-0$  //$NON-NLS-1$
	"Pop Stash" : "Supprimer du stock", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the most recently stashed change to your active branch and drop it from the stashes" : "Appliquer la dernière modification stockée sur votre branche active et la supprimer des stocks", //$NON-NLS-0$  //$NON-NLS-1$
	"stashes" : "stocks", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyName': "Référentiel Git", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyTooltip': "Associer un référentiel Git à ce projet.",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectName': "Référentiel Git",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectTooltip': "Créer un projet à partir d'un référentiel Git.",  //$NON-NLS-0$  //$NON-NLS-1$
	'fetchGroup': 'Extraire',  //$NON-NLS-0$  //$NON-NLS-1$
	'pushGroup' : 'Insérer',  //$NON-NLS-0$  //$NON-NLS-1$
	'Url:' : 'URL :', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Private Key:' : 'Clé privée SSH :', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Passphrase:' : 'Phrase passe SSH :', //$NON-NLS-0$  //$NON-NLS-1$
	'confirmUnsavedChanges': 'Des modifications n\'ont pas été sauvegardées. Voulez-vous les sauvegarder ?' //$NON-NLS-1$ //$NON-NLS-0$
});

