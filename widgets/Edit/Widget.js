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
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/i18n!esri/nls/jsapi',
    'dojo/on',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/MapManager',
    'jimu/LayerInfos/LayerInfos',
    'esri/dijit/editing/Editor',
    'esri/dijit/Popup',
    "esri/dijit/editing/TemplatePicker",
    "dijit/form/Button",
    "./utils"
  ],
  function(declare, lang, array, html, esriBundle, on, _WidgetsInTemplateMixin,
    BaseWidget, MapManager, LayerInfos, Editor, Popup, TemplatePicker, Button, editUtils) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Edit',
      baseClass: 'jimu-widget-edit',
      editor: null,
      _defaultStartStr: "",
      _defaultAddPointStr: "",
      resetInfoWindow: {},
      _sharedInfoBetweenEdits: {
        editCount: 0,
        resetInfoWindow: null
      },
      _jimuLayerInfos: null,
      editPopup: null,
      _configEditor: null,

      startup: function() {
        this.inherited(arguments);
        this.editPopup = new Popup(null, html.create("div",
                                                    {"class":"jimu-widget-edit-infoWindow"},
                                                    null,
                                                    this.map.root));
      },

      _init: function() {
        this._editorMapClickHandlers = [];
        this._configEditor = lang.clone(this.config.editor);
      },

      onOpen: function() {
        this._init();
        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(operLayerInfos) {
            this._jimuLayerInfos = operLayerInfos;
            setTimeout(lang.hitch(this, function() {
              this.widgetManager.activateWidget(this);
              this._createEditor();
            }), 1);
          }));
      },

      onActive: function(){
        this.disableWebMapPopup();
      },

      onDeActive: function(){
        this.enableWebMapPopup();
      },

      disableWebMapPopup: function() {
        var mapManager = MapManager.getInstance();
        mapManager.disableWebMapPopup();
        // hide map's infoWindow
        this.map.infoWindow.hide();
        // instead of map's infowindow by editPopup
        this.map.setInfoWindow(this.editPopup);
        this._enableMapClickHandler();

        // instead of Mapmanager.resetInfoWindow by self resetInfoWindow
        if (this._sharedInfoBetweenEdits.resetInfoWindow === null) {
          this._sharedInfoBetweenEdits.resetInfoWindow = mapManager.resetInfoWindow;
          this.own(on(this.map.infoWindow, "show", lang.hitch(this, function() {
            if (window.appInfo.isRunInMobile) {
              this.map.infoWindow.maximize();
            }
          })));
        }
        mapManager.resetInfoWindow = lang.hitch(this, function() {});

        //this._sharedInfoBetweenEdits.editCount++;
      },

      enableWebMapPopup: function() {
        var mapManager = MapManager.getInstance();
        var mapInfoWindow = mapManager.getMapInfoWindow();
        // recover restInfoWindow when close widget.
        //this._sharedInfoBetweenEdits.editCount--;
        if (this._sharedInfoBetweenEdits.resetInfoWindow) {
          //this._sharedInfoBetweenEdits.editCount === 0 &&

          this.map.setInfoWindow(mapInfoWindow.bigScreen);
          mapManager.isMobileInfoWindow = false;

          mapManager.resetInfoWindow =
            lang.hitch(mapManager, this._sharedInfoBetweenEdits.resetInfoWindow);
          this._sharedInfoBetweenEdits.resetInfoWindow = null;
          mapManager.resetInfoWindow();
          this._disableMapClickHandler();
          // hide popup and delete seleection
          this.editPopup.hide();
          this.editor._clearSelection();
          // recall enableWebMap
          mapManager.enableWebMapPopup();
        }
      },

      _enableMapClickHandler: function() {
        if (this.editor) {
          this._editorMapClickHandlers.push(this.editor._mapClickHandler);
          this.editor._enableMapClickHandler();
          this._editorMapClickHandlers.push(this.editor._mapClickHandler);
        }
      },

      _disableMapClickHandler: function() {
        if (this.editor) {
          this.editor._disableMapClickHandler();
          array.forEach(this._editorMapClickHandlers, function(editorMapClickHandler) {
            if(editorMapClickHandler && editorMapClickHandler.remove) {
              editorMapClickHandler.remove();
            }
          });
          this._editorMapClickHandlers = [];
        }
      },

      _getDefaultFieldInfos: function(layerId) {
        // summary:
        //  filter webmap fieldInfos.
        // description:
        //   return null if fieldInfos has not been configured in webmap.
        var fieldInfos = editUtils.getFieldInfosFromWebmap(layerId, this._jimuLayerInfos);
        if(fieldInfos) {
          fieldInfos = array.filter(fieldInfos, function(fieldInfo) {
            return fieldInfo.visible || fieldInfo.isEditable;
          });
        }
        return fieldInfos;
      },

      _getDefaultLayerInfos: function() {
        var defaultLayerInfos = [];
        var fieldInfos;
        for(var i = this.map.graphicsLayerIds.length - 1; i >= 0 ; i--) {
          var layerObject = this.map.getLayer(this.map.graphicsLayerIds[i]);
          if (layerObject.type === "Feature Layer" && layerObject.url) {
            var layerInfo = {
              featureLayer: {}
            };
            layerInfo.featureLayer.id = layerObject.id;
            layerInfo.disableGeometryUpdate = false;
            fieldInfos = this._getDefaultFieldInfos(layerObject.id);
            if(fieldInfos && fieldInfos.length > 0) {
              layerInfo.fieldInfos = fieldInfos;
            }
            defaultLayerInfos.push(layerInfo);
          }
        }
        return defaultLayerInfos;
      },

      _converConfiguredLayerInfos: function(layerInfos) {
        array.forEach(layerInfos, function(layerInfo) {
          // convert layerInfos to compatible with old version
          if(!layerInfo.featureLayer.id && layerInfo.featureLayer.url) {
            var layerObject = getLayerObjectFromMapByUrl(this.map, layerInfo.featureLayer.url);
            if(layerObject) {
              layerInfo.featureLayer.id = layerObject.id;
            }
          }

          // convert fieldInfos
          var newFieldInfos = [];
          var webmapFieldInfos =
            editUtils.getFieldInfosFromWebmap(layerInfo.featureLayer.id, this._jimuLayerInfos);
          array.forEach(layerInfo.fieldInfos, function(fieldInfo) {
            if(/*fieldInfo.isEditable &&*/
               // only for compitible with old version of config.
               // 'globalid' and 'objectid' can not appear in new app's config.
               fieldInfo.fieldName !== "globalid" &&
               fieldInfo.fieldName !== "objectid") {
              var webmapFieldInfo = getFieldInfoFromWebmapFieldInfos(webmapFieldInfos, fieldInfo);
              if(webmapFieldInfo) {
                if( webmapFieldInfo.isEditable ||
                    webmapFieldInfo.isEditableSettingInWebmap ||
                    webmapFieldInfo.visible) {
                  newFieldInfos.push(webmapFieldInfo);
                }
              } else {
                newFieldInfos.push(fieldInfo);
              }
            }
          }, this);

          if(newFieldInfos.length !== 0) {
            layerInfo.fieldInfos = newFieldInfos;
          }
        }, this);
        return layerInfos;

        function getFieldInfoFromWebmapFieldInfos(webmapFieldInfos, fieldInfo) {
          var resultFieldInfo = null;
          if(webmapFieldInfos) {
            for(var i = 0; i < webmapFieldInfos.length; i++) {
              if(fieldInfo.fieldName === webmapFieldInfos[i].fieldName) {
                webmapFieldInfos[i].label = fieldInfo.label;
                webmapFieldInfos[i].isEditableSettingInWebmap = webmapFieldInfos[i].isEditable;
                webmapFieldInfos[i].isEditable = fieldInfo.isEditable;
                resultFieldInfo = webmapFieldInfos[i];
                // resultFieldInfo.label = fieldInfo.label;
                // resultFieldInfo.isEditableSettingInWebmap = webmapFieldInfos[i].isEditable;
                // resultFieldInfo.isEditable = fieldInfo.isEditable;
                break;
              }
            }
          }
          return resultFieldInfo;
        }

        function getLayerObjectFromMapByUrl(map, layerUrl) {
          var resultLayerObject = null;
          for(var i = 0; i < map.graphicsLayerIds.length; i++) {
            var layerObject = map.getLayer(map.graphicsLayerIds[i]);
            if(layerObject.url.toLowerCase() === layerUrl.toLowerCase()) {
              resultLayerObject = layerObject;
              break;
            }
          }
          return resultLayerObject;
        }
      },

      _getLayerInfosParam: function() {
        // var retDef = new Deferred();
        // var defs = [];
        var layerInfos;
        var resultLayerInfosParam = [];
        if(!this._configEditor.layerInfos) {
          // configured in setting page and no layers checked.
          layerInfos = [];
        } else if(this._configEditor.layerInfos.length > 0)  {
          // configured and has been checked.
          layerInfos = this._converConfiguredLayerInfos(this._configEditor.layerInfos);
        } else {
          // has not been configure.
          layerInfos = this._getDefaultLayerInfos();
        }

        //according to condition to filter
        array.forEach(layerInfos, function(layerInfo) {
          var layerObject = this.map.getLayer(layerInfo.featureLayer.id);
          if(layerObject &&
             layerObject.visible &&
             layerObject.isEditable &&
             layerObject.isEditable()) {
            layerInfo.featureLayer = layerObject;
            resultLayerInfosParam.push(layerInfo);
          }
        }, this);
        return resultLayerInfosParam;
      },

      _getTemplatePicker: function(layerInfos) {
        var layerObjects = [];

        array.forEach(layerInfos, function(layerInfo) {
          if(layerInfo.featureLayer &&
            layerInfo.featureLayer.getEditCapabilities &&
            layerInfo.featureLayer.getEditCapabilities().canCreate) {
            layerObjects.push(layerInfo.featureLayer);
          }
        }, this);

        var templatePicker = new TemplatePicker({
          featureLayers: layerObjects,
          grouping: true,
          rows: "auto",
          columns: "auto",
          style: this._configEditor.toolbarVisible ? "" : "bottom: 0px"
        }, html.create("div", {}, this.domNode));
        templatePicker.startup();
        return templatePicker;
      },

      _getSettingsParam: function() {
        var settings = {
          map: this.map,
          createOptions: {
            polygonDrawTools: [
              Editor.CREATE_TOOL_ARROW,
              Editor.CREATE_TOOL_AUTOCOMPLETE,
              Editor.CREATE_TOOL_CIRCLE,
              Editor.CREATE_TOOL_ELLIPSE,
              Editor.CREATE_TOOL_RECTANGLE,
              Editor.CREATE_TOOL_TRIANGLE,
              Editor.CREATE_TOOL_POLYGON,
              Editor.CREATE_TOOL_FREEHAND_POLYGON
            ],
            polylineDrawTools: [
              Editor.CREATE_TOOL_POLYLINE,
              Editor.CREATE_TOOL_FREEHAND_POLYLINE
            ]
          }
        };
        for (var attr in this._configEditor) {
          settings[attr] = this._configEditor[attr];
        }
        settings.layerInfos = this._getLayerInfosParam();
        settings.templatePicker = this._getTemplatePicker(settings.layerInfos);

        return settings;
      },

      _createEditor: function() {
        var params = {
          settings: this._getSettingsParam()
        };
        this._worksBeforeCreate(params.settings);
        this.editor = new Editor(params, html.create("div", {}, this.domNode));
        this.editor.startup();
        this._worksAfterCreate();
      },

      _addButtonToInspector: function() {
        var closeButton = new Button({
          label: esriBundle.common.close,
          "class": " atiButton closeButton"
        }, html.create("div"));

        html.place(closeButton.domNode,
                   this.editor.attributeInspector.deleteBtn.domNode,
                   "after");
        this.own(on(closeButton, 'click', lang.hitch(this, function() {
          this.editPopup.hide();
        })));
      },

      _update: function() {
        if(this.editor){
          this.editor.templatePicker.update();
        }
      },

      resize: function() {
        this._update();
      },

      onClose: function() {
        if (this.editor) {
          this.editor.destroy();
        }
        this.editor = null;
        // close method will call onDeActive automaticlly
        // so do not need to call onDeActive();
        this._worksAfterClose();
      },

      _worksBeforeCreate: function(settings) {
        // change string of mouse tooltip
        var additionStr = "<br/>" + "(" + this.nls.pressStr + "<b>" +
          this.nls.ctrlStr + "</b> " + this.nls.snapStr + ")";
        this._defaultStartStr = esriBundle.toolbars.draw.start;
        this._defaultAddPointStr = esriBundle.toolbars.draw.addPoint;
        esriBundle.toolbars.draw.start =
          esriBundle.toolbars.draw.start + additionStr;
        esriBundle.toolbars.draw.addPoint =
          esriBundle.toolbars.draw.addPoint + additionStr;

        // hide label layer.
        var labelLayer = this.map.getLayer("labels");
        if(labelLayer) {
          labelLayer.hide();
        }

        // change layer name
        array.forEach(settings.layerInfos, function(layerInfo) {
          var jimuLayerInfo =
            this._jimuLayerInfos.getLayerInfoByTopLayerId(layerInfo.featureLayer.id);
          if(jimuLayerInfo) {
            layerInfo.featureLayer.name = jimuLayerInfo.title;
          }
        }, this);
      },

      _worksAfterCreate: function() {
        // add close button to atiInspector
        this._addButtonToInspector();
        // resize editPopup
        this.editPopup.resize(500, 251);
        // update templatePicker for responsive.
        this.editor.templatePicker.update();
        //just for BoxTheme
        setTimeout(lang.hitch(this, this._update), 900);
        // // reset default selectionSymbol that change by Editor dijit.
        // array.forEach(this.editor.settings.layerInfos, function(layerInfo) {
        //   layerInfo.featureLayer.setSelectionSymbol();
        // }, this);
      },

      _worksAfterClose: function() {
        esriBundle.toolbars.draw.start = this._defaultStartStr;
        esriBundle.toolbars.draw.addPoint = this._defaultAddPointStr;

        // show lable layer.
        var labelLayer = this.map.getLayer("labels");
        if(labelLayer) {
          labelLayer.show();
        }
      },

      onNormalize: function(){
        setTimeout(lang.hitch(this, this._update), 100);
      },

      onMinimize: function(){
      },

      onMaximize: function(){
        setTimeout(lang.hitch(this, this._update), 100);
      }
    });
  });