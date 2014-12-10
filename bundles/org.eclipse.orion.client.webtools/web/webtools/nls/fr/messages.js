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
	'htmlOutline' : 'Structure HTML', //$NON-NLS-0$  //$NON-NLS-1$
	'cssOutline' : 'Structure de la règle CSS', //$NON-NLS-0$  //$NON-NLS-1$
	'htmlContentAssist' : 'Assistant de contenu HTML', //$NON-NLS-0$  //$NON-NLS-1$
	'cssContentAssist' : 'Assistant de contenu CSS', //$NON-NLS-0$  //$NON-NLS-1$
	
	'csslintValidator' : 'Valideur CSS',
	'ignore' : 'Ignorer',
	'warning' : 'Avertissement',
	'error' : 'Erreur',
	
	'adjoining-classes': 'Interdire l\'adjonction de classes :', //$NON-NLS-0$  //$NON-NLS-1$
	'box-model': 'Tenez compte de la taille de zone ingérable :', //$NON-NLS-0$  //$NON-NLS-1$
	'box-sizing': 'Interdire l\'utilisation de box-sizing :', //$NON-NLS-0$  //$NON-NLS-1$
	'bulletproof-font-face': 'Utiliser la syntaxe bulletproof @font-face :', //$NON-NLS-0$  //$NON-NLS-1$
	'compatible-vendor-prefixes': 'Demander des préfixes de fournisseur compatibles :', //$NON-NLS-0$  //$NON-NLS-1$
	'display-property-grouping': 'Demander des propriétés appropriées à l\'affichage :', //$NON-NLS-0$  //$NON-NLS-1$
	'duplicate-background-images': 'Interdire les images d\'arrière-plan en double :', //$NON-NLS-0$  //$NON-NLS-1$
	'duplicate-properties': 'Interdire les propriétés en double :', //$NON-NLS-0$  //$NON-NLS-1$
	'empty-rules': 'Interdire les règles vides :', //$NON-NLS-0$  //$NON-NLS-1$
	'fallback-colors': 'Demander des couleurs de secours :', //$NON-NLS-0$  //$NON-NLS-1$
	'floats': 'Ne pas autoriser un nombre trop élevé de variables flottantes', //$NON-NLS-0$  //$NON-NLS-1$
	'font-faces': 'N\'utilisez pas un nombre trop élevé de polices Web :', //$NON-NLS-0$  //$NON-NLS-1$
	'font-sizes': 'Ne pas autoriser un nombre trop élevé de tailles de police :', //$NON-NLS-0$  //$NON-NLS-1$
	'gradients': 'Demander toutes les définitions de dégradé :', //$NON-NLS-0$  //$NON-NLS-1$
	'ids': 'Interdire les ID dans les sélecteurs :', //$NON-NLS-0$  //$NON-NLS-1$
	'import': 'Interdire @import :', //$NON-NLS-0$  //$NON-NLS-1$
	'important': 'Interdire !important :', //$NON-NLS-0$  //$NON-NLS-1$
	'known-properties': 'Demander l\'utilisation de propriétés connues :', //$NON-NLS-0$  //$NON-NLS-1$
	'outline-none': 'Interdire outline: none :', //$NON-NLS-0$  //$NON-NLS-1$
	'overqualified-elements': 'Interdire les éléments surqualifiés :', //$NON-NLS-0$  //$NON-NLS-1$
	'qualified-headings': 'Interdire les en-têtes qualifiés :', //$NON-NLS-0$  //$NON-NLS-1$
	'regex-selectors': 'Interdire les sélecteurs qui ressemblent à des expressions régulières :', //$NON-NLS-0$  //$NON-NLS-1$
	'rules-count': 'Nombre de règles :', //$NON-NLS-0$  //$NON-NLS-1$
	'selector-max-approaching': 'Avertissement à l\'approche de la limite de sélecteur 4095 pour IE :', //$NON-NLS-0$  //$NON-NLS-1$
	'selector-max': 'Erreur en cas de dépassement de la limite de sélecteur 4095 pour IE :', //$NON-NLS-0$  //$NON-NLS-1$
	'shorthand': 'Demander des propriétés abrégées :', //$NON-NLS-0$  //$NON-NLS-1$
	'star-property-hack': 'Interdire les propriétés dont le préfixe est une étoile :', //$NON-NLS-0$  //$NON-NLS-1$
	'text-indent': 'Interdire les valeurs négatives pour text-indent :', //$NON-NLS-0$  //$NON-NLS-1$
	'underscore-property-hack': 'Interdire les propriétés dont le préfixe est un trait de soulignement :', //$NON-NLS-0$  //$NON-NLS-1$
	'unique-headings': 'Les en-têtes ne doivent être définis qu\'une seule fois :', //$NON-NLS-0$  //$NON-NLS-1$
	'universal-selector': 'Interdire le sélecteur universel :', //$NON-NLS-0$  //$NON-NLS-1$
	'unqualified-attributes': 'Interdire les sélecteurs d\'attributs non qualifiés :', //$NON-NLS-0$  //$NON-NLS-1$
	'vendor-prefix': 'Demander la propriété standard avec le préfixe de fournisseur :', //$NON-NLS-0$  //$NON-NLS-1$
	'zero-units': 'Interdire les unités pour les valeurs 0 :' //$NON-NLS-0$  //$NON-NLS-1$
});

