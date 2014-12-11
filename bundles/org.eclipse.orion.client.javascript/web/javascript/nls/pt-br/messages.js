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
	'error': 'Erro',  //$NON-NLS-0$  //$NON-NLS-1$
	'warning' : 'Aviso',  //$NON-NLS-0$  //$NON-NLS-1$
	'ignore' : 'Ignorar',  //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutline' : 'Estrutura de tópicos de origem', //$NON-NLS-0$  //$NON-NLS-1$
	'sourceOutlineTitle': 'Estrutura de tópicos de origem JavaScript',  //$NON-NLS-0$  //$NON-NLS-1$
	'contentAssist' : 'Assistência de conteúdo JavaScript', //$NON-NLS-0$  //$NON-NLS-1$
	'eslintValidator' : 'Validador JavaScript', //$NON-NLS-0$  //$NON-NLS-1$
	'missingCurly' : 'Instruções não colocadas entre chaves:', //$NON-NLS-0$  //$NON-NLS-1$
	'noCaller' : 'Uso de \'arguments.caller\' ou \'arguments.callee\' desencorajado:', //$NON-NLS-0$  //$NON-NLS-1$
	'noEqeqeq' : 'Uso de \'==\' desencorajado:', //$NON-NLS-0$  //$NON-NLS-1$
	'noDebugger' : 'Uso da instrução \'debugger\' desencorajado:', //$NON-NLS-0$  //$NON-NLS-1$
	'noEval' : 'Uso de \'eval()\' desencorajado:', //$NON-NLS-0$  //$NON-NLS-1$
	'noDupeKeys' : 'Chaves de objetos duplicadas:', //$NON-NLS-0$  //$NON-NLS-1$
	'useIsNaN' : 'NaN não comparado com isNaN():', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncDecl' : 'Nenhum JSDoc nas declarações de função:', //$NON-NLS-0$  //$NON-NLS-1$
	'docFuncExpr' : 'Nenhum JSDoc nas expressões de função:', //$NON-NLS-0$  //$NON-NLS-1$
	'noUnreachable' : 'Código não atingível:', //$NON-NLS-0$  //$NON-NLS-1$
	'noFallthrough' : 'Falha da instrução Switch:', //$NON-NLS-0$  //$NON-NLS-1$
	'useBeforeDefine' : 'Membro usado antes da definição:', //$NON-NLS-0$  //$NON-NLS-1$
	'noEmptyBlock' : 'Bloco vazio não documentado:', //$NON-NLS-0$  //$NON-NLS-1$
	'newParens' : 'Parênteses ausentes na chamada do construtor:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewArray': '\'new Array()\' desencorajada:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewFunc': '\'new Function()\' desencorajada:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewObject': '\'new Object()\' desencorajado:', //$NON-NLS-0$  //$NON-NLS-1$
	'noNewWrappers': 'Objetos do wrapper desencorajados:', //$NON-NLS-0$  //$NON-NLS-1$
	'missingSemi' : 'Pontos e vírgulas ausentes:', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedVars' : 'Variáveis não utilizadas:', //$NON-NLS-0$  //$NON-NLS-1$
	'varRedecl' : 'Redeclarações da variável:', //$NON-NLS-0$  //$NON-NLS-1$
	'varShadow': 'Shadowing de variável:', //$NON-NLS-0$  //$NON-NLS-1$
	'undefMember' : 'Referência global não declarada:', //$NON-NLS-0$  //$NON-NLS-1$
	'unnecessarySemis' : 'Pontos e vírgulas desnecessários:', //$NON-NLS-0$  //$NON-NLS-1$
	'unusedParams' : 'Parâmetros não utilizados:', //$NON-NLS-0$  //$NON-NLS-1$
	'unsupportedJSLint' : 'Diretiva de ambiente não suportada:',  //$NON-NLS-0$  //$NON-NLS-1$
	'throwError': 'Sem erro usado em \'throw\':',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocName' : 'Gerar Comentário de Elemento',  //$NON-NLS-0$  //$NON-NLS-1$
	'generateDocTooltip' : 'Gerar comentário semelhante a JSDoc para o elemento JavaScript selecionado',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclName' : 'Abrir Declaração',  //$NON-NLS-0$  //$NON-NLS-1$
	'openDeclTooltip' : 'Abrir a declaração do elemento selecionado',  //$NON-NLS-0$  //$NON-NLS-1$
	'validTypeof': 'Comparação \'typeof\' inválida',  //$NON-NLS-0$ //$NON-NLS-1$
	'noSparseArrays': 'Declarações de matriz esparsa', //$NON-NLS-0$ //$NON-NLS-1$
	'jsHover': 'Provedor de ajuda instantânea do JavaScript', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixName': 'Remover ponto e vírgula extra', //$NON-NLS-0$ //$NON-NLS-1$
	'removeExtraSemiFixTooltip': 'Remove o ponto e vírgula extra', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixName': 'Incluir comentário $FALLTHROUGH$', //$NON-NLS-0$ //$NON-NLS-1$
	'addFallthroughCommentFixTooltip': 'Incluir o comentário de linha $FALLTHROUGH$', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixName': 'Comentar bloco vazio', //$NON-NLS-0$ //$NON-NLS-1$
	'addEmptyCommentFixTooltip': 'Incluir um comentário TODO no bloco vazio', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixName': 'Incluir na diretiva eslint-env', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintEnvFixTooltip': 'Incluir na diretiva eslint-env para filtrar o membro conhecido', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixName': 'Incluir na diretiva globals', //$NON-NLS-0$ //$NON-NLS-1$
	'addESLintGlobalFixTooltip': 'Incluir na diretiva globals para filtrar o membro desconhecido', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixName': 'Remover Parâmetro', //$NON-NLS-0$ //$NON-NLS-1$
	'removeUnusedParamsFixTooltip': 'Remover o parâmetro não usado, mantendo efeitos colaterais', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixName': 'Incluir @callback na função', //$NON-NLS-0$ //$NON-NLS-1$
	'commentCallbackFixTooltip': 'Documentar a função com @callback, ignorando os parâmetros não usados', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixName': 'Atualizar operador', //$NON-NLS-0$ //$NON-NLS-1$
	'eqeqeqFixTooltip': 'Atualizar o operador para aquele esperado', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixName': 'Remover código não atingível', //$NON-NLS-0$ //$NON-NLS-1$
	'unreachableFixTooltip': 'Remover código não atingível', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixName': 'Converter em matriz normal', //$NON-NLS-0$ //$NON-NLS-1$
	'sparseArrayFixTooltip': 'Remover entradas esparsas e converter em matriz normal', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixName': 'Incluir \';\' ausente', //$NON-NLS-0$ //$NON-NLS-1$
	'semiFixTooltip': 'Incluir \';\' ausente', //$NON-NLS-0$ //$NON-NLS-1$
	'radix': 'Parâmetro radix ausente para parseInt()', //$NON-NLS-0$ //$NON-NLS-1$
});

