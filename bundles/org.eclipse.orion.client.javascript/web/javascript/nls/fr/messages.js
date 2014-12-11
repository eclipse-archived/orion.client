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
	'error': 'Erreur',  //$NON-NLS-0$  //$NON-NLS-1$
	'warning' : 'Avertissement',  //$NON-NLS-0$  //$NON-NLS-1$
	'ignore' : 'Ignorer',  //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutline' : 'Structure de la source', //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutlineTitle': 'Structure de la source JavaScript',  //$NON-NLS-0$  //$NON-NLS-1$
	'contentAssist' : 'Assistant de contenu JavaScript', //$NON-NLS-0$  //$NON-NLS-1$
	'eslintValidator' : 'Valideur JavaScript', //$NON-NLS-0$  //$NON-NLS-1$
	'missingCurly' : 'Instructions non incluses entre accolades :', //$NON-NLS-0$  //$NON-NLS-1$
	'noCaller' : 'Utilisation de \'arguments.caller\' ou \'arguments.callee\' déconseillée :', //$NON-NLS-0$  //$NON-NLS-1$
	'noEqeqeq' : 'Utilisation de \'==\' déconseillée :', //$NON-NLS-0$  //$NON-NLS-1$
	'noDebugger' : 'Utilisation de l\'instruction \'debugger\' déconseillée :', //$NON-NLS-0$  //$NON-NLS-1$
	'noEval' : 'Utilisation de \'eval()\' déconseillée :', //$NON-NLS-0$  //$NON-NLS-1$
	'noDupeKeys' : 'Clés d\'objet en double :', //$NON-NLS-0$  //$NON-NLS-1$
	'useIsNaN' : 'NaN non comparé avec isNaN() :', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncDecl' : 'Aucun JSDoc dans des déclarations de fonction :', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncExpr' : 'Aucun JSDoc dans des expressions de fonction :', //$NON-NLS-0$  //$NON-NLS-1$
	'noUnreachable' : 'Code inaccessible :', //$NON-NLS-0$  //$NON-NLS-1$
	'noFallthrough' : 'Saut au bloc case \'switch\' :', //$NON-NLS-0$  //$NON-NLS-1$
	'useBeforeDefine' : 'Membre utilisé avant la définition :', //$NON-NLS-0$  //$NON-NLS-1$
	'noEmptyBlock' : 'Bloc vide non renseigné :', //$NON-NLS-0$  //$NON-NLS-1$
	'newParens' : 'Parenthèses manquantes dans un appel de constructeur :', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewArray': '\'new Array()\' déconseillé :', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewFunc': '\'new Function()\' déconseillé :', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewObject': '\'new Object()\' déconseillé :', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewWrappers': 'Objets d\'encapsulage déconseillés :', //$NON-NLS-0$  //$NON-NLS-1$
	'missingSemi' : 'Points-virgules manquants :', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedVars' : 'Variables inutilisées :', //$NON-NLS-0$  //$NON-NLS-1$
	'varRedecl' : 'Re-déclarations de variables :', //$NON-NLS-0$  //$NON-NLS-1$
	'varShadow': 'Création de variables fantômes', //$NON-NLS-0$  //$NON-NLS-1$
	'undefMember' : 'Référence globale non déclarée :', //$NON-NLS-0$  //$NON-NLS-1$
	'unnecessarySemis' : 'Points-virgules superflus :', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedParams' : 'Paramètres inutilisés :', //$NON-NLS-0$  //$NON-NLS-1$
	'unsupportedJSLint' : 'Directive d\'environnement non prise en charge :',  //$NON-NLS-0$  //$NON-NLS-1$
	'throwError': 'Fausse erreur utilisée dans \'throw\' :',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocName' : 'Générer un commentaire d\'élément',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocTooltip' : 'Générer un commentaire de type JSDoc pour l\'élément JavaScript sélectionné',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclName' : 'Ouvrir la déclaration',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclTooltip' : 'Ouvrir la déclaration pour l\'élément sélectionné',  //$NON-NLS-0$  //$NON-NLS-1$
	'validTypeof': 'Comparaison \'typeof\' non valide',  //$NON-NLS-0$ //$NON-NLS-1$
	'noSparseArrays': 'Déclarations de tableau creux', //$NON-NLS-0$ //$NON-NLS-1$
	'jsHover': 'Fournisseur d\'infobulles JavaScript', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixName': 'Supprimer le point-virgule en trop', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixTooltip': 'Supprime le point-virgule en trop', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixName': 'Ajouter un commentaire $FALLTHROUGH$', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixTooltip': 'Ajouter un commentaire de ligne $FALLTHROUGH$', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixName': 'Commenter le bloc vide', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixTooltip': 'Ajouter un commentaire TODO au bloc vide', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixName': 'Ajouter à la directive eslint-env', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixTooltip': 'Ajouter à la directive eslint-env pour filtrer les membres connus', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixName': 'Ajouter à la directive globals', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixTooltip': 'Ajouter à la directive globals pour filtrer les membres inconnus', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixName': 'Supprimer le paramètre', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixTooltip': 'Supprimer le paramètre inutilisé, en conservant les effets secondaires', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixName': 'Ajouter @callback à la fonction', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixTooltip': 'Documenter la fonction avec @callback, en ignorant les paramètres inutilisés', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixName': 'Mettre à jour l\'opérateur', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixTooltip': 'Remplacer l\'opérateur par celui qui est prévu', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixName': 'Supprimer le code inaccessible', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixTooltip': 'Supprimer le code inaccessible', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixName': 'Convertir en un tableau normal', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixTooltip': 'Supprimer les entrées creuses et convertir en un tableau normal', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixName': 'Ajouter le signe \';\' manquant', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixTooltip': 'Ajouter le signe \';\' manquant', //$NON-NLS-0$ //$NON-NLS-1$
	'radix': 'Paramètre de base manquant dans parseInt()', //$NON-NLS-0$ //$NON-NLS-1$
});

