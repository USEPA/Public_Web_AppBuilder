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
    'dijit/_WidgetsInTemplateMixin',
    "dojo/Deferred",
    'jimu/BaseWidget',
    'jimu/portalUtils',
    "jimu/dijit/Message",
    'jimu/PanelManager',
    "jimu/SpatialReference/wkidUtils",
    'jimu/portalUrlUtils',
    "esri/dijit/Basemap",
    "esri/dijit/BasemapLayer",
    'esri/dijit/BasemapGallery',
    'dojo/_base/lang',
    'dojo/_base/array',
    "dojo/_base/html",
    "dojo/query",
    'esri/request',
    'dojo/on',
    'dojo/promise/all',
    './utils',
    'dijit/form/HorizontalSlider',
    'dijit/form/HorizontalRuleLabels',
    './CheckBox',
    'dojo/dom-construct'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    Deferred,
    BaseWidget,
    portalUtils,
    Message,
    PanelManager,
    SRUtils,
    portalUrlUtils,
    Basemap,
    BasemapLayer,
    BasemapGallery,
    lang,
    array,
    html,
    query,
    esriRequest,
    on,
    all,
    utils,
    HorizontalSlider,
    HorizontalRuleLabels,
    CheckBox,
    domConstruct) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      name: 'eBasemapGallery',
      baseClass: 'jimu-widget-ebasemapgallery',
      basemapGallery: null,
      spatialRef: null,
      hybridBasemapArray: null,
      hyBasemap: null,
      defaultBasemapId: null,
      hybridBasemapArrayLbls: null,

      startup: function() {
        /*jshint unused: false*/
        this.inherited(arguments);
        this.initBasemaps();
        this.defaultBasemapId = this.map.getBasemap();
      },

      resize: function() {
        this._responsive();
      },

      _responsive: function() {
        // the default width of esriBasemapGalleryNode is 85px,
        // margin-left is 10px, margin-right is 10px;
        var paneNode = query('#' + this.id)[0];
        var width = html.getStyle(paneNode, 'width');
        var column      = parseInt(width / 105, 10);
        if (column > 0) {
          var margin      = width % 105;
          var addWidth    = parseInt(margin / column, 10);
          query('.esriBasemapGalleryNode', this.id).forEach(function(node) {
            html.setStyle(node, 'width', 85 + addWidth + 'px');
          });
        }
      },

      initBasemaps: function() {
        var basemapsDef;
        var portalSelfDef;
        var config = lang.clone(this.config.basemapGallery);

        //load form portal or config file.
        if (!config.basemaps || config.basemaps.length === 0) {
          basemapsDef = utils._loadPortalBaseMaps(this.appConfig.portalUrl,
                                                  this.map.spatialReference);
        } else {
          basemapsDef = new Deferred();
          basemapsDef.resolve(config.basemaps);
        }

        var portal = portalUtils.getPortal(this.appConfig.portalUrl);
        portalSelfDef = portal.loadSelfInfo();
        all({
          'portalSelf': portalSelfDef,
          'basemaps': basemapsDef
        }).then(lang.hitch(this, function(result) {
          var basemaps = result.basemaps;
          var basemapObjs = [];
          var i = 0;
          var webmapBasemap = this._getWebmapBasemap();

          basemaps = array.filter(basemaps, function(basemap) {
            var bingKeyResult;
            var spatialReferenceResult;
            // first, filter bingMaps
            if(result.portalSelf.bingKey) {
              // has bingKey, can add any bing map or not;
              bingKeyResult = true;
            } else if(!utils.isBingMap(basemap)) {
              // do not have bingKey and basemap is not bingMap.
              bingKeyResult = true;
            } else {
              // do not show basemap if do not has bingKey as well as basemap is bingMap.
              bingKeyResult = false;
            }

            // second, filter spatialReference.
            // only show basemaps who has same spatialReference with current map.
            if (SRUtils.isSameSR(this.map.spatialReference.wkid,
                                  basemap.spatialReference.wkid)) {
              spatialReferenceResult = true;
            } else {
              spatialReferenceResult = false;
            }

            // basemap does not have title means basemap load failed.
            return basemap.title && bingKeyResult && spatialReferenceResult;
          }, this);

          // if basemap of current webmap is not include, so add it.
          for(i = 0; i < basemaps.length; i++) {
            if (utils.compareSameBasemapByOrder(basemaps[i], webmapBasemap)) {
              break;
            }
          }
          if(i === basemaps.length) {
            basemaps.push(webmapBasemap);
          }
          
        
          for (i = 0; i < basemaps.length; i++) {
            var n = basemaps[i].layers.length;
            var layersArray = [];
            for (var j = 0; j < n; j++) {
              layersArray.push(new BasemapLayer(basemaps[i].layers[j]));
            }
            basemaps[i].layers = layersArray;
            if (!basemaps[i].thumbnailUrl) {
              basemaps[i].thumbnailUrl = this.folderUrl + "images/default.jpg";
            } else {
              if (basemaps[i].thumbnailUrl.indexOf('http') === 0) {
                basemaps[i].thumbnailUrl = basemaps[i].thumbnailUrl +
                                           utils.getToken(this.appConfig.portalUrl);
              }else if(basemaps[i].thumbnailUrl.startWith('/') ||
                basemaps[i].thumbnailUrl.startWith('data')){
                basemaps[i].thumbnailUrl = basemaps[i].thumbnailUrl;
              }else{
                //if path is relative, relative to widget's folder
                basemaps[i].thumbnailUrl = this.folderUrl + basemaps[i].thumbnailUrl;
              }
            }
            basemapObjs.push(new Basemap(basemaps[i]));
          }

          config.map = this.map;
          if (this.appConfig.portalUrl) {
            config.portalUrl = this.appConfig.portalUrl;
          }
          config.basemaps = basemapObjs;
          config.showArcGISBasemaps = false;
          config.bingMapsKey = result.portalSelf.bingKey;
          this.basemapGallery = new BasemapGallery(config, this.basemapGalleryDiv);
          this.basemapGallery.startup();
          this.own(on(this.basemapGallery,
                      "selection-change",
                      lang.hitch(this, this.selectionChange)));
          this._responsive();
          this._selectWebBasemap();
        }));
      },
      
      _selectWebBasemap: function(){
        var webmapBasemap = this._getWebmapBasemap();
        array.some(this.basemapGallery.basemaps, lang.hitch(this,function(lyr){
          if(webmapBasemap.title === lyr.title){
            var tNode = query('.esriBasemapGalleryNode > .esriBasemapGalleryLabelContainer span[ title = "' + lyr.title + '" ]', this.id).parent().parent()[0];
            html.addClass(tNode,'esriBasemapGallerySelectedNode');
            this.defaultBasemapId = lyr.id
          }
        }));
      },
      
      _onFaderChanged: function(evt){
        var currentValue = evt;
        var floorValue = Math.floor(evt);

        //loop through the hybrid basemap layers and adjust transparency
        array.map(this.hyBasemap.getLayers(), lang.hitch(this,function(lyr){
          if(lyr.hybrid === 0){
            lyr.opacity = (100 - floorValue) / 100;
          }else if(lyr.hybrid === 1){
            lyr.opacity = floorValue / 100;
          }
        }));
        this.basemapGallery.select("hybrid_basemap");
      },

      _getWebmapBasemap: function() {
        var thumbnailUrl;
        if (this.map.itemInfo.item.thumbnail) {
          thumbnailUrl = portalUrlUtils.getItemUrl(this.appConfig.portalUrl,
                         this.map.itemInfo.item.id) + "/info/" + this.map.itemInfo.item.thumbnail;
        } else {
          thumbnailUrl = null;
        }
        return {
          title: this.map.itemInfo.itemData.baseMap.title,
          thumbnailUrl: thumbnailUrl,
          layers: this.map.itemInfo.itemData.baseMap.baseMapLayers,
          spatialReference: this.map.spatialReference
        };
      },
      
      _onhybridCbxChanged: function(){
        if(this.hybridCbx.getValue()){
          query('.esriBasemapGalleryNode', this.id).forEach(lang.hitch(this,function(node) {
            var cb = new CheckBox();
            cb.startup();
            this.own(on(cb,
                    'change',
                    lang.hitch(this, this._basemapChecked, node)));
            domConstruct.place(cb.domNode, node, 'first');
          }));
          this.hybridBasemapArray=[];
        } else {
          query('.esriBasemapGalleryNode > .ebasemapgallery-checkbox', this.id).forEach(function(node) {
            domConstruct.destroy(node.id);
          });
          //html.setStyle(this.hybridCbx.labelNode,'visibility','visible');
          html.setStyle(this.faderDiv,'display','none');
          this._removeHybridBasemap();
        }
      },
      
      _basemapChecked: function(cnode, checked) {
        var gItem = cnode.id.split("_")[2];
        if(checked && this.hybridBasemapArray.indexOf(gItem) < 0){
          this.hybridBasemapArray.push(gItem);
        }else if(!checked && this.hybridBasemapArray.indexOf(gItem) > -1){
          this.hybridBasemapArray.splice(this.hybridBasemapArray.indexOf(gItem),1);
        }
        var numChecked = 0;
        query('.esriBasemapGalleryNode > .ebasemapgallery-checkbox > .checked', this.id).forEach(lang.hitch(this,function(node) {
          numChecked += 1;
        }));
        if (numChecked === 2){
          html.setStyle(this.faderDiv,'display','block');
          this._addHybridBasemap();
        } else {
          html.setStyle(this.faderDiv,'display','none');
        }
      },
      
      _addHybridBasemap: function (){
        this.hybridBasemapArrayLbls=[];
        var bmObj = {
          id: "hybrid_basemap",
          title: "Hybrid Mashup",
          thumbnailUrl: this.folderUrl + "/images/hybrid.jpg",
          layers: []
        };
        var bmLyrOrder = 0;
        array.map(this.hybridBasemapArray, lang.hitch(this,function(bLyrId){
          this.hybridBasemapArrayLbls[bmLyrOrder] = this.basemapGallery.basemaps[bLyrId].title.replace(/\s/g, '_');
          array.map(this.basemapGallery.basemaps[bLyrId].getLayers(), lang.hitch(this,function(lyr){
            lyr.visibility = true;
            lyr.opacity = 0.5;
            lyr.hybrid = bmLyrOrder;
            bmObj.layers.push(lyr);
          }));
          bmLyrOrder++;
        }));
        this.hybridBasemapArrayLbls.splice(1,0,"50/50");
        this.hyBasemap = new Basemap(bmObj);
        this.basemapGallery.add(this.hyBasemap);
        this.basemapGallery.select("hybrid_basemap");
        this.fader.set('value', 50);
        var cnt = 0;
        query('.dijitRuleLabel , .dijitRuleLabelH', this.id).forEach(lang.hitch(this,function(node) {
          node.innerHTML = this.hybridBasemapArrayLbls[cnt]
          cnt++
        }));
      },
      
      _removeHybridBasemap: function (){
        array.map(this.hyBasemap.getLayers(), lang.hitch(this,function(lyr){
          lyr.opacity = 1;
        }));
        this.basemapGallery.remove("hybrid_basemap");
        this.basemapGallery.select(this.defaultBasemapId);
      },

      selectionChange: function() {
        var basemap = this.basemapGallery.getSelected();
        if(basemap.id === "hybrid_basemap"){
          html.setStyle(this.faderDiv,'display','block');
          return;
        }else{
          html.setStyle(this.faderDiv,'display','none');
        }
        // var layers = basemap.getLayers();
        // if (layers.length > 0) {
        //   this.publishData(layers);
        // }
        if (this.isPreload) {
          PanelManager.getInstance().closePanel(this.id + '_panel');
        }
      }
    });

    return clazz;
  });