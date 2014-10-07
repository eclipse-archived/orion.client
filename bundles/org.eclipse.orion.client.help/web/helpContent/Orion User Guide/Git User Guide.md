# Overview

The Orion Git page has been designed to offer the most common Git functionality on a single page.This guide will describe the main features of the page along with a step by step guide to  common Git operations.

![Git Page](git_images/gitPage.png "Git Page")

Fig 1. Git Page in Orion 7.0
# Git Page Structure

The Git page is a selection driven master-detail page. You select a repo, you select a branch (or accept the default branch selected) and, along with your current changes, the page will display the changes for the branch.

The page is made up of 3 main sections - the context bar, the changes section and the changes details section. The 5 second summary for each of these sections:

** [Context Bar](#Context-Bar) **
* used for working with repos and references (branches, tags and stashes)

* set/edit additional git config options

** Changes Section **

* displays info about changes for the chosen repo and reference

* actions for fetching and pushing changes 

** Changes Detail Section **

* displays current working directory changes

* actions for working with working directory changes

* displays the contents of changes for the chosen reference

* actions for working with a particular change

![Git Sections](git_images/gitSections.png "Git Sections")

Fig 2. Main sections of git page

## Context Bar

The context bar controls what gets displayed in the changes sections. Let's take a look at what's in each dropdown.

### Repository

The repository dropdown displays all of the git repos that you currently have in your workspace.

The repository dropdown lets you:

* clone a repo

* create a new repo

* select an existing repo (with filter support)

* delete an existing repo


![Git Repo Dropdown](git_images/gitContextRepo.png "Git Repo Dropdown")

Fig 3. Git repository dropdown menu

#### Clone a New Repo

To clone a new repo, click on the ***Clone Repository*** button.

### References

### Config section

## Changes Section

The changes section

### Top Bar

Your current active branch is listed at the top of the page.

#### Filter

You can filter

#### History Toggle

#### Sync Button

### Working Directory Changes

### Outgoing Section

#### Push

### Incoming Section

#### Rebase

#### Merge

#### Squash

#### Reset

#### Fetch

### History Section

#### Commit Details

#### More

## Changes Detail Sections

The changes detail

### Top Bar

#### Stash

#### Patch

#### Discard

#### Commit

### Commit Message Area

#### Ammend

#### Change-Id

#### More



# Common Git Tasks

## Cloning a Repo

## Creating a new Repo

## Checking out a Branch

## Creating a new Branch

Follow these steps to create a new branch based on the state of your current local branch.

1. From the Reference dropdown, click on the **New Branch** button.
2. Enter a name, and hit **Submit**.
3. Your new branch will appear under the **_local_ ** dropdown.
4. To check it out, hit the checkout button in the row.

You now have a new local branch! You will notice that you have a pile of outgoing changes. This is because by default a placeholder target branch has been created for you.

Hit **Push** to push your new branch to your remote. 

## Creating a new Branch with multiple Remotes

## Creating a new tracking Branch

## Fetch remote branches

## Viewing the log of a Remote Branch

## Stash

## Patches

## Commit changes

## Fetch changes

## Rebase

## Merge

## Squash

## Sync

## Merge contents of branch back to master

## Rebase contents of branch back to master

## Git filesystem

## Working with Gerrit

The Git page currently allows users to *push* and *fetch* patches from a Gerrit. The following steps assumes that you already have a properly configured Gerrit server running somewhere and you have setup your account properly and can already push patches to Gerrit. 

### Adding a Remote
 
The first thing you need to do is add a Gerrit remote to an existing repo. This can be done from the References dropdown. For the purpose of this example, we will be setting up a remote to allow us to push patches for the Orion client project.

<pic>

### Editing Git Config entry

Next thing to do is to edit your new remote fetch config entry to add the appopriate refspecs for pushing to Gerrit/getting patch sets. To do this:

1. Click on the config wrench - and find your new fetch key (hint: you can use the filter, just type 'fetch' anh hit enter)
2. You need to add the following entries to the fetch key (you can alter the value of the existing key and create a **New Configuration Entry** the same name for the other value).

		+refs/heads/*:refs/remotes/<NAME OF REMOTE>/for/*
		+refs/changes/*:refs/remotes/<NAME OF REMOTE>/changes/*
		

Note that if you know the change id of the patch you are interested in reviewing, you can just enter it instead of *. For example, if you want to take a look at change id 34154, you can enter:

		+refs/changes/54/34154/*refs/remotes/<NAME OF REMOTE>/changes/54/34154/*
		
<pic>

### Fetching Branches and Commits

Once the config entries are set, you can fetch the branches and change sets.

1. Expand the References dropdown and click on the Fetch action.
2. When the action finishes you will be able to see all available change sets and branches.

<pic>






		
		     



