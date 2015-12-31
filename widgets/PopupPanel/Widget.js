///////////////////////////////////////////////////////////////////////////
// Popup Panel Widget - Author: Robert Scheitlin
///////////////////////////////////////////////////////////////////////////
/*global define*/
define([
  'dojo/_base/declare',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/Message',
  'esri/domUtils',
  'esri/dijit/Popup',
  'dojo/on',
  'dojo/dom-class',
  'dojo/dom-construct',
  'dojo/_base/lang',
  'dijit/layout/ContentPane',
],
  function (
    declare,
    _WidgetsInTemplateMixin,
    BaseWidget,
    Message,
    domUtils,
    Popup,
    on,
    domClass,
    domConstruct,
    lang
  ) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      // Custom widget code goes here

      baseClass: 'widget-popuppanel',
      name: 'PopupPanel',
      label: 'Popup Panel',
      popup: null,

      //methods to communication with app container:

      postCreate: function () {
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

        this.popup = this.map.infoWindow;

        this.own(on(this.popup, "selection-change", lang.hitch(this, function () {
          this.displayPopupContent(this.popup.getSelectedFeature());
        })));

        this.own(on(this.popup, "clear-features", lang.hitch(this, function () {
          if(this.instructions){
            domUtils.show(this.instructions);
            this.instructions.innerHTML = this.nls.selectfeatures;
          }
          if(this.popupContent){
            this.popupContent.set("content", "");
          }
          domUtils.hide(this.pager);
        })));

        this.own(on(this.popup, "set-features", lang.hitch(this, function(){
          if(!this.popup.features){
            domUtils.hide(this.pager);
            domUtils.show(this.instructions);
            return;
          }
          if(this.popup.features.length === 0){
            domUtils.show(this.instructions);
          }else{
            domUtils.hide(this.instructions);
          }
          this.displayPopupContent(this.popup.getSelectedFeature());
          this.featureCount.innerHTML = "(1 of " + this.popup.features.length + ")";

          //enable navigation if more than one feature is selected
          if(this.popup.features.length > 1){
            domUtils.show(this.pager);
            domClass.add(this.previous, "hidden");
            domClass.remove(this.next, "hidden");
          }else if (this.popup.features.length === 1){
            domUtils.show(this.pager);
            domClass.add(this.previous, "hidden");
            domClass.add(this.next, "hidden");
          }else{
            domUtils.hide(this.pager);
          }
        })));

        this.own(on(this.previous, "click", lang.hitch(this, function(){this.selectPrevious();})));
        this.own(on(this.next, "click", lang.hitch(this, function(){this.selectNext();})));
        this.own(on(this.btnClear, "click", lang.hitch(this, this.clearResults)));
      },

      clearResults: function() {
        if(this.instructions){
          domUtils.show(this.instructions);
          this.instructions.innerHTML = this.nls.selectfeatures;
        }
        if(this.popupContent){
          this.popupContent.set("content", "");
        }
        domUtils.hide(this.pager);
        this.popup.clearFeatures();
      },

      startup: function () {
        this.inherited(arguments);
        this.displayPopupContent(this.popup.getSelectedFeature());
      },

      onOpen: function () {
        this.map.infoWindow.set("popupWindow", false);
      },

      onClose: function () {
        this.map.infoWindow.set("popupWindow", true);
      },

      displayPopupContent: function (feature) {
        if (feature) {
          var content = feature.getContent();
          if(this.popupContent){
            this.popupContent.set("content", content);
          }
        }
      },

      selectPrevious: function () {
        this.popup.selectPrevious();
        this.featureCount.innerHTML = "(" + (this.popup.selectedIndex + 1) + " of " + this.popup.features.length + ")";
        if((this.popup.selectedIndex + 1) < this.popup.features.length){
          domClass.remove(this.next, "hidden");
        }
        if(this.popup.selectedIndex === 0){
          domClass.add(this.previous, "hidden");
        }
      },

      selectNext: function () {
        domClass.remove(this.previous, "hidden");
        this.popup.selectNext();
        this.featureCount.innerHTML = "(" + (this.popup.selectedIndex + 1) + " of " + this.popup.features.length + ")";
        if((this.popup.selectedIndex + 1) === this.popup.features.length){
          domClass.add(this.next, "hidden");
        }
      }

    });
  });
