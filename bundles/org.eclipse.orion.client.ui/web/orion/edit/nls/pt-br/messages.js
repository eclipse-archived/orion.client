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
	"Editor": "Editor", //$NON-NLS-1$ //$NON-NLS-0$
	"switchEditor": "Alternar editor", //$NON-NLS-1$ //$NON-NLS-0$
	"Fetching": "Buscando: ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"confirmUnsavedChanges": "Há mudanças não salvas. Ainda deseja sair?", //$NON-NLS-1$ //$NON-NLS-0$
	"searchFiles": "Procura rápida...", //$NON-NLS-1$ //$NON-NLS-0$
	"searchTerm": "Inserir termo da procura:", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedChanges": "Há mudanças não salvas.", //$NON-NLS-1$ //$NON-NLS-0$
	"unsavedAutoSaveChanges": "Permaneça na página até que o Salvamento automático seja concluído.", //$NON-NLS-1$ //$NON-NLS-0$
	"Save": "Salvar", //$NON-NLS-1$ //$NON-NLS-0$
	"Saved": "Salvo", //$NON-NLS-1$ //$NON-NLS-0$
	"Blame": "Defeito", //$NON-NLS-1$ //$NON-NLS-0$
	"BlameTooltip":"Mostrar anotações de defeito", //$NON-NLS-1$ //$NON-NLS-0$
	"saveOutOfSync": "O recurso está fora de sincronização com o servidor. Deseja salvá-la de qualquer maneira?", //$NON-NLS-1$ //$NON-NLS-0$
	"loadOutOfSync": "O recurso está fora de sincronização com o servidor. Deseja carregá-lo de qualquer maneira? Isso sobrescreverá suas mudanças locais.", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadata": "Lendo metadados de ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"ReadingMetadataError": "Não é possível obter metadados de ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"Reading": "Lendo ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"readonly": "Somente leitura.", //$NON-NLS-1$ //$NON-NLS-0$
	"saveFile": "Salvar este arquivo", //$NON-NLS-1$ //$NON-NLS-0$
	"toggleZoomRuler": "Alternar régua de zoom", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLine": "Acessar linha...", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLineTooltip": "Acessar número de linha especificado", //$NON-NLS-1$ //$NON-NLS-0$
	"gotoLinePrompt": "Acessar linha:", //$NON-NLS-1$ //$NON-NLS-0$
	"Undo": "Desfazer", //$NON-NLS-1$ //$NON-NLS-0$
	"Redo": "Refazer", //$NON-NLS-1$ //$NON-NLS-0$
	"Find": "Localizar...", //$NON-NLS-1$ //$NON-NLS-0$
	"noResponse": "Nenhuma resposta do servidor. Verifique sua conexão de Internet e tente novamente.", //$NON-NLS-1$ //$NON-NLS-0$
	"savingFile": "Salvando arquivo ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"running": "Executando ${0}", //$NON-NLS-1$ //$NON-NLS-0$
	"Saving..." : "Salvando...", //$NON-NLS-1$ //$NON-NLS-0$
	"View": "Visualização", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanel": "Painel Lateral", //$NON-NLS-1$ //$NON-NLS-0$
	"SidePanelTooltip": "Escolha o que mostrar no painel lateral.", //$NON-NLS-1$ //$NON-NLS-0$
	"Slideout": "Deslizamento", //$NON-NLS-1$ //$NON-NLS-0$
	"Actions": "Ações", //$NON-NLS-1$ //$NON-NLS-0$
	"Navigator": "Navegador", //$NON-NLS-1$ //$NON-NLS-0$
	"FolderNavigator": "Navegador de pastas", //$NON-NLS-1$ //$NON-NLS-0$
	"Project": "Projeto", //$NON-NLS-1$ //$NON-NLS-0$
	"New": "Novo(a)", //$NON-NLS-1$ //$NON-NLS-0$
	"File": "Arquivo", //$NON-NLS-1$ //$NON-NLS-0$
	"Edit": "Editar", //$NON-NLS-1$ //$NON-NLS-0$
	"Tools": "Ferramentas", //$NON-NLS-1$ //$NON-NLS-0$
	"Add": "Incluir", //$NON-NLS-1$ //$NON-NLS-0$
	"noActions": "Não há ações para a seleção atual.", //$NON-NLS-1$ //$NON-NLS-0$
	"NoFile": "Utilize o ${0} para criar novos arquivos e pastas. Clique em um arquivo para iniciar a codificação.", //$NON-NLS-1$ //$NON-NLS-0$
	"LocalEditorSettings": "Configurações do Editor Local", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProject": "${0} não é um projeto. Para convertê-lo em um projeto, use ${1}.", //$NON-NLS-1$ //$NON-NLS-0$
	"NoProjects": "Não há projetos na área de trabalho. Use o menu ${0} para criar projetos.", //$NON-NLS-1$ //$NON-NLS-0$
	"Disconnected": "${0} (desconectado)", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFS": "Escolher sistema de arquivos", //$NON-NLS-1$ //$NON-NLS-0$
	"ChooseFSTooltip": "Escolha o sistema de arquivos que deseja visualizar.", //$NON-NLS-1$ //$NON-NLS-0$
	"FSTitle": "${0} (${1})", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy": "Implementar", //$NON-NLS-1$ //$NON-NLS-0$
	"Deploy As": "Implementar como", //$NON-NLS-1$ //$NON-NLS-0$
	"Import": "Importar", //$NON-NLS-1$ //$NON-NLS-0$
	"Export": "Exportar", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenWith": "Abrir com", //$NON-NLS-1$ //$NON-NLS-0$
	"OpenRelated": "Abrir relacionado", //$NON-NLS-1$ //$NON-NLS-0$
	"Dependency": "Dependência", //$NON-NLS-1$ //$NON-NLS-0$
	"UnnamedCommand": "Não Denominado", //$NON-NLS-1$ //$NON-NLS-0$
	"searchInFolder": "Procurar na pasta...",  //$NON-NLS-1$ //$NON-NLS-0$
	"Global Search": "Procura global...", //$NON-NLS-1$ //$NON-NLS-0$
	"ClickEditLabel": "Clique para editar", //$NON-NLS-1$ //$NON-NLS-0$
	"ProjectInfo": "Informações sobre o Projeto", //$NON-NLS-1$ //$NON-NLS-0$
	"DeployInfo": "Informações de implementação", //$NON-NLS-1$ //$NON-NLS-0$
	"Name": "Nome", //$NON-NLS-1$ //$NON-NLS-0$
	"Description": "Descrição", //$NON-NLS-1$ //$NON-NLS-0$
	"Site": "Site", //$NON-NLS-1$ //$NON-NLS-0$
	'projectsSectionTitle': 'Projetos',  //$NON-NLS-0$  //$NON-NLS-1$
	'listingProjects': 'Listando projetos...',  //$NON-NLS-0$  //$NON-NLS-1$
	'gettingWorkspaceInfo': 'Obtendo informações da área de trabalho...',  //$NON-NLS-0$  //$NON-NLS-1$
	"showProblems": "Mostrar problemas...",  //$NON-NLS-1$ //$NON-NLS-0$
});

