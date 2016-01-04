define(["dojo/Evented", "dijit/_WidgetBase", "dijit/_OnDijitClickMixin", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "dojo/on", "dojo/aspect", "dojo/_base/declare", "dojo/_base/lang", "dojo/json", "dojo/_base/Deferred", "dojo/_base/array", "dojo/number", "dijit/registry", "dijit/Dialog", "dijit/Toolbar", "dijit/ToolbarSeparator", "dijit/layout/ContentPane", "dijit/form/Button", "dijit/form/ToggleButton", "dijit/form/CheckBox", "put-selector/put", "dojo/dom-geometry", "dojo/dom-style", "dojo/dom-class", "dojo/query", "dojo/_base/Color", "dojo/colors", "dojo/fx/easing", "dojox/charting/Chart", "dojox/charting/axis2d/Default", "dojox/charting/plot2d/Grid", "dojox/charting/plot2d/Areas", "dojox/charting/plot2d/Columns", "dojox/charting/plot2d/Lines","dojox/charting/plot2d/MarkersOnly", "dojox/charting/action2d/MouseIndicator", "dojox/charting/action2d/TouchIndicator", "dojox/charting/themes/ThreeD", "esri/config", "esri/sniff", "esri/request", "esri/dijit/Measurement", "esri/tasks/Geoprocessor", "esri/geometry/Point", "esri/geometry/Polyline", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleMarkerSymbol", "esri/graphic", "esri/tasks/FeatureSet", "esri/tasks/LinearUnit", "esri/geometry/geodesicUtils", "esri/geometry/webMercatorUtils", "esri/Color", "esri/units", "dojo/i18n!esri/nls/jsapi", "dojo/i18n!./nls/strings", "dojo/text!./Widget.html", "xstyle/css!./css/style.css"], function (Evented, _WidgetBase, _OnDijitClickMixin, _TemplatedMixin, _WidgetsInTemplateMixin, on, aspect, declare, lang, JSON, Deferred, array, number, registry, Dialog, Toolbar, ToolbarSeparator, ContentPane, Button, ToggleButton, CheckBox, put, domGeometry, domStyle, domClass, query, Color, colors, easing, Chart, Default, Grid, Areas, Columns, Lines, MarkersOnly, MouseIndicator, TouchIndicator, ThreeD, esriConfig, esriSniff, esriRequest, Measurement, Geoprocessor, Point, Polyline, SimpleLineSymbol, SimpleMarkerSymbol, Graphic, FeatureSet, LinearUnit, geodesicUtils, webMercatorUtils, esriColor, Units, esriStrings, i18NStrings, dijitTemplate) {

    /**
     *  ElevationsProfile
     */
    return declare([_WidgetBase, _OnDijitClickMixin, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {

        declaredClass: "ElevationsProfile",
        baseClass: "elevationsProfile",
        templateString: dijitTemplate,

        /**
         *
         * @param options
         * @param srcRefNode
         */
        constructor: function (options, srcRefNode) {

            this.loaded = false;
            this.domNode = srcRefNode || put("div#profileChartNode");
            this.strings = i18NStrings;
            esriStrings.widgets.measurement.NLS_distance = this.strings.buttons.measureLabel;
            this.map = null;
            this.measureTool = null;
            this.profileService = null;
            //TODO
            this.showHelpAtStartup = options.showHelpAtStartup || null;
            this.chartColor = options.chartcolor;
            this.profileService = null;
            this.losService = null;
            this.applyLOS = null;
            this.losSeries = null;

            //Make sure we have required parameters
            if ((!options.map) || (!options.profileTaskUrl) || (!options.scalebarUnits)) {
                console.error(this.strings.errors.MissingConstructorParameters);

            } else {
                // MIXIN PARAMETERS //
                declare.safeMixin(this, options);

                // APPEND PROFILE TOOL NAME TO TASK URL //
                this.profileServiceUrl = lang.replace("{profileTaskUrl}/Profile", this);

                // APPEND LOS tool name to task url
                this.losServiceUrl = lang.replace("{losTaskUrl}/LOS", this);

                // DEFAULT SAMPLING POINT COUNT //
                this.samplingPointCount = 199;

                // CHART RENDERING OPTIONS //
                this.chartRenderingOptions = lang.mixin({
                    chartTitleFontSize: 13,
                    axisTitleFontSize: 11,
                    axisLabelFontSize: 9,
                    indicatorFontColor: "#eee",
                    indicatorFillColor: "#666",
                    titleFontColor: "#4B550C",
                    axisFontColor: "#4B550C",
                    axisMajorTickColor: "#4B550C",
                    skyTopColor: "#B0E0E6",
                    skyBottomColor: "#4682B4",
                    waterLineColor: "#eee",
                    waterTopColor: "#ADD8E6",
                    waterBottomColor: "#0000FF",
                    elevationLineColor: "#D2B48C",
                    elevationTopColor: "#8B4513",
                    elevationBottomColor: "#CD853F"
                }, options.chartOptions || {});

                // PROVIDE INSTANCE CONTEXT TO METHODS //
                this._showHelp = lang.hitch(this, this._showHelp);
                this._initMeasureTool = lang.hitch(this, this._initMeasureTool);
                this._initInfoWindow = lang.hitch(this, this._initInfoWindow);
                this._initProfileService = lang.hitch(this, this._initProfileService);
                this.displayProfileChart = lang.hitch(this, this.displayProfileChart);
                this.clearProfileChart = lang.hitch(this, this.clearProfileChart);
                this._updateProfileChart = lang.hitch(this, this._updateProfileChart);
                this._createProfileChart = lang.hitch(this, this._createProfileChart);
                this._getDisplayValue = lang.hitch(this, this._getDisplayValue);
                this._initLOSService = lang.hitch(this, this._initLOSService);
            }

        },

        /**
         *  POSTCREATE - CONNECT UI ELEMENT EVENTS
         */
        postCreate: function () {
            this.inherited(arguments);
            this.own(
                on(this._helpNode, "click", lang.partial(this._showHelp, false)),

                aspect.after(registry.getEnclosingWidget(this.domNode), "resize", lang.hitch(this, this._resizeChart), true)
            );

        },

        /**
         *  STARTUP THE DIJIT
         */
        startup: function () {
            this.inherited(arguments);
            if ((!this.map) || (!this.profileTaskUrl) || (!this.scalebarUnits)) {
                this.emit("error", new Error(this.strings.errors.MissingConstructorParameters));
                this.destroy();
            } else {
                if (this.map.loaded) {
                    this._initUI();
                } else {
                    this.map.on("load", this._initUI);
                }
            }
        },

        /**
         * INITIALIZE THE UI
         *
         * @private
         */
        _initUI: function () {

            // MAKE SURE WE HAVE ACCESS TO THE PROFILE SERVICE //
            this._initProfileService().then(lang.hitch(this, function () {

                if (this.showHelpAtStartup) {
                    this._showHelp(true);
                }
                this._initInfoWindow();
                this._initMeasureTool();
                this._updateProfileChart();
                this._initLineOfSightCheckBox();
                this._initLOSService();

                // DIJIT SUCCESSFULLY LOADED //
                this.loaded = true;

                this.emit("load", {});

            }), lang.hitch(this, function () {
                this.emit("error", new Error(this.strings.errors.InvalidConfiguration));
                this.destroy();
            }));

        },

        /**
         * Initialize the line of sight checkbox
         */
        _initLineOfSightCheckBox: function() {
            var chkBxLineOfSight = new CheckBox({
                name: "lineOfSight",
                value: "true",
                checked: false,
                onChange: lang.hitch(this, function(b) {
                    this.applyLOS = b;
                })
            }, this._lineOfSight);
            chkBxLineOfSight.startup();
        },

        /**
         * INITIALIZE THE PROFILE SERVICE
         *
         * @returns {*}
         * @private
         */
        _initProfileService: function () {
            var deferred = new Deferred();

            if (this.profileServiceUrl) {
                // MAKE SURE PROFILE SERVICE IS AVAILABLE //
                esriRequest({
                    url: this.profileServiceUrl,
                    content: {
                        f: "json"
                    },
                    callbackParamName: "callback"
                }).then(lang.hitch(this, function (taskInfo) {
                        // TASK DETAILS //
                        this.taskInfo = taskInfo;

                        // CREATE GP PROFILE SERVICE //
                        this.profileService = new Geoprocessor(this.profileServiceUrl);
                        this.profileService.setOutSpatialReference(this.map.spatialReference);

                        // SAMPLING DISTANCE //
                        this.samplingDistance = new LinearUnit();
                        this.samplingDistance.units = Units.METERS;

                        deferred.resolve();
                    }), lang.hitch(this, function (error) {
                        deferred.reject(error);
                    }));
            } else {
                deferred.reject(new Error(this.strings.errors.InvalidConfiguration));
            }

            return deferred.promise;
        },

        /**
         * INIT LOS Service
         *
         * @private
         */
        _initLOSService: function() {
            this.losService = new Geoprocessor(this.losServiceUrl);
            this.losService.setOutSpatialReference(this.map.spatialReference);
        },

        /**
         * CONNECT MAP INFOWINDOW EVENTS
         *
         * @private
         */
        _initInfoWindow: function () {
            this.map.infoWindow.on("selection-change", lang.hitch(this, this._mapFeatureSelectionChange));
            this.map.infoWindow.on("hide", lang.hitch(this, this.clearProfileChart));
        },

        /**
         * INITIALIZE ESRI MEASUREMENT DIJIT
         *
         * @private
         */
        _initMeasureTool: function () {

            // MEASUREMENT TOOL //
            this.measureTool = new Measurement({
                map: this.map,
                defaultAreaUnit: (this.scalebarUnits === "metric") ? Units.SQUARE_KILOMETERS : Units.SQUARE_MILES,
                defaultLengthUnit: (this.scalebarUnits === "metric") ? Units.KILOMETERS : Units.MILES
            }, this._measureNode);


            this.measureTool.startup();

            // Hide area and location tools since we don't use them
            this.measureTool.hideTool("area");
            this.measureTool.hideTool("location");

            //Activate then deactivate the distance tool to enable the measure units 
            on.once(this.measureTool, "tool-change", lang.hitch(this, function(){
                this.measureTool.setTool("distance", false);
                this.measureTool.clearResult();
            }));
            this.measureTool.setTool("distance", true);

            // Create profile on measure end 
            this.measureTool.on("measure-end", lang.hitch(this, this._onMeasureEnd));

            // Clear existing profiles when distance tool is clicked. 
            this.measureTool._distanceButton.on("click", lang.hitch(this, this._onMeasureClick));

            // Update the chart when units change 
            on(this.measureTool, "unit-change", lang.hitch(this, this._unitsChanged), true);

        },

        /**
         * MEASUREMENT DISTACE TOOL CLICK
         *
         * @private
         */
        _onMeasureClick: function () {
            this.clearProfileChart();
            this.map.infoWindow.clearFeatures();
            this.map.infoWindow.hide();
            this.emit("measure-distance-checked", {
                checked: this.measureTool._distanceButton.checked
            });
        },

        _onMeasureEnd: function (evt) {
            if (evt.toolName === "distance") {
                //Todo we should really list distance for both select and measure
                console.log(number.format(evt.values) + " " + evt.unitName);
                this.displayProfileChart(evt.geometry);
            }
        },

        /**
         * CLEARS ALL LOS GRAPHICS FROM MAP
         *
         * @private
         */
        _clearLOSGraphics: function() {
            var graphicList = [];
            array.forEach(this.map.graphics.graphics, lang.hitch(this, function(graphic) {
                if (typeof(graphic.attributes) !== "undefined") {
                    if (typeof(graphic.attributes.type) !== "undefined") {
                        if (graphic.attributes.type === "LOS") {
                            graphicList.push(graphic);
                        }
                    }
                }
            }));
            if (graphicList.length > 0) {
                array.forEach(graphicList, lang.hitch(this, function(graphic) {
                    this.map.graphics.remove(graphic);
                }));
            }
        },

        /**
         * Removes all vertical plots from the profile chart
         * @private
         */
        _clearLOSMarkers: function () {
            this.profileChart.updateSeries("losMarkers", [{x:0,y:0}]);
        },

        /**
         * DISPLAY HELP DIALOG
         *
         * @param hide
         * @private
         */
        _showHelp: function (hide) {
            if (this._helpDlg) {
                this._helpDlg.set("title", i18NStrings.display.elevationProfileTitle);
                this._helpDlg.show();
                if (hide) {
                    setTimeout(lang.hitch(this, function () {
                        this._helpDlg.hide();
                    }), 4000);
                }
            }
        },

        /**
         * MAP INFOWINDOW FEATURE SELECTION CHANGE
         *  - CALLED WHEN THE SELECTED FEATURE OF THE POPUP WINDOW CHANGES
         */
        _mapFeatureSelectionChange: function () {
            var selectedFeature = this.map.infoWindow.getSelectedFeature();
            var isPolyline = (selectedFeature && (selectedFeature.geometry.type === "polyline"));
            if (isPolyline) {
                this.displayProfileChart(selectedFeature.geometry);
            } else {
                this.clearProfileChart();
            }
        },

        _getProfile: function (polyline) {
            var deferred = new Deferred();
            //Convert web mercator polyline to geographic. 
            //Assume geographic if not in WM
            var geoPolyline = (polyline.spatialReference.isWebMercator()) ? webMercatorUtils.webMercatorToGeographic(polyline) : polyline;
            var profileLengthMeters = geodesicUtils.geodesicLengths([geoPolyline], Units.METERS)[0];
            var samplingDistance = (profileLengthMeters / this.samplingPointCount);

            // Create input feature set for GP Task
            var inputProfileGraphic = new Graphic(polyline, null, {
                OID: 1
            });
            var inputLineFeatures = new FeatureSet();
            inputLineFeatures.features = [inputProfileGraphic];
            // We need OID 
            inputLineFeatures.fields = [{
                "name": "OID",
                "type": "esriFieldTypeObjectID",
                "alias": "OID"
            }];

            this.profileService.execute({
                "InputLineFeatures": inputLineFeatures,
                "ProfileIDField": "OID",
                "DEMResolution": "FINEST",
                "MaximumSampleDistance": samplingDistance,
                "MaximumSampleDistanceUnits": "Meters",
                "returnZ": true,
                "returnM": true
            }).then(lang.hitch(this, function (results) {
                    if (results.length > 0) {
                        var profileOutput = results[0].value;
                        if (profileOutput.features.length > 0) {
                            var profileFeature = profileOutput.features[0];
                            // Set DEM resolution details
                            this._sourceNode.innerHTML = lang.replace("{0}: {1}", [this.strings.chart.demResolution, profileFeature.attributes.DEMResolution]);

                            // get profile geometry
                            var profileGeometry = profileFeature.geometry;
                            var allElevations = [];
                            var allDistances = [];

                            if (profileGeometry.paths.length > 0) {
                                // polyline paths
                                array.forEach(profileGeometry.paths, lang.hitch(this, function (profilePoints, pathIndex) {
                                    // elevation infos
                                    array.forEach(profilePoints, lang.hitch(this, function (coords, pointIndex) {
                                        var elevationInfo = {
                                            x: ((coords.length > 3) ? coords[3] : (pointIndex * samplingDistance)),
                                            y: ((coords.length > 2) ? coords[2] : 0.0),
                                            pathIdx: pathIndex,
                                            pointIdx: pointIndex,
                                            wmX: coords[0],
                                            wmY: coords[1]
                                        };
                                        allElevations.push(elevationInfo);
                                        allDistances.push(elevationInfo.x);
                                    }));
                                }));

                                // resolve task
                                deferred.resolve({
                                    geometry: profileGeometry,
                                    elevations: allElevations,
                                    distances: allDistances,
                                    samplingDistance: samplingDistance
                                });
                            } else {
                                deferred.reject(new Error(this.strings.errors.UnableToProcessResults));
                            }
                        } else {
                            deferred.reject(new Error(this.strings.errors.UnableToProcessResults));
                        }
                    } else {
                        deferred.reject(new Error(this.strings.errors.UnableToProcessResults));
                    }
                }), deferred.reject);

            return deferred.promise;
        },

        _executeLOS: function(polyline) {
            var deferred = new Deferred();

            //Convert web mercator polyline to geographic.
            //Assume geographic if not in WM
            var geoPolyline = (polyline.spatialReference.isWebMercator()) ? webMercatorUtils.webMercatorToGeographic(polyline) : polyline;
            var profileLengthMeters = geodesicUtils.geodesicLengths([geoPolyline], Units.METERS)[0];
            var samplingDistance = (profileLengthMeters / 199);

            // Create Red line symbol
            var redSym = new SimpleLineSymbol("solid", new esriColor([255,0,0]), 3);
            // Create Green line symbol
            var greenSym = new SimpleLineSymbol("solid", new esriColor([0,255,0]), 3);
            // Create point symbol
            var pointSymbol = new SimpleMarkerSymbol(
                SimpleMarkerSymbol.STYLE_DIAMOND, 8,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new esriColor([0, 0, 0]), 1),
                new esriColor([0, 0, 255]));
            // Create input feature set for GP Task
            var inputProfileGraphic = new Graphic(polyline, null, {});
            var inputLineFeatures = new FeatureSet();
            inputLineFeatures.features = [inputProfileGraphic];
            inputLineFeatures.fields = [];
            inputLineFeatures.geometryType = "esriGeometryPolyline";
            this.losService.execute({
                "InputFeatures": inputLineFeatures
            }).then(lang.hitch(this, function (results) {
                    if (results.length > 0) {
                        var losOutput = results[0].value;
                        var sr = results[0].value.spatialReference;
                        var attr = {"type": "LOS"};
                        if (losOutput.features.length > 0) {
                            var observationPointsList = [];
                            array.forEach(losOutput.features, lang.hitch(this, function(feature) {
                                var polylineJson = {
                                    "paths": feature.geometry.paths,
                                    "spatialReference": sr
                                }
                                var polylineGeom = new Polyline(polylineJson);
                                var polylineSym = feature.attributes.VisCode == 1 ? greenSym : redSym;
                                this.map.graphics.add(new Graphic(polylineGeom, polylineSym, attr));

                                if (feature.geometry.paths.length > 0) {
                                    observationPointsList.push({
                                        x: feature.geometry.paths[0][feature.geometry.paths.length-1][0],
                                        y: feature.geometry.paths[0][feature.geometry.paths.length-1][1]
                                    });
                                    this.map.graphics.add(new Graphic(new Point(
                                        feature.geometry.paths[0][feature.geometry.paths.length-1][0],
                                        feature.geometry.paths[0][feature.geometry.paths.length-1][1],
                                        sr), pointSymbol, attr));
                                } else {
                                    deferred.reject(new Error(this.strings.errors.UnableToProcessResults));
                                }
                            }));
                            deferred.resolve({
                                losObservationsPoints: observationPointsList
                            });
                        } else {
                            deferred.reject(new Error(this.strings.errors.UnableToProcessResults));
                        }
                    }  else {
                        deferred.reject(new Error(this.strings.errors.UnableToProcessResults));
                    }
                }), deferred.reject);
            return deferred.promise;
        },

        /**
         * DISPLAY PROFILE CHART
         *
         * @param geometry
         * @returns {*}
         */
        displayProfileChart: function (geometry) {
            this.map.setMapCursor("wait");
            this._getProfile(geometry).then(lang.hitch(this, function (elevationInfo) {
                this.elevationInfo = elevationInfo;
                this._updateProfileChart().then(lang.hitch(this, function () {
                    if (this.applyLOS) {
                        this.map.setMapCursor("wait");
                        this._executeLOS(geometry).then(lang.hitch(this, function (losInfo) {
                            this._updateProfileChartWithLosData(losInfo);
                            this.map.setMapCursor("default");
                        }), lang.hitch(this, function (error) {
                            this.map.setMapCursor("default");
                            alert(lang.replace("{message}\n\n{details.0}", error));
                            this.emit("error", error);
                        }));
                    }
                }), lang.hitch(this, function (error) {
                    this.map.setMapCursor("default");
                    this.emit("error", error);
                }));
                this.emit("display-profile", elevationInfo);
            }), lang.hitch(this, function (error) {
                this.map.setMapCursor("default");
                alert(lang.replace("{message}\n\n{details.0}", error));
                this.emit("error", error);
            }));
        },

        /**
         * CLEAR PROFILE CHART
         *
         * @private
         */
        clearProfileChart: function () {
            this.elevationInfo = null;
            this._clearLOSGraphics();
            this._updateProfileChart();
            this._clearLOSMarkers();
            this.emit("clear-profile", {});
        },

        /**
         * UPDATE PROFILE CHART
         *
         * @private
         */
        _updateProfileChart: function () {
            var deferred = new Deferred();
            this.map.setMapCursor("wait");
            this._createProfileChart(this.elevationInfo).then(lang.hitch(this, function () {
                this.map.setMapCursor("default");
                return deferred.resolve();
            }), lang.hitch(this, function (error) {
                this.map.setMapCursor("default");
                this.emit("error", error);
                return deferred.reject();
            }));
            return deferred.promise;
        },

        _getClosestValueInArray: function (num, arr) {
            var curr = arr[0].wmX;
            var idx = -1;
            var diff = Math.abs(num - curr);
            for (var val = 0; val < arr.length; val++) {
                var newDiff = Math.abs(num - arr[val].wmX);
                if (newDiff < diff) {
                    diff = newDiff;
                    curr = arr[val].wmX;
                    idx = val;
                }
            }
            return {
                nearestValue: curr,
                index: idx
            };
        },

        _updateProfileChartWithLosData: function (losInfo) {
            if (this.elevationData) {
                var itemList = [];
                array.forEach(losInfo.losObservationsPoints, lang.hitch(this, function(obsPoint) {
                    var found = false;
                    array.forEach(this.elevationData, lang.hitch(this, function(elevData, idx) {
                        if (elevData.wmX === obsPoint.x) {
                            itemList.push(idx);
                            found = true;
                        }
                    }));
                    if (!found) {
                        var nearestVal = this._getClosestValueInArray(obsPoint.x, this.elevationData);
                        itemList.push(nearestVal.index);
                    }
                }))
                if (itemList.length > 0) {
                    var losSeries = [];
                    array.forEach(this.elevationData, lang.hitch(this, function(elevData, idx) {
                        var seriesIdx = array.indexOf(itemList, idx);
                        if (seriesIdx !== -1) {
                            losSeries.push({
                                x: elevData.x,
                                y: elevData.y
                            });
                        }
                    }));


                    this.profileChart.dirty = true;
                    this.profileChart.addSeries("losMarkers", losSeries, {plot: "losMarkers"});
                    this.profileChart.movePlotToFront("losMarkers");
                    this.profileChart.render();
                }
            }
        },

        _unitsChanged: function(){
            //Check to see if the measure tool is active. If so call update profile chart
            if(this.measureTool._distanceButton.checked){
                //measure tool
                this._updateProfileChart();
            }else{
                //Feature Selection
                this._mapFeatureSelectionChange();
            }
        },
        /**
         * CREATE PROFILE CHART
         *
         * @param elevationInfo
         * @returns {*}
         * @private
         */
        _createProfileChart: function (elevationInfo) {
            var deferred = new Deferred();

            // CHART SERIES NAMES //
            var waterDataSeriesName = "Water";
            var elevationDataSeriesName = "ElevationData";

            // MIN/MAX/STEP //
            var yMin = -10.0;
            var yMax = 100.0;

            // DID WE GET NEW ELEVATION INFORMATION //
            if (!elevationInfo) {

                // CLEAR GRAPHIC FROM MAP //
                this._displayChartLocation(-1);

                // SAMPLING DISTANCE //
                this.samplingDistance.distance = (this.map.extent.getWidth() / this.samplingPointCount);

                // GEOMETRY AND ELEVATIONS //
                this.profilePolyline = null;
                var samplingDisplayDistance = this._convertDistancesArray([this.samplingDistance.distance])[0];
                this.elevationData = this._getFilledArray(this.samplingPointCount, samplingDisplayDistance, true);

                // CLEAR GAIN/LOSS AND SOURCE DETAILS //
                this._gainLossNode.innerHTML = "";
                this._sourceNode.innerHTML = "";

                // REMOVE ELEVATION INDICATORS //
                if (this.elevationIndicator) {
                    this.elevationIndicator.destroy();
                    this.elevationIndicator = null;
                }
                if (this.elevationIndicator2) {
                    this.elevationIndicator2.destroy();
                    this.elevationIndicator2 = null;
                }

            } else {

                // GEOMETRY, ELEVATIONS, DISTANCES AND SAMPLING DISTANCE //
                this.profilePolyline = elevationInfo.geometry;
                this.elevationData = this._convertElevationsInfoArray(elevationInfo.elevations);
                this.distances = this._convertDistancesArray(elevationInfo.distances);
                this.samplingDistance.distance = this._convertDistancesArray([elevationInfo.samplingDistance.distance])[0];

                // CALC MIN/MAX/STEP //
                var yMinSource = this._getArrayMin(this.elevationData);
                var yMaxSource = this._getArrayMax(this.elevationData);
                var yRange = (yMaxSource - yMinSource);
                yMin = yMinSource - (yRange * 0.05);
                yMax = yMaxSource + (yRange * 0.05);

                // GAIN/LOSS DETAILS //
                var detailsNumberFormat = {
                    places: 0
                };
                var elevFirst = this.elevationData[0].y;
                var elevLast = this.elevationData[this.elevationData.length - 1].y;
                var gainLossDetails = {
                    min: number.format(yMinSource, detailsNumberFormat),
                    max: number.format(yMaxSource, detailsNumberFormat),
                    start: number.format(elevFirst, detailsNumberFormat),
                    end: number.format(elevLast, detailsNumberFormat),
                    gainloss: number.format((elevLast - elevFirst), detailsNumberFormat)
                };
                this._gainLossNode.innerHTML = lang.replace(this.strings.chart.gainLossTemplate, gainLossDetails);

                // REMOVE ELEVATION INDICATORS //
                if (this.elevationIndicator) {
                    this.elevationIndicator.destroy();
                    this.elevationIndicator = null;
                }
                if (this.elevationIndicator2) {
                    this.elevationIndicator2.destroy();
                    this.elevationIndicator2 = null;
                }

                // MOUSE/TOUCH ELEVATION INDICATOR //
                var indicatorProperties = {
                    series: elevationDataSeriesName,
                    mouseOver: true,
                    font: "normal normal bold 9pt Tahoma",
                    fontColor: this.chartRenderingOptions.indicatorFontColor,
                    fill: this.chartRenderingOptions.indicatorFillColor,
                    markerFill: "none",
                    markerStroke: {
                        color: "red",
                        width: 3.0
                    },
                    markerSymbol: "m -6 -6, l 12 12, m 0 -12, l -12 12",
                    // RED X //
                    labelFunc: lang.hitch(this, function (obj) {
                        this._displayChartLocation(obj.x);
                        var elevUnitsLabel = this._getDisplayUnits(true);
                        var elevChangeLabel = number.format(obj.y, detailsNumberFormat);
                        return lang.replace("{0} {1}", [elevChangeLabel, elevUnitsLabel]);
                    })
                };
                // MOUSE/TOUCH ELEVATION CHANGE INDICATOR //
                var indicatorProperties2 = {
                    series: waterDataSeriesName,
                    mouseOver: true,
                    font: "normal normal bold 8pt Tahoma",
                    fontColor: this.chartRenderingOptions.indicatorFontColor,
                    fill: this.chartRenderingOptions.indicatorFillColor,
                    fillFunc: lang.hitch(this, function (obj) {
                        var elevIndex = this.distances.indexOf(obj.x);
                        if(elevIndex === -1){
                            return null;
                        }
                        var elev = this.elevationData[elevIndex].y;
                        return (elev >= elevFirst) ? "green" : "red";
                    }),
                    offset: {
                        y: 25,
                        x: 30
                    },
                    labelFunc: lang.hitch(this, function (obj) {
                        var elevIndex = this.distances.indexOf(obj.x);
                        if(elevIndex === -1){
                            return null;
                        }
                        var elev = this.elevationData[elevIndex].y;
                        var elevChangeLabel = number.format(elev - elevFirst, detailsNumberFormat);
                        var plusMinus = ((elev - elevFirst) > 0) ? "+" : "";
                        return lang.replace("{0}{1}", [plusMinus, elevChangeLabel]);
                    })
                };
                if (esriSniff("has-touch")) {
                    this.elevationIndicator2 = new TouchIndicator(this.profileChart, "default", indicatorProperties2);
                    this.elevationIndicator = new TouchIndicator(this.profileChart, "default", indicatorProperties);
                } else {
                    this.elevationIndicator2 = new MouseIndicator(this.profileChart, "default", indicatorProperties2);
                    this.elevationIndicator = new MouseIndicator(this.profileChart, "default", indicatorProperties);
                }
                this.profileChart.fullRender();
            }

            // FILLED ZERO ARRAY //
            var waterData = this._resetArray(this.elevationData, 0.0);

            // ARE WE UPDATING OR CREATING THE CHART //
            if (this.profileChart != null) {

                // UPDATE CHART //
                this.profileChart.getAxis("y").opt.min = yMin;
                this.profileChart.getAxis("y").opt.max = yMax;
                this.profileChart.getAxis("y").opt.title = lang.replace(this.strings.chart.elevationTitleTemplate, [this._getDisplayUnits(true)]);
                this.profileChart.getAxis("x").opt.title = lang.replace(this.strings.chart.distanceTitleTemplate, [this._getDisplayUnits(false)]);
                this.profileChart.dirty = true;
                this.profileChart.updateSeries(waterDataSeriesName, waterData);
                this.profileChart.updateSeries(elevationDataSeriesName, this.elevationData);

                // RENDER CHART //
                this.profileChart.render();
                deferred.resolve();

            } else {

                // MAKE SURE CHART NODE HAS VALID HEIGHT OR CHARTING WILL FAIL //
                var nodeCoords = domGeometry.position(this._chartNode, true);
                if (nodeCoords.h < 1) {
                    deferred.reject(new Error(this.strings.errors.InvalidConfiguration));
                }

                // CREATE CHART //
                this.profileChart = new Chart(this._chartNode, {
                    title: this.strings.chart.title,
                    titlePos: "top",
                    titleGap: 10,
                    titleFont: lang.replace("normal normal bold {chartTitleFontSize}pt verdana", this.chartRenderingOptions),
                    titleFontColor: this.chartRenderingOptions.titleFontColor
                });

                // SET THEME //
                this.profileChart.setTheme(ThreeD);

                // OVERRIDE DEFAULTS //
                this.profileChart.fill = "transparent";
                this.profileChart.theme.axis.stroke.width = 2;
                this.profileChart.theme.axis.majorTick.color = Color.named.white.concat(0.5);
                this.profileChart.theme.axis.majorTick.width = 1.0;
                this.profileChart.theme.plotarea.fill = {
                    type: "linear",
                    space: "plot",
                    x1: 50,
                    y1: 100,
                    x2: 50,
                    y2: 0,
                    colors: [{
                        offset: 0.0,
                        color: this.chartRenderingOptions.skyTopColor
                    },
                        {
                            offset: 1.0,
                            color: this.chartRenderingOptions.skyBottomColor
                        }]
                };

                // Y AXIS //
                this.profileChart.addAxis("y", {
                    min: yMin,
                    max: yMax,
                    fontColor: this.chartRenderingOptions.axisFontColor,
                    font: lang.replace("normal normal bold {axisLabelFontSize}pt verdana", this.chartRenderingOptions),
                    vertical: true,
                    natural: true,
                    fixed: true,
                    includeZero: false,
                    majorLabels: true,
                    minorLabels: true,
                    majorTicks: true,
                    minorTicks: true,
                    majorTick: {
                        color: this.chartRenderingOptions.axisMajorTickColor,
                        length: 6
                    },
                    title: lang.replace(this.strings.chart.elevationTitleTemplate, [this._getDisplayUnits(true)]),
                    titleGap: 30,
                    titleFont: lang.replace("normal normal bold {axisTitleFontSize}pt verdana", this.chartRenderingOptions),
                    titleFontColor: this.chartRenderingOptions.titleFontColor,
                    titleOrientation: "axis"
                });


                //Y2 AXIS for Line of sight
//                this.profileChart.addAxis("y2", {
//                    min: yMin, //0,
//                    max: yMax, //1.0,
//                    vertical: true,
//                    natural: true,
//                    fontColor: "whitesmoke",
//                    minorTicks: false,
//                    minorLabels: false,
//                    microTicks: false,
//                    leftBottom: false
//                });

                // X AXIS //
                this.profileChart.addAxis("x", {
                    fontColor: this.chartRenderingOptions.axisFontColor,
                    font: lang.replace("normal normal bold {axisLabelFontSize}pt verdana", this.chartRenderingOptions),
                    natural: true,
                    fixed: true,
                    includeZero: false,
                    majorLabels: true,
                    minorLabels: true,
                    majorTicks: true,
                    minorTicks: true,
                    majorTick: {
                        color: this.chartRenderingOptions.axisMajorTickColor,
                        length: 6
                    },
                    title: lang.replace(this.strings.chart.distanceTitleTemplate, [this._getDisplayUnits(false)]),
                    titleGap: 5,
                    titleFont: lang.replace("normal normal bold {axisTitleFontSize}pt verdana", this.chartRenderingOptions),
                    titleFontColor: this.chartRenderingOptions.titleFontColor,
                    titleOrientation: "away"
                });

                // GRID //
                this.profileChart.addPlot("grid", {
                    type: Grid,
                    hMajorLines: true,
                    hMinorLines: false,
                    vMajorLines: false,
                    vMinorLines: false
                });

                // PROFIlE PLOT //
                this.profileChart.addPlot("default", {
                    type: Areas,
                    tension: "X"
                });

                // WATER PLOT //
                this.profileChart.addPlot("water", {
                    type: Areas
                });

                // LOS PLOT //
                this.profileChart.addPlot("losMarkers", {
                    type: MarkersOnly
                });

                // WATER DATA //
                this.profileChart.addSeries(waterDataSeriesName, waterData, {
                    plot: "water",
                    stroke: {
                        width: 2.0,
                        color: this.chartRenderingOptions.waterLineColor
                    },
                    fill: {
                        type: "linear",
                        space: "plot",
                        x1: 50,
                        y1: 0,
                        x2: 50,
                        y2: 100,
                        colors: [{
                            offset: 0.0,
                            color: this.chartRenderingOptions.waterTopColor
                        },
                            {
                                offset: 1.0,
                                color: this.chartRenderingOptions.waterBottomColor
                            }]
                    }
                });

                // PROFILE DATA //
                this.profileChart.addSeries(elevationDataSeriesName, this.elevationData, {
                    plot: "default",
                    stroke: {
                        width: 1.5,
                        color: this.chartRenderingOptions.elevationLineColor
                    },
                    fill: {
                        type: "linear",
                        space: "plot",
                        x1: 50,
                        y1: 0,
                        x2: 50,
                        y2: 100,
                        colors: [{
                            offset: 0.0,
                            color: this.chartRenderingOptions.elevationTopColor
                        },
                            {
                                offset: 1.0,
                                color: this.chartRenderingOptions.elevationBottomColor
                            }]
                    }
                });

                // LOS DATA
                this.profileChart.addSeries("losMarkers",[{x:0,y:0}], {plot: "losMarkers", stroke: {color: "blue"}});

                // RENDER CHART //
                this.profileChart.render();
                deferred.resolve();
            }

            return deferred.promise;
        },

        /**
         * RESIZE PROFILE CHART
         *
         * @private
         */
        _resizeChart: function () {
            if (this.profileChart) {
                this.profileChart.resize();
            }
        },

        /**
         * DISPLAY CHART LOCATION AS RED X GRAPHIC ON MAP
         *
         * @param {Number} chartObjectX
         */
        _displayChartLocation: function (chartObjectX) {
            if (this.map && this.elevationData && this.profilePolyline) {

                if (!this.chartLocationGraphic) {
                    // CREATE LOCATION GRAPHIC //
                    var red = new Color(Color.named.red);
                    var outline = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, red, 3);
                    var chartLocationSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_X, 13, outline, red);
                    this.chartLocationGraphic = new Graphic(null, chartLocationSymbol); // RED X //
                    this.map.graphics.add(this.chartLocationGraphic);
                }

                // SET GEOMETRY OF LOCATION GRAPHIC //
                var distanceIndex = (this.distances) ? array.indexOf(this.distances, chartObjectX) : -1;
                if (distanceIndex >= 0) {
                    var elevData = this.elevationData[distanceIndex];
                    this.chartLocationGraphic.setGeometry(this.profilePolyline.getPoint(elevData.pathIdx, elevData.pointIdx));
                } else {
                    this.chartLocationGraphic.setGeometry(null);
                }
            }
        },

        /**
         * GET DISPLAY VALUE GIVEN A VALUE IN METERS AND THE DISPLAY UNITS
         * CONVERT FROM METERS TO MILES THEN FROM MILES TO DISPLAY UNITS
         *
         * @param {Number} valueMeters
         * @param {String} displayUnits
         */
        _getDisplayValue: function (valueMeters, displayUnits) {
            if (displayUnits === this.measureTool._unitStrings.esriMeters) {
                return valueMeters;
            } else {
                var distanceMiles = (valueMeters / this.measureTool._unitDictionary[this.measureTool._unitStrings.esriMeters]);
                return (distanceMiles * this.measureTool._unitDictionary[displayUnits]);
            }
        },

        /**
         * GET DISPLAY UNITS
         *
         * @param {Boolean} isElevation
         */
        _getDisplayUnits: function (isElevation) {
            var displayUnits = this.measureTool._unitDropDown.label;
            if (isElevation) {
                switch (displayUnits) {
                    case this.measureTool._unitStrings.esriMiles:
                        displayUnits = this.measureTool._unitStrings.esriFeet;
                        break;
                    case this.measureTool.esriYards:
                        displayUnits = this.measureTool.esriFeet;
                        break;
                    case this.measureTool._unitStrings.esriKilometers:
                        displayUnits = this.measureTool._unitStrings.esriMeters;
                        break;
                }
            }
            return displayUnits;
        },

        /**
         * CONVERT ELEVATION INFO (X=DISTANCE,Y=ELEVATION) FROM METERS TO DISPLAY UNITS
         *
         * @param elevationArray
         * @returns {Array}
         * @private
         */
        _convertElevationsInfoArray: function (elevationArray) {
            var displayUnitsX = this._getDisplayUnits(false);
            var displayUnitsY = this._getDisplayUnits(true);
            return array.map(elevationArray, lang.hitch(this, function (item) {
                return lang.mixin(item, {
                    x: this._getDisplayValue(item.x, displayUnitsX),
                    y: this._getDisplayValue(item.y, displayUnitsY)
                });
            }));
        },

        /**
         * CONVERT DISTANCES FROM METERS TO DISPLAY UNITS
         *
         * @param distancesArray
         * @returns {Array}
         * @private
         */
        _convertDistancesArray: function (distancesArray) {
            var displayUnitsX = this._getDisplayUnits(false);
            return array.map(distancesArray, lang.hitch(this, function (distance) {
                return this._getDisplayValue(distance, displayUnitsX);
            }));
        },

        /**
         * CREATE ARRAY WITH INPUT VALUE AND ALLOW MULTIPLIER
         *
         * @param size
         * @param value
         * @param asMultiplier
         * @returns {Array}
         * @private
         */
        _getFilledArray: function (size, value, asMultiplier) {
            var dataArray = new Array(size);
            for (var dataIdx = 0; dataIdx < size; ++dataIdx) {
                dataArray[dataIdx] = {
                    x: asMultiplier ? (dataIdx * value) : dataIdx,
                    y: asMultiplier ? 0.0 : (value || 0.0)
                };
            }
            return dataArray;
        },

        /**
         * RESET Y VALUES IN ARRAY
         *
         * @param dataArray
         * @param value
         * @returns {*}
         * @private
         */
        _resetArray: function (dataArray, value) {
            return array.map(dataArray, function (item) {
                return {
                    x: item.x,
                    y: value
                };
            });
        },

        /**
         * GET MAXIMUM Y VALUE IN ARRAY
         *
         * @param {[]} dataArray
         * @return {number}
         * @private
         */
        _getArrayMax: function (dataArray) {
            var values = array.map(dataArray, function (item) {
                return item.y;
            });
            return Math.max.apply(Math, values);
        },

        /**
         * GET MINIMUM Y VALUE IN ARRAY
         *
         * @param {[]} dataArray
         * @return {number}
         * @private
         */
        _getArrayMin: function (dataArray) {
            var values = array.map(dataArray, function (item) {
                return item.y;
            });
            return Math.min.apply(Math, values);
        },

        /**
         * DESTROY DIJIT
         */
        destroy: function () {
            if (this.profileChart) {
                this.profileChart.destroy();
            }
            this.inherited(arguments);
        }

    });
});