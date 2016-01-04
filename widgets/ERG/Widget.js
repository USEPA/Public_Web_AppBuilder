define([
  "dojo/_base/declare",
  "dijit/_WidgetsInTemplateMixin",
  "jimu/BaseWidget",
  "jimu/dijit/TabContainer",
  "./List",
  "jimu/utils",
  "esri/config",
  "esri/urlUtils",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "esri/tasks/Geoprocessor",
  "esri/tasks/FeatureSet",
  "esri/layers/GraphicsLayer",
  "esri/graphic",
  "esri/geometry/Point",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/PictureMarkerSymbol",
  "esri/geometry/Polyline",
  "esri/symbols/SimpleLineSymbol",
  "esri/geometry/Polygon",
  "esri/symbols/SimpleFillSymbol",
  "esri/toolbars/draw",
  "esri/InfoTemplate",
  "esri/request",
  "esri/graphicsUtils",
  "esri/geometry/webMercatorUtils",
  "dojo/_base/Color",
  "dijit/Dialog",
  "dijit/ProgressBar",
  "dijit/form/NumberSpinner",
  "dojo/_base/lang",
  "dojo/on",
  "dojo/dom",
  "dojo/dom-style",
  "dijit/form/Select",
  "dijit/form/TextBox",
  "esri/geometry/jsonUtils",
  "dojox/charting/Chart", "dojox/charting/axis2d/Default", "dojox/charting/plot2d/Lines", "dojox/charting/plot2d/Bars", "dojox/charting/plot2d/Pie",
  "dojox/charting/plot2d/Columns", "dojox/charting/action2d/Tooltip", "dojo/fx/easing", "dojox/charting/action2d/MouseIndicator", "dojox/charting/action2d/Highlight",
  "dojox/charting/action2d/MoveSlice", "dojox/charting/themes/MiamiNice", "dojox/charting/action2d/Magnify",
  "dojo/_base/array",
  "dojo/_base/html",
  "esri/tasks/RelationParameters",
  "esri/layers/FeatureLayer",
  "jimu/dijit/DrawBox",
  "dojo/query",
  "dojo/dom-construct",
  "./FacilitiesPane",
  "dojox/json/ref"
],
  function (declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, List, utils, esriConfig, urlUtils, Query, QueryTask, Geoprocessor, FeatureSet, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, PictureMarkerSymbol, Polyline, SimpleLineSymbol, Polygon, SimpleFillSymbol, Draw, InfoTemplate, esriRequest, graphicsUtils, webMercatorUtils, Color, Dialog, ProgressBar, NumberSpinner, lang, on, dom, domStyle, Select, TextBox, jsonUtils, Chart, Default, Lines, Bars, Pie, Columns, Tooltip, easing, MouseIndicator, Highlight, MoveSlice, MiamiNice, Magnify, array, html, RelationParameters, FeatureLayer, DrawBox, query, domConstruct, FacilitiesPane, ref) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-erg',
      name: 'ERG',
      ERGPChemicalList: [],
      ERGPlacardList: [],
      defaultERGName: null,
      spillGraphicsLayer: null,
      ergGraphicsLayer: null,
      facilitiesGraphicsLayer: null,
      chemicalOrPlacard: "Chemical",
      selectedSpillSize: "Large",
      selectedTimeOfSpill: "Day",
      selectedMaterialType: null,
      selectedWindDir: 45,
      defaultChemicalName: null,
      defaultPlacardName: null,
      ergGPChemicalService: null,
      ergGPPlacardService: null,
      ergGPJobID: null,
      ergGPActive: null,
      executionType: null,
      findNearestWSService: null,
      windDirectionQueryTask: null,
      weatherStationDistanceInfo: null,
      facilitiesQueryTask: null,
      chartLayer: null,
      charts: [],
      currentChartIndex: -1,

      //widget control events
      onChangeCalculateBy: function (newValue) {
        this.chemicalOrPlacard = newValue;
        this.materialType.removeOption(this.materialType.getOptions());
        if (newValue === "Chemical") {
          this.materialType.addOption(this.ERGPChemicalList);
          this.selectedMaterialType = this.defaultChemicalName;
        }
        else if (newValue === "Placard") {
          this.materialType.addOption(this.ERGPlacardList);
          this.selectedMaterialType = this.defaultPlacardName;
        }
      },

      onChangeSpillSize: function (newValue) {
        this.selectedSpillSize = newValue;
      },

      onChangeTimeOfSpill: function (newValue) {
        this.selectedTimeOfSpill = newValue;
      },

      onChangeMaterialType: function (newValue) {
        this.selectedMaterialType = newValue;
      },

      onWindDirChange: function (newValue) {
        this.selectedWindDir = newValue;
      },

      onClearBtnClicked: function () {
        this.spillGraphicsLayer.clear();
        this.ergGraphicsLayer.clear();
        this.facilitiesGraphicsLayer.clear();
        this.chartLayer.clear();
        this._clearCharts();
      },

      //GP Service callbacks
      ERGRequestSucceeded: function (data) {
        this.executionType = data.executionType;
        var materials = data.parameters[1];
        var choiceList = materials.choiceList;
        var option = [];

        this.defaultERGName = materials.defaultValue;

        for (var i = 0; i < choiceList.length; i++) {
          option[i] = {};
          option[i].label = choiceList[i];
          option[i].value = choiceList[i];
          if (choiceList[i] === this.defaultERGName) {
            option[i].selected = true;
          }
        }

        if (materials.name === "placard_id") {
          this.ERGPlacardList = option;
          this.defaultPlacardName = this.defaultERGName;
        }

        else if (materials.name === "material_type") {
          this.ERGPChemicalList = option;
          this.defaultChemicalName = this.defaultERGName;
          this.materialType.addOption(option);
        }
      },

      queryFacilitiesLayer: function (geom) {
        var query = new Query();
        query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
        query.geometry = geom;
        query.outFields = this.config.facilitiesLayer.fields;
        query.returnGeometry = true;

        var data = {};
        data.layerInfo = this.config.chartLayers;
        data.geometry = geom;
        this.publishData(data);

        this.facilitiesQueryTask.execute(query);

        this._doQuery(geom);
        this._doFacilitiesQuery(geom)
      },

      facilitiesQueryTaskCompleted: function (results) {
        var features = results.featureSet.features;
        this.calculateStatistics(features);
      },

      calculateStatistics: function (features) {
        for (var i = 0; i < features.length; i++) {
          var feature = features[i];

          var sms = new SimpleMarkerSymbol({
            "color": [255, 0, 0, 64],
            "size": 12,
            "angle": -30,
            "xoffset": 0,
            "yoffset": 0,
            "type": "esriSMS",
            "style": "esriSMSSquare",
            "outline": {
              "color": [0, 255, 0, 0],
              "width": 1,
              "type": "esriSLS",
              "style": "esriSLSSolid"
            }
          });
          feature.setSymbol(sms);
          this.facilitiesGraphicsLayer.add(feature);
        }
      },

      ERGRequestFailed: function (error) {
        console.log("Error: ", error.message);
      },

      //synchronous execution results returned
      onERGGPExecuteComplete: function (results) {
        this.ergGraphicsLayer.clear();
        var sharedPolygon = null;
        var features = results[0].value.features;
        for (var i = 0; i < features.length; i++) {
          var feature = features[i];
          var ergZone = features[i].attributes["ERGZone"];

          if (ergZone === "Initial Isolation Zone") {
            var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
              new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color([255, 0, 0]), 2), new Color([255, 204, 204, 0.25]));
            feature.setSymbol(sfs);
            this.ergGraphicsLayer.add(feature);
          }

          else if (ergZone === "Protective Action Zone") {
            var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
              new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color([255, 0, 0]), 2), new Color([240, 128, 128, 0.25]));
            feature.setSymbol(sfs);
            this.ergGraphicsLayer.add(feature);
          }

          else if (ergZone === "Combined Zone") {
            sharedPolygon = feature.geometry;
            this.queryFacilitiesLayer(sharedPolygon);
          }
        }

        var lineFeatures = results[1].value.features;

        for (var i = 0; i < lineFeatures.length; i++) {
          var feature = lineFeatures[i];
          var lineType = lineFeatures[i].attributes["LineType"];

          if (lineType === "Arc") {
            var sls = new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0]), 1);
            feature.setSymbol(sls);
            this.ergGraphicsLayer.add(feature);
          }

          else if (lineType === "Radial") {
            var sls = new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([0, 0, 0]), 1);
            feature.setSymbol(sls);
            this.ergGraphicsLayer.add(feature);
          }
        }
        this.map.setExtent(graphicsUtils.graphicsExtent(this.ergGraphicsLayer.graphics), true);
      },

      //asynchronous job completed successfully
      displayERGServiceResults: function (results) {
        var sharedPolygon = null;
        if (results.paramName === "output_areas") {
          this.ergGraphicsLayer.clear();
          var features = results.value.features;
          for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            var ergZone = features[i].attributes["ERGZone"];

            if (ergZone === "Initial Isolation Zone") {
              var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                  new Color([255, 0, 0]), 2), new Color([255, 204, 204, 0.25]));
              feature.setSymbol(sfs);
              this.ergGraphicsLayer.add(feature);
            }

            else if (ergZone === "Protective Action Zone") {
              var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                  new Color([255, 0, 0]), 2), new Color([240, 128, 128, 0.25]));
              feature.setSymbol(sfs);
              this.ergGraphicsLayer.add(feature);
            }
            else if (ergZone === "Combined Zone") {
              sharedPolygon = feature.geometry;
              this.queryFacilitiesLayer(sharedPolygon);
            }
          }

          this.map.setExtent(graphicsUtils.graphicsExtent(this.ergGraphicsLayer.graphics), true);
          if (this.ergGPActive === "ergChemicalActive") {
            this.ergGPChemicalService.getResultData(this.ergGPJobID, "output_lines",
              lang.hitch(this, this.displayERGServiceResults));
          }
          else {
            this.ergGPPlacardService.getResultData(this.ergGPJobID, "output_lines",
              lang.hitch(this, this.displayERGServiceResults));
          }
        }
        else {
          var features = results.value.features;

          for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            var lineType = features[i].attributes["LineType"];

            if (lineType === "Arc") {
              var sls = new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0]), 1);
              feature.setSymbol(sls);
              this.ergGraphicsLayer.add(feature);
            }

            else if (lineType === "Radial") {
              var sls = new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([0, 0, 0]), 1);
              feature.setSymbol(sls);
              this.ergGraphicsLayer.add(feature);
            }
          }
        }
      },

      onERGGPComplete: function (jobInfo) {
        if (jobInfo.jobStatus !== "esriJobFailed") {
          this.ergGPJobID = jobInfo.jobId;
          if (this.ergGPActive === "ergChemicalActive") {
            this.ergGPChemicalService.getResultData(jobInfo.jobId, "output_areas",
              lang.hitch(this, this.displayERGServiceResults));
          }
          else {
            this.ergGPPlacardService.getResultData(jobInfo.jobId, "output_areas",
              lang.hitch(this, this.displayERGServiceResults));
          }
        } else {
          this._onQueryError("ERG Geoprocessing job status: " + jobInfo.messages[2].description);
        }
      },

      onERGGPStatusCallback: function (jobInfo) {
        var status = jobInfo.jobStatus;
      },

      onFindWSExecuteComplete: function (results) {
        var features = results[0].value.features;

        for (var i = 0; i < features.length; i++) {
          var feature = features[i];

          var distance = features[i].attributes["NEAR_DIST"] * 69.09;
          distance = parseFloat(distance.toFixed(1));
          this.weatherStationDistanceInfo = "<b>Distance to weather station: </b>" + distance + " miles";

          var fid = features[i].attributes["NEAR_FID"];

          if (this.windDirectionQueryTask != null) {
            var query = new Query();
            query.outFields = ["*"];
            query.returnGeometry = true;
            query.where = "OBJECTID = " + fid;
            this.windDirectionQueryTask.execute(query);
            //this.windDirectionQueryTask.execute(query, lang.hitch(this, this.windDirectionQTCompleted));
          }
        }
      },

      onLookupWindInfo: function () {
        if (this.spillGraphicsLayer.graphics.length > 0) {
          this.btnWindDirection.setAttribute("disabled", true);
          var geoPt = webMercatorUtils.webMercatorToGeographic(this.spillGraphicsLayer.graphics[0].geometry);
          var pointSymbol = new SimpleMarkerSymbol();
          pointSymbol.setSize(14);
          pointSymbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1));
          pointSymbol.setColor(new Color([0, 255, 0, 0.25]));
          var attr = {"OBJECTID ": 0};

          var graphic = new Graphic(geoPt, pointSymbol, attr, null)

          var features = [];
          features.push(graphic);
          var featureSet = new FeatureSet();
          featureSet.features = features;
          var params = {
            "Feature_Set": featureSet
          };

          this.findNearestWSService.outSpatialReference = this.map.spatialReference;
          this.findNearestWSService.execute(params, lang.hitch(this, this.onFindWSExecuteComplete));
        } else {
          alert("Please add a spill location first");
        }
      },

      windDirectionQTCompleted: function (results) {
        this.btnWindDirection.disabled = false;

        var weatherStationName = null;
        var windTo = -999;
        var recordedDate = null;

        var features = results.featureSet.features;

        if (features.length > 0) {
          if (this.config.windDirectionLayer.windDirectionField != null) {
            var feature = features[0];

            windTo = feature.attributes[this.config.windDirectionLayer.windDirectionField] + 180;
            if (windTo > 360)
              windTo = windTo - 360;

            var windDirection = "<b> Wind direction (blowing to:) </b>" + windTo;

            if (this.config.windDirectionLayer.stationNameField != null)
              weatherStationName = "<b> Station Name: </b>" + feature.attributes[this.config.windDirectionLayer.stationNameField];

            if (this.config.windDirectionLayer.dateTimeField != null) {
              var date = new Date(feature.attributes[this.config.windDirectionLayer.dateTimeField] * 1000);
              var hours = date.getHours();
              var minutes = date.getMinutes();

              // will display time in 10:30:23 format
              var formattedTime = hours + ':' + minutes;
              recordedDate = "<b> Recorded on: </b>" + formattedTime;
            }
            var windDirectionInfo = weatherStationName + "</br>"
              + this.weatherStationDistanceInfo + "</br>"
              + windDirection + "</br>"
              + recordedDate + "</br></br>"
              + "Do you want to use wind direction from this weather station?"

            // var windDialog = new Dialog({
            //   title: "Wind Direction",
            //   draggable: true,
            //   content: windDirectionInfo
            // });
            // windDialog.show();

            var confirmDialog = new this.confirmationDialog({
              title: "Wind Direction",
              message: windDirectionInfo,
              actionButtons: [
                {label: 'No', callBack: function () {
                  //alert('no');
                }},
                {label: 'Yes', callBack: lang.hitch(this, function () {
                  this.selectedWindDir = windTo;
                  this.winDirSpinner.setValue(windTo);
                })}
              ]
            });
          }
        }
      },

      confirmationDialog: function (configJson) {
        var dialog = new Dialog({
          title: configJson.title,
          content: ["<div style='width:25em'>", configJson.message, "</div>"].join('')
        });

        dialog.onButtonClickEvent = function (button) {
          return function () {
            button.callBack.apply(this, []);
            dialog.onCancel();
          }
        };

        for (actionButton in configJson.actionButtons) {
          if (configJson.actionButtons.hasOwnProperty(actionButton)) {
            dojo.place(new dijit.form.Button({label: configJson.actionButtons[actionButton].label,
              onClick: dialog.onButtonClickEvent.apply(dialog, [configJson.actionButtons[actionButton]])
            }).domNode, dialog.containerNode, 'after');
          }
        }
        dialog.startup();
        dialog.show();
      },

      addGraphic: function (evt) {
        //deactivate the toolbar and clear existing graphics
        this.drawToolbar.deactivate();
        this.map.enableMapNavigation();

        // figure out which symbol to use
        var symbol;
        if (evt.geometry.type === "point") {
          symbol = new SimpleMarkerSymbol();
        }
        this.spillGraphicsLayer.add(new Graphic(evt.geometry, symbol));
      },

      bindDrawToolbar: function (evt) {
        if (evt.target.id === "drawSpillInfo") {
          return;
        }
        this.map.disableMapNavigation();
        this.spillGraphicsLayer.clear();
        this.drawToolbar.activate("point");
      },

      onSolve: function (evt) {
        if (this.spillGraphicsLayer.graphics.length === 0) {
          alert("Please draw a spill location");
          return;
        }
        //Change to results tab
        this.tabContainer.selectTab(this.nls.tabDemo);
        html.setStyle(this.progressBar.domNode, 'display', 'block');
        html.setStyle(this.resultsSection, 'display', 'none');
        html.setStyle(this.noresultsSection, 'display', 'none');

        //Clear graphic layers
        this.ergGraphicsLayer.clear();
        this.facilitiesGraphicsLayer.clear();
        this.chartLayer.clear();

        var features = [];
        features.push(this.spillGraphicsLayer.graphics[0]);
        var featureSet = new FeatureSet();
        featureSet.features = features;

        var ergType = null;
        if (this.chemicalOrPlacard === "Chemical") {
          if (this.selectedMaterialType == null) {
            this.selectedMaterialType = this.defaultChemicalName;
          }
          var params = {
            "in_features": featureSet,
            "material_type": this.selectedMaterialType,
            "time_of_day": this.selectedTimeOfSpill,
            "spill_size": this.selectedSpillSize,
            "wind_bearing": this.selectedWindDir
          };

          this.ergGPActive = "ergChemicalActive";

          if (this.executionType === "esriExecutionTypeSynchronous") {
            this.ergGPChemicalService.execute(params, lang.hitch(this, this.onERGGPExecuteComplete));
          } else {
            this.ergGPChemicalService.submitJob(params, lang.hitch(this, this.onERGGPComplete),
              lang.hitch(this, this.onERGGPStatusCallback));
          }
        }
        else {
          if (this.selectedMaterialType == null) {
            this.selectedMaterialType = this.defaultPlacardName;
          }
          var params = {
            "in_features": featureSet,
            "placard_id": this.selectedMaterialType,
            "time_of_day": this.selectedTimeOfSpill,
            "spill_size": this.selectedSpillSize,
            "wind_bearing": this.selectedWindDir
          };
          this.ergGPActive = "ergPlacardActive";
          this.ergGPPlacardService.submitJob(params, lang.hitch(this, this.onERGGPComplete),
            lang.hitch(this, this.onERGGPStatusCallback));
        }
      },

      postCreate: function () {
        this.inherited(arguments);
        this._initChartLayer();
        this._initResultsTab();
      },

      startup: function () {
        this.inherited(arguments);
        
        //add CORS servers       
        array.forEach(this.config.corsEnabledServers, function (corsServer) {
          if (!this._itemExists(corsServer, esri.config.defaults.io.corsEnabledServers)) {
            esri.config.defaults.io.corsEnabledServers.push(corsServer);
          }  
        }, this);
      
        this.tabContainer = new TabContainer({
          tabs: [
            {
              title: this.nls.tabERG,
              content: this.tabNode1
            },
            {
              title: this.nls.tabDemo,
              content: this.tabNode2
            },
            {
              title: this.nls.tabFacilities,
              content: this.tabNode3
            }
          ],
          selected: this.nls.conditions
        }, this.tabERG);
        this.tabContainer.startup();
        utils.setVerticalCenter(this.tabContainer.domNode);

        this.facilitiesQueryTask = new QueryTask(this.config.facilitiesLayer.url);
        this.own(on(this.facilitiesQueryTask, "complete", lang.hitch(this, this.facilitiesQueryTaskCompleted)));

        this.windDirectionQueryTask = new QueryTask(this.config.windDirectionLayer.url);
        this.own(on(this.windDirectionQueryTask, "complete", lang.hitch(this, this.windDirectionQTCompleted)));

        //calculate by option
        var option = [];
        option[0] = {};
        option[0].label = "Chemical";
        option[0].value = "Chemical";

        option[1] = {};
        option[1].label = "Placard";
        option[1].value = "Placard";

        this.calculateBy.addOption(option);
        //SELECT MENU Change events wiring...
        this.own(on(this.calculateBy, "change", lang.hitch(this, this.onChangeCalculateBy)));

        //Get Chemical names from the GP Service
        var ergGPChemicalURL = this.config.chemicalGPService.url;
        this.ergGPChemicalService = new Geoprocessor(ergGPChemicalURL);

        //erg chemical list
        var request = esriRequest({
          url: ergGPChemicalURL + "?f=json",
          handleAs: "json",
          callbackParamName: 'callback',
          load: lang.hitch(this, 'ERGRequestSucceeded'),
          error: lang.hitch(this, 'ERGRequestFailed')
        });

        //erg placard list
        var ergPlacardURL = this.config.placardGPService.url;
        this.ergGPPlacardService = new Geoprocessor(ergPlacardURL);

        var request2 = esriRequest({
          url: ergPlacardURL + "?f=json",
          handleAs: "json",
          callbackParamName: 'callback',
          load: lang.hitch(this, 'ERGRequestSucceeded'),
          error: lang.hitch(this, 'ERGRequestFailed')
        });

        this.own(on(this.materialType, "change", lang.hitch(this, this.onChangeMaterialType)));

        //find nearest weather station GP service
        this.findNearestWSService = new Geoprocessor(this.config.weatherStationGPService.url);

        //spill size option
        var spillOption = [];
        spillOption[0] = {};
        spillOption[0].label = "Large";
        spillOption[0].value = "Large";

        spillOption[1] = {};
        spillOption[1].label = "Small";
        spillOption[1].value = "Small";

        this.spillSize.addOption(spillOption);
        this.own(on(this.spillSize, "change", lang.hitch(this, this.onChangeSpillSize)));

        //time of day option
        var timeOption = [];
        timeOption[0] = {};
        timeOption[0].label = "Day";
        timeOption[0].value = "Day";

        timeOption[1] = {};
        timeOption[1].label = "Night";
        timeOption[1].value = "Night";
        this.timeOfSpill.addOption(timeOption);
        this.own(on(this.timeOfSpill, "change", lang.hitch(this, this.onChangeTimeOfSpill)));

        //spill location graphics layer
        this.spillGraphicsLayer = new GraphicsLayer();
        this.map.addLayer(this.spillGraphicsLayer);

        //ERG coverage layer
        this.ergGraphicsLayer = new GraphicsLayer();
        this.map.addLayer(this.ergGraphicsLayer);

        //affected layers
        this.facilitiesGraphicsLayer = new GraphicsLayer();
        this.map.addLayer(this.facilitiesGraphicsLayer);
        this.own(on(this.facilitiesGraphicsLayer, "click", lang.hitch(this, this.facilitiesGraphicsLayerClick)));

        this.drawToolbar = new Draw(this.map);
        this.own(on(this.drawToolbar, "draw-end", lang.hitch(this, this.addGraphic)));
        this.own(on(this.drawSpillInfo, "click", lang.hitch(this, this.bindDrawToolbar)));
      },

      facilitiesGraphicsLayerClick: function (evt) {
        if (evt.graphic) {
          var facINFO = "";
          array.forEach(this.config.facilitiesLayer.fields, function (field) {
            facINFO += field + ": " + evt.graphic.attributes[field] + "<br>";
          }, this);
          this.map.infoWindow.setTitle("ERG");
          this.map.infoWindow.setContent(facINFO);
          this.map.infoWindow.show(evt.screenPoint, this.map.getInfoWindowAnchor(evt.screenPoint));
        }
      },

      destroy: function () {
        this.inherited(arguments);

        if (this.chartLayer) {
          this.map.removeLayer(this.chartLayer);
          this.chartLayer = null;
        }

        if (this.facilitiesGraphicsLayer) {
          this.map.removeLayer(this.facilitiesGraphicsLayer);
          this.facilitiesGraphicsLayer = null;
        }

        if (this.spillGraphicsLayer) {
          this.map.removeLayer(this.spillGraphicsLayer);
          this.spillGraphicsLayer = null;
        }

        if (this.ergGraphicsLayer) {
          this.map.removeLayer(this.ergGraphicsLayer);
          this.ergGraphicsLayer = null;
        }

        if (this.ergGraphicsLayer) {
          this.map.removeLayer(this.ergGraphicsLayer);
          this.ergGraphicsLayer = null;
        }
      },

      _doFacilitiesQuery: function (geometry) {
        try {
          html.setStyle(this.facilitiesListSection, 'display', 'none');
          if (this.config.facilitiesLayer.url) {
            this._doFacilitiesQueryByUrl(this.config.facilitiesLayer, geometry);
          } else {
            this._onQueryError("Infrastructure layer was defined incorrectly.")
          }
        } catch (err) {
          console.log(err.message);
        }
      },

      _doFacilitiesQueryByUrl: function (layerInfo, geometry) {
        var queryTask = new QueryTask(layerInfo.url);
        var q = new Query();
        q.returnGeometry = true;
        q.outFields = layerInfo.fields;
        q.geometry = geometry;
        queryTask.execute(q);
        this.own(on(queryTask, 'complete', lang.hitch(this, this._onFacilitiesQueryComplete)));
        this.own(on(queryTask, 'error', lang.hitch(this, this._onFacilitiesQueryError)));
      },

      _onFacilitiesQueryComplete: function (response) {
        var features = response.featureSet.features;
        if (features.length > 0) {
          html.empty(this.facilitiesListSection);
          var parentHeight = domStyle.get(this.domNode.parentNode.parentNode, "height");
          var listContainer = domConstruct.place("<div></div>", this.facilitiesListSection);
          var fp = new FacilitiesPane({
            resultsList: features,
            frameHeight: parentHeight,
            gLayer: this.facilitiesGraphicsLayer
          }, listContainer);
          html.setStyle(this.facilitiesListSection, 'display', 'block');

          this.facilitiesGraphicsLayer.clear();
          for (var i = 0; i < features.length; i++) {
            var f = features[i];
            this._setFeatureSymbol(f);
            this.facilitiesGraphicsLayer.add(f);
          }
        }
      },

      _onFacilitiesQueryError: function (error) {
        console.error("Facilities list query failed", error);
      },

      _initChartLayer: function () {
        this.chartLayer = new GraphicsLayer();
        this.map.addLayer(this.chartLayer);
      },

      _initFacilitiesLayer: function () {
        this.facilitiesGraphicsLayer = new GraphicsLayer();
        this.map.addLayer(this.facilitiesGraphicsLayer);
      },

      _initResultsTab: function () {
        this.own(on(this.pagingUl, 'click', lang.hitch(this, function (event) {
          var target = event.target || event.srcElement;
          var tagName = target.tagName.toLowerCase();
          if (tagName === 'a') {
            var as = query('a', this.pagingUl);
            var index = array.indexOf(as, target);
            if (index >= 0) {
              this._showChart(index);
            }
          }
        })));

        this.own(on(this.leftArrow, 'click', lang.hitch(this, function () {
          var index = (this.currentChartIndex - 1 + this.charts.length) % this.charts.length;
          if (index >= 0) {
            this._showChart(index);
          }
        })));

        this.own(on(this.rightArrow, 'click', lang.hitch(this, function () {
          var index = (this.currentChartIndex + 1 + this.charts.length) % this.charts.length;
          if (index >= 0) {
            this._showChart(index);
          }
        })));
      },

      _doQuery: function (geometry) {
        try {
          //Change to results tab
          this.tabContainer.selectTab(this.nls.tabDemo);
          html.setStyle(this.progressBar.domNode, 'display', 'block');
          html.setStyle(this.resultsSection, 'display', 'none');
          html.setStyle(this.noresultsSection, 'display', 'none');

          if (this.config.demographicLayer.url) {
            this._doQueryByUrl(this.config.demographicLayer, geometry);
          } else {
            this._onQueryError("Demographic layer was defined incorrectly");
          }
        } catch (err) {
          console.log(err.message);
        }
      },

      _doQueryByUrl: function (layerInfo, geometry) {
        var queryTask = new QueryTask(layerInfo.url);
        var q = new Query();
        q.returnGeometry = true;
        q.outFields = layerInfo.fields;
        q.geometry = geometry;
        queryTask.execute(q);
        this.own(on(queryTask, 'complete', lang.hitch(this, this._onQueryComplete)));
        this.own(on(queryTask, 'error', lang.hitch(this, this._onQueryError)));
      },

      _onQueryComplete: function (response) {
        var featureSet = response.featureSet;
        var features = featureSet.features;
        this._displayResult(features);
      },

      _onQueryError: function (error) {
        html.setStyle(this.progressBar.domNode, 'display', 'none');
        this._clear();
        html.setStyle(this.resultsSection, 'display', 'none');
        html.setStyle(this.noresultsSection, 'display', 'block');
        alert(error);
      },

      _displayResult: function (features) {
        this.progressBar.domNode.style.display = 'none';
        //html.setStyle(this.progressBar.domNode,'display','none');
        this._clear();
        var length = features.length;
        if (length > 0) {
          html.setStyle(this.resultsSection, 'display', 'block');
          html.setStyle(this.noresultsSection, 'display', 'none');
          for (var i = 0; i < length; i++) {
            var f = features[i];
            this._setFeatureSymbol(f);
            this.chartLayer.add(f);
          }
          this._createCharts(features);
        } else {
          html.setStyle(this.resultsSection, 'display', 'none');
          html.setStyle(this.noresultsSection, 'display', 'block');
        }
      },

      _setFeatureSymbol: function (f) {
        switch (f.geometry.type) {
          case 'extent':
          case 'polygon':
            f.setSymbol(this._getFillSymbol());
            break;
          case 'polyline':
            f.setSymbol(this._getLineSymbol());
            break;
          default:
            f.setSymbol(this._getMarkerSymbol());
            break;
        }
      },

      _getHighLightColor: function () {
        var color = new Color('#f5f50e');
        if (this.config && this.config.highLightColor) {
          color = new Color(this.config.highLightColor);
        }
        return color;
      },

      _getMarkerSymbol: function () {
        var style = SimpleMarkerSymbol.STYLE_CIRCLE;
        var size = 15;
        var color = new Color("#FF0000");
        color.a = 1;

        var outlineSymbol = new SimpleLineSymbol();
        var outlineColor = new Color("#000000");
        var outlineWidth = 0;
        outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
        outlineSymbol.setColor(outlineColor);
        outlineSymbol.setWidth(outlineWidth);

        var symbol = new SimpleMarkerSymbol(style, size, outlineSymbol, color);
        return symbol;
      },

      _getHightLightMarkerSymbol: function () {
        var style = SimpleMarkerSymbol.STYLE_CIRCLE;
        var size = 15;
        var color = new Color("#3fafdc");
        color.a = 1;

        var outlineSymbol = new SimpleLineSymbol();
        var outlineColor = this._getHighLightColor();
        var outlineWidth = 3;
        outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
        outlineSymbol.setColor(outlineColor);
        outlineSymbol.setWidth(outlineWidth);

        var symbol = new SimpleMarkerSymbol(style, size, outlineSymbol, color);
        return symbol;
      },

      _getLineSymbol: function () {
        var symbol = new SimpleLineSymbol();
        var style = SimpleLineSymbol.STYLE_SOLID;
        var color = new Color("#3fafdc");
        color.a = 1;
        var width = 5;
        symbol.setStyle(style);
        symbol.setColor(color);
        symbol.setWidth(width);
        return symbol;
      },

      _getHightLightLineSymbol: function () {
        var symbol = new SimpleLineSymbol();
        var style = SimpleLineSymbol.STYLE_SOLID;
        var color = this._getHighLightColor();
        color.a = 1;
        var width = 7;
        symbol.setStyle(style);
        symbol.setColor(color);
        symbol.setWidth(width);
        return symbol;
      },

      _getFillSymbol: function () {
        var style = SimpleFillSymbol.STYLE_SOLID;
        var color = new Color('#3fafdc');
        color.a = 0.5;
        var outlineSymbol = new SimpleLineSymbol();
        var outlineColor = new Color('#000000');
        var outlineWidth = 1;
        outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
        outlineSymbol.setColor(outlineColor);
        outlineSymbol.setWidth(outlineWidth);
        var symbol = new SimpleFillSymbol(style, outlineSymbol, color);
        return symbol;
      },

      _getHightLightFillSymbol: function () {
        var style = SimpleFillSymbol.STYLE_SOLID;
        var color = new Color('#3fafdc');
        color.a = 0.5;
        var outlineSymbol = new SimpleLineSymbol();
        var outlineColor = this._getHighLightColor();
        var outlineWidth = 3;
        outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
        outlineSymbol.setColor(outlineColor);
        outlineSymbol.setWidth(outlineWidth);
        var symbol = new SimpleFillSymbol(style, outlineSymbol, color);
        return symbol;
      },

      _clear: function () {
        this._clearCharts();
      },

      _clearCharts: function () {
        try {
          this.chartTitle.innerHTML = "";
          this.currentChartIndex = -1;
          var chartDivs = query('.chart-div', this.chartContainer);
          chartDivs.style({display: 'none'});
          var lis = query("li", this.pagingUl);
          if (lis.className != '')
            lis.className = ''; //lis.removeClass('selected');

          if (this.charts.length > 0) {
            for (var i = 0; i < this.charts.length; i++) {
              var chart = this.charts[i];
              if (chart) {
                chart.destroy();
              }
            }
          }
          this.charts = [];
          html.empty(this.pagingUl);
          html.empty(this.chartContainer);
          html.setStyle(this.resultsSection, 'display', 'none');
          html.setStyle(this.noresultsSection, 'display', 'block');
        } catch (err) {
          console.log(err.message);
        }
      },

      _setHightLightSymbol: function (g) {
        switch (g.geometry.type) {
          case 'extent':
          case 'polygon':
            g.setSymbol(this._getHightLightFillSymbol());
            break;
          case 'polyline':
            g.setSymbol(this._getHightLightLineSymbol());
            break;
          default:
            g.setSymbol(this._getHightLightMarkerSymbol());
            break;
        }
      },

      _showChart: function (index) {
        this.chartTitle.innerHTML = "";
        this.currentChartIndex = -1;
        var chartDivs = query('.chart-div', this.chartContainer);
        chartDivs.style({display: 'none'});
        var lis = query("li", this.pagingUl);
        lis.removeClass('selected');
        if (index < 0) {
          return;
        }

        var chartDiv = chartDivs[index];
        if (chartDiv) {
          this.currentChartIndex = index;
          html.setStyle(chartDiv, {display: 'block'});
        }
        var chart = this.charts[index];
        if (chart && chart.media) {
          this.chartTitle.innerHTML = chart.media.title;
          this.description.innerHTML = chart.media.description || "";
          this.totalSum.innerHTML = chart.totalSum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        var li = lis[index];
        if (li) {
          html.addClass(li, 'selected');
        }
      },

      _createCharts: function (features) {
        try {
          this._clearCharts();
          html.setStyle(this.resultsSection, 'display', 'block');
          html.setStyle(this.noresultsSection, 'display', 'none');
          //this.tabContainer.selectTab(this.nls.tabDemo);
          var layerInfo = this.config.demographicLayer;
          var medias = layerInfo.medias;
          var labelField = layerInfo.labelField;
          var box = html.getMarginBox(this.chartContainer);
          var w = box.w + "px";
          var h = box.h + "px";

          var i, chart;
          for (i = 0; i < medias.length; i++) {
            chart = null;
            var media = medias[i];
            var type = media.type.toLowerCase();
            var chartDiv = html.create('div', {'class': 'chart-div', style: {width: w, height: h}}, this.chartContainer);
            if (type === 'barschart') {
              chart = this._createBarsChart(chartDiv, media, features, labelField);
            }
            else if (type === 'columnschart') {
              chart = this._createColumnsChart(chartDiv, media, features, labelField);
            }
            else if (type === 'linechart') {
              chart = this._createLineChart(chartDiv, media, features, labelField);
            }
            else if (type === 'piechart') {
              chart = this._createPieChart(chartDiv, media, features, labelField);
            }

            if (chart) {
              chart.media = media;
              this.charts.push(chart);
              html.setStyle(chartDiv, 'display', 'none');
            }
            else {
              html.destroy(chartDiv);
            }
          }

          var chartCount = this.charts.length;
          for (i = 0; i < chartCount; i++) {
            var strLi = "<li><a></a></li>";
            var domLi = html.toDom(strLi);
            html.place(domLi, this.pagingUl);
          }

          this._showChart(0);
        } catch (err) {
          console.log(err.message);
        }
      },

      _createBarsChart: function (chartNode, media, features, labelField) {
        var series = [];

        //init series
        var totalSum = 0;
        for (var i = 0; i < features.length; i++) {
          var attributes = features[i].attributes;
          var name = attributes[labelField] || "Total";
          var num = attributes[media.chartField];
          var ele = {
            y: num,
            tooltip: "<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>" + name + "</span><br/><span>" + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</span></div>"
          };
          series.push(ele);
          totalSum += num;
        }

        //construct chart
        var barsChart = new Chart(chartNode);

        barsChart.addPlot('default', {
          type: Bars,
          animate: {
            duration: 2000,
            easing: easing.bounceInOut
          },
          enableCache: true,
          markers: true,
          minBarSize: 3,
          maxBarSize: 20
        });

        barsChart.addAxis('x', {
          vertical: true
        });

        barsChart.addAxis('y', {
          type: Default,
          fixLower: "minor",
          fixUpper: "minor"
        });

        barsChart.addSeries(media.title, series, {
          stroke: {
            color: "#FFFFFF"
          },
          fill: "#1f77b4"
        });

        new MoveSlice(barsChart, "default");
        new Highlight(barsChart, "default");
        new Tooltip(barsChart, "default");

        barsChart.connectToPlot('default', lang.hitch(this, function (evt) {
          var g = this.chartLayer.graphics[evt.index];
          if (evt.type === 'onmouseover') {
            this._setHightLightSymbol(g);
          }
          else if (evt.type === 'onmouseout') {
            this._setFeatureSymbol(g);
          }
        }));
        barsChart.render();
        barsChart.totalSum = totalSum;

        return barsChart;
      },

      _createColumnsChart: function (chartNode, media, features, labelField) {
        var series = [];

        //collect series
        var totalSum = 0;
        for (var i = 0; i < features.length; i++) {
          var attributes = features[i].attributes;
          var name = attributes[labelField] || "Total";
          var num = attributes[media.chartField];
          var ele = {
            y: num,
            tooltip: "<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>" + name + "</span><br/><span>" + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</span></div>"
          };
          series.push(ele);
          totalSum += num;
        }

        //construct chart
        var columnsChart = new Chart(chartNode);

        columnsChart.addPlot('default', {
          type: Columns,
          animate: {
            duration: 2000,
            easing: easing.bounceInOut
          },
          enableCache: true,
          markers: true
        });

        columnsChart.addAxis('x', {
          type: Default
        });

        columnsChart.addAxis('y', {
          vertical: true,
          fixLower: "minor",
          fixUpper: "major",
          min: 0
        });

        columnsChart.addSeries(media.title, series, {
          stroke: {
            color: "#FFFFFF"
          },
          fill: "#1f77b4"
        });

        new MoveSlice(columnsChart, "default");
        new Highlight(columnsChart, "default");
        new Tooltip(columnsChart, "default");

        columnsChart.connectToPlot('default', lang.hitch(this, function (evt) {
          var g = this.chartLayer.graphics[evt.index];
          if (evt.type === 'onmouseover') {
            this._setHightLightSymbol(g);
          }
          else if (evt.type === 'onmouseout') {
            this._setFeatureSymbol(g);
          }
        }));

        columnsChart.render();
        columnsChart.totalSum = totalSum;

        return columnsChart;
      },

      _createLineChart: function (chartNode, media, features, labelField) {
        var series = [];

        //init series
        var totalSum = 0;
        for (var i = 0; i < features.length; i++) {
          var attributes = features[i].attributes;
          var name = attributes[labelField] || "Total";
          var num = attributes[media.chartField];
          var ele = {
            y: num,
            tooltip: "<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>" + name + "</span><br/><span>" + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</span></div>"
          };
          series.push(ele);
          totalSum += num;
        }

        //construct chart
        var lineChart = new Chart(chartNode);

        lineChart.addPlot('default', {
          type: Lines,
          animate: {
            duration: 2000,
            easing: easing.cubicIn
          },
          markers: true,
          tension: "S"
        });

        lineChart.addAxis('x', {
          type: Default
        });

        lineChart.addAxis('y', {
          vertical: true,
          fixUpper: "minor",
          fixLower: "minor"
        });

        lineChart.addSeries(media.title, series, {
          stroke: {
            color: "#FF7F0E"
          },
          fill: "#FF7F0E"
        });

        new Magnify(lineChart, "default");
        new Highlight(lineChart, "default");
        new Tooltip(lineChart, "default");

        lineChart.connectToPlot('default', lang.hitch(this, function (evt) {
          var g = this.chartLayer.graphics[evt.index];
          if (evt.type === 'onmouseover') {
            this._setHightLightSymbol(g);
          }
          else if (evt.type === 'onmouseout') {
            this._setFeatureSymbol(g);
          }
        }));

        lineChart.render();
        lineChart.totalSum = totalSum;

        return lineChart;
      },

      _parseUrl: function (url) {
        var location = document.createElement("a");
        location.href = url;
        return location;
      },

      _isValidUrl: function (url) {
        var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
        return regexp.test(url);
      },

      _itemExists: function (searchItem, list) {
        for (var i = 0; i < list.length; i++) {
          if (list[i] === searchItem) {
            return true;
          }
        }
        return false;
      },

      _createPieChart: function (chartNode, media, features, labelField) {
        var series = [];
        var i;

        //init series
        var sum = 0.0;
        for (i = 0; i < features.length; i++) {
          sum += features[i].attributes[media.chartField];
        }

        for (i = 0; i < features.length; i++) {
          var attributes = features[i].attributes;
          var name = attributes[labelField] || "Total";
          var num = attributes[media.chartField];
          var percent = (num / sum * 100).toFixed(1) + "%";
          var ele = {
            y: num,
            text: "",
            tooltip: "<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>" + name + ":" + percent + "</span><br/><span>(" + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ")</span></div>"
          };
          series.push(ele);
        }

        //construct chart
        var pieChart = new Chart(chartNode);

        pieChart.setTheme(MiamiNice);

        pieChart.addPlot('default', {
          type: Pie,
          animate: {
            duration: 2000,
            easing: easing.bounceInOut
          },
          radius: 100,
          markers: true
        });

        pieChart.addSeries(media.title, series);
        new MoveSlice(pieChart, "default");
        new Highlight(pieChart, "default");
        new Tooltip(pieChart, "default");

        pieChart.connectToPlot('default', lang.hitch(this, function (evt) {
          var g = this.chartLayer.graphics[evt.index];
          if (evt.type === 'onmouseover') {
            this._setHightLightSymbol(g);
          }
          else if (evt.type === 'onmouseout') {
            this._setFeatureSymbol(g);
          }
        }));

        pieChart.render();
        pieChart.totalSum = sum;

        return pieChart;
      }
    });
  });