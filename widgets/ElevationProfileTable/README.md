Elevation Profile Widget
==========================

Elevation Profile is a configurable widget to display the elevation profile for a selected feature or a measured line along with a web map. This is very similar to the Elevation Profile Template [View it live](http://www.arcgis.com/apps/Elevations/index.html?webmap=8dd583ea3de64e40b92ea5a261d0c6c8) but with additional functionality. This widget is modeled after the Attribute Table where it is docked at the bottom of portion of the browser. 

## Sections
* [Features](#features)
* [Requirements](#requirements)
* [Instructions](#instructions)
* [Resources](#resources)
* [Issues](#issues)
* [Contributing](#contributing)
* [Licensing](#licensing)

#Features
Elevation Profile is a configurable widget to display the elevation profile for a selected feature or a digitized line along with a web map. This template uses the [Profile geoprocessing service](http://www.arcgis.com/home/item.html?id=3300cfc33ca74a9fac69d2e0f4ea46e5) to generate the elevation values along the profile. Additionally, it uses a Line Of Sight service to generate line of sight features. Please see the associated Python script that generate the line of sight features located in the Python directory of the zip file.

This widget will allow:

* Selection of existing polyline features (Popup will need to be enabled in the web map)
* Digitize a line or route
* Display Line of Sight for selected feature or digitized route


## Instructions
In order to develop and test widgets you need to deploy the Elevation Profile widget directory to the stemapp/widgets directory in your WebApp Builder installation. This widget is modeled after the Attribute Table widget. In order to add the Elevation Profile widget to your Web App Builder, please follow how the entry for the Attribute Table is added to the config.json.

## Resources
[New to Github? Get started here.](https://github.com/)

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