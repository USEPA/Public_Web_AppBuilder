///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/Color',
    'dojo/query',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/mouse',
    'dojo/dom-style',
    'dojo/_base/array',
    'dojo/ready',
    'dojo/dom-construct',

    'jimu/BaseWidget',
    'jimu/dijit/TabContainer',
    'jimu/utils',

    'dijit/form/Button',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/MenuSeparator',

    'esri/dijit/Directions',
    'esri/tasks/RouteParameters',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/geometry/jsonUtils',
    'esri/geometry/Point',
    'esri/graphic',
    'esri/layers/GraphicsLayer',
    'esri/tasks/locator',
    'esri/toolbars/draw',
    'esri/dijit/LocateButton',
    'esri/tasks/FeatureSet',
    'esri/symbols/PictureMarkerSymbol',
    'esri/tasks/ClosestFacilityTask',
    'esri/tasks/ClosestFacilityParameters',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/InfoTemplate',
    'esri/renderers/SimpleRenderer',
    'esri/urlUtils',
    'esri/geometry/webMercatorUtils',
    'esri/lang'
],
    function(declare, Color, query, lang, on, mouse, domStyle, Array, ready, domConstruct,
             BaseWidget, TabContainer, utils,
             Button, Menu, MenuItem, MenuSeparator,
             Directions, RouteParameters, SimpleMarkerSymbol, SimpleLineSymbol, jsonUtils, Point, Graphic, GraphicsLayer, Locator, Draw, LocateButton, FeatureSet, PictureMarkerSymbol, ClosestFacilityTask, ClosestFacilityParameters, Query, QueryTask, InfoTemplate, SimpleRenderer, urlUtils, webMercatorUtils, esriLang) {
        return declare([BaseWidget], {
            baseClass: "jimu-widget-locator",
            name: "Directions",
            _dijitDirections:null,
            _routeTaskUrl:"http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",
            _locatorUrl:"http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
            STOP_TYPE: {
                START: "start",
                STOP: "stop",
                END: "end"
            },
            stopType: null,
            ctxMenu: null,
            routeGraphicsLayer: null,
            evacAreaGraphicsLayer: null,
            evacRouteGraphicsLayer: null,
            locator: null,
            tabContainer: null,
            drawDirectionsToolbar: null,
            drawEvacToolbar: null,
            stopSymbol: null,
            barrierSymbol: null,
            routeParams: null,
            cfParams: null,
            cfTask: null,
            currentIncident: null,

            postCreate: function() {
                this.inherited(arguments);

                //Get route and locator information from the config.json file
                this.preProcessConfig();

                //Create the tab container for Directions and Evac tabs
                this.tabContainer = new TabContainer({
                    tabs: [
                        {
                            title: "Directions",
                            content: this.tabRoute
                        },
                        {
                            title: "Evacuation Areas",
                            content: this.tabEvacAreas
                        }
                    ],
                    selected: "Directions"
                }, this.mainTab);
                this.tabContainer.startup();
                utils.setVerticalCenter(this.tabContainer.domNode);

                //Configure the route parameters
                this.routeParams = new RouteParameters();
                var routeOptions = this.config.routeOptions;
                if(routeOptions){
                    if(routeOptions.directionsLanguage){
                        this.routeParams.directionsLanguage = routeOptions.directionsLanguage;
                    }
                    this.routeParams.directionsLengthUnits = routeOptions.directionsLengthUnits;
                    this.routeParams.directionsOutputType = routeOptions.directionsOutputType;
                    if(routeOptions.impedanceAttribute){
                        this.routeParams.impedanceAttribute = routeOptions.impedanceAttribute;
                    }
                    this.routeParams.barriers = new FeatureSet();
                    this.routeParams.outSpatialReference = {"wkid": 102100};
                }

                //Configurethe ClosestFacilityParameters object
                this.cfParams = new ClosestFacilityParameters();
                this.cfParams.impedenceAttribute = "Miles";
                this.cfParams.defaultCutoff= 30.0;
                this.cfParams.returnIncidents=false;
                this.cfParams.returnRoutes=true;
                this.cfParams.returnDirections=true;
                this.cfParams.defaultTargetFacilityCount = 1;
                //Create the ClosestFacilityTask object
                this.cfTask = new ClosestFacilityTask(this.config.closestFacilityUrl);

                //Directions dijit
                this._dijitDirections = new Directions({
                    map: this.map,
                    geocoderOptions: this.config.geocoderOptions,
                    routeParams: this.routeParams,
                    routeTaskUrl: this.config.routeTaskUrl,
                    dragging:true,
                    showClearButton:true
                }, this.directionController);
                this._dijitDirections.startup();

                //Create the routeGraphicsLayer. Add to map
                this.routeGraphicsLayer = new GraphicsLayer();
                this.map.addLayer(this.routeGraphicsLayer);

                //Create the evacAreaGraphicsLayer. Add to map
                this.evacAreaGraphicsLayer = new GraphicsLayer();
                this.map.addLayer(this.evacAreaGraphicsLayer);

                //Create the evacRouteGraphicsLayer. Create renderer and add to map
                this.evacRouteGraphicsLayer = new GraphicsLayer();
                var routePolylineSymbol = new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([89, 89, 35]),
                    10.0
                );
                var routeRenderer = new SimpleRenderer(routePolylineSymbol);
                this.evacRouteGraphicsLayer.setRenderer(routeRenderer);
                this.map.addLayer(this.evacRouteGraphicsLayer);

                //Create right-click context menu
                this.createContextMenu();
                //Remove context menu on mouse enter event onto the widget
                this.own(on(this, mouse.enter, lang.hitch(this, function(evt){
                    this.removeContextMenu();
                })));
                //Re-init context menu on mouse out event away from the widget
                this.own(on(this, mouse.leave, lang.hitch(this, function(evt){
                    this.reInitContextMenu();
                })));

                //Create a locator for geocoding addresses in the context menu
                this.locator = new Locator(this.config.locatorUrl);
                this.own(on(this.locator, 'location-to-address-complete', lang.hitch(this, this.geocodeLocationToAddressCompleteEvent)));

                //Draw toolbar for drawing evacuation points
                this.drawEvacToolbar = new Draw(this.map);
                this.own(on(this.drawPoint, "click", lang.hitch(this, this.bindDrawToolbar)));

                //Show current location using the GeoLocation object on the Evac tab
                this.own(on(this.currentLocation, "click", lang.hitch(this, this.getCurrentLocation)));
                //Clear button the on Evac tab
                this.own(on(this.btnClear, "click", lang.hitch(this, this.onClearBtnClicked)));
                //Search button on the Evac tab
                this.own(on(this.btnSearch, "click", lang.hitch(this, this.onSearchBtnClicked)));

                //Draw toolbar for the Add and Clear barriers button
                this.drawDirectionsToolbar = new Draw(this.map);

                //Once the widget DOM is rendered, add the Clear and Add Barriers button
                ready(lang.hitch(this, this.makeUIChanges()));

                //Stop and barrier symbols from esri.github.io site
                this.stopSymbol = this.createPictureSymbol("//esri.github.io/quickstart-map-js/images/blue-pin.png", 0, 12, 13, 24);
                this.barrierSymbol = this.createPictureSymbol("//esri.github.io/quickstart-map-js/images/red-dot-small.png", 0, 0, 16, 16);
            },

            /*
             Widget Events
             */
            onOpen: function () {
                //Listen for the click event on the clear button on the directions tab
                this.attachClearListener();
            },

            onClose: function () {
                //Remove the context menu when the widget closes
                this.removeContextMenu();
            },

            /*
             Context Menu Helper Functions
             */
            createContextMenu: function() {
                this.ctxMenu = new Menu({
                    onOpen: lang.hitch(this, function(box) {
                        currentRtClkLocation = this.getMapPointFromMenuPosition(box);
                    })
                });

                this.ctxMenu.addChild(new MenuItem({
                    label: "Directions from here",
                    onClick: lang.hitch(this, function(evt) {
                        this.removeGraphic(this.STOP_TYPE.START);
                        var graphic = new Graphic(currentRtClkLocation, null, {"TYPE":"start"});
                        this.routeGraphicsLayer.add(graphic);
                        this.stopType = this.STOP_TYPE.START;
                        this.geocodeCoordinates(currentRtClkLocation);
                    })
                }));

                if (this._dijitDirections.stops.length > 2) {
                    this.ctxMenu.addChild(new MenuItem({
                        label: "Add stop",
                        onClick: lang.hitch(this, function(evt) {
                            var graphic = new Graphic(currentRtClkLocation, null, {"TYPE":"start"});
                            this.routeGraphicsLayer.add(graphic);
                            this.stopType = this.STOP_TYPE.STOP;
                            this.geocodeCoordinates(currentRtClkLocation);
                        })
                    }));
                }

                this.ctxMenu.addChild(new MenuItem({
                    label: "Directions to here",
                    onClick: lang.hitch(this, function(evt) {
                        this.removeGraphic(this.STOP_TYPE.END);
                        var graphic = new Graphic(currentRtClkLocation, null, {"TYPE":"start"});
                        this.routeGraphicsLayer.add(graphic);
                        this.stopType = this.STOP_TYPE.END;
                        this.geocodeCoordinates(currentRtClkLocation);
                    })
                }));

                this.ctxMenu.startup();
                this.ctxMenu.bindDomNode(this.map.container);
            },

            removeContextMenu: function() {
                if (typeof(this.ctxMenu) !== 'undefined' && this.ctxMenu !== null) {
                    if (typeof(this.ctxMenu.domNode) !== 'undefined'){
                        domStyle.set(this.ctxMenu.domNode, 'display', 'none');
                        this.ctxMenu.destroy();
                        this.ctxMenu = null;
                    }
                }
            },

            populateStopInputBox: function(stopType, address) {
                //Updates the start, stop, and destination input boxes in the
                //directions dijit
                if (stopType === this.STOP_TYPE.START) {
                    this._dijitDirections.updateStop(address, 0);
                } else if (stopType === this.STOP_TYPE.STOP) {
                    this._dijitDirections.updateStop(address, this._dijitDirections.stops.length - 2);
                } else {
                    this._dijitDirections.updateStop(address, this._dijitDirections.stops.length - 1);
                }
            },

            reInitContextMenu: function() {
                //Recreates the context menu based on the mouse enter and leave events
                if (typeof(this.ctxMenu) !== 'undefined'){
                    this.createContextMenu();
                    if (typeof(this.ctxMenu.domNode) !== 'undefined'){
                        domStyle.set(this.ctxMenu.domNode, 'display', 'block');
                    }
                }
            },

            /*
             Directions Functions
             */
            attachClearListener: function() {
                //Function for when the click event is fired in the Directions dijit
                var nodeList = query('div .esriStopsClearDirections');
                if (nodeList.length > 0) {
                    this.own(on(nodeList[2], "click", lang.hitch(this, function(evt) {
                        this.routeGraphicsLayer.clear();
                        this._dijitDirections.reset();
                    })));
                }

                //Adds a listener to the "Add Destination" button.
                nodeList = query('div .esriStopsAddDestination');
                if (nodeList.length > 0) {
                    this.own(on(nodeList[0], "click", lang.hitch(this, function(evt) {
                        this._dijitDirections.updateStop(this._dijitDirections.stops[this._dijitDirections.stops.length - 2].name,
                            this._dijitDirections.stops.length - 1)
                        this._dijitDirections.updateStop("", this._dijitDirections.stops.length - 2);
                    })));
                }
            },

            removeGraphic: function(stopType) {
                //Removes the stop graphic from the routeGraphicsLayer
                if (this.routeGraphicsLayer.graphics.length > 0) {
                    var filteredGraphics = dojo.filter(this.routeGraphicsLayer.graphics, function(graphic) {
                        if (typeof(graphic.attributes) !== 'undefined') {
                            if (graphic.attributes.TYPE === stopType)
                                return graphic;
                        }
                    });
                    dojo.forEach(filteredGraphics, lang.hitch(this, function(g) {
                        if (typeof(g) !== 'undefined')
                            this.routeGraphicsLayer.remove(g);
                    }));
                    this.routeGraphicsLayer.redraw();
                }
            },

            /*
             Evacuation Area Functions
             */
            bindDrawToolbar: function (evt) {
                //Listen to draw end event when adding an Evac point
                this.own(on(this.drawEvacToolbar, "draw-end", lang.hitch(this, this.addLocation)));
                this.map.disableMapNavigation();
                this.drawEvacToolbar.activate("point");

                //Clear all graphic layers
                this.evacAreaGraphicsLayer.clear();
                this.evacRouteGraphicsLayer.clear();
                this.routeGraphicsLayer.clear();
            },

            getCurrentLocation: function(){
                //Uses GeoLocation to get user's current location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(lang.hitch(this,
                        function(position) {
                            //Shows current location on the map using the GeoLocation
                            var lat = position.coords.latitude;
                            var long = position.coords.longitude;
                            var pt = new Point(long, lat);
                            var graphic = new Graphic(pt, this.stopSymbol);
                            this.map.centerAndZoom(pt, 13);
                            this.evacAreaGraphicsLayer.clear();
                            this.evacAreaGraphicsLayer.add(graphic);
                            this.currentIncident = pt;
                        }), function(err) {
                        //Error retrieving current location
                        if(err.code == 1) {
                            alert("Error: Access is denied!");
                        } else if ( err.code == 2) {
                            alert("Error: Position is unavailable!");
                        } else {
                            alert("Error: " + err);
                        }
                    });
                } else {
                    alert("Geolocation is not supported by this browser");
                }
            },

            addLocation: function(evt) {
                //Deactivates the draw tool and adds an evac point to the map
                this.drawEvacToolbar.deactivate();
                this.map.enableMapNavigation();
                var attr = {"TYPE":"EVAC AREA START POINT"};
                var graphic = new Graphic(evt.geometry, this.stopSymbol, attr);
                this.evacAreaGraphicsLayer.add(graphic);
                this.currentIncident = evt.geometry;
            },

            onSearchBtnClicked: function(evt) {
                //Search button clicked in the Evac tab
                //Searches the evac areas layer
                if (this.evacAreaGraphicsLayer.graphics.length === 0)
                    return;
                var query = new Query();
                query.returnGeometry = true;
                query.outFields = ["*"];
                query.where = "1=1";

                var qt = new QueryTask(this.config.evacuationAreas);
                qt.execute(query, lang.hitch(this, this.showQueryResults));
            },

            showQueryResults: function(results) {
                //Retrieves all features from the evac area layer.
                //Creates facility stops
                //Creates incident point based on point clicked on the map by user or current location
                //Solves the closes facility
                var arrGraphics = []
                for (var i = 0; i < results.features.length; i++) {
                    arrGraphics.push(new Graphic(results.features[i].geometry));
                }
                var facilities = new FeatureSet();
                facilities.features = arrGraphics;
                this.cfParams.facilities = facilities;
                this.cfParams.outSpatialReference = this.map.spatialReference;

                var features = [];
                features.push(new Graphic(this.currentIncident));

                var test = webMercatorUtils.webMercatorToGeographic(this.currentIncident);

                var incidents = new FeatureSet();
                incidents.features = features;
                this.cfParams.incidents = incidents;

                this.cfTask.solve(this.cfParams, lang.hitch(this, function(solveResult) {
                    var directions = solveResult.directions;
                    array.forEach(solveResult.routes, lang.hitch(this, function(route, index){
                        //build an array of route info
                        var attr = array.map(solveResult.directions[index].features, function(feature){
                            return feature.attributes.text;
                        });
                        var infoTemplate = new InfoTemplate("Attributes", attr);

                        route.setInfoTemplate(infoTemplate);
                        route.setAttributes(attr);

                        this.evacRouteGraphicsLayer.clear();
                        this.evacRouteGraphicsLayer.add(route);
                        this.directionsDiv.innerHTML = esriLang.substitute(attr, "${*}");
                    }));
                }));
            },

            onClearBtnClicked: function(evt) {
                //Clear button clicked. Clear all graphic layers
                this.evacAreaGraphicsLayer.clear();
                this.evacRouteGraphicsLayer.clear();
                this.routeGraphicsLayer.clear();
            },

            /*
             Add and Clear Barriers Functions
             */
            addBarriers: function() {
                //this.own(on(this.map, "click", lang.hitch(this, this.addBarrier)));
                this.map.disableMapNavigation();
                this.drawDirectionsToolbar.activate("point");
                this.own(on(this.drawDirectionsToolbar, "draw-end", lang.hitch(this, this.addBarrier)))
            },

            addBarrier: function(evt) {
                this.drawDirectionsToolbar.deactivate();
                this.map.enableMapNavigation();
                if (this.routeGraphicsLayer.graphics.length > 0) {
                    for (var i = 0; i < this.routeGraphicsLayer.graphics.length; i++) {
                        var g = this.routeGraphicsLayer.graphics[i];
                        if (g.geometry === evt.geometry) {
                            return;
                        }
                    }
                }
                this.routeParams.barriers.features.push(
                    this.routeGraphicsLayer.add(
                        new Graphic(
                            evt.geometry, this.barrierSymbol, {"TYPE":"barrier"}
                        )
                    )
                );
            },

            clearBarriers: function(evt) {
                for (var i = this.routeGraphicsLayer.graphics.length - 1; i > -1 ; i--) {
                    var g = this.routeGraphicsLayer.graphics[i];
                    if (g.attributes) {
                        if (g.attributes["TYPE"] === "barrier") {
                            this.routeGraphicsLayer.remove(g);
                        }
                    }
                }
            },

            makeUIChanges: function(evt) {
                if (this._dijitDirections.domNode) {
                    var nodeList = query('.esriStopsGetDirectionsContainer', this._dijitDirections.domNode);
                    if (nodeList.length > 0) {
                        var parentDiv = nodeList[0];
                        //Display the Clear button
                        query(".esriLinkButton.esriStopsClearDirections", parentDiv).forEach(function(node, index, arr) {
                            if (node.innerHTML === "Clear") {
                                domStyle.set(node, "display", "inline-block");
                            }
                        });
                    }

                    //Add a div for the Add Barrier and Clear Barriers buttons
                    nodeList = query('.esriStopsOptionsMenu', this._dijitDirections.domNode);
                    if (nodeList.length > 0) {
                        var stopOptionsNode = nodeList[0];

                        //Create barriers div
                        var barriersDiv = domConstruct.create("div", {class: "esriStopsGetDirectionsContainer"});
                        domConstruct.place(barriersDiv, stopOptionsNode, "after");

                        //Create Add Barrier button
                        var n = domConstruct.create("div", {innerHTML: "Add Barrier", role: "button", tabindex: "0", class: "esriLinkButton esriStopsClearDirections", style: "display: inline-block"}, barriersDiv);
                        domConstruct.place(n, barriersDiv);
                        this.own(on(n, "click", lang.hitch(this, function(){
                            this.addBarriers();
                        })));

                        //Create Clear Barrier button
                        n = domConstruct.create("div", {innerHTML: "Clear Barriers", role: "button", tabindex: "0", class: "esriLinkButton esriStopsClearDirections", style: "display: inline-block"}, barriersDiv);
                        domConstruct.place(n, barriersDiv);
                        this.own(on(n, "click", lang.hitch(this, function(){
                            this.clearBarriers();
                        })));

                    }
                }
            },

            /*
             Geocode functions
             */
            geocodeCoordinates: function(coords) {
                this.locator.locationToAddress(coords, 100)
            },

            geocodeLocationToAddressCompleteEvent: function(evt) {
                if (evt.address.address) {
                    this.populateStopInputBox(this.stopType, this.printFullAddress(evt.address.address));
                }
            },

            printFullAddress: function(address) {
                var newAddress = [];
                if (typeof(address.Address) !== 'undefined') {
                    newAddress.push(address.Address);
                }
                if (typeof(address.City) !== 'undefined') {
                    newAddress.push(address.City);
                }
                if (typeof(address.Region) !== 'undefined') {
                    newAddress.push(address.Region)
                }
                if (typeof(address.Postal) !== 'undefined') {
                    newAddress.push(address.Postal);
                }
                if (typeof(address.CountryCode) !== 'undefined') {
                    newAddress.push(address.CountryCode);
                }
                return newAddress.join(", ");
            },

            /*
             General Helper Functions
             */
            preProcessConfig: function(){
                //Retrieve route and locator information from the config.json file
                if(!this.config.routeTaskUrl){
                    var routeTaskUrl = this.appConfig && this.appConfig.routeService && this.appConfig.routeService.url;
                    this.config.routeTaskUrl = routeTaskUrl||this._routeTaskUrl;
                }
                if(!this.config.locatorUrl){
                    var locatorUrl = this.appConfig && this.appConfig.geocodeService && this.appConfig.geocodeService.url;
                    this.config.locatorUrl = locatorUrl||this._locatorUrl;
                }
            },

            getMapPointFromMenuPosition: function(box) {
                //Get screen point from right click to display context menu
                var x = box.x, y = box.y;
                switch( box.corner ) {
                    case "TR":
                        x += box.w;
                        break;
                    case "BL":
                        y += box.h;
                        break;
                    case "BR":
                        x += box.w;
                        y += box.h;
                        break;
                }

                var screenPoint = new Point(x - this.map.position.x, y - this.map.position.y);
                return this.map.toMap(screenPoint);
            },

            createPictureSymbol: function(url, xOffset, yOffset, xWidth, yHeight) {
                return new PictureMarkerSymbol({
                    "angle": 0,
                    "xoffset": xOffset, "yoffset": yOffset, "type": "esriPMS",
                    "url": url,
                    "contentType": "image/png",
                    "width":xWidth, "height": yHeight
                });
            }

        });
    });