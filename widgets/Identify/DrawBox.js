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
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./DrawBox.html',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/on',
  'dojo/query',
  'esri/layers/GraphicsLayer',
  'esri/graphic',
  'esri/toolbars/draw',
  'esri/symbols/jsonUtils'
],
function(declare, _WidgetBase, _TemplatedMixin,_WidgetsInTemplateMixin,
  template, lang, html, array, on, query,
  GraphicsLayer, Graphic, Draw, jsonUtils) {
  return declare([_WidgetBase, _TemplatedMixin,_WidgetsInTemplateMixin], {
    templateString:template,
    baseClass: 'jimu-draw-box',
    declaredClass: 'jimu.dijit.DrawBox',
    nls:null,
    types:null,//['point','polyline','polygon']
    pointSymbol:null,
    polylineSymbol:null,
    polygonSymbol:null,
    map:null,
    drawLayer:null,
    drawLayerId:null,
    drawToolBar:null,
    showClear:false,
    keepOneGraphic:false,
    lastTool:null,

    //options:
    //types
    //showClear
    //keepOneGraphic
    //map
    //pointSymbol
    //polylineSymbol
    //polygonSymbol

    //public methods:
    //clear
    //deactivate
    //activate

    postMixInProperties:function(){
      this.nls = window.jimuNls.drawBox;
    },

    postCreate:function(){
      this.inherited(arguments);
      var layerArgs = {};
      if(this.drawLayerId){
        layerArgs.id = this.drawLayerId;
      }
      this.drawLayer = new GraphicsLayer(layerArgs);
      this._initDefaultSymbols();
      this._initTypes();
      var items = query('.draw-item',this.domNode);
      this.own(items.on('click',lang.hitch(this,this._onItemClick)));
      this.own(on(this.btnClear,'click',lang.hitch(this,this.clear)));
      if(this.map){
        this.setMap(this.map);
      }
      var display = this.showClear === true ? 'block' : 'none';
      html.setStyle(this.btnClear,'display',display);
    },

    disableWebMapPopup:function(){
      if(this.map && this.map.webMapResponse){
        var handler = this.map.webMapResponse.clickEventHandle;
        if(handler){
          handler.remove();
          this.map.webMapResponse.clickEventHandle = null;
        }
      }
    },

    enableWebMapPopup:function(){
      if(this.map && this.map.webMapResponse){
        var handler = this.map.webMapResponse.clickEventHandle;
        var listener = this.map.webMapResponse.clickEventListener;
        if(listener && !handler){
          this.map.webMapResponse.clickEventHandle=on(this.map,
                                                      'click',
                                                      lang.hitch(this.map,listener));
        }
      }
    },

    destroy:function(){
      if(this.drawToolBar){
        this.drawToolBar.deactivate();
      }

      if(this.drawLayer){
        if(this.map){
          this.map.removeLayer(this.drawLayer);
        }
      }

      this.drawToolBar = null;
      this.map = null;
      this.drawLayer = null;
      this.inherited(arguments);
    },

    setMap:function(map){
      if(map){
        this.map = map;
        this.map.addLayer(this.drawLayer);
        this.drawToolBar = new Draw(this.map);
        this.drawToolBar.setMarkerSymbol(this.pointSymbol);
        this.drawToolBar.setLineSymbol(this.polylineSymbol);
        this.drawToolBar.setFillSymbol(this.polygonSymbol);
        this.own(on(this.drawToolBar,'draw-end',lang.hitch(this,this._onDrawEnd)));
      }
    },

    setPointSymbol:function(symbol){
      this.pointSymbol = symbol;
      this.drawToolBar.setMarkerSymbol(this.pointSymbol);
    },

    setLineSymbol:function(symbol){
      this.polylineSymbol = symbol;
      this.drawToolBar.setLineSymbol(symbol);
    },

    setPolygonSymbol:function(symbol){
      this.polygonSymbol = symbol;
      this.drawToolBar.setFillSymbol(symbol);
    },

    setTypes:function(types){
      this.types = types;
      this._initTypes();
    },

    clear:function(){
      this.drawLayer.clear();
      this.onClear();
    },

    deactivate:function(){
      this.enableWebMapPopup();
      if(this.drawToolBar){
        this.drawToolBar.deactivate();
      }
      query('.draw-item',this.domNode).removeClass('selected');
    },

    activate:function(stool){
      var target;
      query('.draw-item',this.domNode).removeClass('selected');
      query('.draw-item', this.domNode).forEach(function(node) {
        if(node.getAttribute('data-geotype') === stool){
          target = node;
        }
      });
      html.addClass(target,'selected');
      var geotype = target.getAttribute('data-geotype');
      var commontype = target.getAttribute('data-commontype');
      var tool = Draw[geotype];
      this.disableWebMapPopup();
      this.drawToolBar.activate(tool);
      this.lastTool = geotype;
      this.onIconSelected(target,geotype,commontype);
    },

    onIconSelected:function(target,geotype,commontype){/*jshint unused: false*/},

    onDrawEnd:function(graphic,geotype,commontype){/*jshint unused: false*/},

    onClear:function(){},

    addGraphic:function(g){
      if(this.keepOneGraphic){
        this.drawLayer.clear();
      }
      this.drawLayer.add(g);
    },

    removeGraphic:function(g){
      this.drawLayer.remove(g);
    },

    _initDefaultSymbols:function(){
      var pointSys = {
        "style": "esriSMSCircle",
        "color": [0, 0, 128, 128],
        "name": "Circle",
        "outline": {
          "color": [0, 0, 128, 255],
          "width": 1
        },
        "type": "esriSMS",
        "size": 6
      };
      var lineSys = {
        "style": "esriSLSSolid",
        "color": [79, 129, 189, 255],
        "width": 3,
        "name": "Blue 1",
        "type": "esriSLS"
      };
      var polygonSys = {
        "style": "esriSFSSolid",
        "color": [79, 129, 189, 128],
        "type": "esriSFS",
        "outline": {
          "style": "esriSLSSolid",
          "color": [54, 93, 141, 255],
          "width": 1.5,
          "type": "esriSLS"
        }
      };
      if(!this.pointSymbol){
        this.pointSymbol = jsonUtils.fromJson(pointSys);
      }
      if(!this.polylineSymbol){
        this.polylineSymbol = jsonUtils.fromJson(lineSys);
      }
      if(!this.polygonSymbol){
        this.polygonSymbol = jsonUtils.fromJson(polygonSys);
      }
    },

    _initTypes:function(){
      if(!(this.types instanceof Array)){
        this.types = ['point','line','polyline','freehand_polyline','triangle','extent','circle','ellipse','polygon','freehand_polygon'];
      }
      var items = query('.draw-item',this.domNode);
      items.style('display','none');
      array.forEach(items,lang.hitch(this,function(item){
        var geoType = item.getAttribute('data-geotype').toLowerCase();
        var display = array.indexOf(this.types,geoType) >= 0 ? 'block' : 'none';
        html.setStyle(item,'display',display);
      }));
    },

    _onItemClick:function(event){
      var target = event.target||event.srcElement;
      var geotype = target.getAttribute('data-geotype');
      var commontype = target.getAttribute('data-commontype');
      var tool = Draw[geotype];
      if(this.lastTool){
        if(this.lastTool === geotype){
          this.lastTool = null;
          this.deactivate();
          return false;
        }
      }
      var items = query('.draw-item',this.domNode);
      items.removeClass('selected');
      html.addClass(target,'selected');
      this.disableWebMapPopup();
      this.drawToolBar.activate(tool);
      this.lastTool = geotype;
      this.onIconSelected(target,geotype,commontype);
    },

    _onDrawEnd:function(event){
      var selectedItem = query('.draw-item.selected',this.domNode)[0];
      var geotype = selectedItem.getAttribute('data-geotype');
      var commontype = selectedItem.getAttribute('data-commontype');
      var geometry = event.geometry;
      var type = geometry.type;
      var symbol = null;
      if (type === "point" || type === "multipoint") {
        symbol = this.pointSymbol;
      } else if (type === "line" || type === "polyline") {
        symbol = this.polylineSymbol;
      } else {
        symbol = this.polygonSymbol;
      }
      var g = new Graphic(geometry,symbol,null,null);
      if(this.keepOneGraphic){
        this.drawLayer.clear();
      }
      this.drawLayer.add(g);
      this.deactivate();
      this.onDrawEnd(g,geotype,commontype);
    }

  });
});
