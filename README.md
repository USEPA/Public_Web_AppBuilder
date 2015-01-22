##GitHub Guidance for EPA’s Geospatial Developer Community
=========
This document is intended to be a general guidance document of roles, responsibilities, and best practices for managing an EPA GitHub repository for Geospatial Developers.
####GitHub
GitHub is a collaborative code version control system that allows fine-grained control over and visibility into all code edits made by a diverse developer community, while providing tools and workflows that streamline reconciliation of versions, branches, and forks.  The EPA has a diverse developer community – geographically disparate, a mix of federal employees and contractors with different backgrounds - and as a result, code sharing and reuse has suffered.  The agency has a GitHub subscription to provide a platform for this diverse community to preserve autonomy but still easily share code and collaborate in a structured, cohesive manner.  
Different organizations have developed workflows and governance around GitHub that reflect their own culture and the nature of their work.  There is no single right way to use GitHub, however, there are some best practices that have emerged as organizations have learned the same lessons and shared those experiences with others.  This document will attempt to provide a governance and standard workflow based on these best practices and oriented around the EPA’s culture, but it should not be viewed as an SOP written in stone – GitHub provides excellent tools for discussion and revision, so the developer community is encouraged to participate in an ongoing consensus-building process around the tasks and rules that serve everyone best.

####Roles and responsibilities:
Three basic roles are proposed for the EPA private GitHub repository.  All administrators, both EPA and Delegated, belong to a GitHub “Team” that allows full write access to the master private repository.  Collaborators belong to a team that allows read access to the private repository and the ability to submit pull requests for review.

**EPA Administrators** - federal employees with some experience reading and writing code

  *Responsibilities:*
  *	Maintain familiarity with GitHub, WAB, and the EPA guidance for both
  *	Review and approve pull requests or ensure that requests are reviewed by an appropriate party
  *	Engage in online dialog on functionality and widgets as well as workflow and governance
  *	Participate in conference calls as scheduled

**Delegated Administrators** – federal employees or contract staff with significant experience managing code in GitHub

  *Responsibilities (as directed):*
  *	Merge/reconcile code with new releases from Esri
  *	Maintain EPA look-and-feel in alignment with web workgroup
  *	Review pull requests from collaborators
  *	Deploy production code on EPA servers
  *	Engage in online dialog on functionality and widgets as well as workflow and governance
  *	Participate in conference calls as scheduled

**Collaborators** – federal employees or contract staff who use WAB, have JavaScript coding experience, and wish to develop widgets and other customizations for their own needs

  *Responsibilities:*
  *	Fork from EPA repo for customization and development
  *	Contribute improvements and widgets back to EPA repo
  *	Engage in online dialog on functionality and widgets as well as workflow and governance

####Developer’s workflow:

EPA’s private repository for WAB is configured with Esri’s production WAB repo as its upstream parent, which facilitates synchronization and reconciliation as new versions are released.  As directed, EPA delegated administrators will monitor Esri’s repo for new releases and stage, merge/reconcile, and test the new updates before pushing them to production.  
The only reason for collaborators (regions/START contractors) to fork main EPA repository is for customization – revise look and feel for a region, or develop custom widgets. Collaborators can fork the repository. The forked repository remains private (but appears in the collaborator’s account instead of the main EPA account) and then the fork can be synchronized, and/or improvements could be pushed back.
Collaborators may synchronize with the master repository on their own schedule, and are encouraged to contribute widgets and modules back to the public or master repositories frequently via pull requests.
Forking appears to be the preferred approach over branching:
http://blogs.atlassian.com/2013/05/git-branching-and-forking-in-the-enterprise-why-fork/

Note:  We may want to officially adopt or reproduce the ESRI JavaScript tailcoat code style guide: http://arcgis.github.io/tailcoat/styleguides/js/

####Private versus Public Repositories:
In the WAB context, we expect that the full, complete, master repository may include sensitive or proprietary code in the form of widgets.  A second, public version of the application that excludes these modules is maintained by using the Public WAB branch of the private repository, and then synchronizing that public branch with an actual public repository (https://github.com/USEPA/EPA_Public_Esri_Web_AppBuilder).  This reconciliation/synchronization process must be performed by a full administrator.  See figure below.

![figure 1](https://github.com/USEPA/EPA_Esri_Web_AppBuilder/blob/master/docs/EPA_WAB_Repository_Structure.png)

####Submitting to the Public Repository:
In order to submit changes/Widgets to the [Public Repository](https://github.com/USEPA/EPA_Public_Esri_Web_AppBuilder) follow the guidance steps below. The Public repository consists of one master branch. Changes and addition should be committed to this branch. 

1.	[Fork the repository](https://help.github.com/articles/fork-a-repo/) in [GitHub](https://github.com/). This will create a copy of the repository under your Github account.
2.	This forked repository can then be cloned to a local machine.  In the cloned repository complete changes and additions (widgets). Commit them to the cloned repository.
3.	Once the additions or changes (widgets) have been committed to the cloned repository use your git client([GitHub for Windows](https://windows.github.com/), [SourceTree](http://www.sourcetreeapp.com/), etc.) to push your commit to your forked repository in your GitHub account.
4.	At this point your additions and changes (widgets) are ready for submission back into the [Public repository](https://github.com/USEPA/EPA_Public_Esri_Web_AppBuilder).  To do this submit a [pull request](https://help.github.com/articles/using-pull-requests/) to the [Public repository](https://github.com/USEPA/EPA_Public_Esri_Web_AppBuilder). This will notify the repository administrator of your pull request. The administrator will seek approval of the pull request from the Web Application Builder Oversight Committee. Once a decision has been made by the Web Application Builder Oversight Committee the administrator will approve or deny the pull request based on the decision of the Web Application Builder Oversight Committee.

Once the pull request has been approved the administrator will then synchronize the Public Repository with the Public WAB branch of the Private Repository and merge the Public WAB branch with the master branch. This will move the newly submitted change into the Private Repository.

####Submitting to the Private Repository:
In order to submit changes/Widgets to the Private Repository follow the guidance steps below. The Private repository consists of a master branch and a branch called Public WAB. If changes or widgets need to be added that are to stay in the private repository then commits should be posted to the master branch. Changes and widgets that are to be made public should be posted to the Public WAB branch. The containing folder for widgets and themes should be nameed with the widget or theme name followd by public or private (widgetName_private). This will designate the private or public availability of the widget. Those changes will then be merged into the Public Repository by an administrator. 

1.	Fork the repository in [GitHub](https://github.com/). This will create a copy of the repository under your Github account.
2. This forked repository can then be cloned to a local machine.  In the cloned repository complete changes and additions (widgets). Commit them to appropriate branch(master/Public WAB) in the cloned repository.
3. 3.	Once the additions or changes (widgets) have been committed to the cloned repository use your git client([GitHub for Windows](https://windows.github.com/), [SourceTree](http://www.sourcetreeapp.com/), etc.) to push your commit to your forked repository in your GitHub account.
4. At this point your additions and changes (widgets) are ready for submission back into the Private WAB repository.  To do this submit a [pull request](https://help.github.com/articles/using-pull-requests/) from the forked Private repository. This will notify the repository administrator of your pull request. The administrator will seek approval of the pull request from the Web Application Builder Oversight Committee. Once a decision has been made by the Web Application Builder Oversight Committee the administrator will approve or deny the pull request based on the decision of the Web Application Builder Oversight Committee.

Once the pull request has been approved, the administrator will make the appropriate merges to add the changes/widgets to the appropriate.


