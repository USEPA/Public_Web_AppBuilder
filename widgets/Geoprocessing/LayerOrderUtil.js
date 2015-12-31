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
  'dojo/_base/array',
  'dojo/Deferred',
  'jimu/LayerInfos/LayerInfos'
], function(declare, array, Deferred, LayerInfos){
  return declare(null, {
    config: null,

    constructor: function(config, map){
      this.config = config;
      this.map = map;
      if(!('layerOrder' in this.config) || this.config.layerOrder.length === 0){
        //get all param whose type is GPFeatureRecordSetLayer
        this.config.layerOrder =
            this.getCandidateParamNames(false);
      }
    },

    /**
     * Fetch all candidate layers that can be ordered.
     * @param  {boolean} orderable Is the layer orderable?
     * @return {array} An array contains param names.
     */
    getCandidateParamNames: function(orderable){
      var candidateLayers = [];

      if(!this.config){
        return candidateLayers;
      }

      //out put is on the above most
      array.forEach(this.config.outputParams, function(param){
        if(param.dataType === 'GPFeatureRecordSetLayer' &&
            (!orderable || this.config.useResultMapServer !== true)){
          candidateLayers.push(param.name);
        }
      }, this);

      //input is under the output
      array.forEach(this.config.inputParams, function(param){
        if(param.dataType === 'GPFeatureRecordSetLayer' &&
            (!orderable || param.featureSetMode === 'draw')){
          candidateLayers.push(param.name);
        }
      }, this);

      return candidateLayers;
    },

    /**
     * Get param name from layerOrder whose direction is input and is orderable.
     * @return {array} An array of input param name.
     */
    getOrderableInput: function(){
      var candidateLayers = [];

      if(!this.config){
        return candidateLayers;
      }

      //input is under the output
      array.forEach(this.config.inputParams, function(param){
        if(param.dataType === 'GPFeatureRecordSetLayer' &&
            param.featureSetMode === 'draw'){
          candidateLayers.push(param.name);
        }
      }, this);

      return array.filter(this.config.layerOrder, function(paramName){
        return array.indexOf(candidateLayers, paramName) !== -1;
      }, this);
    },

    /**
     * Get param name from layerOrder whose direction is output and is orderable.
     * @return {array} An array of output param name.
     */
    getOrderableOutput: function(){
      var candidateLayers = [];

      if(!this.config){
        return candidateLayers;
      }

      //input is under the output
      array.forEach(this.config.outputParams, function(param){
        if(param.dataType === 'GPFeatureRecordSetLayer' &&
            this.config.useResultMapServer !== true){
          candidateLayers.push(param.name);
        }
      }, this);

      return array.filter(this.config.layerOrder, function(paramName){
        return array.indexOf(candidateLayers, paramName) !== -1;
      }, this);
    },

    /**
     * Calculate layer index of the paramName, the index will be used in
     * map.addLayer().
     * @param  {string} paramName input or output param name
     * @return {number}           layer index to insert the layer
     */
    calculateLayerIndex: function(paramName, widgetUID){
      if(!this.map){
        throw new Error('The map cannot be null in LayerOrderUtil.calculateLayerIndex');
      }
      var i, idx, length, targetIndex,
          def = new Deferred(),
          params = this.config.layerOrder;
      idx = array.indexOf(params, paramName);
      if(idx === -1){
        throw new Error(paramName + 'cannot be found in the orderable params');
      }else{
        //look ahead, if any layer has added to the map,
        //return the index of the layer
        for(i = idx - 1; i >= 0; i--){
          targetIndex = array.indexOf(this.map.graphicsLayerIds,
              widgetUID + params[i]);
          if(targetIndex !== -1){
            def.resolve(targetIndex);
            return def;
          }
        }

        //look behind, if any layer has added to the map,
        //return the index of the layer plus one
        for(i = idx + 1, length = params.length; i < length; i++){
          targetIndex = array.indexOf(this.map.graphicsLayerIds,
              widgetUID + params[i]);
          if(targetIndex !== -1){
            def.resolve(targetIndex + 1);
            return def;
          }
        }

        //no layer in the config.layerOrder has been added to map
        //put the layer behind the map notes
        if(!def.isResolved()){
          LayerInfos.getInstance(this.map, this.map.itemInfo).then(
              function(layerInfosObject){
            var mapNotesLayerArray, lastLayerInfo, subLayers, targetLayerId;
            mapNotesLayerArray = layerInfosObject.getMapNotesLayerInfoArray();
            if(mapNotesLayerArray.length === 0){
              def.resolve(-1);
            }else{
              lastLayerInfo = mapNotesLayerArray[mapNotesLayerArray.length - 1];
              subLayers = lastLayerInfo.getSubLayers();
              if(subLayers.length === 0){
                targetLayerId = lastLayerInfo.layerObject.id;
              }else{
                targetLayerId = subLayers[subLayers.length - 1].layerObject.id;
              }
              targetIndex = array.indexOf(this.map.graphicsLayerIds,
                targetLayerId);
              def.resolve(targetIndex);
            }
          });
        }

        return def;
      }
    }
  });
});