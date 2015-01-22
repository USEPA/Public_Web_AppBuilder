
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
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array', 
  'dojox/data/CsvStore', 
  'dojox/encoding/base64',
  'esri/layers/FeatureLayer', 
  'esri/geometry/webMercatorUtils',
  'esri/geometry/Multipoint',
  'esri/InfoTemplate',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/PictureMarkerSymbol',
  'esri/graphic', 
  'esri/Color', 
  'esri/geometry/Point',
  'esri/tasks/QueryTask', 
  'esri/tasks/query',
  'dojo/Deferred',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin'
],
function(declare, lang, html, arrayUtils, 
  CsvStore, base64, FeatureLayer, webMercatorUtils, 
  Multipoint, InfoTemplate, SimpleMarkerSymbol, PictureMarkerSymbol, 
  Graphic, Color, Point, QueryTask, Query,
  Deferred, _WidgetBase) {

  var _qT;
  var _q;
  var _queryFields;
  var _map;
  var _self;
  var _latFieldStrings = ['lat', 'latitude', 'y', 'ycenter','POINT_Y'];
  var _longFieldStrings = ['lon', 'long', 'longitude', 'x', 'xcenter','POINT_X'];
  var _fFields;
  var _layerLoaded;
  var _featureLayer;
  var _config;

  var clazz = declare([_WidgetBase], {

    baseClass: 'jimu-widget-GeoEnrich',
    dependParam: '',

    postCreate: function(){
      this.inherited(arguments);
      _self = this;

    },

    setParams: function(c, m){
      _config = c;
      _map = m;
      _qT = new QueryTask(_config.mainURL);
      _q = new Query();
      _q.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
      _q.outFields = _self._setFields(_config.queryFields);
      _q.returnGeometry = false;
      _q.outSpatialRference = _map.spatialReference;
      _q.where = '1=1';

    },

    _setFields: function(f){
      _queryFields = ((Object.prototype.toString.call(f) === '[object Array]'))? f
        : f.split(',');
      return  _queryFields;
    },

    handleCSV: function(file) {
        console.log('Reading CSV: ', file, ', ', file.name, ', ', file.type, ', ', file.size);
        var reader = new FileReader();
        reader.onload = function() {
          _self._processCSVData(reader.result);
        };
        reader.readAsText(file);
    },

    _processCSVData: function (data) {
          var newLineIndex = data.indexOf('\n');
          var firstLine = lang.trim(data.substr(0, newLineIndex));
          var separator = _self._getSeparator(firstLine);
          var csvStore = new CsvStore({
              data: data,
              separator: separator
          });

          csvStore.fetch({
              onComplete: function(items) {
                  var objectId = 0;
                  var featureCollection = _self._generateFeatureCollectionTemplateCSV(csvStore, items);
                  var popupInfo = _self._generateDefaultPopupInfo(featureCollection);
                  var infoTemplate = new InfoTemplate(_self._buildInfoTemplate(popupInfo));
                  var latField, longField;
                  var fieldNames = csvStore.getAttributes(items[0]);
                  fieldNames = fieldNames.concat(_queryFields);

                  arrayUtils.forEach(fieldNames, function(fieldName) {
                      var matchId;
                      matchId = arrayUtils.indexOf(_latFieldStrings,
                          fieldName.toLowerCase());
                      if (matchId !== -1) {
                          latField = fieldName;
                      }

                      matchId = arrayUtils.indexOf(_longFieldStrings,
                          fieldName.toLowerCase());
                      if (matchId !== -1) {
                          longField = fieldName;
                      }
                  });

                  arrayUtils.forEach(items, function(item) {
                      var attrs = fieldNames,
                          attributes = {};
                      // Read all the attributes for  this record/item
                      arrayUtils.forEach(attrs, function(attr) {
                          var value = Number(csvStore.getValue(item, attr));
                          attributes[attr] = isNaN(value) ? csvStore.getValue(item, attr) : value;
                      });

                      //attributes['__OBJECTID'] = objectId;
                      attributes.__OBJECTID = objectId;
                      objectId++;

                      var latitude = parseFloat(attributes[latField]);
                      var longitude = parseFloat(attributes[longField]);

                      if (isNaN(latitude) || isNaN(longitude)) {
                          return;
                      }

                      var geometry = webMercatorUtils
                          .geographicToWebMercator(new Point(longitude, latitude, _map.spatialReference)); 
                      var feature = {
                          'geometry': geometry.toJson(),
                          'attributes': attributes
                      };
                      featureCollection.featureSet.features.push(feature);
                  });

                  if (_layerLoaded) {
                      _map.removeLayer(_featureLayer);
                  }

                  _featureLayer = new FeatureLayer(featureCollection, {
                      infoTemplate: infoTemplate,
                      id: 'csvLayer'
                  });
                  _featureLayer.__popupInfo = popupInfo;
                  document.getElementById('loading').style.visibility = 'visible';
                  _self._queryCoverage(_featureLayer);

              },
              onError: function(error) {
                  console.error('Error fetching items from CSV store: ', error);
              }
          });
      },

  _getSeparator: function(string) {
          var separators = [',', '      ', ';', '|'];
          var maxSeparatorLength = 0;
          var maxSeparatorValue = '';
          arrayUtils.forEach(separators, function(separator) {
              var length = string.split(separator).length;
              if (length > maxSeparatorLength) {
                  maxSeparatorLength = length;
                  maxSeparatorValue = separator;
              }
          });
          return maxSeparatorValue;
      },

  _generateFeatureCollectionTemplateCSV: function(store, items) {
      var featureCollection = {
          'layerDefinition': null,
          'featureSet': {
              'features': [],
              'geometryType': 'esriGeometryPoint'
          }
      };

      featureCollection.layerDefinition = {
          'geometryType': 'esriGeometryPoint',
          'objectIdField': '__OBJECTID',
          'type': 'Feature Layer',
          'typeIdField': '',
          'fields': [{
              'name': '__OBJECTID',
              'alias': '__OBJECTID',
              'type': 'esriFieldTypeOID',
              'editable': false,
              'domain': null
          }],
          'types': [],
          'capabilities': 'Query'
      };

      var fields = store.getAttributes(items[0]);
      fields = fields.concat(_queryFields);
      arrayUtils.forEach(fields, function(field) {
          var value = store.getValue(items[0], field);
          var parsedValue = Number(value);
          if (isNaN(parsedValue)) { 
              featureCollection.layerDefinition.fields.push({
                  'name': field,
                  'alias': field,
                  'type': 'esriFieldTypeString',
                  'editable': true,
                  'domain': null
              });
          } else {
              featureCollection.layerDefinition.fields.push({
                  'name': field,
                  'alias': field,
                  'type': 'esriFieldTypeDouble',
                  'editable': true,
                  'domain': null
              });
          }
      });
      _fFields = fields;
      return featureCollection;
  },

  _generateDefaultPopupInfo: function(featureCollection) {
      var fields = featureCollection.layerDefinition.fields;
      var decimal = {
          'esriFieldTypeDouble': 1,
          'esriFieldTypeSingle': 1
      };
      var integer = {
          'esriFieldTypeInteger': 1,
          'esriFieldTypeSmallInteger': 1
      };
      var dt = {
          'esriFieldTypeDate': 1
      };
      var displayField = null;
      var fieldInfos = arrayUtils.map(fields,
          lang.hitch(_self, function(item) {
              if (item.name.toUpperCase() === 'NAME') {
                  displayField = item.name;
              }
              var visible = (item.type !== 'esriFieldTypeOID' &&
                  item.type !== 'esriFieldTypeGlobalID' &&
                  item.type !== 'esriFieldTypeGeometry');
              var format = null;
              if (visible) {
                  var f = item.name.toLowerCase();
                  var hideFieldsStr = 
                    ',stretched value,fnode_,tnode_,lpoly_,rpoly_,poly_,subclass,subclass_,rings_ok,rings_nok,';
                  if (hideFieldsStr.indexOf(',' + f + ',') > -1 ||
                      f.indexOf('objectid') > -1 || 
                      f.indexOf('_i') === f.length - 2) {
                      visible = false;
                  }
                  if (item.type in integer) {
                      format = {
                          places: 0,
                          digitSeparator: true
                      };
                  } else if (item.type in decimal) {
                      format = {
                          places: 2,
                          digitSeparator: true
                      };
                  } else if (item.type in dt) {
                      format = {
                          dateFormat: 'shortDateShortTime'
                      };
                  }
              }
              return lang.mixin({}, {
                  fieldName: item.name,
                  label: item.alias,
                  isEditable: false,
                  tooltip: '',
                  visible: visible,
                  format: format,
                  stringFieldOption: 'textbox'
              });
          }));

      var popupInfo = {
          title: displayField ? '{' + displayField + '}' : '',
          fieldInfos: fieldInfos,
          description: null,
          showAttachments: false,
          mediaInfos: []
      };
      return popupInfo;
  },

  _buildInfoTemplate: function(popupInfo) {
      var json = {
          content: '<table>'
      };

      arrayUtils.forEach(popupInfo.fieldInfos, function buildTemplate(field) {
          if (field.visible) {
              json.content += '<tr><td valign="top">' + field.label +
                  ': <\/td><td valign="top">${' + field.fieldName + '}<\/td><\/tr>';
          }
      });
      json.content += '<\/table>';
      return json;
  },

  _zoomToData: function(featureLayer) {
    var multipoint = new Multipoint(_map.spatialReference);
    arrayUtils.forEach(featureLayer.graphics, function(graphic) {
        var geometry = graphic.geometry;
        if (geometry) {
            multipoint.addPoint({
                x: geometry.x,
                y: geometry.y
            });
        }
    });
    _map.addLayer(featureLayer);
    _layerLoaded = true;

},

_queryCoverage: function(featureLayer1) {
    var c = 0;
    var dataList = [];
    var sym1 = new SimpleMarkerSymbol(_config.SymbolIn);
    var sym2 = new SimpleMarkerSymbol(_config.SymbolOut);

    for (var i = 0; i < featureLayer1.graphics.length; i++) {
        _q.geometry = featureLayer1.graphics[i].geometry;
        _qT.execute(_q, function getResults(results) {
            if (results.features.length > 0) {
                var a = featureLayer1.graphics[c].attributes;
                for (var i = 0; i < _queryFields.length; i++) {
                   a[_queryFields[i]] = _self._validateItem(results.features[0].attributes[_queryFields[i]]);
                }
                //featureLayer1.graphics[c].symbol = _self._createMarkerSymbol(10,'#006600');
                featureLayer1.graphics[c].symbol = sym1;
                featureLayer1.graphics[c].attributes = a;
                dataList.push(_self._removeOID(featureLayer1.graphics[c].attributes));  
            } else {
                //featureLayer1.graphics[c].symbol = _self._createMarkerSymbol(5,'#CC3300');
                featureLayer1.graphics[c].symbol = sym2;
                dataList.push(_self._removeOID(featureLayer1.graphics[c].attributes));
            }
            c++;
            if (c >= featureLayer1.graphics.length) {
                _self._zoomToData(featureLayer1);
                if (_config.outCSV===true) {
                _self._pushCSV(dataList);
                }else{
                  document.getElementById('loading').style.visibility = 'hidden';
                }
            }
        });
    }
},

_validateItem: function(i){
//TO DO - Harden this logic

   if (!i.isNaN) { 
        return parseFloat(i); 
   }
   return i;
},

_removeOID: function(a){
  var tmp = a;
  if (tmp.__OBJECTID){
    delete tmp.__OBJECTID;
  }
  return tmp;
},

_createMarkerSymbol: function(size, color){
  var markerSymbol = new SimpleMarkerSymbol();
  markerSymbol.setSize(size);
  markerSymbol.setColor(new Color(color));
  markerSymbol.style = SimpleMarkerSymbol.STYLE_CIRCLE;
  return markerSymbol;
},


_pushCSV: function(d) {

    document.getElementById('loading').style.visibility = 'hidden';
    var f1;
    for (var i = 0; i < _fFields.length; i++) {
        if (i === 0) {
            f1 = _fFields[i];
        } else {
            f1 = f1 + ',' + _fFields[i];
        }
    }
    var sC = _self._ConvertToCSV(d);
    var encodedUri = encodeURI(f1 + '\r\n' + sC);
    var a = document.createElement('a');
    a.href = 'data:attachment/csv,' + encodedUri;
    a.target = '_blank';
    a.download = 'GeoEnrich.csv';
    document.body.appendChild(a);
    a.click();
},

_ConvertToCSV: function(objArray) {

    var array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    var str = '';
    for (var i = 0; i < array.length - 1; i++) {
        var line = '';
        for (var index in array[i]) {
         if(array[i].hasOwnProperty(index)){           
           line = (line !== '') ? line += ','
           : line;
           line += array[i][index];  
          }
      }
        str += line + '\r\n';
    }

    return str;
},
 
update: function(/*jshint unused: false*/ dependParamValue){
}

});
  return clazz;
});



