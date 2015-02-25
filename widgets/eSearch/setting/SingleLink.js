/*global define, dojo, dijit, require, esri, console, setTimeout, document*/
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/_base/query',
  'dojo/on',
  'dojo/Deferred',
  'dojo/json',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/Tooltip',
  'dojo/text!./SingleLink.html',
  'dijit/form/TextBox',
  'jimu/dijit/LayerFieldChooser',
  'esri/request',
  'jimu/dijit/CheckBox',
  'widgets/eSearch/setting/AddFieldBtn'
],
function(declare,lang,array,html,query,on,Deferred,json,_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin,
  Tooltip,template,TextBox,LayerFieldChooser,esriRequest,CheckBox,AddFieldBtn) {/*jshint unused: false*/
  return declare([_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-singlelink-setting',
    templateString:template,
    nls:null,
    config:null,
    searchSetting:null,
    _isAddNow:true,
    layerInfoCache:null,
    _layerInfo:null,
    layerURL:null,

    postCreate:function(){
      this.inherited(arguments);
      this._bindEvents();
      this.setConfig(this.config);
      this._isAddNow = this.config ? false : true;
      this.updateStatus(this._isAddNow);
      this.getLayerInfo();
    },
    
    getLayerInfo:function(){
      this._layerInfo = this.layerInfoCache[this.layerURL];
      if (!this._layerInfo){
        var def = this._requestLayerInfo(this.layerURL);
        return def;
      } else{
        if(this._layerInfo.fields){
          var fields = array.filter(this._layerInfo.fields,function(item){
            return item.type !== 'esriFieldTypeOID' && item.type !== 'esriFieldTypeBlob' && item.type !== 'esriFieldTypeGeometry' && item.type !== 'esriFieldTypeRaster' && item.type !== 'esriFieldTypeGUID' && item.type !== 'esriFieldTypeGlobalID' && item.type !== 'esriFieldTypeXML';
          });
          if(fields.length > 0){
            this._initFieldsAdds(fields);
          }
        }
      }
    },
    
    _initFieldsAdds:function(fieldInfos){
      var data = array.map(fieldInfos,lang.hitch(this,function(fieldInfo,index){
        var item = lang.mixin({},fieldInfo);
        item.id = index;
        item.key = "{" + item.name + "}";
        item.label = item.alias + " {" + item.name + "}";
        return item;
      }));
      
      if(data.length > 0){
        this.linkContentAddButton.items = data;
        this.linkIconContentAddButton.items = data;
      }
    },
    
    _requestLayerInfo:function(url){
      if(!url){
        return;
      }
      esriRequest.setRequestPreCallback(function (ioArgs) {  
        ioArgs.failOk = true;
        return ioArgs;  
      });
      
      var def = new Deferred();
      if(this._def && !this._def.isFulfilled()){
        this._def.cancel('new layer info was requested');
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
        this.layerInfoCache[this.layerURL] = this._layerInfo;
        if(response && response.fields){
          var fields = array.filter(response.fields,function(item){
            return item.type !== 'esriFieldTypeOID' && item.type !== 'esriFieldTypeBlob' && item.type !== 'esriFieldTypeGeometry' && item.type !== 'esriFieldTypeRaster' && item.type !== 'esriFieldTypeGUID' && item.type !== 'esriFieldTypeGlobalID' && item.type !== 'esriFieldTypeXML';
          });
          if(fields.length > 0){
            this._initFieldsAdds(fields);
          }
        }
      }),lang.hitch(this,function(error){
        if (error.message == 'Request canceled'){
          //request was cancled so do nothng
        }else{
          console.error("request layer info failed",error);
        }
        this._layerInfo = null;
      }));
      esriRequest.setRequestPreCallback();
      return def;
    },
    
    setConfig:function(config){
      this.config = config;
      this.resetAll();
      if(!this.config){
        return;
      }
      this.linkAlias.set('value', lang.trim(this.config.alias || ""));
      this.disableNullLinkCbx.setValue(this.config.disablelinksifnull || true);
      this.disableLinkinPopUpCbx.setValue(this.config.disableinpopup || false);
      this.selectLinkType.set('value', this.config.popuptype || 'image');
      this.linkContentTA.value = this.config.content;
      this.linkIconContentTA.value = this.config.icon;
    },

    getConfig:function(){
      if(!this.validate(false)){
        return false;
      }
      var config = {
        alias:lang.trim(this.linkAlias.get('value')),
        disablelinksifnull: this.disableNullLinkCbx.getValue(),
        disableinpopup: this.disableLinkinPopUpCbx.getValue(),
        popuptype: this.selectLinkType.get('value'),
        content: lang.trim(this.linkContentTA.value),
        icon: lang.trim(this.linkIconContentTA.value)
      };
      this.config = config;
      return this.config;
    },

    updateStatus:function(isAddNow){
      this._isAddNow = !!isAddNow;
      if(this._isAddNow){
        html.setStyle(this.btnAdd,'display','block');
        html.setStyle(this.btnUpdate,'display','none');
      }
      else{
        html.setStyle(this.btnUpdate,'display','block');
        html.setStyle(this.btnAdd,'display','none');
      }
    },
    
    resetAll:function(){
      this.linkAlias.set('value', '');
    },

    onAdd:function(config){/*jshint unused: false*/},

    onUpdate:function(config){/*jshint unused: false*/},

    onAddCancel:function(){},

    onUpdateCancel:function(){},
    
    _bindEvents:function(){
      this.own(on(this.linkContentAddButton, 'onMenuClick', lang.hitch(this,function(item){
        this._insertAtCursor(this.linkContentTA,item.key);
      })));
      this.own(on(this.linkIconContentAddButton, 'onMenuClick', lang.hitch(this,function(item){
        this._insertAtCursor(this.linkIconContentTA,item.key);
      })));
      this.own(on(this.btnAdd,'click',lang.hitch(this,function(){
        var config = this.getConfig();
        if(config){
          this.setConfig(config);
          this.updateStatus(false);
          this.onAdd(config);
        }
      })));
      this.own(on(this.btnUpdate,'click',lang.hitch(this,function(){
        var config = this.getConfig();
        if(config){
          this.updateStatus(false);
          this.onUpdate(config);
        }
      })));
      this.own(on(this.btnCancel,'click',lang.hitch(this,function(){
        if(this._isAddNow){
          this.onAddCancel();
        }
        else{
          this.setConfig(this.config);
          this.onUpdateCancel();
        }
      })));
    },
    
    _insertAtCursor:function(myField, myValue) {
        var sel;
        //IE support
        if (document.selection) {
            myField.focus();
            sel = document.selection.createRange();
            sel.text = myValue;
        }
        //MOZILLA and others
        else if (myField.selectionStart || myField.selectionStart == '0') {
            var startPos = myField.selectionStart;
            var endPos = myField.selectionEnd;
            myField.value = myField.value.substring(0, startPos) + myValue + myField.value.substring(endPos, myField.value.length);
            myField.selectionStart = startPos + myValue.length;
            myField.selectionEnd = startPos + myValue.length;
        } else {
            myField.value += myValue;
        }
    },
    
    validate:function(showTooltip){
      if(lang.trim(this.linkAlias.get('value')) === ''){
        if(showTooltip){
          this._showTooltip(this.linkAlias.domNode,"Please input value.");
        }
        return false;
      }
      if(lang.trim(this.linkContentTA.value) === ''){
        if(showTooltip){
          this._showTooltip(this.linkContentTA,"Please input value.");
        }
        return false;
      }
      return true;
    },

    _showTooltip:function(aroundNode, content, time){
      this._scrollToDom(aroundNode);
      Tooltip.show(content,aroundNode);
      time = time ? time : 2000;
      setTimeout(function(){
        Tooltip.hide(aroundNode);
      },time);
    },

    _scrollToDom:function(dom){
      var scrollDom = this.searchSetting.domNode.parentNode;
      var y1 = html.position(scrollDom).y;
      var y2 = html.position(dom).y;
      scrollDom.scrollTop = y2 - y1;
    },

    onBack:function(singleLink,config){/*jshint unused: false*/},
  });
});