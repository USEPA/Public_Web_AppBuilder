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
  'dojo/_base/array',
  'dojo/promise/all',
  'jimu/LayerInfos/LayerInfos'
], function(array, all, LayerInfos) {
  var mo = {};

  mo.getLayerObjects = function(theMap){
    return LayerInfos.getInstance(theMap, theMap.itemInfo).then(function(
          layerInfosObject){
      var layerInfos = [];
      layerInfosObject.traversal(function(layerInfo){
        layerInfos.push(layerInfo);
      });

      var defs = array.map(layerInfos, function(layerInfo){
        return layerInfo.getLayerObject();
      });
      return all(defs).then(function(layerObjects){
        var resultArray = [];
        array.forEach(layerObjects, function(layerObject, i){
          layerObject.id = layerObject.id || layerInfos[i].id;
          if(layerObject && layerObject.declaredClass === "esri.layers.FeatureLayer"){
            resultArray.push(layerObject);
          }
        });
        return {
          layerInfosObject: layerInfosObject,
          layerInfos: layerInfos,
          layerObjects: resultArray
        };
      });
    });
  };
  //----------------------end--------------------------//
  return mo;
});
