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



