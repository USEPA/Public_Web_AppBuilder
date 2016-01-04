///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
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
  'jimu/BaseWidget',
  'jimu/dijit/TabContainer',
  'jimu/PanelManager',
  'jimu/dijit/Message',
  'jimu/dijit/DrawBox',
  'esri/toolbars/draw',
  'dojo/i18n!esri/nls/jsapi',
  'dojo/_base/lang',
  './SelectFeatureDialog',
  './DrawErrorDialog'
], function(
  declare,
  BaseWidget, TabContainer, PanelManager, Message, DrawBox, Draw,
  esriBundle, lang, SelectFeatureDialog,
  DrawErrorDialog
) {

  var clazz = declare([BaseWidget], {
    //these two properties is defined in the BaseWiget
    baseClass: 'drs-widget-report-feature',
    name: 'ReportFeature',
    _defaultToolString: '',
    buildRendering: function() {
      this.inherited(arguments);
      this._initDom();
    },

    _initDom: function() {
      var _this = this;
      this.selectFeatureDialog = new SelectFeatureDialog({
        config: this.config,
        nls: this.nls,
        map: this.map,
        // TODO: why can't I use this.selectFeatureDialog.on('Event') with these???
        onSelectFeature: function() {
          _this.close();
        },
        onInfoWindowHide: function() {
        },
        onMessage: function(msg, title) {
          _this.showMessage(msg, title);
        },
        onError: function(msg, err) {
          _this.showError(msg, err);
        }
      }, this.selectFeatureDialogNode);
      this.drawErrorDialog = new DrawErrorDialog({
        config: this.config,
        nls: this.nls,
        map: this.map,
        drawBox: new DrawBox({
          types: ["point", "polyline", "polygon"],
          showClear: false
        }),
        onDrawEnd: function() {
          _this.close();
        },
        onInfoWindowHide: lang.hitch(this, function() {
          if ((_this.selectFeatureDialog.infoWindowContent !== undefined &&
            _this.selectFeatureDialog.infoWindowContent !== null) ||
            ( _this.drawErrorDialog.infoWindowContent !== null &&
            _this.drawErrorDialog.infoWindowContent !== undefined)){
            _this.open();
            if ( _this.selectFeatureDialog.infoWindowContent){
              _this.selectFeatureDialog.infoWindowContent.destroyRecursive();
            }
            if ( _this.drawErrorDialog.infoWindowContent){
              _this.drawErrorDialog.infoWindowContent.destroyRecursive();
            }
            _this.selectFeatureDialog.infoWindowContent = null;
            _this.drawErrorDialog.infoWindowContent = null;
          }
        }),
        onMessage: function(msg, title) {
          _this.showMessage(msg, title);
        },
        onError: function(msg, err) {
          _this.showError(msg, err);
        }
      }, this.drawErrorDialogNode);
      this.tabContainer = new TabContainer({
        tabs:[{
          title: this.nls.select,
          content: this.selectTabNode
        }, {
          title: this.nls.draw,
          content: this.drawTabNode
        }],
        selected:this.nls.select
      }, this.content);
    },

    // init dialogs
    // wire up events
    postCreate: function() {
      var drsUrl = this.config.drsUrl;
      var sessionID = this.config.sessionID;
      this.inherited(arguments);
      this._initEvents();
      this.selectFeatureDialog.setDrsUrl(drsUrl);
      this.selectFeatureDialog.setReviewerSession(sessionID);
      this.drawErrorDialog.setDrsUrl(drsUrl);
      this.drawErrorDialog.setReviewerSession(sessionID);
    },    // reset dialogs on tab change
    _initEvents: function() {
      var _this = this;
      this.own(this.tabContainer.on('tabChanged', function(title) {
        _this.tabContainer.selected = title;
        _this.map.setInfoWindowOnClick(false);
        if (title === _this.nls.select) {
          if ( _this.drawErrorDialog.drawBox !== undefined){
            _this.drawErrorDialog.drawBox.deactivate();
          }
          _this.selectFeatureDialog.reset();
        } else if (title === _this.nls.draw) {
          if (_this.selectFeatureDialog.selectionToolbar !== undefined){
            _this.selectFeatureDialog.selectionToolbar.deactivate();
          }
          _this.drawErrorDialog.reset();
        }
      }));
    },
    // start up child widgets
    startup: function() {
      this.inherited(arguments);
      this.selectFeatureDialog.startup();
      this.drawErrorDialog.startup();
      this.tabContainer.startup();
    },

    // open the panel that contains this widget
    open: function() {
      var reportFeaturePanel =  this.getPanel();
      PanelManager.getInstance().openPanel(reportFeaturePanel.id);
    },

    // close the panel that contains this widget
    close: function() {
      PanelManager.getInstance().closePanel(this.id + '_panel');
    },
    onClose:function(){
      if (this.selectFeatureDialog.selectionToolbar !== null &&
      this.selectFeatureDialog.selectionToolbar !== undefined){
        this.selectFeatureDialog.selectionToolbar.deactivate();
        esriBundle.toolbars.draw.addPoint = this._defaultToolString;
      }
      this.map.setInfoWindowOnClick(true);
    },
    onOpen : function(){
      if (this._defaultToolString === ''){
        this._defaultToolString = esriBundle.toolbars.draw.addPoint;
      }
      if (this.tabContainer.selected ===  this.nls.select &&
        this.selectFeatureDialog.selectLayer.value !== ""){
        esriBundle.toolbars.draw.addPoint = this.nls.selectFeatureMapPoint;
      }
    },
    onActive : function(){
      this.map.setInfoWindowOnClick(false);
      if (this.tabContainer.selected ===  this.nls.select &&
      this.selectFeatureDialog.selectionToolbar !== null &&
      this.selectFeatureDialog.selectionToolbar !== undefined &&
      this.selectFeatureDialog.selectLayer.value !== ""){
        this.selectFeatureDialog.selectionToolbar.activate(Draw.POINT);
      }
    },
    // show  message to user
    showMessage: function(msg, title) {
      new Message({
        message: msg,
        titleLabel: title
      });
    },

    // show error message to user
    // log error details to console
    showError: function(msg, err) {
      new Message({
        message: msg,
        titleLabel: this.nls.errorTitle,
        // NOTE: this does not seem to affect the message popup style
        type: 'error'
      });
      console.error(err || msg);
    }
  });

  return clazz;
});