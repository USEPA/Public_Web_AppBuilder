/*global define, console, setTimeout*/
define([
  //dojo
  "dojo/_base/declare",
  "jimu/BaseWidget",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/form/Button",
  "dojo/on",
  "dojo/aspect",
  "dijit/form/SimpleTextarea",
  "dojo/dom-class",
  "dojo/_base/array",
  "dojo/string",
  "dojo/_base/lang",
  "dojo/Deferred",
  'dojo/promise/all',

  //esri
  'jimu/WidgetManager',
  'jimu/PanelManager',
  'esri/config',
  "esri/InfoTemplate",
  "esri/geometry/Point",
  "esri/geometry/Extent",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/layers/FeatureLayer",
  "esri/request",
  "esri/Color",
  "dojo/domReady!"
    ],
  function (
    //dojo
    declare, BaseWidget, _WidgetsInTemplateMixin, Button, on, aspect, SimpleTextarea,
    domClass, array, dojoString, lang, Deferred, all,

    //esri
    WidgetManager, PanelManager, esriConfig, InfoTemplate, Point, Extent, Query, QueryTask,
    SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, FeatureLayer, esriRequest, Color
    ) {

    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget, _WidgetsInTemplateMixin], {

      // this property is set by the framework when widget is loaded.
      baseClass: 'jimu-widget-EnhancedQuery',
      name: "Enhanced Query",
      label: "Enhanced Query",

      queryTask: null,
      optionSelectedOperatorMathMenu: 'LIKE',
      optionFieldSel: null,
      layerQuery: null,
      serviceQuery: null,
      featureLayer: null,
      layerInfo: null,

      postCreate: function () {
        this.inherited(arguments);
      },

      startup: function startupFunc() {
        this.inherited(arguments);

       

        this.own(on(this.btnSearchNode, "click", lang.hitch(this, this.handlerExecQuery)));

        this.own(on(this.btnClearGfxNode, "click", lang.hitch(this, function () {
          this.map.removeLayer(this.featureLayer);
          this.featureLayer = null;
        })));

        this.serviceQuery = this.config.configText;
        this.serviceQuery = this.serviceQuery.replace(/\/?$/, '/'); // test to add trailing / character only if it's missing

        this.layerQuery = '';
        this.layerQuery = this.config.configText2;
        console.log("layer Selected:  " + this.layerQuery);

        this.own(on(this.selectOperatorMathMenuNode, "change", lang.hitch(this, function () {
          this.optionSelectedOperatorMathMenu = this.selectOperatorMathMenuNode.get('value');
          console.log("Operator Math Menu clicked ... " + this.selectOperatorMathMenuNode.get('value'));
        })));

        this.own(on(this.btnClearQueryBoxNode, "click", lang.hitch(this, function () {
          this.myarea.set("value", "");
        })));

        ////// Operators  ////
        this.own(on(this.btnOrNode, "click", lang.hitch(this, function () {
          this.myarea.set("value",  this.myarea.get("value") + " OR ");
        })));

        this.own(on(this.btnAndNode, "click", lang.hitch(this, function () {
          this.myarea.set("value",  this.myarea.get("value") + " AND ");
        })));

        this.own(on(this.btnNotNode, "click", lang.hitch(this, function () {
          this.myarea.set("value",  this.myarea.get("value") + " NOT ");
        })));

        //// Get layer list ////
        var requestHandleLayerList = esriRequest({
          "url": this.serviceQuery,
          "content": {
            "f": "json"
          },
          "callbackParamName": "callback",
        });
        requestHandleLayerList.then(lang.hitch(this, this.requestSucceededLayerList), this.requestFailedLayerList);

        //////   get field list /////
        var requestHandleLayer = esriRequest({
          "url": this.serviceQuery + this.layerQuery,
          "content": {
            "f": "json"
          },
          "callbackParamName": "callback"
        });
        requestHandleLayer.then(lang.hitch(this, this.requestSucceeded), this.requestFailed);

        //get user's selected field
        this.own(on(this.selectFieldNode, "change", lang.hitch(this, function () {
          this.optionFieldSel = this.selectFieldNode.get('value');
        })));

        //get user's selected layer
        this.own(on(this.selectLayerNode, "change", lang.hitch(this, function () {
          this.optionLayerSelVal = this.selectLayerNode.get('value');
          this.optionLayerSelText = this.selectLayerNode.get('displayedValue');

          //////   get field list  AFTER clicking layer list menu to change layer
          var requestHandleLayer2 = esriRequest({
            "url": this.serviceQuery + this.optionLayerSelVal,
            "content": {
              "f": "json"
            },
            "callbackParamName": "callback"
          });
          requestHandleLayer2.then(lang.hitch(this, this.requestSucceeded), this.requestFailed);
        })));

        this.own(on(this.btnAddToQueryNode, "click", lang.hitch(this, function () {
          var percentPlaceHolder, percentPlaceHolder2;
          this.optionFieldSel = this.selectFieldNode.get('value');
          if (this.optionSelectedOperatorMathMenu === "LIKE") {
            percentPlaceHolder = " '%";
            percentPlaceHolder2 = "%'";
          } else {
            percentPlaceHolder = "";
            percentPlaceHolder2 = "";
          }
          var userQueryTextExpressionTxtArea = this.myareaExpression.get("value");
          var userQueryTextExpressionTotal = this.optionFieldSel + " " + this.optionSelectedOperatorMathMenu +
            percentPlaceHolder + userQueryTextExpressionTxtArea + percentPlaceHolder2;

          this.myarea.set("value",  this.myarea.get("value") + userQueryTextExpressionTotal);
        })));

        this.query = new Query();
        this.query.returnGeometry = true;
        this.query.outSpatialReference = this.map.spatialReference;
        this.query.outFields = ['*'];
      },

      requestSucceeded: function (response) {

        this.layerInfo = response;
        if (response.hasOwnProperty("fields")) {
          this.selectFieldNode.options.length= 0;
          var fieldInfoName = array.map(response.fields, function (f) {
            return f.name;
          });
          var options = [];
          /////populate field dropdown menu
          for (var i = 0; i < fieldInfoName.length; i++) {
            var option = {
              value: fieldInfoName[i],
              label: fieldInfoName[i]
            };
            options.push(option);
          }
          this.selectFieldNode.addOption(options);
          this.selectFieldNode.selectedIndex = 1;
          this.optionFieldSel = this.selectFieldNode.get('value');
        } else {
          console.log("No field info found. Please double-check the URL.");
        }
      },

      requestFailed: function (error) {
        console.log("Getting Layer List JSON failed", error);
      },

      requestFailedLayerList: function () {
        console.log("Failed to get layer list. ");
      },

      requestSucceededLayerList: function (response) {
          var i;
          // show layer indexes and names
          if (response.hasOwnProperty("layers")) {

              originalArray = response.layers;
              var finalArrayLayers = [];
              var temp;

              for (i = 0; i < originalArray.length; i++) {
                  temp = originalArray[i];
                  switch (temp.id.toString()) {
                      //layers to remove:
                    case "31": case "32": case "33": case "34": case "35": case "36": case "37": case "38": case "39": case "40": 
                        temp.id = undefined; // used to determine layers to exclude from layerlist menu
                      finalArrayLayers.push(temp);
                      break;
                  default:
                      finalArrayLayers.push(temp);
                  }
              } //end switch 

              var layerInfoLayerList = array.map(finalArrayLayers, function(f) {
                  return f;
              });
          var layerInfoLayerListName = [];
          for (i = 0; i < layerInfoLayerList.length; i++) {
            layerInfoLayerListName[i] = layerInfoLayerList[i].name;
          }
          var options = [];
          /////populate layer dropdown menu
          for (i = 0; i < layerInfoLayerList.length; i++) {
              if (layerInfoLayerList[i].id) { //exclude layers with undefined id
                  var option = {
                      value: i,
                      label: layerInfoLayerListName[i]
                  };
                  options.push(option);
              }
              if( i === this.layerQuery){
              this.optionLayerSelVal = i;
            }
          }
          this.selectLayerNode.addOption(options);
          this.selectLayerNode.set("value", this.layerQuery);
            
        } else {
          console.log("Failed to get layer list. inside else");
        }
      },

      /*onOpen: function () {
        console.log('onOpen');
      },

      onClose: function () {
        //   this.map.graphics.clear();   /// NOT SURE if we want to do this...
        console.log('onClose');
      },*/

      ///exec query Search button
      handlerExecQuery: function () {
        this.queryTask = new QueryTask(this.serviceQuery + this.optionLayerSelVal);
        lang.hitch(this, this.executeQueryTask());
      },

      executeQueryTask: function () {
        //set query based on what user typed in ;
        this.query.where = this.myarea.value;
        //execute query
        this.queryTask.execute(this.query, lang.hitch(this, this.showResults));
      },

      calcGraphicsExtent: function (graphicsArray) {
        var g = graphicsArray[0].geometry,
          fullExt = g.getExtent(),
          ext, i, il = graphicsArray.length;

        if (fullExt === null) {
          fullExt = new Extent(g.x, g.y, g.x, g.y, g.spatialReference);
        }
        for (i = 1; i < il; i++) {
          ext = (g = graphicsArray[i].geometry).getExtent();
          if (ext === null) {
            ext = new Extent(g.x, g.y, g.x, g.y, g.spatialReference);
          }
          fullExt = fullExt.union(ext);
        }
        return fullExt;
      },

      showResults: function (featureSet) {
        //Performance enhancer - assign featureSet array to a single variable.
        var resultFeatures = featureSet.features;
        console.info(resultFeatures[0]);
        if (resultFeatures.length === 0) {
          alert('No results found.');
        } else {
          //this.map.graphics.clear();
          var extent = this.calcGraphicsExtent(resultFeatures);
          this.map.setExtent(extent); //zoom to query results

          var geometryTypeQuery = featureSet.geometryType;

          var markerSymbolQuery = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 11,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
              new Color([255, 0, 0]), 1),
            new Color([111, 211, 55, 1]));

          var lineSymbolQuery = new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_DASH,
            new Color([255, 0, 0]),
            3);

          var polygonSymbolQuery = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
              new Color([222, 0, 0]), 1), new Color([255, 255, 0, 0.25])
          );

          var symbolQuery;
          switch (geometryTypeQuery) {
            case "esriGeometryPoint":
              symbolQuery = markerSymbolQuery;
              break;
            case "esriGeometryPolyline":
              symbolQuery = lineSymbolQuery;
              break;
            case "esriGeometryPolygon":
              symbolQuery = polygonSymbolQuery;
              break;
            default:
              symbolQuery = polygonSymbolQuery;
          }

          //create a feature collection
          var featureCollection = {
            "layerDefinition": null,
            "featureSet": {
              "features": [],
              "geometryType": geometryTypeQuery
            }
          };

          featureCollection.layerDefinition = {
            "geometryType": geometryTypeQuery,
            "drawingInfo": {
              "renderer": {
                "type": "simple",
                "symbol": symbolQuery.toJson()
              }
            },
            "fields": featureSet.fields
          };

          var infoTemplateQuery = new InfoTemplate("Details", "${*}"); // wildcard for all fields.  Specifiy particular fields here if desired.
          //create a feature layer based on the feature collection
          this.featureLayer = new FeatureLayer(featureCollection, {
            id: 'Query of layer "' + this.optionLayerSelText + '" Where: "' + this.myarea.value + '"',
            infoTemplate: infoTemplateQuery
          });

          this.map.addLayer(this.featureLayer);

          //loop though the features
          for (var i = 0, len = resultFeatures.length; i < len; i++) {
            var feature = resultFeatures[i];
            feature.setSymbol(symbolQuery);
            this.featureLayer.add(feature);
          }
          this._openResultInAttributeTable(this.featureLayer);
        }
      },

      _openResultInAttributeTable: function (currentLayer) {
        if (this.autozoomtoresults) {
          setTimeout(lang.hitch(this, function () {
            this.zoomall();
          }), 300);
        }
        var aLayer = {
          layerObject: currentLayer,
          title: currentLayer.name,
          id: currentLayer.id,
          getLayerObject: function () {
            var def = new Deferred();
            if (this.layerObject) {
              def.resolve(this.layerObject);
            } else {
              def.reject("layerObject is null");
            }
            return def;
          }
        };
        if (!Object.create) {
          Object.create = function (proto, props) {
            if (typeof props !== "undefined") {
              throw "The multiple-argument version of Object.create is not provided by this browser and cannot be shimmed.";
            }
            function ctor() {}
            ctor.prototype = proto;
            return new ctor();
          };
        }
        this.publishData({
          'target': 'AttributeTable',
          'layer': Object.create(aLayer)
        });
      }
    });
  });
