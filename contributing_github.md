#Contributing to Orion

Thank you for your interest in this project. Please carefully read all of the 
information on the page so your contribution to Orion can be as pleasent as possible. 

#Project description

Orion's objective is to create a browser-based open tool integration platform which is entirely focused on
developing for the web, in the web. Tools are written in JavaScript and run in the browser. Great care has
been taken to provide a web experience for development, rather than to recreate the traditional desktop
IDE experience in a browser tab.

- [https://projects.eclipse.org/projects/ecd.orion](https://projects.eclipse.org/projects/ecd.orion)

#Developer resources

Information regarding source code management, builds, and more.

- [https://projects.eclipse.org/projects/ecd.orion/developer](https://projects.eclipse.org/projects/ecd.orion/developer)

The code conventions used in Orion:
- [https://wiki.eclipse.org/Orion/Coding_conventions](https://wiki.eclipse.org/Orion/Coding_conventions)

#Contributor License Agreement

Before your contribution can be accepted by the project, you need to create and electronically sign the
Eclipse Foundation [Contributor License Agreement](https://www.eclipse.org/legal/CLA.php) (CLA):

1. Log in to the [Eclipse projects forge](https://projects.eclipse.org/user/login/sso). You will need to
   create an account with the Eclipse Foundation if you have not already done so.
2. Click on "Contributor License Agreement", and complete the form.

Be sure to use the same email address in your Eclipse account that you intend to use when you commit to Git.

#Contact

Contact the project developers via:

- the project's ["dev" mailing list](https://dev.eclipse.org/mailman/listinfo/orion-dev)
- the project's [mattermost channel](https://mattermost.eclipse.org/eclipse/channels/orion)


#Searching for bugs

This project uses the [GitHub issue tracker](https://github.com/eclipse/orion.client/issues) as our primary
bug system. If you did not a find a related in GitHub, a quick check should also be done in [Bugzilla](https://bugs.eclipse.org/bugs/buglist.cgi?classification=ECD&list_id=14792706&product=Orion), 
as there may have been a bug filed there, prior to our move to use GitHub.

#Opening a New Bug

So you found a problem with Orion, or have a great idea for a new killer feature. Great! All you have to do 
is open a new issue, following the simple steps below:
1. Search for an existing bug first! A simple first step that is easily forgotten. Please, [search for
an existing bug][searching for bugs] before filing a new one.
2. So you searched high and low, and nothing quite matches your problem. So now, to open a new bug, copy the template below into your new issue (don't worry, this will become the default new issue template soon)
```
  **What version of Orion are you using?**

  **What browser, browser version and operating system are you using?**

  **What are the steps to reproduce?**

  **Can you provide code snippets, console log entries or screen shots?**

  **What did you expect to happen?**
``` 
If instead of a bug, you are wanting to propose a killer new feature for Orion, simply
copy the template below into your new issue instead:
```
  **What version of Orion are you using?**

  **What browser, browser version and operating system are you using?**

  **Outline the details of the new enhancement.**
```
3. So now you have a new issue created, what next? 

	The bug will move through the [bug states][bug states] until it is closed.
	Anyone is free to add comments, proposed fix ideas and carry on civilized discussion on any issue regardless of its state.

#Bug Lifecycle

So you opened a new bug (thank you!) or you are interested to participating on an existing one (again thank you).
What do all of the tags and state of the bug mean? Should I change or set any of them?

To answer those questions (and more), lets first take a look at all of the tags and what they mean.

##Bug tags
As a bug moves through its states, certain tags will be either added or removed to help committers
understand the state of the bug and to help committers (or anyone else) query the bugs for particular ones.

Lets start by looking at the component tags. These tags represent a sub-area of Orion, for example, the 
tag ```js tools``` would be added to a bug or enhancement for the JavaScript tooling. These are used to help 
the committers quickly search for, and find, bugs in a particular area of Orion (rather just searching the huge list of
all open issues). 

The table below describes all the componet tags, with a brief description of the area the are meant for.

Name              | Description                       |
:-----            | :-------                          |
```deploy```      | Orion deployment tools            | 
```doc```         | Documentation for Orion           |
```docker```      | Docker support in Orion           |
```editor```      | The Orion editor                  |
```electron```    | The Electron app version of Orion |
```git```         | the GIT support in Orion          |
```js tools```    | The JavaScript tooling in Orion   |
```marketplace``` | The marketplace code for Orion    |
```orionhub```    | The web site for Orion            |
```releng```      | Releng scripts and tools for Orion|

As part of the initial triage process for a new bug or enhancement, a committer (or the filer of the bug) will set this tag.
If you don't know the particular component a bug belongs in, it is fine to omit this tag (it will get added later by a committer).

The next set of tags have to do with the state of the bug. As a bug moves along its lifcycle, additional tags
will be added and removed as needed to reflect this state.

The state tags are as follows:

Name              | Description                       |
:-----            | :-------                          |
```triaged```     | If a committer has looked at the bug, checking that all of the required information is present, this tag will be set. This tag only means that the bug has been filed correctly, not that it is valid, or that someone is working on it. | 
```needinfo```    | If the bug is mostly complete, but a committer has asked for more details, this tag will be added to the issue. The issue will not proceed in its lifecycle until the filer provides the requested information. If an issue sits in the triaged and needinfo state for too long, it will be closed.|
```bug```         | If a committer has looked at the issue and verified that the problem exists and is reproducable, this tag will be added. This tag does not mean that someone is actively working on the issue, just that the issue is valid.|
```enhancement``` | If a committer has looked at the request and determined it is suitable for Orion, this tag is added. This tag does not mean that someone is actively working on the issue, just that the issue is valid.|
```invalid```     | If the issue cannot be verified, or is spam, not appropriate for Orion, or is not an issue (something that would be better discussed on mattermost or the mailing list), this tag will be addedd and the issue closed.|
```wontfix```     | If the issue (mostly for enhancement requests) is not ever planned to be fixed, rather than leave the issue open as helpwanted, this tag will be added and the issue closed.|
```helpwanted```  | If the issue is valid (bug or enhancement), but no committers plan to work on it in the forseeable future, this tag will be added to request help from the community.|
```worksforme```  | If the issue filed has already been fixed, or the issue cannot be reproduced, this tag is applied and the issue closed.|

Once the state of the issue has been set, there is one remaining tag that will typically be set by a committer. The severity 
of the issue. The severity tags follow exactly the meaning from the [Eclipse bugzilla severities](https://wiki.eclipse.org/Eclipse/Bug_Tracking#Severity), except that we do not use ```normal``` or ```enhancement``` as severities.
The filer of the issue can set this tag if desired, but take note, setting a high severity for a trivial issue will **not** get it fixed any faster.

Our severity tags are as follows:

Name              | Description                       |
:-----            | :-------                          |
```blocker```     | Blocks development and/or testing work. No workaround exists.| 
```critical```    | Crashes, loss of data, severe memory leak.|
```major```       | Major loss of function.|
```minor```       | Minor loss of function, or other problem where easy workaround is present.|
```trivial```     | Cosmetic problem such as misspelled words or misaligned text.|

Now that we've seen the tags, lets see an example of how and when they might be applied.

###A valid bug example

A new issue has just been filed and the lifecycle begins.
1. The issue was created with the template and all required information has been provided. A committer will see this and add the ```triaged``` tag.
2. A day or so later, another committer looks at the issue, verifies it is a really bad problem, removes the ```triaged``` tag and adds the ```bug``` and ```critical''' tags.
3. Later that day, another committer fixes the bug, commits the fix using the proper commit message template, sets the milestone the bug was fixed in, and closes the issue.

###An invalid bug example
A new issue has just been filed and the lifecycle begins.
1. The issue was not created using the template, and the only comment on the issue is spam. A committer will add the ```invalid``` tag and close the issue.

There are many more examples that could be given for issue lifecycles, but in general it goes like this:
    new issue 
      -> triaged 
        -> bug or enhancement (stays open), severity and component added OR
        -> invalid, wontfix or worksforme (closed)
      -> fixed (closed)

##Closing Bugs

There is a finite set of states that lead to an issue being closed. They are:
1. The issue has been fixed
2. The issue is invalid, or cannot be reproduced
3. There are no plans to address the issue and it is marked as wontfix

Once an issue has been closed, it does not mean the end. An issue can be reopened (if the fix does not work, or someone decides
to work on a wontfix issue). Unless you have strong case for, or are willing to work on the issue, it is recommended to not reopen
wontfix issues (or they will be reclosed).

#Pull Requests

If you have a proposed fix for a bug, you can open a pull request (thank you!). Below are the guidlines to follow to help get your 
fix into Orion.
1. Sign the CLA. All contributors in Orion (and Eclipse as a whole) must sign the CLA. For more information on the CLA, see the 
[Contributor License Agreement][Contributor License Agreement] section above.
2. With the CLA signed, you are now ready to commit your fix to your forked repo. As part of the commit process, we require you use the following
template in your commit message:
``` 
	Short description (fixes #1234)

	Longer description here if necessary
```
3. With your commit message properly formatted, all thats left is to push the commit to your repo
and press the create pull request button. Thats it!