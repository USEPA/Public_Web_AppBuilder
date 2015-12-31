/*
Copyright ©2014 Esri. All rights reserved.

TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
Unpublished material - all rights reserved under the
Copyright Laws of the United States and applicable international
laws, treaties, and conventions.

For additional information, contact:
Attn: Contracts and Legal Department
Environmental Systems Research Institute, Inc.
380 New York Street
Redlands, California, 92373
USA

email: contracts@esri.com
*/

define([
  'dojo/_base/lang'
], function(lang) {

  var mo = {};

  mo.getFieldInfosFromWebmap = function(layerId, jimuLayerInfos) {
    // summary:
    //   get fieldInfos from web map.
    // description:
    //   return null if fieldInfos has not been configured.
    var fieldInfos = null;
    var jimuLayerInfo = jimuLayerInfos.getLayerInfoByTopLayerId(layerId);
    if(jimuLayerInfo) {
      var popupInfo = jimuLayerInfo.getPopupInfo();
      if(popupInfo && popupInfo.fieldInfos) {
        fieldInfos = lang.clone(popupInfo.fieldInfos);
      }
    }
    return fieldInfos;
  };

  return mo;
});