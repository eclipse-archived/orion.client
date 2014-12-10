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
	"Editor": "Editeur", //$NON-NLS-1$ //$NON-NLS-0$
	"switchEditor": "Basculer vers un autre éditeur", //$NON-NLS-1$ //$NON-NLS-0$
	"Fetching": "Extraction : ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"confirmUnsavedChanges": "Certains changements n'ont pas été sauvegardés. Voulez-vous toujours quitter ?", //$NON-NLS-1$ //$NON-NLS-0$
	"searchFiles": "Recherche rapide...", //$NON-NLS-1$ //$NON-NLS-0$
	"searchTerm": "Entrez le terme recherché :", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedChanges": "Certaines modifications n'ont pas été sauvegardées.", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedAutoSaveChanges": "Restez sur la page jusqu'à la fin de la sauvegarde automatique.", //$NON-NLS-1$ //$NON-NLS-0$
	"Save": "Sauvegarder", //$NON-NLS-1$ //$NON-NLS-0$
	"Saved": "Sauvegardé", //$NON-NLS-1$ //$NON-NLS-0$
	"Blame": "Reproche", //$NON-NLS-1$ //$NON-NLS-0$
	"BlameTooltip":"Afficher les annotations de reproche", //$NON-NLS-1$ //$NON-NLS-0$
	"saveOutOfSync": "Ressource non synchronisée avec le serveur. Voulez-vous la sauvegarder quand même ?", //$NON-NLS-1$ //$NON-NLS-0$
	"loadOutOfSync": "Ressource non synchronisée avec le serveur. Voulez-vous la charger malgré tout ? Vous remplacerez vos modifications locales.", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadata": "Lecture des métadonnées de ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadataError": "Impossible d'obtenir les métadonnées de ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"Reading": "Lecture de ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"readonly": "Lecture seule.", //$NON-NLS-1$ //$NON-NLS-0$
	"saveFile": "Sauvegarder ce fichier", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleZoomRuler": "Activer/désactiver la règle de zoom", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "Aller à la ligne...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLineTooltip": "Accéder au numéro de ligne spécifié", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompt": "Accéder à la ligne :", //$NON-NLS-1$ //$NON-NLS-0$
	"Undo": "Annuler", //$NON-NLS-1$ //$NON-NLS-0$
	"Redo": "Répéter", //$NON-NLS-1$ //$NON-NLS-0$
	"Find": "Rechercher...", //$NON-NLS-1$ //$NON-NLS-0$
	"noResponse": "Aucune réponse du serveur. Vérifiez votre connexion Internet et essayez à nouveau.", //$NON-NLS-1$ //$NON-NLS-0$
	"savingFile": "Sauvegarde du fichier ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"running": "Exécution de ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"Saving..." : "Sauvegarde...", //$NON-NLS-1$ //$NON-NLS-0$
	"View": "Vue", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanel": "Panneau latéral", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanelTooltip": "Sélectionner les éléments à afficher dans le panneau latéral.", //$NON-NLS-1$ //$NON-NLS-0$
	"Slideout": "Glissement", //$NON-NLS-1$ //$NON-NLS-0$
	"Actions": "Actions", //$NON-NLS-1$ //$NON-NLS-0$
	"Navigator": "Navigateur", //$NON-NLS-1$ //$NON-NLS-0$
	"FolderNavigator": "Navigateur de dossiers", //$NON-NLS-1$ //$NON-NLS-0$
	"Project": "Projet", //$NON-NLS-1$ //$NON-NLS-0$
	"New": "Nouveau", //$NON-NLS-1$ //$NON-NLS-0$
	"File": "Fichier", //$NON-NLS-1$ //$NON-NLS-0$
	"Edit": "Edition", //$NON-NLS-1$ //$NON-NLS-0$
	"Tools": "Outils", //$NON-NLS-1$ //$NON-NLS-0$
	"Add": "Ajouter", //$NON-NLS-1$ //$NON-NLS-0$
	"noActions": "Il n'existe aucune action pour la sélection en cours.", //$NON-NLS-1$ //$NON-NLS-0$
	"NoFile": "Utilisez ${0} pour créer des fichiers et des dossiers. Cliquez sur un fichier pour commencer le codage.", //$NON-NLS-1$ //$NON-NLS-0$
	"LocalEditorSettings": "Paramètres de l'éditeur local", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProject": "${0} n'est pas un projet. Pour le convertir en projet, utilisez ${1}.", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProjects": "Il n'existe aucun projet dans votre espace de travail. Utilisez le menu ${0} pour créer des projets.", //$NON-NLS-1$ //$NON-NLS-0$
	"Disconnected": "${0} (déconnecté)", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFS": "Sélectionner un système de fichiers", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFSTooltip": "Sélectionnez le système de fichiers que vous voulez afficher.", //$NON-NLS-1$ //$NON-NLS-0$
	"FSTitle": "${0} (${1})", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy": "Déployer", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy As": "Déployer en tant que", //$NON-NLS-1$ //$NON-NLS-0$
	"Import": "Importer", //$NON-NLS-1$ //$NON-NLS-0$
	"Export": "Exporter", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenWith": "Ouvrir avec", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenRelated": "Ouvrir un élément connexe", //$NON-NLS-1$ //$NON-NLS-0$
	"Dependency": "Dépendance", //$NON-NLS-1$ //$NON-NLS-0$
	"UnnamedCommand": "Sans nom", //$NON-NLS-1$ //$NON-NLS-0$
	"searchInFolder": "Rechercher dans un dossier...",  //$NON-NLS-1$ //$NON-NLS-0$
	"Global Search": "Recherche globale...", //$NON-NLS-1$ //$NON-NLS-0$
	"ClickEditLabel": "Cliquez pour éditer", //$NON-NLS-1$ //$NON-NLS-0$
	"ProjectInfo": "Informations du projet", //$NON-NLS-1$ //$NON-NLS-0$
	"DeployInfo": "Informations de déploiement", //$NON-NLS-1$ //$NON-NLS-0$
	"Name": "Nom", //$NON-NLS-1$ //$NON-NLS-0$
	"Description": "Description", //$NON-NLS-1$ //$NON-NLS-0$
	"Site": "Site", //$NON-NLS-1$ //$NON-NLS-0$
	'projectsSectionTitle': 'Projets',  //$NON-NLS-0$  //$NON-NLS-1$
	'listingProjects': 'Listage des projets...',  //$NON-NLS-0$  //$NON-NLS-1$
	'gettingWorkspaceInfo': 'Obtention d\'informations sur l\'espace de travail...',  //$NON-NLS-0$  //$NON-NLS-1$
	"showProblems": "Afficher les problèmes... ",  //$NON-NLS-1$ //$NON-NLS-0$
});

