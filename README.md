##GitHub Guidance for EPA’s Public Geospatial Developer Community
=========
####Governance
A full guidance document describing the Web Application Builder Oversight Team (WABOT), GitHub roles and responsibilities, the collaborator account request process, and workflows for the private version of this repository is available on the EPA SharePoint site here:
https://usepa.sharepoint.com/sites/oei/GISWORKGROUP/Developer
(EPA SharePoint login is required.)  

####Developer’s workflow:

EPA’s repositories for Web Application Builder (WAB) are configured with Esri’s production WAB repo as the upstream parent, which facilitates synchronization and reconciliation as new versions are released.  As directed, EPA delegated administrators will monitor Esri’s repo for new releases and stage, merge/reconcile, and test the new updates before pushing them to production.  
We encourage collaborators (regions/START contractors) to fork EPA's repository to add additional customizations – to revise the look and feel or develop custom widgets. Collaborators may synchronize with the master repository on their own schedule, and are expected to contribute widgets and modules back to the public or master repositories frequently via pull requests.

####Private versus Public Repositories:
In the WAB context, we expect that the full, complete, master repository may include sensitive or proprietary code in the form of widgets.  A second, public version of the application that excludes these modules is maintained by using the Public WAB branch of the private repository, and then synchronizing that public branch with an actual public repository (https://github.com/USEPA/Public_Web_AppBuilder).  This reconciliation/synchronization process must be performed by a full administrator.  See figure below.

![figure 1](https://github.com/USEPA/Public_Web_AppBuilder/blob/master/docs/EPA_WAB_Repository_Structure.png)

####Submitting to the Public Repository:
In order to submit changes/Widgets to the [Public Repository](https://github.com/USEPA/EPA_Public_Esri_Web_AppBuilder) follow the guidance steps below. The Public repository consists of one master branch. Changes and addition should be committed to this branch. 

1.	[Fork the repository](https://help.github.com/articles/fork-a-repo/) in [GitHub](https://github.com/). This will create a copy of the repository under your Github account.
2.	This forked repository can then be cloned to a local machine.  In the cloned repository complete changes and additions (widgets). Commit them to the cloned repository.
3.	Once the additions or changes (widgets) have been committed to the cloned repository use your git client([GitHub for Windows](https://windows.github.com/), [SourceTree](http://www.sourcetreeapp.com/), etc.) to push your commit to your forked repository in your GitHub account.
4.	At this point your additions and changes (widgets) are ready for submission back into the [Public repository](https://github.com/USEPA/EPA_Public_Esri_Web_AppBuilder).  To do this submit a [pull request](https://help.github.com/articles/using-pull-requests/) to the [Public repository](https://github.com/USEPA/EPA_Public_Esri_Web_AppBuilder). This will notify the repository administrator of your pull request. The administrator will seek approval of the pull request from the Web Application Builder Oversight Committee. Once a decision has been made by the Web Application Builder Oversight Committee the administrator will approve or deny the pull request based on the decision of the Web Application Builder Oversight Committee.

Note:  We recommend developers follow the ESRI JavaScript tailcoat code style guide: http://arcgis.github.io/tailcoat/styleguides/js/

