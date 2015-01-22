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

    'dijit/_WidgetsInTemplateMixin',

    'esri/symbols/jsonUtils',

    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/PictureMarkerSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',

    'jimu/BaseWidgetSetting',
    'jimu/dijit/SymbolChooser',

    'dojo/fx',
    'dojo/on',

    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/html',

    'dijit/form/Select'
  ],
  function (
    declare,
    _WidgetsInTemplateMixin,
    jsonUtils, SimpleMarkerSymbol, PictureMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
    BaseWidgetSetting,
    SymbolChooser,
    coreFx,
    on,
    array, lang, html) {
      return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
          //these two properties is defined in the BaseWidget
          baseClass: 'jimu-widget-batch-editor-setting',
          mode: null,
          currentSymbol: null,
          currentSpatialRel: null,
          currentDrawSymbol: null,

          startup: function () {
              this.inherited(arguments);
              if (!this.config.layers) {
                  this.config.layers = {};
              }

              this.addLayerOptions();

              this.bindEvents();
              //this.bindAnimations();

              this.setConfig(this.config);
          },

          bindAnimations: function () {
              this.own(on(this.selectFromLayerSelect, 'change', function () {
                  coreFx.wipeIn({
                      node: this.settingContent
                  }).play();
              }));
          },

          bindEvents: function () {
              this.own(this.selectFromLayerSelect.on('change', lang.hitch(this, this.onSelectFromChange)));

              this.own(this.selectWithLayerSelect.on('change', lang.hitch(this, this.onSelectWithChange)));

              //spatial relationship chooser
              this.own(this.spatialRelChooser.on('change', lang.hitch(this, this.onSpatialRelChange)));

              //highlight symbol choosers
              this.own(this.pointHighlightChooser.on('change', lang.hitch(this, this.onHighlightSymbolChange)));

              this.own(this.lineHighlightChooser.on('change', lang.hitch(this, this.onHighlightSymbolChange)));

              this.own(this.fillHighlightChooser.on('change', lang.hitch(this, this.onHighlightSymbolChange)));

              //draw symbol chooser
              this.own(this.fillDrawChooser.on('change', lang.hitch(this, this.onDrawSymbolChange)));
          },

          onSpatialRelChange: function (evt) {
              this.currentSpatialRel = evt;
          },

          onHighlightSymbolChange: function (evt) {
          },

          onDrawSymbolChange: function (evt) {
              this.currentDrawSymbol = evt;
          },

          onSelectWithChange: function (evt) {
          },

          onSelectFromChange: function (evt) {

              var map = this.map;

              html.addClass(this.pointHighlightSection, 'hide');
              html.addClass(this.lineHighlightSection, 'hide');
              html.addClass(this.fillHighlightSection, 'hide');

              if (evt) {
                  html.removeClass(this.settingHighlight, 'hide');

                  var layerIds = array.filter(map.graphicsLayerIds, function (layerId) {
                      return map.getLayer(layerId).name === evt;
                  });

                  if (layerIds.length > 0) {
                      var layer = map.getLayer(layerIds[0]);

                      switch (layer.geometryType) {
                          //http://help.arcgis.com/en/sdk/10.0/arcobjects_net/componenthelp/index.html#//002m0000001p000000 
                          case 'esriGeometryPoint':
                              html.removeClass(this.pointHighlightSection, 'hide');
                              this.mode = this.pointHighlightChooser;
                              break;

                          case 'esriGeometryLine':
                          case 'esriGeometryPolyline':
                              html.removeClass(this.lineHighlightSection, 'hide');
                              this.mode = this.lineHighlightChooser;
                              break;

                          case 'esriGeometryPolygon':
                              html.removeClass(this.fillHighlightSection, 'hide');
                              this.mode = this.fillHighlightChooser;
                              break;
                      }
                  }
              } else {
                  html.addClass(this.settingHighlight, 'hide');
              }
          },

          addLayerOptions: function () {
              var map = this.map;
              var settings = this;

              array.forEach(map.graphicsLayerIds, function (layerId) {
                  var layer = map.getLayer(layerId);
                  var maxRecordCount = layer.maxRecordCount;
                  var o1, o2;

                  if (layer.url != null) { //ignore helper layer.
                      o1 = { 'label': layer.name + ' (' + maxRecordCount + ')',
                          'value': layer.name
                      };

                      //need a copy so selects are independant of each other.
                      o2 = { 'label': layer.name + ' (' + maxRecordCount + ')',
                          'value': layer.name
                      };

                      if (layer.geometryType === 'esriGeometryPolygon') {
                          settings.selectWithLayerSelect.addOption(o1);
                      }

                      settings.selectFromLayerSelect.addOption(o2);
                  }
              });
          },

          setConfig: function (config) {
              this.config = config;

              if (config.layers.selectWith) {
                  this.selectWithLayerSelect.set('value', config.layers.selectWith.name);
              }

              if (config.layers.selectFrom) {
                  this.selectFromLayerSelect.set('value', config.layers.selectFrom.name);
              }

              if (config.spatialRel) {
                  this.spatialRelChooser.set('value', config.spatialRel);
              }

              if (config.highlightSymbol) {
                  var hs = jsonUtils.fromJson(config.highlightSymbol);
                  if (hs instanceof SimpleMarkerSymbol || hs instanceof PictureMarkerSymbol) {
                      this.mode = this.pointHighlightChooser;
                  }

                  else if (hs instanceof SimpleLineSymbol) {
                      this.mode = this.lineHighlightChooser;
                  }

                  else if (hs instanceof SimpleFillSymbol) {
                      this.mode = this.fillHighlightChooser;
                  }

                  this.mode.showBySymbol(hs);
              }

              if (this.config.drawSymbol) {
                  this.fillDrawChooser.showBySymbol(jsonUtils.fromJson(this.config.drawSymbol));
              }
          },

          getConfig: function () {
              this.config.layers.selectFrom.name = this.selectFromLayerSelect.getValue();

              this.config.layers.selectWith.name = this.selectWithLayerSelect.getValue();

              this.config.spatialRel = this.spatialRelChooser.getValue();

              this.config.highlightSymbol = this.mode.getSymbol().toJson();

              this.config.drawSymbol = this.fillDrawChooser.getSymbol().toJson();

              return this.config;
          }

      });
  });
