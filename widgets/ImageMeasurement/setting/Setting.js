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
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  "dojo/_base/array",
  "esri/toolbars/ImageServiceMeasureTool",
  "dojo/dom-class",
  "dojo/html",
  "dojo/_base/lang",
  "dojo/on",
  "jimu/dijit/RadioBtn",
  'dijit/form/CheckBox',
  "dijit/form/Select",
  "dojox/form/CheckedMultiSelect"
],
        function (
                declare,
                _WidgetsInTemplateMixin,
                BaseWidgetSetting,
                array,
                ImageServiceMeasureTool,
                domClass,
                html,
                lang) {

          return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
            //these two properties is defined in the BaseWidget
            baseClass: 'jimu-widget-ImageMeasurement-setting',
            displayMeasureResultInPopup: '',
            _supportedUnits: null,
            _supportedOperationMap: {},
            _hasSupportedLayer: false,

            startup: function () {
              this.inherited(arguments);
              if (!this.config.ImageMeasurement) {
                this.config.ImageMeasurement = {};
              }
              this._supportedOperationMap = {};
              this._populateLayers();
              if (this._hasSupportedLayer) {
                this._populateOperations();
                this._populateUnitDropdowns();
              }
              this.setConfig(this.config);
            },

            _populateLayers: function () {
              var operLayers = this.map.itemInfo.itemData.operationalLayers,
                      match = 0,
                      layer,
                      measureTool;

              for (layer in operLayers) {
                if (operLayers.hasOwnProperty(layer)) {
                  if (operLayers[layer].layerObject && operLayers[layer].layerObject.mensurationCapabilities) {
                    match++;
                    this.mapLayerSelect.addOption({
                      value: operLayers[layer].title,
                      label: operLayers[layer].title
                    });

                    measureTool = null;
                    measureTool = new ImageServiceMeasureTool({
                      map: this.map,
                      layer: operLayers[layer].layerObject
                    });

                    this._supportedOperationMap[operLayers[layer].title] = [];
                    this._supportedOperationMap[operLayers[layer].title] = measureTool.getSupportedMeasureOperations();
                    if (!this._supportedUnits) {
                      this._supportedUnits = measureTool.getSupportedUnits();
                    }
                  }
                }
              }

              this.mapLayerSelect.on("change", lang.hitch(this, this._populateOperations));

              if (match === 0) {
                domClass.add(this.searchesSection, "settingsHidden");
                html.set(this.errorSection, this.nls.errorSectionMeasage);
                this._hasSupportedLayer = false;
              } else {
                domClass.remove(this.searchesSection, "settingsHidden");
                html.set(this.errorSection, "");
                this._hasSupportedLayer = true;
              }
            },

            _populateUnitDropdowns: function () {
              var linearUnits = this._supportedUnits.linearUnits,
                      angularUnits = this._supportedUnits.angularUnits,
                      areaUnits = this._supportedUnits.areaUnits;

              array.forEach(linearUnits, function (linearUnit) {
                this.linearUnitSelect.addOption({
                  value: linearUnit,
                  label: this.nls.unitLabel[linearUnit]
                });
              }, this);

              array.forEach(angularUnits, function (angularUnit) {
                this.angularUnitSelect.addOption({
                  value: angularUnit,
                  label: this.nls.unitLabel[angularUnit]
                });
              }, this);

              array.forEach(areaUnits, function (areaUnit) {
                this.areaUnitSelect.addOption({
                  value: areaUnit,
                  label: this.nls.unitLabel[areaUnit]
                });
              }, this);
            },

            _populateOperations: function () {
              this._clearOperations();
              this._addOptions();
            },

            _clearOperations: function () {
              var options = this.displayOperationSelect.getOptions();

              array.forEach(options, function (option) {
                this.displayOperationSelect.removeOption(option);
              }, this);
            },

            _addOptions: function () {
              var operations = this._supportedOperationMap[this.mapLayerSelect.get("value")],
                      configjson = this.config.ImageMeasurement;

              array.forEach(operations, function (operation) {
                this.displayOperationSelect.addOption({
                  value: operation,
                  label: this.nls.operationLabel[operation],
                  selected: "selected"
                });
              }, this);

              if (configjson.displayOperations && configjson.displayOperations.length > 0) {
                this.displayOperationSelect.set("value", configjson.displayOperations);
              }
            },

            setConfig: function (config) {
              this.config = config;
              this.popupCheckbox.set("checked", this.config.ImageMeasurement.displayMeasureResultInPopup);
              if (this.config.ImageMeasurement.layerTitle) {
                this.mapLayerSelect.set("value", this.config.ImageMeasurement.layerTitle);
              }
              if (this.config.ImageMeasurement.linearUnit) {
                this.linearUnitSelect.set("value", this.config.ImageMeasurement.linearUnit);
              }
              if (this.config.ImageMeasurement.areaUnit) {
                this.areaUnitSelect.set("value", this.config.ImageMeasurement.areaUnit);
              }
              if (this.config.ImageMeasurement.angularUnit) {
                this.angularUnitSelect.set("value", this.config.ImageMeasurement.angularUnit);
              }
              if (this.config.ImageMeasurement.displayOperations.length > 0) {
                this.displayOperationSelect.set("value", this.config.ImageMeasurement.displayOperations);
              }
            },

            getConfig: function () {
              this.config.ImageMeasurement.displayMeasureResultInPopup = this.popupCheckbox.checked;
              this.config.ImageMeasurement.layerTitle = this.mapLayerSelect.get("value");
              this.config.ImageMeasurement.linearUnit = this.linearUnitSelect.get("value");
              this.config.ImageMeasurement.areaUnit = this.areaUnitSelect.get("value");
              this.config.ImageMeasurement.angularUnit = this.angularUnitSelect.get("value");
              this.config.ImageMeasurement.displayOperations = this.displayOperationSelect.get("value");
              return this.config;
            }

          });
        });