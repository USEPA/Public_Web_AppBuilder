///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define*/
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
  './SingleParameter',
  'dojo/Evented'
],
  function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, lang,
  html, array, on, query, registry, SingleParameter, Evented) {/*jshint unused: false*/
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-search-parameters',
      templateString: template,
      nls: null,
      valuesObj: null,
      layerInfo: null,
      layerUri: null,
      layerDef: null,
      layerUniqueCache: null,

      postCreate:function(){
        this.inherited(arguments);
        if(this.valuesObj){
          this.build(this.valuesObj);
        }
      },

      destroy: function(){
        this.clear();
        this.inherited(arguments);
      },

      getSingleParamValues: function(){
        var valArray = [];
        var spDoms = query('.widget-esearch-single-parameter',this.tbody);
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
        console.info("set Single Param Values:", values);
        array.forEach(values, lang.hitch(this, function(val, index){
          if (val.indexOf('~') > -1){
            var ranges = val.split("~");
            valuesObj[index].valueObj.value1 = ranges[0];
            valuesObj[index].valueObj.value2 = ranges[1];
          }else{
            valuesObj[index].valueObj.value = val;
          }
        }));

        var spDoms = query('.widget-esearch-single-parameter', this.tbody);
        console.info(spDoms);
        array.forEach(spDoms, lang.hitch(this, function(spDom, index){
          var sp = registry.byNode(spDom);
          sp.setValueObj(valuesObj[index]);
          console.info("setting single parameters to:", valuesObj[index]);
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

      build:function(valuesObj, layerInfo, layerUri, layerDef){
        this.clear();
        this.valuesObj = lang.mixin({},valuesObj);
        this.layerInfo = lang.mixin({},layerInfo);
        this.layerUri = layerUri;
        this.layerDef = layerDef;
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
            layerUniqueCache: this.layerUniqueCache,
            isValueRequired: singleValue.required || false
          };
          var sp = new SingleParameter(args);
          sp.placeAt(td);
          singleValue.spId = sp.id;
          sp.on('sp-enter-pressed', lang.hitch(this, function(){
            this.emit('enter-pressed', {});
          }));
        }));
      },

      _getFieldInfo:function(fieldName, lyrDef){
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
