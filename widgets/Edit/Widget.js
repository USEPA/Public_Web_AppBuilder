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
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/i18n!esri/nls/jsapi',
    'dojo/on',
    'dojo/query',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/MapManager',
    'esri/dijit/editing/Editor',
    'esri/layers/FeatureLayer'
  ],
  function(declare, lang, html, esriBundle, on, query, _WidgetsInTemplateMixin,
    BaseWidget, MapManager, Editor, FeatureLayer) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Edit',
      baseClass: 'jimu-widget-edit',
      editor: null,
      layers: null,
      _defaultStartStr: "",
      _defaultAddPointStr: "",
      resetInfoWindow: {},
      _sharedInfoBetweenEdits: {
        editCount: 0,
        resetInfoWindow: null
      },

      onOpen: function() {
        this.layers = [];
        this.disableWebMapPopup();
        this.first=true;
        this.getLayers();
        this.initEditor();
      },

      // onOpen: function() {
      //   if(!this.first) {
      //     this.disableWebMapPopup();
      //   }
      //   this.first = false;
      // },

      disableWebMapPopup: function() {
        /*global jimuConfig*/
        var mapManager = MapManager.getInstance();

        mapManager.disableWebMapPopup();
        // change to map's default infowindow(popup)
        var mapInfoWindow = mapManager.getMapInfoWindow();
        if(mapManager.isMobileInfoWindow) {
          this.map.setInfoWindow(mapInfoWindow.bigScreen);
          mapManager.isMobileInfoWindow = false;
        }

        // instead of Mapmanager.resetInfoWindow by self resetInfoWindow
        if(this._sharedInfoBetweenEdits.resetInfoWindow === null) {
          this._sharedInfoBetweenEdits.resetInfoWindow = mapManager.resetInfoWindow;
          this.own(on(this.map.infoWindow, "show", lang.hitch(this, function() {
            if (jimuConfig && jimuConfig.widthBreaks) {
              var width = jimuConfig.widthBreaks[0];
              if (html.getContentBox(jimuConfig.layoutId).w < width) {
                this.map.infoWindow.maximize();
              }
            }
          })));
        }
        mapManager.resetInfoWindow = lang.hitch(this, function() {
        });

        this._sharedInfoBetweenEdits.editCount++;
      },

      enableWebMapPopup: function() {
        var mapManager = MapManager.getInstance();

        // recover restInfoWindow when close widget.
        this._sharedInfoBetweenEdits.editCount--;
        if(this._sharedInfoBetweenEdits.editCount === 0 &&
            this._sharedInfoBetweenEdits.resetInfoWindow) {
          // edit will change infoWindow's size, so resize it.
          mapManager.getMapInfoWindow().bigScreen.resize(270, 316);
          mapManager.resetInfoWindow =
              lang.hitch(mapManager, this._sharedInfoBetweenEdits.resetInfoWindow);
          this._sharedInfoBetweenEdits.resetInfoWindow = null;
          mapManager.resetInfoWindow();
          mapManager.enableWebMapPopup();
        }
      },

      getLayerFromMap: function(url) {
        var ids = this.map.graphicsLayerIds;
        var len = ids.length;
        for (var i = 0; i < len; i++) {
          var layer = this.map.getLayer(ids[i]);
          if (layer.url === url) {
            return layer;
          }
        }
        return null;
      },

      getLayers: function() {
        var layerInfos = this.config.editor.layerInfos;
        for (var i = 0; i < layerInfos.length; i++) {
          var featureLayer = layerInfos[i].featureLayer;
          var layer = this.getLayerFromMap(featureLayer.url);
          if (!layer) {
            if (!layerInfos[i].featureLayer.options) {
              layerInfos[i].featureLayer.options = {};
            }
            if (!layerInfos[i].featureLayer.options.outFields) {
              if (layerInfos[i].fieldInfos) {
                layerInfos[i].featureLayer.options.outFields = [];
                for (var j = 0; j < layerInfos[i].fieldInfos.length; j++) {
                  layerInfos[i].featureLayer.options
                    .outFields.push(layerInfos[i].fieldInfos[j].fieldName);
                }
              } else {
                layerInfos[i].featureLayer.options.outFields = ["*"];
              }
            }
            layer = new FeatureLayer(featureLayer.url, featureLayer.options);
            this.map.addLayer(layer);
          }
          if (layer.visible) {
            layerInfos[i].featureLayer = layer;
            this.layers.push(layerInfos[i]);
          }
        }
      },

      initEditor: function() {
        this._defaultStartStr = esriBundle.toolbars.draw.start;
        esriBundle.toolbars.draw.start = esriBundle.toolbars.draw.start +
          "<br/>" + "(" + this.nls.pressStr + "<b>" +
          this.nls.ctrlStr + "</b> " + this.nls.snapStr + ")";
        this._defaultAddPointStr = esriBundle.toolbars.draw.addPoint;
        esriBundle.toolbars.draw.addPoint = esriBundle.toolbars.draw.addPoint +
          "<br/>" + "(" + this.nls.pressStr + "<b>" +
          this.nls.ctrlStr + "</b> " + this.nls.snapStr + ")";
        var json = this.config.editor;
        var settings = {};
        for (var attr in json) {
          settings[attr] = json[attr];
        }
        settings.layerInfos = this.layers;
        settings.map = this.map;

        var params = {
          settings: settings
        };
        if (!this.editDiv) {
          this.editDiv = html.create("div", {
            style: {
              width: "100%",
              height: "100%"
            }
          });
          html.place(this.editDiv, this.domNode);
        }
        // var styleNode =
        // html.toDom("<style>.jimu-widget-edit .grid{height: " + (height - 60) + "px;}</style>");
        // html.place(styleNode, document.head);

        this.editor = new Editor(params, this.editDiv);
        this.editor.startup();

        setTimeout(lang.hitch(this, this.resize), 100);
      },

      onMaximize: function(){
        setTimeout(lang.hitch(this, this.resize), 100);
      },

      onClose: function() {

        if (this.editor) {
          this.editor.destroy();
        }
        this.enableWebMapPopup();
        this.layers = [];
        this.editor = null;
        this.editDiv = html.create("div", {
          style: {
            width: "100%",
            height: "100%"
          }
        });
        html.place(this.editDiv, this.domNode);
        esriBundle.toolbars.draw.start = this._defaultStartStr;
        esriBundle.toolbars.draw.addPoint = this._defaultAddPointStr;
      },

      resize: function(){
        var widgetBox = html.getMarginBox(this.domNode);
        var height = widgetBox.h;
        var width = widgetBox.w;

        this.editor.templatePicker.update();

        //query(".esriEditor", this.domNode).style('height', height + 'px');
        query(".templatePicker", this.domNode).style('height', height - 50 + 'px');
        query(".grid", this.domNode).style('height', height - 60 + 'px');
        query(".dojoxGridView", this.domNode).style('height', height - 60 + 'px');
        query(".dojoxGridScrollbox", this.domNode).style('height', height - 60 + 'px');

        query(".dojoxGridRowTable", this.domNode).style('width', width - 32 + 'px');
      }
    });
  });