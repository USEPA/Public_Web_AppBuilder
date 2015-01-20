define([
    'dojo/_base/declare',
    'jimu/BaseWidget',
    'jimu/portalUtils',
    'dojo/_base/lang',
    'dojo/Deferred',
    "jimu/dijit/Message",
    'jimu/dijit/LoadingShelter',
    './Print',
    "esri/request",
    'dojo/json',
    'jimu/portalUrlUtils'
  ],
  function(
    declare, BaseWidget, portalUtils, lang, Deferred,
    Message, LoadingShelter, Print, esriRequest,
    dojoJSON, portalUrlUtils
  ) {
    return declare([BaseWidget], {
      baseClass: 'jimu-widget-print',
      name: 'Print',
      className: 'esri.widgets.Print',
      _portalPrintTaskURL: null,

      postCreate: function() {
        this.inherited(arguments);

        this.shelter = new LoadingShelter({
          hidden: true
        });
        this.shelter.placeAt(this.domNode);
        this.shelter.startup();
      },

      startup: function() {
        this.inherited(arguments);
        this.shelter.show();
        this._initPrinter();
      },

      _initPrinter: function() {
        this._getPrintTaskURL(this.appConfig.portalUrl)
          .then(lang.hitch(this, function(printServiceUrl) {
            this.shelter.show();
            var asyncDef = this.isAsync(printServiceUrl);
            asyncDef.then(lang.hitch(this, function(async) {
              this.print = new Print({
                map: this.map,
                appConfig: this.appConfig,
                printTaskURL: printServiceUrl,
                defaultAuthor: this.config.defaultAuthor,
                defaultCopyright: this.config.defaultCopyright,
                defaultTitle: this.config.defaultTitle,
                defaultFormat: this.config.defaultFormat,
                defaultLayout: this.config.defaultLayout,
                nls: this.nls,
                async: async
              });
              this.print.placeAt(this.printNode);
              this.print.startup();
            }), lang.hitch(this, function(err) {
              new Message({
                message: err.message
              });
            })).always(lang.hitch(this, function() {
              this.shelter.hide();
            }));
          }), lang.hitch(this, function(err) {
            new Message({
              message: err
            });
            console.error(err);
            this.shelter.hide();
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
      },

      isAsync: function(serviceURL) {
        var def = new Deferred();
        // portal own print url: portalname/arcgis/sharing/tools/newPrint
        var _handleAs = 'json';
        var serviceUrl = portalUrlUtils.setHttpProtocol(serviceURL);
        var portalNewPrintUrl = portalUrlUtils.getNewPrintUrl(this.appConfig.portalUrl);

        if (serviceUrl === portalNewPrintUrl ||
          /sharing\/tools\/newPrint$/.test(serviceUrl)) {
          _handleAs = 'text';
        }
        esriRequest({
          url: serviceURL,
          content: {
            f: "json"
          },
          callbackParamName: "callback",
          handleAs: _handleAs || "json",
          timeout: 60000,
          load: lang.hitch(this, function(rData) {
            var response = null;
            try {
              if (typeof rData === 'string') {
                response = dojoJSON.parse(rData);
              } else {
                response = rData;
              }
            } catch (err) {
              var serviceUrl = portalUrlUtils.setHttpProtocol(serviceURL),
                portalNewPrintUrl = portalUrlUtils.getNewPrintUrl(this.appConfig.portalUrl);
              if (serviceUrl === portalNewPrintUrl) { // portal own print url
                def.resolve(false);
              } else {
                def.reject(err);
              }
              return;
            }
            if (response.executionType === "esriExecutionTypeAsynchronous") {
              def.resolve(true);
            } else {
              def.resolve(false);
            }
          }),
          error: lang.hitch(this, function(err) {
            def.reject(err);
          })
        });

        return def;
      },

      onSignIn: function(user) {
        user = user || {};
        if (user.userId && this.print) {
          this.print.updateAuthor(user.userId);
        }
      }
    });
  });