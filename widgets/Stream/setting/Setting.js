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
 * Stream widget setting page.
 * @module widgets/Stream/setting/Setting
 */
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/dom-style',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./Setting.html',
  'jimu/BaseWidgetSetting',
  './utils',
  './StreamSetting',
  'jimu/dijit/SimpleTable',
  'jimu/dijit/LoadingShelter'
  ],
  function(declare, lang, array, domStyle, _TemplatedMixin, _WidgetsInTemplateMixin,
      template, BaseWidgetSetting, utils, StreamSetting) {
    return /** @alias module:widgets/Stream/setting/Setting */ declare([BaseWidgetSetting,
        _TemplatedMixin, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-stream-setting',
      templateString: template,

      postCreate: function() {
        this.inherited(arguments);

        this.layerList = utils.getStreamLayers(this.map);
        array.forEach(this.layerList, lang.hitch(this, function(lyr, index){
          var addResult, tr, layerConfig = null;

          addResult = this.streamList.addRow({
            name: utils.getStreamLayerName(lyr.url)
          });

          if(addResult.success){
            tr = addResult.tr;
            if(this.config && this.config.streamLayers &&
                this.config.streamLayers.length > 0){
              array.some(this.config.streamLayers, lang.hitch(this, function(item){
                if(item.layerId === lyr.id){
                  layerConfig = item;
                  return true;
                }
              }));
            }
            this._createSingleStreamSetting(tr, lyr, layerConfig);
          }
          if(index === 0){
            this.streamList.selectRow(tr);
          }
        }));
      },

      getConfig: function() {
        var currentConfig, config = { streamLayers: [] };

        array.forEach(this.streamList.getRows(), function(tr){
          currentConfig = tr.streamLayerSetting;
          config.streamLayers.push(currentConfig.getConfig());
        });

        return config;
      },

      _onStreamLayerSelected: function(tr){
        var currentStreamLayerSetting;
        if(this.currentTR){
          if(this.currentTR !== tr){
            currentStreamLayerSetting = this.currentTR.streamLayerSetting;
            if(currentStreamLayerSetting){
              domStyle.set(currentStreamLayerSetting.domNode, 'display', 'none');
            }

            this.currentTR = tr;
            currentStreamLayerSetting = this.currentTR.streamLayerSetting;
            if(currentStreamLayerSetting){
              domStyle.set(currentStreamLayerSetting.domNode, 'display', 'block');
            }
          }
        }else{
          this.currentTR = tr;
          currentStreamLayerSetting = this.currentTR.streamLayerSetting;
          if(currentStreamLayerSetting){
            domStyle.set(currentStreamLayerSetting.domNode, 'display', 'block');
          }
        }
      },

      _createSingleStreamSetting: function(tr, layer, config){
        var rowData = this.streamList.getRowData(tr);
        var args = {
          map: this.map,
          nls: this.nls,
          config: config,
          layerName: rowData ? rowData.name : '',
          streamLayer: layer
        };
        var streamLayerSetting = new StreamSetting(args);
        streamLayerSetting.placeAt(this.singleStreamContainer);
        tr.streamLayerSetting = streamLayerSetting;

        domStyle.set(streamLayerSetting.domNode, 'display', 'none');
      }
    });
  });
