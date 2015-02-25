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
/*global define, dojo, dijit, require, esri, console, setTimeout*/
define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "jimu/BaseWidgetSetting",
    "jimu/dijit/Message",
    "dojo/text!./SpatialRelationshipsEdit.html"
  ],
  function(
    declare,
    lang,
    array,
    on,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Message,
    template) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: "spatial-relationship-edit",
      templateString: template,
      _spatialrelationship: [{
        "name": "esriSpatialRelContains",
        "label": "entirely contained in"
      },{
        "name": "esriSpatialRelIntersects",
        "label": "intersected by"
      },{
        "name": "esriSpatialRelEnvelopeIntersects",
        "label": "intersected by envelope of"
      },{
        "name": "esriSpatialRelCrosses",
        "label": "crosses over"
      },{
        "name": "esriSpatialRelIndexIntersects",
        "label": "index intersected by"
      },{
        "name": "esriSpatialRelOverlaps",
        "label": "overlaped by"
      },{
        "name": "esriSpatialRelTouches",
        "label": "touched by"
      },{
        "name": "esriSpatialRelWithin",
        "label": "within"
      }],
      config:null,

      postCreate: function() {
        this.inherited(arguments);
        this._setConfig(this.config);
      },

      startup: function() {
        this.inherited(arguments);
      },

      _setConfig: function(config) {
        this.config = config;
        if(!this.config){
          return;
        }
        this._initSpatRelTable();
      },
      
      _initSpatRelTable:function(){
        this.SpatialRelationshipTable.clear();
        var spatRels = this.config;
        console.info(this.config);
        array.forEach(this._spatialrelationship, lang.hitch(this, function(spatialRel) {
          var args = {
            config:spatialRel,
            exists: this._inArray(spatRels, spatialRel.name)
          };
          this._createSpatialRelationship(args);
        }));
      },
      
      _inArray:function(array, name){
        for(var i=0;i<array.length;i++) {
          if(array[i].name === name){
            return true;
          }
        }
        return false;
      },
      
      _createSpatialRelationship:function(args){
        args.searchSetting = this;
        args.nls = this.nls;
        var rowData = {
          add: args.exists,
          label: (args.config && args.config.label)||'',
          name: (args.config && args.config.name)||''
        };
        var result = this.SpatialRelationshipTable.addRow(rowData);
        if(!result.success){
          return null;
        }
        return result.tr;
      },

      getConfig: function() {      
        var trs = this.SpatialRelationshipTable.getRowDataArrayByFieldValue("add",true);
        var allSpatRels = array.map(trs,lang.hitch(this,function(item){
          delete item.add;
          return item;
        }));
        return allSpatRels;
      }
    });
  });