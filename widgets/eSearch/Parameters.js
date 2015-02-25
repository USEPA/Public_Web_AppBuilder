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
/*global define, dojo, dijit, require, esri, console, document*/
define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./Parameters.html',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/on',
  'dojo/query',
  'dijit/registry',
  'jimu/filterUtils',
  './SingleParameter'
],
  function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, lang,
  html, array, on, query, registry, filterUtils, SingleParameter) {/*jshint unused: false*/
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-search-parameters',
      templateString: template,
      nls: null,
      valuesObj: null,
      layerInfo: null,
      layerUri: null,
      layerDef: null,
      _filterUtils:null,
      layerUniqueCache: null,

      postCreate:function(){
        this.inherited(arguments);
        this._filterUtils = new filterUtils();
        if(this.valuesObj){
          this.build(this.valuesObj);
        }
      },

      destroy: function(){
        this.clear();
        this._filterUtils = null;
        this.inherited(arguments);
      },
      
      getSingleParamValues: function(){
        var valArray = [];
        var spDoms = query('.jimu-widget-search-single-parameter',this.tbody);
        array.forEach(spDoms,lang.hitch(this,function(spDom){
          var sp = registry.byNode(spDom);
          var newValueObj = sp.getValueObj();
          if(newValueObj){
            valArray.push(newValueObj);
          }else{
            valArray.push(null);
          }
        }));
        return valArray;
      },
      
      setSingleParamValues: function(valuesObj, value){
        var values = value.split("|");
        var vi = 0;
        array.forEach(values, lang.hitch(this, function(val){
          if (val.indexOf('~') > -1){
            var ranges = val.split("~");
            valuesObj[vi].valueObj.value1 = ranges[0];
            valuesObj[vi].valueObj.value2 = ranges[1];
          }else{
            valuesObj[vi].valueObj.value = val;
          }
          vi++;
        }));
          
        vi = 0;
        var spDoms = query('.jimu-widget-search-single-parameter',this.tbody);
        array.forEach(spDoms,lang.hitch(this,function(spDom){
          var sp = registry.byNode(spDom);
          sp.setValueObj(valuesObj[vi]);
          vi++;
        }));
      },

      clear:function(){
        var spDoms = query('.jimu-widget-search-single-parameter',this.tbody);
        array.forEach(spDoms,lang.hitch(this,function(spDom){
          var sp = registry.byNode(spDom);
          sp.destroy();
        }));
        html.empty(this.tbody);
        this.valuesObj = null;
        this.layerInfo = null;
      },

      build:function(valuesObj,layerInfo,layerUri,layerDef){
        this.clear();
        this.valuesObj = lang.mixin({},valuesObj);
        this.layerInfo = lang.mixin({},layerInfo);
        this.layerUri = layerUri;
        this.layerDef = layerDef;
        //console.info(layerDef);
        array.forEach(valuesObj,lang.hitch(this,function(singleValue){
          var tr = html.create('tr',{innerHTML:'<td></td>'},this.tbody);
          var td = query('td',tr)[0];
          var fieldName = singleValue.fieldObj.name;
          var fieldInfo = this._getFieldInfo(fieldName, this.layerInfo);
          var args = {
            nls: this.nls,
            value: singleValue,
            fieldInfo: fieldInfo,
            layerDetails: this.layerInfo,
            layerUri: this.layerUri,
            layerDef: this.layerDef,
            layerUniqueCache: this.layerUniqueCache
          };
          var sp = new SingleParameter(args);
          sp.placeAt(td);
          singleValue.spId = sp.id;
        }));
      },

      _getFieldInfo:function(fieldName,lyrDef){
        var fieldInfos = lyrDef.fields;
        for(var i=0;i<fieldInfos.length;i++){
          var fieldInfo = fieldInfos[i];
          if(fieldName === fieldInfo.name){
            return lang.mixin({},fieldInfo);
          }
        }
        return null;
      }
    });
  });