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

define(['dojo/_base/declare',
  'dojo/_base/array',
  'dijit/_WidgetBase',
  'jimu/dijit/SimpleTable',
  '../LayerOrderUtil'
],
function(declare, array, _WidgetBase, SimpleTable, LayerOrderUtil) {
  return declare([_WidgetBase], {
    baseClass: 'jimu-widget-setting-gp-layer-order',

    postCreate: function(){
      this.inherited(arguments);
      this.table = new SimpleTable({
        fields: [{
          name: 'layerName',
          title: this.nls.layer,
          type: 'text'
        }, {
          name: 'actions',
          title: this.nls.action,
          type: 'actions',
          actions: ['up', 'down']
        }]
      });
      this.table.placeAt(this.domNode);
    },

    startup: function(){
      this.inherited(arguments);
      this.table.startup();
    },

    setConfig: function(config){
      this.config = config;
      this.table.clear();
      this.layerOrderUtil = new LayerOrderUtil(this.config, null);

      if(this.config.layerOrder.length === 0){
        this.config.layerOrder = this.layerOrderUtil.getCandidateParamNames(false);
      }

      if(this.config.layerOrder.length > 0){
        this._initLayerTable();
      }
    },

    /**
     * Re-order the this.config.layerOrder
     * Say original layerOrder is ['A','B','C','D','E'], and the layer order
     * in the table is ['E','D','B']. The re-ordered layerOrder should be
     * ['A','E','C','D','B'].
     * @return no return
     */
    acceptValue: function(){
      var orderedLayer, i, j, length, paramName;

      if(this.config.layerOrder.length > 0){
        orderedLayer = array.map(this.table.getData(), function(data){
          return data.layerName;
        });

        if(orderedLayer.length > 0){
          j = 0;
          for(i = 0, length = this.config.layerOrder.length; i < length; i++){
            paramName = this.config.layerOrder[i];
            if(array.indexOf(orderedLayer, paramName) !== -1){
              this.config.layerOrder[i] = orderedLayer[j];
              j += 1;
            }
          }
        }
      }
    },

    _initLayerTable: function(){
      var layerOrder = [];
      //get orderable params
      var candidateLayers = this.layerOrderUtil.getCandidateParamNames(true);

      layerOrder = array.filter(this.config.layerOrder, function(paramName){
        return array.indexOf(candidateLayers, paramName) !== -1;
      }, this);

      array.forEach(layerOrder, function(paramName){
        this.table.addRow({
          layerName: paramName
        });
      }, this);
    }
  });
});
