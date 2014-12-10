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
/*eslint-env amd */
define({
    'syntaxErrorIncomplete': 'Erreur de syntaxe, instruction incomplète.',  //$NON-NLS-0$  //$NON-NLS-1$
    'syntaxErrorBadToken': 'Erreur de syntaxe sur le sème \'${0}\', supprimez ce sème.',  //$NON-NLS-0$  //$NON-NLS-1$
    'esprimaParseFailure': 'Esprima n\'est pas parvenu à analyser le fichier car une erreur est survenue : ${0}',  //$NON-NLS-0$ //$NON-NLS-1$
    'eslintValidationFailure': 'ESLint n\'a pas pu valider ce fichier car une erreur est survenue : ${0}',  //$NON-NLS-0$  //$NON-NLS-1$
	'curly': 'L\'instruction doit être encadrée dans des accolades.',  //$NON-NLS-0$  //$NON-NLS-1$
	'eqeqeq' : '\'${0}\' attendu et \'${1}\' affiché à la place.',  //$NON-NLS-0$  //$NON-NLS-1$
	'missing-doc' : 'Documentation manquante pour la fonction \'${0}\'.',  //$NON-NLS-0$  //$NON-NLS-1$
	'new-parens' : 'Parenthèses manquantes lors de l\'appel de constructeur.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-debugger': 'Utilisation de l\'instruction \'debugger\' déconseillée.',  //$NON-NLS-0$  //$NON-NLS-1$
	'no-dupe-keys' : 'Clé d\'objet en double \'${0}\'.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-empty-block' : 'Le bloc vide doit être supprimé ou commenté.',  //$NON-NLS-0$ //$NON-NLS-1$
	'no-eval' : 'Les appels de fonction ${0} sont déconseillés.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-extra-semi' : 'Point-virgule superflu.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-fallthrough' : 'Une instruction switch case peut être indiquée en effectuant un fall-through au cas précédent. Si prévu, ajoutez un nouveau commentaire //$FALLTHROUGH$ sur la ligne ci-dessus.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-jslint' : 'La directive \'${0}\' n\'est pas prise en charge, utilisez eslint-env.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-array' : 'Utilisez la notation littérale de matrice \'[]\'.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-func' : 'Le constructeur de fonction est évalué.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-object' : 'Utilisez la notation littérale d\'objet \'{}\' ou Object.create(null).', //$NON-NLS-0$  //$NON-NLS-1$
	'no-new-wrappers' : 'N\'utilisez pas \'${0}\' en tant que constructeur.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-redeclare' : '\'${0}\' est déjà défini.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-sparse-arrays': 'Les déclarations de tableau creux doivent être évitées. ',  //$NON-NLS-0$ //$NON-NLS-1$
	'no-undef-defined' : '\'${0}\' n\'est pas défini.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-undef-readonly': '\'${0}\' est en lecture seule.',  //$NON-NLS-0$  //$NON-NLS-1$
	'no-unreachable' : 'Code inaccessible.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-params' : 'Le paramètre \'${0}\' n\'est jamais utilisé.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-vars-unused' : '\'${0}\' n\'est pas utilisé.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-unused-vars-unread' : '\'${0}\' n\'est pas lu.', //$NON-NLS-0$  //$NON-NLS-1$
	'no-use-before-define': '\'${0}\' a été utilisé avant d\'être défini.', //$NON-NLS-0$  //$NON-NLS-1$
	'semi': 'Point-virgule manquant.', //$NON-NLS-0$  //$NON-NLS-1$
	'throw-error': 'Emet une erreur à la place.', //$NON-NLS-0$  //$NON-NLS-1$
	'use-isnan': 'Utilisez la fonction isNaN pour effectuer la comparaison avec NaN.', //$NON-NLS-0$  //$NON-NLS-1$
	'valid-typeof' : 'Comparaison typeof non valide. ',  //$NON-NLS-0$ //$NON-NLS-1$
});

