Elevation Profile Widget
==========================

Elevation Profile is a configurable widget that displays the elevation profile for a selected feature or a measured line along with a web map. This is very similar to the Elevation Profile Template ([View it live](http://www.arcgis.com/apps/Elevations/index.html?webmap=8dd583ea3de64e40b92ea5a261d0c6c8)), but with additional functionality. This widget is modeled after the Attribute Table; in that it is docked along the bottom edge of the browser. This widget requires the developer edition of WebApp Builder, version 1.1 or higher.

## Sections
* [Features](#features)
* [Requirements](#requirements)
* [Instructions](#instructions)
* [Resources](#resources)
* [Issues](#issues)
* [Contributing](#contributing)
* [Licensing](#licensing)

## Features
Elevation Profile is a configurable widget that displays elevation profile for a selected feature or a digitized line in a web map. This template requires an elevation profile service (provided from [ArcGIS Online](http://elevation.arcgis.com/arcgis/rest/services/Tools/ElevationSync/GPServer/Profile)) to generate the elevation values along the profile, and a Line Of Sight service to generate line-of-sight features. Please see the associated Python script that generates the line-of-sight features located in the [scripts](https://github.com/Esri/solutions-webappbuilder-widgets/tree/master/ElevationProfileTable/scripts) directory.

This widget will allow:

* Selection of existing polyline features (Popup will need to be enabled in the web map)
* Digitize a line or route
* Display Line of Sight for selected feature or digitized route

## Requirements
This widget requires the developer edition of WebApp Builder. It supports versions 1.1 and 1.2.

## Instructions
In order to develop and test widgets you need to deploy the Elevation Profile widget directory to the /stemapp/widgets directory in your WebApp Builder installation. In order to add the Elevation Profile Table widget to your developer edition of Web App Builder, please follow these steps:

1. Copy the Elevation Profile Table widget directory to <Web App Builder location>/client/stemapp/widgets
2. Open <Web App Builder location>/client/stemapp/config.json and add an entry for the Elevation Profile Table widget:
``` 
    {
        "uri": "widgets/ElevationProfileTable/Widget",
        "positionRelativeTo": "browser"
    }
```
3. Open <Web App Builder location>/stemapp/predefined-apps/default/config.json and add an entry for the Elevation Profile Table widget:
```
    {
    	"uri": "widgets/ElevationProfileTable/Widget",
    	"positionRelativeTo": "browser",
    	"version": "1.2"
    }
```
4. Open <Web App Builder location>/stemapp/themes/FoldableTheme/layouts/default/config.json and add an entry for the Elevation Profile Table widget:
```
    {
    	"uri": "widgets/ElevationProfileTable/Widget",
    	"positionRelativeTo": "browser",
    	"version": "1.2"
    }
```
The [LOS toolbox](https://github.com/Esri/solutions-webappbuilder-widgets/blob/master/ElevationProfileTable/scripts/LOS.tbx) and [los.py](https://github.com/Esri/solutions-webappbuilder-widgets/blob/master/ElevationProfileTable/scripts/los.py) script should be used as a general guide during the creation of line-of-sight Geoprocessing service. Please make the necessary changes to the script in order to consume your own Digital Elevation Model (DEM) (please look at line 8 of the [los.py](https://github.com/Esri/solutions-webappbuilder-widgets/blob/master/ElevationProfileTable/scripts/los.py) script). 

NOTE: If you intend to select features (instead of digitizing your line), ensure that the web map has pop-ups enabled. This will allow for features to be selected.

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
