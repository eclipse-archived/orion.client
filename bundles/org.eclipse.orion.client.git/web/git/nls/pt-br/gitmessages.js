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
	"Compare": "Comparação", //$NON-NLS-0$  //$NON-NLS-1$
	"View the side-by-side compare": "Visualizar a comparação lado a lado", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirVer": "Abrir diretório ativo", //$NON-NLS-0$  //$NON-NLS-1$
	"Working Directory": "Diretório de Trabalho", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewWorkingDirVer": "Visualizar a versão do diretório ativo do arquivo", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading...": "Carregando...", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories": "Todos os repositórios Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repo": "Repositórios", //$NON-NLS-0$  //$NON-NLS-1$
	"0 on 1 - Git": "${0} em ${1} - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Git": "Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in eclipse.org": "Mostrar no eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in GitHub": "Mostrar no GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in GitHub": "Mostrar esse repositório em GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit Details": "Detalhes de Confirmação", //$NON-NLS-0$  //$NON-NLS-1$
	"No Commits": "Sem Confirmação", //$NON-NLS-0$  //$NON-NLS-1$
	"commit: 0": "confirmação: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"parent: 0": "pai: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"authored by 0 (1) on 2": "de autoria de ${0} <${1}> em ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"committed by 0 (1)": "confirmado por ${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"committedby": "confirmado por ", //$NON-NLS-0$  //$NON-NLS-1$
	"authoredby": "autoria de ", //$NON-NLS-0$  //$NON-NLS-1$
	"on": " em ", //$NON-NLS-0$  //$NON-NLS-1$
	"nameEmail": "${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags:": "Tags:", //$NON-NLS-0$  //$NON-NLS-1$
	"No Tags": "Nenhum Tag", //$NON-NLS-0$  //$NON-NLS-1$
	"Diffs": "Mudanças", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirChanges": "Mudanças no diretório ativo", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChanges": "Confirmar Mudanças", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChangesDialog": "Confirmar Mudanças", //$NON-NLS-0$  //$NON-NLS-1$
	"more": "mais ...", //$NON-NLS-0$  //$NON-NLS-1$
	"less": "menos ...", //$NON-NLS-0$  //$NON-NLS-1$
	"More": "Mais", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFiles" : "Mais Arquivos", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFilesProgress": "Carregando mais arquivos...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommits": "Mais confirmações para \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommitsProgress": "Carregando mais confirmações para \"${0}\"...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranches": "Mais ramificações para \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranchesProgress": "Carregando mais ramificações para \"${0}\"...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTags": "Mais tags", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTagsProgress": "Carregando mais tags...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashes": "Mais armazenamentos em arquivo stash", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashesProgress": "Carregando mais armazenamentos em arquivo stash...", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading git log...": "Carregando o log git...", //$NON-NLS-0$  //$NON-NLS-1$
	"local": "local", //$NON-NLS-0$  //$NON-NLS-1$
	"remote": "remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"View All": "Exibir Tudo", //$NON-NLS-0$  //$NON-NLS-1$
	"Error ${0}: ": "Erro ${0}: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading ": "Carregando ", //$NON-NLS-0$  //$NON-NLS-1$
	"Message": "Mensagem", //$NON-NLS-0$  //$NON-NLS-1$
	"Author": "Autor", //$NON-NLS-0$  //$NON-NLS-1$
	"Date": "Data", //$NON-NLS-0$  //$NON-NLS-1$
	"fromDate:": "Data de Início:", //$NON-NLS-0$  //$NON-NLS-1$
	"toDate:": "Data de Encerramento:", //$NON-NLS-0$  //$NON-NLS-1$
	"Actions": "Ações", //$NON-NLS-0$  //$NON-NLS-1$
	"Branches": "Ramificações", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags": "Tags", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage": "Colocar em ambiente Temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged removal": "Remoção feita fora de ambiente temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage": "Remover de ambiente temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged removal": "Remoção feita em ambiente temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged change": "Mudança feita fora de ambiente temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged change": "Mudança feita em ambiente temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged add": "Inclusão feita fora de espaço temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged add": "Inclusão feita em ambiente temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Addition": "Adição", //$NON-NLS-0$  //$NON-NLS-1$
	"Deletion": "Exclusão", //$NON-NLS-0$  //$NON-NLS-1$
	"Resolve Conflict": "Resolver Conflito", //$NON-NLS-0$  //$NON-NLS-1$
	"Conflicting": "Em Conflito", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message": "Confirmar mensagem", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit": "Confirmar", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitTooltip": "Confirme os arquivos selecionados com a mensagem fornecida.", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthMsgLink":"Autenticação requerida para: ${0}. <a target=\"_blank\" href=\"${1}\">${2}</a> e tente a solicitação novamente. </span>", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCommit": "Insira a mensagem de confirmação", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCountCommit": "Confirmar ${0} arquivo(s)", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend last commit": "Aditar última confirmação", //$NON-NLS-0$  //$NON-NLS-1$
	" Amend": " Aditar", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress. Choose action:": "Criação de nova base em andamento. Escolher ação:", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgress": "Rebaseamento em progresso", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseTip": "Rebaseie suas confirmações removendo-as da ramificação ativa, iniciando a ramificação ativa novamente com base no estado mais recente de \"${0}\" e aplicando cada confirmação novamente à ramificação ativa atualizada.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebasingRepo": "Rebaseando o repositório git", //$NON-NLS-0$  //$NON-NLS-1$
	"AddingConfig": "Incluindo a propriedade de configuração do git: chave=${0} valor=${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"EditingConfig": "Editando a propriedade de configuração do git: chave=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"DeletingConfig": "Excluindo a propriedade de configuração do git: chave=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"AddClone": "Clonando o repositório: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgressDetails": "Rebaseando a ramificação.\n\n\tUse Continuar depois de mesclar os conflitos e selecionar todos os arquivos;\n\tIgnore para efetuar bypass da correção atual;\n\tInterrompa para terminar a criação de nova base a qualquer momento.", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer name:": "Nome do Committer:", //$NON-NLS-0$  //$NON-NLS-1$
	"Name:": "Nome:", //$NON-NLS-0$  //$NON-NLS-1$
	"email:": "e-mail:", //$NON-NLS-0$  //$NON-NLS-1$
	"Email:": "E-mail:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author name: ": "Nome do autor: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged": "Fora de Ambiente Temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged": "Em Ambiente Temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangedFiles": "Arquivos alterados", //$NON-NLS-0$  //$NON-NLS-1$
	"Recent commits on": "Confirmações recentes sobre", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status": "Status de Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Status": "Abra a página de status do Git para o repositório que contém este arquivo ou pasta.", //$NON-NLS-0$  //$NON-NLS-1$
	"GetGitIncomingMsg": "Obtendo mudanças do git recebido...", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout": "Check-out", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out...": "Fazendo check-out...", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage the change": "Fazer mudança em ambiente temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging...": "Configurando...", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutSelectedFiles": "Efetuar check-out em todos os arquivos selecionados, descartando todas as mudanças", //$NON-NLS-0$  //$NON-NLS-1$
	"AddFilesToGitignore" : "Inclua todos os arquivos selecionados no(s) arquivo(s) .gitignore", //$NON-NLS-0$  //$NON-NLS-1$
	"Writing .gitignore rules" : "Gravando regras .gitignore", //$NON-NLS-0$  //$NON-NLS-1$ 
	"Save Patch": "Salvar Correção", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage the change": "Remover mudanças de ambiente temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaging...": "Não configurando...", //$NON-NLS-0$  //$NON-NLS-1$
	"Undo": "Desfazer", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoTooltip": "Reverta esta confirmação, mantendo todos os arquivos alterados e não fazendo qualquer mudança no diretório ativo.", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoConfirm": "O conteúdo de sua ramificação ativa será substituído pela confirmação \"${0}\". Todas as mudanças na confirmação e no diretório ativo serão mantidas. Tem certeza?", //$NON-NLS-0$  //$NON-NLS-1$
	"Reset": "Reconfigurar", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetConfirm": "Todas as mudanças estagiadas e não estagiadas no diretório ativo e no índice serão descartadas e não poderão ser recuperadas.\n\nTem certeza de que deseja continuar?", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutConfirm" : "Suas mudanças nos arquivos selecionados serão descartadas e não poderão ser recuperadas.\n\nTem certeza que deseja continuar?", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetBranchDiscardChanges": "Reconfigurar a ramificação, descartando todas as mudanças em ambiente temporário e fora de ambiente temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesIndexDiscardedMsg": "Todas as mudanças em ambiente temporário e fora de ambiente temporário no diretório ativo e no índice serão descartadas e não poderão ser recuperadas.", //$NON-NLS-0$  //$NON-NLS-1$
	"ContinueMsg": "Tem certeza que deseja continuar?", //$NON-NLS-0$  //$NON-NLS-1$
	"KeepWorkDir" : "Manter diretório ativo", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes...": "Reconfigurando mudanças locais...", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue rebase...": "Continuar a criação de nova base...", //$NON-NLS-0$  //$NON-NLS-1$
	"Skipping patch...": "Ignorando correção...", //$NON-NLS-0$  //$NON-NLS-1$
	"Aborting rebase...": "Interrompendo criação de nova base...", //$NON-NLS-0$  //$NON-NLS-1$
	"Complete log": "Concluir log", //$NON-NLS-0$  //$NON-NLS-1$
	"local VS index": "índice VS local", //$NON-NLS-0$  //$NON-NLS-1$
	"index VS HEAD": "índice VS HEAD", //$NON-NLS-0$  //$NON-NLS-1$
	"Compare(${0} : ${1})": "Comparar (${0} : ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading status...": "Carregando status...", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing...": "Confirmando...", //$NON-NLS-0$  //$NON-NLS-1$
	"The author name is required.": "O nome do autor é necessário.", //$NON-NLS-0$  //$NON-NLS-1$
	"The author mail is required.": "O correio do autor necessário.", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoConflict": ". O repositório ainda contém conflitos.", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoUnmergedPathResolveConflict": ". O repositório contém caminhos não mesclados. Resolva os conflitos primeiro.", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering ${0}": "Renderização ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Configuration": "Configuração", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting configuration of": "Obtendo a configuração de ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting git repository details": "Obtendo detalhes do repositório git", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting changes": "Obtendo mudanças", //$NON-NLS-0$  //$NON-NLS-1$
	" - Git": " - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories - Git": "Repositórios - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository": "Repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository Not Found": "Repositório Não Localizado", //$NON-NLS-0$  //$NON-NLS-1$
	"No Repositories": "Nenhum Repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repository": "Carregando repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repositories": "Carregando repositórios", //$NON-NLS-0$  //$NON-NLS-1$
	"(no remote)": "(nenhum remoto)", //$NON-NLS-0$  //$NON-NLS-1$
	"location: ": "local: ", //$NON-NLS-0$  //$NON-NLS-1$
	"NumFilesStageAndCommit": "${0} arquivo(s) a ser(em) colocado(s) em ambiente temporário e ${1} arquivo(s) a ser(em) confirmado(s).", //$NON-NLS-0$  //$NON-NLS-1$
 	"Nothing to commit.": "Nada a ser confirmado.", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing to push.": "Nada a ser enviado por push.", //$NON-NLS-0$  //$NON-NLS-1$
	"NCommitsToPush": "${0} confirmação(ões) a ser(em) enviada(s) por push.", //$NON-NLS-0$  //$NON-NLS-1$
	"You have no changes to commit.": "Você não possui mudanças a serem confirmadas.", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress!": "Criação de nova base em andamento!", //$NON-NLS-0$  //$NON-NLS-1$
	"View all local and remote tracking branches": "Visualizar todas as ramificações de rastreamento local e remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"tracksNoBranch": "não controla nenhuma ramificação", //$NON-NLS-0$  //$NON-NLS-1$
	"tracks": "controla ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"last modified ${0} by ${1}": "última modificação ${0} por ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remote Branches": "Nenhuma Ramificação Remota", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering branches": "Ramificações de renderização", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits": "Confirmações", //$NON-NLS-0$  //$NON-NLS-1$
	"GettingCurrentBranch": "Obtendo ramificação atual para ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Log": "Consultar Log Integral", //$NON-NLS-0$  //$NON-NLS-1$
	"See the full log": "Consulte o log integral", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting commits for \"${0}\" branch": "Obtendo confirmações para a ramificação \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering commits": "Confirmações de renderização", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting outgoing commits": "Obtendo confirmações de saída", //$NON-NLS-0$  //$NON-NLS-1$
	"The branch is up to date.": "A ramificação está atualizada.", //$NON-NLS-0$  //$NON-NLS-1$
	"NoOutgoingIncomingCommits": "Você não possui nenhuma confirmação de saída ou recebida.", //$NON-NLS-0$  //$NON-NLS-1$
 	") by ": ") por ", //$NON-NLS-0$  //$NON-NLS-1$
	" (SHA ": " (SHA ", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting tags": "Obtendo tags", //$NON-NLS-0$  //$NON-NLS-1$
	"View all tags": "Visualizar todas as tags", //$NON-NLS-0$  //$NON-NLS-1$
	" on ": " em ", //$NON-NLS-0$  //$NON-NLS-1$
	" by ": " por ", //$NON-NLS-0$  //$NON-NLS-1$
	"Remotes": "Remotos", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering remotes": "Remotos de Renderização", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remotes": "Nenhum Remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged addition": "Adição fora de ambiente temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged addition": "Adição feita em ambiente temporário", //$NON-NLS-0$  //$NON-NLS-1$
	" (Rebase in Progress)": " (Criação de Nova Base em Andamento)", //$NON-NLS-0$  //$NON-NLS-1$
	"Status": "Status", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0)": "Log (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0) - 1": "Log (${0}) - ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Status for ${0} - Git ": "Status para ${0} - Git ", //$NON-NLS-0$  //$NON-NLS-1$
	"No Unstaged Changes": "Nenhuma Mudança Feita em Ambiente Temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"No Staged Changes": "Nenhuma Mudança em Ambiente Temporário", //$NON-NLS-0$  //$NON-NLS-1$
	"Changes for \"${0}\" branch": "Mudanças para ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch": "Confirmações para ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch against": "Confirmações para a ramificação \"${0}\" com relação a", //$NON-NLS-0$  //$NON-NLS-1$
	"Add Remote": "Incluir Remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Name:": "Nome do Remoto:", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote URI:": "URI do Remoto:", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply Patch": "Aplicar Correção", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyPatchDialog": "Aplicar Correção", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Repository": "Repositório Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the git repository": "Abra a página Repositório Git para este arquivo ou pasta.", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Git Repository": "Clonar Repositório Git", //$NON-NLS-0$  //$NON-NLS-1$
	"CloneGitRepositoryDialog": "Clonar Repositório Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository URL:": "URL do Repositório:", //$NON-NLS-0$  //$NON-NLS-1$
	"Existing directory:": "Diretório existente:", //$NON-NLS-0$  //$NON-NLS-1$
	"New folder:": "Nova pasta:", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseFolderDialog": "Escolher uma Pasta", //$NON-NLS-0$  //$NON-NLS-1$
	"Message:": "Mensagem :", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend:": "Aditar:", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartAmend": "Aditar confirmação anterior", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangeId:": "ChangeId:", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartChangeId": "Incluir ID de mudança na mensagem", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Name:": "Nome do Confirmador:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Email:": "E-mail do Confirmador:", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorNamePlaceholder": "Inserir nome do autor", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorEmailPlaceholder": "Inserir e-mail do autor", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterNamePlaceholder": "Inserir nome do confirmador", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterEmailPlaceholder": "Inserir e-mail do confirmador", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Name:": "Nome do Autor:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Email:": "E-mail do Autor:", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit message is required.": "A mensagem de confirmação é necessária.", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Credentials": "Credenciais de Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Username:": "Nome do usuário:", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key:": "Chave Privada:", //$NON-NLS-0$  //$NON-NLS-1$
	"Passphrase (optional):": "Passphrase (opcional):", //$NON-NLS-0$  //$NON-NLS-1$
	"commit:": "confirmação: ", //$NON-NLS-0$  //$NON-NLS-1$
	"parent:": "pai: ", //$NON-NLS-0$  //$NON-NLS-1$
	"branches: ": "ramificações: ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags: ": "Tags: ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags": "tags", //$NON-NLS-0$  //$NON-NLS-1$
	" authored by ${0} {${1}) on ${2}": " de autoria de ${0} (${1}) em ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"Content": "Conteúdo", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to ${0} section": "Acessar seção ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Type the commit name (sha1):": "Digitar o nome de confirmação (sha1):", //$NON-NLS-0$  //$NON-NLS-1$
	"Search": "Pesquisar", //$NON-NLS-0$  //$NON-NLS-1$
	"Searching...": "Procurando...", //$NON-NLS-0$  //$NON-NLS-1$
	"SelectAll": "Selecionar Todos", //$NON-NLS-0$  //$NON-NLS-1$
	"Looking for the commit": "Procurando a confirmação", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch:": "Nova ramificação:", //$NON-NLS-0$  //$NON-NLS-1$
	"No remote selected": "Nenhum remoto selecionado", //$NON-NLS-0$  //$NON-NLS-1$
	"Enter a name...": "Inserir um nome...", //$NON-NLS-0$  //$NON-NLS-1$
	"OK": "OK", //$NON-NLS-0$  //$NON-NLS-1$
	"Cancel": "Cancelar", //$NON-NLS-0$  //$NON-NLS-1$
	"Clear": "Limpar", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter": "Filtro", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommits": "Filtrar confirmações", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommitsTip": "Alterna o painel de confirmações de filtro", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeCmd": "Maximizar", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeTip": "Alterna o estado maximizar do editor", //$NON-NLS-0$  //$NON-NLS-1$
	" [New branch]": " [Nova ramificação]", //$NON-NLS-0$  //$NON-NLS-1$
	"AddKeyToHostContinueOp": "Deseja incluir a chave ${0} no host ${1} para continuar a operação? A chave fingerpt é ${2}.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Link Repository": "Repositório de Link", //$NON-NLS-0$  //$NON-NLS-1$
	"Folder name:": "Nome da Pasta:", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository was linked to ": "O repositório foi vinculado a ", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutCommitTooltip": "Efetue check-out dessa confirmação, criando uma ramificação local com base em seu conteúdo.", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutTagTooltip": "Efetue check-out dessa tag, criando uma ramificação local com base em seu conteúdo.", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out ${0}": "Efetuando check-out de ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutBranchMsg": "Efetue check-out da ramificação ou da ramificação local correspondente e torne-a ativa. Se a ramificação de rastreamento remoto não tiver uma ramificação local correspondente, a ramificação local será criada primeiro.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Checking out branch...": "Efetuando check-out da ramificação", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding branch ${0}...": "Incluindo a ramificação ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing branch ${0}...": "Removendo a ramificação ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding remote ${0}...": "Incluindo ${0} remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote ${0}...": "Removendo ${0} remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing repository ${0}": "Removendo o repositório ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding tag {$0}": "Incluindo a tag {$0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing tag {$0}": "Removendo a tag {$0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Merging ${0}": "Mesclando ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	'Unstaging changes' : 'Removendo estágio de mudanças', //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out branch ${0}...": "Efetuando check-out da ramificação ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch checked out.": "Ramificação com check-out efetuado.", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch": "Nova Ramificação", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new local branch to the repository": "Incluir uma nova ramificação local no repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch name": "Nome da ramificação", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete": "Excluir", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the local branch from the repository": "Excluir a ramificação local do repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"DelBrConfirm": "Tem certeza de que deseja excluir a ramificação ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote tracking branch from the repository": "Excluir a ramificação de rastreamento remoto do repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure?": "Tem certeza?", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoveRemoteBranchConfirm": "Você excluirá a ramificação remota \"${0}\" e enviará a mudança por push.\n\nTem certeza?", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote branch: ": "Removendo a ramificação remota: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete Remote Branch": "Excluir Ramificação Remota", //$NON-NLS-0$  //$NON-NLS-1$
	"New Remote": "Novo Remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Remote": "Remoto de Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Remote": "Abra a página de log de Git remoto para este arquivo ou pasta.", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new remote to the repository": "Incluir um novo remoto no repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote from the repository": "Excluir o remoto do repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete remote ${0}?": "Tem certeza de que deseja excluir o ${0} remoto?", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull": "Pull", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull from the repository": "Efetuar pull do repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Pulling: ": "Efetuando pull: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull Git Repository": "Efetuar Pull do Repositório Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Log": "Log Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Log": "Abra a página de log de Git local para este arquivo ou pasta.", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the branch": "Abrir o log da ramificação", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the repository": "Abrir o log do repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the status for the repository": "Abrir o status do repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditor": "Mostrar no editor", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditorTooltip": "Mostrar a pasta do repositório no editor", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareEach": "Comparar Um com o Outro", //$NON-NLS-0$  //$NON-NLS-1$
 	"Compare With Working Tree": "Comparar com a Árvore de Trabalho", //$NON-NLS-0$  //$NON-NLS-1$
	"Open": "Abrir", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenGitCommitTip": "Visualizar a árvore para esta confirmação", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitVersion": "Abrir Confirmação", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewCommitVersionTip": "Visualizar a versão confirmada do arquivo", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch": "Buscar", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote": "Buscar a partir do Remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Password:": "Senha:", //$NON-NLS-0$  //$NON-NLS-1$
	"User Name:": "Nome do Usuário:", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching remote: ": "Buscando remoto: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Fetch": "Forçar Busca", //$NON-NLS-0$  //$NON-NLS-1$
	"FetchRemoteBranch": "Buscar da ramificação remota para a ramificação de rastreamento remoto substituindo seu conteúdo atual", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentRemoteTrackingBr": "Você está substituindo o conteúdo da ramificação de rastreamento remoto. Isso pode fazer com que a ramificação perca as confirmações.", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge": "Mesclar", //$NON-NLS-0$  //$NON-NLS-1$
	"MergeContentFrmBr": "Mescle o conteúdo da ramificação para a ramificação ativa", //$NON-NLS-0$  //$NON-NLS-1$
 	". Go to ${0}.": ". Acessar ${0}.", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status page": "Página Status de Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase": "Criar Nova Base", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsMsg": "Criar a nova base das confirmações removendo-as da ramificação ativa, iniciando a ramificação ativa novamente com base no último estado da ramificação selecionada ", //$NON-NLS-0$  //$NON-NLS-1$
 	"Rebase on top of ": "Criar nova base na parte superior de ", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseSTOPPED": ". Ocorreram alguns conflitos. Resolva-os e continue, ignore a correção ou interrompa a criação de nova base.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_WRONG_REPOSITORY_STATE": ". O estado do repositório é inválido (ou seja, já durante a criação de nova base).", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_UNMERGED_PATHS": ". O repositório contém caminhos não mesclados.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_PENDING_CHANGES": ". O repositório contém mudanças pendentes. Confirme-as ou armazene-as em arquivo stash.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseUNCOMMITTED_CHANGES": ". Há mudanças não confirmadas.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsByRmvingThem": "Criar a nova base das confirmações removendo-as da ramificação ativa, ", //$NON-NLS-0$  //$NON-NLS-1$
	"StartActiveBranch": "iniciando a ramificação ativa novamente com base no último estado de '", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyEachCommitAgain": "e aplicando cada confirmação novamente à ramificação ativa atualizada.", //$NON-NLS-0$  //$NON-NLS-1$
	"Push All": "Enviar Todos por Push", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocal": "Enviar por push confirmações e tags da ramificação local para a ramificação remota", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push Branch": "Enviar ramificação por push", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushResult": "Resultado de push:", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushCommitsWithoutTags": "Enviar por push confirmações sem tags da ramificação local para a ramificação remota", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push for Review": "Enviar por push para revisão", //$NON-NLS-0$  //$NON-NLS-1$
	"Push commits to Gerrit Code Review": "Enviar por push confirmações para revisão de código Gerrit", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push Branch": "Forçar envio de ramificação por push", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsWithoutTagsOverridingCurrentContent": "Enviar por push confirmações sem tags da ramificação local para a ramificação remota substituindo seu conteúdo atual", //$NON-NLS-0$  //$NON-NLS-1$
 	"Pushing remote: ": "Pushing remoto: ", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseBranchDialog": "Escolher Ramificação", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose the remote branch.": "Escolha a ramificação remota.", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push All": "Forçar Envio por Push em Todos", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocalBr": "Enviar por push confirmações e tags da ramificação local para a ramificação remota substituindo seu conteúdo atual", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentOfRemoteBr": "Você está substituindo o conteúdo da ramificação remota. Isso pode fazer com que o repositório remoto perca as confirmações.", //$NON-NLS-0$  //$NON-NLS-1$
	"< Previous Page": "< Página Anterior", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git log": "Mostrar a página de log git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git tags" : "Mostrar a página anterior de tags de git", //$NON-NLS-0$  //$NON-NLS-1$
	"Next Page >": "Próxima Página >", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git log": "Mostrar próxima página de log git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git tags" : "Mostrar próxima página de tags de git", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the selected remote branch": "Enviar por push da ramificação local para a ramificação remota selecionada", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetActiveBr": "Reconfigure a ramificação ativa para o estado dessa referência. Descartar todas as mudanças fora e em ambiente temporário.", //$NON-NLS-0$  //$NON-NLS-1$
 	"GitResetIndexConfirm": "O conteúdo de sua ramificação ativa será substituído pela confirmação \"${0}\". Todas as mudanças estagiadas e não estagiadas serão descartadas e não poderão ser recuperadas se \"${1}\" não estiver marcado. Tem certeza?", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting index...": "Reconfigurando o índice...", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting git index for ${0}" : "Reconfigurando o índice do git para ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag": "Tag", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a tag for the commit": "Criar uma tag para a confirmação", //$NON-NLS-0$  //$NON-NLS-1$
	"ProjectSetup": "Seu projeto está sendo configurado. Isso pode demorar um tempo...", //$NON-NLS-0$  //$NON-NLS-1$
	"LookingForProject": "Procurando projeto: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag name": "Nome da Tag", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the tag from the repository": "Excluir a tag do repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete tag ${0}?": "Tem certeza de que deseja excluir a tag ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Cherry-Pick": "Escolhas mais Confortáveis", //$NON-NLS-0$  //$NON-NLS-1$
	"CherryPicking": "Confirmação das escolhas mais confortáveis: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RevertingCommit": "Revertendo a confirmação: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the change introduced by the commit to your active branch": "Aplicar a mudança apresentada pela confirmação à ramificação ativa", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing changed.": "Nada foi alterado.", //$NON-NLS-0$  //$NON-NLS-1$
	". Some conflicts occurred": ". Ocorreram alguns conflitos.", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote branch into your remote tracking branch": "Buscar da ramificação remota para a ramificação de rastreamento remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch Git Repository": "Buscar Repositório Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Push": "Push", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the remote branch": "Enviar por push da ramificação local para a ramificação remota", //$NON-NLS-0$  //$NON-NLS-1$
	"Push Git Repository": "Enviar o Repositório Git por Push", //$NON-NLS-0$  //$NON-NLS-1$
	"Key:": "Chave:", //$NON-NLS-0$  //$NON-NLS-1$
	"Value:": "Valor:", //$NON-NLS-0$  //$NON-NLS-1$
	"New Configuration Entry": "Nova Entrada de Configuração", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit": "Editar", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit the configuration entry": "Editar a entrada de configuração", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the configuration entry": "Excluir a entrada de configuração", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete ${0}?": "Tem certeza de que deseja excluir ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Repository": "Clonar Repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone an existing Git repository to a folder": "Clonar um Repositório Git existente para uma pasta", //$NON-NLS-0$  //$NON-NLS-1$
	"Cloning repository: ": "Clonando o repositório: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Repository": "Inicializar Repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a new Git repository in a new folder": "Criar um novo Repositório Git em uma nova pasta", //$NON-NLS-0$  //$NON-NLS-1$
	"Initializing repository: ": "Inicializando o repositório: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Git Repository": "Inicializar Repositório Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the repository": "Excluir o repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want do delete ${0} repositories?": "Tem certeza de que deseja excluir os repositórios ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply a patch on the selected repository": "Aplicar uma correção no repositório selecionado", //$NON-NLS-0$  //$NON-NLS-1$
	"Show content": "Mostrar conteúdo", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit name:": "Confirmar nome:", //$NON-NLS-0$  //$NON-NLS-1$
	"Open Commit": "Abrir Confirmação", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitDialog": "Abrir Confirmação", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the commit with the given name": "Abrir a confirmação com o nome dado", //$NON-NLS-0$  //$NON-NLS-1$
	"No commits found": "Nenhuma confirmação localizada", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging changes": "Configurando mudanças", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message:": "Confirmar mensagem:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing changes": "Confirmando Alterações", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching previous commit message": "Buscando mensagem de confirmação anterior", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes": "Reconfigurando as mensagens locais", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout files, discarding all changes": "Efetuar check-out de arquivos, descartando todas as mudanças", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Patch": "Mostrar Correção", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading default workspace": "Carregando área de trabalho padrão", //$NON-NLS-0$  //$NON-NLS-1$
	"Show workspace changes as a patch": "Mostrar as mudanças da área de trabalho como uma correção", //$NON-NLS-0$  //$NON-NLS-1$
	"Show checked changes as a patch": "Mostrar mudanças verificadas como uma correção", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowCommitPatchTip": "Mostrar correção para mudanças nesta confirmação", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue": "Continuar", //$NON-NLS-0$  //$NON-NLS-1$
	"Contibue Rebase": "Continuar o rebaseamento", //$NON-NLS-0$  //$NON-NLS-1$
	"Skip Patch": "Ignorar Correção", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort": "Interromper", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort Rebase": "Interromper Criação de Nova Base", //$NON-NLS-0$  //$NON-NLS-1$
	"Discard": "Descartar", //$NON-NLS-0$  //$NON-NLS-1$
	"Ignore": "Ignorar", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesSelectedFilesDiscard": "As mudanças nos arquivos selecionados serão descartadas e não poderão ser recuperadas.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Getting git log": "Obtendo log git", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting stashed changes...": "Obtendo mudanças do armazenamento em arquivo stash...", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch (${0})": "Ramificação ativa (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch (${0})": "Ramificação (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag (${0})": "Tag (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit (${0})": "Confirmação (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommit (${0})": "Armazenamento em arquivo stash (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"WIPStash": "WIP em ${0}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"IndexStash": "índice em ${0}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranch (${0})": "Ramificação Remota (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch Log": "Log Git (Ramificação Ativa)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the active local branch": "Mostrar o log da ramificação local ativa", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Branch Log": "Log Git (Ramificação Remota)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the corresponding remote tracking branch": "Mostrar o log da ramificação de rastreamento remoto correspondente", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Status" : "Consulte o Status Integral", //$NON-NLS-0$  //$NON-NLS-1$
	"See the status" : "Consulte o status", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose target location" : "Escolha o local de destino", //$NON-NLS-0$  //$NON-NLS-1$
	"Default target location" : "Local de destino padrão", //$NON-NLS-0$  //$NON-NLS-1$
	"Change..." : "Alterar...", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge Squash": "Mesclar Squash", //$NON-NLS-0$  //$NON-NLS-1$
	"Squash the content of the branch to the index" : "Efetuar squash do conteúdo da ramificação para o índice", //$NON-NLS-0$  //$NON-NLS-1$
	"Local Branch Name:" : "Nome da Filial Local:", //$NON-NLS-0$  //$NON-NLS-1$
	"Local": "local", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter items" : "Filtrar itens", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter filter" : "Filtrar mensagem", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter author" : "Filtrar autor", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter committer" : "Filtrar confirmador", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter sha1" : "Filtrar sha1", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter fromDate" : "Filtrar a partir da data AAAA-MM-DD ou 1(h d s m a)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter toDate" : "Filtrar até a data AAAA-MM-DD ou 1(h d s m a)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter path" : "Filtrar caminho", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter remote branches" : "Filtrar filiais remotas", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote branches" : "Obtendo ramificações remotas ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote details": "Obtendo detalhes remotos: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchApplied": "Correção aplicada com sucesso", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchFailed": "Falha ao aplicar correção. ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting branches" : "Obtendo ramificações ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Paste link in email or IM" : "Cole o link no e-mail ou IM", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in GitHub" : "Mostrar Confirmação no GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in GitHub" : "Mostrar o Repositório no GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in GitHub": "Mostrar essa Confirmação no GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in eclipse.org": "Mostrar Confirmação no eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in eclipse.org" : "Mostrar essa Confirmação no eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in eclipse.org":"Mostrar Repositório no eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in eclipse.org":"Mostrar este repositório no eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review" : "Pedir revisão", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review tooltip" : "Enviar e-mail com a solicitação para a revisão de compromisso", //$NON-NLS-0$  //$NON-NLS-1$
	"Reviewer name" : "Nome do revisor", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request" : "Solicitação de revisão de contribuição", //$NON-NLS-0$  //$NON-NLS-1$
	"Send the link to the reviewer" : "Enviar o link para o revisor", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key file (optional):" : "Arquivo de chave privado (opcional):", //$NON-NLS-0$  //$NON-NLS-1$
	"Don't prompt me again:" : "Não me avise novamente:", //$NON-NLS-0$  //$NON-NLS-1$
	"Your private key will be saved in the browser for further use" : "Sua chave privada será salva em um navegador para uso futuro", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading Contribution Review Request..." : "Carregando Solicitação de Revisão de Contribuição ...", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit can be found in the following repositories" : "A confirmação pode ser localizada nos seguintes repositórios", //$NON-NLS-0$  //$NON-NLS-1$
	"Try to update your repositories" : "Tente atualizar seus repositórios", //$NON-NLS-0$  //$NON-NLS-1$
	"Create new repository" : "Criar novo repositório", //$NON-NLS-0$  //$NON-NLS-1$
	"Attach the remote to one of your existing repositories" : "Anexe o remoto em um dos seus repositórios existentes", //$NON-NLS-0$  //$NON-NLS-1$
	"You are reviewing contribution ${0} from ${1}" : "Você está revisando a contribuição ${0} de ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitNotFoundInWorkspace" : "Infelizmente, a confirmação não pode ser localizada em sua área de trabalho. Para ver, tente uma das seguintes: ", //$NON-NLS-0$  //$NON-NLS-1$
 	"To review the commit you can also:" : "Para revisar a confirmação, você também pode:", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request for ${0} on ${1}" : "Solicitação de Revisão de Contribuição para ${0} em ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Failing paths: ${0}": "caminhos com falha: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Problem while performing the action": "Problema ao executar a ação", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the Orion repositories page to provide a git repository URL. Once the repository is created, it will appear in the Navigator.": "Acesse a página de repositórios do Orion para fornecer uma URL do repositório git. Após o repositório ser criado, ele aparecerá no Navegador.", //$NON-NLS-0$  //$NON-NLS-1$
	"URL:": "URL:", //$NON-NLS-0$  //$NON-NLS-1$
	"File:": "Arquivo:", //$NON-NLS-0$  //$NON-NLS-1$
	"Submit": "Enviar", //$NON-NLS-0$  //$NON-NLS-1$
	"git url:": "URL de git: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert": "Reverter", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert changes introduced by the commit into your active branch": "Reverter mudanças introduzidas pela confirmação em ramificação ativa", //$NON-NLS-0$  //$NON-NLS-1$
	". Could not revert into active branch": ". Não foi possível reverter para ramificação ativa.", //$NON-NLS-0$  //$NON-NLS-1$
	"Login": "Iniciar sessão", //$NON-NLS-0$  //$NON-NLS-1$
	"Authentication required for: ${0}. ${1} and re-try the request.": "Autenticação requerida para: ${0}. ${1} e tente novamente a solicitação.", //$NON-NLS-0$  //$NON-NLS-1$
	"Save":"Salvar", //$NON-NLS-0$  //$NON-NLS-1$
	"Remember my committer name and email:":"Lembrar meu nome e e-mail do committer:", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully edited ${0} to have value ${1}":"Editado com êxito ${0} para ter o valor ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully added ${0} with value ${1}":"Incluído com êxito ${0} com o valor ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Signed-off-by: ":"Sign off efetuado por: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Change-Id: ":"ID da mudança: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Push_REJECTED_NONFASTFORWARD":"Push não é de avanço rápido e foi rejeitado. Use Buscar para ver novas confirmações que devem ser mescladas.", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit and Push" : "Confirmar e enviar por push", //$NON-NLS-0$  //$NON-NLS-1$
	"Sync" : "Sincronizar", //$NON-NLS-0$  //$NON-NLS-1$
	"SyncTooltip" : "Busque a partir da ramificação remota. Rebaseie suas confirmações removendo-as da ramificação local, iniciando a ramificação local novamente com base no estado mais recente da ramificação remota e aplicando cada confirmação à ramificação local atualizada. Envie por push confirmações e tags da ramificação local para a ramificação remota.", //$NON-NLS-0$  //$NON-NLS-1$
	"NoCommits" : "Sem Alterações", //$NON-NLS-0$  //$NON-NLS-1$
	"NoContent" : "Sem Conteúdo", //$NON-NLS-0$  //$NON-NLS-1$
	"Incoming" : "Entrada", //$NON-NLS-0$  //$NON-NLS-1$
	"Outgoing" : "Saída", //$NON-NLS-0$  //$NON-NLS-1$
	"IncomingWithCount" : "Recebido (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"OutgoingWithCount" : "De saída (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Synchronized" : "Histórico", //$NON-NLS-0$  //$NON-NLS-1$
	"Uncommited" : "Não confirmado", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository:" : "Repositório:", //$NON-NLS-0$  //$NON-NLS-1$
	"Reference:" : "Referência:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author:" : "Autor:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer:" : "Confirmador:", //$NON-NLS-0$  //$NON-NLS-1$
	"SHA1:" : "SHA1:", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchCmd" : "Mostrar ramificação ativa", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceCmd": "Mostrar referência", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceTip": "Visualizar o histórico de ${1} \"${2}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchTip": "Visualizar o histórico de \"${0}\" relativo a ${1} \"${2}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitType": "confirmar", //$NON-NLS-0$  //$NON-NLS-1$
	"BranchType": "ramificação", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranchType": "ramificação remota", //$NON-NLS-0$  //$NON-NLS-1$
	"TagType": "tag", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommitType": "armazenar em arquivo stash", //$NON-NLS-0$  //$NON-NLS-1$
	"Path:" : "Caminho:", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChanges" : "Mudanças no diretório ativo", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChangesDetails" : "Detalhes do diretório ativo", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareChanges" : "Comparar (${0} => ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"NoBranch" : "Nenhuma ramificação", //$NON-NLS-0$  //$NON-NLS-1$
	"NoActiveBranch" : "Nenhuma ramificação ativa", //$NON-NLS-0$  //$NON-NLS-1$
	"NoRef" : "Nenhuma referência selecionada", //$NON-NLS-0$  //$NON-NLS-1$
	"None": "Nenhum(a)", //$NON-NLS-0$  //$NON-NLS-1$
	"FileSelected": "${0} arquivo selecionado", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesSelected": "${0} arquivos selecionados", //$NON-NLS-0$  //$NON-NLS-1$
	"FileChanged": "${0} arquivo alterado", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChanged": "${0} arquivos alterados", //$NON-NLS-0$  //$NON-NLS-1$
	"file": "arquivo", //$NON-NLS-0$  //$NON-NLS-1$
	"files": "arquivos", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitConfirm": "Você não possui arquivos selecionados. Tem certeza?", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitWarning": "A confirmação está vazia", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChangedVsReadyToCommit": "${0} ${1} alterado. ${2} ${3} pronto para confirmação.", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitPush": "Confirmar e enviar por push", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits and pushes files to the default remote": "Confirma e envia por push arquivos para o remoto padrão", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash" : "Armazenar em arquivo stash", //$NON-NLS-0$  //$NON-NLS-1$
	"stashIndex" : "stash@{${0}}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash all current changes away" : "Armazenar em arquivo stash todas as mudanças", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop" : "Soltar", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop the commit from the stash list" : "Descartar a confirmação da lista de armazenamento em arquivo stash", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply" : "Aplicar", //$NON-NLS-0$  //$NON-NLS-1$
	"Pop Stash" : "Armazenamento em arquivo stash Pop", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the most recently stashed change to your active branch and drop it from the stashes" : "Aplicar a mudança de armazenamento em arquivo stash mais recente em sua ramificação ativa e descartá-la dos armazenamentos em arquivo stash", //$NON-NLS-0$  //$NON-NLS-1$
	"stashes" : "armazenamentos em arquivo stash", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyName': "Repositório Git", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyTooltip': "Associar um repositório git a este projeto.",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectName': "Repositório Git",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectTooltip': "Criar um projeto a partir de um repositório git.",  //$NON-NLS-0$  //$NON-NLS-1$
	'fetchGroup': 'Buscar',  //$NON-NLS-0$  //$NON-NLS-1$
	'pushGroup' : 'Push',  //$NON-NLS-0$  //$NON-NLS-1$
	'Url:' : 'Url:', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Private Key:' : 'Chave privada Ssh:', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Passphrase:' : 'Passphrase Ssh:', //$NON-NLS-0$  //$NON-NLS-1$
	'confirmUnsavedChanges': 'Há mudanças não salvas. Deseja salvá-las?' //$NON-NLS-1$ //$NON-NLS-0$
});

