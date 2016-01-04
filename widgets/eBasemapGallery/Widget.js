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
    'dojo/dom-construct',
    'dojo/dom-geometry',
    'dojo/aspect'
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
    domConstruct,
    domGeom,
    aspect) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      name: 'eBasemapGallery',
      baseClass: 'jimu-widget-ebasemapgallery',
      basemapGallery: null,
      spatialRef: null,
      hybridBasemapArray: null,
      hyBasemap: null,
      defaultBasemapId: null,
      secondBasemapId: null,
      hybridBasemapId: null,
      selectedBMNode: null,
      selectedBMNode2: null,
      selectedBMNode3: null,
      hybridChangeEvent: false,
      hybridAdded: false,
      imgthumbposleft: 0,
      webmapBasemap: null,

      postCreate: function() {
        this.own(on(this.domNode, 'mousedown', lang.hitch(this, function (event) {
          event.stopPropagation();
          if (event.altKey) {
            var msgStr = this.nls.widgetverstr + ': ' + this.manifest.version;
            msgStr += '\n' + this.nls.wabversionmsg + ': ' + this.manifest.wabVersion;
            msgStr += '\n' + this.manifest.description;
            new Message({
              titleLabel: this.nls.widgetversion,
              message: msgStr
            });
          }
        })));
      },

      startup: function() {
        /*jshint unused: false*/
        this.inherited(arguments);
        this.initBasemaps();
        this.defaultBasemapId = this.map.getBasemap();
        this.own(
          aspect.before(this, 'destroy', this.beforeDestroy)
        );
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
        var imgthumbnode = query('.esriBasemapGalleryNode > a > .esriBasemapGalleryThumbnail', this.id)[0];
        this.imgthumbposleft = parseInt(domGeom.getMarginBox(imgthumbnode).l, 10) + 10;

        query('.bm-addbtn', this.id).forEach(lang.hitch(this,function(node) {
          html.setStyle(node, 'left', this.imgthumbposleft + 'px');
        }));
        var sWidth = (width - 261) / 2;
        html.setStyle(this.spacer1, 'width', sWidth + 'px');
        html.setStyle(this.spacer2, 'width', sWidth + 'px');
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
          this.own(on(this.basemapGallery, "selection-change", lang.hitch(this, this.selectionChange)));
          this.own(on(this.basemapGallery, "add, remove", lang.hitch(this, this._onAddorRemoveBasemap)));
          this._responsive();
          this._selectWebBasemap();
        }));
      },

      _onAddorRemoveBasemap: function() {
        this._responsive();

        query('.esriBasemapGalleryNode', this.id).forEach(lang.hitch(this,function(node) {
          this.addNode = domConstruct.create('div', {
            'class': 'bm-addbtn',
            'id': node.id +'_addBtn',
            'title': this.nls.add,
            'style': 'left:' + this.imgthumbposleft + 'px'
          }, node);

          this.own(
            on(node, 'mouseover', lang.hitch(this, this._showAddBtn))
          );

          this.own(
            on(node, 'mouseout', lang.hitch(this, this._hideAddBtn))
          );

          this.own(
            on(this.addNode, 'click', lang.hitch(this, this._addBtnClick))
          );
        }));
      },

      _selectWebBasemap: function(){
        this.webmapBasemap = this._getWebmapBasemap();
        var sNode = query(".esriBasemapGalleryLabelContainer span", this.selectedBasemapGalleryNode)[0];
        var sNode2 = query(".esriBasemapGalleryThumbnail", this.selectedBasemapGalleryNode)[0];
        array.some(this.basemapGallery.basemaps, lang.hitch(this,function(lyr){
          if(this.webmapBasemap.title === lyr.title){
            var tNode = query('.esriBasemapGalleryNode > .esriBasemapGalleryLabelContainer span[ title = "' + lyr.title + '" ]', this.id).parent().parent()[0];
            this.selectedBMNode = tNode;
            html.setStyle(tNode,'display','none');
            var tNode2 = query('.esriBasemapGalleryThumbnail', tNode)[0];
            html.addClass(tNode,'.esriBasemapGallerySelectedNode');
            this.defaultBasemapId = lyr.id;
            sNode.innerHTML = sNode.title = sNode.alt = lyr.title;
            sNode2.title = sNode2.alt = tNode2.alt;
            sNode2.src = tNode2.src;
          }
        }));

        query('.esriBasemapGalleryNode', this.id).forEach(lang.hitch(this,function(node) {
          this.addNode = domConstruct.create('div', {
            'class': 'bm-addbtn',
            'id': node.id +'_addBtn',
            'title': this.nls.add,
            'style': 'left:' + this.imgthumbposleft +'px'
          }, node);

          this.own(
            on(node, 'mouseover', lang.hitch(this, this._showAddBtn))
          );

          this.own(
            on(node, 'mouseout', lang.hitch(this, this._hideAddBtn))
          );

          this.own(
            on(this.addNode, 'click', lang.hitch(this, this._addBtnClick))
          );
        }));
      },

      _removeBtnClick: function(evt) {
        html.setStyle(this.selectedBasemapGalleryNode, 'visibility', 'visible');
        html.setStyle(this.selectedBasemap1, 'visibility', 'hidden');
        html.setStyle(this.selectedBasemap2, 'visibility', 'hidden');
        html.setStyle(this.faderDiv,'display','none');
        this._resetBasemaps1and2();
        this._removeHybridBasemap((evt.target.id === "removeBM1") ? "second" : "primary");
        this.hybridBasemapArray=[];
      },

      _resetBasemaps1and2: function(){
        var sNode = query(".esriBasemapGalleryLabelContainer span", this.selectedBasemap1)[0];
        var sNode2 = query(".esriBasemapGalleryThumbnail", this.selectedBasemap1)[0];

        var sNode3 = query(".esriBasemapGalleryLabelContainer span", this.selectedBasemap2)[0];
        var sNode4 = query(".esriBasemapGalleryThumbnail", this.selectedBasemap2)[0];

        sNode3.innerHTML = sNode3.title = sNode3.alt = sNode.innerHTML = sNode.title = sNode.alt = "";
        sNode4.title = sNode4.alt = sNode2.title = sNode2.alt = "";
        sNode4.src = sNode2.src = "widgets/eBasemapGallery/images/default.jpg";
      },

      _addBtnClick: function(evt) {
        //begin by removing the hybrid basemap if one exists
        if(this.hybridBasemapId){
          array.map(this.hyBasemap.getLayers(), lang.hitch(this,function(lyr){
            lyr.opacity = 1;
          }));
          this.basemapGallery.remove(this.hybridBasemapId);
          this.hybridAdded = false;
          this.hybridBasemapId = null;
        }
        var gItem = this.defaultBasemapId.split("_")[1];
        this.hybridBasemapArray=[];
        this.hybridBasemapArray.push(gItem);
        evt.stopImmediatePropagation();
        evt.preventDefault();

        if(this.selectedBMNode2){
          html.setStyle(this.selectedBMNode2, 'display', 'block');
        }
        html.setStyle(this.selectedBasemapGalleryNode, 'visibility', 'hidden');
        var sNode = query(".esriBasemapGalleryLabelContainer span", this.selectedBasemap1)[0];
        var sNode2 = query(".esriBasemapGalleryThumbnail", this.selectedBasemap1)[0];
        var sNode3 = query(".esriBasemapGalleryLabelContainer span", this.selectedBasemapGalleryNode)[0];
        var sNode4 = query(".esriBasemapGalleryLabelContainer span", this.selectedBasemap2)[0];
        var sNode5 = query(".esriBasemapGalleryThumbnail", this.selectedBasemap2)[0];

        var bm2Node = html.byId(evt.target.id.replace("_addBtn", ""));
        this.selectedBMNode2 = bm2Node;
        this.secondBasemapId = bm2Node.id.replace("galleryNode_", "");

        gItem = bm2Node.id.split("_")[2];
        this.hybridBasemapArray.push(gItem);

        html.setStyle(bm2Node, 'display', 'none');
        var aNode2 = query('.esriBasemapGalleryThumbnail', bm2Node)[0];
        sNode4.innerHTML = sNode.title = sNode.alt = aNode2.alt;
        sNode5.title = sNode5.alt = aNode2.alt;
        sNode5.src = aNode2.src;

        array.some(this.basemapGallery.basemaps, lang.hitch(this,function(lyr){
          if(sNode3.title === lyr.title){
            var tNode = query('.esriBasemapGalleryNode > .esriBasemapGalleryLabelContainer span[ title = "' + lyr.title + '" ]', this.id).parent().parent()[0];
            var tNode2 = query('.esriBasemapGalleryThumbnail', tNode)[0];
            sNode.innerHTML = sNode.title = sNode.alt = lyr.title;
            sNode2.title = sNode2.alt = tNode2.alt;
            sNode2.src = tNode2.src;
          }
        }));

        html.setStyle(this.selectedBasemap1, 'visibility', 'visible');
        html.setStyle(this.selectedBasemap2, 'visibility', 'visible');
        html.setStyle(this.faderDiv,'display','inline-block');

        this._addHybridBasemap();
      },

      _getBasemapNodeFromTarget: function(target) {
        var retval;
        if(target.tagName === "A"){
          retval = target.parentNode;
        }else if(target.tagName === "IMG"){
          retval = target.parentNode.parentNode;
        }else if(target.tagName === "SPAN"){
          retval = target.parentNode.parentNode;
        }else if(target.tagName === "DIV"){
          if(html.hasClass(target, 'esriBasemapGalleryNode')){
            retval = target;
          }else if(html.hasClass(target, 'esriBasemapGalleryLabelContainer')){
            retval = target.parentNode;
          }else if(html.hasClass(target, 'bm-addbtn')){
            retval = target.parentNode;
          }else if(html.hasClass(target, 'bm-removebtn')){
            retval = target.parentNode;
          }
        }
        return retval;
      },

      _showAddBtn: function(evt){
        var node = this._getBasemapNodeFromTarget(evt.target);
        if(html.hasClass(node, 'currentSelected') || html.hasClass(node, 'basemap1') || html.hasClass(node, 'basemap2')){
          return;
        }
        var addBtnNode = query('.bm-addbtn', node)[0];
        html.setStyle(addBtnNode, 'display', 'inline-block');
      },

      _hideAddBtn: function(evt){
        var node = this._getBasemapNodeFromTarget(evt.target);
        if(html.hasClass(node, 'currentSelected') || html.hasClass(node, 'basemap1') || html.hasClass(node, 'basemap2')){
          return;
        }
        var addBtnNode = query('.bm-addbtn', node)[0];
        html.setStyle(addBtnNode, 'display', 'none');
      },

      _showRemoveBtn: function(evt){
        var node = this._getBasemapNodeFromTarget(evt.target);
        var addRemoveNode = query('.bm-removebtn', node)[0];
        html.setStyle(addRemoveNode, 'display', 'inline-block');
      },

      _hideRemoveBtn: function(evt){
        var node = this._getBasemapNodeFromTarget(evt.target);
        var addRemoveNode = query('.bm-removebtn', node)[0];
        html.setStyle(addRemoveNode, 'display', 'none');
      },

      _onFaderChanged: function(evt){
        var floorValue = Math.floor(evt);
        //loop through the hybrid basemap layers and adjust transparency
        array.map(this.hyBasemap.getLayers(), lang.hitch(this,function(lyr){
          if(lyr.hybrid === 0){
            lyr.opacity = (100 - floorValue) / 100;
          }else if(lyr.hybrid === 1){
            lyr.opacity = floorValue / 100;
          }
        }));
        this.hybridChangeEvent = true;
        this.basemapGallery.select(this.hybridBasemapId);
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

      _addHybridBasemap: function (){
        var bmObj = {
          id: "basemap_" + this.basemapGallery.basemaps.length.toString(),
          title: "Hybrid Mashup",
          thumbnailUrl: this.folderUrl + "/images/default.jpg",
          layers: []
        };
        this.hybridBasemapId = bmObj.id;
        var bmLyrOrder = 0;
        array.map(this.hybridBasemapArray, lang.hitch(this,function(bLyrId){
          array.map(this.basemapGallery.basemaps[bLyrId].getLayers(), lang.hitch(this,function(lyr){
            lyr.visibility = true;
            lyr.opacity = 0.5;
            lyr.hybrid = bmLyrOrder;
            bmObj.layers.push(lyr);
          }));
          bmLyrOrder++;
        }));
        this.hyBasemap = new Basemap(bmObj);
        this.basemapGallery.add(this.hyBasemap);
        this.hybridAdded = true;
        this.hybridChangeEvent = true;
        this.basemapGallery.select(this.hybridBasemapId);
        this.fader.set('value', 50);
        this.selectedBMNode = html.byId("galleryNode_" + this.defaultBasemapId);
        this.selectedBMNode2 = html.byId("galleryNode_" + this.secondBasemapId);
        this.selectedBMNode3 = html.byId("galleryNode_" + this.hybridBasemapId);
        html.setStyle(this.selectedBMNode, 'display', 'none');
        html.setStyle(this.selectedBMNode2, 'display', 'none');
        html.setStyle(this.selectedBMNode3, 'display', 'none');
      },

      _removeHybridBasemap: function (which){
        array.map(this.hyBasemap.getLayers(), lang.hitch(this,function(lyr){
          lyr.opacity = 1;
        }));
        this.basemapGallery.remove(this.hybridBasemapId);
        this.hybridAdded = false;
        this.hybridBasemapId = null;
        this.hybridChangeEvent = false;

        if(which === "primary"){
          this.basemapGallery.select(this.defaultBasemapId);
          this.secondBasemapId = null;
          this.hybridBasemapId = null;
          this.selectedBMNode2 = null;
          this.selectedBMNode3 = null;
        }else{
          this.basemapGallery.select(this.secondBasemapId);
          this.secondBasemapId = null;
          this.hybridBasemapId = null;
          this.selectedBMNode2 = null;
          this.selectedBMNode3 = null;
        }
      },

      beforeDestroy: function() {
        if(this.hybridAdded){
          array.map(this.hyBasemap.getLayers(), lang.hitch(this,function(lyr){
            lyr.opacity = 1;
          }));
          this.basemapGallery.remove(this.hybridBasemapId);
        }
        this.hybridAdded = false;
        this.hybridBasemapId = null;
        this.hybridChangeEvent = false;
        if(this.webmapBasemap){
          this.basemapGallery.select(this.webmapBasemap);
        }
        this.basemapGallery.destroy();
        this.selectedBMNode = null;
        this.selectedBMNode2 = null;
        this.selectedBMNode3 = null;
        this.webmapBasemap = null;
      },

      selectionChange: function() {
        if(this.hybridChangeEvent){
          this.hybridChangeEvent = false;
          return;
        }
        if(this.selectedBMNode){
          html.setStyle(this.selectedBMNode, 'display', 'unset');
        }
        if(this.selectedBMNode2){
          html.setStyle(this.selectedBMNode2, 'display', 'unset');
        }
        var basemap = this.basemapGallery.getSelected();
        if(basemap.title === "Hybrid Mashup"){
          basemap = query(".esriBasemapGalleryLabelContainer span", this.selectedBMNode)[0];
        }

        var sNode = query(".esriBasemapGalleryLabelContainer span", this.selectedBasemapGalleryNode)[0];
        var sNode2 = query(".esriBasemapGalleryThumbnail", this.selectedBasemapGalleryNode)[0];

        var sNode3 = query(".esriBasemapGalleryLabelContainer span", this.selectedBasemap1)[0];
        var sNode4 = query(".esriBasemapGalleryThumbnail", this.selectedBasemap1)[0];

        array.some(this.basemapGallery.basemaps, lang.hitch(this,function(lyr){
          if(basemap.title === lyr.title){
            var tNode = query('.esriBasemapGalleryNode > .esriBasemapGalleryLabelContainer span[ title = "' +
                              lyr.title + '" ]', this.id).parent().parent()[0];
            html.setStyle(tNode, 'display', 'none');
            this.selectedBMNode = tNode;
            var tNode2 = query('.esriBasemapGalleryThumbnail', tNode)[0];
            html.addClass(tNode,'.esriBasemapGallerySelectedNode');
            this.defaultBasemapId = lyr.id;
            if(this.hybridAdded){
              sNode3.innerHTML = sNode3.title = sNode3.alt = lyr.title;
              sNode4.title = sNode4.alt = tNode2.alt;
              sNode4.src = tNode2.src;
            }

            sNode.innerHTML = sNode.title = sNode.alt = lyr.title;
            sNode2.title = sNode2.alt = tNode2.alt;
            sNode2.src = tNode2.src;
          }
        }));
        if (this.isPreload) {
          PanelManager.getInstance().closePanel(this.id + '_panel');
        }

        if(this.hybridAdded){
          //begin by removing the hybrid basemap if one exists
          if(this.hybridBasemapId){
            array.map(this.hyBasemap.getLayers(), lang.hitch(this,function(lyr){
              lyr.opacity = 1;
            }));
            this.basemapGallery.remove(this.hybridBasemapId);
            this.hybridAdded = false;
            this.hybridBasemapId = null;
          }
          var gItem = this.defaultBasemapId.split("_")[1];
          this.hybridBasemapArray=[];
          this.hybridBasemapArray.push(gItem);
          gItem = this.selectedBMNode2.id.split("_")[2];
          this.hybridBasemapArray.push(gItem);
          this._addHybridBasemap();
        }
      }
    });

    return clazz;
  });
