define([
    "dojo/Evented",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/has",
    "esri/kernel",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/on",
    "dojo/text!./dijit/templates/LayerSwipe.html",
    "./nls/jsapi",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dnd/move",
    "dojo/dnd/Mover",
    "dojo/sniff",
    "dojo/dom-geometry",
    "esri/geometry/Point",
    "dojo/Deferred",
    "dojo/promise/all"
],
function (
    Evented,
    declare,
    lang,
    has, esriNS,
    _WidgetBase, _TemplatedMixin,
    on,
    dijitTemplate, i18n,
    domClass, domStyle,
    move,
    Mover,
    sniff,
    domGeom,
    Point,
    Deferred,
    all
) {
    // patch subclass Mover and patch onFirstMove so that the swipe handle
    // doesn't jump when first moved
    // remove if Dojo fixes this:  https://bugs.dojotoolkit.org/ticket/15322
    // patchedMover is used in _setSwipeType
    //
    // fix is in the default switch case:
    //      l = m.l;
    //      t = m.t;
    var patchedMover = declare([Mover], {
        onFirstMove: function (e) {
            var s = this.node.style,
                l, t, h = this.host;
            switch (s.position) {
            case "relative":
            case "absolute":
                l = Math.round(parseFloat(s.left)) || 0;
                t = Math.round(parseFloat(s.top)) || 0;
                break;
            default:
                s.position = "absolute"; // enforcing the absolute mode
                var m = domGeom.getMarginBox(this.node);
                l = m.l;
                t = m.t;
                break;
            }
            this.marginBox.l = l - this.marginBox.l;
            this.marginBox.t = t - this.marginBox.t;
            if (h && h.onFirstMove) {
                h.onFirstMove(this, e);
            }
            // Disconnect touch.move that call this function
            this.events.shift().remove();
        }
    });
    var Widget = declare("esri.dijit.LayerSwipe", [_WidgetBase, _TemplatedMixin, Evented], {
        templateString: dijitTemplate,
        options: {
            theme: "LayerSwipe",
            layers: [],
            enabled: true,
            type: "vertical",
            invertPlacement: false,
            clip: 9
        },
        // lifecycle: 1
        constructor: function (options, srcRefNode) {
            // mix in settings and defaults
            var defaults = lang.mixin({}, this.options, options);
            // widget node
            this.domNode = srcRefNode;
            this._i18n = i18n;
            // properties
            this.set("map", defaults.map);
            this.set("layers", defaults.layers);
            this.set("top", defaults.top);
            this.set("left", defaults.left);
            this.set("theme", defaults.theme);
            this.set("enabled", defaults.enabled);
            this.set("type", defaults.type);
            this.set("clip", defaults.clip);
            this.set("invertPlacement", defaults.invertPlacement);
            // listeners
            this.watch("theme", this._updateThemeWatch);
            this.watch("enabled", this._enabled);
            this.watch("type", this._type);
            this.watch("invertPlacement", this._invertPlacement);
            // classes
            this._css = {
                handleContainer: "handleContainer",
                handle: "handle"
            };
            // event listeners array
            this._listeners = [];
        },
        // start widget. called by user
        startup: function () {
            // map not defined
            if (!this.map) {
                this.destroy();
                console.log('LayerSwipe::map required');
            }
            // set layers
            this.set("layers", this.layers);
            // no layers set
            if (!this.layers.length) {
                this.destroy();
                console.log('LayerSwipe::layer required');
            }
            // wait until all layers are loaded and map is loaded
            this._allLoaded().then(lang.hitch(this, function () {
                this._init();
            }), function (error) {
                console.log('LayerSwipe::' + error.message);
            });
        },
        // connections/subscriptions will be cleaned up during the destroy() lifecycle phase
        destroy: function () {
            this._removeEvents();
            this._unclipLayers();
            this.inherited(arguments);
        },
        swipe: function () {
            this._swipe();
        },
        /* ---------------- */
        /* Public Events */
        /* ---------------- */
        // load
        // swipe
        /* ---------------- */
        /* Public Functions */
        /* ---------------- */
        enable: function () {
            this.set("enabled", true);
        },
        disable: function () {
            this.set("enabled", false);
        },
        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _allLoaded: function () {
            var loadPromises = [];
            // all layers
            for (var i = 0; i < this.layers.length; i++) {
                // if layers are set by ID string
                if (typeof this.layers[i] === 'string') {
                    // get layer
                    this.layers[i] = this.map.getLayer(this.layers[i]);
                    // if we dont have a layer
                    if (!this.layers[i]) {
                        console.log('LayerSwipe::Could not get layer by ID');
                    }
                }
                // layer deferred
                var def = new Deferred();
                // if layer isn't loaded
                if (!this.layers[i].loaded) {
                    this._layerLoadedPromise(i, def);
                } else {
                    def.resolve('layer loaded');
                }
                loadPromises.push(def.promise);
            }
            var mapLoadDef = new Deferred();
            // if map is not loaded
            if (!this.map.loaded) {
                // when map is loaded
                on.once(this.map, "load", lang.hitch(this, function () {
                    mapLoadDef.resolve('map loaded');
                }));
            } else {
                mapLoadDef.resolve('map loaded');
            }
            loadPromises.push(mapLoadDef.promise);
            return all(loadPromises);
        },
        _layerLoadedPromise: function (i, def) {
            on.once(this.layers[i], 'load', function () {
                def.resolve('layer loaded');
            });
        },
        _mb: function () {
            // set containing coordinates for move tool
            var mapBox = domGeom.getMarginBox(this.map.root);
            // return result object
            return {
                t: 0,
                l: 0,
                w: mapBox.l + mapBox.w,
                h: mapBox.h + mapBox.t
            };
        },
        _setInitialPosition: function () {
            // starting position of tool
            var left, top, swipeType, moveBox, cTop, cLeft, invertPlacement;
            // default position
            left = 0;
            top = 0;
            // get position & dimensions of movable node
            moveBox = domGeom.getMarginBox(this._moveableNode);
            // get properties
            swipeType = this.get("type");
            cTop = this.get("top");
            cLeft = this.get("left");
            invertPlacement = this.get("invertPlacement");
            // type of swipe tool
            if (swipeType === "scope") {
                // scope type
                // top position
                if (typeof cTop !== 'undefined') {
                    // use positions if set on widget
                    top = cTop;
                } else {
                    // set in middle of top
                    top = (this.map.height / 2) - (moveBox.h / 2);
                }
                // left position
                if (typeof cLeft !== 'undefined') {
                    // use positions if set on widget
                    left = cLeft;
                } else {
                    // middle of width
                    left = (this.map.width / 2) - (moveBox.w / 2);
                }
            } else if (swipeType === "horizontal") {
                // horizontal type
                var heightOffset = (this.map.height / 4) - (moveBox.h / 2);
                // set top position
                if (typeof cTop !== 'undefined') {
                    // use positions if set on widget
                    top = cTop;
                } else if (invertPlacement) {
                    // bottom to top
                    top = this.map.height - heightOffset;
                } else {
                    // top to bottom
                    top = heightOffset;
                }
            } else {
                // vertical type
                var widthOffset = (this.map.width / 4) - (moveBox.w / 2);
                // set left position
                if (typeof cLeft !== 'undefined') {
                    // use left set on widget
                    left = cLeft;
                } else if (invertPlacement) {
                    // right to left
                    left = this.map.width - widthOffset;
                } else {
                    // left to right
                    left = widthOffset;
                }
            }
            // set position
            domStyle.set(this._moveableNode, {
                top: top + "px",
                left: left + "px"
            });
        },
        _setSwipeType: function () {
            // get moveable property
            var moveable = this.get("moveable");
            // set the type
            var swipeType = this.get("type");
            if (swipeType) {
                // destroy existing swipe mover
                if (moveable) {
                    moveable.destroy();
                }
                // add type class to moveable node
                domClass.add(this._moveableNode, swipeType);
                // create moveable
                moveable = new move.parentConstrainedMoveable(this._moveableNode, {
                    area: "content",
                    within: true,
                    handle: this._moveableNode,
                    constraints: lang.hitch(this, this._mb),
                    mover: patchedMover
                });
                // set moveable property
                this.set("moveable", moveable);
                // starting swipe position
                this._setInitialPosition();
            }
        },
        _init: function () {
            // set type of swipe
            this._setSwipeType();
            // events
            this._setupEvents();
            // check if not enabled
            this._enabled();
            // we're ready
            this.set("loaded", true);
            this.emit("load", {});
            // giddyup
            this.swipe();
        },
        _removeEvents: function () {
            // remove all events
            if (this._listeners && this._listeners.length) {
                for (var i = 0; i < this._listeners.length; i++) {
                    if (this._listeners[i]) {
                        this._listeners[i].remove();
                    }
                }
            }
            // reset events array
            this._listeners = [];
        },
        _repositionMover: function () {
            var moveBox = domGeom.getMarginBox(this._moveableNode);
            // if mover is outside of where it should be
            if (moveBox && (
                // move top is more than map height
                moveBox.t > this.map.height ||
                // move top is less than zero
                moveBox.t < 0 ||
                // move left is more than map width
                moveBox.l > this.map.width ||
                // move left is less than zero
                moveBox.l < 0
            )) {
                // reset to starting position
                this._setInitialPosition();
            }
        },
        _setupEvents: function () {
            // remove any events & create events variables
            this._removeEvents();
            // map resized
            this._mapResize = on.pausable(this.map, 'resize', lang.hitch(this, function () {
                // be responsive. Don't let the slider get outside of map
                this._repositionMover();
            }));
            this._listeners.push(this._mapResize);
            // swipe move
            this._swipeMove = on.pausable(this.moveable, 'Move', lang.hitch(this, function () {
                this.swipe();
            }));
            this._listeners.push(this._swipeMove);
            // done panning
            this._swipePanEnd = on.pausable(this.map, 'pan-end', lang.hitch(this, function () {
                this._swipe();
            }));
            this._listeners.push(this._swipePanEnd);
            // map graphics start update
            this._mapUpdateStart = on.pausable(this.map, 'update-start', lang.hitch(this, function () {
                this._swipe();
            }));
            this._listeners.push(this._mapUpdateStart);
            // map graphics have been updated
            this._mapUpdateEnd = on.pausable(this.map, 'update-end', lang.hitch(this, function () {
                this._swipe();
            }));
            this._listeners.push(this._mapUpdateEnd);
            // css panning
            this._swipePan = on.pausable(this.map, 'pan', lang.hitch(this, function () {
                this._swipe();
            }));
            this._listeners.push(this._swipePan);
            // scope has been clicked
            this._toolClick = on.pausable(this._moveableNode, 'click', lang.hitch(this, function (evt) {
                if (this.get("type") === "scope") {
                    // create click position
                    evt = this._clickPosition(evt);
                    try {
                        // click event on map
                        this.map.onClick(evt, "other");
                    } catch (error) {
                        console.log("LayerSwipe::scope click error");
                    }
                    this._clickCoords = null;
                }
            }));
            this._listeners.push(this._toolClick);
            // scope has been double clicked
            this._toolDblClick = on.pausable(this._moveableNode, 'dblclick', lang.hitch(this, function (evt) {
                if (this.get("type") === "scope") {
                    // create click position
                    evt = this._clickPosition(evt);
                    try {
                        // double click event on map
                        this.map.navigationManager.mouseEvents.onDblClick(evt, "other");
                    } catch (error) {
                        console.log("LayerSwipe::scope dblclick error");
                    }
                    this._clickCoords = null;
                }
            }));
            this._listeners.push(this._toolDblClick);
            // scope mouse down click
            this._evtCoords = on.pausable(this.moveable, "MouseDown", lang.hitch(this, function (evt) {
                if (this.get("type") === "scope") {
                    // set coordinates of where click occurred
                    this._clickCoords = {
                        x: evt.x,
                        y: evt.y
                    };
                }
            }));
            this._listeners.push(this._evtCoords);
        },
        _clickPosition: function (evt) {
            // click position is the same as movable node
            if (this._clickCoords && this._clickCoords.x === evt.x && this._clickCoords.y === evt.y) {
                // convert screen position to map position
                var position = domGeom.position(this.map.root, true);
                var x = evt.pageX - position.x;
                var y = evt.pageY - position.y;
                evt.x = x;
                evt.y = y;
                evt.screenPoint = {
                    x: x,
                    y: y
                };
                evt.mapPoint = this.map.toMap(new Point(x, y, this.map.spatialReference));
            }
            return evt;
        },
        _positionValues: function (layer) {
            // position and extent variables
            var layerBox, moveBox, mapBox, clip, layerBoxTop, layerBoxLeft, invertPlacement;
            // position object to return
            var p = {
                // div node
                layerNode: layer._div,
                // graphics layer node
                layerGraphics: layer.graphics,
                // type of swipe
                swipeType: this.get("type"),
                // default position values
                l: 0,
                r: 0,
                t: 0,
                b: 0
            };
            // get values
            clip = this.get("clip");
            invertPlacement = this.get("invertPlacement");
            // moveable node position
            moveBox = domGeom.getMarginBox(this._moveableNode);
            // vertical and horizontal nodes
            if (p.swipeType === "vertical" || p.swipeType === "horizontal") {
                // if layer has a div
                if (p.layerNode) {
                    // get layer node position
                    layerBox = domGeom.getMarginBox(p.layerNode);
                    layerBoxTop = Math.abs(layerBox.t);
                    layerBoxLeft = Math.abs(layerBox.l);
                }
                // map node position
                mapBox = domGeom.getMarginBox(this.map.root);
            }
            if (p.swipeType === "vertical") {
                // x values
                if (invertPlacement) {
                    if (layerBox && layerBox.l > 0) {
                        // p.l is less than zero
                        p.l = moveBox.l - layerBoxLeft;
                        p.r = this.map.width - layerBoxLeft;
                    } else if (layerBox && layerBox.l < 0) {
                        // p.l is greater than map width
                        p.l = moveBox.l + layerBoxLeft;
                        p.r = this.map.width + layerBoxLeft;
                    } else {
                        // p.l is zero
                        p.l = moveBox.l;
                        p.r = this.map.width;
                    }
                } else {
                    if (layerBox && layerBox.l > 0) {
                        // p.l is greater than zero
                        p.l = 0 - layerBoxLeft;
                        p.r = moveBox.l - layerBoxLeft;
                    } else if (layerBox && layerBox.l < 0) {
                        // p.l is less than zero
                        p.l = 0 + layerBoxLeft;
                        p.r = moveBox.l + layerBoxLeft;
                    } else {
                        // p.l is zero
                        p.l = 0;
                        p.r = moveBox.l;
                    }
                }
                // y values
                if (layerBox && layerBox.t > 0) {
                    // top is greather than zero
                    p.t = 0 - layerBoxTop;
                    p.b = mapBox.h - layerBoxTop;
                } else if (layerBox && layerBox.t < 0) {
                    // top is less than zero
                    p.t = 0 + layerBoxTop;
                    p.b = mapBox.h + layerBoxTop;
                } else {
                    // p.t is zero
                    p.t = 0;
                    p.b = mapBox.h;
                }
            } else if (p.swipeType === "horizontal") {
                // y values
                if (invertPlacement) {
                    if (layerBox && layerBox.t > 0) {
                        // top greater than zero
                        p.t = moveBox.t - layerBoxTop;
                        p.b = this.map.height - layerBoxTop;
                    } else if (layerBox && layerBox.t < 0) {
                        // top less than zero
                        p.t = moveBox.t + layerBoxTop;
                        p.b = this.map.height + layerBoxTop;
                    } else {
                        // top is zero
                        p.t = moveBox.t;
                        p.b = this.map.height;
                    }
                } else {
                    if (layerBox && layerBox.t > 0) {
                        // top greater than zero
                        p.t = 0 - layerBoxTop;
                        p.b = moveBox.t - layerBoxTop;
                    } else if (layerBox && layerBox.t < 0) {
                        // top less than zero
                        p.t = 0 + layerBoxTop;
                        p.b = moveBox.t + layerBoxTop;
                    } else {
                        // top is zero
                        p.t = 0;
                        p.b = moveBox.t;
                    }
                }
                // x values
                if (layerBox && layerBox.l > 0) {
                    p.l = 0 - layerBoxLeft;
                    p.r = mapBox.w - layerBoxLeft;
                } else if (layerBox && layerBox.l < 0) {
                    p.l = 0 + layerBoxLeft;
                    p.r = mapBox.w + layerBoxLeft;
                } else {
                    p.l = 0;
                    p.r = mapBox.w;
                }
            } else if (p.swipeType === "scope") {
                if (p.layerGraphics) {
                    // graphics layer svg
                    p.l = moveBox.l;
                    p.r = moveBox.w;
                    p.t = moveBox.t;
                    p.b = moveBox.h;
                    // clip property is set
                    if (typeof clip !== 'undefined') {
                        // append clip values
                        p.l += clip;
                        p.r += -(clip * 2);
                        p.t += clip;
                        p.b += -(clip * 2);
                    }
                } else {
                    // div layer
                    p.l = moveBox.l;
                    p.r = p.l + moveBox.w;
                    p.t = moveBox.t;
                    p.b = p.t + moveBox.h;
                    // clip property is set
                    if (typeof clip !== 'undefined') {
                        // append clip values
                        p.l += clip;
                        p.r += -clip;
                        p.t += clip;
                        p.b += -clip;
                    }
                }
            }
            return p;
        },
        _clipLayer: function (p) {
            // if layer has a node we can clip
            if (p.layerNode) {
                // graphics layer type
                if (p.layerGraphics) {
                    // get layer transform
                    var tr = p.layerNode.getTransform();
                    // if we got the transform object
                    if (tr) {
                        // if layer is offset x
                        if (tr.hasOwnProperty('dx')) {
                            p.l += -(tr.dx);
                        }
                        // if layer is offset y
                        if (tr.hasOwnProperty('dy')) {
                            p.t += -(tr.dy);
                        }
                    }
                    // set clip on graphics layer
                    p.layerNode.setClip({
                        x: p.l,
                        y: p.t,
                        width: p.r,
                        height: p.b
                    });
                } else {
                    // Non graphics layer
                    // If CSS Transformation is applied to the layer (i.e. swipediv),
                    // record the amount of translation and adjust clip rect accordingly
                    var divStyle = p.layerNode.style,
                        t;
                    // clip div
                    if (
                        // has position object
                        p &&
                        // has style object
                        divStyle &&
                        // has right
                        p.hasOwnProperty('r') &&
                        // has left
                        p.hasOwnProperty('l') &&
                        // has top
                        p.hasOwnProperty('t') &&
                        // has bottom
                        p.hasOwnProperty('b')
                    ) {
                        // css3 transform support
                        if (this.map.navigationMode === "css-transforms") {
                            // if style exists
                            if (divStyle) {
                                // get vendor transform value
                                var transformValue = this._getTransformValue(divStyle);
                                // if we have the transform values
                                if (transformValue) {
                                    t = this._parseTransformValue(transformValue);
                                    // set values
                                    p.l -= t.x;
                                    p.r -= t.x;
                                    p.t -= t.y;
                                    p.b -= t.y;
                                }
                            }
                        } else {
                            // no css3 transform
                            if (divStyle && p.swipeType === "scope") {
                                t = this._parseScopeStyle(divStyle);
                                p.l -= t.x;
                                p.r -= t.x;
                                p.t -= t.y;
                                p.b -= t.y;
                            }
                        }
                        // CSS Clip rectangle
                        var clipstring;
                        // is this msie?
                        var ie = sniff('ie');
                        // if IE and less than ie8
                        if (ie && ie < 8) {
                            //Syntax for clip "rect(top right bottom left)"
                            clipstring = "rect(" + p.t + "px " + p.r + "px " + p.b + "px " + p.l + "px)";
                        } else {
                            //Syntax for clip "rect(top, right, bottom, left)"
                            clipstring = "rect(" + p.t + "px, " + p.r + "px, " + p.b + "px, " + p.l + "px)";
                        }
                        // clip the node
                        domStyle.set(p.layerNode, "clip", clipstring);
                    }
                }
            } else {
                // no layerNode
                console.log('LayerSwipe::Invalid layer type');
            }
        },
        _swipe: function () {
            if (this.get("loaded") && this.get("enabled")) {
                // event object
                var emitObj = {
                    layers: []
                };
                if (this.layers && this.layers.length) {
                    // each layer
                    for (var i = 0; i < this.layers.length; i++) {
                        // get position values & required nodes
                        var p = this._positionValues(this.layers[i]);
                        // clip the layer
                        this._clipLayer(p);
                        // emit the event
                        var layerEmit = {
                            layer: this.layers[i],
                            left: p.l,
                            right: p.r,
                            top: p.t,
                            bottom: p.b
                        };
                        // add emit object
                        emitObj.layers.push(layerEmit);
                    }
                }
                // emit swipe event
                this.emit("swipe", emitObj);
            }
        },
        _getTransformValue: function (nodeStyle) {
            var transformValue, vendors;
            // style exists
            if (nodeStyle) {
                // check browser for these properties
                vendors = [
                    "transform",
                    "-webkit-transform",
                    "-ms-transform",
                    "-moz-transform",
                    "-o-transform"
                ];
                // each property
                for (var i = 0; i < vendors.length; i++) {
                    // try to get property
                    transformValue = nodeStyle[vendors[i]];
                    // if property exists
                    if (transformValue) {
                        // stop loop
                        break;
                    }
                    // try to get value another way
                    try{
                        transformValue = nodeStyle.getPropertyValue(vendors[i]);
                    }
                    catch(error){}
                    // if property exists
                    if (transformValue) {
                        // stop loop
                        break;
                    }
                }
            }
            // return property
            return transformValue;
        },
        _parseTransformValue: function (transformValue) {
            // object to return
            var t = {
                x: 0,
                y: 0
            };
            // convert tranasport value to integer, remove spaces, remove px
            if (transformValue.toLowerCase().indexOf("translate3d") !== -1) {
                // get 3d version of translate
                transformValue = transformValue.replace("translate3d(", "").replace(")", "").replace(/px/ig, "").replace(/\s/i, "").split(",");
            } else if (transformValue.toLowerCase().indexOf("translate") !== -1) {
                // get 2d version of translate
                transformValue = transformValue.replace("translate(", "").replace(")", "").replace(/px/ig, "").replace(/\s/i, "").split(",");
            }
            try {
                // see if we can parse them as floats
                t.x = parseFloat(transformValue[0]);
                t.y = parseFloat(transformValue[1]);
            } catch (e) {
                // something went wrong
                console.log('LayerSwipe::Error parsing transform number');
            }
            return t;
        },
        _parseScopeStyle: function (divStyle) {
            // defualt object with offset of zero
            var t = {
                x: 0,
                y: 0
            };
            // update values if using scope
            try {
                // get the top and left postiion of the style
                t.x = parseFloat(divStyle.left.replace(/px/ig, "").replace(/\s/i, ""));
                t.y = parseFloat(divStyle.top.replace(/px/ig, "").replace(/\s/i, ""));
            } catch (e) {
                console.log('LayerSwipe::Error parsing div style float');
            }
            // return object
            return t;
        },
        _updateThemeWatch: function () {
            // change the theme style
            var oldVal = arguments[1];
            var newVal = arguments[2];
            domClass.remove(this.domNode, oldVal);
            domClass.add(this.domNode, newVal);
        },
        _type: function () {
            var oldVal = arguments[1];
            // remove old css class
            if (oldVal) {
                domClass.remove(this._moveableNode, oldVal);
            }
            // set type of swipe type
            this._setSwipeType();
            // remove and reset events
            this._setupEvents();
            // swipe new position
            this.swipe();
        },
        _pauseEvents: function () {
            if (this._listeners && this._listeners.length) {
                for (var i = 0; i < this._listeners.length; i++) {
                    this._listeners[i].pause();
                }
            }
        },
        _resumeEvents: function () {
            if (this._listeners && this._listeners.length) {
                for (var i = 0; i < this._listeners.length; i++) {
                    this._listeners[i].resume();
                }
            }
        },
        _unclipLayers: function () {
            if (this.get("loaded") && this.layers && this.layers.length) {
                for (var i = 0; i < this.layers.length; i++) {
                    // layer div
                    var layerNode = this.layers[i]._div;
                    // layer graphics
                    var layerGraphics = this.layers[i].graphics;
                    // layer node exists
                    if (layerNode) {
                        // graphics layer
                        if (layerGraphics) {
                            layerNode.setClip(null);
                        }
                        // if we have a layer div and its not a graphics layer
                        else {
                            var clipstring;
                            // test for IE
                            var ie = sniff('ie');
                            // if IE and less than ie8
                            if (ie && ie < 8) {
                                clipstring = "rect(auto auto auto auto)";
                            } else {
                                clipstring = "auto";
                            }
                            // set clip on layer node
                            domStyle.set(layerNode, "clip", clipstring);
                        }
                    }
                }
            }
        },
        _invertPlacement: function () {
            this.swipe();
        },
        _enabled: function () {
            if (this.get("enabled")) {
                // widget enabled
                domStyle.set(this.domNode, 'display', 'block');
                // restart events
                this._resumeEvents();
                // swipe map
                this.swipe();
            } else {
                // pause all events
                this._pauseEvents();
                // hide widget div
                domStyle.set(this.domNode, 'display', 'none');
                // unclip layers
                this._unclipLayers();
            }
        }
    });
    if (has("extend-esri")) {
        lang.setObject("dijit.LayerSwipe", Widget, esriNS);
    }
    return Widget;
});
