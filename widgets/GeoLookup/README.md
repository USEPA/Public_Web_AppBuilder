

# GeoEnrich - Enrich local tabular .CSV content with defined poygon feature map services
The GeoEnrich widget allows users to drag and drop a local comma delimited file that contains point location data (lat/long) per record and will subsequently attach user selected attribution from a uniquely identified polygon feature service. Each point created by the data within the local CSV will be intersected with the polygon data and in turn the user selected fields and respective data from the feature service will mapped, attached and returned as a new enriched .CSV. 

Usage examples: 
* a telecom needs to determine service levels (offer products and services) from a table of customer locations. service levels are determined by the intersection of customer data with service level polygons from an easy to use interface
* a sales manager needs to determine which prospective customer locations lie within defined sales territories

Important Note: 
## Sections

* [Features](#features)
* [Requirements](#requirements)
* [Instructions](#instructions)
* [Resources](#resources)
* [Issues](#issues)
* [Contributing](#contributing)
* [Licensing](#licensing)

## Features

<<<<<<< HEAD:GeoLookup/README.md
* Select by Polygon Layer.
* Select by Shape.
* Ability to select from any type of feature class.
* Ability to select type of spatial relationship between features and user selection..
* Set style of symbol for drawn shape.
* Set style of symbol for selected features.
=======
=======
>>>>>>> origin/master:GeoEnrich/README.md

## Requirements
* ArcGIS WebApp Builder Beta 1.

## Instructions
Deploying Widget

Setting Up Repository for Development
In order to develop and test widgets you need to deploy the BatchEditor folder to the stemapp/widgets directory in your WebApp Builder installation. If you use Github for windows this can be accomplished using the following steps.

1. Sync the repository to your local machine.
2. Close Open the Repository in Windows Explorer
3. Close Github for Windows
4. Cut and paste the entire BatchEditor folder into the stemapp/widgets folder
5. Launch Github for Windows and choose the option to locate the repository. This will change the location on disk to the new location. 

### General Help
[New to Github? Get started here.](http://htmlpreview.github.io/?https://github.com/Esri/esri.github.com/blob/master/help/esri-getting-to-know-github.html)

## Resources

* Learn more about Esri's [Solutions for ArcGIS](http://solutions.arcgis.com/).

## Issues

* Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Esri welcomes contributions from anyone and everyone. Please see our [guidelines for contributing](https://github.com/esri/contributing).

All web application produced follow Esri's tailcoat style guide
http://arcgis.github.io/tailcoat/styleguides/css/

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

[](Esri Tags: ArcGIS Gas Electric Telco Telecommunications Utilities)
[](Esri Language: Javascript)
