///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eBookmark Widget
///////////////////////////////////////////////////////////////////////////
/*global define, setTimeout*/

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
  './EditFolder',
  'libs/storejs/store',
  '../BookmarkListView',
  'jimu/dijit/CheckBox'
],
  function (declare, _WidgetsInTemplateMixin, lang, array, html, on, keys, query,
    BaseWidgetSetting, Popup, Message, utils, Edit, EditFolder, store, BookmarkListView) {
    //for now, this setting page suports 2D mark only
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'enhanced-bookmark-widget-bookmark-setting',

      //bookmarks: Object[]
      //    all of the bookmarks, the format is the same as the config.json
      bookmarks: [],
      edit: null,
      popup: null,
      editFolder: null,
      popup2: null,
      popupState: "", // ADD or EDIT
      currentIndex: null,
      currentBookmark: null,
      currentBookmarkParent: null,

      startup: function () {
        this.inherited(arguments);
        this.setConfig(this.config);
        this.btnAddFolderImg.src = this.folderUrl + 'images/i_folder.png';
        this.btnAddBookmarkImg.src = this.folderUrl + 'images/i_bookmark.png';
        this.own(
          on(this.btnClearSelection, 'click', lang.hitch(this,  this._onBookmarkListViewRowClear))
        );
      },

      setConfig: function (config) {
        //hack the 'Learn more about this widget link'
        setTimeout(function(){
          var helpLink = query('.help-link');
          helpLink[0].href = 'http://gis.calhouncounty.org/WAB/V1.3/widgets/eBookmark/help/eBookmark_Help.htm';
          html.setStyle(helpLink[0],'display','block');
        },600);
        this.config = config;
        this.addBookmarksCbx.setValue(this.config.addbookmarks);
        this.bookmarks = this.config.bookmarks;
        //add useradded to each bookmark
        array.map(this.bookmarks, function(bookmark) {
          this._setBookmarkAttribValue(bookmark, 'useradded', true, false, true);
        }, this);

        //add webmap bookmarks
        if (this.map.itemInfo && this.map.itemInfo.itemData && this.map.itemInfo.itemData.bookmarks) {
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
        this.currentBookmark = null;
        this.showBookmarks();
      },

      _onBookmarkListViewRowClear: function(){
        this.bookmarkListView.clearSelected();
        this.currentBookmark = null;
        html.removeClass(this.btnAddFolder, 'disabled');
        html.removeClass(this.btnAddBookmark, 'disabled');
        this.btnAddFolderImg.src = this.folderUrl + 'images/i_folder.png';
        this.btnAddBookmarkImg.src = this.folderUrl + 'images/i_bookmark.png';
        html.setStyle(this.btnClearSelection, {visibility: 'hidden'});
      },

      _setBookmarkAttribValue: function(bookmark, attrib, value, _delete, recursive) {
        if(!value){
          if(_delete){
            delete bookmark[attrib];
          }else{
            bookmark[attrib] = false;
          }
          delete bookmark.useradded;
        }else{
          bookmark[attrib] = value;
        }
        if(bookmark.items && recursive){
          for (var i = 0; i < bookmark.items.length; i ++) {
            this._setBookmarkAttribValue(bookmark.items[i], attrib, value, _delete, recursive);
          }
        }
      },

      showBookmarks: function() {
        html.empty(this.bookmarkListBody);
        //remove the webmap bookmarks so that the webmap bookmarks are always last
        this.bookmarks = array.filter(this.bookmarks, lang.hitch(this, function (bookmark) {
                  return !bookmark.isInWebmap;
                }));
        //Add back the webmap bookmarks
        this._readBookmarksInWebmap();
        // summary:
        //    create a BookmarkListView module used to draw bookmark list in browser.
        this.bookmarkListView = new BookmarkListView({
          mybookmarkarray: this.bookmarks,
          eBookmarkWidget: this,
          config: this.config,
          map: this.map,
          nls: this.nls
        }).placeAt(this.bookmarkListBody);
        this.own(this.bookmarkListView.on(
                    'onRowDeleteClick',
                    lang.hitch(this, this._onDeleteBtnClicked)));
        this.own(this.bookmarkListView.on(
                    'onRowEditClick',
                    lang.hitch(this, this._onBookmarkItemEditClick)));
        this.own(this.bookmarkListView.on(
                  'onRowClick',
                  lang.hitch(this, this._onBookmarkRowClick)));
      },

      _onBookmarkRowClick: function(bookmarkTrNode, bookmark, deleteImg, loadingImg, parent){
        this.currentBookmark = bookmark;
        this.currentBookmarkParent = parent;
        html.setStyle(this.btnClearSelection, {visibility: 'visible'});
        if(bookmark.isInWebmap){
          html.addClass(this.btnAddFolder, 'disabled');
          html.addClass(this.btnAddBookmark, 'disabled');
          this.btnAddFolderImg.src = this.folderUrl + 'images/i_folder_disabled.png';
          this.btnAddBookmarkImg.src = this.folderUrl + 'images/i_bookmark_disabled.png';
        }else{
          html.removeClass(this.btnAddFolder, 'disabled');
          html.removeClass(this.btnAddBookmark, 'disabled');
          this.btnAddFolderImg.src = this.folderUrl + 'images/i_folder.png';
          this.btnAddBookmarkImg.src = this.folderUrl + 'images/i_bookmark.png';
        }
      },

      getConfig: function (isOk) {
        //remove user added to each bookmark
        array.map(this.bookmarks, function(bookmark) {
          this._setBookmarkAttribValue(bookmark, 'useradded', false, true, true);
        }, this);

        this.config.addbookmarks = this.addBookmarksCbx.getValue();

        this.config.bookmarks = array.filter(this.bookmarks, lang.hitch(this, function (bookmark) {
                  return !bookmark.isInWebmap;
                }));
        if (isOk) {
          //clear local store
          var key = this.name;
          for (var p in store.getAll()) {
            if (p.startWith(key)) {
              store.remove(p);
            }
          }
        }
        return this.config;
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
      },

      destroy: function () {
        this.inherited(arguments);
      },

      onAddBookmarkClick: function () {
        this.popupState = "ADD";
        this._openEdit(this.nls.addBookmark, {
          name: '',
          extent: this.map.extent.toJson()
        });
      },

      _onEditClick: function (bookmark, parent) {
        this.popupState = "EDIT";
        this._openEdit(this.nls.edit, bookmark, parent);
      },

      _onEditFolderClick: function (bookmark, parent) {
        this.popupState2 = "EDIT";
        this._openEditFolder(this.nls.editFolder, bookmark, parent);
      },

      _openEdit: function (name, bookmark) {
        this.edit = new Edit({
          nls: this.nls,
          folderUrl: this.folderUrl,
          portalUrl: this.appConfig.map.portalUrl,
          itemId: this.appConfig.map.itemId
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
              key: keys.ENTER,
              disable: true,
              onClick: lang.hitch(this, '_onEditOk')
            }, {
              label: this.nls.cancel,
              key: keys.ESCAPE
            }
          ],
          onClose: lang.hitch(this, '_onEditClose')
        });
        html.addClass(this.popup.domNode, 'widget-setting-popup');
        this.edit.startup();
      },

      _openEditFolder: function (name, bookmark) {
        this.editFolder = new EditFolder({
          nls: this.nls,
          folderUrl: this.folderUrl
        });
        this.editFolder.setConfig(bookmark || {});
        this.popup2 = new Popup({
          titleLabel: name,
          autoHeight: true,
          content: this.editFolder,
          container: 'main-page',
          width: 440,
          buttons: [
            {
              label: this.nls.ok,
              key: keys.ENTER,
              disable: true,
              onClick: lang.hitch(this, '_onEditFolderOk')
            }, {
              label: this.nls.cancel,
              key: keys.ESCAPE
            }
          ],
          onClose: lang.hitch(this, '_onEditFolderClose')
        });
        html.addClass(this.popup2.domNode, 'widget-setting-popup');
        this.editFolder.startup();
      },

      _onEditOk: function () {
        var bookmark = this.edit.getConfig();
        var editResult = null;
        if (!bookmark.name || !bookmark.extent) {
          new Message({
            message: this.nls.warning
          });
          return;
        }
        var bmArray;
        if (this.popupState === "ADD") {
          if(!this.currentBookmark){
            bmArray = this.bookmarks;
          }else{
            bmArray = (this.currentBookmark.hasOwnProperty('items')) ? this.currentBookmark.items : this.currentBookmarkParent.items;
          }
          bookmark.useradded = true;
          this.bookmarkNameExists = false;
          array.some(this.bookmarks, lang.hitch(this, function(b, index){
            this._searchBookmarksForExistingName(b, index, bookmark.name);
          }));
          if(this.bookmarkNameExists === false){
            bmArray.push(bookmark);
            this.showBookmarks();
            editResult = true;
          }
        } else if (this.popupState === "EDIT") {
          bmArray = (this.currentBookmarkParent.hasOwnProperty('items')) ? this.currentBookmarkParent.items : this.bookmarks;
          array.some(bmArray, function(b, i){
            // jshint unused:false
            if(b.name === this.currentBookmark.name){
              bmArray.splice(i, 1, bookmark);
              return true;
            }
          }, this);
          this.showBookmarks();
          editResult = true;
        }

        if (editResult) {
          this.popup.close();
          this.popupState = "";
          editResult = false;
        } else {
          new Message({
            message: this.nls.errorNameExist
          });
        }
      },

      _onEditFolderOk: function () {
        var bookmark = this.editFolder.getConfig();
        var editResult = null;
        if (!bookmark.name) {
          new Message({
            message: this.nls.warning
          });
          return;
        }
        var bmArray;
        if (this.popupState2 === "ADD") {
          if(!this.currentBookmark){
            bmArray = this.bookmarks;
          }else{
            bmArray = (this.currentBookmark.hasOwnProperty('items')) ? this.currentBookmark.items : this.currentBookmarkParent.items;
          }

          bookmark.useradded = true;
          this.bookmarkNameExists = false;
          array.some(this.bookmarks, lang.hitch(this, function(b, index){
            this._searchBookmarksForExistingName(b, index, bookmark.name);
          }));
          if(this.bookmarkNameExists === false){
            bmArray.push(bookmark);
            this.showBookmarks();
            editResult = true;
          }
        } else if (this.popupState2 === "EDIT") {
          bmArray = (this.currentBookmarkParent.hasOwnProperty('items')) ? this.currentBookmarkParent.items : this.bookmarks;
          array.some(bmArray, function(b, i){
            // jshint unused:false
            if(b.name === this.currentBookmark.name){
              bmArray.splice(i, 1, bookmark);
              return true;
            }
          }, this);
          this.showBookmarks();
          editResult = true;
        }

        if (editResult) {
          this.popup2.close();
          this.popupState2 = "";
          editResult = false;
        } else {
          new Message({
            message: this.nls.errorNameExist
          });
        }
      },

      _onEditClose: function () {
        this.edit = null;
        this.popup = null;
      },

      _onEditFolderClose: function () {
        this.editFolder = null;
        this.popup2 = null;
      },

      _onBookmarkItemEditClick: function (bookmark, bookmarkTrNode, parent) {
        this.currentBookmark = bookmark;
        this.currentBookmarkParent = parent;
        html.setStyle(this.btnClearSelection, {visibility: 'visible'});
        if(!bookmark.items){
          this._onEditClick(bookmark, parent);
        }else{
          this._onEditFolderClick(bookmark, parent);
        }
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

        this.currentBookmark = null;
        this.showBookmarks();
      },

      _onBtnAddFolderClicked: function () {
        this.popupState2 = "ADD";
        this._openEditFolder(this.nls.addFolder, {
          name: '',
          items: [],
          expanded: true,
          useradded: true
        });
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
      }

    });
  });
