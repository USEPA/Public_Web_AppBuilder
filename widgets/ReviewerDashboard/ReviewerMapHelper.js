
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
define(
  [
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/_base/Color",
    "dojo/Deferred",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/request",
    "esri/main",
    "esri/layers/LayerDrawingOptions",
    "esri/renderers/UniqueValueRenderer"
  ],
function (declare, array, lang, Color, Deferred, SimpleMarkerSymbol,
SimpleLineSymbol, SimpleFillSymbol, esriRequest, esri, LayerDrawingOptions,
UniqueValueRenderer) {
return declare(null,
    {
      _drsExtensionUrl: null,
      _queryParams: null,
      _reviewerMapServerUrl: null,
      /**
      * Sets the symbol used to render the reviewer map server's REVTABLEPOINT layer.
      * You can define the alpha, angle, outline, size, style, xoffset,
      * and yoffset properties. Color is determined by the DashboardResult
      * and colorMap parameters passed to the
      * ReviewerMapServerHelper/getLayerDrawingOptions function.
      */
      pointSymbol: null,
      /**
      * Sets the symbol used to render the reviewer map server's REVTABLELINE layer.
      * You can define the alpha, style and width properties. Color is determined by
      * the DashboardResult and colorMap parameters passed to the
      * ReviewerMapServerHelper/getLayerDrawingOptions function.
      */
      lineSymbol: null,
      /**
      * Sets the symbol used to render the reviewer map server's REVTABLEPOLY layer.
      * You can define the alpha, style and outline properties.
      * Color is determined by the DashboardResult and colorMap
      * parameters passed to the ReviewerMapServerHelper/getLayerDrawingOptions function.
      */
      polySymbol: null,
      _fieldQualifier: null,
      _colorMapCache: null,
      SEVERITY_COLORS: {
        1: "#D80202",
        2: "#DF370C",
        3: "#E76D16",
        4: "#E76D16",
        5: "#FFEC5A"
      },
      LIFECYCLEPHASE_COLORS: {
        2: "#C00000",
        4: "#FFFF00",
        6: "#92D050"
      },
      DEFAULT_COLOR: "#00C5FF",
      /**
      * Sets the default color, specified as a dojo Color.
      * Used when the system cannot determine a color to apply to a symbol.
      */
      defaultColor: null,
      /**
      * Generates dynamic rendering options LayerDrawingOptions
      * for Reviewer workspace results.
      * This class automatically generates symbols and colors based on the
      * contents of your Reviewer workspace. Unique values in a DashboardResult
      * are used to build UniqueValueRenderers. These renderers are applied through
      * LayerDrawingOptions to the REVTABLEPOINT, REVTABLELINE, and REVTABLEPOLY
      * layers in the ArcGIS Data Reviewer for Server Map Server. Instances of this
      * class keep a cache of the symbols and colors used to render the map. The colors
      * are kept consistent if the extent of the features being drawn changes. The
      * colors are selected based on a predefined color palette that helps make each
      * unique value distinguishable from each other. However, using more than 20
      * unique values is not recommended because the resulting rendered map will
      * not be helpful for analysis. Colors are not randomly selected for Severity
      * and LifecycleStatus fields. Instead, a predefined color scale is applied.
      * If you use a custom color map, the auto generated or predefined palettes
      * are not used.
      */
      constructor: function (drsSoeURL, pointSymbol, lineSymbol, polySymbol,
      defaultColor) {
      var urlObject = esri.urlToObject(drsSoeURL);
      this._drsExtensionUrl = urlObject.path;
      this._queryParams = urlObject.query;
      var splitIndex = this._drsExtensionUrl.toLowerCase().lastIndexOf("/exts/");
      if (splitIndex > 0){
        this._reviewerMapServerUrl = this._drsExtensionUrl.substring(0, splitIndex);
      }
      if (defaultColor !== null){
        this.defaultColor = defaultColor;
      }
      else{
        this.defaultColor = new Color(this.DEFAULT_COLOR);
      }
      if (pointSymbol !== null){
        this.pointSymbol = pointSymbol;
      }
      else{
        this.pointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,
        7, null, this.defaultColor);
      }
      if (lineSymbol !== null){
        this.lineSymbol = lineSymbol;
      }
      else{
        this.lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
        this.defaultColor, 5);
      }
      if (polySymbol !== null){
        this.polySymbol = polySymbol;
      }
      else{
        this.polySymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
        null, this.defaultColor);
      }
      this._colorMapCache = {};
    },
      /**
      * Creates LayerDrawingOptions for the reviewer map server's REVTABLEPOINT,
      * REVTABLELINE, and REVTABLEPOLY layers.
      */
      getLayerDrawingOptions: function (dashboardResult, colorMap,
      useDefaultColorForMissingValues) {
      var deferred = new Deferred();
      if (!dashboardResult) {
        return deferred;
      }
      var revServiceLayerURL = this._reviewerMapServerUrl + '/0';
      if (this._fieldQualifier !== null) {
        this._generateLayerDrawingOptions(dashboardResult, colorMap,
        useDefaultColorForMissingValues, deferred);
      }
      else {
        var esriDeferred = esriRequest({
          "url": revServiceLayerURL,
          "content": {
            "f": "json"
          },
          callbackParamName: "callback"
        });
        esriDeferred.then(lang.hitch(this, function (response) {
          var pattern = new RegExp(/severity/i);
          array.forEach(response.fields, lang.hitch(this, function (field) {
            if (field.name.match(pattern)) {
              try {
                var splitResult = field.name.split(pattern);
                if (splitResult.length > 1){
                  this._fieldQualifier = splitResult[0];
                }
                else{
                  this._fieldQualifier = "";
                }
                this._generateLayerDrawingOptions(dashboardResult, colorMap,
                useDefaultColorForMissingValues, deferred);
              }
              catch (error) {
                this._errorHandler(error, deferred);
              }
            }
          }));
        }), lang.hitch(this, function (error) {
          this._errorHandler(error, deferred);
        }));
      }
      return deferred;
    },
      _generateLayerDrawingOptions: function (dashboardResult, colorMap,
      useDefaultColorForMissingValues, deferred) {
      //Get the fully qualified field name (in lowercase)
      var fieldName, fieldValues = [];
      fieldName =
      this._mapDashboardFieldNameToFullyQualifiedName(dashboardResult.fieldName).toLowerCase();
      fieldValues = dashboardResult.fieldValues;
      colorMap = this._updateColorMapAndCache(dashboardResult.fieldName, fieldValues,
      colorMap, useDefaultColorForMissingValues);
      var renderers = {
        polyRenderer:
        this._createPolyRenderer(fieldName, fieldValues, colorMap),
        lineRenderer:
        this._createLineRenderer(fieldName, fieldValues, colorMap),
        pointRenderer:
        this._createPointRenderer(fieldName, fieldValues, colorMap),
        colorMap: colorMap };
      var layerDrawingOptionsArr = [ this._createLayerDrawingOptions(0,
      renderers.pointRenderer),
      this._createLayerDrawingOptions(1, renderers.lineRenderer),
      this._createLayerDrawingOptions(2, renderers.polyRenderer)
      ];
      var result = {"layerDrawingOptions": {
        layerDrawingOptionsArray: layerDrawingOptionsArr,
        colorMap: renderers.colorMap }};
      deferred.resolve(result);
    },
      _updateColorMapAndCache: function (fieldName, fieldValues,
      colorMap, useDefaultColorForMissingValues) {
      if (colorMap === null) {
        if (fieldName.toLowerCase().indexOf("severity") >= 0 ||
          fieldName.toLowerCase().indexOf("lifecyclephase") >= 0
        ) {
          // When use default colors for missing values when using a default colorMap.
          useDefaultColorForMissingValues = true;
        }
        if (this._colorMapCache.hasOwnProperty(fieldName)) {
          // A cached colorMap exists
          colorMap = this._colorMapCache[fieldName];
        }
        else {
          // Create a default colorMap
          colorMap = this._createDefaultColorMap(fieldName);
        }
      }
      // Append any missing values
      var appendedColorMap = this._appendMissingValuesToColorMap(fieldValues,
      colorMap, useDefaultColorForMissingValues);
      this._colorMapCache[fieldName] = appendedColorMap;
      return appendedColorMap;
    },
      _appendMissingValuesToColorMap: function (values, colorMap,
      useDefaultColorForMissingValues) {
      var colorMapCount = 0;
      for (var prop in colorMap) {
        if (colorMap.hasOwnProperty(prop)){
          ++colorMapCount;
        }
      }
      for (var i = 0; i < values.length; i++) {
        if (!colorMap.hasOwnProperty(values[i])) {
          if (useDefaultColorForMissingValues){
            colorMap[values[i]] = this.defaultColor;
          }
          else{
            colorMap[values[i]] = new Color(this.getColor(i));
          }
        }
      }
      return colorMap;
    },
      getColor: function (index) {
      //get colors for upto 12 field values. If there are more values,
      // then generate a random hex color code
      var colors = [
        "#E8940C",
        "#98C000",
        "#0CBDE8",
        "#F2DA9A",
        "#E74327",
        "#DECF3F",
        "#878786",
        "#452B7F",
        "#9A8B76",
        "#B2912F",
        "#9893da",
        "#139887"
      ];
      var color;
      if (index < 11){
        color = colors[index];
      }
      else{
        color = '#' + Math.floor(Math.random() * 16777215).toString(16);
      }
      return color;
    },
      _createLayerDrawingOptions: function (layerIndex, renderer) {
        var ldo = new LayerDrawingOptions();
        ldo.layerId = layerIndex;
        ldo.renderer = renderer;
        return ldo;
      },
      _createDefaultColorMap: function (fieldName) {
        // Create a new color map, for severity use SEVERITY_COLORS,
        // for lifecyclePhase use LIFECYCLEPHASE_COLORS
        // for everything else return an empty color map.
        var colorMap;
        if (fieldName.toLowerCase().indexOf("severity") >= 0){
          colorMap = this._getColorMap(this.SEVERITY_COLORS);
        }
        else if (fieldName.toLowerCase().indexOf("lifecyclephase") >= 0){
          colorMap = this._getColorMap(this.LIFECYCLEPHASE_COLORS);
        }
        else{
          colorMap = {};
        }
        return colorMap;
      },
      _getColorMap: function (fieldValueColor) {
        var colorMap = {};
        for (var key in fieldValueColor) {
          colorMap[key] = new Color(fieldValueColor[key]);
        }
        return colorMap;
      },
      _mapDashboardFieldNameToFullyQualifiedName: function (fieldName) {
        if (!fieldName || fieldName === ""){
          return "";
        }

        if (fieldName.toUpperCase() === "FEATUREOBJECTCLASS"){
          fieldName = "ORIGINTABLE";
        }
        // BATCHJOBCHECKGROUP (REVCHECKRUNTABLE.BATCHJOBGROUPNAME) - Not currently supported
        if (this._fieldQualifier !== null && this._fieldQualifier.length > 0) {
          return this._fieldQualifier + fieldName;
        }
        else{
          return fieldName;
        }
      },
      _createPolyRenderer: function (fullyQualifiedFieldName, values, colorMap) {
        var polyRenderer = new UniqueValueRenderer(this.polySymbol, fullyQualifiedFieldName);
        for (var i = 0; i < values.length; i++) {
          var uniqueValue = values[i];
          var polySym = new SimpleFillSymbol();
          polySym.style = this.polySymbol.style;
          if (colorMap.hasOwnProperty(uniqueValue)){
            polySym.color = colorMap[uniqueValue];
          }
          else{
            polySym.color = this.defaultColor;
          }
          if (this.polySymbol.outline !== null) {
            var outlineSym = new SimpleLineSymbol();
            outlineSym.color = polySym.color;
            outlineSym.style = this.polySymbol.outline.style;
            outlineSym.width = this.polySymbol.outline.width;
            polySym.outline = outlineSym;
          }
          else {
            polySym.outline = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            polySym.color, 1);
          }
          if (uniqueValue === "<Null>"){
            polyRenderer = new UniqueValueRenderer(polySym, fullyQualifiedFieldName);
          }
          polyRenderer.addValue(uniqueValue, polySym);
        }
        return polyRenderer;
      },
      _createLineRenderer: function (fullyQualifiedFieldName, values, colorMap) {
        var lineRenderer = new UniqueValueRenderer(this.lineSymbol, fullyQualifiedFieldName);
        for (var i = 0; i < values.length; i++) {
          var uniqueValue = values[i];
          var lineSym = new SimpleLineSymbol();
          if (colorMap.hasOwnProperty(uniqueValue)){
            lineSym.color = colorMap[uniqueValue];
          }
          else{
            lineSym.color = this.defaultColor;
          }
          lineSym.style = this.lineSymbol.style;
          lineSym.width = this.lineSymbol.width;
          if (uniqueValue === "<Null>"){
            lineRenderer = new UniqueValueRenderer(lineSym, fullyQualifiedFieldName);
          }
          lineRenderer.addValue(uniqueValue, lineSym);
        }
        return lineRenderer;
      },
      _createPointRenderer: function (fullyQualifiedFieldName, values, colorMap) {
        var pointRenderer = new UniqueValueRenderer(this.pointSymbol, fullyQualifiedFieldName);
        for (var i = 0; i < values.length; i++){
          var uniqueValue = values[i];
          var pointSym = new SimpleMarkerSymbol();
          if (colorMap.hasOwnProperty(uniqueValue)){
            pointSym.color = colorMap[uniqueValue];
          }
          else{
            pointSym.color = this.defaultColor;
          }

          pointSym.outline = this.pointSymbol.outline;
          pointSym.size = this.pointSymbol.size;
          pointSym.style = this.pointSymbol.style;
          if (uniqueValue === "<Null>"){
            pointRenderer = new UniqueValueRenderer(pointSym, fullyQualifiedFieldName);
          }
          pointRenderer.addValue(uniqueValue, pointSym);
        }
        return pointRenderer;
      },
      _errorHandler: function (error, deferred) {
        if (error === null) {
          //create default error object
          error = new Error("Unexpected response received from server");
          error.code = 500;
        }
        if (deferred) {
          deferred.reject(error);
        }
      }
    });
});