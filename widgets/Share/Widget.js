///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB Share Widget
///////////////////////////////////////////////////////////////////////////
/*global define, console, window, location*/
define(['dojo/Evented',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/has',
    'esri/kernel',
    'dojo/_base/html',
    'dojo/on',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/dom-attr',
    'dojo/dom-construct',
    'esri/request',
    'esri/urlUtils',
    'dojo/number',
    'dojo/_base/event',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/dijit/Message',
    'esri/SpatialReference',
    'dojo/Deferred',
    'esri/config',
    'jimu/dijit/CheckBox'
  ],
  function (Evented, declare, lang, has, esriNS, html, on, domClass, domStyle, domAttr, domConstruct, esriRequest, urlUtils, number, event, _WidgetsInTemplateMixin, BaseWidget, Message, SpatialReference, Deferred, esriConfig) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin, Evented], {
      name: 'Share this map',
      baseClass: 'widget-share',
      url: window.location.href,
      embedSizes: [
        {
          'width': '100%',
          'height': '640px'
          }, {
          'width': '100%',
          'height': '480px'
          }, {
          'width': '100%',
          'height': '320px'
          }, {
          'width': '800px',
          'height': '600px'
          }, {
          'width': '640px',
          'height': '480px'
          }, {
          'width': '480px',
          'height': '320px'
          }
        ],
      useExtent: null,
      mailURL: 'mailto:%20?subject={title}&body={summary}%20{url}',
      facebookURL: 'https://www.facebook.com/sharer/sharer.php?s=100&p[url]={url}&p[images][0]={image}&p[title]={title}&p[summary]={summary}',
      twitterURL: 'https://twitter.com/intent/tweet?url={url}&text={title}&hashtags={hashtags}',
      googlePlusURL: 'https://plus.google.com/share?url={url}',
      bitlyAPI: location.protocol === 'https:' ? 'https://api-ssl.bitly.com/v3/shorten' : 'http://api.bit.ly/v3/shorten',
      bitlyLogin: '',
      bitlyKey: '',
      title: '',
      image: '',
      summary: '',
      hashtags: '',
      embedHeight: null,
      embedWidth: null,
      extentEvt: null,

      postCreate: function () {
        this.inherited(arguments);
        this._extentInput.onChange = lang.hitch(this, this._useExtentUpdate);
        this.useExtent = this.config.useExtent || false;
        this._setExtentChecked();
        this.title = this.config.title || window.document.title;
        this.bitlyLogin = this.config.bitlyLogin;
        this.bitlyKey = this.config.bitlyKey;
        this.image = this.config.image;
        this.summary = this.config.summary;
        this.hashtags = this.config.hashtags;

        this.watch('url', this._updateUrl);
        this.watch('embedSizes', this._setSizeOptions);
        this.watch('embed', this._updateEmbed);
        this.watch('bitlyUrl', this._updateBitlyUrl);
        this.watch('useExtent', this._useExtentChanged);

        this._updateUrl();
        this._shareLink();

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

      startup: function () {
        this.inherited(arguments);
        this._init();
      },

      onOpen: function () {
        this.inherited(arguments);
      },

      destroy: function () {
        this.inherited(arguments);
      },

      _setExtentChecked: function () {
        this._extentInput.setValue(this.useExtent);
        if (this.useExtent) {
          this.extentEvt = this.own(this.map.on('extent-change', lang.hitch(this, function () {
            this._updateUrl();
          })));
        } else {
          if (this.extentEvt) {
            this.extentEvt.remove();
          }
        }
      },

      _useExtentUpdate: function () {
        this.set('useExtent', this._extentInput.getValue());
      },

      _useExtentChanged: function () {
        this._updateUrl();
        this._shareLink();
      },

      _setSizeOptions: function () {
        // clear select menu
        this._comboBoxNode.innerHTML = '';
        // if embed sizes exist
        if (this.get('embedSizes') && this.get('embedSizes').length) {
          // map sizes
          for (var i = 0; i < this.get('embedSizes').length; i++) {
            if (i === 0) {
              this.set('embedWidth', this.get('embedSizes')[i].width);
              this.set('embedHeight', this.get('embedSizes')[i].height);
            }
            var option = domConstruct.create('option', {
              value: i,
              innerHTML: this.get('embedSizes')[i].width + ' x ' + this.get('embedSizes')[i].height
            });
            domConstruct.place(option, this._comboBoxNode, 'last');
          }
        }
      },

      _updateUrl: function () {
        // nothing currently shortened
        this._shortened = null;
        // no bitly shortened
        this.set('bitlyUrl', null);
        // vars
        var url = this.get('url'),
          useSeparator;
        // get url params
        var urlObject = urlUtils.urlToObject(window.location.href);
        urlObject.query = urlObject.query || {};
        urlObject.query.extent = null;
        // include extent in url
        this._projectGeometry().then(lang.hitch(this, function (result) {
          if (result) {
            var gExtent = result;
            urlObject.query.extent = gExtent.xmin.toFixed(4) + ',' + gExtent.ymin.toFixed(4) + ',' + gExtent.xmax.toFixed(4) + ',' + gExtent.ymax.toFixed(4);
          }
          // create base url
          url = window.location.protocol + '//' + window.location.host + window.location.pathname;
          // each param
          for (var i in urlObject.query) {
            if (urlObject.query[i] && urlObject.query[i] !== 'config') {
              // use separator
              if (useSeparator) {
                url += '&';
              } else {
                url += '?';
                useSeparator = true;
              }
              url += i + '=' + urlObject.query[i];
            }
          }
          // update url
          this.set('url', url);
          // reset embed code
          this._setEmbedCode();
          // set url value
          domAttr.set(this._shareMapUrlText, 'value', url);
          domAttr.set(this._linkButton, 'href', url);
        }));
      },

      _projectGeometry: function () {
        var deferred = new Deferred();
        var map = this.get("map");
        if (this.get("useExtent") && map) {
          // get map extent in geographic
          if (map.geographicExtent) {
            deferred.resolve(map.geographicExtent);
          } else {
            //project the extent to geographic
            var outSR = new SpatialReference({
              "wkid": 4326
            });
            esriConfig.defaults.geometryService.project([map.extent], outSR).then(lang.hitch(this, function (result) {
              if (result.length) {
                var projectedExtent = result[0];
                deferred.resolve(projectedExtent);
              }
            }));
          }
        } else {
          deferred.resolve(null);
        }
        return deferred.promise;
      },

      _init: function () {
        // set sizes for select box
        this._setSizeOptions();

        // set embed url
        this._updateUrl();
        // select menu change
        this.own(on(this._comboBoxNode, 'change', lang.hitch(this, function (evt) {
          this.set('embedWidth', this.get('embedSizes')[parseInt(evt.currentTarget.value, 10)].width);
          this.set('embedHeight', this.get('embedSizes')[parseInt(evt.currentTarget.value, 10)].height);
          this._setEmbedCode();
        })));
        // facebook click
        this.own(on(this._facebookButton, 'click', lang.hitch(this, function () {
          this._configureShareLink(this.get('facebookURL'));
        })));
        // twitter click
        this.own(on(this._twitterButton, 'click', lang.hitch(this, function () {
          this._configureShareLink(this.get('twitterURL'));
        })));
        // google plus click
        this.own(on(this._gpulsButton, 'click', lang.hitch(this, function () {
          this._configureShareLink(this.get('googlePlusURL'));
        })));
        // email click
        this.own(on(this._emailButton, 'click', lang.hitch(this, function () {
          this._configureShareLink(this.get('mailURL'), true);
        })));
        // link box click
        this.own(on(this._shareMapUrlText, 'click', lang.hitch(this, function () {
          this._shareMapUrlText.setSelectionRange(0, 9999);
        })));
        // link box mouseup stop for touch devices
        this.own(on(this._shareMapUrlText, 'mouseup', function (evt) {
          event.stop(evt);
        }));
        // embed box click
        this.own(on(this._embedNode, 'click', lang.hitch(this, function () {
          this._embedNode.setSelectionRange(0, 9999);
        })));
        // embed box mouseup stop for touch devices
        this.own(on(this._embedNode, 'mouseup', function (evt) {
          event.stop(evt);
        }));

        // loaded
        this.set('loaded', true);
        this.emit('load', {});
      },

      _updateEmbed: function () {
        domAttr.set(this._embedNode, 'value', this.get('embed'));
      },

      _setEmbedCode: function () {
        var es = '<iframe width=\'' + this.get('embedWidth') + '\' height=\'' + this.get('embedHeight') + '\' src=\'' + this.get('url') + '\' frameborder=\'0\' scrolling=\'no\'></iframe>';
        this.set('embed', es);
      },

      _updateBitlyUrl: function () {
        var bitly = this.get('bitlyUrl');
        if (bitly) {
          domAttr.set(this._shareMapUrlText, 'value', bitly);
          domAttr.set(this._linkButton, 'href', bitly);
        }
      },

      _shareLink: function () {
        if (this.get('bitlyAPI') && this.get('bitlyLogin') && this.get('bitlyKey')) {
          var currentUrl = this.get('url');
          // not already shortened
          if (currentUrl !== this._shortened) {
            // set shortened
            this._shortened = currentUrl;
            // make request
            esriRequest({
              url: this.get('bitlyAPI'),
              callbackParamName: 'callback',
              content: {
                uri: currentUrl,
                login: this.get('bitlyLogin'),
                apiKey: this.get('bitlyKey'),
                f: 'json'
              },
              load: lang.hitch(this, function (response) {
                if (response && response.data && response.data.url) {
                  this.set('bitlyUrl', response.data.url);
                }
              }),
              error: function (error) {
                console.log(error);
              }
            });
          }
        }
      },

      _configureShareLink: function (Link, isMail) {
        // replace strings
        var fullLink = lang.replace(Link, {
          url: encodeURIComponent(this.get('bitlyUrl') ? this.get('bitlyUrl') : this.get('url')),
          image: encodeURIComponent(this.get('image')),
          title: encodeURIComponent(this.get('title')),
          summary: encodeURIComponent(this.get('summary')),
          hashtags: encodeURIComponent(this.get('hashtags'))
        });
        // email link
        if (isMail) {
          window.location.href = fullLink;
        } else {
          window.open(fullLink, 'share', true);
        }
      }

    });
    return clazz;
  });
