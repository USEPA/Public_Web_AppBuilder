///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/_base/array',

    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',

    'esri/dijit/AttributeInspector',
    'esri/graphic',
    'esri/InfoTemplate',
    'esri/layers/FeatureLayer',
    'esri/tasks/FeatureSet',
    'esri/tasks/query',
    'esri/symbols/jsonUtils',

    'dojo/on',
    'dojo/dom',
    'dojo/dom-attr',
    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/query',
    'dojo/string',
    'dojo/fx',
    'dojo/dom-style',

    'jimu/dijit/SymbolChooser',
    'jimu/dijit/DrawBox'
  ],

  function (declare, lang, html, array, _WidgetsInTemplateMixin, BaseWidget,
    AttributeInspector, Graphic, InfoTemplate, FeatureLayer, FeatureSet,
    Query, symbolJsonUtils, on, dom, domAttr, domConstruct, domClass,
    dojoQuery, string, coreFx, style, SymbolChooser, DrawBox) { /*jshint unused: false*/
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Draw',
      baseClass: 'jimu-widget-draw',
      selectFromLayer: null,
      selectWithLayerInfoTemplate: null,
      selectWithLayer: null,
      helperLayer: null,
      attrInspector: null,
      mode: null,
      mouseClickPos: null,

      postCreate: function () {
        this.inherited(arguments);

        this.drawBox.setMap(this.map);

        if (this.config.drawSymbol) {
          this.drawBox.setPolygonSymbol(symbolJsonUtils.fromJson(this.config.drawSymbol));
        }

        // Try to find the layers to select from config
        if (!this._findLayer(this.config.layers.selectFrom.name, 'from')) {
          // no layer to select from, don't allow select options
          html.addClass(this.selectWithShapeBtn, 'jimu-state-disabled');
          html.addClass(this.selectWithLayerBtn, 'jimu-state-disabled');

        } else {
          if (!this._findLayer(this.config.layers.selectWith.name,
            'with')) {
            html.addClass(this.selectWithLayerBtn,
              'jimu-state-disabled');
          }

          this._addHelperLayer();
          this._createAttributeInspector();
          this._bindEvents();
        }
      },

      // Bind events for this widget
      // returns: nothing
      _bindEvents: function () {

        // DrawBox events
        this.own(on(this.drawBox, 'DrawEnd', lang.hitch(this, this._onDrawEnd)));

        // Layer events
        this.own(this.selectWithLayer.on('click', lang.hitch(this, this
          ._selectWithLayerClick)));

        // infoWindow events
        this.own(this.map.infoWindow.on('hide', lang.hitch(this, this._onHideInfoWindow)));
        this.own(this.map.infoWindow.on('show', lang.hitch(this, this._onShowInfoWindow)));
      },

      // Bind animations for this widget
      // returns: nothing
      _bindAnimations: function () {
        var drawboxNode = dojoQuery('.jimu-draw-box')[0];
        html.addClass(drawboxNode, 'hide');

        this.own(on(this.selectWithShapeBtn, 'click', function () {
          coreFx.wipeIn({
            node: drawboxNode
          }).play();
        }));

        this.own(on(this.selectWithLayerBtn, 'click', function () {
          if (!html.hasClass(drawboxNode, 'hide')) {
            coreFx.wipeOut({
              node: drawboxNode
            }).play();
          }
        }));
      },

      // layerName: layer url to find in map
      // store: where to store the layer
      // returns: true if layer found and stored, false otherwise.
      _findLayer: function (layerName, where) {
        var result = null;

        array.forEach(this.map.graphicsLayerIds, function (layerId) {
          var layer = this.map.getLayer(layerId);
          if (layer.name === layerName && layer.url) {
            result = layer;
          }
        }, this);

        if (result !== null) {
          if (where === 'with') {
            this.selectWithLayer = result;

          } else if (where === 'from') {
            this.selectFromLayer = result;

          } else {
            console.log('findLayer: layer not stored');
            return false;
          }

          return true;

        } else {
          console.log(layerName + ' layer not found.');
          return false;
        }
      },

      // Create helper layer for Attribute Inspector.
      // returns: helper layer (FeatureLayer)
      _createHelperLayer: function () {
        var jsonFS = {
          'geometryType': this.selectFromLayer.geometryType,
          'features': [{
            'attributes': this._generateHelperLayerAttributes()
          }]
        };

        var fs = new FeatureSet(jsonFS);

        var layerDefinition = {
          'name': this.selectFromLayer.name,
          'fields': this.selectFromLayer.fields
        };

        var featureCollection = {
          layerDefinition: layerDefinition,
          featureSet: fs
        };

        var fL = new FeatureLayer(featureCollection, {
          outFields: ['*'],
          infoTemplate: this.selectFromLayer.infoTemplate
        });
        fL.setEditable(true);

        return fL;
      },

      // Add the helper layer for use in Attribute Inspector.
      // returns: nothing
      _addHelperLayer: function () {
        this.helperLayer = this._createHelperLayer();
        this.map.addLayer(this.helperLayer);
      },

      // Generate the attributes for the helper layer.
      // returns: {'field1': 'value1'...}
      _generateHelperLayerAttributes: function () {
        var result = {};

        array.forEach(this.selectFromLayer.fields, function (field) {
          var val;
          if (field.type === 'esriFieldTypeOID') {
            val = 1;
          }
          result[field.name] = val;
        });

        return result;
      },

      // Summarizes selected features' fields. If a field has more than one
      // value then helper layer gets a blank string in that field otherwise, // keep the same value.
      // returns: nothing
      _summarizeFeatureFields: function (features) {
        var fields = this.helperLayer.infoTemplate.info.fieldInfos;

        array.forEach(fields, function (field) {
          if (field.visible) {
            var fieldName = field.fieldName;
            var different = false;
            var first = features[0].attributes[fieldName];
            different = array.filter(features, function (feature) {
              return (feature.attributes[fieldName] !== first);
            }).length > 0;

            if (different) {
              this.helperLayer.graphics[0].attributes[fieldName] =
                this.nls.editorPopupMultipleValues;
            } else {
              this.helperLayer.graphics[0].attributes[fieldName] =
                first;
            }
          }
        }, this);
      },

      // Event handler for info window (hide).
      // returns: nothing
      _onHideInfoWindow: function () {
        if (!this.map.infoWindow.isShowing) {
          this._clearGraphics();
        }
      },

      // Event handler for info window (show).
      // returns: nothing
      _onShowInfoWindow: function (evt) {},

      // Toggle the panel loading icon.
      // returns: nothing

      _togglePanelLoadingIcon: function () {
        var loading = dom.byId('panelLoadingIcon');

        if (html.hasClass(loading, 'hide')) {
          html.removeClass(loading, 'hide');
        } else {
          html.addClass(loading, 'hide');
        }
      },

      // Toggle the popup loading icon.
      // returns: nothing
      _togglePopupLoadingIcon: function () {
        var loading = dom.byId('popupLoadingIcon');
        html.removeClass(loading, 'hide');
      },

      // Event handler for when any 'Select' button is clicked in the widget
      // panel.
      // returns: nothing
      _selectWithBtnClick: function (evt) {
        var which = domAttr.get(evt.target, 'data-dojo-attach-point');

        if (!(domClass.contains(evt.target, 'jimu-state-disabled') ||
          this.mode === which)) {
            if (which === 'selectWithLayerBtn') {
              this.selectWithLayerInfoTemplate = this.selectWithLayer.infoTemplate;
              this.selectWithLayer.infoTemplate = null;

              html.removeClass(this.selectWithLayerHelp, 'hide');
              html.addClass(this.drawingOptions, 'hide');

            } else {
              if (this.selectWithLayerInfoTemplate) {
                this.selectWithLayer.infoTemplate = this.selectWithLayerInfoTemplate;
              }

              coreFx.wipeIn({
                node: this.drawingOptions
              }).play();
              html.addClass(this.selectWithLayerHelp, 'hide');
              html.removeClass(this.drawingOptions, 'hide');
            }
            this._updateSelectedFeaturesCount(0);
            this.mode = which;
            this._hideInfoWindow();
        }
      },

      // Event handler for when select with layer is clicked.
      // returns: nothing
      _selectWithLayerClick: function (evt) {
        if (this.mode === 'selectWithLayerBtn' && evt.graphic._graphicsLayer === this.selectWithLayer) {
          this._togglePanelLoadingIcon();
          this.mouseClickPos = evt.mapPoint;
          this._selectInExtent(evt.graphic);
        }
      },

      // Event handler for when a drawing is finished.
      // returns: nothing
      _onDrawEnd: function (graphic) {
        if (graphic._graphicsLayer.graphics.length > 1) {
          this._clearGraphics();
          this._clearSelected();
          this.drawBox.drawLayer.add(graphic);
        }

        this.mouseClickPos = graphic._extent.getCenter();
        this._togglePanelLoadingIcon();
        this._selectInExtent(graphic);
      },

      // Using 'Select from Layer', select features within src (graphic,
      // polygon).
      // returns: nothing
      _selectInExtent: function (src) {
        if (!this.selectFromLayer.isVisibleAtScale(this.map.getScale())) {
          return;
        }

        this._resetSymbology(this.selectFromLayer);
        this._createAttributeInspector();

        var q = new Query();
        q.geometry = src.geometry;
        q.spatialRelationship = Query[this.config.spatialRel];

        this.selectFromLayer.selectFeatures(q, FeatureLayer.SELECTION_NEW,
          lang.hitch(this, this._selectFromLayerCallback));
      },


      // Callback function for 'Select From Layer' selection.
      // returns: nothing
      _selectFromLayerCallback: function (features) {
        if (this.config.highlightSymbol) {
          var highlightSymbol = symbolJsonUtils.fromJson(this.config.highlightSymbol);

          array.forEach(features, function (feature) {
            feature.setSymbol(highlightSymbol);
          });
        }

        if (features.length > 0) {
          if (features.length >= 1000) {
            this._toggleMaxRecordWarning(features[0]._graphicsLayer.maxRecordCount);
          } else {
            this._toggleMaxRecordWarning();
          }

          this._summarizeFeatureFields(features);

          var q = new Query();
          q.objectIds = [1];
          this.helperLayer.selectFeatures(q, FeatureLayer.SELECTION_NEW,
            lang.hitch(this, this._helperLayerSelectCallback));
        } else {
          this._togglePanelLoadingIcon();
        }
        this._updateSelectedFeaturesCount(features.length);
      },

      // Callback function for 'Helper Layer' selection.
      // returns: nothing
      _helperLayerSelectCallback: function (features) {
        var map = this.map;

        map.infoWindow.setTitle(this.nls.editorPopupTitle);
        map.infoWindow.setContent(this.attrInspector.domNode);
        map.infoWindow.show(this.mouseClickPos, map.getInfoWindowAnchor(this.mouseClickPos));

        this._togglePanelLoadingIcon();
      },

      // Create the attribute inspector
      _createAttributeInspector: function () {
        var layerInfos = [{
          'featureLayer': this.helperLayer,
          'isEditable': true,
          'showDeleteButton': false,
          'fieldInfos': this._layerFieldsToFieldInfos()
        }];

        var attrInspector = new AttributeInspector({
          layerInfos: layerInfos,
          _hideNavButtons: true
        }, domConstruct.create('div'));

        var saveButton = domConstruct.create('div', {
          'id': 'attrInspectorSaveBtn',
          'class': 'jimu-btn',
          innerHTML: this.nls.editorPopupSaveBtn
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

      // Return an array of visible fields from the 'Select From Layer (
      // helper)' for display in attribute inspector.
      // returns: array of visible fields
      _layerFieldsToFieldInfos: function () {
        var fields = this.helperLayer.infoTemplate.info.fieldInfos;

        return array.filter(fields, function (field) {
          return field.visible;
        });
      },

      // Event handler for when an attribute is changed in the attribute
      // inspector.
      // returns: nothing
      _attrInspectorAttrChange: function (evt) {
        var saveBtn = dom.byId('attrInspectorSaveBtn');

        //hacky way to check if fields arent validated.
        if (this.attrInspector.domNode.innerHTML.indexOf('Error') < 0) {
          html.removeClass(saveBtn, 'jimu-state-disabled');
        } else {
          html.addClass(saveBtn, 'jimu-state-disabled');
        }

        array.forEach(this.selectFromLayer.getSelectedFeatures(),
          function (feature) {
            if (evt.fieldValue !== this.nls.editorPopupMultipleValues) {
              feature.attributes[evt.fieldName] = evt.fieldValue;
            }
          }, this);
      },

      // Event handler for when the Save button is clicked in the attribute inspector.
      // returns: nothing
      _attrInspectorOnSave: function (evt) {
        if (domClass.contains(evt.target, 'jimu-state-disabled')) {
          return;
        }

        this._togglePopupLoadingIcon();

        //disable the save button
        html.addClass(evt.target, 'jimu-state-disabled');

        this.selectFromLayer.applyEdits(null, this.selectFromLayer.getSelectedFeatures(),
          null,
          lang.hitch(this, function (added, updated, removed) {
            this._updateUpdatedFeaturesCount(updated.length);
            this._hideInfoWindow();
          }),
          lang.hitch(this, function (err) {
            console.log('ERROR: ' + err);
            this._updateUpdatedFeaturesCount(0);
            this._clearSelected();
            this._hideInfoWindow();
          })
          );
      },

      // Hide the Info Window.
      // returns: nothing
      _hideInfoWindow: function () {
        if (this.map.infoWindow.isShowing) {
          this.map.infoWindow.hide();
        }
      },

      // Clear the drawn graphics.
      // returns: nothing
      _clearGraphics: function () {
        this.drawBox.drawLayer.clear();
      },

      // Clears selected features from 'Select From Layer'
      // returns: nothing
      _clearSelected: function () {
        this.selectFromLayer.clearSelection();
        this._resetSymbology(this.selectFromLayer);
        this._updateSelectedFeaturesCount(0);
      },

      // Toggles 'max record returned by server' error message
      // returns: nothing
      _toggleMaxRecordWarning: function (max) {
        var msg = dom.byId('maxRecordWarning');

        if (max) {
          html.removeClass(msg, 'hide');
          msg.innerHTML = string.substitute(this.nls.maxRecordCount, {
            0: max
          });
        } else {
          html.addClass(msg, 'hide');
        }
      },

      // Update selected features count.
      // returns: nothing
      _updateSelectedFeaturesCount: function (count) {
        var msg = string.substitute(this.nls.featuresSelected, {
          0: count
        });
        dom.byId('selectedFeaturesCount').innerHTML = msg;
      },

      // Update updated features count.
      // returns: nothing
      _updateUpdatedFeaturesCount: function (count) {
        dom.byId('updatedFeaturesCount').innerHTML = string.substitute(this.nls.featuresUpdated, {
          0: count
        });
      },

      // Restore original symbology of layer.
      // returns: nothing
      _resetSymbology: function (layer) {
        var renderer = layer.renderer;
        array.forEach(layer.graphics, function (graphic) {
          graphic.setSymbol(renderer.getSymbol(graphic));
        });
      },

      // Event handler for when widget closes.
      // returns: nothing
      onClose: function () {
        this.drawBox.deactivate();
        this._clearSelected();
        this._resetSymbology(this.selectFromLayer);

        this._hideInfoWindow();
        this.mode = null;

        if (this.selectWithLayerInfoTemplate) {
          this.selectWithLayer.infoTemplate = this.selectWithLayerInfoTemplate;
        }
      },

      // Destroy the widget.
      // returns: nothing
      destroy: function () {
        if (this.drawBox) {
          this.drawBox.destroy();
          this.drawBox = null;
        }
        this.inherited(arguments);
      },

      startup: function () {
        this.inherited(arguments);
      }
    });
  });
