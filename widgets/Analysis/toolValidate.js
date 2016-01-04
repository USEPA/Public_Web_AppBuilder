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
  'dojo/_base/lang',
  'dojo/_base/array'
], function(lang, array) {
  var mo = {};

  mo.isValid = function(res, toolConfig, privilegeUtil){
    var isValid = false, layerObjects = res.layerObjects;
    if(toolConfig.dijitID.indexOf('MergeLayers') !== -1){
      isValid = this.mergeAvailable(layerObjects);
    }else if(toolConfig.dijitID.indexOf('ExtractData') !== -1){
      isValid = this.extractAvailable(res, privilegeUtil);
    }else{
      var requiredParam = null;
      if('requiredParam' in toolConfig){
        requiredParam = toolConfig.requiredParam;
      }
      isValid = this.paramAvailable(layerObjects, toolConfig.analysisLayer, requiredParam);
    }
    return isValid;
  };

  mo.mergeAvailable = function(layerObjects){
    //check if there are two layers with the same geometry type
    return array.some(layerObjects, function(layerA){
      return array.some(layerObjects, function(layerB){
        return (layerB !== layerA && layerB.geometryType === layerA.geometryType);
      });
    });
  };

  mo.extractAvailable = function(res, privilegeUtil){
    //check if there is a layer having Extract capability
    //capabilities is a string, like "Create, Delete, Query, Extract"
    var user = privilegeUtil.getUser(),
        layerInfos = res.layerInfos,
        mapNotesLayerInfoArray = res.layerInfosObject.getMapNotesLayerInfoArray(),
        ret = false;

    array.forEach(layerInfos, function(layerInfo){
      var isMapNotes = this._isMapNotes(mapNotesLayerInfoArray, layerInfo);
      var isGeoRSS = (layerInfo.layerObject.declaredClass === 'esri.layers.GeoRSSLayer');
      var isCSV = (layerInfo.layerObject.declaredClass === 'esri.layers.CSVLayer');
      var isFeatCol = layerInfo.layerObject.type === 'FeatureCollection';
      var isGroupFeatColl = isFeatCol && !isMapNotes;
      var subLayerInfos;

      if(isFeatCol || isGeoRSS || isCSV || isMapNotes){
        if(isGeoRSS || isCSV){
          ret = this._addExtractCapability(layerInfo);
        }else if(isMapNotes || isGroupFeatColl){
          subLayerInfos = layerInfo.getSubLayers();
          if (subLayerInfos && subLayerInfos.length > 0){
            array.forEach(subLayerInfos, function(subLayerInfo){
              ret = this._addExtractCapability(subLayerInfo);
            }, this);
          }
        }else{// else just one layer, e.g. CSV
          ret = this._addExtractCapability(layerInfo);
        }
      }else if(privilegeUtil.isAdmin() && layerInfo.layerObject.url &&
          layerInfo.layerObject.url.indexOf('/' + user.accountId + '/') > -1){
        // is real admin, custom roles are not allowed here (so far)
        ret = this._addExtractCapability(layerInfo);
      }
    }, this);

    return ret;
  };

  mo._isMapNotes = function(mapNotesLayerInfoArray, layerInfo){
    return array.some(mapNotesLayerInfoArray, function(item){
      return item.id === layerInfo.id;
    });
  };

  mo._addExtractCapability = function(layerInfo){
    if(layerInfo.layerObject.capabilities) {
      if(layerInfo.layerObject.capabilities.indexOf("Extract") === -1) {
        layerInfo.layerObject.capabilities = layerInfo.layerObject.capabilities + ",Extract";
      }
    }else {
      layerInfo.layerObject.capabilities = "Extract";
    }
    return true;
  };

  mo.paramAvailable = function(layerObjects, analysisLayer, requiredParam){
    var firstMatchedLayerId;
    var geomTypes;
    //check analysis layer parameter
    geomTypes = analysisLayer.geomTypes;
    firstMatchedLayerId = findMatchedFeatureLayer(layerObjects, geomTypes);
    if(firstMatchedLayerId === null){
      return false;
    }

    if(requiredParam !== null){
      //check required layer parameters
      geomTypes = requiredParam.geomTypes;
      var foundId = findMatchedFeatureLayer(layerObjects, geomTypes, firstMatchedLayerId);
      return (foundId !== null);
    }else{
      return true;
    }
  };

  function findMatchedFeatureLayer(layerObjects, geomTypes, excludeLayerId){
    var matchedLayerId = null;
    array.some(layerObjects, lang.hitch(this, function(layer){
      if(layer && excludeLayerId !== layer.id){
        if(geomTypes.length === 1){
          if(geomTypes[0] === '*' || geomTypes[0] === layer.geometryType){
            matchedLayerId = layer.id;
            return true;
          }
        }else if(geomTypes.indexOf(layer.geometryType) > -1){
          matchedLayerId = layer.id;
          return true;
        }
      }
    }));
    return matchedLayerId;
  }
  //----------------------end--------------------------//
  return mo;
});
