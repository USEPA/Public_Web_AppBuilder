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
/*global define, console*/
define(['dojo/_base/declare',
  'dijit/form/FilteringSelect',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/Deferred',
  'esri/request',
  'dojo/store/Memory'
],
function(declare, FilteringSelect, lang, html, array, Deferred, esriRequest, Memory) {
  return declare([FilteringSelect], {
    _def:null,
    _layerInfo:null,

    url:null,
    fields:[{name:'name',title:'Name',type:'text',editable:false}],
    selectable:true,
    fieldType:null,//string,number

    postCreate:function(){
      this.inherited(arguments);
      //html.addClass(this.domNode,'jimu-layer-field-chooser');
      if(typeof this.url === 'string'){
        this.url = lang.trim(this.url);
      }
      else{
        this.url = null;
      }
      this.refresh(this.url);
    },

    refresh:function(url){
      url = lang.trim(url||'');
      this.url = url;
      this._layerInfo = null;
      this.clear();
      var def = this._requestLayerInfo(url);
      return def;
    },

    onRefreshed:function(response){/*jshint unused: false*/},

    getLayerInfo:function(){
      return this._layerInfo;
    },

    _requestLayerInfo:function(url){
      if(!url){
        return;
      }
      var def = new Deferred();
      if(this._def){
        this._def.cancel();
      }
      this._def = esriRequest({
        url:url,
        content:{f:"json"},
        handleAs:"json",
        callbackParamName:"callback",
        timeout:20000
      },{
        useProxy:false
      });
      this._def.then(lang.hitch(this,function(response){
        this._layerInfo = response;
        if(response && response.fields){
          var fields = array.filter(response.fields,function(item){
            return item.type !== 'esriFieldTypeOID' && item.type !== 'esriFieldTypeGeometry';
          });
          if(fields.length > 0){
            this.setFieldItems(fields);
          }
          this.onRefreshed(response);
        }
        def.resolve(lang.mixin({},this.fields));
      }),lang.hitch(this,function(error){
        this._layerInfo = null;
        console.error("request layer info failed",error);
        def.resolve(error);
      }));
      return def;
    },

    _addFieldItems:function(fieldInfos){
      var data = array.map(fieldInfos,lang.hitch(this,function(fieldInfo,index){
        var item = lang.mixin({},fieldInfo);
        item.id = index;
        item.shortType = this._getShortTypeByFieldType(fieldInfo.type);
        if(!item.alias){
          item.alias = item.name;
        }
        var a = '';
        if(item.shortType === 'string'){
          a = this.nls.string;
        }
        else if(item.shortType === 'number'){
          a = this.nls.number;
        }
        else if(item.shortType === 'date'){
          a = this.nls.date;
        }
        item.displayName = item.alias + " (" + a + ")";
        return item;
      }));

      if(data.length > 0){
        var store = new Memory({data:data});
        this.fieldsSelect.set('store',store);
        this.fieldsSelect.set('value',data[0].id);
      }
      this.fieldsSelect.focusNode.focus();
      this.fieldsSelect.focusNode.blur();
      //this._onFieldsSelectChange();
    },

    _getShortTypeByFieldType:function(fieldType){
      if(fieldType === this.stringFieldType){
        return 'string';
      }
      else if(fieldType === this.dateFieldType){
        return 'date';
      }
      else if(this.numberFieldTypes.indexOf(fieldType) >= 0){
        return 'number';
      }
      return null;
    }

  });
});
