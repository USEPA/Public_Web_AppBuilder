///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/kernel',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/_base/array',

    'dojo/i18n!esri/nls/jsapi',
    'dojo/keys',
    'dojo/on',
    'dojo/dom',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/string',

    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',

    'esri/Color',
    'esri/graphic',

    'esri/dijit/editing/Editor',
    'esri/dijit/AttributeInspector',

    'esri/geometry/Point',

    'esri/layers/FeatureLayer',

    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleFillSymbol',

    'esri/tasks/query',
    'esri/tasks/GeometryService',
    'esri/tasks/LengthsParameters',
    'esri/tasks/BufferParameters',
    'esri/tasks/AreasAndLengthsParameters'
  ],
  function(declare, dojo, lang, html, array, esriBundle, keys, on, dom,
    domClass, domConstruct, string, _WidgetsInTemplateMixin, BaseWidget,
    Color, Graphic, Editor, AttributeInspector, Point, FeatureLayer,
    SimpleMarkerSymbol, SimpleFillSymbol, Query, GeometryService,
    LengthsParameters, BufferParameters, AreasAndLengthsParameters) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Cost Analysis',
      baseClass: 'jimu-widget-cost-analysis',
      editor: null,
      layers: null,

      // {<layerId1>:
      //   {layer: <FeatureLayer>,
      //    addedFeatures: [<f1>, ..],
      //    costEqnField: <String>}}
      featureStorage: {},
      featureStorageCount: 0,

      attrInspector: null,
      prjLyr: null,
      gsvc: null,
      lengthUnit: null,
      arealUnit: null,

      postCreate: function() {
        this.inherited(arguments);
      },

      // Event which fires when the widget panel is opened.
      // returns: nothing
      onOpen: function() {
        this.layers = [];


        this.disableWebMapPopup();
        this.getLayers();

        this.initEditor();
        this.initGeometryService();

        this.bindEvents();
        this.bindLayerEvents();

        this.readConfig();
      },

      bindEvents: function() {
        this.own(this.map.infoWindow.on('hide', lang.hitch(this, this._onHideInfoWindow)));
        this.own(this.map.infoWindow.on('show', lang.hitch(this, this._onShowInfoWindow)));
      },

      // Event handler for info window (show).
      // returns: nothing
      _onShowInfoWindow: function (evt) {
        //this.map.infoWindow.setContent(evt.graphic.getContent());
      },

      // Event handler for info window (hide).
      // returns: nothing
      _onHideInfoWindow: function () {
        this.enableWebMapPopup();
      },

      // Event handler for when Save button is clicked on the widget panel.
      // returns: nothing
      onSaveClick: function (evt) {
        if (domClass.contains(evt.target, 'jimu-state-disabled')) {
          return;
        }

        var featurePts = this.addedFeaturesToPoints();
        this.gsvc.convexHull(featurePts,
          lang.hitch(this, this.onConvexHullComplete),
          this.gsvcOnError);
      },

      // Event handler for when Clear button is clicked on the widget panel.
      // returns: nothing
      onClearClick: function (evt) {
        if (domClass.contains(evt.target, 'jimu-state-disabled')) {
          return;
        }

        for (var layerId in this.featureStorage) {
          if (this.featureStorage.hasOwnProperty(layerId)) {
            var layer = this.featureStorage[layerId].layer;
            var features = this.featureStorage[layerId].addedFeatures;

            features = array.map(features, function (feature) {
              return feature.feature;
            });

            layer.applyEdits(null, null, features,
              this.featureLayerEditsComplete,
              this.featureLayerEditsError
              );
            }
        }
      },

      // Event handler for when Convex Hull (Geometry Service) operation is complete.
      // returns nothing
      onConvexHullComplete: function (result) {
        var params = new BufferParameters();
        params.distances = [parseInt(this.config.cHullBufferDistance, 10)];
        params.unit = GeometryService[this.config.lengthUnit.value];
        params.geometries = [result];

        this.gsvc.buffer(params,
          lang.hitch(this, this.onBufferComplete),
          this.gsvcOnError
          );
      },

      // Event handler for when Geometry Service has an error.
      // returns: nothing
      gsvcOnError: function (err) {
        console.log('GeometryService ERROR: ' + err);
      },

      // Generates an alphanumeric string of length 8.
      generateProjectID: function () {
        return Math.random().toString(36).substring(10);
      },

      // Event handler for when Buffer (Geometry Service) operation is complete.
      // returns: nothing
      onBufferComplete: function (buffers) {
        var buffer = buffers[0];

        var projectID = this.generateProjectID();
        var g = new Graphic(buffer, new SimpleFillSymbol());

        g.setAttributes({
            'PROJECTID': projectID,
            'PROJCOST': this.totalCost.innerHTML,
            'TotalArea': this.totalArea.innerHTML,
            'TotalLength': this.totalLength.innerHTML,
            'NumberOfPoints': this.pointCount.innerHTML,
            'NumberOfPolygons': this.polygonCount.innerHTML,
            'NumberOfLines': this.polylineCount.innerHTML
        });

        this.map.graphics.add(g);

        this.appendProjectID(projectID);

        this.prjLyr.applyEdits([g], null, null,
          lang.hitch(this, this.prjLyrEditsComplete),
          this.featureLayerEditsError);
      },

      // Generate and append Project ID to all features drawn in current session.
      // returns nothing
      appendProjectID: function (projectID) {

        for (var layerId in this.featureStorage) {
          if (this.featureStorage.hasOwnProperty(layerId)) {
            var features = array.map(this.featureStorage[layerId].addedFeatures, function (feature) {
                feature.feature.attributes.PROJECTID = projectID;
                return feature.feature; //no cost and measurement attrs.
                }
              );

            var layer = this.featureStorage[layerId].layer;
            layer.applyEdits(null, features, null,
              null,
              this.featureLayerEditsError);
          }
        }
      },

      // Event handler for when an error occurs during a layer edit.
      // returns: nothing
      featureLayerEditsError: function (err) {
        console.log('featureLayerEditsError');
        this._togglePopupLoadingIcon();
        this._hideInfoWindow();
      },

      // Event handler for when edits are complete on the project layer.
      // returns: nothing
      prjLyrEditsComplete: function (adds, deletes, updates) {
        this._createAttributeInspector();

        var q = new Query();
        q.objectIds = [adds[0].objectId];
        this.prjLyr.selectFeatures(q,
          FeatureLayer.SELECTION_NEW,
          lang.hitch(this, this.prjLyrSelectComplete),
          this.prjLyrSelectError);
      },

      // Event handler for when feature selection is complete on the project layer.
      // returns: nothing
      prjLyrSelectComplete: function (features) {
        this.map.infoWindow.setTitle(this.nls.editorPopupTitle);
        this.map.infoWindow.setContent(this.attrInspector.domNode);
        this.map.infoWindow.show(this.mouseClickPos,
          this.map.getInfoWindowAnchor(this.mouseClickPos));
      },

      // Event handler for when an error occurs during a selection in project layer.
      prjLyrSelectError: function (err) {
        console.log('prjLayerSelectError: ' + err);
      },

      // Hide the Info Window.
      // returns: nothing
      _hideInfoWindow: function () {
        if (this.map.infoWindow.isShowing) {
          this.map.infoWindow.hide();
        }
      },

      // Create the attribute inspector based on the project layer.
      _createAttributeInspector: function () {
        var layerInfos = [{
          'featureLayer': this.prjLyr,
          'isEditable': true,
          'showDeleteButton': false,
          'fieldInfos': this._layerFieldsToFieldInfos(this.prjLyr)
        }];

        var attrInspector = new AttributeInspector({
          layerInfos: layerInfos,
          _hideNavButtons: true
        }, domConstruct.create('div'));

        var saveButton = domConstruct.create('div', {
          'id': 'attrInspectorSaveBtn',
          'class': 'jimu-btn',
          'innerHTML': this.nls.editorPopupSaveBtn
        });

        var loadingIcon = domConstruct.create('div', {
          'id': 'popupLoadingIcon',
          'class': 'loading hide'
        });

        domConstruct.place(saveButton,
          attrInspector.deleteBtn.domNode,
          'after');

        domConstruct.place(loadingIcon,
          attrInspector.deleteBtn.domNode,
          'after');

        on(saveButton, 'click',
          lang.hitch(this, this._attrInspectorOnSave));

        attrInspector.on('attribute-change',
          lang.hitch(this, this._attrInspectorAttrChange));

        this.attrInspector = attrInspector;
      },

      // Event handler for when an attribute is changed in the attribute
      // inspector.
      // returns: nothing
      _attrInspectorAttrChange: function (evt) {
        var saveBtn = dom.byId('attrInspectorSaveBtn');
        var widget = this;

        //hacky way to check if fields arent validated.
        if (this.attrInspector.domNode.innerHTML.indexOf('Error') < 0) {
          html.removeClass(saveBtn, 'jimu-state-disabled');
        } else {
          html.addClass(saveBtn, 'jimu-state-disabled');
        }

        array.forEach(this.prjLyr.getSelectedFeatures(),
          function (feature) {
            if (evt.fieldValue !== widget.nls.editorPopupMultipleValues) {
              feature.attributes[evt.fieldName] = evt.fieldValue;
            }
          });
      },

      // Toggle the loading icon in the widget panel.
      // returns: nothing
      _togglePanelLoadingIcon: function () {
        var loading = dom.byId('panelLoadingIcon');

        if (html.hasClass(loading, 'hide')) {
          html.removeClass(loading, 'hide');
        } else {
          html.addClass(loading, 'hide');
        }
      },

      // Event handler for when the Save button is clicked in the attribute inspector.
      // returns: nothing
      _attrInspectorOnSave: function (evt) {
        //dont do anything if an error is present in the popup.
        if (this.attrInspector.domNode.innerHTML.indexOf('Error') > 0) {
          return;
        }

        this._togglePopupLoadingIcon();

        //disable the save button
        html.addClass(evt.target, 'jimu-state-disabled');

        this.prjLyr.applyEdits(null, this.prjLyr.getSelectedFeatures(),
          null,
          lang.hitch(this, function (added, updated, removed) {
            this._togglePopupLoadingIcon();
            this._hideInfoWindow();
          }), this.featureLayerEditsError);
      },

      // Toggles the visibility of the loading icon in the map pop up.
      // returns: nothing
      _togglePopupLoadingIcon: function () {
        var loading = dom.byId('popupLoadingIcon');
        html.removeClass(loading, 'hide');
      },

      // Return an array of visible fields from layer for display in attribute inspector.
      // returns: array of visible fields
      _layerFieldsToFieldInfos: function (lyr) {
        var fields = lyr.infoTemplate.info.fieldInfos;

        return array.filter(fields, function (field) {
          return field.visible;
        });
      },

      // Takes all features in storage and converts them into points.
      // returns a list of points that make up all the features.
      addedFeaturesToPoints: function() {
        var result = [];

        for (var layerId in this.featureStorage) {
          if (this.featureStorage.hasOwnProperty(layerId)) {
            var features = this.featureStorage[layerId].addedFeatures;
            array.forEach(features, function (f) {
              var feature = f.feature;
              var type = feature.geometry.type;
              var geometry = feature.geometry;
              if (type === 'point') {
                result.push(geometry);

              } else { //polyline - polygon
                var pieces;
                if (type === 'polyline') {
                  pieces = geometry.paths;
                } else {
                  pieces = geometry.rings;
                }

                array.forEach(pieces, function (piece) {
                  array.forEach(piece, function (point) {
                    result.push(new Point(point[0], point[1], geometry.spatialReference));
                  });
                });
              }
            });
          }
        }

        return result;
      },

      // Bind layer events and creates object to store features drawn.
      // returns: nothing
      bindLayerEvents: function() {
        array.forEach(this.editor.settings.layers,
          lang.hitch(this, function (layer) {
            var costEqnField = this.getCostEquationField(layer);

            this.featureStorage[layer.id] = {'layer': layer,
                                             'costEqnField': costEqnField,
                                             addedFeatures: []};

            //disable cost eqn for editing
            this.disableFieldForEditing(layer, costEqnField);

            on(layer, 'before-apply-edits',
              lang.hitch(this, this.layerBeforeApplyEditsComplete));

            on(layer, 'edits-complete',
              lang.hitch(this, function (results) {
                this._togglePanelLoadingIcon();
            }));

        }));
      },

      // Disable the cost equation field in the given layer.
      // returns: nothing
      disableFieldForEditing: function (layer, costEqnField) {
        for (var i in layer.fields) {
          if (layer.fields.hasOwnProperty(i)) {
            var field = layer.fields[i];
            if (costEqnField === field.name) {
              field.editable = false;
              break;
            }
          }
        }
      },

      // Event handler before edits are applied to a layer.
      // returns: nothing
      layerBeforeApplyEditsComplete: function (results) {
        this._togglePanelLoadingIcon();

        if (results.deletes && results.deletes.length > 0) {
          this.delAddedFeature(results.deletes, results.target);
        }

        if (results.adds && results.adds.length > 0) {
          this.calculateCost(results.adds, results.target);
        }

        if (results.updates && results.updates.length > 0) {
          this.delAddedFeature(results.updates, results.target);
          this.calculateCost(results.updates, results.target);
        }
      },

      // Fetch the cost equation field from the given layer.
      // returns the cost equation field
      getCostEquationField: function (layer) {
        var layerId = layer.id;
        var result;
        array.forEach(this.config.editor.layerInfos, function (layerInfo) {
          if (layerInfo.layerId === layerId) {
            result = layerInfo.costEqnField;
          }
        });

        return result;
      },

      // Read configuration items for areal measurements.
      // returns: nothing
      _readArealConfig: function() {
        var defaultArealUnit = {label: this.nls.squareFeet,
                                value: 'UNIT_SQUARE_FEET'};

        this.arealUnit = defaultArealUnit.value;
        this.arealUnitDiv.innerHTML = defaultArealUnit.label;

        if (this.config.arealUnit) {
          if (this.config.arealUnit.label) {
            this.arealUnitDiv.innerHTML = this.config.arealUnit.label;
          }

          if (this.config.arealUnit.value) {
            this.arealUnit = this.config.arealUnit.value;
          }
        }
      },

      // Read configuration items for length measurements.
      // returns: nothing
      _readLengthConfig: function () {
        var defaultLengthUnit = {label: this.nls.foot,
                                 value: 'UNIT_FOOT'};

        this.lengthUnit = defaultLengthUnit.value;
        this.lengthUnitDiv.innerHTML = defaultLengthUnit.label;

        if (this.config.lengthUnit) {
          if (this.config.lengthUnit.label) {
            this.lengthUnitDiv.innerHTML = this.config.lengthUnit.label;
          }

          if (this.config.lengthUnit.value) {
            this.lengthUnit = this.config.lengthUnit.value;
          }
        }
      },

      // Read configuration items.
      // returns: nothing
      readConfig: function () {
        var defaultCurrencyUnit = this.nls.dollar;

        //Currency
        this.currencyUnitDiv.innerHTML = defaultCurrencyUnit;
        if (this.config.currencyUnit) {
          this.currencyUnitDiv.innerHTML = this.config.currencyUnit;
        }

        //Areal
        this._readArealConfig();

        //Length
        this._readLengthConfig();

        //Project Layer
        this.prjLyr = this.getLayerFromMap(this.config.projectLayer.featureLayer.url);
      },

      // Calculate cost of a the given features.
      // returns: nothing
      calculateCost: function (features, target) {
        if (features.length === 0) {
          return;
        }

        //atmost 1 feature.
        var feature = features[0];
        var gsvc = new GeometryService(this.gsvc.url);

        if (feature.geometry.type === 'polyline') {
          this.calculatePolylineCost(gsvc, feature, target);

        } else if (feature.geometry.type === 'polygon') {
          this.calculatePolygonCost(gsvc, feature, target);

        } else { // Point
          this.afterGsvcCalcComplete(feature, target, 1);
        }
      },

      // Calculate cost of a Polyline (feature)
      // returns: nothing
      calculatePolylineCost: function(gsvc, feature, target) {
        var params = new LengthsParameters();
        params.polylines = [feature.geometry];
        params.lengthUnit = GeometryService[this.lengthUnit];
        gsvc.lengths(params);

        gsvc.on('lengths-complete', lang.hitch(this, function (results) {
          if (results.result.lengths.length > 0) {
            var length = results.result.lengths.shift();
            this.afterGsvcCalcComplete(feature, target, length);
          }
        }), this.gsvcOnError);
      },

      // Calculate cost of a Polygon (feature)
      // returns: nothing
      calculatePolygonCost: function(gsvc, feature, target) {
        var params = new AreasAndLengthsParameters();
        params.areaUnit = GeometryService[this.arealUnit];
        params.polygons = [feature.geometry];
        gsvc.areasAndLengths(params);

        gsvc.on('areas-and-lengths-complete',
          lang.hitch(this, function (results) {
            var areas = results.result.areas;
            if (areas.length > 0) {
              var area = areas.shift();
              this.afterGsvcCalcComplete(feature, target, area);
            }
          }), this.gsvcOnError);
      },

      // Event handler for when Geometry Service calculation is complete.
      // returns: nothing
      afterGsvcCalcComplete: function(feature, target, measurement) {
        var costEqnField = this.featureStorage[target.id].costEqnField;
        var costEqn = feature.attributes[costEqnField];
        if (!costEqn) {
          console.log('No cost equation found: please check config.');
        }

        measurement = Math.abs(measurement);
        var solution = this.substituteAndSolve(costEqn, measurement);
        solution = Math.abs(solution);

        this.updateTotals(feature, measurement, solution);
        this.store(feature, target, measurement, solution);
      },

      // Substitute and solve with the given cost equation and measurement.
      // returns the solution
      substituteAndSolve: function (costEqn, measurement) {
        var solution;
        try {
          var substitute = string.substitute(costEqn,
            {'measurement': measurement});
          solution = dojo.eval(substitute);
        } catch (err) {
          solution = 0;
        }

        if (solution < 0) {
          solution = 0;
        }

        return solution;
      },

      // Store the feature along with it's measurement and cost.
      // returns: nothing
      store: function(feature, target, measurement, cost) {
        var add = {'feature': feature,
                   'measurement': measurement,
                   'cost': cost};

        var type = feature.geometry.type;

        this.featureStorage[target.id].addedFeatures.push(add);
        this.featureStorageCount++;
        this.updateFeatureCounts(type, 1);

        this.updateSaveClearSessionBtn();
      },

      // Toggles the Clear Session and Save button on the panel.
      // return: nothing
      updateSaveClearSessionBtn: function () {
        var disabledState = 'jimu-state-disabled';

        if (this.featureStorageCount === 0) {
          html.addClass(this.clearSessionBtn, disabledState);

          html.addClass(this.saveBtn, disabledState);
        } else {
          html.removeClass(this.clearSessionBtn, disabledState);
          if (this.prjLyr) {
            html.removeClass(this.saveBtn, disabledState);
          }
        }
      },

      //can we combine this with updateCost?
      // I think we can remove this and just increment based on the type of feature that was added.
      updateFeatureCounts: function (type, change) {
        var curr = parseInt(this[type + 'Count'].innerHTML, 10);
        this[type + 'Count'].innerHTML = curr + change;
      },

      // Update the running totals displayed on the panel.
      // returns: nothing
      updateTotals: function(feature, measurement, cost) {
        var type = feature.geometry.type;
        var where;

        if (type !== 'point') {
          if (type === 'polyline') {
            where = this.totalLength;
          } else {
            where = this.totalArea;
          }

          var newMeasurement = (parseFloat(where.innerHTML) + measurement);
          where.innerHTML = newMeasurement.toFixed(2);
        }

        var newCost = parseFloat(this.totalCost.innerHTML) + cost;
        this.totalCost.innerHTML = newCost.toFixed(2);
      },

      // Remove stored features drawn in this session.
      // returns nothing.
      delAddedFeature: function (deletes) {
        if (this.featureStorageCount === 0) {
          return;
        }

        array.forEach(deletes, lang.hitch(this, function (del) {
          var features = this.featureStorage[del.getLayer().id].addedFeatures;
          for (var i = 0; i < features.length; i++) {
            var f = features[i];
            if (f.feature === del) {
              var type = f.feature.geometry.type;

              features.splice(i, 1);
              this.updateFeatureCounts(type, -1);
              this.featureStorageCount--;
              this.updateTotals(f.feature, -1 * f.measurement, -1 * f.cost);

              this.updateSaveClearSessionBtn();
              break;
            }
          }
        }));


      },

      disableWebMapPopup:function () {
        if(this.map && this.map.webMapResponse){
          var handler = this.map.webMapResponse.clickEventHandle;
          if(handler){
            this.mapClickEventHandle = handler;
            handler.remove();
            this.map.webMapResponse.clickEventHandle = null;
          }
        }
      },

      enableWebMapPopup:function(){
        if(this.map && this.map.webMapResponse){
          var handler = this.map.webMapResponse.clickEventHandle;
          var listener = this.map.webMapResponse.clickEventListener;
          if(listener && !handler){
            this.map.webMapResponse.clickEventHandle = on(this.map,'click',lang.hitch(this.map, listener));
          }
        }
      },



      getLayerFromMap: function(url) {
        var ids = this.map.graphicsLayerIds;
        var len = ids.length;
        for (var i = 0; i < len; i++) {
          var layer = this.map.getLayer(ids[i]);
          if (layer.url === url) {
            return layer;
          }
        }
        return null;
      },

      getLayers: function(){
        var layerInfos = this.config.editor.layerInfos;
        for (var i = 0; i < layerInfos.length; i++) {
          var featureLayer = layerInfos[i].featureLayer;
          var layer = this.getLayerFromMap(featureLayer.url);
          if (!layer) {
            if(!layerInfos[i].featureLayer.options){
              layerInfos[i].featureLayer.options = {};
            }
            if(!layerInfos[i].featureLayer.options.outFields){
              if(layerInfos[i].fieldInfos){
                layerInfos[i].featureLayer.options.outFields = [];
                for(var j=0;j<layerInfos[i].fieldInfos.length;j++){
                  layerInfos[i].featureLayer.options.outFields.push(layerInfos[i].fieldInfos[j].fieldName);
                }
              } else {
                layerInfos[i].featureLayer.options.outFields = ['*'];
              }
            }
            layer = new FeatureLayer(featureLayer.url, featureLayer.options);
            this.map.addLayer(layer);
          }
          if (layer.visible) {
            layerInfos[i].featureLayer = layer;
            this.layers.push(layerInfos[i]);
          }
        }
      },

      initEditor: function() {
        var json = this.config.editor;
        var settings = {};
        for (var attr in json) {
          if (json.hasOwnProperty(attr)) {
            settings[attr] = json[attr];
          }
        }
        settings.layerInfos = this.layers;
        settings.map = this.map;

        var params = {
          settings: settings
        };

        this._createEditorDiv();

        this.editor = new Editor(params, this.editorWidgetDiv);
        this.editor.startup();
      },

      _createEditorDiv: function () {
        if (!this.editorWidgetDiv) {
          this.editorWidgetDiv = html.create('div', {
            style: {
              width: '100%',
              height: '100%'
            }
          });
          html.place(this.editorWidgetDiv, this.domNode);
        }

        var height = html.getStyle(this.editorWidgetDiv, 'height');

        var styleNode = html.toDom('<style>.jimu-widget-edit .grid{height: ' + (height - 100) + 'px;}</style>');
        html.place(styleNode, document.body);
      },

      // Initializes the Geometry Service
      // returns: nothing
      initGeometryService: function() {
        var gsvcURL = 'http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer';
        if (this.config.geometryServiceURL) {
          gsvcURL = this.config.geometryServiceURL;
        }
        this.gsvc = new GeometryService(gsvcURL);
      },

      onClose: function() {
        this.enableWebMapPopup();
        if(this.editor){
          this.editor.destroy();
        }
        this.layers = [];
        this.editor = null;
        this.editorWidgetDiv = html.create('div', {
          style: {
            width: '100%',
            height: '100%'
          }
        });
        html.place(this.editorWidgetDiv, this.domNode);
      }

    });
  });
