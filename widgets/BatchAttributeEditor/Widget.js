///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
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
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/Button',
    'dijit/form/TextBox',
    'dojo/dom',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    'dojo/aspect',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/query',
    'dojo/promise/all',
    'dojo/string',
    'jimu/BaseWidget',
    'jimu/dijit/SimpleTable',
    'jimu/dijit/LoadingIndicator',
    'jimu/dijit/Filter',
    'jimu/dijit/Popup',
    'jimu/utils',
    'esri/graphic',
    'esri/InfoTemplate',
    'esri/layers/FeatureLayer',
    'esri/tasks/FeatureSet',
    'esri/dijit/AttributeInspector',
    'esri/tasks/query',
    'esri/symbols/jsonUtils',
    'esri/toolbars/draw',
    'esri/geometry/geometryEngine',
    'esri/geometry/scaleUtils',
    'dojox/timing',
     'jimu/dijit/Message',
    './customDrawBox',
    './layerSyncDetails'
],
function (declare,
          _WidgetsInTemplateMixin,
          Button,
          TextBox,
          dom,
          lang,
          html,
          on,
          aspect,
          domConstruct,
          array,
          domStyle,
          domClass,
          query,
          all,
          string,
          BaseWidget,
          SimpleTable,
          LoadingIndicator,
          Filter,
          Popup,
          utils,
          Graphic,
          InfoTemplate,
          FeatureLayer,
          FeatureSet,
          AttributeInspector,
          EsriQuery,
          symbolJsonUtils,
          draw,
          geometryEngine,
          scaleUtils,
          Timer,
          Message,
          DrawBox,
          layerSyncDetails
          ) {
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    baseClass : 'solutions-widget-batcheditor',
    layersTable : null,
    updateLayers : null,
    helperLayer : null,
    helperEditFieldInfo : null,
    attrInspector : null,
    toolType : "Area",
    drawBox : null,
    selectByLayer : null,
    searchTextBox : null,
    mouseClickPos : null,
    selectQuery : null,
    timer : null,
    syncLayers : null,
    expressionLayers : null,
    drawnGrph : null,
    clickList: null,
    startup : function() {
      this.inherited(arguments);

    },
    postCreate : function() {
      this.inherited(arguments);
      if(this.config.updateLayers.length > 0) {
        this.expressionLayers = [];
        this.clickList = [];
        this._configureWidget();
        this._initSelectLayer();
        this.createLayerTable();
        this.loadLayerTable();
        this._addHelperLayer();
        this._createAttributeInspector();
        this._createQueryParams();
        this._setTheme();
        this.timer = new Timer.Timer(20000);
        this.own(aspect.after(this.timer, "onTick", lang.hitch(this, this._timerComplete), this));
      }

    },
    _initSelectLayer : function() {
      if (this.toolType === "Feature" || this.toolType === "FeatureQuery") {

        array.some(this.map.itemInfo.itemData.operationalLayers, function(layer) {
          if (layer.layerObject !== null && layer.layerObject !== undefined) {
            if (layer.layerObject.type === 'Feature Layer' && layer.url) {
              if (this.config.selectByLayer.name === layer.name || this.config.selectByLayer.name === layer.title) {
                this.selectByLayer = layer;
                if (this.config.selectByLayer.selectionSymbol) {
                  var highlightSymbol = symbolJsonUtils.fromJson(this.config.selectByLayer.selectionSymbol);
                  if (highlightSymbol !== null) {

                    layer.layerObject.setSelectionSymbol(highlightSymbol);

                  }
                }
                return true;
              }
            }
          }
          return false;
        }, this);
        if (this.selectByLayer === null) {
          Message({
            message : string.substitute(this.nls.errors.layerNotFound, {
              0 : this.config.selectByLayer.name,
              1 : this.config.selectByLayer.id
            })
          });
        }
      }
    },

    /*jshint unused:true */
    _setTheme : function() {
      if (this.appConfig.theme.name === "BoxTheme" ||
          this.appConfig.theme.name === "DartTheme" ||
          this.appConfig.theme.name === "LaunchpadTheme") {
        utils.loadStyleLink('dartOverrideCSS', this.folderUrl + "/css/dartTheme.css", null);
      }
    },
    _configureWidget : function() {
      /*
       this.existingText = {};
       this.existingText.addPoint = esri.bundle.toolbars.draw.addPoint;
       this.existingText.addShape = esri.bundle.toolbars.draw.addShape;
       this.existingText.freehand = esri.bundle.toolbars.draw.freehand;
       this.existingText.start = esri.bundle.toolbars.draw.start;
       esri.bundle.toolbars.draw.addPoint = "Click to select in this area";
       esri.bundle.toolbars.draw.addShape = "Draw a shape to select features";
       esri.bundle.toolbars.draw.freehand = "Press and hold to draw a shape to select features";
       esri.bundle.toolbars.draw.start = "Draw a shape to select features";
       */
      this.existingText = {};
      this.existingText.addPoint = draw.addPoint;
      this.existingText.addShape = draw.addShape;
      this.existingText.freehand = draw.freehand;
      this.existingText.start = draw.start;
      draw.addPoint = this.nls.drawBox.addPointToolTip;
      draw.addShape = this.nls.drawBox.addShapeToolTip;
      draw.freehand = this.nls.drawBox.freehandToolTip;
      draw.start = this.nls.drawBox.startToolTip;
      var types = null;
      if (this.config.selectByShape === true) {
        this.toolType = "Area";
        this.widgetIntro.innerHTML = this.nls.widgetIntroSelectByArea;
        types = ['polygon', 'point'];
      } else if (this.config.selectByFeature === true) {
        this.toolType = "Feature";

        this.widgetIntro.innerHTML = string.substitute(this.nls.widgetIntroSelectByFeature, {
          0 : this.config.selectByLayer.name
        });
        types = ['point'];
      } else if (this.config.selectByFeatureQuery === true) {
        this.toolType = "FeatureQuery";
        this.widgetIntro.innerHTML = string.substitute(this.nls.widgetIntroSelectByFeatureQuery, {
          0 : this.config.selectByLayer.name,
          1 : this.config.selectByLayer.queryField
        });

        types = ['point'];
      } else if (this.config.selectByQuery === true) {
        this.toolType = "Query";
        this.widgetIntro.innerHTML = this.nls.widgetIntroSelectByQuery;
      } else {
        this.toolType = "Area";
        this.widgetIntro.innerHTML = this.nls.widgetIntroSelectByArea;
        types = ['polygon', 'point'];
      }

      if (types) {
        this.drawBox = new DrawBox({
          types : types,
          showClear : false
        });
        this.drawBox.placeAt(this.selectionTool);
        this.drawBox.startup();
        this.drawBox.setMap(this.map);

        this.own(on(this.drawBox, 'DrawEnd', lang.hitch(this, this._onDrawEnd)));

      } else {

        this.searchTextBox = new TextBox({
          name : "queryText",
          value : ""/* no or empty value! */,
          placeHolder : this.nls.queryInput
        });
        this.searchTextBox.startup();
        this.searchTextBox.placeAt(this.selectionTool);

        var btnSearch = domConstruct.create("div", {
          innerHTML : this.nls.search
        });
        domConstruct.place(btnSearch, this.selectionTool, 'after');
        html.addClass(btnSearch, 'jimu-btn widget-draw-control');
        on(btnSearch, "click", lang.hitch(this, this._btnSearchClick));
      }

    },
    _btnSearchClick : function() {
      //  this._togglePanelLoadingIcon();
      this.loading.show();

      this._hideInfoWindow();
      this.mouseClickPos = this.map.extent.getCenter();
      this._selectInShape(null, this.searchTextBox.get("value"));
    },
    _findField : function(fields, name) {
      return array.filter(fields, function(field) {
        return field.name === name;
      });
    },
    _selectInShape : function(shape, searchValue) {
      this._clearResults(true);
      var defs = {};
      var rowData;
      var q = new EsriQuery();
      if (shape !== null) {
        if(shape.type === "point" || shape.type === "polyline") {
          var mapUnit = scaleUtils.getUnitValueForSR(this.map.spatialReference);
          q.geometry = geometryEngine.buffer(shape, 10, mapUnit);
        } else {
          q.geometry = shape;
        }
      }
      var fields;
      var selectedLayers = [];
      array.forEach(this.layersTable.getRows(), function(row) {

        rowData = this.layersTable.getRowData(row);
        if (rowData.isSelectable === true) {
          selectedLayers.push(rowData.label);
        }
      }, this);
      q.spatialRelationship = EsriQuery.SPATIAL_REL_INTERSECTS;
      array.forEach(this.updateLayers, function(layer) {
        if (selectedLayers.indexOf(layer.title) >= 0 || selectedLayers.indexOf(layer.layerObject.name) >= 0) {
          if (searchValue) {
            fields = this._findField(layer.layerObject.fields, layer.queryField);
            if (fields) {
              if (fields.length > 0) {
                if (fields[0].type === "esriFieldTypeString") {
                  q.where = layer.queryField.toString() + " = '" + searchValue.toString() + "'";
                } else {
                  q.where = layer.queryField.toString() + " = " + searchValue.toString() + "";
                }
              } else {
                console.log("field not found in layer");
              }
            } else {
              console.log("field not found in layer");
            }
          }
          var def = layer.layerObject.selectFeatures(q, FeatureLayer.SELECTION_NEW);
          //var sym = layer.layerObject.getSelectionSymbol();

          defs[layer.id] = def;
        }
      }, this);
      if (this.isEmptyObject(defs)) {
        this.loading.hide();
      } else {
        all(defs).then(lang.hitch(this, this._layerQueriesComplete));

      }

    },
    isEmptyObject : function(obj) {
      for (var prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
          return false;
        }
      }
      return true;
    },
    _selectSearchLayer : function(shape) {
      var q = new EsriQuery();
      if(shape.type === "point" || shape.type === "polyline") {
        var mapUnit = scaleUtils.getUnitValueForSR(this.map.spatialReference);
        q.geometry = geometryEngine.buffer(shape, 10, mapUnit);
      } else {
        q.geometry = shape;
      }
      if (this.toolType === "FeatureQuery") {
        q.outFields = [this.config.selectByLayer.queryField];
      }
      q.spatialRelationship = EsriQuery.SPATIAL_REL_INTERSECTS;
      this.selectByLayer.layerObject.selectFeatures(q, FeatureLayer.SELECTION_NEW)
        .then(lang.hitch(this, this._searchByLayerComplete));
    },
    _searchByLayerComplete : function(results) {
      if (results.length > 0) {
        if (this.toolType === "FeatureQuery") {
          var searchValue = results[0].attributes[this.config.selectByLayer.queryField];
          if (searchValue === null) {
            new Message({
              message : string.substitute(this.nls.errors.queryNullID, {
                0 : this.selectByLayer.title
              })
            });
            this._hideInfoWindow();
            this.loading.hide();
          } else {
            this._selectInShape(null, searchValue);
          }
        } else {
          this._selectInShape(results[0].geometry);
        }
      } else {
        this._hideInfoWindow();
        this.loading.hide();
        // this._togglePanelLoadingIcon();
      }
    },
    _clearRowHighlight : function(clearResultMessage) {

      var labelCell;
      var countCell;
      var syncCell;
      array.forEach(this.layersTable.getRows(), function(row) {

        labelCell = query('.label', row).shift();
        countCell = query('.numSelected', row).shift();
        syncCell = query('.syncStatus', row).shift();
        html.removeClass(labelCell, 'maxRecordCount');
        html.removeClass(countCell, 'maxRecordCount');
        html.removeClass(syncCell, 'syncComplete');
        html.removeClass(syncCell, 'syncProcessing');
        html.removeClass(syncCell, 'syncSkipped');
      }, this);
      if (clearResultMessage === true) {
        this.resultsMessage.innerHTML = "";
      }
    },
    _layerQueriesComplete : function(results) {
      var features = [];
      var rowData;

      var layerRes;
      var layer;
      var editData;
      var labelCell;
      var countCell;
      array.forEach(this.layersTable.getRows(), function(row) {

        rowData = this.layersTable.getRowData(row);
        if (results.hasOwnProperty(rowData.ID)) {
          layerRes = results[rowData.ID];
          layer = this.map.getLayer(rowData.ID);
          features = features.concat(layerRes);
          editData = {
            numSelected : layerRes.length.toString()
          };

          this.layersTable.editRow(row, editData);
          labelCell = query('.label', row).shift();
          countCell = query('.numSelected', row).shift();

          if (layerRes.length > 0) {
            if (layerRes.length >= layer.maxRecordCount) {

              html.addClass(labelCell, 'maxRecordCount');
              html.addClass(countCell, 'maxRecordCount');
            } else {
              html.removeClass(labelCell, 'maxRecordCount');
              html.removeClass(countCell, 'maxRecordCount');
            }
          } else {
            html.removeClass(labelCell, 'maxRecordCount');
            html.removeClass(countCell, 'maxRecordCount');
          }

          if (layerRes.length > 0) {
            this.clickList.push(on(layer, 'click', lang.hitch(this, function() {
              this.map.infoWindow.show(this.mouseClickPos, this.map.getInfoWindowAnchor(this.mouseClickPos));
            })));
          }

        }
      }, this);
      this._updateSelectionCount(features.length);

      if (features.length > 0) {
        this._summarizeFeatureFields(features);
        this._createAttributeInspector();
        this._createQueryParams();

        this.helperLayer.selectFeatures(this.selectQuery, FeatureLayer.SELECTION_NEW,
          lang.hitch(this, this._helperLayerSelectCallback),
          lang.hitch(this, this._errorCallback)
        );

      } else {
        this._hideInfoWindow();
        this.loading.hide();
        //this._togglePanelLoadingIcon();
      }
    },
    // Event handler for when a drawing is finished.
    // returns: nothing
    _onDrawEnd : function(graphic) {
      this.loading.show();
      //this._togglePanelLoadingIcon();
      this.drawnGrph = graphic;

      this._hideInfoWindow();

      if (graphic.geometryType === "esriGeomtryTypePoint") {
        this.mouseClickPos = graphic;
      } else {
        if (graphic.geometry.type === "extent") {
          this.mouseClickPos = graphic.geometry.getCenter();
        } else if (graphic.geometry.type === "polygon") {
          this.mouseClickPos = graphic.geometry.getCentroid();
        } else if (graphic.geometry.type === "polyline") {
          this.mouseClickPos = graphic.geometry.getExtent().getCenter();
        } else {
          this.mouseClickPos = graphic.geometry;
        }
      }

      if (this.toolType === "Area") {
        this._selectInShape(graphic.geometry);
      } else if (this.toolType === "Feature") {
        this._selectSearchLayer(graphic.geometry);
      } else if (this.toolType === "FeatureQuery") {
        this._selectSearchLayer(graphic.geometry);
      }

    },
    _errorCallback : function(evt) {
      console.log(evt);
      this.loading.hide();
      // this._togglePanelLoadingIcon();
    },
    // Callback function for 'Helper Layer' selection.
    // returns: nothing
    _helperLayerSelectCallback : function(features) {
      if (features.length > 0) {
        this.map.infoWindow.setTitle(this.label);
        this.map.infoWindow.setContent(this.attrInspector.domNode);
        this.map.infoWindow.show(this.mouseClickPos, this.map.getInfoWindowAnchor(this.mouseClickPos));
      } else {
        this._hideInfoWindow();
      }
      this.loading.hide();

      //this._togglePanelLoadingIcon();
    },

    // Clear the graphics from the widget.
    // returns: nothing
    _clearGraphics : function() {
      if (this.drawBox) {
        if (this.drawBox.drawLayer) {
          this.drawBox.drawLayer.clear();
        }
      }
      array.forEach(this.updateLayers, function(layer) {
        if (layer.layerObject !== null) {
          layer.layerObject.clearSelection();
        }
      });
      this._hideInfoWindow();
    },
    _togglePanelLoadingIcon : function() {

      if (html.hasClass(this.loadingImage, 'hide')) {
        html.removeClass(this.loadingImage, 'hide');
      } else {
        html.addClass(this.loadingImage, 'hide');
      }
    },
    _createQueryParams : function() {
      this.selectQuery = new EsriQuery();
      //this.selectQuery.where = '1=1';
      this.selectQuery.objectIds = [1];
      //this.selectQuery.outFields = ["*"];
    },

    loadLayerTable : function() {
      this.updateLayers = [];

      var label = '';
      var tableValid = false;
      var symbol = null;
      array.forEach(this.map.itemInfo.itemData.operationalLayers, function(layer) {
        if (layer.layerObject !== null && layer.layerObject !== undefined) {
          if (layer.layerObject.type === 'Feature Layer' && layer.url && layer.layerObject.isEditable() === true) {

            var filteredArr = array.filter(this.config.updateLayers, function(layerInfo) {
              return layerInfo.name === layer.title;
            });
            if (filteredArr.length > 0) {
              if (filteredArr[0].selectionSymbol) {
                var highlightSymbol = symbolJsonUtils.fromJson(filteredArr[0].selectionSymbol);
                layer.layerObject.setSelectionSymbol(highlightSymbol);
              }
              layer.queryField = filteredArr[0].queryField;
              this.updateLayers.push(layer);
              label = layer.title;
              this.layersTable.addRow({
                isSelectable : true,
                label : label,
                ID : layer.layerObject.id,
                numSelected : "0",
                selectionSymbol : symbol
              });
              tableValid = true;
            }
          }
        }
      }, this);

      if (!tableValid) {
        domStyle.set(this.tableLayerInfosError, 'display', '');
      } else {
        domStyle.set(this.tableLayerInfosError, 'display', 'none');
      }
    },
    createLayerTable : function() {
      var layerTableFields = [{
        name : 'spacer',
        type : 'text',
        title: '',
        width : 10
      }, {
        name : 'isSelectable',
        title : "",
        type : 'checkbox',
        'class' : 'editable',
        width : 30
      }, {
        name : 'actions',
        title : '<img src="' + this.folderUrl + 'css/images/filter.png" width=16 height=16>',
        type : 'actions',
        actions : ['edit'],
        width : 25
      }, {
        name : 'numSelected',
        title : this.nls.layerTable.numSelected,
        type : 'text',
        'class' : 'selectioncount',
        width : 40
      }, {
        name : 'label',
        title : this.nls.layerTable.colLabel,
        type : 'text'
      }, {
        name : 'syncStatus',
        type : 'text',
        title : this.nls.layerTable.colSyncStatus,
        width : 65
      }, {
        name : 'ID',
        type : 'text',
        hidden : true,
        width : 0
      }];
      var args = {
        fields : layerTableFields,
        selectable : false
      };
      domConstruct.empty(this.tableLayerInfos);
      this.layersTable = new SimpleTable(args);
      this.layersTable.placeAt(this.tableLayerInfos);
      this.layersTable.startup();
      this.own(on(this.layersTable, 'actions-edit', lang.hitch(this, function(tr) {
        this._showFilter(tr);
      })));
    },
    disableWebMapPopup : function() {
      if (this.map) {
        this.map.setInfoWindowOnClick(false);
      }
      //if (this.map && this.map.webMapResponse) {
      //    var handler = this.map.webMapResponse.clickEventHandle;
      //    if (handler) {
      //        handler.remove();
      //        this.map.webMapResponse.clickEventHandle = null;
      //    }
      //}
    },
    enableWebMapPopup : function() {
      if (this.map) {
        this.map.setInfoWindowOnClick(true);
      }
      //if (this.map && this.map.webMapResponse) {
      //    var handler = this.map.webMapResponse.clickEventHandle;
      //    var listener = this.map.webMapResponse.clickEventListener;
      //    if (listener && !handler) {
      //        this.map.webMapResponse.clickEventHandle = on(this.map,
      //                                                    'click',
      //                                                    lang.hitch(this.map, listener));
      //    }
      //}
    },
    // Add the helper layer for use in Attribute Inspector.
    // returns: nothing
    _addHelperLayer : function() {
      this.helperLayer = this._createHelperLayer();
      //this.map.addLayer(this.helperLayer);
    },
    // Create helper layer for Attribute Inspector.
    // returns: helper layer (FeatureLayer)
    _createHelperLayer : function() {
      if (this.updateLayers.length === 0) {
        return;
      }

      var firstUpdateLayer = this.updateLayers[0];
      var jsonFS = {
        'geometryType' : "esriGeometryPoint",
        'features' : [{
          'attributes' : this._generateHelperLayerAttributes(firstUpdateLayer)
        }]
      };

      var fs = new FeatureSet(jsonFS);
      var layerDefinition = {
        'name' : "",
        'fields' : this._generateHelperLayerFields(firstUpdateLayer),
        'objectIdField' : this._generateHelperObjIdField(firstUpdateLayer)
      };

      var featureCollection = {
        layerDefinition : layerDefinition,
        featureSet : fs
      };

      var fL = new FeatureLayer(featureCollection, {
        outFields : ['*'],
        infoTemplate : null
      });
      fL.setEditable(true);

      this.helperEditFieldInfo = this._generateHelperLayerFieldsInfos(firstUpdateLayer, layerDefinition.fields);
      return fL;
    },
    // Generate the attributes for the helper layer.
    // returns: {'field1': 'value1'...}
    _generateHelperLayerAttributes : function(layer) {
      var result = {};

      var fieldNames = array.map(this.config.commonFields, function(fieldInfo) {
        return fieldInfo.name;
      });
      array.forEach(layer.layerObject.fields, function(field) {
        var val = null;
        if (field.type === 'esriFieldTypeOID' || (field.name === layer.layerObject.objectIdField)) {
          result[field.name] = 1;
        } else if (fieldNames.indexOf(field.name) > -1) {
          result[field.name] = val;
        }
      }, this);

      return result;
    },
    // Generate the fields for the helper layer.
    // returns: [field1, field2,...]
    _generateHelperLayerFields : function(layer) {
      var fields = [];

      var fieldNames = array.map(this.config.commonFields, function(fieldInfo) {
        return fieldInfo.name;
      });
      array.forEach(layer.layerObject.fields, function(field) {
        if (field.type === 'esriFieldTypeOID' || (field.name === layer.layerObject.objectIdField)) {
          fields.push(field);
        } else if (fieldNames.indexOf(field.name) > -1) {
          fields.push(field);

        }
      }, this);

      return fields;
    },
    _generateHelperObjIdField: function(layer) {
      var objField = null;
      array.forEach(layer.layerObject.fields, function(field) {
        if ((field.name === layer.layerObject.objectIdField)) {
          objField = field.name;
        }
      }, this);

      return objField;
    },
    // Generate the field Infos used in the Attribute Inspector
    // returns fieldInfos
    _generateHelperLayerFieldsInfos : function(layer, fields) {
      var fieldInfos = [];

      var fieldNames = array.map(fields, function(field) {
        return field.name;
      });
      array.forEach(layer.layerObject.infoTemplate.info.fieldInfos, function(field) {

        if (fieldNames.indexOf(field.fieldName) > -1) {
          if (field.fieldName.toUpperCase() === 'OBJECTID' || (field.fieldName === layer.layerObject.objectIdField)) {
            field.isEditable = false;
            field.visible = false;
          } else {
            field.isEditable = true;
            field.visible = true;
            fieldInfos.push(field);
          }
        }
      }, this);
      return fieldInfos;
    },
    // Create the attribute inspector
    _createAttributeInspector : function() {
      var attrInspector;
      var layerInfos = [{
        'featureLayer' : this.helperLayer,
        'isEditable' : true,
        'showDeleteButton' : false,
        'fieldInfos' : this.helperEditFieldInfo
      }];
      try {
        attrInspector = new AttributeInspector({
          layerInfos : layerInfos,
          _hideNavButtons : true
        }, domConstruct.create('div'));
      } catch (err) {
        alert(err.message);
      }
      var saveButton = domConstruct.create('div', {
        'id' : 'attrInspectorSaveBtn',
        'class' : 'jimu-btn',
        innerHTML : this.nls.editorPopupSaveBtn
      });

      var loadingIcon = domConstruct.create('div', {
        'id' : 'popupLoadingIcon',
        'class' : 'loading hide'
      });

      domConstruct.place(saveButton, attrInspector.deleteBtn.domNode, 'after');

      domConstruct.place(loadingIcon, attrInspector.deleteBtn.domNode, 'after');

      this.own(on(saveButton, 'click', lang.hitch(this, this._attrInspectorOnSave)));

      attrInspector.on('attribute-change', lang.hitch(this, this._attrInspectorAttrChange));

      this.attrInspector = attrInspector;

    },
    // Event handler for when an attribute is changed in the attribute
    // inspector.
    // returns: nothing
    _attrInspectorAttrChange : function(evt) {
      var saveBtn = dom.byId('attrInspectorSaveBtn');

      //hacky way to check if fields arent validated.
      if (this.attrInspector.domNode.innerHTML.indexOf('Error') < 0) {
        html.removeClass(saveBtn, 'jimu-state-disabled');
      } else {
        html.addClass(saveBtn, 'jimu-state-disabled');
      }
      array.forEach(this.updateLayers, function(layer) {
        array.forEach(layer.layerObject.getSelectedFeatures(), function(feature) {
          if (evt.fieldValue !== this.nls.editorPopupMultipleValues) {
            feature.attributes[evt.fieldName] = evt.fieldValue;
          }
        }, this);
      }, this);
    },

    _xrange : function(b0, b1, quantum) {

      if (!quantum) {
        quantum = 1;
      }
      if (!b1) {
        b1 = b0;
        b0 = 0;
      }
      var out = [];
      for (var i = b0,
          idx = 0; i < b1; i += quantum, idx++) {
        out[idx] = i;
      }
      return out;
    },
    _chunks : function(l, n) {
      var newn = parseInt(1.0 * l.length / n + 0.5, 10);
      var retArr = [];
      for (var i in this._xrange(0, n - 1)) {
        retArr.push(l.slice(i * newn, i * newn + newn));

      }
      retArr.push(l.slice(n * newn - newn));
      return retArr;
    },
    // Event handler for when the Save button is clicked in the attribute inspector.
    // returns: nothing
    _attrInspectorOnSave : function(evt) {
      if (this.attrInspector.domNode.innerHTML.indexOf('Error') < 0) {
        html.removeClass(evt.target, 'jimu-state-disabled');
      } else {
        html.addClass(evt.target, 'jimu-state-disabled');
      }
      if (domClass.contains(evt.target, 'jimu-state-disabled')) {
        new Message({
          message : this.nls.errors.inputValueError
        });
        html.removeClass(evt.target, 'jimu-state-disabled');
        return;
      }
      this.loading.show();
      // this._togglePanelLoadingIcon();

      //disable the save button
      html.addClass(evt.target, 'jimu-state-disabled');
      this.map.infoWindow.hide();
      this.map.infoWindow.highlight = false;
      var syncDet;
      this.syncLayers = [];

      var rowData;

      var selectedLayers = [];
      array.forEach(this.layersTable.getRows(), function(row) {

        rowData = this.layersTable.getRowData(row);
        if (rowData.isSelectable === true) {
          selectedLayers.push(rowData.label);
        } else {
          this.layersTable.editRow(row, {
            'syncStatus' : this.nls.featuresSkipped
          });
          var cell = query('.syncStatus', row).shift();

          html.removeClass(cell, 'syncProcessing');
          html.removeClass(cell, 'syncComplete');
          html.addClass(cell, 'syncSkipped');
        }
      }, this);

      var validUpdate = false;
      array.forEach(this.updateLayers, function(layer) {
        if (selectedLayers.indexOf(layer.title) >= 0 || selectedLayers.indexOf(layer.layerObject.name) >= 0) {
          var selectFeat = layer.layerObject.getSelectedFeatures();
          if (selectFeat) {
            if (selectFeat.length > 0) {
              validUpdate = true;
              array.some(this.layersTable.getRows(), function(row) {
                rowData = this.layersTable.getRowData(row);

                if (rowData.ID === layer.id) {
                  this.layersTable.editRow(row, {
                    'syncStatus' : 0 + " / " + selectFeat.length
                  });
                  var cell = query('.syncStatus', row).shift();

                  html.removeClass(cell, 'syncComplete');
                  html.removeClass(cell, 'syncSkipped');
                  html.addClass(cell, 'syncProcessing');
                  return true;
                }

              }, this);

              var idx;
              var max_chunk = 300;
              var chunks;
              var bins;
              if (selectFeat.length > max_chunk) {

                bins = parseInt(selectFeat.length / max_chunk, 10);
                if (selectFeat.length % max_chunk > 0) {
                  bins += 1;
                }
                chunks = this._chunks(selectFeat, bins);
                idx = 0;
                syncDet = new layerSyncDetails({
                  "layerID" : layer.id,
                  "numberOfRequest" : bins,
                  "totalRecordsToSync" : selectFeat.length

                });
                on(syncDet, "complete", lang.hitch(this, this._syncComplete));
                on(syncDet, "requestComplete", lang.hitch(this, this._requestComplete));
                this.syncLayers.push(syncDet);

                this.applyCallback(chunks, idx, layer, syncDet);

              } else {
                chunks = [selectFeat];
                idx = 0;
                syncDet = new layerSyncDetails({
                  "layerID" : layer.id,
                  "numberOfRequest" : 1,
                  "totalRecordsToSync" : selectFeat.length

                });
                on(syncDet, "complete", lang.hitch(this, this._syncComplete));
                on(syncDet, "requestComplete", lang.hitch(this, this._requestComplete));

                this.syncLayers.push(syncDet);
                this.applyCallback(chunks, idx, layer, syncDet);

              }
            }
          }
        }
      }, this);

      if(validUpdate === false) {
        this.loading.hide();
        new Message({
          message : this.nls.errors.noSelectedLayers
        });
      }

    },
    applyCallback : function(chunks, idx, layer, syncDet) {
      var def;
      if (idx === 0) {
        def = layer.layerObject.applyEdits(null, chunks[idx], null,
          lang.hitch(this, this.applyCallback(chunks, idx + 1, layer, syncDet)),
          lang.hitch(this, this.applyErrorback(chunks, idx + 1, layer))
        );
        syncDet.addDeferred(def);
      } else {
        /*return function(added, updated, removed) {*/
        return function(added, updated, removed) {
          if (chunks.length > idx) {
            def = layer.layerObject.applyEdits(null, chunks[idx], null,
              lang.hitch(this, this.applyCallback(chunks, idx + 1, layer, syncDet)),
              lang.hitch(this, this.applyErrorback(chunks, idx + 1, layer))
            );
            syncDet.addDeferred(def);
          }
          return {
            'added': added,
            'updated' : updated,
            'removed': removed
          };
        };
      }
    },
    applyErrorback : function(chunks, idx, layer) {
      return function(err) {
        console.log(err);
        console.log(chunks);
        console.log(idx);
        console.log(layer);
        return err;
      };
    },
    _syncComplete : function() {
      var stillProc = array.some(this.syncLayers, function(syncDet) {
        if (syncDet.isComplete() === false) {

          return true;
        }
      });
      if (stillProc === false) {
        var total = 0;
        var totalComplete = 0;
        array.forEach(this.syncLayers, lang.hitch(this, function(syncDet) {
          total = total + syncDet.totalRecordsToSync;
          totalComplete = totalComplete + syncDet.recordsSynced;
          array.forEach(this.updateLayers, lang.hitch(this, function(updLyr) {
            if(typeof(updLyr.id) !== 'undefined') {
              if(updLyr.id === syncDet.layerID) {
                updLyr.layerObject.refresh();
              }
            }
          }));
        }));
        this._updateUpdatedFeaturesCount(totalComplete, total);
        this._clearResults(false);

        //this._togglePanelLoadingIcon();
        this.loading.hide();
      }

    },
    _requestComplete : function(args) {
      var rowData;
      array.some(this.layersTable.getRows(), function(row) {
        rowData = this.layersTable.getRowData(row);

        if (rowData.ID === args.layerID) {
          this.layersTable.editRow(row, {
            'syncStatus' : args.countSoFar + " / " + args.totalToSync
          });
          var cell = query('.syncStatus', row).shift();
          if (args.countSoFar === args.totalToSync) {
            html.removeClass(cell, 'syncProcessing');
            html.addClass(cell, 'syncComplete');
            html.removeClass(cell, 'syncSkipped');
          } else {
            html.removeClass(cell, 'syncComplete');
            html.addClass(cell, 'syncProcessing');
            html.removeClass(cell, 'syncSkipped');
          }
          return true;
        }
      }, this);

      //console.log(args.layerID + ": " + args.countSoFar + " / " + args.totalToSync);
    },
    _hideInfoWindow : function() {
      if (this.map.infoWindow.isShowing) {
        this.map.infoWindow.hide();
        this.map.infoWindow.highlight = false;
        this.map.graphics.clear();
      }
    },
    // Summarizes selected features' fields. If a field has more than one
    // value then helper layer gets a blank string in that field otherwise,
    // keep the same valued.
    // returns: nothing
    _summarizeFeatureFields : function(features) {
      var fields = this.helperEditFieldInfo;

      array.forEach(fields, function(field) {
        if (field.visible) {
          var fieldName = field.fieldName;
          var different = false;
          var first = features[0].attributes[fieldName];
          different = array.filter(features, function(feature) {
            return (feature.attributes[fieldName] !== first);
          }).length > 0;

          if (different) {
            if(fieldName !== this.helperLayer.objectIdField) {
              this.helperLayer.graphics[0].attributes[fieldName] = this.nls.editorPopupMultipleValues;
            } else {
              this.helperLayer.graphics[0].attributes[fieldName] = first;
            }
          } else {
            this.helperLayer.graphics[0].attributes[fieldName] = first;
          }
        }
      }, this);
    },
    _clearResults : function(clearResultMessage) {
      if (clearResultMessage === null) {
        clearResultMessage = true;
      }
      array.forEach(this.updateLayers, function(layer) {
        layer.layerObject.clearSelection();
      }, this);
      array.forEach(this.clickList, function(evt) {
        evt.remove();
      });
      this.clickList = [];

      if(this.layersTable) {
        array.forEach(this.layersTable.getRows(), function(row) {

          this.layersTable.editRow(row, {
            'numSelected' : "0"
          });

        }, this);
        array.forEach(this.layersTable.getRows(), function(row) {

          this.layersTable.editRow(row, {
            'syncStatus' : ""
          });

        }, this);
        this._clearRowHighlight(clearResultMessage);
      }
      this._hideInfoWindow();
    },
    _updateUpdatedFeaturesCount : function(count, total) {
      this.resultsMessage.innerHTML = string.substitute(this.nls.featuresUpdated, {
        0 : count,
        1 : total
      });
      this.timer.stop();
      this.timer.start();
    },
    _updateSelectionCount : function(count) {
      this.resultsMessage.innerHTML = string.substitute(this.nls.featuresSelected, {
        0 : count
      });
      this.timer.stop();
      this.timer.start();
    },
    _timerComplete : function() {
      if (this.resultsMessage !== null && this.resultsMessage !== undefined) {
        this.resultsMessage.innerHTML = "";
      }
      this.timer.stop();
    },

    _showFilter : function(pTR) {

      var rowData = this.layersTable.getRowData(pTR);
      var url;
      var definition;
      var workLayer;
      var defaultDef = '';
      var expression;
      array.forEach(this.updateLayers, lang.hitch(this, function(layer) {
        if (layer.id === rowData.ID) {
          workLayer = layer;
          definition = layer.resourceInfo;
          url = layer.url;
          if(workLayer.layerObject.getDefinitionExpression()) {
            defaultDef = workLayer.layerObject.getDefinitionExpression();
          }
        }
      }));
      if (this.expressionLayers.length > 0) {
        var exprExist = false;
        array.forEach(this.expressionLayers, lang.hitch(this, function(expLyr) {
          if (expLyr.id === rowData.ID) {
            expression = expLyr;
            exprExist = true;
          }
        }));
        if (exprExist === false) {
          this.expressionLayers.push({
            'id' : rowData.ID,
            'expr' : '',
            'defaultExp' : workLayer.layerObject.getDefinitionExpression()
          });
          expression = this.expressionLayers[this.expressionLayers.length - 1];
        }
      } else {
        this.expressionLayers.push({
          'id' : rowData.ID,
          'expr' : '',
          'defaultExp' : workLayer.layerObject.getDefinitionExpression()
        });
        expression = this.expressionLayers[0];
      }

      var filter = new Filter({
        noFilterTip : this.nls.noFilterTip,
        style : "width:100%;margin-top:22px;"
      });
      var filterPopup = new Popup({
        titleLabel : this.nls.filterPopup,
        width : 680,
        height : 485,
        content : filter,
        buttons : [{
          label : this.nls.ok,
          onClick : lang.hitch(this, function() {
            var partsObj = filter.toJson();
            if (partsObj && partsObj.expr) {
              if(partsObj.expr === '1=1') {
                if (expression.defaultExp) {
                  workLayer.layerObject.setDefinitionExpression(expression.defaultExp + ' AND (' + partsObj.expr + ')');
                } else {
                  workLayer.layerObject.setDefinitionExpression(partsObj.expr);
                }
              } else {
                if (expression.defaultExp) {
                  workLayer.layerObject.setDefinitionExpression(expression.defaultExp + ' AND (' + partsObj.expr + ')');
                } else {
                  workLayer.layerObject.setDefinitionExpression(partsObj.expr);
                }
              }
              //console.log(workLayer.layerObject.getDefinitionExpression());
              var regEvent = on(workLayer.layerObject, "update-end", lang.hitch(this, function() {
                if (workLayer.layerObject.getSelectedFeatures().length > 0) {
                  this._clearResults(true);
                  lang.hitch(this, this._onDrawEnd(this.drawnGrph));
                  regEvent.remove();
                }
              }));
              expression.expr = partsObj;

              var labelCell = query('.label', pTR).shift();
              if(expression.expr.expr !== '1=1') {
                domClass.add(labelCell, 'filtered');
              } else {
                domClass.remove(labelCell, 'filtered');
              }

              filterPopup.close();
              filterPopup = null;
            } else {
              new Message({
                message : this.nls.setFilterTip
              });
            }
          })
        }, {
          label : this.nls.cancel
        }]
      });
      //var filterObj = workLayer.layerObject.getDefinitionExpression();
      if (expression.expr !== '') {
        filter.buildByFilterObj(url, expression.expr, definition);
      } else {
        filter.buildByExpr(url, null, definition);
      }

    },

    onOpen : function() {

      this.disableWebMapPopup();
      /*
       esri.bundle.toolbars.draw.addPoint = this.nls.drawBox.addPointToolTip;
       esri.bundle.toolbars.draw.addShape  = this.nls.drawBox.addShapeToolTip;
       esri.bundle.toolbars.draw.freehand  = this.nls.drawBox.freehandToolTip;
       esri.bundle.toolbars.draw.start  = this.nls.drawBox.startToolTip;
       */
      draw.addPoint = this.nls.drawBox.addPointToolTip;
      draw.addShape = this.nls.drawBox.addShapeToolTip;
      draw.freehand = this.nls.drawBox.freehandToolTip;
      draw.start = this.nls.drawBox.startToolTip;
      if (this.config.toggleLayersOnOpen === true) {
        array.forEach(this.updateLayers, function(layer) {
          layer.layerObject.setVisibility(true);
        });
      }
    },
    onClose : function() {
      /*
       esri.bundle.toolbars.draw.addPoint =   this.existingText.addPoint;
       esri.bundle.toolbars.draw.addShape = this.existingText.addShape;
       esri.bundle.toolbars.draw.freehand = this.existingText.freehand;
       esri.bundle.toolbars.draw.start = this.existingText.start;
       */
      this._clearResults(true);
      if(typeof(this.existingText) !== 'undefined') {
        draw.addPoint = this.existingText.addPoint;
        draw.addShape = this.existingText.addShape;
        draw.freehand = this.existingText.freehand;
        draw.start = this.existingText.start;
      }
      this.enableWebMapPopup();
      if (this.config.toggleLayersOnOpen === true) {
        array.forEach(this.updateLayers, function(layer) {
          layer.layerObject.setVisibility(false);
        });
      }
      array.forEach(this.updateLayers, lang.hitch(this, function(layer) {
        array.forEach(this.expressionLayers, lang.hitch(this, function(expLyr) {
          if (expLyr.id === layer.id) {
            if (layer.layerObject.getDefinitionExpression() !== expLyr.defaultExp) {
              layer.layerObject.setDefinitionExpression(expLyr.defaultExp);
            }
          }
        }));
      }));
      this.expressionLayers = [];
      if(this.layersTable) {
        array.forEach(this.layersTable.getRows(), lang.hitch(this, function(row) {
          var labelCell = query('.label', row).shift();
          domClass.remove(labelCell, 'filtered');
        }));
      }

    },

    onDeActive:function(){
      this.enableWebMapPopup();
    },

    onActive: function(){
      this.disableWebMapPopup();
    },

    destroy : function() {
      array.forEach(this.clickList, function(evt) {
        evt.remove();
      });
      this._clearGraphics();

      if (this.drawBox) {
        this.drawBox.destroy();
      }
      if (this.attrInspector) {
        this.attrInspector.destroy();
      }
      this.clickList = null;
      this.layersTable = null;
      this.updateLayers = null;
      this.helperLayer = null;
      this.helperEditFieldInfo = null;
      this.attrInspector = null;
      this.toolType = null;
      this.selectByLayer = null;
      this.searchTextBox = null;
      this.mouseClickPos = null;
      this.selectQuery = null;
      this.expressionLayers = null;
      this.drawnGrph = null;
      this.timer = null;

      this.inherited(arguments);
    }
  });
});
