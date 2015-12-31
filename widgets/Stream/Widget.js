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
/**
 * Stream widget panel.
 * @module widgets/Stream/Widget
 */
define(['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/on',
  'dojo/dom-style',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/ViewStack',
  './StreamControl',
  'dijit/form/Select',
  'jimu/dijit/LoadingShelter'
],
function(declare, lang, array, on, domStyle, _WidgetsInTemplateMixin,
  BaseWidget, ViewStack, StreamControl) {
  return /**@alias module:widgets/Stream/Widget */ declare([BaseWidget,
    _WidgetsInTemplateMixin
  ], {
    baseClass: 'jimu-widget-stream',
    streamControls: [],

    postCreate: function() {
      this.inherited(arguments);
      var control, lyr, options = [], controls = [];
      if(this.config.streamLayers && this.config.streamLayers.length > 0){
        array.forEach(this.config.streamLayers, function(layerConfig, index){
          //check layer existence and visibility
          lyr = this.map.getLayer(layerConfig.layerId);
          if(lyr){
            control = new StreamControl({
              nls: this.nls,
              id: this.id + '_' + layerConfig.layerId,
              map: this.map,
              config: layerConfig,
              streamLayer: this.map.getLayer(layerConfig.layerId)
            });
            controls.push(control);
            options.push({
              label: layerConfig.layerName,
              value: index
            });
          }
        }, this);
      }

      if(controls.length === 0){
        domStyle.set(this.errorTipPanel, 'display', '');
        domStyle.set(this.selectionPanel, 'display', 'none');
      }else{
        this.viewStack = new ViewStack({
          nodeType: 1,
          views: controls
        });
        this.viewStack.placeAt(this.settingPanel);

        this.streamSelect.addOption(options);
        this.streamSelect.set('value', 0);
        this.own(on(this.streamSelect, 'change', lang.hitch(this, function(val){
          this.viewStack.switchView(val);
        })));
      }
    }
  });
});
