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
    'dojo/_base/html',
    'dojo/query',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'dijit/layout/TabContainer',
    "dijit/layout/ContentPane",
    'jimu/utils',
    'jimu/dijit/Popup',
    'jimu/dijit/Message',
    "dgrid/OnDemandGrid",
    "dgrid/Selection",
    "dojo/store/Memory",
    "dgrid/extensions/Pagination",
    "dgrid/extensions/ColumnReorder",
    "dgrid/extensions/ColumnHider",
    "dgrid/extensions/ColumnResizer",
    "dgrid/extensions/DnD",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/Deferred",
    "dojo/promise/all",
    "esri/config",
    "esri/tasks/RelationParameters",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/GraphicsLayer",
    "esri/renderers/SimpleRenderer",
    "esri/layers/FeatureLayer",
    "esri/symbols/jsonUtils",
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "esri/tasks/GeometryService",
    "esri/tasks/ProjectParameters",
    "esri/graphic",
    "esri/geometry/Point",
    "esri/geometry/Multipoint",
    "esri/geometry/Polyline",
    "esri/geometry/Polygon",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/Color",
    "esri/geometry/normalizeUtils",
    'dojo/_base/lang',
    "dojo/on",
    'dojo/topic',
    'dojo/aspect',
    "dojo/_base/array",
    "dojo/has",
    "dojo/query",
    "dojo/_base/fx",
    "dojo/_base/window",
    "dijit/Toolbar",
    "dijit/form/Button",
    "dijit/DropDownMenu",
    "dijit/MenuItem",
    "jimu/dijit/CheckBox",
    "dijit/CheckedMenuItem",
    "dijit/form/DropDownButton",
    // "jimu/dijit/SymbolChooser",
    'jimu/dijit/LoadingIndicator',
    // 'jimu/utils',
    './utils'
  ],
  function(
    declare,
    html,
    query,
    _WidgetsInTemplateMixin,
    BaseWidget,
    TabContainer,
    ContentPane,
    utils,
    Popup,
    Message,
    OnDemandGrid,
    Selection,
    Memory,
    Pagination,
    ColumnReorder,
    ColumnHider,
    ColumnResizer,
    DnD,
    domConstruct,
    domStyle,
    domAttr,
    domClass,
    Deferred,
    all,
    esriConfig,
    RelationParameters,
    ArcGISDynamicMapServiceLayer,
    GraphicsLayer,
    SimpleRenderer,
    FeatureLayer,
    jsonUtils,
    QueryTask,
    Query,
    GeometryService,
    ProjectParameters,
    Graphic,
    Point,
    Multipoint,
    Polyline,
    Polygon,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    SimpleFillSymbol,
    Color,
    normalizeUtils,
    lang,
    on,
    topic,
    aspect,
    array,
    has,
    domQuery,
    fx,
    win,
    Toolbar,
    Button,
    DropDownMenu,
    MenuItem,
    CheckBox,
    CheckedMenuItem,
    DropDownButton,
    // SymbolChooser,
    LoadingIndicator,
    // jimuUtils,
    attrUtils) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      /* global apiUrl */
      name: 'AttributeTable',
      baseClass: 'jimu-widget-attributetable',
      normalHeight: 0,

      startup: function() {
        this.inherited(arguments);
        utils.loadStyleLink("dgrid", apiUrl + "dgrid/css/dgrid.css");
        this.AttributeTableDiv = null;
        this.layers = [];
        this.configLayerInfos = []; // keep pace with this.config.layers
        this._delayedLayerInfos = [];
        this._allLayerInfos = [];
        this.grids = [];
        this.selectedRowsLabelDivs = [];
        this.toolbarDiv = null;
        this.tabContainer = null;
        this.tabPages = [];
        this.tableDiv = null;
        this.zoomButton = null;
        this.exportButton = null;
        this.selectionMenu = null;
        this.refreshButton = null;
        this.moveMaskDiv = null;
        this.moveMode = false;
        this.isIndicate = true;
        this.moveY = 0;
        this.previousDomHeight = 0;
        this.previousGridHeight = 0;
        this.noGridHeight = 0;
        this.toolbarHeight = 0;
        this.bottomPosition = 0;
        this.matchingCheckBox = null;
        this.layersIndex = -1;
        this.matchingMap = false;
        // this.isTransparent = true;

        this.showing = true;
        this.graphicsLayers = [];

        this.isFirst = true;
        this.currentHeight = 0;
        this.setInitialPosition();
        this.openHeight = this.normalHeight;

        attrUtils.readLayerInfosObj(this.map).then(lang.hitch(this, function(layerInfosObj) {
          this.own(on(
            layerInfosObj,
            'layerInfosIsShowInMapChanged',
            lang.hitch(this, this.onLayerInfosIsShowInMapChanged)));
          this.own(layerInfosObj.on(
            'layerInfosChanged',
            lang.hitch(this, this.onLayerInfosChanged)));
          this._createBar();
          this._closeTable();
        }));
      },

      _createBar: function() {
        this.arrowDiv = domConstruct.create("div");
        domClass.add(this.arrowDiv, "jimu-widget-attributetable-move");
        this.bar = domConstruct.create("div");
        domClass.add(this.bar, "jimu-widget-attributetable-bar");
        domConstruct.place(this.bar, this.domNode);
        domConstruct.place(this.arrowDiv, this.domNode);

        this.moveMaskDiv = domConstruct.create("div", {
          style: "opacity:0; width:100%; height:100%;" +
            "position:absolute; z-index:999; display:none;cursor: ns-resize",
          'class': 'jimu-widget-attributetable-mask'
        });
        domConstruct.place(this.moveMaskDiv, win.body(), "first");

        this.own(on(this.arrowDiv, 'mousedown', lang.hitch(this, this.onMouseEvent)));
        this.own(on(this.bar, 'click', lang.hitch(this, this._switchTable)));
      },

      _switchTable: function() {
        if (this.currentHeight === 0) {
          this._openTable();
        } else {
          this._closeTable();
        }
      },

      _openTable: function() {
        var def = new Deferred();
        if (this.isFirst) { // first open
          this.currentHeight = this.normalHeight;
          this.isFirst = false;
          if (!this.loading) {
            this.loading = new LoadingIndicator();
          }
          this.loading.placeAt(this.domNode);
          this.loading.show();

          attrUtils.readConfigLayerInfosFromMap(this.map)
            .then(lang.hitch(this, function(layerInfos) {
              if (this.config.layerInfos.length === 0) {
                var configLayerInfos = attrUtils.getConfigInfosFromLayerInfos(layerInfos);
                this.config.layerInfos = array.filter(configLayerInfos, function(layer) {
                  return layer.show;
                });
              } else {
                this.config.layerInfos = array.filter(
                  lang.clone(this.config.layerInfos), function(layer) {
                    return layer.show;
                  });
              }

              this._allLayerInfos = layerInfos;
              this._processDelayedLayerInfos();

              this._init();
              if (this._allLayerInfos.length === 0) {
                this.showRefreshing(false);
              }
              def.resolve();
            }), lang.hitch(this, function(err) {
              console.error(err);
            }));
        } else {
          def.resolve();
        }
        domClass.remove(this.bar, 'close');
        domClass.add(this.bar, 'open');
        this._changeHeight(this.openHeight);
        domAttr.set(this.bar, 'title', this.nls.closeTableTip);
        return def;
      },

      _closeTable: function() {
        domClass.remove(this.bar, 'open');
        domClass.add(this.bar, 'close');
        this._changeHeight(0);
        this.showRefreshing(false);
        domAttr.set(this.bar, 'title', this.nls.openTableTip);
      },

      _init: function() {
        this.initConfigLayerInfos();
        this.initDiv();
        this.resize();

        this.own(on(this.map, "extent-change", lang.hitch(this, this.onExtentChange)));
        this.own(on(this.map, "layer-remove", lang.hitch(this, this.onRemoveLayer)));
        this.own(on(this.map, "resize", lang.hitch(this, this.onMapResize)));
        this.own(on(window.document, "mouseup", lang.hitch(this, this.onMouseEvent)));
        this.own(on(window.document, "mousemove", lang.hitch(this, this.onMouseEvent)));

        this.indicateHorDiv = domConstruct.create("div");
        domClass.add(this.indicateHorDiv, "jimu-widget-attributetable-indicate-horizontal");
        this.indicateVelDiv = domConstruct.create("div");
        domClass.add(this.indicateVelDiv, "jimu-widget-attributetable-indicate-vertical");
        domConstruct.place(this.indicateHorDiv, this.map.root, "first");
        domConstruct.place(this.indicateVelDiv, this.map.root, "first");
      },

      _processDelayedLayerInfos: function() { // must be invoke after initialize this._layerInfos
        if (this._delayedLayerInfos.length > 0) {
          array.forEach(this._delayedLayerInfos, lang.hitch(this, function(delayedLayerInfo) {
            if (!this._getLayerInfoById(delayedLayerInfo.id)) {
              this._allLayerInfos.push(delayedLayerInfo);
            }
          }));

          this._delayedLayerInfos = [];
        }
      },

      onLayerInfosIsShowInMapChanged: function() {
        this.checkMapInteractiveFeature();
      },

      onLayerInfosChanged: function(layerInfo, changeType, layerInfoSelf) {
        if ('added' !== changeType || !layerInfoSelf) {
          return;
        }
        layerInfoSelf.getSupportTableInfo().then(lang.hitch(this, function(supportTableInfo) {
          if (supportTableInfo.isSupportedLayer) {
            if (this._allLayerInfos.length === 0) {
              this._delayedLayerInfos.push(layerInfoSelf);
            } else if (this._allLayerInfos.length > 0 &&
              !this._getLayerInfoById(layerInfoSelf.id)) {
              this._allLayerInfos.push(layerInfoSelf); // _allLayerInfos read from map
              this.initConfigLayerInfos();

              if (this.isExistTabPage(layerInfoSelf.id)) {
                var tabId = layerInfoSelf.id;
                this._startQueryOnTab(tabId);

                this.onMapResize();
                this.resetButtonStatus();
              }
            }
          }
        }));
      },

      indicatePoint: function(point) {
        if (!this.isIndicate) {
          return;
        }
        var count = this.getSelectedRows();
        if (count && count.length > 1) {
          return;
        }
        var screenPoint = this.map.toScreen(point);
        domStyle.set(this.indicateHorDiv, "display", "");
        domStyle.set(this.indicateVelDiv, "display", "");
        domStyle.set(this.indicateHorDiv, "top", (screenPoint.y - 1) + "px");
        domStyle.set(this.indicateVelDiv, "left", (screenPoint.x - 1) + "px");
        fx.fadeOut({
          node: this.indicateHorDiv,
          beforeBegin: lang.hitch(this, function() {
            domStyle.set(this.indicateHorDiv, "opacity", 1.0);
          }),
          onEnd: lang.hitch(this, function() {
            domStyle.set(this.indicateHorDiv, "opacity", 0);
            domStyle.set(this.indicateHorDiv, "display", "none");
          })
        }).play();
        fx.fadeOut({
          node: this.indicateVelDiv,
          beforeBegin: lang.hitch(this, function() {
            domStyle.set(this.indicateVelDiv, "opacity", 1.0);
          }),
          onEnd: lang.hitch(this, function() {
            domStyle.set(this.indicateVelDiv, "opacity", 0);
            domStyle.set(this.indicateVelDiv, "display", "none");
          })
        }).play();
      },

      destroy: function() {
        var len, i;
        len = this.tabPages.length;
        for (i = 0; i < len; i++) {
          this.tabPages[i].destroy();
        }
        this.tabPages = null;
        if (this.tabContainer) {
          this.tabContainer.destroy();
        }

        this.layers = null;
        this.grids = null;
        this.selectedRowsLabelDivs = null;
        this._allLayerInfos = null;
        this.configLayerInfos = null;
        this.layersIndex = -1;
        this.tableDiv = null;
        this.zoomButton = null;
        this.exportButton = null;
        if (this.moveMaskDiv) {
          domConstruct.destroy(this.moveMaskDiv);
          this.moveMaskDiv = null;
        }
        if (this.selectionMenu) {
          this.selectionMenu.destroy();
        }
        this.selectionMenu = null;
        this.refreshButton = null;
        if (this.AttributeTableDiv) {
          domConstruct.empty(this.AttributeTableDiv);
          this.AttributeTableDiv = null;
        }

        len = this.graphicsLayers.length;
        for (i = 0; i < len; i++) {
          if (this.graphicsLayers[i]) {
            this.map.removeLayer(this.graphicsLayers[i]);
          }
        }
        this.inherited(arguments);
      },

      onOpen: function() {
        if (!this.config.layerInfos.length) {
          this.onClose();
        } else {
          domStyle.set(this.domNode, "display", "");
          this.showing = true;
          this.onMapResize();
        }
      },

      onClose: function() {
        //domStyle.set(this.domNode, "display", "none");
        //this.showing = false;

        // if (popup) {
        //   this.popupMessage(this.nls.closeMessage);
        // }
      },

      _changeHeight: function(h) {
        domStyle.set(this.domNode, "height", h + "px");
        if (this.tabContainer && this.tabContainer.domNode && (h - this.toolbarHeight >= 0)) {
          domStyle.set(this.tabContainer.domNode, "height", (h - this.toolbarHeight) + "px");
        }

        var len = this.grids.length;
        for (var i = 0; i < len; i++) {
          if (this.grids[i] && (h - this.noGridHeight >= 0)) {
            domStyle.set(this.grids[i].domNode, "height", (h - this.noGridHeight) + "px");
          }
        }
        this.refreshGridHeight();
        if (this.positionRelativeTo === 'browser') {
          topic.publish('changeMapPosition', {
            bottom: h + this.bottomPosition
          });
        }

        this.currentHeight = h;
        if (h !== 0) {
          this.openHeight = h;
        }
      },

      onMapResize: function() {
        if (this.layersIndex > -1) {
          var width = domStyle.get(this.domNode, "width");
          var tab = domQuery(".dijitTabPaneWrapper");
          if (tab && tab[0]) {
            tab[0].style.width = (width - 5) + "px";
          }
          var dom = domQuery(".dgrid-content");
          var len = this.tabPages.length;
          for (var i = 0; i < len; i++) {
            domStyle.set(this.tabPages[i].domNode, "width", (width - 18) + "px");
            if (this.grids[i]) {
              domStyle.set(this.grids[i].domNode, "width", (width - 18) + "px");
            }
            if (dom && dom[i]) {
              dom[i].style.width = (width - 33) + "px";
            }
          }
          if (this.grids[this.layersIndex]) {
            this.grids[this.layersIndex].resize();
          }
        }
      },

      onPositionChange: function(position) {
        this.position = position;
        this.setInitialPosition();
        this._changeHeight(0);
        var height = domStyle.get(this.domNode, "height");
        if (this.layersIndex > -1) {
          var len = this.grids.length;
          for (var i = 0; i < len; i++) {
            domStyle.set(this.grids[i].domNode, "height", (height - this.noGridHeight) + "px");
          }
        }
        this.refreshGridHeight();
        this.showRefreshing(false);
      },

      onRemoveLayer: function(params) {
        var len = this.layers.length;
        for (var i = 0; i < len; i++) {
          if (this.getLayerInfoId(this.configLayerInfos[i]) === this.getLayerInfoId(params.layer)) {
            this.tabPageClose(this.tabPages[i].id, true);
            break;
          }
        }
      },

      initConfigLayerInfos: function() {
        var len = this.config.layerInfos.length;
        this.configLayerInfos = [];
        if (len > 0) {
          for (var i = 0; i < len; i++) {
            var layerInfo = this._getLayerInfoById(this.config.layerInfos[i].id);
            this.configLayerInfos[i] = layerInfo;
          }
        }
      },

      initSelectedLayer: function(layerObject) {
        if (!this.layers[this.layersIndex]) {
          this.layers[this.layersIndex] = layerObject;
          this.graphicsLayers[this.layersIndex] = new GraphicsLayer();
          this.map.addLayer(this.graphicsLayers[this.layersIndex]);
          this.own(on(
            layerObject,
            "click",
            lang.hitch(this, this.onGraphicClick, this.layersIndex)
          ));
        }
      },

      _getLayerInfoByName: function(name) {
        for (var i = 0; i < this._allLayerInfos.length; i++) {
          if (this._allLayerInfos[i].name === name) {
            return this._allLayerInfos[i];
          }
        }
      },

      _getLayerInfoById: function(layerId) {
        for (var i = 0, len = this._allLayerInfos.length; i < len; i++) {
          if (this._allLayerInfos[i].id === layerId) {
            return this._allLayerInfos[i];
          }
        }
      },

      onGraphicClick: function(index, event) {
        if (!this.showing || index !== this.layersIndex) {
          return;
        }
        var id = event.graphic.attributes[this.layers[this.layersIndex].objectIdField] + "";
        this.highlightRow(id);
        this.selectFeatures("mapclick", [event.graphic]);
      },

      highlightRow: function(id) {
        if (!this.showing) {
          return;
        }
        var store = this.grids[this.layersIndex].store;
        var row = -1;
        for (var i in store.index) {
          if (i === id) {
            row = store.index[i];
            break;
          }
        }
        if (row > -1) {
          var rowsPerPage = this.grids[this.layersIndex].get("rowsPerPage");
          var pages = parseInt(row / rowsPerPage, 10);
          pages++;

          this.grids[this.layersIndex].gotoPage(pages);
          this.grids[this.layersIndex].clearSelection();
          this.grids[this.layersIndex].select(id);
          // if (this.grids[this.layersIndex].row(id)) {
          //   this.grids[this.layersIndex].row(id).element.scrollIntoView();
          // }
          this.resetButtonStatus();
        }
      },

      _clipValidFields: function(sFields, rFields) {
        if (!(sFields && sFields.length)) {
          return rFields || [];
        }
        if (!(rFields && rFields.length)) {
          return sFields;
        }
        var validFields = [];
        for (var i = 0, len = sFields.length; i < len; i++) {
          var sf = sFields[i];
          for (var j = 0, len2 = rFields.length; j < len2; j++) {
            var rf = rFields[j];
            if (rf.name === sf.name) {
              validFields.push(sf);
              break;
            }
          }
        }
        return validFields;
      },

      _startQueryOnTab: function(tabId) {
        var i = 0;
        var len = this.config.layerInfos.length;
        for (i = 0; i < len; i++) {
          if (this.configLayerInfos[i] && this.getLayerInfoId(this.configLayerInfos[i]) === tabId) {
            this.layersIndex = i;
            break;
          }
        }

        if (this.layersIndex > -1 && this.configLayerInfos[this.layersIndex]) {
          this.configLayerInfos[this.layersIndex].getLayerObject()
            .then(lang.hitch(this, function(layerObject) {
              this.configLayerInfos[this.layersIndex].getSupportTableInfo()
                .then(lang.hitch(this, function(tableInfo) {
                  if (tableInfo.isSupportQuery) {
                    this.initSelectedLayer(layerObject);
                    this.checkMapInteractiveFeature();
                    var configFields = this.config.layerInfos[this.layersIndex].layer.fields;
                    var layerFields = this.layers[this.layersIndex].fields;
                    // remove fields not exist in layerObject.fields
                    this.config.layerInfos[this.layersIndex].layer.fields = this._clipValidFields(
                      configFields,
                      layerFields
                    );

                    if (!this.config.layerInfos[this.layersIndex].opened) {
                      if (this.matchingMap) {
                        this.startQuery(this.layersIndex, this.map.extent);
                      } else {
                        this.config.layerInfos[this.layersIndex].opened = true;
                        this.startQuery(this.layersIndex);
                      }
                    } else if (this.matchingMap) {
                      this.startQuery(this.layersIndex, this.map.extent);
                    }
                  } else {
                    var tip = html.toDom('<div>' + this.nls.unsupportQueryWarning + '</div>');
                    html.empty(this.tabPages[this.layersIndex].content);
                    domConstruct.place(tip, this.tabPages[this.layersIndex].content);
                  }
                }), lang.hitch(this, function(err) {
                  new Message({
                    message: err.message || err
                  });
                }));
            }), lang.hitch(this, function(err) {
              new Message({
                message: err.message || err
              });
            }));
        }
      },

      tabChanged: function() {
        if (this.tabContainer && this.tabContainer.selectedChildWidget) {
          // this.loading.placeAt(this.tabContainer.selectedChildWidget);
          var tabId = this.tabContainer.selectedChildWidget.params.id;
          // console.log(tabId);
          this._startQueryOnTab(tabId);

          this.onMapResize();
        }
        this.resetButtonStatus();
      },

      checkMapInteractiveFeature: function() {
        var currentLayerInfo = this.configLayerInfos[this.layersIndex];
        if (!currentLayerInfo) {
          return;
        }

        if (currentLayerInfo.isShowInMap()) {
          html.setStyle(this.zoomButton.domNode, 'display', 'inline-block');
        } else {
          html.setStyle(this.zoomButton.domNode, 'display', 'none');
        }
        for (var i = 0, len = this.configLayerInfos.length; i < len; i++) {
          if (this.graphicsLayers[i] && this.configLayerInfos[i].isShowInMap()) {
            this.graphicsLayers[i].show();
          } else if (this.graphicsLayers[i]) {
            this.graphicsLayers[i].hide();
          }
        }
      },

      resetButtonStatus: function() {
        var selectionRows = this.getSelectedRows();
        if (selectionRows && selectionRows.length) {
          this.zoomButton.set('disabled', false);
          if (this.exportButton) {
            this.exportButton.set('disabled', false);
          }
        } else {
          this.zoomButton.set('disabled', true);
          if (this.exportButton) {
            this.exportButton.set('disabled', true);
          }
        }

        if (this.config.layerInfos && this.config.layerInfos.length === 0) {
          this.selectionMenu.set('disabled', true);
          this.refreshButton.set('disabled', true);
          this.matchingCheckBox.set('disabled', true);
        } else {
          this.selectionMenu.set('disabled', false);
          this.refreshButton.set('disabled', false);
          this.matchingCheckBox.set('disabled', false);
        }

        this.setSelectedNumber();
      },

      createTable: function(columns, data, index) {
        var memStore = new Memory({
          data: data,
          idProperty: this.layers[index].objectIdField
        });

        if (this.grids[index]) {
          this.grids[index].set("store", memStore);
          this.grids[index].refresh();
        } else {
          this.config.layerInfos[index].loaded = true;
          var json = {};
          if (this.config.table && this.config.table.pageSizeOptions) {
            json.pageSizeOptions = this.config.table.pageSizeOptions;
            json.rowsPerPage = json.pageSizeOptions[0];
          }
          json.bufferRows = Infinity;
          json.columns = columns;
          json.store = memStore;
          json.pagingTextBox = true;
          json.firstLastArrows = true;
          var grid = new(declare(
            [OnDemandGrid, Selection, Pagination, ColumnHider, ColumnResizer, DnD]
          ))(json, domConstruct.create("div"));
          domConstruct.place(grid.domNode, this.tabPages[index].content);
          grid.startup();

          this.grids[index] = grid;
          this.own(on(grid, "click", lang.hitch(this, this.onRowClick)));
          // this.own(on(grid, "dblclick", lang.hitch(this, this.onZoomButton)));
          this.own(on(grid, "dblclick", lang.hitch(this, function() {
            if (this.configLayerInfos[this.layersIndex].isShowInMap()) {
              this.onZoomButton();
            }
          })));
          var countLabel = query('.dgrid-footer .dgrid-status', this.grids[index].domNode)[0];
          this.selectedRowsLabelDivs[index] = html.create('div', {
            'class': 'dgrid-status'
          }, countLabel, 'after');

          var height = domStyle.get(this.domNode, "height");
          domStyle.set(this.grids[index].domNode, "height", (height - this.noGridHeight) + "px");
          this.refreshGridHeight();
          if (this.grids.length === 1) {
            this.onMapResize();
          }
        }
        this.showRefreshing(false);
      },

      showRefreshing: function(refresh) {
        if (!this.loading) {
          return;
        }

        if (refresh) {
          if (this.layersIndex > -1) {
            this.loading.placeAt(this.tabPages[this.layersIndex].domNode.parentNode.parentNode);
            this.loading.show();
          }
        } else {
          this.loading.hide();
        }
      },

      _doQuery: function(index, normalizedExtent) {
        var selectionRows = this.getSelectedRows();
        var pk = this.layers[index].objectIdField; // primary key always be display
        var hasLayerUrl = this.layers[index].url && this.config.layerInfos[index].layer.url;
        var isCSVLayer = this.layers[index].declaredClass === "esri.layers.CSVLayer";

        // Does not support queries that need to be performed on the server
        if (hasLayerUrl && !isCSVLayer) {
          this._queryToServer(index, normalizedExtent, pk, selectionRows);
        } else if (!hasLayerUrl || isCSVLayer) {
          this._queryOnClient(index, normalizedExtent, pk, selectionRows);
        }
      },

      _queryToServer: function(index, normalizedExtent, pk, selectionRows) {
        var qt = new QueryTask(this.config.layerInfos[index].layer.url);
        var query = new Query();
        query.where = this.layers[index].getDefinitionExpression() || "1 = 1";
        var fields = this.config.layerInfos[index].layer.fields;
        var oFields = [],
          oNames = [];
        if (fields) {
          array.forEach(fields, lang.hitch(this, function(field) {
            if (field.show === undefined) { // first open
              field.show = true;
            }
            if (field.name === pk) {
              field._pk = true;
            }
            if (field.show || field._pk) {
              oFields.push(field);
              oNames.push(field.name);
            }
          }));
          query.outFields = oNames;
        } else {
          query.outFields = ["*"];
        }
        if (normalizedExtent) {
          query.geometry = normalizedExtent;
          query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
          this.config.layerInfos[index].opened = false;
        }
        query.outSpatialReference = {
          wkid: this.map.spatialReference.wkid
        };
        this.config.layerInfos[index].extent = normalizedExtent;

        query.returnGeometry = false;
        qt.execute(
          query,
          lang.hitch(this, this.queryExecute, selectionRows, index, oFields),
          lang.hitch(this, this.errorQueryTask)
        );
      },

      _queryOnClient: function(index, normalizedExtent, pk, selectionRows) {
        var json = {};
        json.features = this.layers[index].graphics;
        var lFields = this.layers[index].fields;
        var liFields = this.config.layerInfos[index].layer.fields;

        if (liFields) {
          json.fields = array.filter(liFields, lang.hitch(this, function(field) {
            if (field.show === undefined) { // first open
              field.show = true;
            }
            if (field.name === pk) {
              field._pk = true;
            }
            for (var i = 0, len = lFields.length; i < len; i++) {
              if (lFields[i].name === field.name) {
                field.type = lFields[i].type;
              }
            }
            return field.show || field._pk;
          }));
        } else {
          json.fields = array.filter(lFields, lang.hitch(this, function(field) {
            if (field.show === undefined) { // first open
              field.show = true;
            }
            if (field.name === pk) {
              field._pk = true;
            }
            return field.show || field._pk;
          }));
        }

        json.selectionRows = selectionRows;
        if (normalizedExtent && esriConfig.defaults.geometryService) {
          var geometries = [];
          var len = json.features.length;
          for (var i = 0; i < len; i++) {
            geometries.push(json.features[i].geometry);
          }
          var params = new RelationParameters();
          params.geometries1 = geometries;
          params.geometries2 = [normalizedExtent];
          params.relation = RelationParameters.SPATIAL_REL_INTERSECTION;

          esriConfig.defaults.geometryService.relation(
            params,
            lang.hitch(this, function(json, pairs) {
              var n = pairs.length;
              var gs = [];
              for (var m = 0; m < n; m++) {
                gs.push(json.features[pairs[m].geometry1Index]);
              }
              json.features = gs;
              this.queryExecute(selectionRows, index, json.fields, json);
            }, json), lang.hitch(this, this.errorGeometryServices));
        } else {
          this.queryExecute(selectionRows, index, json.fields, json);
        }
      },

      startQuery: function(index, extent) {
        if (!this.config.layerInfos || this.config.layerInfos.length === 0) {
          return;
        }

        this.showRefreshing(true);
        if (extent && extent.spatialReference && extent.spatialReference.isWebMercator()) {
          normalizeUtils.normalizeCentralMeridian(
            [extent], null, lang.hitch(this, function(normalizedGeo) {
              var _extent = normalizedGeo[0];
              this._doQuery(index, _extent);
            }), lang.hitch(this, function(err) {
              this.popupMessage(err.message || err);
            }));
        } else {
          this._doQuery(index, extent);
        }
      },

      errorGeometryServices: function(params) {
        this.popupMessage(params.message);
      },

      errorQueryTask: function(params) {
        this.popupMessage(params.message);
      },

      onExtentChange: function(params) {
        if (this.matchingMap) {
          this.startQuery(this.layersIndex, params.extent);
        }
      },

      _processExecuteFields: function(rFields, oFields) {
        if (rFields && rFields.length > 0) {
          var outFields = [];
          if (!oFields.length) {
            return rFields;
          }
          for (var i = 0, len = oFields.length; i < len; i++) {
            for (var j = 0; j < rFields.length; j++) {
              if (oFields[i].name === rFields[j].name) {
                rFields[j] = lang.mixin(rFields[j], oFields[i]);
                outFields.push(rFields[j]);
              }
            }
          }
          return outFields;
        } else {
          return oFields;
        }

        return rFields;
      },

      queryExecute: function(selectionRows, index, oFields, results) {
        var data = [],
          columns = {};
        if (!this.domNode) {
          return;
        }
        this.showRefreshing(true);
        results.fields = this._processExecuteFields(results.fields, oFields);
        array.map(results.features, lang.hitch(this, function(fields, feature) {
          var value = '';
          for (var attr in feature.attributes) {
            value = feature.attributes[attr];
            if (attr === this.layers[index].typeIdField && this.layers[index].types) {
              value = this.getTypeName(value, this.layers[index].types);
              feature.attributes[attr] = value;
            }
          }
          data.push(feature.attributes);
        }, results.fields));

        if (!this.config.layerInfos[index].loaded && results.fields) {
          var len = results.fields.length;
          // AttributeTable does not work
          //when column name contains special character such as "." and "()"
          for (var i = 0; i < len; i++) {
            var techFieldName = "field" + i;
            columns[techFieldName] = {
              label: results.fields[i].alias || results.fields[i].name,
              className: techFieldName,
              hidden: !results.fields[i].show && results.fields[i].show !== undefined,
              unhidable: !results.fields[i].show &&
                results.fields[i].show !== undefined && results.fields[i]._pk,
              field: results.fields[i].name
            };

            if (results.fields[i].type === "esriFieldTypeString") {
              columns[techFieldName].formatter = lang.hitch(this, this.urlFormatter);
            } else if (results.fields[i].type === "esriFieldTypeDate") {
              columns[techFieldName].formatter = lang.hitch(this, this.dateFormatter);
            } else if (results.fields[i].type === "esriFieldTypeDouble" ||
              results.fields[i].type === "esriFieldTypeSingle" ||
              results.fields[i].type === "esriFieldTypeInteger" ||
              results.fields[i].type === "esriFieldTypeSmallInteger") {
              columns[techFieldName].formatter = lang.hitch(this, this.numberFormatter);
            }
          }
        }
        this.createTable(columns, data, index);
        if (selectionRows && selectionRows.length) {
          for (var id in selectionRows) {
            this.grids[index].select(selectionRows[id]);
          }
          this.resetButtonStatus();
        }
      },

      urlFormatter: function(str) {
        if (str) {
          var s = str.indexOf('http:');
          if (s === -1) {
            s = str.indexOf('https:');
          }
          if (s > -1) {
            if (str.indexOf('href=') === -1) {
              var e = str.indexOf(' ', s);
              if (e === -1) {
                e = str.length;
              }
              var link = str.substring(s, e);
              str = str.substring(0, s) +
                '<A href="' + link + '" target="_blank">' + link + '</A>' +
                str.substring(e, str.length);
            }
          }
        }
        return str || "";
      },

      dateFormatter: function(str) {
        if (str) {
          var sDateate = new Date(str);
          str = utils.localizeDate(sDateate, {
            fullYear: true
          });
        }
        return str || "";
      },

      numberFormatter: function(num) {
        if (typeof num === 'number') {
          var decimalStr = num.toString().split('.')[1] || "",
            decimalLen = decimalStr.length;
          num = utils.localizeNumber(num, {
            places: decimalLen
          });
        }
        return '<span class="jimu-numeric-value">' + (num || "") + '</span>';
      },

      getTypeName: function(value, types) {
        var len = types.length;
        for (var i = 0; i < len; i++) {
          if (value === types[i].id) {
            return types[i].name;
          }
        }
        return "";
      },

      getFieldType: function(name, fields) {
        if (fields && fields.length > 0) {
          var len = fields.length;
          for (var i = 0; i < len; i++) {
            if (name === fields[i].name) {
              return fields[i].type;
            }
          }
        }

        return "";
      },

      onRowClick: function(zoomIds) {
        var ids = [];
        var selection = this.grids[this.layersIndex].selection;
        for (var id in selection) {
          if (selection[id]) {
            ids.push(id);
          }
        }

        if (ids.length) {
          this.zoomButton.set('disabled', false);
          if (this.exportButton) {
            this.exportButton.set('disabled', false);
          }
          if (this.layers[this.layersIndex].url) {
            this._queryFeaturesByIds(ids, 'rowclick');
          } else {
            if (zoomIds && !zoomIds.type && zoomIds.length) {
              this.selectFeatures(
                "zoom",
                this.getGraphicsFromLocalFeatureLayer(this.layersIndex, ids)
              );
            } else {
              this.selectFeatures(
                "rowclick",
                this.getGraphicsFromLocalFeatureLayer(this.layersIndex, ids)
              );
            }
          }
        } else {
          this.zoomButton.set('disabled', true);
          if (this.exportButton) {
            this.exportButton.set('disabled', false);
          }
          this.graphicsLayers[this.layersIndex].clear();
        }
      },

      errorSelectFeatures: function(params) {
        this.popupMessage(params.message);
      },

      getGraphicsFromLocalFeatureLayer: function(index, ids) {
        var gs = [],
          id;
        var len = ids.length;
        var n = this.layers[index].graphics.length;
        var objectid = this.layers[index].objectIdField;
        for (var i = 0; i < len; i++) {
          for (var m = 0; m < n; m++) {
            id = this.layers[index].graphics[m].attributes[objectid] + "";
            if (id === ids[i]) {
              gs.push(this.layers[index].graphics[m]);
              break;
            }
          }
        }
        return gs;
      },

      getExtent: function(result) {
        var def = new Deferred();

        var extent, points;
        var len = result.length;
        if (len === 1 && result[0].geometry && result[0].geometry.type === "point") {
          extent = result[0].geometry;
        } else if (len === 1 && !result[0].geometry) {
          def.reject(new Error('AttributeTable.getExtent:: extent was not projected.'));
          return def;
        } else {
          for (var i = 0; i < len; i++) {
            if (!result[i].geometry) {
              console.error('unable to get geometry of the reocord: ', result[i]);
              continue;
            }
            if (result[i].geometry.type === "point") {
              if (!points) {
                points = new Multipoint(result[i].geometry.spatialReference);
                points.addPoint(result[i].geometry);
              } else {
                points.addPoint(result[i].geometry);
              }
              if (i === (len - 1)) {
                extent = points.getExtent();
              }
            } else {
              if (!extent) {
                extent = result[i].geometry.getExtent();
              } else {
                extent = extent.union(result[i].geometry.getExtent());
              }
            }
          }
        }

        if (!extent || !extent.spatialReference) {
          def.reject(new Error("AttributeTable.getExtent:: extent was not projected."));
          return def;
        }

        // convert to map sr
        var sr = this.map.spatialReference;
        if (extent.spatialReference.wkid === sr.wkid) {
          def.resolve(extent);
        } else {
          var parameter = new ProjectParameters();
          parameter.geometries = [extent];
          parameter.outSR = sr;

          esriConfig.defaults.geometryService.project(
            parameter,
            lang.hitch(this, function(geometries) {
              if (geometries && geometries.length) {
                def.resolve(geometries[0]);
              } else {
                def.reject(new Error("AttributeTable.getExtent:: extent was not projected."));
              }
            }), lang.hitch(this, function(err) {
              // projection error
              if (!err) {
                err = new Error("AttributeTable.getExtent:: extent was not projected.");
              }
              def.reject(err);
            }));
        }
        return def;
      },

      addGraphics: function(result, disableIndicate) {
        var symbol, graphic;
        var len = result.length;
        this.graphicsLayers[this.layersIndex].clear();
        var outlineSymbol = new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID,
          new Color([0, 255, 255]),
          2
        );

        for (var i = 0; i < len; i++) {
          var geometry = null;
          if (!result[i].geometry) {
            console.error('unable to get geometry of the reocord: ', result[i]);
            continue;
          } else if (result[i].geometry.spatialReference.wkid !== this.map.spatialReference.wkid) {
            console.warn('unable to draw graphic result in different wkid from map');
          }
          if (result[i].geometry.type === "point") {
            geometry = new Point(result[i].geometry.toJson());
            symbol = lang.clone(this.map.infoWindow.markerSymbol);

            if (!disableIndicate) {
              this.indicatePoint(geometry);
            }
          } else if (result[i].geometry.type === "multipoint") {
            geometry = new Multipoint(result[i].geometry.toJson());
            symbol = lang.clone(this.map.infoWindow.markerSymbol);

            if (!disableIndicate) {
              this.indicatePoint(geometry.getExtent().getCenter());
            }
          } else if (result[i].geometry.type === "polyline") {
            geometry = new Polyline(result[i].geometry.toJson());
            symbol = outlineSymbol;

            if (!disableIndicate) {
              this.indicatePoint(geometry.getExtent().getCenter());
            }
          } else if (result[i].geometry.type === "polygon") {
            geometry = new Polygon(result[i].geometry.toJson());
            symbol = new SimpleFillSymbol(
              SimpleFillSymbol.STYLE_SOLID,
              outlineSymbol,
              new Color([255, 255, 255, 0.25])
            );

            if (!disableIndicate) {
              this.indicatePoint(geometry.getExtent().getCenter());
            }
          }
          graphic = new Graphic(geometry, symbol, result[i].attributes, result[i].infoTemplate);
          this.graphicsLayers[this.layersIndex].add(graphic);
        }
      },

      setSelectedNumber: function() {
        if (this.selectedRowsLabelDivs && this.selectedRowsLabelDivs[this.layersIndex] &&
          this.layersIndex < this.grids.length && this.grids[this.layersIndex]) {
          var selection = this.grids[this.layersIndex].selection;
          var ids = [];
          if (selection) {
            for (var id in selection) {
              if (selection[id]) {
                ids.push(id);
              }
            }
          }
          this.selectedRowsLabelDivs[this.layersIndex].innerHTML = "&nbsp;&nbsp;" +
            ids.length + " " + this.nls.selected + "&nbsp;&nbsp;";
        }
      },

      _queryFeaturesByIds: function(ids, mode) {
        var query = new Query();
        query.objectIds = ids;
        query.outSpatialReference = this.map.spatialReference;
        this.layers[this.layersIndex].selectFeatures(
          query,
          FeatureLayer.SELECTION_NEW,
          lang.hitch(this, this.selectFeatures, mode),
          lang.hitch(this, this.errorSelectFeatures)
        );
      },

      selectFeatures: function(method, result) {
        if (result && result.length > 0) {
          if (method === "mapclick") {
            this.addGraphics(result, true);
            if (this.config.layerInfos[this.layersIndex].isDynamicLayer) {
              var id = result[0].attributes[this.grids[this.layersIndex].store.idProperty] + "";
              this.highlightRow(id);
            }
          } else if (method === "rowclick" || method === "selectall") {
            this.addGraphics(result, true);
          } else if (method === "zoom") {
            this.getExtent(result).then(lang.hitch(this, function(gExtent) {
              if (gExtent) {
                if (gExtent.type === "point") {
                  this.map.centerAndZoom(gExtent, 15);
                } else {
                  this.map.setExtent(gExtent.expand(1.1));
                }
              }
            }), lang.hitch(this, function(err) {
              console.error(err);
            }));
          }
          this.setSelectedNumber();
        } else {
          var popup = new Message({
            message: this.nls.dataNotAvailable,
            buttons: [{
              label: this.nls.ok,
              onClick: lang.hitch(this, function() {
                popup.close();
              })
            }]
          });
        }
      },

      onMouseEvent: function(event) {
        var type = event.type;

        switch (type) {
          case "mousedown":
            this.moveMode = true;
            this.moveY = event.clientY;
            this.previousDomHeight = domStyle.get(this.domNode, "height");
            this.previousArrowTop = domStyle.get(this.arrowDiv, "top");
            if (this.grids.length) {
              this.previousGridHeight = domStyle.get(this.grids[0].domNode, "height");
            }
            domStyle.set(this.arrowDiv, "background-color", "gray");
            domStyle.set(this.moveMaskDiv, "display", "");
            break;
          case "mouseup":
            this.moveMode = false;
            // this.onPan(false);
            domStyle.set(this.arrowDiv, "background-color", "");
            domStyle.set(this.moveMaskDiv, "display", "none");
            break;
          case "mousemove":
            if (this.moveMode) {
              var y = this.moveY - event.clientY;
              this._changeHeight(y + this.previousDomHeight);
            }
            break;
        }
      },

      refreshGridHeight: function() {
        var tab = domQuery(".dijitTabPaneWrapper");
        if (tab && tab.length) {
          domStyle.set(tab[0], "height", "100%"); //larger than grid 40px
        }
      },

      setInitialPosition: function() {
        var h, b;
        if (this.position.height) {
          h = this.position.height;
        } else {
          h = document.body.clientHeight;
          h = h / 3;
        }
        if (this.position.bottom) {
          b = this.position.bottom;
        } else {
          b = 0;
        }
        this.bottomPosition = b;
        this.normalHeight = h;
        domStyle.set(this.domNode, "top", "auto");
        domStyle.set(this.domNode, "left", "0px");
        domStyle.set(this.domNode, "right", "0px");
        domStyle.set(this.domNode, "bottom", this.bottomPosition + "px");
        domStyle.set(this.domNode, "position", "absolute");
      },

      initDiv: function() {
        this.AttributeTableDiv = domConstruct.create("div", {}, this.domNode);
        domClass.add(this.AttributeTableDiv, "jimu-widget-attributetable-main");

        var toolbarDiv = domConstruct.create("div");
        this.toolbarDiv = toolbarDiv;
        var toolbar = new Toolbar({}, domConstruct.create("div"));

        var menus = new DropDownMenu();

        var selectPageButton = new MenuItem({
          label: this.nls.selectPage,
          iconClass: "esriAttributeTableSelectPageImage",
          onClick: lang.hitch(this, this.selectPage)
        });
        menus.addChild(selectPageButton);

        var selectAllButton = new MenuItem({
          label: this.nls.selectAll,
          iconClass: "esriAttributeTableSelectAllImage",
          onClick: lang.hitch(this, this.selectAll, true)
        });
        menus.addChild(selectAllButton);

        this.matchingCheckBox = new CheckedMenuItem({
          checked: false,
          // style: "margin-left:10px;margin-right:10px;",
          label: this.nls.filterByExtent,
          onChange: lang.hitch(this, function(status) {
            this.matchingMap = status;
            if (status) {
              this.startQuery(this.layersIndex, this.map.extent);
            } else {
              this.startQuery(this.layersIndex);
            }
          })
        });
        menus.addChild(this.matchingCheckBox);

        // var indicate = new CheckedMenuItem({
        //   checked: true,
        //   label: this.nls.indicate,
        //   onChange: lang.hitch(this, function(status) {
        //     this.isIndicate = status;
        //   })
        // });
        // menus.addChild(indicate);

        var columns = new MenuItem({
          label: this.nls.columns,
          iconClass: "esriAttributeTableColumnsImage",
          onClick: lang.hitch(this, this.toggleColumns)
        });
        menus.addChild(columns);

        if (!this.config.hideExportButton) {
          this.exportButton = new MenuItem({
            label: this.nls.exportFiles,
            showLabel: true,
            iconClass: "esriAttributeTableExportImage",
            onClick: lang.hitch(this, this.onExportButton)
          });
          menus.addChild(this.exportButton);
        }

        this.selectionMenu = new DropDownButton({
          label: this.nls.options,
          iconClass: "esriAttributeTableOptionsImage",
          dropDown: menus
        });
        toolbar.addChild(this.selectionMenu);

        this.zoomButton = new Button({
          label: this.nls.zoomto,
          iconClass: "esriAttributeTableZoomImage",
          onClick: lang.hitch(this, this.onZoomButton)
        });
        toolbar.addChild(this.zoomButton);

        var clearSelectionButton = new Button({
          label: this.nls.clearSelection,
          iconClass: "esriAttributeTableClearImage",
          onClick: lang.hitch(this, this.selectAll, false)
        });
        toolbar.addChild(clearSelectionButton);

        this.refreshButton = new Button({
          label: this.nls.refresh,
          showLabel: true,
          iconClass: "esriAttributeTableRefreshImage",
          onClick: lang.hitch(this, this.onRefreshButton)
        });
        toolbar.addChild(this.refreshButton);

        this.closeButton = new Button({
          title: this.nls.closeMessage,
          iconClass: "esriAttributeTableCloseImage",
          onClick: lang.hitch(this, this._closeTable)
        });
        html.addClass(this.closeButton.domNode, 'jimu-float-trailing');
        toolbar.addChild(this.closeButton);

        domConstruct.place(toolbar.domNode, toolbarDiv);

        var tabDiv = domConstruct.create("div");
        this.tableDiv = domConstruct.create("div");
        domConstruct.place(this.tableDiv, tabDiv);
        domConstruct.place(toolbarDiv, this.AttributeTableDiv);
        domConstruct.place(tabDiv, this.AttributeTableDiv);

        var height = domStyle.get(toolbarDiv, "height");
        this.toolbarHeight = height;
        this.noGridHeight = 40 + height; // tabTitle and padding top about 40px

        this.tabContainer = new TabContainer({
          style: "width: 100%;"
        }, tabDiv);
        html.setStyle(this.tabContainer.domNode, 'height', (this.normalHeight - height) + 'px');
        var len = this.config.layerInfos.length;
        for (var j = 0; j < len; j++) {
          if (this.config.layerInfos[j].show) {
            var json = lang.clone(this.config.layerInfos[j]);
            var div = domConstruct.create("div");

            json.id = json.id;
            json.title = json.name;
            json.content = div;
            json.style = "height: 100%; width: 100%; overflow: visible;";
            var cp = new ContentPane(json);
            this.tabPages[j] = cp;
            this.tabContainer.addChild(cp);
          }
        }
        this.tabContainer.startup();
        utils.setVerticalCenter(this.tabContainer.domNode);
        this.tabChanged();
        this.own(aspect.after(this.tabContainer, "selectChild", lang.hitch(this, this.tabChanged)));
      },

      getLayerInfoLabel: function(layerInfo) {
        var label = layerInfo.name || layerInfo.title;
        return label;
      },

      getLayerInfoId: function(layerInfo) {
        return layerInfo && layerInfo.id || "";
      },

      toggleColumns: function() {
        if (this.layersIndex > -1 && this.grids[this.layersIndex]) {
          this.grids[this.layersIndex]._toggleColumnHiderMenu();
        }
      },

      onRefreshButton: function() {
        if (this.layersIndex > -1) {
          if (this.grids[this.layersIndex]) {
            this.grids[this.layersIndex].clearSelection();
          }
          if (this.graphicsLayers[this.layersIndex]) {
            this.graphicsLayers[this.layersIndex].clear();
          }

          this.setSelectedNumber();
          if (this.config.layerInfos[this.layersIndex]) {
            this.config.layerInfos[this.layersIndex].loaded = false;
            this.startQuery(this.layersIndex, this.config.layerInfos[this.layersIndex].extent);
          }
        }
      },

      addNewTab: function(params) {
        var layerInfo = this._getLayerInfoById(params.layer.id) ||
          this._getLayerInfoByName(params.layer.name);
        var infoId = this.getLayerInfoId(layerInfo);
        var page = this.isExistTabPage(infoId);
        if (page) {
          this.onOpen();
          this.tabContainer.selectChild(page);
          this.tabChanged();
        } else {
          var info = attrUtils.getConfigInfoFromLayerInfo(layerInfo);
          this.config.layerInfos.push({
            name: info.name,
            layer: {
              url: info.layer.url,
              fields: info.layer.fields
            }
          });
          this.configLayerInfos.push(layerInfo);
          var g = new GraphicsLayer();
          this.graphicsLayers.push(g);
          this.map.addLayer(g);
          this.onOpen();

          var div = domConstruct.create("div");
          var json = {};
          json.name = this.getLayerInfoLabel(layerInfo);
          json.id = this.getLayerInfoId(layerInfo);
          json.content = div;
          json.closable = true;
          json.style = "height: 100%; width: 100%; overflow: visible";
          var cp = new ContentPane(json);
          this.tabPages.push(cp);
          cp.set("title", json.name);
          this.own(on(cp, "close", lang.hitch(this, this.tabPageClose, json.id)));
          this.tabContainer.addChild(cp);
          this.tabContainer.selectChild(cp);
        }
      },

      onReceiveData: function(name, source, params) {
        if (params && params.target === "AttributeTable") {

          if (this.currentHeight === 0) {
            this._openTable().then(lang.hitch(this, this._addLayerToTable, params));
          } else {
            attrUtils.readConfigLayerInfosFromMap(this.map)
              .then(lang.hitch(this, function(layerInfos) {
                this._allLayerInfos = layerInfos;
                this._processDelayedLayerInfos();
                this._addLayerToTable(params);
              }));
          }
        }
      },

      _addLayerToTable: function(params) {
        var layer = null;
        params.layer.getLayerObject().then(lang.hitch(this, function(layerObject) {
          if (layerObject) {
            layerObject.id = params.layer.id;
            if (layerObject.loaded) {
              this.addNewTab({
                layer: layerObject
              });
            } else {
              this.own(on(layerObject, "load", lang.hitch(this, this.addNewTab)));
            }
          } else if (params.url) {
            layer = new FeatureLayer(params.url);
            this.own(on(layer, "load", lang.hitch(this, this.addNewTab)));
          }
        }), lang.hitch(this, function(err) {
          new Message({
            message: err.message || err
          });
        }));
      },

      isExistTabPage: function(id) {
        var len = this.tabPages.length;
        for (var i = 0; i < len; i++) {
          if (this.tabPages[i].get('id') === id) {
            return this.tabPages[i];
          }
        }
        return null;
      },

      tabPageClose: function(id, isRemoveChild) {
        var len = this.tabPages.length;
        for (var i = 0; i < len; i++) {
          if (this.tabPages[i].id === id) {
            this.loading.placeAt(this.domNode); // prevent loading be destroyed

            if (isRemoveChild === true) {
              this.tabContainer.removeChild(this.tabPages[i]);
            }
            if (this.grids && this.grids[i]) {
              this.grids[i].destroy();
              this.grids.splice(i, 1);
            }
            if (this.tabPages && this.tabPages[i]) {
              this.tabPages[i].destroyDescendants();
              this.tabPages.splice(i, 1);
            }
            if (this.config && this.config.layerInfos && this.config.layerInfos[i]) {
              this.config.layerInfos.splice(i, 1);
              this.configLayerInfos.splice(i, 1);
            }
            if (this.layers && this.layers[i]) {
              this.layers.splice(i, 1);
              this._allLayerInfos.splice(i, 1);
            }
            if (this.graphicsLayers && this.graphicsLayers[i]) {
              this.map.removeLayer(this.graphicsLayers[i]);
              this.graphicsLayers.splice(i, 1);
            }
            if (this.selectedRowsLabelDivs && this.selectedRowsLabelDivs[i]) {
              this.selectedRowsLabelDivs.splice(i, 1);
            }
            if (len === 1) {
              this.layersIndex = -1;
              this.onClose();
              return;
            } else {
              if (i < this.layersIndex) {
                this.layersIndex--;
              } else if (i === this.layersIndex) {
                if (len > 1) {
                  this.layersIndex = len - 2;
                  this.tabContainer.selectChild(this.tabPages[this.layersIndex]);
                  this.tabChanged();
                } else {
                  this.layersIndex = 0;
                }
              }
            }
            break;
          }
        }
        setTimeout(lang.hitch(this, function() {
          this.refreshGridHeight();
        }), 10);
      },

      selectAll: function(status) {
        if (!this.config.layerInfos || this.config.layerInfos.length === 0) {
          return;
        }
        if (status) {
          var ids = [];
          var indexes = this.grids[this.layersIndex].store.index;
          for (var id in indexes) {
            ids.push(id);
            this.grids[this.layersIndex].select(id);
          }
          if (ids.length) {
            if (this.layers[this.layersIndex].url) {
              this._queryFeaturesByIds(ids, 'selectall');
            } else {
              this.selectFeatures("selectall", this.layers[this.layersIndex].graphics);
            }
          }
        } else {
          this.grids[this.layersIndex].gotoPage(this.grids[this.layersIndex]._currentPage);
          this.grids[this.layersIndex].clearSelection();
          this.graphicsLayers[this.layersIndex].clear();
        }
        this.resetButtonStatus();
      },

      selectPage: function() {
        if (!this.config.layerInfos || this.config.layerInfos.length === 0) {
          return;
        }
        this.grids[this.layersIndex].clearSelection();
        this.graphicsLayers[this.layersIndex].clear();
        var currentPage = this.grids[this.layersIndex]._currentPage;
        var rowsPerPage = this.grids[this.layersIndex].rowsPerPage;
        var index = this.grids[this.layersIndex].store.index;
        var ids = [];
        for (var id in index) {
          var number = index[id];
          if (number >= (currentPage - 1) * rowsPerPage && number < rowsPerPage * currentPage) {
            ids.push(id);
            this.grids[this.layersIndex].select(id);
          }
        }
        if (this.layers[this.layersIndex].url) {
          this._queryFeaturesByIds(ids, 'selectall');
        } else {
          this.selectFeatures(
            "selectall",
            this.getGraphicsFromLocalFeatureLayer(this.layersIndex, ids)
          );
        }
        this.resetButtonStatus();
      },

      exportToCSV: function() {
        if (!this.config.layerInfos || this.config.layerInfos.length === 0) {
          return;
        }
        var textField = '"';
        var content = "";
        var len = 0,
          n = 0,
          comma = "",
          value = "",
          arrayCol = [];
        var columns = this.grids[this.layersIndex].columns;
        var data = this.getSelectedRowsData();
        for (var column in columns) {
          content = content + comma + columns[column].field;
          comma = ",";
          arrayCol.push(columns[column].field);
        }
        content = content + "\r\n";
        len = data.length;
        n = arrayCol.length;
        for (var i = 0; i < len; i++) {
          comma = "";
          for (var m = 0; m < n; m++) {
            value = data[i][arrayCol[m]];
            if (!value && typeof value !== "number") {
              value = "";
            }
            if (value && /[",]/g.test(value)) {
              value = textField + value.replace(/(")/g, '""') + textField;
            }
            content = content + comma + value;
            comma = ",";
          }
          content = content + "\r\n";
        }
        this.download(this.config.layerInfos[this.layersIndex].name + ".csv", content);
      },

      getSelectedRowsData: function() {
        if (!this.grids.length) {
          return null;
        }
        if (!this.grids[this.layersIndex]) {
          return null;
        }
        var data = this.grids[this.layersIndex].store.data;
        var idProperty = this.grids[this.layersIndex].store.idProperty;
        var len = data.length;
        var rows = [];
        var selection = this.grids[this.layersIndex].selection;
        for (var attr in selection) {
          for (var i = 0; i < len; i++) {
            if (attr === String(data[i][idProperty])) {
              rows.push(data[i]);
            }
          }
        }
        return rows;
      },

      getSelectedRows: function() {
        var rows = [];
        if (!this.grids.length) {
          return rows;
        }
        if (!this.grids[this.layersIndex]) {
          return rows;
        }
        var selection = this.grids[this.layersIndex].selection;
        for (var id in selection) {
          if (selection[id]) {
            rows.push(id);
          }
        }
        return rows;
      },

      _isIE11: function() {
        var iev = 0;
        var ieold = (/MSIE (\d+\.\d+);/.test(navigator.userAgent));
        var trident = !!navigator.userAgent.match(/Trident\/7.0/);
        var rv = navigator.userAgent.indexOf("rv:11.0");

        if (ieold) {
          iev = Number(RegExp.$1);
        }
        if (navigator.appVersion.indexOf("MSIE 10") !== -1) {
          iev = 10;
        }
        if (trident && rv !== -1) {
          iev = 11;
        }

        return iev === 11;
      },

      download: function(filename, text) {
        if (has("ie") || this._isIE11()) { // has module unable identify ie11
          var oWin = window.top.open("about:blank", "_blank");
          oWin.document.write(text);
          oWin.document.close();
          oWin.document.execCommand('SaveAs', true, filename);
          oWin.close();
        } else {
          var link = domConstruct.create("a", {
            href: 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(text),
            target: '_blank',
            download: filename
          }, this.domNode);
          if (has('safari')) {
            // # First create an event
            var click_ev = document.createEvent("MouseEvents");
            // # initialize the event
            click_ev.initEvent("click", true /* bubble */ , true /* cancelable */ );
            // # trigger the evevnt/
            link.dispatchEvent(click_ev);
          } else {
            link.click();
          }

          domConstruct.destroy(link);
        }
      },

      onExportButton: function() {
        if (!this.config.layerInfos || this.config.layerInfos.length === 0) {
          return;
        }
        var popup = new Message({
          message: this.nls.exportMessage,
          titleLabel: this.nls.exportFiles,
          autoHeight: true,
          buttons: [{
            label: this.nls.ok,
            onClick: lang.hitch(this, function() {
              this.exportToCSV();
              popup.close();
            })
          }, {
            label: this.nls.cancel,
            onClick: lang.hitch(this, function() {
              popup.close();
            })
          }]
        });
      },

      onZoomButton: function() {
        if (!this.config.layerInfos || this.config.layerInfos.length === 0) {
          return;
        }
        var ids = [];
        var selection = this.grids[this.layersIndex].selection;
        for (var id in selection) {
          if (selection[id]) {
            ids.push(id);
          }
        }
        if (ids.length === 0) {
          // var extent = this.layers[this.layersIndex].fullExtent;
          // if (extent) {
          //   this.map.setExtent(extent);
          // }
          return;
        } else {
          if (this.layers[this.layersIndex].url) {
            this._queryFeaturesByIds(ids, 'zoom');
          } else {
            this.onRowClick(ids);
          }
        }
      },

      popupMessage: function(message) {
        var popup = new Message({
          message: message,
          buttons: [{
            label: this.nls.ok,
            onClick: lang.hitch(this, function() {
              popup.close();
            })
          }]
        });

        this.showRefreshing(false);
      }
    });

    clazz.inPanel = false;
    clazz.hasUIFile = false;
    return clazz;
  });