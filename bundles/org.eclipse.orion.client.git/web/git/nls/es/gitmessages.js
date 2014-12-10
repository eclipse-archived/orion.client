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
	"Compare": "Comparar", //$NON-NLS-0$  //$NON-NLS-1$
	"View the side-by-side compare": "Ver la comparación en paralelo", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirVer": "Abrir directorio de trabajo", //$NON-NLS-0$  //$NON-NLS-1$
	"Working Directory": "Directorio de trabajo", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewWorkingDirVer": "Ver la versión del directorio de trabajo del archivo", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading...": "Cargando...", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories": "Todos los repositorios de Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repo": "Repositorios", //$NON-NLS-0$  //$NON-NLS-1$
	"0 on 1 - Git": "${0} en ${1} - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Git": "Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in eclipse.org": "Mostrar en eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show in GitHub": "Mostrar en GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in GitHub": "Mostrar reste repositorio en GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit Details": "Detalles de confirmación", //$NON-NLS-0$  //$NON-NLS-1$
	"No Commits": "No hay confirmaciones", //$NON-NLS-0$  //$NON-NLS-1$
	"commit: 0": "confirmación: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"parent: 0": "padre: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"authored by 0 (1) on 2": "creado por ${0} <${1}> el ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"committed by 0 (1)": "confirmado por ${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"committedby": "confirmados por ", //$NON-NLS-0$  //$NON-NLS-1$
	"authoredby": "escritos por ", //$NON-NLS-0$  //$NON-NLS-1$
	"on": " activado ", //$NON-NLS-0$  //$NON-NLS-1$
	"nameEmail": "${0} <${1}>", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags:": "Etiquetas:", //$NON-NLS-0$  //$NON-NLS-1$
	"No Tags": "Sin etiquetas", //$NON-NLS-0$  //$NON-NLS-1$
	"Diffs": "Cambios", //$NON-NLS-0$  //$NON-NLS-1$
	"WorkingDirChanges": "Modificaciones del directorio de trabajo", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChanges": "Confirmar cambios", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitChangesDialog": "Confirmar cambios", //$NON-NLS-0$  //$NON-NLS-1$
	"more": "más ...", //$NON-NLS-0$  //$NON-NLS-1$
	"less": "menos ...", //$NON-NLS-0$  //$NON-NLS-1$
	"More": "Más", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFiles" : "Más archivos", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreFilesProgress": "Cargando más archivos...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommits": "Más confirmaciones para \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreCommitsProgress": "Cargando más confirmaciones para \"${0}\"...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranches": "Más ramas para \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreBranchesProgress": "Cargando más ramas para \"${0}\"...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTags": "Más etiquetas", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreTagsProgress": "Cargando más etiquetas...", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashes": "Más acumulaciones", //$NON-NLS-0$  //$NON-NLS-1$
	"MoreStashesProgress": "Cargando más acumulaciones...", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading git log...": "Cargando registro de git...", //$NON-NLS-0$  //$NON-NLS-1$
	"local": "local", //$NON-NLS-0$  //$NON-NLS-1$
	"remote": "remota", //$NON-NLS-0$  //$NON-NLS-1$
	"View All": "Ver todo", //$NON-NLS-0$  //$NON-NLS-1$
	"Error ${0}: ": "Error ${0}: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading ": "Cargando ", //$NON-NLS-0$  //$NON-NLS-1$
	"Message": "Mensaje", //$NON-NLS-0$  //$NON-NLS-1$
	"Author": "Autor", //$NON-NLS-0$  //$NON-NLS-1$
	"Date": "Fecha", //$NON-NLS-0$  //$NON-NLS-1$
	"fromDate:": "Fecha de inicio:", //$NON-NLS-0$  //$NON-NLS-1$
	"toDate:": "Fecha final:", //$NON-NLS-0$  //$NON-NLS-1$
	"Actions": "Acciones", //$NON-NLS-0$  //$NON-NLS-1$
	"Branches": "Ramas", //$NON-NLS-0$  //$NON-NLS-1$
	"Tags": "Etiquetas", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage": "Etapa", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged removal": "Eliminación sin etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage": "Sin etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged removal": "Eliminación por etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged change": "Cambio sin etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged change": "Cambio por etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged add": "Adición sin etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged add": "Adición por etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"Addition": "Adición", //$NON-NLS-0$  //$NON-NLS-1$
	"Deletion": "Supresión", //$NON-NLS-0$  //$NON-NLS-1$
	"Resolve Conflict": "Resolver conflicto", //$NON-NLS-0$  //$NON-NLS-1$
	"Conflicting": "Conflictivo", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message": "Mensaje de confirmación", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit": "Comprometer", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitTooltip": "Confirmar los archivos seleccionados con el mensaje dado.", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthMsgLink":"Autenticación necesaria para ${0}. <a target=\"_blank\" href=\"${1}\">${2}</a> y vuelva a intentar la solicitud. </span>", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCommit": "Especificar el mensaje de confirmación", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartCountCommit": "Confirmar ${0} archivo(s)", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend last commit": "Corregir última confirmación", //$NON-NLS-0$  //$NON-NLS-1$
	" Amend": " Corregir", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress. Choose action:": "Cambio de base en curso. Elija la acción:", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgress": "Cambio de base en curso.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseTip": "Cambie la base de las confirmaciones eliminándolas de la rama activa, volviendo a iniciar la rama activa basada en el último estado de \"${0}\" y aplicando de nuevo cada confirmación a la rama activa actualizada.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebasingRepo": "Cambiando la base del repositorio Git", //$NON-NLS-0$  //$NON-NLS-1$
	"AddingConfig": "Añadiendo la propiedad de configuración git: key=${0} value=${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"EditingConfig": "Editando la propiedad de configuración git: key=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"DeletingConfig": "Suprimiendo la propiedad de configuración git: key=${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"AddClone": "Clonando repositorio: =${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseProgressDetails": "Cambiando la base de la rama.\n\n\tUtilice Continuar después de fusionar los conflictos y de seleccionar todos los archivos;\n\tOmitir para ignorar el parche actual;\n\tAbortar para finalizar el cambio de base en cualquier momento.", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer name:": "Nombre de confirmador:", //$NON-NLS-0$  //$NON-NLS-1$
	"Name:": "Nombre:", //$NON-NLS-0$  //$NON-NLS-1$
	"email:": "Correo electrónico:", //$NON-NLS-0$  //$NON-NLS-1$
	"Email:": "Correo electrónico:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author name: ": "Nombre de autor: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged": "Sin etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged": "Por etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangedFiles": "Archivos modificados", //$NON-NLS-0$  //$NON-NLS-1$
	"Recent commits on": "Confirmaciones recientes en", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status": "Estado de Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Status": "Abrir la página Estado de Git para el repositorio que contiene este archivo o carpeta.", //$NON-NLS-0$  //$NON-NLS-1$
	"GetGitIncomingMsg": "Obtención de cambios entrantes de git...", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout": "Extracción", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out...": "Extrayendo...", //$NON-NLS-0$  //$NON-NLS-1$
	"Stage the change": "Definir la etapa del cambio", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging...": "Definiendo etapas...", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutSelectedFiles": "Extraer todos los archivos seleccionados, descartando todos los cambios", //$NON-NLS-0$  //$NON-NLS-1$
	"AddFilesToGitignore" : "Añadir todos los archivos seleccionados a archivo(s) .gitignore", //$NON-NLS-0$  //$NON-NLS-1$
	"Writing .gitignore rules" : "Escribiendo reglas de .gitignore", //$NON-NLS-0$  //$NON-NLS-1$ 
	"Save Patch": "Guardar parche", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstage the change": "Anular etapa del cambio", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaging...": "Anulando etapas...", //$NON-NLS-0$  //$NON-NLS-1$
	"Undo": "Deshacer", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoTooltip": "Revertir esta confirmación conservando todos los archivos cambiados sin hacer cambios en el directorio de trabajo.", //$NON-NLS-0$  //$NON-NLS-1$
	"UndoConfirm": "El contenido de la rama activa se sustituirá por la confirmación \"${0}\". Se conservarán todos los cambios del directorio trabajo y confirmación. ¿Está seguro?", //$NON-NLS-0$  //$NON-NLS-1$
	"Reset": "Restablecer", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetConfirm": "Todos los cambios sin etapas y por etapas del directorio de trabajo y del índice se descartarán y no podrán recuperarse.\n\n¿Está seguro de que desea continuar?", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutConfirm" : "Los cambios en los archivos seleccionados se descartarán y no podrán recuperarse.\n\n¿Está seguro de que desea continuar?", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetBranchDiscardChanges": "Restablecer la rama descartando todos los cambios por etapas y sin etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesIndexDiscardedMsg": "Todos los cambios sin etapas y por etapas del directorio de trabajo y del índice se descartarán y no podrán recuperarse.", //$NON-NLS-0$  //$NON-NLS-1$
	"ContinueMsg": "¿Está seguro de que desea continuar?", //$NON-NLS-0$  //$NON-NLS-1$
	"KeepWorkDir" : "Conservar directorio de trabajo", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes...": "Restableciendo cambios locales...", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue rebase...": "Continuar cambio de base...", //$NON-NLS-0$  //$NON-NLS-1$
	"Skipping patch...": "Omitiendo parche...", //$NON-NLS-0$  //$NON-NLS-1$
	"Aborting rebase...": "Anulando cambio de base...", //$NON-NLS-0$  //$NON-NLS-1$
	"Complete log": "Registro completo", //$NON-NLS-0$  //$NON-NLS-1$
	"local VS index": "índice de VS local", //$NON-NLS-0$  //$NON-NLS-1$
	"index VS HEAD": "índice VS HEAD", //$NON-NLS-0$  //$NON-NLS-1$
	"Compare(${0} : ${1})": "Comparar (${0} : ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading status...": "Cargando estado...", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing...": "Comprometiendo...", //$NON-NLS-0$  //$NON-NLS-1$
	"The author name is required.": "El nombre del autor es necesario.", //$NON-NLS-0$  //$NON-NLS-1$
	"The author mail is required.": "La dirección de correo electrónico del autor es necesaria.", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoConflict": ". El repositorio todavía tiene conflictos.", //$NON-NLS-0$  //$NON-NLS-1$
	"RepoUnmergedPathResolveConflict": ". El repositorio contiene vías de acceso no fusionadas. Resuelva primero los conflictos.", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering ${0}": "Representando ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Configuration": "Configuración", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting configuration of": "Obteniendo configuración de ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting git repository details": "Obteniendo detalles de repositorio git", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting changes": "Obteniendo cambios", //$NON-NLS-0$  //$NON-NLS-1$
	" - Git": " - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repositories - Git": "Repositorios - Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository": "Repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository Not Found": "Repositorio no encontrado", //$NON-NLS-0$  //$NON-NLS-1$
	"No Repositories": "No hay repositorios", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repository": "Cargando el repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading repositories": "Cargando repositorios", //$NON-NLS-0$  //$NON-NLS-1$
	"(no remote)": "(no remoto)", //$NON-NLS-0$  //$NON-NLS-1$
	"location: ": "ubicación: ", //$NON-NLS-0$  //$NON-NLS-1$
	"NumFilesStageAndCommit": "${0} archivo(s) para definir etapa y ${1} archivo(s) para confirmar.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Nothing to commit.": "No hay nada para confirmar.", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing to push.": "No haya nada para enviar (push).", //$NON-NLS-0$  //$NON-NLS-1$
	"NCommitsToPush": "${0} confirmaciones para enviar.", //$NON-NLS-0$  //$NON-NLS-1$
	"You have no changes to commit.": "No tiene cambios por confirmar.", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase in progress!": "Cambio de base en curso.", //$NON-NLS-0$  //$NON-NLS-1$
	"View all local and remote tracking branches": "Ver todas las ramas de rastreo locales y remotas", //$NON-NLS-0$  //$NON-NLS-1$
	"tracksNoBranch": "seguimiento de ninguna rama", //$NON-NLS-0$  //$NON-NLS-1$
	"tracks": "${0} seguimientos", //$NON-NLS-0$  //$NON-NLS-1$
	"last modified ${0} by ${1}": "última modificación ${0} realizada por ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remote Branches": "No hay ramas remotas", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering branches": "Ramas de representación", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits": "Confirmaciones", //$NON-NLS-0$  //$NON-NLS-1$
	"GettingCurrentBranch": "Obteniendo la rama actual para ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Log": "Ver registro completo", //$NON-NLS-0$  //$NON-NLS-1$
	"See the full log": "Ver el registro completo", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting commits for \"${0}\" branch": "Obteniendo confirmaciones para la rama de \"${0}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering commits": "Representando confirmaciones", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting outgoing commits": "Obteniendo confirmaciones de salida", //$NON-NLS-0$  //$NON-NLS-1$
	"The branch is up to date.": "La rama está actualizada.", //$NON-NLS-0$  //$NON-NLS-1$
	"NoOutgoingIncomingCommits": "No tiene ninguna confirmación de entrada ni de salida.", //$NON-NLS-0$  //$NON-NLS-1$
 	") by ": ") por ", //$NON-NLS-0$  //$NON-NLS-1$
	" (SHA ": " (SHA ", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting tags": "Obteniendo etiquetas", //$NON-NLS-0$  //$NON-NLS-1$
	"View all tags": "Ver todas las etiquetas", //$NON-NLS-0$  //$NON-NLS-1$
	" on ": " activado ", //$NON-NLS-0$  //$NON-NLS-1$
	" by ": " por ", //$NON-NLS-0$  //$NON-NLS-1$
	"Remotes": "Remotos", //$NON-NLS-0$  //$NON-NLS-1$
	"Rendering remotes": "Representando remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"No Remotes": "Sin remotos", //$NON-NLS-0$  //$NON-NLS-1$
	"Unstaged addition": "Adición sin etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"Staged addition": "Adición por etapas", //$NON-NLS-0$  //$NON-NLS-1$
	" (Rebase in Progress)": " (Cambio de base en curso)", //$NON-NLS-0$  //$NON-NLS-1$
	"Status": "Estado", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0)": "Registro (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Log (0) - 1": "Registro (${0}) - ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Status for ${0} - Git ": "Estado para ${0} - Git ", //$NON-NLS-0$  //$NON-NLS-1$
	"No Unstaged Changes": "No hay cambios sin etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"No Staged Changes": "No hay cambios por etapas", //$NON-NLS-0$  //$NON-NLS-1$
	"Changes for \"${0}\" branch": "Modificaciones para ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch": "Confirmaciones para ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits for \"${0}\" branch against": "Confirmaciones para la rama \"${0}\" contra", //$NON-NLS-0$  //$NON-NLS-1$
	"Add Remote": "Añadir remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Name:": "Nombre remoto:", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote URI:": "URI remoto:", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply Patch": "Aplicar parche", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyPatchDialog": "Aplicar parche", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Repository": "Repositorio Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the git repository": "Abrir la página Repositorio Git para este archivo o carpeta.", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Git Repository": "Clonar repositorio git", //$NON-NLS-0$  //$NON-NLS-1$
	"CloneGitRepositoryDialog": "Clonar repositorio git", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository URL:": "URL del repositorio:", //$NON-NLS-0$  //$NON-NLS-1$
	"Existing directory:": "Directorio existente:", //$NON-NLS-0$  //$NON-NLS-1$
	"New folder:": "Nueva carpeta:", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseFolderDialog": "Elegir carpeta", //$NON-NLS-0$  //$NON-NLS-1$
	"Message:": "Mensaje:", //$NON-NLS-0$  //$NON-NLS-1$
	"Amend:": "Corregir:", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartAmend": "Corregir confirmación anterior", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangeId:": "ID de cambio:", //$NON-NLS-0$  //$NON-NLS-1$
	"SmartChangeId": "Añadir ID de cambio al mensaje", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Name:": "Nombre de confirmador:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer Email:": "Correo electrónico de confirmador:", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorNamePlaceholder": "Escriba nombre de autor", //$NON-NLS-0$  //$NON-NLS-1$
	"AuthorEmailPlaceholder": "Escriba correo electrónico de autor", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterNamePlaceholder": "Escriba nombre de confirmador", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitterEmailPlaceholder": "Escriba correo electrónico de confirmador", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Name:": "Nombre de autor:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author Email:": "Correo electrónico de autor:", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit message is required.": "El mensaje de confirmación es necesario.", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Credentials": "Credenciales de Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Username:": "Nombre de usuario:", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key:": "Clave privada:", //$NON-NLS-0$  //$NON-NLS-1$
	"Passphrase (optional):": "Frase de contraseña (opcional):", //$NON-NLS-0$  //$NON-NLS-1$
	"commit:": "confirmar: ", //$NON-NLS-0$  //$NON-NLS-1$
	"parent:": "padre: ", //$NON-NLS-0$  //$NON-NLS-1$
	"branches: ": "ramas: ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags: ": "etiquetas: ", //$NON-NLS-0$  //$NON-NLS-1$
	"tags": "etiquetas", //$NON-NLS-0$  //$NON-NLS-1$
	" authored by ${0} {${1}) on ${2}": " creado por ${0} (${1}) el ${2}", //$NON-NLS-0$  //$NON-NLS-1$
	"Content": "Contenido", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to ${0} section": "Ir a la sección ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Type the commit name (sha1):": "Escriba el nombre de confirmación (sha1):", //$NON-NLS-0$  //$NON-NLS-1$
	"Search": "Buscar", //$NON-NLS-0$  //$NON-NLS-1$
	"Searching...": "Buscando...", //$NON-NLS-0$  //$NON-NLS-1$
	"SelectAll": "Seleccionar todo", //$NON-NLS-0$  //$NON-NLS-1$
	"Looking for the commit": "Buscando la confirmación", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch:": "Nueva rama:", //$NON-NLS-0$  //$NON-NLS-1$
	"No remote selected": "No se ha seleccionado ningún remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Enter a name...": "Escriba un nombre...", //$NON-NLS-0$  //$NON-NLS-1$
	"OK": "Aceptar", //$NON-NLS-0$  //$NON-NLS-1$
	"Cancel": "Cancelar", //$NON-NLS-0$  //$NON-NLS-1$
	"Clear": "Borrar", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter": "Filtrar", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommits": "Filtrar confirmaciones", //$NON-NLS-0$  //$NON-NLS-1$
	"FilterCommitsTip": "Conmuta el panel de filtrado de confirmaciones", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeCmd": "Maximizar", //$NON-NLS-0$  //$NON-NLS-1$
	"MaximizeTip": "Conmuta el estado maximización del editor", //$NON-NLS-0$  //$NON-NLS-1$
	" [New branch]": " [Nueva rama]", //$NON-NLS-0$  //$NON-NLS-1$
	"AddKeyToHostContinueOp": "¿Desea añadir la clave ${0} para el host ${1} para continuar con la operación? El valor de fingerpt clave es ${2}.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Link Repository": "Enlazar repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Folder name:": "Nombre de carpeta:", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository was linked to ": "El repositorio estaba enlazado con ", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutCommitTooltip": "Extraer esta confirmación, creando una rama local basada en su contenido.", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutTagTooltip": "Extraer este código, creando una rama local basada en su contenido.", //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out ${0}": "Extrayendo ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"CheckoutBranchMsg": "Extraer la rama o la rama local correspondiente y hacer que esté activa. Si la rama de seguimiento remoto no tiene una sucursal local correspondiente, la rama local se creará primero.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Checking out branch...": "Extrayendo la rama", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding branch ${0}...": "Añadiendo rama ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing branch ${0}...": "Eliminando rama ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding remote ${0}...": "Añadiendo ${0} remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote ${0}...": "Eliminando ${0} remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing repository ${0}": "Eliminando repositorio ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Adding tag {$0}": "Añadiendo etiqueta {$0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing tag {$0}": "Eliminando etiqueta {$0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Merging ${0}": "Fusionando ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	'Unstaging changes' : 'Anulando etapas de cambios', //$NON-NLS-0$  //$NON-NLS-1$
	"Checking out branch ${0}...": "Extrayendo rama ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch checked out.": "La rama se ha extraído.", //$NON-NLS-0$  //$NON-NLS-1$
	"New Branch": "Nueva rama", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new local branch to the repository": "Añadir una rama local al repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch name": "Nombre de rama", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete": "Suprimir", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the local branch from the repository": "Suprimir la rama local del repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"DelBrConfirm": "¿Seguro que desea suprimir la rama ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote tracking branch from the repository": "Suprimir la rama de rastreo remota del repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure?": "¿Está seguro?", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoveRemoteBranchConfirm": "Va a suprimir la rama remota \"${0}\" y enviar el cambio.\n\n¿Está seguro?", //$NON-NLS-0$  //$NON-NLS-1$
	"Removing remote branch: ": "Eliminando rama remota: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete Remote Branch": "Suprimir rama remota", //$NON-NLS-0$  //$NON-NLS-1$
	"New Remote": "Remota nueva", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Remote": "Remota Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Remote": "Abrir la página Registro Git remoto para este archivo o carpeta.", //$NON-NLS-0$  //$NON-NLS-1$
	"Add a new remote to the repository": "Añadir remota nueva al repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the remote from the repository": "Suprimir remota del repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete remote ${0}?": "¿Seguro que desea suprimir la ${0} remota?", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull": "Obtener", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull from the repository": "Obtener del repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Pulling: ": "Obteniendo: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Pull Git Repository": "Obtener repositorio Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Log": "Registro de Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to Git Log": "Abrir la página Registro Git local para este archivo o carpeta.", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the branch": "Abrir el registro para la rama", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the log for the repository": "Abrir el registro para el repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the status for the repository": "Abrir el estado para el repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditor": "Mostrar en editor", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowInEditorTooltip": "Mostrar la carpeta de repositorio en el editor", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareEach": "Comparar entre sí", //$NON-NLS-0$  //$NON-NLS-1$
 	"Compare With Working Tree": "Comparar con árbol de trabajo", //$NON-NLS-0$  //$NON-NLS-1$
	"Open": "Abrir", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenGitCommitTip": "Ver el árbol para esta confirmación", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitVersion": "Abrir confirmación", //$NON-NLS-0$  //$NON-NLS-1$
	"ViewCommitVersionTip": "Ver la versión confirmada del archivo", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch": "Extracción", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote": "Obtener de remoto", //$NON-NLS-0$  //$NON-NLS-1$
	"Password:": "Contraseña:", //$NON-NLS-0$  //$NON-NLS-1$
	"User Name:": "Nombre de usuario:", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching remote: ": "Captando remoto: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Fetch": "Forzar captación", //$NON-NLS-0$  //$NON-NLS-1$
	"FetchRemoteBranch": "Captar la rama remota en la rama de rastreo remota sobrescribiendo su contenido actual.", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentRemoteTrackingBr": "Va a sobrescribir el contenido de la rama de rastreo remota. Esto puede provocar que la rama pierda las confirmaciones.", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge": "Fusionar", //$NON-NLS-0$  //$NON-NLS-1$
	"MergeContentFrmBr": "Fusionar contenido de la rama con la rama activa", //$NON-NLS-0$  //$NON-NLS-1$
 	". Go to ${0}.": ". Ir a ${0}.", //$NON-NLS-0$  //$NON-NLS-1$
	"Git Status page": "Página de estado Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Rebase": "Cambiar la base", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsMsg": "Cambie la base de las confirmaciones; para ello, elimine la rama activa, inicie la rama activa en base al último estado de la rama seleccionada. ", //$NON-NLS-0$  //$NON-NLS-1$
 	"Rebase on top of ": "Cambiar la base encima de ", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseSTOPPED": ". Se han producido algunos conflictos. Resuélvalos y continúe, omita el parche o cancele el cambio de base.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_WRONG_REPOSITORY_STATE": ". El estado del repositorio no es válido (ya existía durante el cambio de base).", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_UNMERGED_PATHS": ". El repositorio contiene vías de acceso no fusionadas.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseFAILED_PENDING_CHANGES": ". El repositorio contiene cambios pendientes. Confírmelos u ocúltelos.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseUNCOMMITTED_CHANGES": ". Existen cambios no confirmados.", //$NON-NLS-0$  //$NON-NLS-1$
	"RebaseCommitsByRmvingThem": "Cambie la base de las confirmaciones eliminándolas de la rama activa, ", //$NON-NLS-0$  //$NON-NLS-1$
	"StartActiveBranch": "iniciando la rama activa de nuevo en base al último estado de '", //$NON-NLS-0$  //$NON-NLS-1$
	"ApplyEachCommitAgain": "y aplicando de nuevo cada confirmación a la rama activa actualizada.", //$NON-NLS-0$  //$NON-NLS-1$
	"Push All": "Enviar todo", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocal": "Enviar confirmaciones y etiquetas de la rama local a la rama remota", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push Branch": "Enviar rama", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushResult": "Resultado del envío:", //$NON-NLS-0$  //$NON-NLS-1$
 	"PushCommitsWithoutTags": "Enviar confirmaciones sin etiquetas de la rama local a la rama remota", //$NON-NLS-0$  //$NON-NLS-1$
 	"Push for Review": "Enviar para revisión", //$NON-NLS-0$  //$NON-NLS-1$
	"Push commits to Gerrit Code Review": "Enviar confirmaciones a la Revisión de código Gerrit", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push Branch": "Forzar Enviar rama", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsWithoutTagsOverridingCurrentContent": "Enviar confirmaciones sin etiquetas de la rama local a la rama remota sobrescribiendo el contenido actual", //$NON-NLS-0$  //$NON-NLS-1$
 	"Pushing remote: ": "Enviar remota: ", //$NON-NLS-0$  //$NON-NLS-1$
	"ChooseBranchDialog": "Elegir rama", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose the remote branch.": "Elegir la rama remota.", //$NON-NLS-0$  //$NON-NLS-1$
	"Force Push All": "Forzar Enviar todo", //$NON-NLS-0$  //$NON-NLS-1$
	"PushCommitsTagsFrmLocalBr": "Enviar confirmaciones y etiquetas de la rama local a la rama remota sobrescribiendo el contenido actual", //$NON-NLS-0$  //$NON-NLS-1$
	"OverrideContentOfRemoteBr": "Va a sobrescribir el contenido de la rama remota. Esto puede provocar que el repositorio remoto pierda las confirmaciones.", //$NON-NLS-0$  //$NON-NLS-1$
	"< Previous Page": "Página anterior de <", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git log": "Mostrar página anterior del registro de git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show previous page of git tags" : "Mostrar página anterior de códigos de git", //$NON-NLS-0$  //$NON-NLS-1$
	"Next Page >": "Página siguiente >", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git log": "Mostrar página siguiente del registro de git", //$NON-NLS-0$  //$NON-NLS-1$
	"Show next page of git tags" : "Mostrar página siguiente de códigos de git", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the selected remote branch": "Enviar de la rama local a la rama remota seleccionada", //$NON-NLS-0$  //$NON-NLS-1$
	"ResetActiveBr": "Restablecer la rama activa al estado de esta referencia. Descartar todos los cambios sin etapas y por etapas.", //$NON-NLS-0$  //$NON-NLS-1$
 	"GitResetIndexConfirm": "El contenido de la rama activa se sustituirá por la confirmación \"${0}\". Todos los cambios sin etapas y por etapas se descartarán y no se podrán recuperar si \"${1}\" no está marcado. ¿Está seguro?", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting index...": "Restableciendo el índice...", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting git index for ${0}" : "Restableciendo el índice Git para ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag": "Código", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a tag for the commit": "Crear un código para la confirmación", //$NON-NLS-0$  //$NON-NLS-1$
	"ProjectSetup": "Su proyecto se está configurando. Esto puede tardar un minuto...", //$NON-NLS-0$  //$NON-NLS-1$
	"LookingForProject": "Se está buscando el proyecto: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag name": "Nombre de código", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the tag from the repository": "Suprimir el código del repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete tag ${0}?": "¿Seguro que desea suprimir el código ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Cherry-Pick": "Cherry-Pick", //$NON-NLS-0$  //$NON-NLS-1$
	"CherryPicking": "Confirmación de Cherry Picking: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"RevertingCommit": "Revertiendo confirmación: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the change introduced by the commit to your active branch": "Aplicar el cambio introducido por la confirmación a la rama activa", //$NON-NLS-0$  //$NON-NLS-1$
	"Nothing changed.": "No ha cambiado nada.", //$NON-NLS-0$  //$NON-NLS-1$
	". Some conflicts occurred": ". Se han producido algunos conflictos.", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch from the remote branch into your remote tracking branch": "Captar la rama remota en la rama de rastreo remota", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetch Git Repository": "Captar repositorio Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Push": "Enviar", //$NON-NLS-0$  //$NON-NLS-1$
	"Push from your local branch into the remote branch": "Enviar de la rama local a la rama remota", //$NON-NLS-0$  //$NON-NLS-1$
	"Push Git Repository": "Enviar repositorio Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Key:": "Clave:", //$NON-NLS-0$  //$NON-NLS-1$
	"Value:": "Valor:", //$NON-NLS-0$  //$NON-NLS-1$
	"New Configuration Entry": "Nueva entrada de configuración", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit": "Editar", //$NON-NLS-0$  //$NON-NLS-1$
	"Edit the configuration entry": "Editar la entrada de configuración", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the configuration entry": "Suprimir la entrada de configuración", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want to delete ${0}?": "¿Está seguro de que desea suprimir ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone Repository": "Clonar repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Clone an existing Git repository to a folder": "Clonar un repositorio git existente en una carpeta", //$NON-NLS-0$  //$NON-NLS-1$
	"Cloning repository: ": "Clonando repositorio: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Repository": "Inicializar repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Create a new Git repository in a new folder": "Crear repositorio Git nuevo en una carpeta nueva", //$NON-NLS-0$  //$NON-NLS-1$
	"Initializing repository: ": "Inicializando repositorio: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Init Git Repository": "Inicializando repositorio Git", //$NON-NLS-0$  //$NON-NLS-1$
	"Delete the repository": "Suprimir repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Are you sure you want do delete ${0} repositories?": "¿Seguro que desea suprimir repositorios ${0}?", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply a patch on the selected repository": "Aplicar un parche en el repositorio seleccionado", //$NON-NLS-0$  //$NON-NLS-1$
	"Show content": "Mostrar contenido", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit name:": "Nombre de confirmación:", //$NON-NLS-0$  //$NON-NLS-1$
	"Open Commit": "Abrir confirmación", //$NON-NLS-0$  //$NON-NLS-1$
	"OpenCommitDialog": "Abrir confirmación", //$NON-NLS-0$  //$NON-NLS-1$
	"Open the commit with the given name": "Abra la confirmación con el nombre indicado", //$NON-NLS-0$  //$NON-NLS-1$
	"No commits found": "No se han encontrado confirmaciones", //$NON-NLS-0$  //$NON-NLS-1$
	"Staging changes": "Definiendo etapas de cambios", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit message:": "Mensaje de confirmación:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committing changes": "Confirmando cambios", //$NON-NLS-0$  //$NON-NLS-1$
	"Fetching previous commit message": "Captando mensaje de confirmación anterior", //$NON-NLS-0$  //$NON-NLS-1$
	"Resetting local changes": "Restableciendo cambios locales", //$NON-NLS-0$  //$NON-NLS-1$
	"Checkout files, discarding all changes": "Extraer archivos, descartar todos los cambios", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Patch": "Mostrar parche", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading default workspace": "Cargando espacio de trabajo predeterminado", //$NON-NLS-0$  //$NON-NLS-1$
	"Show workspace changes as a patch": "Mostrar cambios de espacio de trabajo como parche", //$NON-NLS-0$  //$NON-NLS-1$
	"Show checked changes as a patch": "Mostrar cambios comprobados como parche", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowCommitPatchTip": "Mostrar el parche de los cambios en esta confirmación", //$NON-NLS-0$  //$NON-NLS-1$
	"Continue": "Continuar", //$NON-NLS-0$  //$NON-NLS-1$
	"Contibue Rebase": "Continuar cambio de base", //$NON-NLS-0$  //$NON-NLS-1$
	"Skip Patch": "Omitir parche", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort": "Terminar anormalmente", //$NON-NLS-0$  //$NON-NLS-1$
	"Abort Rebase": "Cancelar cambio de base", //$NON-NLS-0$  //$NON-NLS-1$
	"Discard": "Descartar", //$NON-NLS-0$  //$NON-NLS-1$
	"Ignore": "Omitir", //$NON-NLS-0$  //$NON-NLS-1$
	"ChangesSelectedFilesDiscard": "Los cambios en los archivos seleccionados se descartarán y no podrán recuperarse.", //$NON-NLS-0$  //$NON-NLS-1$
 	"Getting git log": "Obteniendo el registro de git", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting stashed changes...": "Obteniendo cambios acumulados...", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch (${0})": "Rama activa (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Branch (${0})": "Rama (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Tag (${0})": "Código (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit (${0})": "Confirmación (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommit (${0})": "Acumulación (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"WIPStash": "Trabajo en curso en ${0}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"IndexStash": "índice en ${0}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranch (${0})": "Rama remota (${0})", //$NON-NLS-0$  //$NON-NLS-1$
	"Active Branch Log": "Registro de Git (rama activa)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the active local branch": "Mostrar registro para rama local activa", //$NON-NLS-0$  //$NON-NLS-1$
	"Remote Branch Log": "Registro de Git (rama remota)", //$NON-NLS-0$  //$NON-NLS-1$
	"Show the log for the corresponding remote tracking branch": "Mostrar registro para la rama de rastro remota correspondiente", //$NON-NLS-0$  //$NON-NLS-1$
	"See Full Status" : "Ver estado completo", //$NON-NLS-0$  //$NON-NLS-1$
	"See the status" : "Ver el estado", //$NON-NLS-0$  //$NON-NLS-1$
	"Choose target location" : "Elegir ubicación de destino", //$NON-NLS-0$  //$NON-NLS-1$
	"Default target location" : "Ubicación de destino predeterminada", //$NON-NLS-0$  //$NON-NLS-1$
	"Change..." : "Cambiar...", //$NON-NLS-0$  //$NON-NLS-1$
	"Merge Squash": "Fusionar", //$NON-NLS-0$  //$NON-NLS-1$
	"Squash the content of the branch to the index" : "Introducir el contenido de la rama en el índice", //$NON-NLS-0$  //$NON-NLS-1$
	"Local Branch Name:" : "Nombre de rama local:", //$NON-NLS-0$  //$NON-NLS-1$
	"Local": "local", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter items" : "Filtrar elementos", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter filter" : "Filtrar mensaje", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter author" : "Filtrar autor", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter committer" : "Filtrar confirmador", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter sha1" : "Filtrar sha1", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter fromDate" : "Filtrar por fecha inicial AAAA-MM-DD o 1(h d s m a)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter toDate" : "Filtrar por fecha final AAAA-MM-DD o 1(h d s m a)", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter path" : "Filtrar vía de acceso", //$NON-NLS-0$  //$NON-NLS-1$
	"Filter remote branches" : "Filtrar ramas remotas", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote branches" : "Obteniendo ramas remotas ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting remote details": "Obteniendo detalles remotos: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchApplied": "Parche aplicado correctamente", //$NON-NLS-0$  //$NON-NLS-1$
	"PatchFailed": "No se ha podido aplicar el parche. ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Getting branches" : "Obteniendo ramas ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Paste link in email or IM" : "Pegar enlace en correo electrónico o MI", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in GitHub" : "Mostrar compromiso en GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in GitHub" : "Mostrar repositorio en GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in GitHub": "Mostrar este compromiso en GitHub", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Commit in eclipse.org": "Mostrar compromiso en eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this commit in eclipse.org" : "Mostrar este compromiso en eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show Repository in eclipse.org":"Mostrar repositorio en eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Show this repository in eclipse.org":"Mostrar este repositorio en eclipse.org", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review" : "Solicitar revisión", //$NON-NLS-0$  //$NON-NLS-1$
	"Ask for review tooltip" : "Enviar correo electrónico con solicitud de revisión de compromiso", //$NON-NLS-0$  //$NON-NLS-1$
	"Reviewer name" : "Nombre de revisor", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request" : "Solicitud de revisión de contribución", //$NON-NLS-0$  //$NON-NLS-1$
	"Send the link to the reviewer" : "Enviar el enlace al revisor", //$NON-NLS-0$  //$NON-NLS-1$
	"Private key file (optional):" : "Archivo de clave privada (opcional):", //$NON-NLS-0$  //$NON-NLS-1$
	"Don't prompt me again:" : "No preguntarme de nuevo:", //$NON-NLS-0$  //$NON-NLS-1$
	"Your private key will be saved in the browser for further use" : "La clave privada se guardará en el navegador para su uso en el futuro", //$NON-NLS-0$  //$NON-NLS-1$
	"Loading Contribution Review Request..." : "Cargando solicitud de revisión de contribución...", //$NON-NLS-0$  //$NON-NLS-1$
	"The commit can be found in the following repositories" : "Puede encontrar la confirmación en los siguientes repositorios", //$NON-NLS-0$  //$NON-NLS-1$
	"Try to update your repositories" : "Intente actualizar los repositorios", //$NON-NLS-0$  //$NON-NLS-1$
	"Create new repository" : "Crear nuevo repositorio", //$NON-NLS-0$  //$NON-NLS-1$
	"Attach the remote to one of your existing repositories" : "Adjuntar el repositorio remoto a uno de los repositorios existentes", //$NON-NLS-0$  //$NON-NLS-1$
	"You are reviewing contribution ${0} from ${1}" : "Está revisando la contribución ${0} de ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitNotFoundInWorkspace" : "Lamentablemente, no se encuentra la confirmación en su espacio de trabajo. Para verla, pruebe una de las siguientes opciones: ", //$NON-NLS-0$  //$NON-NLS-1$
 	"To review the commit you can also:" : "Para revisar la confirmación también puede:", //$NON-NLS-0$  //$NON-NLS-1$
	"Contribution Review Request for ${0} on ${1}" : "Solicitud de revisión de contribución de ${0} en ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Failing paths: ${0}": "Vías de acceso anómalas: ${0}", //$NON-NLS-0$  //$NON-NLS-1$
	"Problem while performing the action": "Se ha producido un problema al ejecutar la acción", //$NON-NLS-0$  //$NON-NLS-1$
	"Go to the Orion repositories page to provide a git repository URL. Once the repository is created, it will appear in the Navigator.": "Vaya a la página de propiedades de Orion para proporcionar un URL de repositorio git. Una vez que se haya creado el repositorio, éste aparecerá en el navegador.", //$NON-NLS-0$  //$NON-NLS-1$
	"URL:": "URL:", //$NON-NLS-0$  //$NON-NLS-1$
	"File:": "Archivo:", //$NON-NLS-0$  //$NON-NLS-1$
	"Submit": "Enviar", //$NON-NLS-0$  //$NON-NLS-1$
	"git url:": "URL de git: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert": "Revertir", //$NON-NLS-0$  //$NON-NLS-1$
	"Revert changes introduced by the commit into your active branch": "Revertir el cambio introducido por la confirmación en la rama activa", //$NON-NLS-0$  //$NON-NLS-1$
	". Could not revert into active branch": ". No se ha podido revertir en una rama activa.", //$NON-NLS-0$  //$NON-NLS-1$
	"Login": "Iniciar sesión", //$NON-NLS-0$  //$NON-NLS-1$
	"Authentication required for: ${0}. ${1} and re-try the request.": "Autenticación necesaria para ${0}. ${1} y vuelva a intentar la solicitud.", //$NON-NLS-0$  //$NON-NLS-1$
	"Save":"Guardar", //$NON-NLS-0$  //$NON-NLS-1$
	"Remember my committer name and email:":"Recordar mi nombre y correo electrónico de confirmador:", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully edited ${0} to have value ${1}":"Se ha editado ${0} satisfactoriamente para tener el valor ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Successfully added ${0} with value ${1}":"Se ha añadido ${0} satisfactoriamente con el valor ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Signed-off-by: ":"Aprobado por: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Change-Id: ":"ID de cambio: ", //$NON-NLS-0$  //$NON-NLS-1$
	"Push_REJECTED_NONFASTFORWARD":"El envío no es de avance rápido y se ha rechazado. Utilice Extraer para ver confirmaciones nuevas que se deben fusionar.", //$NON-NLS-0$  //$NON-NLS-1$
	"Commit and Push" : "Confirmar y enviar", //$NON-NLS-0$  //$NON-NLS-1$
	"Sync" : "Sincronizar", //$NON-NLS-0$  //$NON-NLS-1$
	"SyncTooltip" : "Extraer de la rama remota. Cambie la base de las confirmaciones eliminándolas de la rama local, volviendo a iniciar la rama local basada en el último estado de la rama remota y aplicando cada confirmación a la rama local actualizada. Enviar confirmaciones y etiquetas de la rama local a la rama remota.", //$NON-NLS-0$  //$NON-NLS-1$
	"NoCommits" : "No hay cambios", //$NON-NLS-0$  //$NON-NLS-1$
	"NoContent" : "Sin contenido", //$NON-NLS-0$  //$NON-NLS-1$
	"Incoming" : "Entrante", //$NON-NLS-0$  //$NON-NLS-1$
	"Outgoing" : "Saliente", //$NON-NLS-0$  //$NON-NLS-1$
	"IncomingWithCount" : "(${0}) de entrada", //$NON-NLS-0$  //$NON-NLS-1$
	"OutgoingWithCount" : "(${0}) de salida", //$NON-NLS-0$  //$NON-NLS-1$
	"Synchronized" : "Historial", //$NON-NLS-0$  //$NON-NLS-1$
	"Uncommited" : "No confirmado", //$NON-NLS-0$  //$NON-NLS-1$
	"Repository:" : "Repositorio:", //$NON-NLS-0$  //$NON-NLS-1$
	"Reference:" : "Referencia:", //$NON-NLS-0$  //$NON-NLS-1$
	"Author:" : "Autor:", //$NON-NLS-0$  //$NON-NLS-1$
	"Committer:" : "Confirmador:", //$NON-NLS-0$  //$NON-NLS-1$
	"SHA1:" : "SHA1:", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchCmd" : "Mostrar rama activa", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceCmd": "Mostrar referencia", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowReferenceTip": "Ver el historial de ${1} \"${2}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"ShowActiveBranchTip": "Ver el historial de \"${0}\" relativo a ${1} \"${2}\"", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitType": "comprometer", //$NON-NLS-0$  //$NON-NLS-1$
	"BranchType": "rama", //$NON-NLS-0$  //$NON-NLS-1$
	"RemoteTrackingBranchType": "rama remota", //$NON-NLS-0$  //$NON-NLS-1$
	"TagType": "código", //$NON-NLS-0$  //$NON-NLS-1$
	"StashCommitType": "acumular", //$NON-NLS-0$  //$NON-NLS-1$
	"Path:" : "Vía de acceso:", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChanges" : "Modificaciones del directorio de trabajo", //$NON-NLS-0$  //$NON-NLS-1$
	"LocalChangesDetails" : "Detalles del directorio de trabajo", //$NON-NLS-0$  //$NON-NLS-1$
	"CompareChanges" : "Comparar (${0} => ${1})", //$NON-NLS-0$  //$NON-NLS-1$
	"NoBranch" : "Ninguna rama", //$NON-NLS-0$  //$NON-NLS-1$
	"NoActiveBranch" : "No hay rama activa", //$NON-NLS-0$  //$NON-NLS-1$
	"NoRef" : "No hay referencia seleccionada", //$NON-NLS-0$  //$NON-NLS-1$
	"None": "Ninguno", //$NON-NLS-0$  //$NON-NLS-1$
	"FileSelected": "${0} archivo seleccionado", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesSelected": "${0} archivos seleccionados", //$NON-NLS-0$  //$NON-NLS-1$
	"FileChanged": "${0} archivo modificado", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChanged": "${0} archivos modificados", //$NON-NLS-0$  //$NON-NLS-1$
	"file": "archivo", //$NON-NLS-0$  //$NON-NLS-1$
	"files": "archivos", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitConfirm": "No tiene ningún archivo seleccionado. ¿Está seguro?", //$NON-NLS-0$  //$NON-NLS-1$
	"EmptyCommitWarning": "La confirmación está vacía", //$NON-NLS-0$  //$NON-NLS-1$
	"FilesChangedVsReadyToCommit": "${0} ${1} modificado(s). ${2} ${3} preparado para confirmar.", //$NON-NLS-0$  //$NON-NLS-1$
	"CommitPush": "Confirmar y enviar", //$NON-NLS-0$  //$NON-NLS-1$
	"Commits and pushes files to the default remote": "Confirma y envía archivos al remoto predeterminado", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash" : "Acumular", //$NON-NLS-0$  //$NON-NLS-1$
	"stashIndex" : "acumulación@{${0}}: ${1}", //$NON-NLS-0$  //$NON-NLS-1$
	"Stash all current changes away" : "Acumular aparte todos los cambios actuales", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop" : "Descartar", //$NON-NLS-0$  //$NON-NLS-1$
	"Drop the commit from the stash list" : "Descartar la confirmación de la lista de acumulación", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply" : "Aplicar", //$NON-NLS-0$  //$NON-NLS-1$
	"Pop Stash" : "Sacar acumulación", //$NON-NLS-0$  //$NON-NLS-1$
	"Apply the most recently stashed change to your active branch and drop it from the stashes" : "Aplicar el cambio acumulado más recientemente a la rama activa y descartarlo de las acumulaciones", //$NON-NLS-0$  //$NON-NLS-1$
	"stashes" : "acumulaciones", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyName': "Repositorio Git", //$NON-NLS-0$  //$NON-NLS-1$
	'addDependencyTooltip': "Asociar un repositorio git con este proyecto.",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectName': "Repositorio Git",  //$NON-NLS-0$  //$NON-NLS-1$
	'addProjectTooltip': "Crear un proyecto a partir de un repositorio git.",  //$NON-NLS-0$  //$NON-NLS-1$
	'fetchGroup': 'Extracción',  //$NON-NLS-0$  //$NON-NLS-1$
	'pushGroup' : 'Enviar',  //$NON-NLS-0$  //$NON-NLS-1$
	'Url:' : 'URL:', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Private Key:' : 'Clave privada de SSH:', //$NON-NLS-0$  //$NON-NLS-1$
	'Ssh Passphrase:' : 'Frase de contraseña de SSH:', //$NON-NLS-0$  //$NON-NLS-1$
	'confirmUnsavedChanges': 'Hay cambios no guardados. ¿Desea guardarlos?' //$NON-NLS-1$ //$NON-NLS-0$
});

