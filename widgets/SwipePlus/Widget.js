define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/_base/fx',
  'dojo/_base/lang',
  'dojo/dom-attr',
  'dojo/dom-class',
  'dojo/dom-construct',
  'dojo/dom-geometry',
  'dojo/dom-style',
  'dojo/has',
  'dojo/on',
  'dojo/query',
  'jimu/BaseWidget',
  'jimu/LayerInfos/LayerInfos',
  'dijit/_WidgetsInTemplateMixin',
  'esri/dijit/LayerSwipe',
  'esri/geometry/mathUtils',
  'dojox/form/CheckedMultiSelect',
  './_WidgetMetadataMixin/Mixin',  //lcs - Widget Metadata
  'jimu/dijit/RadioBtn'

], function(
  declare, 
  array, 
  baseFx, 
  lang, 
  domAttr, 
  domClass, 
  domConstruct, 
  domGeom, 
  domStyle, 
  has,
  on, 
  query, 
  BaseWidget, 
  LayerInfos, 
  _WidgetsInTemplateMixin, 
  LayerSwipe, 
  mathUtils, 
  CheckedMultiSelect,
  _WidgetMetadataMixin) { 
  return declare([BaseWidget, _WidgetsInTemplateMixin, _WidgetMetadataMixin], {
    baseClass: 'jimu-widget-swipe-plus',
    loaded: false,
    swipeDijit: null,
    layerInfosObj: null,
    open: false,
    defaultStyle: 'vertical',
    defaultScopeSize: 'medium',
    defaultSwipeLayerHeight: 100,
    smallScope: 121,
    mediumScope: 261,
    largeScope: 401,
    hasTouch: has('touch'),
    
    postCreate: function() {
      this._WidgetMetadataMixinPath = 'widgets/SwipePlus/_widgetMetadataMixin';
      this.inherited(arguments);
    },
      
    startup: function() {
      this.inherited(arguments);
      
      if (!this.hasTouch) {
        domStyle.set(this.closeArea, 'display', 'none');
      }
      
      // The WelWhatDisHelpAbout widget keys on this role to style the icon in help.
      query('.jimu-widget-swipe-plus .swipe-plus-icon').attr('role', 'button');
      
      // Attach events to the swipe style radio buttons
      query('td.swipe-plus-type-radio > input', this.domNode).on('click', lang.hitch(this, function(evt) {
        this._onSwipeStyleChange(evt.target.value);
      }));
      
      // Attach events to the scope size radio buttons
      query('td.swipe-plus-size-radio > input', this.domNode).on('click', lang.hitch(this, function(evt) {
        this._onSwipeScopeSizeChange(evt.target.value);
      }));
      
      this.closeMenuAnimation = baseFx.animateProperty({
        node: this.swipePlusLayersMenu,
        duration: 1000,
        properties: {
          opacity: 0
        },
        onEnd: lang.hitch(this, function() {
          domStyle.set(this.swipePlusLayersMenu, 'display', 'none');
          this.menuCloseTimer = null;
          this.swipePlusLayersMenuOpen = false;
        })
      });
      
      this.openMenuAnimation = baseFx.animateProperty({
        node: this.swipePlusLayersMenu,
        duration: 1000,
        properties: {
          opacity: 1
        },
        beforeBegin: lang.hitch(this, function() {
          domStyle.set(this.swipePlusLayersMenu, 'display', 'block');
        }),
        onEnd: lang.hitch(this, function() {
          this.swipePlusLayersMenuOpen = true;
        })
      });
      
      this.swipePlusLayers = new CheckedMultiSelect({
        dropDown: false,
        multiple: true,
        required: false,
        style: 'height: ' + (this.config.swipeLayerHeight || this.defaultSwipeLayerHeight) + 'px;',
        onChange: lang.hitch(this, '_onSwipeLayersChange')
      }, 'swipePlusLayers');
      
      this.own(on(this.map, 'layer-add', lang.hitch(this, this._onMainMapBasemapChange)));

      LayerInfos.getInstance(this.map, this.map.itemInfo).then(lang.hitch(this, function(layerInfosObj) {
        this.layerInfosObj = layerInfosObj;
        this.own(layerInfosObj.on(
          'layerInfosChanged',
          lang.hitch(this, this.onLayerInfosChanged)));
        var infos = layerInfosObj.getLayerInfoArray();

        this._setSwipeLayerOptions(infos);

        this._loadSwipeDijit(infos);
        
        // Only use the LayerIds that have a corresponding layer in infos.
        var layerIds = this._getSwipeDijitLayerIds();
        var validIds = [];
        array.some(infos, function(info) {
          if (layerIds.indexOf(info.id) !== -1) {
            validIds.push(info.id);
            return validIds.length === layerIds.length;
          }
        });
        
        this.swipePlusLayers.set('value', validIds);
        
        domStyle.set(this.swipePlusImg, 'backgroundImage', 'url("' + this.folderUrl + 'css/images/icon.png")');

        this.loaded = true;
      }));
    },
    
    _setSwipeLayerOptions: function(layerInfos) {
      var options = [];
      var data = array.map(layerInfos, function(info) {
        return {
          label: info.title,
          value: info.id
        };
      });
      
      array.forEach(data, function(option) {
        options.push(domConstruct.create('option', option));
      }, this);
      
      this.swipePlusLayers.set('options', options);
      domStyle.set(this.swipePlusLayers.selectNode, 'height', (this.config.swipeLayerHeight || this.defaultSwipeLayerHeight) + 'px');
      this.swipePlusLayers.startup();  // We need to call startup() each time the options change.
    },

    _loadSwipeDijit: function(layerInfos) {
      this.swipeStyle = this.swipeStyle || this.config.style || this.defaultStyle;
      this.scopeSize = this.scopeSize || this.config.scopeSize || this.defaultScopeSize;
      this.swipeCenter = null;
      this.swipeX = null;
      this.swipeY = null;

      query('td.swipe-plus-type-radio > input[value=' + this.swipeStyle + ']', this.domNode).attr('checked', true);

      this._setSwipeStyleHint(this.swipeStyle);

      query('td.swipe-plus-size-radio > input[value=' + this.scopeSize + ']', this.domNode).attr('checked', true);
      
      this._setScopeSizeDisabled(this.swipeStyle !== 'scope');
        
      var isBasemap = false;
      var layerIds = this.config.layers || [];
      if (layerInfos.length === 0) {
        isBasemap = true;
      } 
      
      var index;
      var validIds = [];
      array.some(layerInfos, function(layerInfo) {
        index = layerIds.indexOf(layerInfo.id);
        if (index !== -1) {
          validIds.push(layerInfo.id);
          return validIds.length === layerIds.length;
        }
      });
      
      if (!isBasemap && validIds.length === 0) {
        validIds = [layerInfos[0].id];
      }

      this.createSwipeDijit(this.swipeStyle, validIds, this.open, isBasemap);
    },
    
    _onSwipeLayersChange: function(layerIds) {
      if (!this.swipeDijit) {
        return;
      } else if (layerIds.length) {
        var open = this.swipeDijit.enabled;
        this.destroySwipeDijit(open);
        this.createSwipeDijit(this.swipeStyle, layerIds, open);
      }
    },
    
    _onSwipeStyleChange: function(style) {
      var open = this.swipeDijit.enabled;
      var layerIds = this._getSwipeDijitLayerIds();
      this.destroySwipeDijit(true);
      this.swipeStyle = style;
      this.createSwipeDijit(this.swipeStyle, layerIds, open);
      this._setSwipeStyleHint(style);
      this._setScopeSizeDisabled(this.swipeStyle !== 'scope');
    },
    
    _setScopeSizeDisabled: function(disabled) {
      query('td.swipe-plus-size', this.domNode).style('opacity', disabled ? 0.5 : 1.0);
      query('td.swipe-plus-size-radio > input', this.domNode).attr('disabled', disabled);
    },
    
    _setSwipeStyleHint: function(style) {
      switch (style) {
        case 'vertical':
          this.hintNode.innerHTML = this.nls.verticalText;
          break;
        case 'horizontal':
          this.hintNode.innerHTML = this.nls.horizontalText;
          break;
        case 'scope':
          this.hintNode.innerHTML = this.nls.scopeText;
          break;
      }
    },
    
    _disablePopupsOnScopeDrag: function() {
      // Disable popups when scope is moved.  Eliminates console errors in IE9 (+?) && Chrome.
      // Eliminates annoying popups in FireFox every time the scope is moved.
      // Reason: IE and Chrome mouse events don't have screenPoint properties and FireFox mouse events do.
      query('.scope', this.swipeDijit.domNode).on('mousedown, mouseup', lang.hitch(this, function(evt) {
        if (evt.type === 'mousedown') {
          this.map.setInfoWindowOnClick(false);
          this.mouseDownPt = { x: evt.pageX, y: evt.pageY };
        } else {
          var mouseUpPt = { x: evt.pageX, y: evt.pageY };
          if (this.mouseDownPt && mathUtils.getLength(this.mouseDownPt, mouseUpPt) > 5) {
            setTimeout(lang.hitch(this, function() {
              this.map.setInfoWindowOnClick(true);
            }), 100);
          } else {
            this.map.setInfoWindowOnClick(true);
          }
          this.mouseDownPt = null;
        }
      }));
    },
    
    _onSwipeScopeSizeChange: function(size) {
      var open = this.swipeDijit.enabled;
      var layerIds = this._getSwipeDijitLayerIds();
      this.destroySwipeDijit(true);
      this.scopeSize = size;
      this.createSwipeDijit('scope', layerIds, open);
    },
    
    _getSwipeDijitLayerIds: function() {
      // Sometimes this.swipeDijit.layers is an array of strings (layer ids)
      // and sometimes it is an array of layer objects. :-)
      return array.map(this.swipeDijit.layers, function(layer) {
        return typeof layer === 'object' ? layer.id : layer;
      });
    },
    
    _saveSwipePosition: function() {
      switch(this.swipeStyle) {
        case 'vertical':
          this.swipeX = query('div.vertical', this.swipeDijit.domNode).style('left')[0];
          break;
        case 'horizontal':
          this.swipeY = query('div.horizontal', this.swipeDijit.domNode).style('top')[0];
          break;
        case 'scope':
          var scope = query('div.scope', this.swipeDijit.domNode)[0];
          var box = domGeom.getMarginBox(scope);
          if (box.l && box.t) {
            this.swipeCenter = { x: box.l + box.w / 2, y: box.t + box.h / 2 };
          }
          break;
      }
    },
    
    _restoreSwipeLocation: function(style) {
      switch(style) {
        case 'vertical':
          var left = this.swipeX || this.map.width / 4;
          query('div.vertical', this.swipeDijit.domNode).style('left', left + 'px');
          break;
        case 'horizontal':
          var top = this.swipeY || this.map.height / 4;
          query('div.horizontal', this.swipeDijit.domNode).style('top', top + 'px');
          break;
        case 'scope':
          var center = this.swipeCenter || { x: this.map.width / 2, y: this.map.height / 2 };
          var scopeSize, image;
          switch (this.scopeSize) {
            case 'small':
              scopeSize = this.smallScope;
              image = 'url("' + this.folderUrl + 'images/scope_' + this.scopeSize + '.png")';
              break;
            case 'medium':
              scopeSize = this.mediumScope;
              // The image for the medium scope is identical to the scope image in the 
              // LayerSwipe dijit (http://js.arcgis.com/3.13/esri/dijit/images/scope.png).
              image = 'url("' + this.folderUrl + 'images/scope_' + this.scopeSize + '.png")';
              break;
            case 'large':
              scopeSize = this.largeScope;
              image = 'url("' + this.folderUrl + 'images/scope_' + this.scopeSize + '.png")';
              break;
          }
          query('div.scope', this.swipeDijit.domNode).style({
            backgroundImage: image,
            width: scopeSize + 'px',
            height: scopeSize + 'px',
            left: (center.x - scopeSize / 2) + 'px',
            top: (center.y - scopeSize / 2) + 'px'
          });
          break;
      }
      this.swipeDijit.swipe();
    },
    
    _onSwipeDijitScopeMouseEvents: function(evt) { 
      var mapBox, box, center, inCircle;
      if (evt.type === 'mouseleave') {
        domStyle.set(evt.target, 'cursor', inCircle ? 'default' : 'move');
      } else {
        mapBox = domGeom.getMarginBox(this.map.container);
        box = domGeom.getMarginBox(evt.target);
        center = { x: box.l + box.w / 2, y: box.t + box.h / 2 };
        inCircle = mathUtils.getLength(center, { x: evt.pageX - mapBox.l, y: evt.pageY - mapBox.t }) < (box.h - 10) / 2;
        domStyle.set(evt.target, 'cursor', inCircle ? 'default' : 'move');
      }
    },
    
    onIconClick: function() {
      if (!this.loaded || !this.swipeDijit) {
        return;
      }
      
      if (!this.swipeDijit.enabled) {
        this.swipeDijit.enable();
        domStyle.set(this.swipePlusLayersMenu, { display: 'block', opacity: 1 });
        domAttr.set(this.swipePlusIcon, 'title', this.nls.disableTips);
        domClass.add(this.swipePlusIcon, 'swipe-plus-icon-enable');
        this.swipePlusLayersMenuOpen = true;
        this.open = true;
      } else if (this.hasTouch && !this.swipePlusLayersMenuOpen) {
        domStyle.set(this.swipePlusLayersMenu, { display: 'block', opacity: 1 });
        this.swipePlusLayersMenuOpen = true;
      } else {
        this.swipeDijit.disable();
        domStyle.set(this.swipePlusLayersMenu, { display: 'none', opacity: 0 });
        domAttr.set(this.swipePlusIcon, 'title', this.nls.enableTips);
        domClass.remove(this.swipePlusIcon, 'swipe-plus-icon-enable');
        this.swipePlusLayersMenuOpen = false;
        this.open = false;
      }
    },

    onMouseEnter: function(evt) {
      if (this.loaded && this.swipeDijit && this.swipeDijit.enabled) {
        if (this.closeMenuAnimation._active) {
          this.closeMenuAnimation.stop();
          this.openMenuAnimation.play();
        } else if (this.menuCloseTimer) {
          clearTimeout(this.menuCloseTimer);
          this.menuCloseTimer = null;
        } else {
          this.openMenuAnimation.play();
        }
      }
      evt.preventDefault();
      evt.stopPropagation();
    },

    onCloseAreaClick: function() {
      this.closeMenuAnimation.duration = 350;
      this.closeMenuAnimation.play();
    },
    
    onMouseLeave: function() {
      if (this.loaded) {
        this.menuCloseTimer = setTimeout(lang.hitch(this, function() {
          this.closeMenuAnimation.duration = 1000;
          this.closeMenuAnimation.play();
        }), 1000);
      }
    },
    
    createSwipeDijit: function(style, layerIds, open, isBasemap) {
      var layerParams = this._getLayerParams(layerIds, isBasemap);
      this.swipeDijit = new LayerSwipe({
        enabled: !!open,
        type: style,
        map: this.map,
        layers: layerParams
      }, this.layerSwipePlus);
      this.swipeDijit.startup();
      domConstruct.place(this.swipeDijit.domNode, this.map.root, 'before');
      this._restoreSwipeLocation(style);
      if (style === 'scope') {
        this.swipeDijit.own(on(this.swipeDijit.domNode, 'mousemove, mouseleave', lang.hitch(this, '_onSwipeDijitScopeMouseEvents')));
        this._disablePopupsOnScopeDrag();
      }
    },

    _getLayerParams: function(layerIds, isBasemap) {
      var info;
      var layerParams = [];
      if (isBasemap) {
        var basemaps = this.layerInfosObj.getBasemapLayers();
        array.forEach(basemaps, lang.hitch(this, function(basemap) {
          layerParams.push(this.map.getLayer(basemap.id));
        }));
      } else {
        array.forEach(layerIds, function(layerId) {
          info = this.layerInfosObj.getLayerInfoById(layerId);
          info.traversal(lang.hitch(this, function(_info) {
            var layer = this.map.getLayer(_info.id);
            if (layer) {
              layerParams.push(layer);
            }
          }));
        }, this);
      }

      return layerParams;
    },

    destroySwipeDijit: function(savePosition) {
      if (savePosition) {
        this._saveSwipePosition();
      }
      if (this.swipeDijit && this.swipeDijit.destroy) {
        this.swipeDijit.destroy();
        this.swipeDijit = null;

        this.layerSwipePlus = domConstruct.create('div', {}, this.swipePlusLayersMenu, 'after');
      }
    },

    onLayerInfosChanged: function(layerInfo, changedType, layerInfoSelf) {
      if (!this.swipeDijit) {
        return;
      }

      var layerIds = this._getSwipeDijitLayerIds();
      var infos = this.layerInfosObj.getLayerInfoArray();
      this._setSwipeLayerOptions(infos || layerInfo);
      if (changedType === 'removed') {
        // If the layer removed was in LayerIds, recreate the widget
        var index = layerIds.indexOf(layerInfoSelf.id);
        if (index !== -1) {
          layerIds.splice(index, 1);
          this.destroySwipeDijit(true);
          this._loadSwipeDijit(infos);
        }          
      }

      this.swipePlusLayers.set('value', layerIds);
    },

    _onMainMapBasemapChange: function(evt) {
      if (!(evt.layer && evt.layer._basemapGalleryLayerType)) {
        return;
      }
      var options = this.swipePlusLayers.get('options');
      if (options && options.length > 0) {
        return;
      } else if (this.loaded) {
        var open = this.swipeDijit.enabled;
        this.destroySwipeDijit(true);

        this.createSwipeDijit(this.swipeStyle, [], open, true);
        domStyle.set(this.swipePlusLayersMenu, { display: 'none', opacity: 0 });
        this.swipePlusLayersMenuOpen = false;
      }
    },

    destroy: function() {
      this.destroySwipeDijit(true);
      this.inherited(arguments);
    }
  });
});

// TODO:

// 1. Let the user choose between vertical, horizontal, and scope. +
// 2. Reverse the behavior so it hides layers rather then shows layers. X  
//    esri/digit/LayerSwipe can't do this. HTML can only clip layers with a rectangle; cannot make a hole in a layer.
// 3. Allow basemap layers to be revealed. X (See Number 2)
// 4. Size of spotlight. +
// 5. Format radio buttons. +
// 6. Select multiple layers??? +
// 7. Use Image data rather than image. x
// 8. Don't close widget when radio button is selected. +
// 9. Fade widget out after mouse leaves. +
// 10. Location of Spotlight when changing size. +
// 11. Location of swipe bar when changing style. +
// 12. Dijit jumps and reverts size when adding a layer. +
// 13. Menu closes with each layer select. +
// 14. Make radio buttons agree with default scope size. +
// 15. Make layer checkboxes agree with configured layers. +
// 16. Disable radio buttons for size rather than hiding them. +
// http://jsfiddle.net/FNL3h/
// http://jsfiddle.net/down_quark/cNATk/