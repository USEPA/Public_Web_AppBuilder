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
    'dojo/_base/html',
    'dojo/_base/connect',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/topic',
    'dojo/aspect',
    'dojo/_base/array',
    'dojo/has',
    'dojo/_base/window',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/dom',
    'dojo/promise/all',

    'dijit/_WidgetsInTemplateMixin',
    'dijit/Toolbar',
    'dijit/form/Button',
    'dijit/form/Select',
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane',

    'jimu/BaseWidget',
    'jimu/dijit/CheckBox',
    'jimu/utils',

    'esri/config',
    'esri/symbols/jsonUtils',

    'widgets/ElevationProfileTable/ElevationProfile/Widget'
],
    function (declare, html, connect, lang, on, topic, aspect, array, has, win, domConstruct, domStyle, domAttr, domClass, dom, all,
              _WidgetsInTemplateMixin, Toolbar, Button, Select, TabContainer, ContentPane,
              BaseWidget, CheckBox, utils,
              esriConfig, jsonUtils,
              ElevationProfile) {
        var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
            name: 'ElevationProfileTable',
            baseClass: 'jimu-widget-elevationprofiletable',
            normalHeight: 0,
            elevationProfileDiv: null,
            elevationProfileWidget: null,

            startup: function () {
                this.inherited(arguments);

                this.ElevationProfileTableDiv = null;
                this.moveMaskDiv = null;
                this.moveMode = false;
//                this.isIndicate = true;
                this.moveY = 0;
                this.previousDomHeight = 0;
//                this.toolbarHeight = 0;
                this.bottomPosition = 0;
//                this.matchingCheckBox = null;
//                this.matchingMap = false;
                this.isFirst = true;
                this._setInitialPosition();
                this.currentHeight = 0;
                this.openHeight = this.normalHeight;

                this._createBar();
                this._closeTable();
            },

            _createBar: function () {
                this.arrowDiv = domConstruct.create("div");
                domClass.add(this.arrowDiv, "jimu-widget-elevationprofiletable-move");
                this.bar = domConstruct.create("div");
                domClass.add(this.bar, "jimu-widget-elevationprofiletable-bar");
                domConstruct.place(this.bar, this.domNode);
                domConstruct.place(this.arrowDiv, this.domNode);

                this.moveMaskDiv = domConstruct.create("div", {
                    style: "opacity:0; width:100%; height:100%;position:absolute; z-index:999; display:none;cursor: ns-resize",
                    'class': 'jimu-widget-elevationprofiletable-mask'
                });
                domConstruct.place(this.moveMaskDiv, win.body(), "first");

                this.own(on(this.arrowDiv, 'mousedown', lang.hitch(this, this.onMouseEvent)));
                this.own(on(this.bar, 'click', lang.hitch(this, this._switchTable)));
            },

            _switchTable: function () {
                if (this.currentHeight === 0) {
                    this._openTable();
                } else {
                    this._closeTable();
                }
            },

            _openTable: function () {
                if (this.isFirst) { // first open
                    this.currentHeight = this.normalHeight;
                    this.isFirst = false;
                    this._init();
                }
                domClass.remove(this.bar, 'close');
                domClass.add(this.bar, 'open');
                this._changeHeight(this.openHeight);
                domAttr.set(this.bar, 'title', this.nls.closeTableTip);
            },

            _closeTable: function () {
                domClass.remove(this.bar, 'open');
                domClass.add(this.bar, 'close');
                this._changeHeight(0);
                domAttr.set(this.bar, 'title', this.nls.openTableTip);
            },

            _init: function () {
                this.initDiv();
                this.resize();

                this.own(on(this.map, "resize", lang.hitch(this, this.onMapResize)));
                this.own(on(window.document, "mouseup", lang.hitch(this, this.onMouseEvent)));
                this.own(on(window.document, "mousemove", lang.hitch(this, this.onMouseEvent)));

                this.indicateHorDiv = domConstruct.create("div");
                domClass.add(this.indicateHorDiv, "jimu-widget-elevationprofiletable-indicate-horizontal");
                this.indicateVelDiv = domConstruct.create("div");
                domClass.add(this.indicateVelDiv, "jimu-widget-elevationprofiletable-indicate-vertical");
                domConstruct.place(this.indicateHorDiv, this.map.root, "first");
                domConstruct.place(this.indicateVelDiv, this.map.root, "first");
            },

            destroy: function () {
                if (this.moveMaskDiv) {
                    domConstruct.destroy(this.moveMaskDiv);
                    this.moveMaskDiv = null;
                }

                if (this.ElevationProfileTableDiv) {
                    domConstruct.empty(this.ElevationProfileTableDiv);
                    this.ElevationProfileTableDiv = null;
                }

                this.inherited(arguments);
            },

            onOpen: function () {
                if (this.isEmpty(this.config.elevationSync)) {
                    this.onClose();
                } else {
                    domStyle.set(this.domNode, "display", "");
                    this.onMapResize();
                }
            },

            onClose: function () {
                domStyle.set(this.domNode, "display", "none");
            },

            _changeHeight: function (h) {
                domStyle.set(this.domNode, "height", h + "px");
                if (this.positionRelativeTo === 'browser') {
                    topic.publish('changeMapPosition', {
                        bottom: h + this.bottomPosition
                    });
                }

                this.currentHeight = h;
                if (h !== 0) {
                    this.openHeight = h;
                }
            },

            onMapResize: function () {
                if (this.elevationProfileWidget) {
                    this.elevationProfileWidget._resizeChart();
                }
            },

            onPositionChange: function (position) {
                this.position = position;
                this._setInitialPosition();
                this._changeHeight(0);
                var height = domStyle.get(this.domNode, "height");
                if (this.layersIndex > -1) {
                    var len = this.grids.length;
                    for (var i = 0; i < len; i++) {
                        domStyle.set(this.grids[i].domNode, "height", (height - this.noGridHeight) + "px");
                    }
                }
            },

            urlFormatter: function (str) {
                if (str) {
                    var s = str.indexOf('http:');
                    if (s === -1) {
                        s = str.indexOf('https:');
                    }
                    if (s > -1) {
                        if (str.indexOf('href=') === -1) {
                            var e = str.indexOf(' ', s);
                            if (e === -1) {
                                e = str.length;
                            }
                            var link = str.substring(s, e);
                            str = str.substring(0, s) +
                                '<A href="' + link + '" target="_blank">' + link + '</A>' +
                                str.substring(e, str.length);
                        }
                    }
                }
                return str || "";
            },

            dateFormatter: function (str) {
                if (str) {
                    var sDateate = new Date(str);
                    str = utils.localizeDate(sDateate, {
                        fullYear: true
                    });
                }
                return str || "";
            },

            numberFormatter: function (num) {
                if (typeof num === 'number') {
                    var decimalStr = num.toString().split('.')[1] || "",
                        decimalLen = decimalStr.length;
                    num = utils.localizeNumber(num, {
                        places: decimalLen
                    });
                }
                return '<span class="jimu-numeric-value">' + (num || "") + '</span>';
            },

            getTypeName: function (value, types) {
                var len = types.length;
                for (var i = 0; i < len; i++) {
                    if (value === types[i].id) {
                        return types[i].name;
                    }
                }
                return "";
            },

            getFieldType: function (name, fields) {
                if (fields && fields.length > 0) {
                    var len = fields.length;
                    for (var i = 0; i < len; i++) {
                        if (name === fields[i].name) {
                            return fields[i].type;
                        }
                    }
                }

                return "";
            },

            onMouseEvent: function (event) {
                var type = event.type;

                switch (type) {
                    case "mousedown":
                        this.moveMode = true;
                        this.moveY = event.clientY;
                        this.previousDomHeight = domStyle.get(this.domNode, "height");
                        this.previousArrowTop = domStyle.get(this.arrowDiv, "top");
                        domStyle.set(this.arrowDiv, "background-color", "gray");
                        domStyle.set(this.moveMaskDiv, "display", "");
                        break;
                    case "mouseup":
                        this.moveMode = false;
                        // this.onPan(false);
                        domStyle.set(this.arrowDiv, "background-color", "");
                        domStyle.set(this.moveMaskDiv, "display", "none");
                        break;
                    case "mousemove":
                        if (this.moveMode) {
                            var y = this.moveY - event.clientY;
                            this._changeHeight(y + this.previousDomHeight);
                        }
                        break;
                }
            },

            _setInitialPosition: function () {
                var h, b;
                if (this.position.height) {
                    h = this.position.height;
                } else {
                    h = document.body.clientHeight;
                    h = h / 3;
                }
                if (this.position.bottom) {
                    b = this.position.bottom;
                } else {
                    b = 0;
                }
                this.bottomPosition = b;
                this.normalHeight = h;
                domStyle.set(this.domNode, "top", "auto");
                domStyle.set(this.domNode, "left", "0px");
                domStyle.set(this.domNode, "right", "0px");
                domStyle.set(this.domNode, "bottom", this.bottomPosition + "px");
                domStyle.set(this.domNode, "position", "absolute");
            },

            initDiv: function () {
                this.ElevationProfileTableDiv = domConstruct.create("div", {}, this.domNode);
                domClass.add(this.ElevationProfileTableDiv, "jimu-widget-elevationprofiletable-main");

                var toolbarDiv = domConstruct.create("div");
                this.toolbarDiv = toolbarDiv;
                var toolbar = new Toolbar({}, domConstruct.create("div"));

                this.closeButton = new Button({
                    title: this.nls.closeMessage,
                    iconClass: "esriAttributeTableCloseImage",
                    style: "padding-top:2px",
                    onClick: lang.hitch(this, this._closeTable)
                });
                html.addClass(this.closeButton.domNode, 'jimu-float-trailing');
                toolbar.addChild(this.closeButton);

                domConstruct.place(toolbar.domNode, toolbarDiv);

                domConstruct.place(toolbarDiv, this.ElevationProfileTableDiv);

                var profileParams = {
                    map: this.map,
                    profileTaskUrl: this.config.elevationSync.url,
                    losTaskUrl: this.config.losSync.url,
                    scalebarUnits: "dual"
                };

                var profileChartNode = domConstruct.create("div");
                html.addClass(profileChartNode, 'elevationsProfile');

                var profileChartPane = new ContentPane({
                    style: "width:100%;height:95%"
                });
                html.addClass(profileChartPane.domNode, 'appInsetBoxShadow');
                domConstruct.place(profileChartNode, profileChartPane.domNode);
                domConstruct.place(profileChartPane.domNode, this.ElevationProfileTableDiv);

                this.elevationProfileWidget = new ElevationProfile(profileParams, profileChartNode);
                this.elevationProfileWidget.startup();
            },

            _isIE11: function () {
                var iev = 0;
                var ieold = (/MSIE (\d+\.\d+);/.test(navigator.userAgent));
                var trident = !!navigator.userAgent.match(/Trident\/7.0/);
                var rv = navigator.userAgent.indexOf("rv:11.0");

                if (ieold) {
                    iev = Number(RegExp.$1);
                }
                if (navigator.appVersion.indexOf("MSIE 10") !== -1) {
                    iev = 10;
                }
                if (trident && rv !== -1) {
                    iev = 11;
                }

                return iev === 11;
            },

            isEmpty: function (val){
                return (val === undefined || val == null || val.length <= 0) ? true : false;
            }
        });

        clazz.inPanel = false;
        clazz.hasUIFile = false;
        return clazz;
    });