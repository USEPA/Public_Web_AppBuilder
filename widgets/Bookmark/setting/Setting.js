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
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/on',
  'dojo/keys',
  "dojo/query",
  'jimu/BaseWidgetSetting',
  'jimu/dijit/Popup',
  'jimu/dijit/Message',
  'jimu/utils',
  './Edit',
  'libs/storejs/store'
],
function(declare, _WidgetsInTemplateMixin, lang, array, html, on, keys, query,
  BaseWidgetSetting, Popup, Message, utils, Edit, store) {
  //for now, this setting page suports 2D mark only
  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    //these two properties is defined in the BaseWidget
    baseClass: 'jimu-widget-bookmark-setting',

    //bookmarks: Object[]
    //    all of the bookmarks, the format is the same as the config.json
    bookmarks: [],
    edit: null,
    popup: null,
    popupState: "", // ADD or EDIT
    editIndex: null,

    startup: function(){
      this.inherited(arguments);
      this.setConfig(this.config);
    },

    setConfig: function(config){
      this.config = config;
      this.bookmarks = this.config.bookmarks2D;
      //add webmap bookmarks only if there is no entry in config
      if(this.bookmarks.length === 0 && this.map.itemInfo &&
          this.map.itemInfo.itemData && this.map.itemInfo.itemData.bookmarks){
        array.forEach(this.map.itemInfo.itemData.bookmarks, function(bookmark){
          bookmark.isInWebmap = true;
          // if (array.indexOf(this.bookmarks, bookmark) === -1){
          //   this.bookmarks.push(bookmark);
          // }
          var repeat = 0;
          for (var i = 0; i < this.bookmarks.length; i++ ){
            if (this.bookmarks[i].name === bookmark.name){
              repeat ++;
            }
          }
          if (!repeat){
            this.bookmarks.push(bookmark);
          }
        }, this);
      }
      this.currentBookmark = null;
      this.displayBookmarks();
    },

    getConfig: function (isOk) {
      this.config.bookmarks2D = this.bookmarks;
      if(isOk){
        //clear local store
        var key = this._getKeysKey();
        for(var p in store.getAll()){
          if(p.startWith(key)){
            store.remove(p);
          }
        }
      }
      return this.config;
    },

    displayBookmarks: function() {
      // summary:
      //    remove all and then add
      this._clearBookmarksDiv();
      this._createmarkItems();
    },

    _clearBookmarksDiv:function(){
      //html.empty(this.bookmarkListNode);
      var bookmarkItemDoms = query('.mark-item-div', this.domNode);
      for (var i = 0; i < bookmarkItemDoms.length;i++){
        html.destroy(bookmarkItemDoms[i]);
      }
    },

    destroy: function(){
      this.inherited(arguments);
    },

    _getKeysKey: function(){
      // summary:
      // we use className plus 2D/3D as the local store key
      if(this.appConfig.map['3D']){
        return this.name + '.3D';
      }else{
        return this.name + '.2D';
      }
    },

    onAddBookmarkClick: function(){
        this.popupState = "ADD";
        this._openEdit(this.nls.addBookmark, {
          name: '',
          thumbnail: '',
          extent: this.map.extent.toJson()
        });
      },

    getBookmarkByName: function(name){
      var len = this.bookmarks.length;
      for (var i = 0; i < len; i++) {
        if (this.bookmarks[i].name === name) {
          this.editIndex = i;
          return this.bookmarks[i];
        }
      }
    },

    _onEditClick: function(name){
        this.getBookmarkByName(name);
        var bookmark = this.bookmarks[this.editIndex];
        this.popupState = "EDIT";
        this._openEdit(this.nls.edit, bookmark);
      },

    _openEdit: function(name, bookmark){
        this.edit = new Edit({
          nls: this.nls,
          folderUrl: this.folderUrl,
          portalUrl : this.appConfig.map.portalUrl,
          itemId: this.appConfig.map.itemId,
          mapOptions: this.appConfig.map.mapOptions
        });
        this.edit.setConfig(bookmark || {});
        this.popup = new Popup({
          titleLabel: name,
          autoHeight: true,
          content: this.edit,
          container: 'main-page',
          width: 640,
          buttons: [
            {
              label: this.nls.ok,
              key:keys.ENTER,
              disable: true,
              onClick: lang.hitch(this, '_onEditOk')
            }, {
              label: this.nls.cancel,
              key:keys.ESCAPE
            }
          ],
          onClose: lang.hitch(this, '_onEditClose')
        });
        html.addClass(this.popup.domNode, 'widget-setting-popup');
        this.edit.startup();
      },

    _onEditOk: function() {
        var bookmark = this.edit.getConfig();
        var editResult = null;
        if (!bookmark.name || !bookmark.extent) {
          new Message({
            message: this.nls.warning
          });
          return;
        }
        if (this.popupState === "ADD"){
          this.bookmarks.push(bookmark);
          this.displayBookmarks();
          editResult = true;
        }else if (this.popupState === "EDIT"){
          this.bookmarks.splice(this.editIndex, 1, bookmark);
          this.displayBookmarks();
          editResult = true;
        }

        if (editResult){
          this.popup.close();
          this.popupState = "";
          this.editIndex = null;
          editResult = false;
        }else{
          var repeatnames = array.mark(editResult.repeatFields, lang.hitch(this, function(field) {
            return field && field.name;
          }));
          new Message({
            message: this.nls[editResult.errorCode] + repeatnames.toString()
          });
        }
      },

    _onEditClose: function() {
      this.edit = null;
      this.popup = null;
    },

    _createmarkItems: function() {
      for(var i = 0;i < this.bookmarks.length; i++){
        var markItem = this._createmarkItem(this.bookmarks[i]);
        html.place(markItem, this.bookmarksDiv);
      }
    },

    _createmarkItem: function(bookmark) {
      var str = "<div class='mark-item-div jimu-float-leading jimu-leading-margin2'>" +
        "<div class='mark-item-bg'>" +
          "<img class='mark-item-thumbnail'>" +
          "<div class='mark-item-delete-icon'></div>" +
          "<div class='mark-item-detail-icon'></div>" +
        "</div>" +
        "<span class='mark-item-title'></span>" +
      "</div>";
      var markItem = html.toDom(str);
      var markItemThumbnail = query('.mark-item-thumbnail', markItem)[0];
      var markItemTitle = query('.mark-item-title', markItem)[0];
      var markItemDeleteIcon = query('.mark-item-delete-icon', markItem)[0];
      this.own(on(markItemDeleteIcon, 'click',
        lang.hitch(this, this._onmarkItemDeleteClick, bookmark.name)));
      var markItemEditIcon = query('.mark-item-detail-icon', markItem)[0];
      this.own(on(markItemEditIcon, 'click',
        lang.hitch(this, this._onmarkItemEditClick, bookmark.name)));
      markItem.item = bookmark;
      var thumbnail;

      if(bookmark.thumbnail){
        thumbnail = utils.processUrlInWidgetConfig(bookmark.thumbnail, this.folderUrl);
      }else{
        thumbnail = this.folderUrl + 'images/thumbnail_default.png';
      }
      html.setAttr(markItemThumbnail, 'src', thumbnail);
      markItemTitle.innerHTML = utils.sanitizeHTML(bookmark.name);
      html.setAttr(markItemTitle, 'title', bookmark.name);
      return markItem;
    },

    _clearBasemarksDiv:function(){
      var markItemDoms = query('.mark-item-div', this.domNode);
      for (var i = 0; i < markItemDoms.length;i++){
        html.destroy(markItemDoms[i]);
      }
    },

    _onmarkItemEditClick:function(bookmarkName){
      this._onEditClick(bookmarkName);
    },

    _onmarkItemDeleteClick:function(bookmarkName){
      this.getBookmarkByName(bookmarkName);
      if (this.editIndex !== null){
        this.bookmarks.splice(this.editIndex, 1);
      }
      this.displayBookmarks();
    }

  });
});