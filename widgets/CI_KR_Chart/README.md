# Critical Infrastructure and Key Resources
The Critical Infrastructure and Key Resources (CI/KR) widget allows users to determine affected infrastructure and demography based on user-selected location on the map. 

## Sections

* [Features](#features)
* [Requirements](#requirements)
* [Instructions](#instructions)
* [Resources](#resources)
* [Issues](#issues)
* [Contributing](#contributing)
* [Licensing](#licensing)

## Features
* Ability to allow user to draw a location on the map to perform demographic and critical infrastructure queries. 
* Displays demographic information and a list of affected infrastructures within the user drawn location.

## Requirements
* ArcGIS WebApp Builder v.1.2

## Instructions
* In order to develop and test the widget you need to deploy the CI/KR_Chart folder to the stemapp/widgets folder.  The stemapp/widgets folder can be found 
at \arcgis-web-appbuilder-1.2\client\stemapp\widgets in your WebApp Builder installation folder.
* Two feature services are necessary for the widget to function properly, a demographic feature service and an infrastructure feature service.  
* The url's to each service are located in the config.json file under their corresponding sections - "demographicLayer" & "infrastructureLayer"
* The 'title' field in the demographicLayer and the infrastructureLayer in config.json will be displayed in the corresponding content panes in the results section.

## Issues
* Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Esri welcomes contributions from anyone and everyone. Please see our [guidelines for contributing](https://github.com/esri/contributing).

If you are using [JS Hint](http://http://www.jshint.com/) there is a .jshintrc file included in the root folder which enforces this style.
We allow for 120 characters per line instead of the highly restrictive 80.

## Licensing
Copyright 2013 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's
[license.txt](license.txt) file.

[](Esri Tags: ArcGIS Defense and Intelligence Military Environment Planning Analysis Emergency Management Local-Government Local Government State-Government State Government Utilities)
[](Esri Language: Javascript)