///////////////////////////////////////////////////////////////////////////
// Robert J Scheitlin - BookmarkListView
// Based on the WAB LayerListView
///////////////////////////////////////////////////////////////////////////

/*global define*/
define([
  'dijit/_WidgetBase',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/dom-construct',
  'dojo/on',
  'dojo/query',
  'jimu/dijit/CheckBox',
  'dijit/_TemplatedMixin',
  'dojo/text!./BookmarkListView.html',
  'dojo/dom-attr',
  'dojo/dom-class',
  'dojo/dom-style',
  'esri/geometry/Extent',
  'dojo/Evented'
], function(_WidgetBase, declare, lang, array, html, domConstruct, on, query,
  CheckBox, _TemplatedMixin, template,
  domAttr, domClass, domStyle, Extent, Evented) {

  return declare([_WidgetBase, _TemplatedMixin, Evented], {
    templateString: template,
    _currentSelectedBookmarkRowNode: null,
    _currentIndex: 1,
    nls: null,
    openArray: null,

    postMixInProperties: function() {
      this.inherited(arguments);
    },

    postCreate: function() {
      array.forEach(this.mybookmarkarray, function(bookmark) {
        this.drawListNode(bookmark, 0, this.bookmarksListTable, this.mybookmarkarray);
      }, this);
    },

    drawListNode: function(bookmark, level, toTableNode, parent) {
      var nodeAndSubNode;
      if(!bookmark.items) {
        //addBookmarkNode
        nodeAndSubNode = this.addBookmarkNode(bookmark, level, toTableNode, parent);
        return;
      }
      //addbookmarkNode
      nodeAndSubNode = this.addBookmarkNode(bookmark, level, toTableNode, parent);
      array.forEach(bookmark.items, lang.hitch(this ,function(level, bookmark, subBookmark){
        this.drawListNode(subBookmark, level+1, nodeAndSubNode.subNode, bookmark);
      }, level, bookmark));
    },

    addBookmarkNode: function(bookmark, level, toTableNode, parent) {
      var bookmarkTrNode = domConstruct.create('tr', {
        'id': 'bookmark_' + this._currentIndex,
        'class': 'jimu-widget-row bookmark-row ' +
                  ( /*visible*/ false ? 'jimu-widget-row-selected' : '')
      }, toTableNode), bookmarkTdNode, iconDiv, iconNode, imageExpandNode, i, expandImageDiv, divLabel, bookmarkActionsDiv,
          loadingImg, deleteImg, editImg;

      domAttr.set(bookmarkTrNode, 'level', level);
      domAttr.set(bookmarkTrNode, 'name', bookmark.name);

      bookmarkTdNode = domConstruct.create('td', {
        'class': 'col col1'
      }, bookmarkTrNode);

      for (i = 0; i < level; i++) {
        domConstruct.create('div', {
          'class': 'begin-blank-div jimu-float-leading',
          'innerHTML': ''
        }, bookmarkTdNode);
      }

      if (bookmark.items) {
        expandImageDiv = domConstruct.create('div', {
          'class': 'expand-div jimu-float-leading'
        }, bookmarkTdNode);
        var expandImageSrc;
        if(isRTL) {
          expandImageSrc = this.eBookmarkWidget.folderUrl + 'images/v_left.png';
        } else {
          expandImageSrc = this.eBookmarkWidget.folderUrl + 'images/v_right.png';
        }

        if(bookmark.expanded){
          expandImageSrc = this.eBookmarkWidget.folderUrl + 'images/v.png';
        }

        imageExpandNode = domConstruct.create('img', {
          'class': 'expand-image',
          'src': expandImageSrc,
          'alt': 'l'
        }, expandImageDiv);
      }

      iconDiv = domConstruct.create('div', {
        'class': 'div-icon jimu-float-leading'
      }, bookmarkTdNode);

      var imageName;
      if (!bookmark.items) {
        if(bookmark.isInWebmap){
          imageName = 'images/i_bookmark_web.png';
        }else{
          imageName = 'images/i_bookmark.png';
        }
      } else {
        if(bookmark.isInWebmap){
          imageName = 'images/i_folder_web.png';
        }else{
          imageName = 'images/i_folder.png';
        }
      }

      iconNode = domConstruct.create('img', {
        'src': this.eBookmarkWidget.folderUrl + imageName,
        'alt': 'l'
      }, iconDiv);

      domConstruct.place(iconNode, iconDiv);

      // set tdNode width
      domStyle.set(bookmarkTdNode, 'width', level*12 + 35 + 'px');

      var bookmarkTitleTdNode = domConstruct.create('td', {
        'class': 'col col2'
      }, bookmarkTrNode);

      divLabel = domConstruct.create('div', {
        'innerHTML': bookmark.name,
        'class': 'div-content jimu-float-leading'
      }, bookmarkTitleTdNode);

      this._currentIndex++;

      bookmarkTdNode = domConstruct.create('td', {
        'class': 'col col3'
      }, bookmarkTrNode);

      bookmarkActionsDiv = domConstruct.create("div", {
        "class": "actions-div"
      }, bookmarkTdNode);

      if(!bookmark.items){
        loadingImg = domConstruct.create("img", {
          "class": "bookmark-loading-img",
          "src": this.eBookmarkWidget.folderUrl + 'images/loading.gif'
        }, bookmarkActionsDiv);
        domStyle.set(loadingImg, 'display', 'none');
      }

      if(bookmark.useradded){
        deleteImg = domConstruct.create("img", {
          "class": "bookmark-delete-img",
          "src": this.eBookmarkWidget.folderUrl + 'images/i_remove_info.png',
          "title": this.nls.labelDelete
        }, bookmarkActionsDiv);
      }else{
        deleteImg = null;
      }

      if(bookmark.useradded){
        editImg = domConstruct.create("img", {
          "class": "bookmark-edit-img",
          "src": this.eBookmarkWidget.folderUrl + 'images/edit_default.png',
          "title": this.nls.labelEdit
        }, bookmarkActionsDiv);
      }else{
        editImg = null;
      }

      var tableNode = null;
      if (bookmark.items) {
        //add a tr node to toTableNode.
        var trNode = domConstruct.create('tr', {
          'class': ''
        }, toTableNode);

        var tdNode = domConstruct.create('td', {
          'class': '',
          'colspan': '3'
        }, trNode);

        tableNode = domConstruct.create('table', {
          'class': 'bookmark-sub-node'
        }, tdNode);

        if(bookmark.expanded){
          domStyle.set(tableNode, 'display', 'table');
        }
      }

      //bind event
      this.own(on(bookmarkTitleTdNode,
                  'click',
                lang.hitch(this,
                           this._onRowTrClick,
                           bookmark,
                           imageExpandNode,
                           bookmarkTrNode,
                           loadingImg,
                           deleteImg,
                           tableNode,
                           parent)));

      if(deleteImg){
        this.own(on(deleteImg,
                    'click',
                  lang.hitch(this,
                             this._onRowDeleteClick,
                             bookmark,
                             bookmarkTrNode,
                             parent)));
      }

      if(editImg){
        this.own(on(editImg,
                    'click',
                  lang.hitch(this,
                             this._onRowEditClick,
                             bookmark,
                             bookmarkTrNode,
                             parent)));
      }

      if(expandImageDiv){
        this.own(on(expandImageDiv,
                    'click',
                  lang.hitch(this,
                             this._onRowExpandClick,
                             bookmark,
                             imageExpandNode,
                             bookmarkTrNode,
                             loadingImg,
                             deleteImg,
                             tableNode,
                             parent)));
      }

      this.own(on(bookmarkTrNode,
                'mouseover',
                lang.hitch(this, this._onLayerNodeMouseover, bookmarkTrNode)));
      this.own(on(bookmarkTrNode,
                'mouseout',
                lang.hitch(this, this._onLayerNodeMouseout, bookmarkTrNode)));

      return {currentNode: bookmarkTrNode, subNode: tableNode};
    },

    clearSelected: function() {
      if(this._currentSelectedBookmarkRowNode){
        domClass.remove(this._currentSelectedBookmarkRowNode, 'jimu-widget-row-selected');
      }
    },

    // return current state:
    //   true:  fold,
    //   false: unfold
    _fold: function(bookmark, imageExpandNode, subNode) {
      /*jshint unused: false*/
      /* global isRTL*/
      var state;
      if (domStyle.get(subNode, 'display')  === 'none') {
        //unfold
        domStyle.set(subNode, 'display', 'table');
        domAttr.set(imageExpandNode, 'src', this.eBookmarkWidget.folderUrl + 'images/v.png');
        state = false;//unfold
      } else {
        //fold
        domStyle.set(subNode, 'display', 'none');
        var src;
        if(isRTL) {
          src = this.eBookmarkWidget.folderUrl + 'images/v_left.png';
        } else {
          src = this.eBookmarkWidget.folderUrl + 'images/v_right.png';
        }
        domAttr.set(imageExpandNode, 'src', src);
        state = true;// fold
      }
      return state;
    },

    _onLayerNodeMouseover: function(layerTrNode) {
      domClass.add(layerTrNode, "bookmark-row-mouseover");
    },

    _onLayerNodeMouseout: function(layerTrNode) {
      domClass.remove(layerTrNode, "bookmark-row-mouseover");
    },

    _onRowTrClick: function(bookmark, imageShowLegendNode, bookmarkTrNode, loadingImg, deleteImg, subNode, parent) {
      if(loadingImg){
        domStyle.set(loadingImg, 'display', 'none');
        if(deleteImg){
          domStyle.set(deleteImg, 'display', '');
        }
      }
      this._changeSelectedBookmarkRow(bookmarkTrNode, loadingImg, deleteImg, bookmark, parent);
    },

    _onRowExpandClick: function(bookmark, imageShowLegendNode, bookmarkTrNode, loadingImg, deleteImg, subNode, parent) {
      if(loadingImg){
        domStyle.set(loadingImg, 'display', 'none');
        if(deleteImg){
          domStyle.set(deleteImg, 'display', '');
        }
      }
      if(bookmark.items){
        bookmark.expanded = !this._fold(bookmark, imageShowLegendNode, subNode);
      }
      this._changeSelectedBookmarkRow(bookmarkTrNode, loadingImg, deleteImg, bookmark, parent);
    },

    _onRowDeleteClick: function(bookmark, bookmarkTrNode, parent){
      if(this._currentSelectedBookmarkRowNode) {
        domClass.remove(this._currentSelectedBookmarkRowNode, 'jimu-widget-row-selected');
      }
      this.emit('onRowDeleteClick', bookmark, bookmarkTrNode, parent);
    },

    _onRowEditClick: function(bookmark, bookmarkTrNode, parent){
      if(this._currentSelectedBookmarkRowNode) {
        domClass.remove(this._currentSelectedBookmarkRowNode, 'jimu-widget-row-selected');
      }
      domClass.add(bookmarkTrNode, 'jimu-widget-row-selected');
      this._currentSelectedBookmarkRowNode = bookmarkTrNode;
      this.emit('onRowEditClick', bookmark, bookmarkTrNode, parent);
    },

    _changeSelectedBookmarkRow: function(bookmarkTrNode, loadingImg, deleteImg, bookmark, parent) {
      if(this._currentSelectedBookmarkRowNode) {
        domClass.remove(this._currentSelectedBookmarkRowNode, 'jimu-widget-row-selected');
      }
      domClass.add(bookmarkTrNode, 'jimu-widget-row-selected');
      this._currentSelectedBookmarkRowNode = bookmarkTrNode;
      this.emit('onRowClick', bookmarkTrNode, bookmark, deleteImg, loadingImg, parent);
    }
  });
});
