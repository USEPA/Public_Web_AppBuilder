define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dijit/_WidgetBase',
  'dojo/Evented',
  'dojo/on',
  'dojo/query',
  'jimu/MapManager',
  'dojo/dom-construct'
], function(
  declare, lang, html, _WidgetBase, Evented, on, query, MapManager, domConstruct
) {

  return declare([_WidgetBase, Evented], {
    popup: null,
    popupMobile: null,
    actionListNode: null,
    // buttonInfo = {
    //   title:
    //   baseClass:
    // }
    buttonInfo: null,

    postCreate: function() {
    // description:
    //   if provides buttonInfo parameter, add button to infoWindow
      this.inherited(arguments);
      if(this.buttonInfo) {
        this._addButtonNode();
      }
    },

    constructor: function() {
      // init popup and popupMobile object
      var mapInfoWindow = MapManager.getInstance().getMapInfoWindow();
      this.popup = mapInfoWindow.bigScreen;
      this.popupMobile = mapInfoWindow.mobile;
    },

    _addButtonNode: function() {
      this._addButtonNodeToPopup();
      this._addButtonNodeToPopupMobile();
    },

    _addButtonNodeToPopup: function() {
      //query actionList node of this.popup
      this.actionListNode = query(".actionList", this.popup.domNode)[0];


      this.popupButtonNode = domConstruct.toDom("<img src='" + this.buttonInfo.imgsrc + "' alt='" + this.buttonInfo.title + "' title='" + this.buttonInfo.title + "' border='0' width='20px' height='20px' class='action " + this.buttonInfo.baseClass + "'>");
      domConstruct.place(this.popupButtonNode, this.actionListNode);

      this.own(on(this.popupButtonNode,
                  "click",
                  lang.hitch(this, this._onButtonClick)));

      this.own(on(this.popup,
                  "selection-change",
                  lang.hitch(this, this._onSelectionChange, this.popup)));
    },

    _addButtonNodeToPopupMobile: function() {
      //query actionList node of this.popupMobile
      var mobileInfoViewItem = query(".esriMobilePopupInfoView .esriMobileInfoViewItem");
      var actionListNode = mobileInfoViewItem[mobileInfoViewItem.length -1];

      //add relationship table button in this.popupMobile
      var aNode = html.create('a', {
        "class": "action " + this.buttonInfo.baseClass,
        "href": " javascript:void(0);",
        "title": this.buttonInfo.title
      }, actionListNode);

      this.popupMobileButtonNode = html.create('span', {
        "innerHTML": this.buttonInfo.title,
        "style": "display: none"
      }, aNode);

      this.own(on(this.popupMobileButtonNode,
                  "click",
                  lang.hitch(this, this._onButtonClick)));

      this.own(on(this.popupMobile,
                  "selection-change",
                  lang.hitch(this, this._onSelectionChange, this.popupMobile)));

    },

    enableButtonNode: function() {
      html.setStyle(this.popupButtonNode, 'display', 'inline');
      html.setStyle(this.popupMobileButtonNode, 'display', 'inline');
      var actionZoomNode = query(".action.zoomTo")[0];
      html.setStyle(actionZoomNode, 'display', 'none');
      html.addClass(this.actionListNode, 'myactionlist');
    },

    disableButtonNode: function() {
      html.setStyle(this.popupButtonNode, 'display', 'none');
      html.setStyle(this.popupMobileButtonNode, 'display', 'none');
      var actionZoomNode = query(".action.zoomTo")[0];
      html.setStyle(actionZoomNode, 'display', 'inline');
      html.removeClass(this.actionListNode, 'myactionlist');
    },

    _onButtonClick: function() {
      this.emit('buttonClick', this._selectedFeature);
    },

    _onSelectionChange: function(infoWindow, evt) {
      if(evt.target.selectedIndex > -1) {
        this._selectedFeature = infoWindow.getSelectedFeature();
        this.emit('selectionChange', this._selectedFeature);
      }
    }

  });
});
