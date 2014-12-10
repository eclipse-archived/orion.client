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
	"multipleAnnotations": "Plusieurs annotations :", //$NON-NLS-1$ //$NON-NLS-0$
	"line": "Ligne : ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"breakpoint": "Point d'arrêt", //$NON-NLS-1$ //$NON-NLS-0$
	"bookmark": "Signet", //$NON-NLS-1$ //$NON-NLS-0$
	"task": "Tâche", //$NON-NLS-1$ //$NON-NLS-0$
	"error": "Erreur", //$NON-NLS-1$ //$NON-NLS-0$
	"warning": "Avertissement", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingSearch": "Recherche correspondante", //$NON-NLS-1$ //$NON-NLS-0$
	"currentSearch": "Recherche en cours", //$NON-NLS-1$ //$NON-NLS-0$
	"currentLine": "Ligne en cours", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingBracket": "Crochet correspondant", //$NON-NLS-1$ //$NON-NLS-0$
	"currentBracket": "Crochet en cours", //$NON-NLS-1$ //$NON-NLS-0$
	
	"lineUp": "Ligne précédente", //$NON-NLS-1$ //$NON-NLS-0$
	"lineDown": "Ligne suivante", //$NON-NLS-1$ //$NON-NLS-0$
	"lineStart": "Début de ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"lineEnd": "Fin de ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"charPrevious": "Caractère précédent", //$NON-NLS-1$ //$NON-NLS-0$
	"charNext": "Caractère suivant", //$NON-NLS-1$ //$NON-NLS-0$
	"pageUp": "Page arrière", //$NON-NLS-1$ //$NON-NLS-0$
	"pageDown": "Page avant", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageUp": "Faire défiler la page vers le haut", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageDown": "Faire défiler la page vers le bas", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineUp": "Défiler vers le haut", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineDown": "Défiler vers le bas", //$NON-NLS-1$ //$NON-NLS-0$
	"wordPrevious": "Mot précédent", //$NON-NLS-1$ //$NON-NLS-0$
	"wordNext": "Mot suivant", //$NON-NLS-1$ //$NON-NLS-0$
	"textStart": "Début du document", //$NON-NLS-1$ //$NON-NLS-0$
	"textEnd": "Fin du document", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextStart": "Aller au début du document", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextEnd": "Aller à la fin du document", //$NON-NLS-1$ //$NON-NLS-0$
	"centerLine": "Ligne centrale", //$NON-NLS-1$ //$NON-NLS-0$
	
	"selectLineUp": "Sélectionner la ligne vers le haut", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineDown": "Sélectionner la ligne vers le bas", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineUp": " Sélectionner la ligne entière vers le haut", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineDown": "Sélectionner la ligne entière vers le bas", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineStart": "Sélectionner début de ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineEnd": "Sélectionner fin de ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharPrevious": "Sélectionner le caractère précédent", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharNext": "Sélectionner le caractère suivant", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageUp": "Sélectionner haut de page", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageDown": "Sélectionner bas de page", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordPrevious": "Sélectionner mot précédent", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordNext": "Sélectionner mot suivant", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextStart": "Sélectionner le début du document", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextEnd": "Sélectionner la fin du document", //$NON-NLS-1$ //$NON-NLS-0$

	"deletePrevious": "Supprimer le caractère précédent", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteNext": "Supprimer le caractère suivant", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordPrevious": "Supprimer le mot précédent", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordNext": "Supprimer le mot suivant", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineStart": "Supprimer le début de ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineEnd": "Supprimer la fin de ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"tab": "Insérer une tabulation", //$NON-NLS-1$ //$NON-NLS-0$
	"enter": "Insérer un délimiteur de ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"enterNoCursor": "Insérer un délimiteur de ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"selectAll": "Sélectionner tout", //$NON-NLS-1$ //$NON-NLS-0$
	"copy": "Copier", //$NON-NLS-1$ //$NON-NLS-0$
	"cut": "Couper", //$NON-NLS-1$ //$NON-NLS-0$
	"paste": "Coller", //$NON-NLS-1$ //$NON-NLS-0$
	
	"uppercase": "Majuscule", //$NON-NLS-1$ //$NON-NLS-0$
	"lowercase": "Minuscule", //$NON-NLS-1$ //$NON-NLS-0$
	"capitalize": "Mettre en majuscules", //$NON-NLS-1$ //$NON-NLS-0$
	"reversecase" : "Inverser la casse", //$NON-NLS-1$ //$NON-NLS-0$
	
	"toggleWrapMode": "Activer/désactiver le mode retour à la ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleTabMode": "Activer/désactiver le mode tabulation", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleOverwriteMode": "Activer/Désactiver le mode remplacement", //$NON-NLS-1$ //$NON-NLS-0$
	
	"committerOnTime": "${0} le ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//Emacs
	"emacs": "Emacs", //$NON-NLS-1$ //$NON-NLS-0$
	"exchangeMarkPoint": "Echanger la marque et le point", //$NON-NLS-1$ //$NON-NLS-0$
	"setMarkCommand": "Définir une marque", //$NON-NLS-1$ //$NON-NLS-0$
	"clearMark": "Effacer la marque", //$NON-NLS-1$ //$NON-NLS-0$
	"digitArgument": "Argument numérique ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"negativeArgument": "Argument négatif", //$NON-NLS-1$ //$NON-NLS-0$
			
	"Comment": "Mettre en commentaire", //$NON-NLS-1$ //$NON-NLS-0$
	"Flat outline": "Nomenclature non hiérarchique", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStr": "Recherche incrémentielle : ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStrNotFound": "Recherche incrémentielle : ${0} (non trouvé)", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStr": "Recherche incrémentielle inversée : ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStrNotFound": "Recherche incrémentielle inversée : ${0} (introuvable)", //$NON-NLS-1$ //$NON-NLS-0$
	"find": "Rechercher...", //$NON-NLS-1$ //$NON-NLS-0$
	"undo": "Annuler", //$NON-NLS-1$ //$NON-NLS-0$
	"redo": "Répéter", //$NON-NLS-1$ //$NON-NLS-0$
	"cancelMode": "Annuler le mode en cours", //$NON-NLS-1$ //$NON-NLS-0$
	"findNext": "Rechercher l'occurrence suivante", //$NON-NLS-1$ //$NON-NLS-0$
	"findPrevious": "Rechercher l'occurrence précédente", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFind": "Recherche incrémentielle", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverse": "Recherche incrémentielle inversée", //$NON-NLS-1$ //$NON-NLS-0$
	"indentLines": "Appliquer un retrait de lignes", //$NON-NLS-1$ //$NON-NLS-0$
	"unindentLines": "Supprimer le retrait de lignes", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesUp": "Déplacer les lignes vers le haut", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesDown": "Déplacer les lignes vers le bas", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesUp": "Copier les lignes au-dessus", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesDown": "Copier les lignes en dessous", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLines": "Supprimer les lignes", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "Accéder à la ligne...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompty": "Accéder à la ligne :", //$NON-NLS-1$ //$NON-NLS-0$
	"nextAnnotation": "Annotation suivante", //$NON-NLS-1$ //$NON-NLS-0$
	"prevAnnotation": "Annotation précédente", //$NON-NLS-1$ //$NON-NLS-0$
	"expand": "Développer", //$NON-NLS-1$ //$NON-NLS-0$
	"collapse": "Réduire", //$NON-NLS-1$ //$NON-NLS-0$
	"expandAll": "Développer tout", //$NON-NLS-1$ //$NON-NLS-0$
	"collapseAll": "Réduire tout", //$NON-NLS-1$ //$NON-NLS-0$
	"lastEdit": "Dernier emplacement d'édition", //$NON-NLS-1$ //$NON-NLS-0$
	"trimTrailingWhitespaces": "Supprimer les espaces de fin", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleLineComment": "Activer/désactiver le commentaire de ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"addBlockComment": "Ajouter une mise en commentaire de bloc", //$NON-NLS-1$ //$NON-NLS-0$
	"removeBlockComment": "Supprimer une mise en commentaire de bloc", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeEntered": "Entrée en mode lié", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeExited": "Sortie du mode lié", //$NON-NLS-1$ //$NON-NLS-0$
	"syntaxError": "Erreur de syntaxe", //$NON-NLS-1$ //$NON-NLS-0$
	"contentAssist": "Affiche l'assistant de contenu", //$NON-NLS-1$ //$NON-NLS-0$
	"lineColumn": "Ligne ${0} : Col ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//vi
	"vi": "vi", //$NON-NLS-1$ //$NON-NLS-0$
	"vimove": "(Déplacer)", //$NON-NLS-1$ //$NON-NLS-0$
	"viyank": "(Coller)", //$NON-NLS-1$ //$NON-NLS-0$
	"videlete": "(Supprimer)", //$NON-NLS-1$ //$NON-NLS-0$
	"vichange": "(Changer)", //$NON-NLS-1$ //$NON-NLS-0$
	"viLeft": "${0} Gauche", //$NON-NLS-1$ //$NON-NLS-0$
	"viRight": "${0} Droite", //$NON-NLS-1$ //$NON-NLS-0$
	"viUp": "${0} Vers le haut", //$NON-NLS-1$ //$NON-NLS-0$
	"viDown": "${0} Vers le bas", //$NON-NLS-1$ //$NON-NLS-0$
	"viw": "${0} Mot suivant", //$NON-NLS-1$ //$NON-NLS-0$
	"vib": "${0} Début du mot", //$NON-NLS-1$ //$NON-NLS-0$
	"viW": "${0} Mot suivant (ws stop)", //$NON-NLS-1$ //$NON-NLS-0$
	"viB": "${0} Début du mot (ws stop)", //$NON-NLS-1$ //$NON-NLS-0$
	"vie": "${0} Fin du mot", //$NON-NLS-1$ //$NON-NLS-0$
	"viE": "${0} Fin du mot (ws stop)", //$NON-NLS-1$ //$NON-NLS-0$
	"vi$": "${0} Fin de la ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"vi^_": "${0} Premier caractère non blanc sur la ligne en cours", //$NON-NLS-1$ //$NON-NLS-0$
	"vi+": "${0} Premier caractère sur la ligne suivante", //$NON-NLS-1$ //$NON-NLS-0$
	"vi-": "${0} Premier caractère sur la ligne précédente", //$NON-NLS-1$ //$NON-NLS-0$
	"vi|": "${0} Nième colonne sur la ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"viH": "${0} Haut de page", //$NON-NLS-1$ //$NON-NLS-0$
	"viM": "${0} Milieu de page", //$NON-NLS-1$ //$NON-NLS-0$
	"viL": "${0} Bas de page", //$NON-NLS-1$ //$NON-NLS-0$
	"vi/": "${0} Rechercher en avant", //$NON-NLS-1$ //$NON-NLS-0$
	"vi?": "${0} Rechercher en arrière", //$NON-NLS-1$ //$NON-NLS-0$
	"vin": "${0} Recherche suivante", //$NON-NLS-1$ //$NON-NLS-0$
	"viN": "${0} Recherche précédente", //$NON-NLS-1$ //$NON-NLS-0$
	"vif": "${0} Rechercher le caractère en avant", //$NON-NLS-1$ //$NON-NLS-0$
	"viF": "${0} Rechercher le caractère en arrière", //$NON-NLS-1$ //$NON-NLS-0$
	"vit": "${0} Rechercher le caractère en avant et placer le caret un espace avant", //$NON-NLS-1$ //$NON-NLS-0$
	"viT": "${0} Rechercher le caractère en arrière et placer le caret un espace avant", //$NON-NLS-1$ //$NON-NLS-0$
	"vi,": "${0} Répéter la recherche du caractère dans le sens inverse", //$NON-NLS-1$ //$NON-NLS-0$
	"vi;": "${0} Répéter la recherche du caractère", //$NON-NLS-1$ //$NON-NLS-0$
	"viG": "${0} Aller à la ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"viycd": "${0} Ligne en cours", //$NON-NLS-1$ //$NON-NLS-0$
	"via": "Ajouter après le curseur", //$NON-NLS-1$ //$NON-NLS-0$
	"viA": "Ajouter à la fin de la ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"vii": "Insérer avant le curseur", //$NON-NLS-1$ //$NON-NLS-0$
	"viI": "Insérer au début de la ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"viO": "Insérer une ligne au-dessus", //$NON-NLS-1$ //$NON-NLS-0$
	"vio": "Insérer une ligne en dessous", //$NON-NLS-1$ //$NON-NLS-0$
	"viR": "Commencer à remplacer le texte", //$NON-NLS-1$ //$NON-NLS-0$
	"vis": "Substituer un caractère", //$NON-NLS-1$ //$NON-NLS-0$
	"viS": "Substituer une ligne entière", //$NON-NLS-1$ //$NON-NLS-0$
	"viC": "Changer le texte jusqu'à la ligne de fin", //$NON-NLS-1$ //$NON-NLS-0$
	"vip": "Coller après le caractère ou la ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"viP": "Coller avant le caractère ou la ligne", //$NON-NLS-1$ //$NON-NLS-0$
	"viStar": "Rechercher le mot sous le curseur", //$NON-NLS-1$ //$NON-NLS-0$
	
	"next": "Suivant", //$NON-NLS-1$ //$NON-NLS-0$
	"previous": "Précédent", //$NON-NLS-1$ //$NON-NLS-0$
	"replace": "Remplacement", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceAll": "Remplacer tout", //$NON-NLS-1$ //$NON-NLS-0$
	"findWith": "Rechercher avec", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceWith": "Remplacer par", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitive": "Aa", //$NON-NLS-1$ //$NON-NLS-0$
	"regex": "/.*/", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWord": "\\b", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitiveTooltip": "Activer/désactiver l'insensibilité à la casse", //$NON-NLS-1$ //$NON-NLS-0$
	"regexTooltip": "Activer/désactiver l'expression régulière", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWordTooltip": "Activer/désactiver le mot entier", //$NON-NLS-1$ //$NON-NLS-0$
	"closeTooltip": "Fermer", //$NON-NLS-1$ //$NON-NLS-0$

	"replacingAll": "Remplacement global en cours...", //$NON-NLS-1$ //$NON-NLS-0$
	"replacedMatches": "${0} correspondance(s) remplacée(s)", //$NON-NLS-1$ //$NON-NLS-0$
	"nothingReplaced": "Aucun élément remplacé", //$NON-NLS-1$ //$NON-NLS-0$
	"notFound": "Introuvable" //$NON-NLS-1$ //$NON-NLS-0$
});

