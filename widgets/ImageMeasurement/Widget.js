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
  'jimu/BaseWidget',
  'esri/dijit/ImageServiceMeasure'
],
        function (
                declare,
                BaseWidget,
                JSImageServiceMeasure) {

          var clazz = declare([BaseWidget], {
            baseClass: "jimu-widget-ImageMeasurement",
            name: "ImageMeasurement",
            imageServiceMeasureWidget: null,

            startup: function () {
              this.inherited(arguments);
              var config = this.config.ImageMeasurement,
                      layerId = this._getLayerId(this.config.ImageMeasurement.layerTitle);

              this.imageServiceMeasureWidget = new JSImageServiceMeasure({
                map: this.map,
                layer: this.map.getLayer(layerId),
                displayMeasureResultInPopup: config.displayMeasureResultInPopup,
                layout: "toolbar",
                linearUnit: config.linearUnit,
                angularUnit: config.angularUnit,
                areaUnit: config.areaUnit,
                displayOperations: config.displayOperations
              }, this.measureWidgetDiv);

              this.imageServiceMeasureWidget.startup();
            },

            onClose: function () {
              this.imageServiceMeasureWidget.deactivate();
            },

            _getLayerId: function (layerTitle) {
              var operLayers = this.map.itemInfo.itemData.operationalLayers,
                      layer,
                      layerId;

              for (layer in operLayers) {
                if (operLayers.hasOwnProperty(layer)) {
                  if (operLayers[layer].title === layerTitle) {
                    layerId = operLayers[layer].id;
                  }
                }
              }

              return layerId;
            }
          });

          return clazz;
        });