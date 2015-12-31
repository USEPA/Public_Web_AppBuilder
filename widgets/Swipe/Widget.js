define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/on',
  'dojo/Deferred',
  'jimu/BaseWidget',
  'jimu/LayerInfos/LayerInfos',
  'dijit/_WidgetsInTemplateMixin',
  'esri/dijit/LayerSwipe',
  'dijit/form/Select'
], function(declare, array, lang, html, on, Deferred, BaseWidget, LayerInfos,
  _WidgetsInTemplateMixin, LayerSwipe) {
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-swipe',

    loaded: false,
    swipeDijit: null,
    layerInfosObj: null,
    open: false,
    _isFirst: true,
    _currentLayerId: null,
    _firstEmitChange: null, // dont't hide menu when first click icon
    _loadDef: null,

    postCreate: function() {
      this.inherited(arguments);

      this.own(on(this.swipeLayers, 'Change', lang.hitch(this, this.onSwipeLayersChange)));
      this.own(on(this.swipeLayers, 'Click', lang.hitch(this, this.onSwipeLayersClick)));
      this.own(on(
        this.swipeLayers.dropDown.domNode,
        'mouseenter',
        lang.hitch(this, this.onDropMouseEnter)
      ));
      this.own(on(
        this.swipeLayers.dropDown.domNode,
        'mouseleave',
        lang.hitch(this, this.onDropMouseLeave)
      ));
      this.own(on(this.map, 'layer-add', lang.hitch(this, this._onMainMapBasemapChange)));

      this.swipeLayers.set('disabled', true);
    },

    _loadLayerInfos: function() {
      var def = new Deferred();
      this._loadDef = def;
      if (!this.loaded) {
        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(layerInfosObj) {
            if (!def.isCanceled()) {
              this.layerInfosObj = layerInfosObj;
              this.own(on(layerInfosObj,
                'layerInfosChanged',
                lang.hitch(this, this.onLayerInfosChanged)));
              this.own(on(
                layerInfosObj,
                'layerInfosIsShowInMapChanged',
                lang.hitch(this, this.onLayerInfosIsShowInMapChanged)));

              if (this.config.style === 'scope') {
                this.hintNode.innerHTML = this.nls.spyglassText;
              } else {
                this.hintNode.innerHTML = this.nls.swipeText;
              }
              html.addClass(this.swipeIcon, 'swipe-icon-loaded');
              this.loaded = true;

              def.resolve();
            }
          }));
      } else {
        def.resolve();
      }

      return def;
    },

    _getVisibleLayerInfos: function(exception) {
      var infos = this.layerInfosObj.getLayerInfoArray();
      return array.filter(infos, function(info) {
        return info.isShowInMap() || (exception && exception === info.id);
      });
    },

    _setOptionsOfSwipeLayers: function(layerInfos) {
      var data = array.map(layerInfos, lang.hitch(this, function(info) {
        var mapInfo = {
          label: info.title,
          value: info.id
        };

        if (mapInfo.value === this._currentLayerId) {
          if (!info.isShowInMap()) {
            mapInfo.label = info.title + "(" + (this.nls.invisible || "invisible") + ")&lrm;";
          } // esle use info.title
          mapInfo.selected = true;
        } //else do nothing

        return mapInfo;
      }));
      if (data && data.length > 0) {
        this.swipeLayers.set('options', data);
      } else {
        var _oldOptions = this.swipeLayers.getOptions();
        array.forEach(_oldOptions, lang.hitch(this, function(option) {
          this.swipeLayers.removeOption(option.value);
        }));
        this.swipeLayers.reset();
      }
    },

    _loadSwipeDijit: function(layerInfos) {
      var config = lang.clone(this.config);
      if (!config.style) {
        config.style = 'vertical';
      }
      var isBasemap = false;
      var layer = this.map.getLayer(config.layer);
      if (!layer) {
        var layerId = null;
        if (layerInfos.length > 0) {
          layerId = layerInfos[0].id;
        } else {
          isBasemap = true;
        }
        config.layer = layerId;
      } // esle don't change

      this.createSwipeDijit(config.style, config.layer, true, isBasemap);
    },

    _enableSwipe: function() {
      this.swipeDijit.enable();
      this.swipeLayers.set('disabled', false);
    },

    _disableSwipe: function() {
      this.swipeDijit.disable();
      this.swipeLayers.set('disabled', true);
    },

    onOpen: function() {
      this._loadLayerInfos().then(lang.hitch(this, function() {
        if (!this.open && !this.swipeDijit && this._isFirst) {
          var infos = this._getVisibleLayerInfos();

          this._loadSwipeDijit(infos);
          this._currentLayerId = this.swipeDijit.layers[0].id;
          this._setOptionsOfSwipeLayers(infos);
          this._firstEmitChange = true;
          this.swipeLayers.set('value', this._currentLayerId);
          this.swipeLayers.set('disabled', false);
          this.open = true;
          this._isFirst = false;
        } else {
          if (!this.swipeDijit.enabled) {
            this._enableSwipe();
            this.open = true;
          } else {
            this._disableSwipe();
            this.open = false;
          }
        }
      }));
    },

    onClose: function() {
      if (this.loaded && this.open) {
        this._disableSwipe();
      } else if (!this._loadDef.isFulfilled()) {
        this._loadDef.cancel();
      }
    },

    onDropMouseEnter: function() {
      this._mouseOnDropDown = true;
    },

    onDropMouseLeave: function() {
      this._mouseOnDropDown = false;
      this.swipeLayers.dropDown.onCancel();
    },

    onMenuMouseLeave: function() {
      setTimeout(lang.hitch(this, function() {
        if (!this._mouseOnDropDown) {
          this.swipeLayers.dropDown.onCancel();
        }
      }), 10);
    },

    onSwipeLayersChange: function() {
      if (!this.swipeDijit) {
        return;
      }
      this.destroySwipeDijit();

      var layerId = this.swipeLayers.get('value');
      var isBasemap = !(!!layerId);
      this.createSwipeDijit(this.config.style || 'vertical', layerId, this.open, isBasemap);
      if (this._firstEmitChange === true) {
        this._firstEmitChange = false;
      }

      var lastLayerInfo = this.layerInfosObj.getLayerInfoById(this._currentLayerId);
      if (lastLayerInfo && !lastLayerInfo.isShowInMap()) {
        this.swipeLayers.removeOption(this._currentLayerId);
      }

      this._currentLayerId = layerId;

      // change the width of swipe menu to wrapping Select dijit
      var selectBox = html.getMarginBox(this.swipeLayers.domNode);
      // padding of swipeLayersMenu is 14, max-width of domNode is 350
      if (selectBox.w + 14 * 2 > 350) {
        html.setStyle(this.domNode, 'maxWidth', (selectBox.w + 28) + 'px');
      } else {
        html.setStyle(this.domNode, 'maxWidth', '');
      }
    },

    onSwipeLayersClick: function() {
      if (!this.swipeLayers.disabled) {
        var box = html.getMarginBox(this.swipeLayers.dropDown.domNode);
        console.log(box);
        // padding of swipeLayersMenu is 14, max-width of domNode is 350
        if (box.w + 14 * 2 > 350) {
          html.setStyle(this.domNode, 'maxWidth', (box.w + 28) + 'px');
        }
      }
    },

    createSwipeDijit: function(style, layerId, open, isBasemap) {
      var layerParams = this._getLayerParams(layerId, isBasemap);
      this.swipeDijit = new LayerSwipe({
        enabled: !!open,
        type: style,
        map: this.map,
        layers: layerParams
      }, this.layerSwipe);
      this.swipeDijit.startup();
      html.place(this.swipeDijit.domNode, this.map.root, 'before');
    },

    _getLayerParams: function(layerId, isBasemap) {
      var info = this.layerInfosObj.getLayerInfoById(layerId);
      var layerParams = [];
      if (isBasemap) {
        var basemaps = this.layerInfosObj.getBasemapLayers();
        array.forEach(basemaps, lang.hitch(this, function(basemap) {
          layerParams.push(this.map.getLayer(basemap.id));
        }));
      } else {
        info.traversal(lang.hitch(this, function(_info) {
          var layer = this.map.getLayer(_info.id);
          if (layer) {
            layerParams.push(layer);
          }
        }));
      }

      return layerParams;
    },

    destroySwipeDijit: function() {
      if (this.swipeDijit && this.swipeDijit.destroy) {
        this.swipeDijit.destroy();
        this.swipeDijit = null;

        this.layerSwipe = html.create('div', {}, this.swipeLayersMenu, 'after');
      }
    },

    onLayerInfosChanged: function(layerInfo, changedType, layerInfoSelf) {
      if (!this.swipeDijit) {
        return;
      }

      var _currentId = this.swipeLayers.get('value');
      var newLayerId = null;


      this._currentLayerId = layerInfoSelf && layerInfoSelf.id === _currentId ?
        null : // _currentLayerId be removed
        (_currentId || this._currentLayerId);

      var infos = this._getVisibleLayerInfos(this._currentLayerId);
      this._setOptionsOfSwipeLayers(infos || layerInfo);
      if (changedType === 'removed') {
        if (_currentId === layerInfoSelf.id) { // remove currentLayer
          if (this._currentLayerId || (infos[0] && infos[0].id)) {
            newLayerId = this._currentLayerId || infos[0].id;
          } else { // only the basemap
            this.destroySwipeDijit();
            this.createSwipeDijit(this.config.style || 'vertical', null, this.open, true);
          }
        } // remove others do nothing
      } else if (changedType === 'added') {
        newLayerId = this.swipeDijit.layers[0].id;
      }
      this.swipeLayers.set('value', newLayerId);
    },

    onLayerInfosIsShowInMapChanged: function() {
      if (!this.swipeDijit) {
        return;
      }

      var infos = this._getVisibleLayerInfos(this._currentLayerId);
      this._setOptionsOfSwipeLayers(infos);

      var currentLayers = this.swipeDijit.layers;
      var basemaps = this.layerInfosObj.getBasemapLayers();
      var swipeBasemap = array.every(basemaps, function(bm) {
        return array.some(currentLayers, function(cl) {
          return cl.id === bm.id;
        });
      });
      if (swipeBasemap && infos && infos[0] && infos[0].id) {
        this.swipeLayers.set('value', infos[0].id);
        // there have a bug in Select dijit,so call this method manually
        this.onSwipeLayersChange();
      }

    },

    _onMainMapBasemapChange: function(evt) {
      if (!(evt.layer && evt.layer._basemapGalleryLayerType)) {
        return;
      }
      var options = this.swipeLayers.get('options');
      if (options && options.length > 0) {
        return;
      } else if (this.loaded) {
        this.destroySwipeDijit();

        this.createSwipeDijit(this.config.style || 'vertical', null, this.open, true);
      }
    },

    destroy: function() {
      this.destroySwipeDijit();
      this.inherited(arguments);
    }
  });
});