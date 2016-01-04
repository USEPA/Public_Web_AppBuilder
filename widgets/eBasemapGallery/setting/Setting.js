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
//
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    "dojo/_base/lang",
    'dojo/_base/array',
    "dojo/_base/html",
    'dojo/on',
    'dojo/keys',
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/Deferred",
    "dojo/promise/all",
    'jimu/dijit/Message',
    'jimu/dijit/Popup',
    'jimu/dijit/CheckBox',
    "jimu/SpatialReference/wkidUtils",
    'jimu/dijit/LoadingShelter',
    './Edit',
    '../utils'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    lang,
    array,
    html,
    on,
    keys,
    domStyle,
    domAttr,
    query,
    Deferred,
    all,
    Message,
    Popup,
    CheckBox,
    SRUtils,
    LoadingShelter,
    Edit,
    utils) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-basemapgallery-setting',
      basemaps: [],
      edit: null,
      editTr: null,
      popup: null,
      editIndex: null,
      spatialRef: null,

      startup: function() {
        this.inherited(arguments);
        if (!this.config.basemapGallery) {
          this.config.basemapGallery = {};
        }
        this.setConfig(this.config);
      },

      isEmpty: function (value){
        return Boolean(value && typeof value == 'object') && !Object.keys(value).length;
      },

      setConfig: function(config) {
        //hack the 'Learn more about this widget link'
        setTimeout(function(){
          var helpLink = dojo.query('.help-link');
          helpLink[0].href = 'http://gis.calhouncounty.org/WAB/V1.3/widgets/eBasemapGallery/help/eBasemapGallery_Help.htm';
          html.setStyle(helpLink[0],'display','block');
        },600);

        this.config = config;
        this.basemaps.length = 0;

        // load basemap from portal/AGOL or config file.
        // save all basemap to this.basemaps cache,
        // and save this.basemaps to config after save config.
        if(config.basemapGallery.basemaps.length === 0) {
          var loading = new LoadingShelter();
          loading.placeAt(this.baseMapsDiv);
          loading.startup();
          utils._loadPortalBaseMaps(this.appConfig.portalUrl, this.map.spatialReference)
            .then(lang.hitch(this, function(basemaps) {
              basemaps = array.filter(basemaps, lang.hitch(this, function(basemap){
                return !this.isEmpty(basemap);
              }));
              this.basemaps = basemaps;
              this.refreshMapGallary();
              loading.destroy();
            }), function() {
              loading.destroy();
            });
        } else {
          var len = config.basemapGallery.basemaps.length;
          var configuration = config.basemapGallery.basemaps;
          for (var i = 0; i < len; i++){
            this.basemaps.push({
              title: configuration[i].title,
              thumbnailUrl: configuration[i].thumbnailUrl,
              layers: configuration[i].layers,
              spatialReference: configuration[i].spatialReference
            });
          }
          this.refreshMapGallary();
        }
      },

      getConfig: function() {
        this.config.basemapGallery.basemaps = this.basemaps;
        return this.config;
      },

      _findBaseMapByTitle: function(title) {
        for (var i = 0; i < this.basemaps.length; i++) {
          if (this.basemaps[i].title === title) {
            return i;
          }
        }
        return -1;
      },

      onAddBaseMapClick: function(){
        this._openEdit(null, null);
      },

      refreshMapGallary:function(){
        this.clearBaseMapsDiv();
        this._createMapItems();
        return true;
      },

      _createMapItems: function() {
        for(var i = 0;i < this.basemaps.length; i++){
          // basemap does not have title means basemap load failed.
          if(this.basemaps[i].title) {
            var mapItem = this._createMapItem(this.basemaps[i]);
            html.place(mapItem,this.baseMapsDiv);
          }
        }
      },

      _createMapItem: function(webMap) {
        /*jshint unused: false*/
        var str = "<div class='map-item-div'>" + "<div class='map-item-bg'>" +
                  "<div class='map-item-thumbnail'></div>" +
                  "<div class='map-item-delete-icon'></div>" +
                  "<div class='map-item-detail-icon'></div>" +
                  "<span class='map-item-title'></span>" + "</div>";
        var mapItem = html.toDom(str);
        var mapItemBg = query('.map-item-bg', mapItem)[0];
        var mapItemThumbnail = query('.map-item-thumbnail', mapItem)[0];
        var mapItemTitle = query('.map-item-title', mapItem)[0];
        var mapItemDeleteIcon = query('.map-item-delete-icon',mapItem)[0];
        this.own(on(mapItemDeleteIcon,
                    'click',
                    lang.hitch(this, this._onMapItemDeleteClick, mapItem, webMap)));
        var mapItemEditIcon = query('.map-item-detail-icon',mapItem)[0];
        this.own(on(mapItemEditIcon,
                    'click',
                    lang.hitch(this, this._onMapItemEditClick, mapItem, webMap)));
        mapItem.item = webMap;

        var thumbnailUrl;
        if (!webMap.thumbnailUrl) {
          webMap.thumbnailUrl = this.folderUrl + "images/default.jpg";
          thumbnailUrl = webMap.thumbnailUrl;
        } else {
          if (webMap.thumbnailUrl.indexOf('http') === 0) {
            thumbnailUrl = webMap.thumbnailUrl + utils.getToken(this.appConfig.portalUrl);
          }else if(webMap.thumbnailUrl.startWith('/') ||
            webMap.thumbnailUrl.startWith('data')){
            thumbnailUrl = webMap.thumbnailUrl;
          }else{
            //if path is relative, relative to widget's folder
            thumbnailUrl = this.folderUrl + webMap.thumbnailUrl;
          }
        }
        html.setStyle(mapItemThumbnail, 'backgroundImage', "url(" + thumbnailUrl + ")");

        mapItemTitle.innerHTML = webMap.title;
        mapItemTitle.title = webMap.title;

        if (!SRUtils.isSameSR(this.map.spatialReference.wkid, webMap.spatialReference.wkid)) {
          html.setStyle(mapItemThumbnail, "border", "1px solid red");
          var mapItemWarning = html.create('div', {'class': 'map-item-warning-icon'}, mapItemBg);
          html.attr(mapItemWarning, 'title', this.nls.invalidBasemapUrl2);
        }
        return mapItem;
      },

      clearBaseMapsDiv:function(){
        var mapItemDoms = query('.map-item-div', this.domNode);
        for (var i = 0; i< mapItemDoms.length;i++){
          html.destroy(mapItemDoms[i]);
        }
      },

      _openEdit: function(mapItem, basemap){
        var edit = new Edit({
          nls: this.nls,
          folderUrl: this.folderUrl,
          //baseMapSRID: this.spatialRef
          basemap: basemap,
          basemaps: this.basemaps,
          map: this.map,
          token: utils.getToken(this.appConfig.portalUrl)
        });
        //this.edit.setConfig(basemap || {});
        this.popup = new Popup({
          titleLabel: (basemap && basemap.title) || this.nls.addlayer,
          autoHeight: true,
          content: edit,
          container: 'main-page',
          width: 840,
          buttons: [
            {
              label: this.nls.ok,
              key:keys.ENTER,
              disable: true,
              //onClick: lang.hitch(this, '_onEditOk')
              onClick: lang.hitch(edit, edit._onEditOk, this)
            },{
              label: this.nls.cancel,
              key:keys.ESCAPE,
              onClose: lang.hitch(edit, edit._onEditClose, this)
            }
          ]
        });
        edit.startup();
      },

      _onMapItemEditClick:function(mapItem, basemap, event){
        this._openEdit(mapItem, basemap);
        event.stopPropagation();
      },

      _onMapItemDeleteClick:function(mapItem, basemap, event){
        html.destroy(mapItem);
        var index = this._findBaseMapByTitle(basemap.title);
        if (index >= 0) {
          this.basemaps.splice(index, 1);
        }
        event.stopPropagation();
      }
    });
  });
