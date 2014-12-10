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
	"multipleAnnotations": "Anotações Múltiplas:", //$NON-NLS-1$ //$NON-NLS-0$
	"line": "Linha: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"breakpoint": "Ponto de Interrupção", //$NON-NLS-1$ //$NON-NLS-0$
	"bookmark": "Favoritos", //$NON-NLS-1$ //$NON-NLS-0$
	"task": "Tarefa", //$NON-NLS-1$ //$NON-NLS-0$
	"error": "Erro", //$NON-NLS-1$ //$NON-NLS-0$
	"warning": "Aviso", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingSearch": "Procura Correspondente", //$NON-NLS-1$ //$NON-NLS-0$
	"currentSearch": "Procura Atual", //$NON-NLS-1$ //$NON-NLS-0$
	"currentLine": "Linha Atual", //$NON-NLS-1$ //$NON-NLS-0$
	"matchingBracket": "Colchete Correspondente", //$NON-NLS-1$ //$NON-NLS-0$
	"currentBracket": "Colchete Atual", //$NON-NLS-1$ //$NON-NLS-0$
	
	"lineUp": "Linha Acima", //$NON-NLS-1$ //$NON-NLS-0$
	"lineDown": "Linha Abaixo", //$NON-NLS-1$ //$NON-NLS-0$
	"lineStart": "Início da Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"lineEnd": "Final da Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"charPrevious": "Caractere Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"charNext": "Próximo Caractere", //$NON-NLS-1$ //$NON-NLS-0$
	"pageUp": "Página Acima", //$NON-NLS-1$ //$NON-NLS-0$
	"pageDown": "Página Abaixo", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageUp": "Rolar Página para Cima", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollPageDown": "Rolar Página para Baixo", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineUp": "Rolar Linha para Cima", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollLineDown": "Rolar Linha para Baixo", //$NON-NLS-1$ //$NON-NLS-0$
	"wordPrevious": "Palavra Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"wordNext": "Próxima Palavra", //$NON-NLS-1$ //$NON-NLS-0$
	"textStart": "Início do Documento", //$NON-NLS-1$ //$NON-NLS-0$
	"textEnd": "Fim do Documento", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextStart": "Rolar para o Início do Documento", //$NON-NLS-1$ //$NON-NLS-0$
	"scrollTextEnd": "Rolar Para o Fim do Documento", //$NON-NLS-1$ //$NON-NLS-0$
	"centerLine": "Center Line", //$NON-NLS-1$ //$NON-NLS-0$
	
	"selectLineUp": "Selecionar Linha Acima", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineDown": "Selecionar Linha para Baixo", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineUp": " Selecionar Toda Linha Acima", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWholeLineDown": "Selecionar Toda Linha Abaixo", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineStart": "Selecionar Início da Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"selectLineEnd": "Selecionar Final da Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharPrevious": "Selecione Caractere Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"selectCharNext": "Selecionar o Próximo Caractere", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageUp": "Selecionar Página para Cima", //$NON-NLS-1$ //$NON-NLS-0$
	"selectPageDown": "Selecionar Página para Baixo", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordPrevious": "Selecionar Palavra Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"selectWordNext": "Selecionar Próxima Palavra", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextStart": "Selecionar Início do Documento", //$NON-NLS-1$ //$NON-NLS-0$
	"selectTextEnd": "Selecione Fim do Documento", //$NON-NLS-1$ //$NON-NLS-0$

	"deletePrevious": "Excluir Caractere Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteNext": "Excluir Próxima Caractere", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordPrevious": "Excluir Palavra Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteWordNext": "Excluir Próxima Palavra", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineStart": "Excluir Início da Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLineEnd": "Excluir Fim da Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"tab": "Guia Inserir", //$NON-NLS-1$ //$NON-NLS-0$
	"enter": "Inserir Delimitador de Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"enterNoCursor": "Inserir Delimitador de Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"selectAll": "Selecionar Todos", //$NON-NLS-1$ //$NON-NLS-0$
	"copy": "Copiar", //$NON-NLS-1$ //$NON-NLS-0$
	"cut": "Recortar", //$NON-NLS-1$ //$NON-NLS-0$
	"paste": "Colar", //$NON-NLS-1$ //$NON-NLS-0$
	
	"uppercase": "Para Maiúscula", //$NON-NLS-1$ //$NON-NLS-0$
	"lowercase": "Para Minúscula", //$NON-NLS-1$ //$NON-NLS-0$
	"capitalize": "Colocar em Maiúsculas", //$NON-NLS-1$ //$NON-NLS-0$
	"reversecase" : "Caso Reverso", //$NON-NLS-1$ //$NON-NLS-0$
	
	"toggleWrapMode": "Comutar Modo Quebra", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleTabMode": "Comutar Modo de Tabulação", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleOverwriteMode": "Comutar Modo Sobrescrever", //$NON-NLS-1$ //$NON-NLS-0$
	
	"committerOnTime": "${0}  em ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//Emacs
	"emacs": "Emacs", //$NON-NLS-1$ //$NON-NLS-0$
	"exchangeMarkPoint": "Trocar Marca e Ponto", //$NON-NLS-1$ //$NON-NLS-0$
	"setMarkCommand": "Configurar Marca", //$NON-NLS-1$ //$NON-NLS-0$
	"clearMark": "Limpar Marca", //$NON-NLS-1$ //$NON-NLS-0$
	"digitArgument": "Argumento de Dígito ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"negativeArgument": "Argumento Negativo", //$NON-NLS-1$ //$NON-NLS-0$
			
	"Comment": "Comentários", //$NON-NLS-1$ //$NON-NLS-0$
	"Flat outline": "Estrutura de tópicos simples", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStr": "Localização incremental: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindStrNotFound": "Localização incremental: ${0} (não localizado)", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStr": "Localização incremental reversa: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverseStrNotFound": "Localização incremental reversa: ${0} (não localizada)", //$NON-NLS-1$ //$NON-NLS-0$
	"find": "Localizar...", //$NON-NLS-1$ //$NON-NLS-0$
	"undo": "Desfazer", //$NON-NLS-1$ //$NON-NLS-0$
	"redo": "Refazer", //$NON-NLS-1$ //$NON-NLS-0$
	"cancelMode": "Cancelar Modo Atual", //$NON-NLS-1$ //$NON-NLS-0$
	"findNext": "Localizar Próxima Ocorrência", //$NON-NLS-1$ //$NON-NLS-0$
	"findPrevious": "Localizar Ocorrência Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFind": "Local Incremental", //$NON-NLS-1$ //$NON-NLS-0$
	"incrementalFindReverse": "Localização Incremental Reversa", //$NON-NLS-1$ //$NON-NLS-0$
	"indentLines": "Linhas Indentadas", //$NON-NLS-1$ //$NON-NLS-0$
	"unindentLines": "Linhas Não Indentadas", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesUp": "Mover Linhas para Cima", //$NON-NLS-1$ //$NON-NLS-0$
	"moveLinesDown": "Mover Linhas para Baixo", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesUp": "Copiar Linhas Acima", //$NON-NLS-1$ //$NON-NLS-0$
	"copyLinesDown": "Copiar Linhas Abaixo", //$NON-NLS-1$ //$NON-NLS-0$
	"deleteLines": "Excluir Linhas", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "Acessar a Linha...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompty": "Acessar a Linha:", //$NON-NLS-1$ //$NON-NLS-0$
	"nextAnnotation": "Próxima Anotação", //$NON-NLS-1$ //$NON-NLS-0$
	"prevAnnotation": "Anotação Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"expand": "Expandir", //$NON-NLS-1$ //$NON-NLS-0$
	"collapse": "Reduzir", //$NON-NLS-1$ //$NON-NLS-0$
	"expandAll": "Expandir Tudo", //$NON-NLS-1$ //$NON-NLS-0$
	"collapseAll": "Reduzir Tudo", //$NON-NLS-1$ //$NON-NLS-0$
	"lastEdit": "Último Local de Edição", //$NON-NLS-1$ //$NON-NLS-0$
	"trimTrailingWhitespaces": "Cortar espaços em branco à direita", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleLineComment": "Alternar Comentário da Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"addBlockComment": "Incluir Comentário de Bloco", //$NON-NLS-1$ //$NON-NLS-0$
	"removeBlockComment": "Remover Comentário de Bloco", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeEntered": "Modo Vinculado inserido", //$NON-NLS-1$ //$NON-NLS-0$
	"linkedModeExited": "Saída do Modo Vinculado", //$NON-NLS-1$ //$NON-NLS-0$
	"syntaxError": "Erro de Sintaxe", //$NON-NLS-1$ //$NON-NLS-0$
	"contentAssist": "Assistente de Conteúdo", //$NON-NLS-1$ //$NON-NLS-0$
	"lineColumn": "Linha ${0} : Col ${1}", //$NON-NLS-1$ //$NON-NLS-0$
	
	//vi
	"vi": "vi", //$NON-NLS-1$ //$NON-NLS-0$
	"vimove": "(Mover)", //$NON-NLS-1$ //$NON-NLS-0$
	"viyank": "(Yank)", //$NON-NLS-1$ //$NON-NLS-0$
	"videlete": "(Excluir)", //$NON-NLS-1$ //$NON-NLS-0$
	"vichange": "(Alterar)", //$NON-NLS-1$ //$NON-NLS-0$
	"viLeft": "${0} Esquerda", //$NON-NLS-1$ //$NON-NLS-0$
	"viRight": "${0} Direita", //$NON-NLS-1$ //$NON-NLS-0$
	"viUp": "${0} Acima", //$NON-NLS-1$ //$NON-NLS-0$
	"viDown": "${0} Abaixo", //$NON-NLS-1$ //$NON-NLS-0$
	"viw": "${0} Próxima Palavra", //$NON-NLS-1$ //$NON-NLS-0$
	"vib": "${0} Início da Palavra", //$NON-NLS-1$ //$NON-NLS-0$
	"viW": "${0} Próxima Palavra (ws pare)", //$NON-NLS-1$ //$NON-NLS-0$
	"viB": "${0} Início da Palavra (ws pare)", //$NON-NLS-1$ //$NON-NLS-0$
	"vie": "${0} Término da Palavra", //$NON-NLS-1$ //$NON-NLS-0$
	"viE": "${0} Término da Palavra (ws pare)", //$NON-NLS-1$ //$NON-NLS-0$
	"vi$": "${0} Fim da Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"vi^_": "${0} Primeira Linha Atual de Caractere não vazia", //$NON-NLS-1$ //$NON-NLS-0$
	"vi+": "${0} Primeira Linha de Próximo Caractere", //$NON-NLS-1$ //$NON-NLS-0$
	"vi-": "${0} Primeira Linha de Caractere Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"vi|": "${0} Coluna nth em Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"viH": "${0} Parte Superior da Página", //$NON-NLS-1$ //$NON-NLS-0$
	"viM": "${0} Meio da Página", //$NON-NLS-1$ //$NON-NLS-0$
	"viL": "${0} Parte Inferior da Página", //$NON-NLS-1$ //$NON-NLS-0$
	"vi/": "${0} Encaminhamento de Procura", //$NON-NLS-1$ //$NON-NLS-0$
	"vi?": "${0} Procurar Atrás", //$NON-NLS-1$ //$NON-NLS-0$
	"vin": "${0} Próxima Procura", //$NON-NLS-1$ //$NON-NLS-0$
	"viN": "${0} Procura Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"vif": "${0} Procurar Caractere Fwd", //$NON-NLS-1$ //$NON-NLS-0$
	"viF": "${0} Procurar Caracter Bckwd", //$NON-NLS-1$ //$NON-NLS-0$
	"vit": "${0} Procurar Caractere Fwd Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"viT": "${0} Procurar Caracter Bckwd Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"vi,": "${0} Repetir Procura de Caractere Reversa", //$NON-NLS-1$ //$NON-NLS-0$
	"vi;": "${0} Repetir Procura de Caractere", //$NON-NLS-1$ //$NON-NLS-0$
	"viG": "${0} Ir para Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"viycd": "${0} Linha Atual", //$NON-NLS-1$ //$NON-NLS-0$
	"via": "Anexar Cursor Posterior", //$NON-NLS-1$ //$NON-NLS-0$
	"viA": "Anexar ao Término da Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"vii": "Inserir Cursor Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"viI": "Inserir no Começo de Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"viO": "Inserir Linha Acima", //$NON-NLS-1$ //$NON-NLS-0$
	"vio": "Inserir Linha Abaixo", //$NON-NLS-1$ //$NON-NLS-0$
	"viR": "Iniciar Texto de Sobrescrição", //$NON-NLS-1$ //$NON-NLS-0$
	"vis": "Substituir um Caractere", //$NON-NLS-1$ //$NON-NLS-0$
	"viS": "Substituir Linha Inteira", //$NON-NLS-1$ //$NON-NLS-0$
	"viC": "Alterar Texto até o Fim da Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"vip": "Colar após Caractere ou Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"viP": "Colar antes de Caractere ou Linha", //$NON-NLS-1$ //$NON-NLS-0$
	"viStar": "Procurar palavra sob o cursor", //$NON-NLS-1$ //$NON-NLS-0$
	
	"next": "Próximo", //$NON-NLS-1$ //$NON-NLS-0$
	"previous": "Anterior", //$NON-NLS-1$ //$NON-NLS-0$
	"replace": "Substituir", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceAll": "Substituir Tudo", //$NON-NLS-1$ //$NON-NLS-0$
	"findWith": "Localizar Com", //$NON-NLS-1$ //$NON-NLS-0$
	"replaceWith": "Substituir por", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitive": "Aa", //$NON-NLS-1$ //$NON-NLS-0$
	"regex": "/.*/", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWord": "\\b", //$NON-NLS-1$ //$NON-NLS-0$
	"caseInsensitiveTooltip": "Alternar sem distinção entre maiúsculas e minúsculas", //$NON-NLS-1$ //$NON-NLS-0$
	"regexTooltip": "Alternar expressão regular", //$NON-NLS-1$ //$NON-NLS-0$
	"wholeWordTooltip": "Alternar palavra inteira", //$NON-NLS-1$ //$NON-NLS-0$
	"closeTooltip": "Fechar", //$NON-NLS-1$ //$NON-NLS-0$

	"replacingAll": "Substituindo tudo...", //$NON-NLS-1$ //$NON-NLS-0$
	"replacedMatches": "Substituídas ${0} correspondências", //$NON-NLS-1$ //$NON-NLS-0$
	"nothingReplaced": "Nada substituído", //$NON-NLS-1$ //$NON-NLS-0$
	"notFound": "Não localizado" //$NON-NLS-1$ //$NON-NLS-0$
});

