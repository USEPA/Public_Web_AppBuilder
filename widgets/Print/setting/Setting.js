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
    'jimu/BaseWidgetSetting',
    'dijit/_WidgetsInTemplateMixin',
    "dojo/_base/lang",
    'dojo/on',
    'dojo/json',
    'dojo/Deferred',
    "dojo/dom-style",
    "dojo/dom-attr",
    "esri/request",
    "esri/IdentityManager",
    'jimu/dijit/Message',
    'jimu/portalUtils',
    'jimu/portalUrlUtils',
    "dojo/store/Memory",
    'dijit/form/ValidationTextBox',
    'dijit/form/ComboBox'
  ],
  function(
    declare,
    BaseWidgetSetting,
    _WidgetsInTemplateMixin,
    lang,
    on,
    dojoJSON,
    Deferred,
    domStyle,
    domAttr,
    esriRequest,
    IdentityManager,
    Message,
    portalUtils,
    portalUrlUtils,
    Memory) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-print-setting',
      memoryFormat: new Memory(),
      memoryLayout: new Memory(),
      _portalPrintTaskURL: null,

      startup: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
        domAttr.set(this.checkImg, 'src', require.toUrl('jimu') + "/images/loading.gif");
        this.own(on(this.serviceURL, 'Change', lang.hitch(this, this.onUrlChange)));
      },

      onUrlChange: function() {
        var taskUrl = this.serviceURL.get('value');
        var _handleAs = 'json';
        if (taskUrl) {
          domStyle.set(this.checkProcessDiv, "display", "");
          this.memoryFormat.data = {};
          this.memoryLayout.data = {};
          this.defaultFormat.set('store', this.memoryFormat);
          this.defaultLayout.set('store', this.memoryLayout);
          this.defaultFormat.set('value', "");
          this.defaultLayout.set('value', "");
          domStyle.set(this.defaultFormat.domNode.parentNode.parentNode, 'display', 'none');
          domStyle.set(this.defaultLayout.domNode.parentNode.parentNode, 'display', 'none');
          
          var serviceUrl = portalUrlUtils.setHttpProtocol(this.serviceURL.get('value'));
          var portalNewPrintUrl = portalUrlUtils.getNewPrintUrl(this.appConfig.portalUrl);

          if (serviceUrl === portalNewPrintUrl ||
            /sharing\/tools\/newPrint$/.test(serviceUrl)) {
            _handleAs = 'text';
          }
          this._getPrintTaskInfo(taskUrl, _handleAs);
        }
      },

      _getPrintTaskInfo: function(taskUrl, handle) {
        // portal own print url: portalname/arcgis/sharing/tools/newPrint
        esriRequest({
          url: taskUrl,
          content: {
            f: "json"
          },
          handleAs: handle || "json",
          callbackParamName: "callback",
          timeout: 60000,
          load: lang.hitch(this, this._handlePrintInfo),
          error: lang.hitch(this, this._handleError)
        });
      },

      _handleError: function(err) {
        domStyle.set(this.checkProcessDiv, "display", "none");
        var popup = new Message({
          message: err.message,
          buttons: [{
            label: this.nls.ok,
            onClick: lang.hitch(this, function() {
              popup.close();
            })
          }]
        });
      },

      _handlePrintInfo: function(rData) {
        var data = null;
        try {
          if (typeof rData === 'string') {
            data = dojoJSON.parse(rData);
          } else {
            data = rData;
          }

          //{"error":{"code":499,"message":"Token Required","details":[]}}
          if (data.error && data.error.code) {
            var taskUrl = this.serviceURL.get('value');
            this._getPrintTaskInfo(taskUrl, 'json');
            return;
          }
        } catch (err) {
          var serviceUrl = portalUrlUtils.setHttpProtocol(this.serviceURL.get('value')),
            portalNewPrintUrl = portalUrlUtils.getNewPrintUrl(this.appConfig.portalUrl);

          if (serviceUrl === portalNewPrintUrl ||
            /sharing\/tools\/newPrint$/.test(serviceUrl)) { // portal own print url
            domStyle.set(this.checkProcessDiv, "display", "none");
            domStyle.set(this.defaultFormat.domNode.parentNode.parentNode, 'display', 'none');
            domStyle.set(this.defaultLayout.domNode.parentNode.parentNode, 'display', 'none');
          } else {
            this._handleError(err);
          }
          return;
        }

        domStyle.set(this.checkProcessDiv, "display", "none");
        domStyle.set(this.defaultFormat.domNode.parentNode.parentNode, 'display', '');
        domStyle.set(this.defaultLayout.domNode.parentNode.parentNode, 'display', '');
        if (data && data.parameters) {
          var len = data.parameters.length;
          for (var i = 0; i < len; i++) {
            var param = data.parameters[i];
            if (param.name === "Format" || param.name === "Layout_Template") {
              var values = data.parameters[i].choiceList;
              var n = values.length;
              var json = [];
              for (var m = 0; m < n; m++) {
                json.push({
                  name: values[m],
                  id: values[m]
                });
              }
              var defaultValue = data.parameters[i].defaultValue;

              if (param.name === "Format") {
                this.memoryFormat.data = json;
                this.defaultFormat.set('store', this.memoryFormat);
                if (this.config.serviceURL === this.serviceURL.get('value') &&
                  this.config.defaultFormat) {
                  this.defaultFormat.set('value', this.config.defaultFormat);
                } else {
                  this.defaultFormat.set('value', defaultValue);
                }
              } else {
                this.memoryLayout.data = json;
                this.defaultLayout.set('store', this.memoryLayout);
                if (this.config.serviceURL === this.serviceURL.get('value') &&
                  this.config.defaultLayout) {
                  this.defaultLayout.set('value', this.config.defaultLayout);
                } else {
                  this.defaultLayout.set('value', defaultValue);
                }
              }
            }
          }
        }
      },

      setConfig: function(config) {
        this.config = config;
        this.loadPrintURL(config);

        if (config.defaultTitle) {
          this.defaultTitle.set('value', config.defaultTitle);
        } else {
          this.defaultTitle.set('value', "ArcGIS WebMap");
        }

        if (config.defaultAuthor) {
          this.defaultAuthor.set('value', config.defaultAuthor);
        } else {
          this.defaultTitle.set('value', "Web AppBuilder for ArcGIS");
        }

        if (config.defaultCopyright) {
          this.defaultCopyright.set('value', config.defaultCopyright);
        }
      },

      getConfig: function() {
        if (!this.serviceURL.get('value')) {
          var popup = new Message({
            message: this.nls.warning,
            buttons: [{
              label: this.nls.ok,
              onClick: lang.hitch(this, function() {
                popup.close();
              })
            }]
          });
          return false;
        }
        this.config.serviceURL = this.serviceURL.get('value');
        this.config.defaultTitle = this.defaultTitle.get('value');
        this.config.defaultAuthor = this.defaultAuthor.get('value');
        this.config.defaultCopyright = this.defaultCopyright.get('value');
        this.config.defaultFormat = this.defaultFormat.get('value');
        this.config.defaultLayout = this.defaultLayout.get('value');
        return this.config;
      },

      loadPrintURL: function() {
        this._getPrintTaskURL(this.appConfig.portalUrl)
          .then(lang.hitch(this, function(printServiceUrl) {
            this.serviceURL.set('value', printServiceUrl);
          }));
      },

      _getPrintTaskURL: function(portalUrl) {
        var printDef = new Deferred();
        if (this.config && this.config.serviceURL) {
          printDef.resolve(this.config.serviceURL);
          return printDef;
        }
        var def = portalUtils.getPortalSelfInfo(portalUrl);
        def.then(lang.hitch(this, function(response) {
          var printServiceUrl = response && response.helperServices &&
            response.helperServices.printTask && response.helperServices.printTask.url;
          if (printServiceUrl) {
            printDef.resolve(printServiceUrl);
          } else {
            printDef.reject('error');
          }
        }), lang.hitch(this, function(err) {
          new Message({
            message: this.nls.portalConnectionError
          });
          printDef.reject('error');
          console.error(err);
        }));

        return printDef;
      }
    });
  });