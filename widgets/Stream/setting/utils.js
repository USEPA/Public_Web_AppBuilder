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
  'dojo/_base/array'
],
function(array) {
  /**
   * Stream layer utils.
   * @exports widgets/Stream/setting/utils
   */
  var mo = {};

  /**
   * Get all stream layers from map.
   * @param  {Object} map - The Map object.
   * @return {Array}     The array of stream layers.
   */
  mo.getStreamLayers = function(map){
    var result = [], lyr;
    array.forEach(map.graphicsLayerIds, function(id){
      lyr = map.getLayer(id);
      if(lyr.declaredClass === 'esri.layers.StreamLayer'){
        result.push(lyr);
      }
    });
    result.reverse();
    return result;
  };

  /**
   * Get Stream layer name from the url.
   * The url pattern is http://[hostname]/.../[layerName]/StreamServer
   * @param  {[type]} url [description]
   * @return {[type]}     [description]
   */
  mo.getStreamLayerName = function(url){
    var reg = /\/([^\/]+)\/StreamServer/;
    var result = reg.exec(url);
    if(result.length > 1){
      return result[1];
    }else{
      return '';
    }
  };

  return mo;
});
