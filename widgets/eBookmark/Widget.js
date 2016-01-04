///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eBookmark Widget
///////////////////////////////////////////////////////////////////////////
/*global define*/
define([
  'dojo/_base/declare',
  'jimu/BaseWidget',
  'jimu/dijit/Message',
  'dojo/on',
  'dojo/_base/lang',
  './BookmarkListView',
  'libs/storejs/store',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/dom-construct',
  'dojo/string',
  'dojo/query',
  'dojo/dom-style',
  'esri/geometry/Extent'
],
function(
  declare,
  BaseWidget,
  Message,
  on,
  lang,
  BookmarkListView,
  store,
  array,
  html,
  domConstruct,
  string,
  query,
  domStyle,
  Extent
  ) {
  return declare([BaseWidget], {

    baseClass: 'enhanced-bookmark-widget',
    name: 'eBookmark',
    bookmarks: [],
    currentBookmark: null,
    currentBookmarkParent: null,
    bookmarkNameExists: false,

    postCreate: function(){
      this.inherited(arguments);
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
      this.inherited(arguments);
      if(!this.config.addbookmarks){
        html.setStyle(this.mainAddSection, {display: 'none'});
      }
      this.own(on(this.bookmarkName, 'keydown', lang.hitch(this, function(evt){
        var keyNum = evt.keyCode !== undefined ? evt.keyCode : evt.which;
        if(html.getStyle(this.errorNode, 'display') === 'block'){
          html.setStyle(this.errorNode, {display: 'none'});
          this.errorNode.innerHTML = '&nbsp;';
        }
        if (keyNum === 13) {
          this._onAddBtnClicked();
        }
      })));
      this.own(
        on(this.btnClearSelection, 'click', lang.hitch(this,  this._onBookmarkListViewRowClear))
      );
    },

    onOpen: function(){
      // summary:
      //    see description in the BaseWidget
      // description:
      //    this function will check local cache first. If there is local cache,
      //    use the local cache, or use the bookmarks configured in the config.json
      var localBks = this._getLocalCache();
      if(localBks.length > 0){
        this.bookmarks = localBks;
      }else{
        this.bookmarks = lang.clone(this.config.bookmarks);
      }
      this.showBookmarks();
    },

    onClose: function(){
      this.bookmarks = [];
      this.currentBookmark = null;
    },

    onMinimize: function(){
      this.resize();
    },

    onMaximize: function(){
      this.resize();
    },

    showBookmarks: function() {
      //remove the webmap bookmarks so that the webmap bookmarks are always last
      this.bookmarks = array.filter(this.bookmarks, lang.hitch(this, function (bookmark) {
                return !bookmark.isInWebmap;
              }));
      //Add back the webmap bookmarks
      this._readBookmarksInWebmap();

      domConstruct.empty(this.bookmarkListBody);
      // summary:
      //    create a BookmarkListView module used to draw bookmark list in browser.
      this.bookmarkListView = new BookmarkListView({
        mybookmarkarray: this.bookmarks,
        eBookmarkWidget: this,
        config: this.config,
        map: this.map,
        nls: this.nls
      }).placeAt(this.bookmarkListBody);

      this.resize();
      this.own(this.bookmarkListView.on(
                  'onRowClick',
                  lang.hitch(this, this._onBookmarkListViewRowClick)));
      this.own(this.bookmarkListView.on(
                  'onRowDeleteClick',
                  lang.hitch(this, this._onDeleteBtnClicked)));
    },

    _onBookmarkListViewRowClick: function(bookmarkTrNode, bookmark, deleteImg, loadingImg, parent){
      this.currentBookmark = bookmark;
      this.currentBookmarkParent = parent;
      html.setStyle(this.btnClearSelection, {visibility: 'visible'});
      if(!bookmark.items) {
        domStyle.set(loadingImg, 'display', '');
        if(deleteImg){
          domStyle.set(deleteImg, 'display', 'none');
        }
        var nExtent = Extent(bookmark.extent);
        var mevent;
        this.own(mevent = on(this.map, 'update-end', lang.hitch(this, function(){
          if(loadingImg){
            domStyle.set(loadingImg, 'display', 'none');
            if(deleteImg){
              domStyle.set(deleteImg, 'display', '');
            }
            mevent.remove();
          }
        })));
        this.map.setExtent(nExtent);
      }
    },

    _onBookmarkListViewRowClear: function(){
      this.bookmarkListView.clearSelected();
      if(this.errorNode.innerHTML === this.nls.errorWebmapNode){
        html.setStyle(this.errorNode, {display: 'none'});
        this.errorNode.innerHTML = '&nbsp;';
      }
      this.currentBookmark = null;
      html.setStyle(this.btnClearSelection, {visibility: 'hidden'});
    },

    _createBookmark: function(){
      var b = {
        name: this.bookmarkName.value,
        extent: this.map.extent.toJson()
      };
      b.useradded = true;
      if(this.currentBookmark){
        if(!this.currentBookmark.items){
          this.currentBookmarkParent.items.push(b);
        }else{
          this.currentBookmark.items.push(b);
        }
      }else{
        this.bookmarks.push(b);
      }
      this._saveAllToLocalCache();
      this.resize();
    },

    _searchBookmarksForExistingName: function (bookmark, index, name) {
      if(bookmark.name === name){
        this.bookmarkNameExists = true;
        return true;
      }

      if(bookmark.items) {
        array.some(bookmark.items, lang.hitch(this ,function(subBookmark){
          this._searchBookmarksForExistingName(subBookmark, index, name);
        }));
      }
    },

    _onAddBtnClicked: function() {
      this.bookmarkNameExists = false;
      if (string.trim(this.bookmarkName.value).length === 0) {
        html.setStyle(this.errorNode, {display: 'block'});
        this.errorNode.innerHTML = this.nls.errorNameNull;
        return;
      }
      array.some(this.bookmarks, lang.hitch(this, function(b, index){
        this._searchBookmarksForExistingName(b, index, this.bookmarkName.value);
      }));

      if(this.bookmarkNameExists === true){
        html.setStyle(this.errorNode, {display: 'block'});
        this.errorNode.innerHTML = this.nls.errorNameExist;
        return;
      }
      if(this.currentBookmark){
        if(this.currentBookmarkParent.isInWebmap){
          html.setStyle(this.errorNode, {display: 'block'});
          this.errorNode.innerHTML = this.nls.errorWebmapNode;
          return;
        }
      }

      this._createBookmark();
      this._onBookmarkListViewRowClear();
      html.setStyle(this.errorNode, {display: 'none'});
      this.errorNode.innerHTML = '&nbsp;';
      this.bookmarkName.value = '';

      this.showBookmarks();
    },

    _onDeleteBtnClicked: function(bookmark, bookmarkTrNode, parent){
      var bmArray = (parent.hasOwnProperty('items')) ? parent.items : this.bookmarks;
      array.some(bmArray, function(b, i){
        // jshint unused:false
        if(b.name === bookmark.name){
          bmArray.splice(i, 1);
          return true;
        }
      }, this);

      this._saveAllToLocalCache();
      this.resize();

      this.currentBookmark = null;
      this.showBookmarks();
      this._onBookmarkListViewRowClear();
    },

    _saveAllToLocalCache: function() {
      // summary:
      //    if user add/delete a bookmark, we will save all of the bookmarks into the local storage.

      var keys = [];
      //clear
      array.forEach(store.get(this.name), function(bName){
        store.remove(bName);
      }, this);

      array.forEach(this.bookmarks, function(bookmark){
        if(bookmark.isInWebmap){
          return;
        }
        var key = this.name + '.' + bookmark.name;
        keys.push(key);
        store.set(key, bookmark);
      }, this);

      store.set(this.name, keys);
    },

    resize: function(){
      var box = html.getMarginBox(this.domNode);
      var listHeight = box.h - 21;
      if(this.config.addbookmarks){
        listHeight = listHeight - 37 - 14 - 18;
      }

      //fix for IE8
      if(listHeight < 0){
        listHeight = 0;
      }
      html.setStyle(this.bookmarkListBody, 'height', listHeight + 'px');
    },

    _getLocalCache: function() {
      var ret = [];
      if(!store.get(this.name)){
        return ret;
      }
      array.forEach(store.get(this.name), function(bName){
        if(bName.startWith(this.name)){
          ret.push(store.get(bName));
        }
      }, this);
      return ret;
    },

    _readBookmarksInWebmap: function(){
      if(!this.map.itemInfo || !this.map.itemInfo.itemData ||
        !this.map.itemInfo.itemData.bookmarks){
        return;
      }
      var webmapBookmarks = [];
      array.forEach(this.map.itemInfo.itemData.bookmarks, function(bookmark){
        bookmark.isInWebmap = true;
        bookmark.name = bookmark.name;
        var repeat = 0;
        for (var i = 0; i <this.bookmarks.length; i++ ){
          if (this.bookmarks[i].name === bookmark.name){
            repeat ++;
          }
        }
        if (!repeat){
          webmapBookmarks.push(bookmark);
        }
      }, this);

      var webmapFolder = {
        "name": this.nls.webmapfoldername,
        "items": webmapBookmarks,
        "expanded": true,
        "isInWebmap": true
      };
      this.bookmarks.push(webmapFolder);
    }

  });
});
