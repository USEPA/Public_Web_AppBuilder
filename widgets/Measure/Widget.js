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
//
//  12/16/2015 - tested with WAB 1.3 and added nautical miles to the distance pick list.
//  10/06/2015 - added editing capability to some geometries.  CLICK graphic to start and stop editing, CTRL-CLICK to delete a measure graphic.
//  09/30/2015 - updated to remove unnecessary logic for IE - NIM094815: The mouse-drag event now works correctly using IE10 and IE11.
//  09/29/2015 - added logic to use better area and length calculations using the API geometryEngine
//               to work with geodesic and planar projections
//  09/09/2015 - upgrade to new release of WAB 1.2
//             - fixed problem with settings that was corrupting the WAB app
//  04/06/2015 - upgrade to new release of WAB 1.1
//             - use new JSAPI scaleUtils to get map units
//             - added logic for Internet Explorer to measure all geometry types
//             - updated offset for mobile on certain geometry types
//  03/04/2015 - stacked area measurements
//               added logic for calculating map units
//               added ability to change measure text size and color
//  02/24/2015 - added logic for using on iPad, iPhone and Android devices
//               added logic for stopping popups
//  02/18/2015 - removed the last measure from the freehand polygon tool
//  02/17/2015 - fix problem with perimeter measurement
//  02/17/2015 - Initial release created from the draw widget.
define([
        'dojo/_base/declare',
        'dijit/_WidgetsInTemplateMixin',
        'jimu/BaseWidget',
        'esri/layers/GraphicsLayer',
		'esri/toolbars/edit',
        'esri/graphic',
        'esri/geometry/Extent',
        'esri/geometry/Point',
        'esri/symbols/SimpleMarkerSymbol',
        'esri/geometry/Polyline',
        'esri/symbols/SimpleLineSymbol',
        'esri/geometry/Polygon',
        'esri/symbols/SimpleFillSymbol',
        'esri/symbols/TextSymbol',
        'esri/symbols/Font',
        'esri/SpatialReference',
        'esri/units',
        "esri/geometry/scaleUtils",
        'esri/geometry/webMercatorUtils',
        'esri/geometry/geodesicUtils',
		'esri/geometry/geometryEngine',
        'dojo/_base/lang',
        'dojo/on',
        'dojo/_base/html',
        'dojo/_base/Color',
        'dojo/_base/query',
        'dojo/_base/array',
		'dojo/_base/event',
        'dojo/touch',
        'dojo/has',
        'dijit/form/Select',
        'dijit/form/NumberSpinner',
        'jimu/dijit/ViewStack',
        'jimu/dijit/SymbolChooser',
        'jimu/dijit/DrawBox',
        'jimu/utils',
        'dojo/sniff'
    ],
    function(declare, _WidgetsInTemplateMixin, BaseWidget, GraphicsLayer, Edit, Graphic, Extent, Point,
        SimpleMarkerSymbol, Polyline, SimpleLineSymbol, Polygon, SimpleFillSymbol,
        TextSymbol, Font, SpatialReference, esriUnits, scaleUtils, webMercatorUtils, geodesicUtils, geometryEngine, lang, on, html,
        Color, Query, array, event, touch, has, Select, NumberSpinner, ViewStack, SymbolChooser,
        DrawBox, jimuUtils, sniff) { /*jshint unused: false*/
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            name: 'Measure',
            baseClass: 'jimu-widget-measure',
            measureClickHandler: null,
            measureMoveHandler: null,
            measureMouseDownHandler: null,
            measureMouseDragHandler: null,
            measureType: "",
            measureGraphic: null,
            measureGraphic2: null,
            measureGraphicReturn: null,
            measureGraphicsLayer: null,
            measureSegment: 1,
			useGeodesic: true,
			editingEnabled: false,
			editToolbar: null,
			editGraphicID: "",
            editGraphic1: null,
            editGraphic2: null,
			measureEditVertex: null,
			isEditable: false,

            postMixInProperties: function() {
                this.inherited(arguments);
                this._resetUnitsArrays();
            },

            postCreate: function() {
                this.inherited(arguments);
                //jimuUtils.combineRadioCheckBoxWithLabel(this.showMeasure, this.showMeasureLabel);
                this.drawBox.setMap(this.map);

                this.viewStack = new ViewStack({
                    viewType: 'dom',
                    views: [this.pointSection, this.lineSection, this.polygonSection]
                });
                html.place(this.viewStack.domNode, this.settingContent);
				
                this.textSymChooser.inputText.value = "Sample Text";
                this.textSymChooser.textPreview.innerHTML = "Sample Text";
				

                this._initUnitSelect();
                this._bindEvents();
                this.measureGraphicsLayer = new GraphicsLayer();
                this.measureGraphicsLayer.name = "Search Buffer Results";
                this.map.addLayer(this.measureGraphicsLayer);
				this.drawBox.drawLayer = this.measureGraphicsLayer;
				this.editToolbar = new Edit(this.map);
				this.own(on(this.editToolbar, 'vertex-move-start', lang.hitch(this, this._editVertexStart)));
				this.own(on(this.editToolbar, 'vertex-move-stop', lang.hitch(this, this._editVertexStop)));
				this.own(on(this.editToolbar, 'vertex-delete', lang.hitch(this, this._vertexDelete)));
				//this.own(on(this.editToolbar, 'vertex-move', lang.hitch(this, this._vertexMove)));
				this.own(on(this.measureGraphicsLayer, "click", lang.hitch(this, function(evt) {
					event.stop(evt);
					//delete feature if ctrl key is depressed
					if (evt.ctrlKey === true || evt.metaKey === true) {
						var id = evt.graphic.attributes.id;
						for (var i = this.measureGraphicsLayer.graphics.length-1; i >= 0; i--) {
							var g = this.measureGraphicsLayer.graphics[i];
							if (g.attributes.id === id) {
								this.measureGraphicsLayer.remove(g);
							}
						}
						this.editToolbar.deactivate();
						this.editingEnabled = false;
					} else {
					//if (evt.shiftKey === true) {  //edit feature if shift key is depressed
						// see if graphic is editable.  lines, polylines and polygons are editable.
						if (evt.graphic.attributes.editable) {
							if (this.editingEnabled === false) {
								this.editingEnabled = true;
								this.editToolbar.activate(Edit.EDIT_VERTICES, evt.graphic);
								if (evt.graphic.geometry.type === 'polyline') {
									this.viewStack.switchView(this.lineSection);
								} else {
									this.viewStack.switchView(this.polygonSection);
								}
							} else {
								this.editToolbar.deactivate();
								this.editingEnabled = false;
							}
						}
					}
				})));
					
				var wkid = this.map.spatialReference.wkid;
				if (wkid === 102100 || wkid === 3857 || wkid === 102113 || wkid === 4326) {
					this.useGeodesic = true;
				} else {
					this.useGeodesic = false;
				}
            },

            _resetUnitsArrays: function() {
                this.defaultDistanceUnits = [];
                this.defaultAreaUnits = [];
                this.configDistanceUnits = [];
                this.configAreaUnits = [];
                this.distanceUnits = [];
                this.areaUnits = [];
            },

            _bindEvents: function() {
                //bind DrawBox
                this.own(on(this.drawBox, 'IconSelected', lang.hitch(this, this._onIconSelected)));
                this.own(on(this.drawBox, 'DrawEnd', lang.hitch(this, this._onDrawEnd)));
                this.own(on(this.drawBox, 'Clear', lang.hitch(this, this._clear)));

                //bind symbol change events
                this.own(on(this.pointSymChooser, 'change', lang.hitch(this, function() {
                    this._setDrawDefaultSymbols();
                })));
                this.own(on(this.lineSymChooser, 'change', lang.hitch(this, function() {
                    this._setDrawDefaultSymbols();
                })));
                this.own(on(this.fillSymChooser, 'change', lang.hitch(this, function() {
                    this._setDrawDefaultSymbols();
                })));
                this.own(on(this.textSymChooser, 'change', lang.hitch(this, function(symbol) {
                    this._setDrawDefaultSymbols();
                })));
                this.own(on(this.helpImage, 'click', lang.hitch(this, function() {
                    var win = window.open("widgets/Measure/help/index.html", "_blank");
					win.focus();
                })));
            },

            _onIconSelected: function(target, geotype, commontype) {
				// create a unique ID that will be used to associate the drawn graphic and text measurement graphics
				var d = new Date();
				this.editGraphicID = "gra_" + d.getTime();
				if (geotype === 'LINE' || geotype === 'POLYLINE' || geotype === 'POLYGON') {
					this.isEditable = true;
				} else {
					this.isEditable = false;
				}
				
				// if the user was editing, let's turn editing off
				if (this.editingEnabled) {
					this.editToolbar.deactivate();
					this.editingEnabled = false;
				}
				
                this.measureType = geotype;
                this._setDrawDefaultSymbols();
                if (commontype === 'point') {
                    this.viewStack.switchView(this.pointSection);
                } else if (commontype === 'polyline') {
                    this.viewStack.switchView(this.lineSection);
                    if (geotype === 'POLYLINE') {
                        this.measureClickHandler = on(this.map, "click", lang.hitch(this, this._measureClick));
                    } else {
                        if (has('ipad') || has('iphone') || has('android')) {
                            this.measureMouseDownHandler = on(document, touch.press, lang.hitch(this, this._measureMouseDown));
                        } else {
                            this.measureMouseDownHandler = on(this.map, "mouse-down", lang.hitch(this, this._measureMouseDown));
                        }
                    }
                } else if (commontype === 'polygon') {
                    this.viewStack.switchView(this.polygonSection);
                    if (geotype === 'POLYGON') {
                        this.measureClickHandler = on(this.map, "click", lang.hitch(this, this._measureClick));
                    } else {
                        if (has('ipad') || has('iphone') || has('android')) {
                            this.measureMouseDownHandler = on(document, touch.press, lang.hitch(this, this._measureMouseDown));
                        } else {
                            this.measureMouseDownHandler = on(this.map, "mouse-down", lang.hitch(this, this._measureMouseDown));
                        }
                    }
                } else if (commontype === 'text') {
                    this.viewStack.switchView(this.textSection);
                }
                this._setMeasureVisibility();
            },

            _onDrawEnd: function(graphic, geotype, commontype) {
				// set graphic attributes
				var att = {id: this.editGraphicID, editable: this.isEditable};
				graphic.setAttributes(att);
				
                var geometry = graphic.geometry;
				var firstPoint = null;
				var lastPoint = null;
				var l; // number of segments
				var pl = Polygon(geometry);
                if (this.measureType === 'FREEHAND_POLYGON') {
                    // with this measure type we want to remove the last graphic
                    // as it completes the freehand polygon to the original start
                    // and makes the interactive measure incomplete
                    this.measureGraphicsLayer.remove(this.measureGraphic);

                }
                if (has('ipad') || has('iphone') || has('android')) {
                    // measuring on mobile devices doesn't add the final segment measurements. 
                    if (this.measureType === 'POLYLINE') {
                        firstPoint = null;
                        lastPoint = null;
                        pl = Polyline(geometry);
                        l = pl.paths[0].length;
                        firstPoint = pl.getPoint(0, l - 2);
                        lastPoint = pl.getPoint(0, l - 1);
                        if (l > 1) {
                            var segLength = this._calculateSegmentLength(firstPoint, lastPoint);
                            var angle = this._calculateAngle(firstPoint, lastPoint);
                            var midPT = this._calculateMidPoint(firstPoint, lastPoint);
                            this._addClickMeasure(midPT, angle, segLength);
                        }
                    }
                    if (this.measureType === 'POLYGON') {
                        firstPoint = null;
                        lastPoint = null;
                        pl = Polygon(geometry);
                        l = pl.rings[0].length;
                        firstPoint = pl.getPoint(0, l - 2);
                        lastPoint = pl.getPoint(0, l - 1);
                        if (l > 1) {
                            var segLength = this._calculateSegmentLength(firstPoint, lastPoint);
                            var angle = this._calculateAngle(firstPoint, lastPoint);
                            var midPT = this._calculateMidPoint(firstPoint, lastPoint);
                            this._addClickMeasure(midPT, angle, segLength);
                        }
                        // do this again to get the second to last measurement
                        var fp = pl.getPoint(0, l - 3);
                        var lp = pl.getPoint(0, l - 2);
                        if (l > 1) {
                            var segLength = this._calculateSegmentLength(fp, lp);
                            var angle = this._calculateAngle(fp, lp);
                            var mp = this._calculateMidPoint(fp, lp);
                            this._addClickMeasure(mp, angle, segLength);
                        }
                    }
                }

                this.measureGraphic = null;
                this.measureGraphic2 = null;
                this.measureGraphicReturn = null;
                this.measureSegment = 1;
                if (geometry.type === 'extent') {
                    var a = geometry;
                    var polygon = new Polygon(a.spatialReference);
                    var r = [
                        [a.xmin, a.ymin],
                        [a.xmin, a.ymax],
                        [a.xmax, a.ymax],
                        [a.xmax, a.ymin],
                        [a.xmin, a.ymin]
                    ];
                    polygon.addRing(r);
                    geometry = polygon;
                    commontype = 'polygon';
                }
                if (commontype === 'polyline') {
                    //if(this.showMeasure.checked){
                    if (this.measureType !== 'LINE' && this.measureType !== 'FREEHAND_POLYLINE') {
                        this._addLineMeasure(geometry);
                    }
                    if (geotype === 'POLYLINE') {
                        if (this.measureMoveHandler) {
                            this.measureMoveHandler.remove();
                        }
                    } else {
                        this.measureMouseDragHandler.remove();
                    }
                } else if (commontype === 'polygon') {
                    //if(this.showMeasure.checked){
                    this._addPolygonMeasure(geometry);
                    //}
                    if (geotype === 'POLYGON') {
                        if (this.measureMoveHandler) {
                            this.measureMoveHandler.remove();
                        }
                    } else {
                        this.measureMouseDragHandler.remove();
                    }
                }
            },

            _reorderGraphics: function() {
                // text for measurements needs to be on type all others
                var graArray = [];
                // make 2 pass through the graphics in the measure array move text to the top.
                // second pass adds text graphics
                for (var i = 0; i < this.drawBox.drawLayer.graphics.length; i++) {
                    var gra = this.drawBox.drawLayer.graphics[i];
                    if (gra.symbol.type === 'textsymbol') {
                        graArray.push(gra);
                    }
                }
                // first pass adds non text graphics
                for (var i = 0; i < this.drawBox.drawLayer.graphics.length; i++) {
                    var gra = this.drawBox.drawLayer.graphics[i];
                    if (gra.symbol.type !== 'textsymbol') {
                        graArray.push(gra);
                    }
                }
                this.drawBox.drawLayer.graphics = graArray;
                this.drawBox.drawLayer.redraw();
            },

            _measureClick: function(e) {
                // start the measure of the graphic being drawn
                // console.log("Map measure clicked");
                this.measureClickHandler.remove();
                if (has('ipad') || has('iphone') || has('android')) {
                    this.measureMoveHandler = on(this.map, "click", lang.hitch(this, this._measureClickSegment));
                } else {
                    this.measureMoveHandler = on(this.map, "mouse-move", lang.hitch(this, this._measureMove));
                }
            },

            _measureMove: function(e) {
                // get the graphic being drawn
                var gra = this.drawBox.drawToolBar._graphic;
                // the geometry may be null as drawing is beginning
                if (gra) {
                    // get the last point in the drawn graphic
                    var firstPoint = null;
                    var lastPoint = null;
                    var l; // number of segments
                    if (gra.geometry.type === 'polyline') {
                        var pl = Polyline(gra.geometry);
                        l = pl.paths[0].length;
                        lastPoint = pl.getPoint(0, l - 1);
                    } else {
                        // must be a polygon
                        var poly = Polygon(gra.geometry);
                        l = poly.rings[0].length;
                        firstPoint = poly.getPoint(0, 0);
                        lastPoint = poly.getPoint(0, l - 1);
                    }
                    var segLength = this._calculateSegmentLength(lastPoint, e.mapPoint);
                    var angle = this._calculateAngle(lastPoint, e.mapPoint);
                    var midPT = this._calculateMidPoint(lastPoint, e.mapPoint);
                    if (l > this.measureSegment) {
                        // this means that we have started a new segment and need to leave the last measure in place
						//var att = {id: this.editGraphicID, index: this.measureSegment};
                        //var mg = new Graphic(this.measureGraphic.geometry, this.measureGraphic.symbol, att, null);
                        //this.measureGraphicsLayer.add(mg);
                        this.measureGraphic = null;
                        this.measureSegment = l;
                    }
                    this._addSegmentMeasure(midPT, angle, segLength);
                    // lets get the return length to the beginning point
                    if (l > 1 && gra.geometry.type === 'polygon') {
                        var mp = this._calculateMidPoint(firstPoint, e.mapPoint);
                        var sl = this._calculateSegmentLength(firstPoint, e.mapPoint);
                        var angle = this._calculateAngle(firstPoint, e.mapPoint);
                        this._addReturnMeasure(mp, angle, sl);
                    }
                    //console.log("Map measure moved - length: " + segLength);
                }

            },
			
			_editVertexStart: function(e) {
				console.log("Started Vertex Edit");
				// this is a good place to determine which measure dimension graphics we are going to edit
				// depending on which vertex is chosen.
				var gra = e.graphic;
				this.editGraphicID = e.graphic.attributes.id;
				var geomtype = gra.geometry.type;
				var pl;
				var l = 0;
				if (geomtype === 'polyline') {
					pl = new Polyline(gra.geometry);
					l = pl.paths[0].length;
				} else {
					pl = new Polygon(gra.geometry);
					l = pl.rings[0].length;
				}
				this._setDrawDefaultSymbols();
				var isGhostVertex = e.vertexinfo.isGhost;
				var pointIndex = e.vertexinfo.pointIndex;
				if (isGhostVertex) {
					// this is a ghost vertex that means we are splitting the line.  We need to add a new dimension graphic
					// and update the other dimension graphics sequence numbers

					// update the index numbers for the other dimension graphics
					var g;
					for (var i = 0; i < gra._graphicsLayer.graphics.length; i++) {
						g = gra._graphicsLayer.graphics[i];
						var att = g.attributes;
						if (att.id === gra.attributes.id && att.index > pointIndex && att.index < 999) {
							g.attributes.index += 1;
						}
					}					
					// we are moving a vertex in the middle of the polyline and measuring 2 segments
					this.editGraphic1 = this._findDimensionGraphic(gra._graphicsLayer, gra.attributes.id, pointIndex);
					// new graphic for second dimension
					var a = {id: this.editGraphic1.attributes.id, index: this.editGraphic1.attributes.index + 1};
					this.editGraphic2 = new Graphic(this.editGraphic1.geometry, this.editGraphic1.symbol, a, null);
					this.measureGraphicsLayer.add(this.editGraphic2);
				} else {
					// not a ghost vertex.  if the vertex is the first or last we will only be calculating one measure
					// otherwise we will be calculating distances for two segments.
					// find the dimension graphic that will be changed
					if (pointIndex === 0) {
						if (geomtype === 'polyline') {
							this.editGraphic1 = this._findDimensionGraphic(gra._graphicsLayer, gra.attributes.id, pointIndex + 1);
							this.editGraphic2 = null;
						} else {
							// get the first dimension and the last dimension for a polygon
							this.editGraphic1 = this._findDimensionGraphic(gra._graphicsLayer, gra.attributes.id, pointIndex + 1);
							this.editGraphic2 = this._findDimensionGraphic(gra._graphicsLayer, gra.attributes.id, l - 1);
						}
					} else if (pointIndex === l - 1) {
						this.editGraphic1 = this._findDimensionGraphic(gra._graphicsLayer, gra.attributes.id, pointIndex);
						this.editGraphic2 = null;
					} else {
						// we are moving a vertex in the middle of the polyline and measuring 2 segments
						this.editGraphic1 = this._findDimensionGraphic(gra._graphicsLayer, gra.attributes.id, pointIndex);
						this.editGraphic2 = this._findDimensionGraphic(gra._graphicsLayer, gra.attributes.id, pointIndex + 1);
					}
				}
				// make the vertex information available globally
				this.measureEditVertex = e;
				// as per usual, we have to add logic to make this work with Internet Explorer...
                if (has('ipad') || has('iphone') || has('android')) {
                    this.measureMouseDragHandler = on(document, touch.move, lang.hitch(this, this._editVertex));
                } else if (has("ie") === 9 || has("ie") === 10 || has("trident")) {
					this.measureMoveHandler = on(this.map, "mouse-drag", lang.hitch(this, this._editVertex));
					console.log("Using mouse-drag for IE");
				} else {
					this.measureMoveHandler = on(this.map, "mouse-move", lang.hitch(this, this._editVertex));
				}
				
			},
			
			_findDimensionGraphic: function(graphicsLayer, id, index) {
				var gra = null;
				for (var i = 0; i < graphicsLayer.graphics.length; i++) {
					var g = graphicsLayer.graphics[i];
					var att = g.attributes;
					if (att.id === id && index === att.index) {
						gra = g;
					}
				}
				return gra;
			},
			
			_editVertexStop: function(e) {
				console.log("Stopped Vertex Edit");
				if (this.measureMoveHandler) {
					this.measureMoveHandler.remove();
				}
				// remove the summary text graphics
				var id = e.graphic.attributes.id;
				for (var i = this.measureGraphicsLayer.graphics.length-1; i >= 0; i--) {
					var g = this.measureGraphicsLayer.graphics[i];
					if (g.attributes.id === id) {
						// remove area and length summary graphics. we are going to recalculate and re-add them
						if (g.attributes.index === 999) {
							this.measureGraphicsLayer.remove(g);
						}
					}
				}
				if (e.graphic.geometry.type === 'polyline') {
					this._addLineMeasure(e.graphic.geometry);
				} else {
					this._addPolygonMeasure(e.graphic.geometry);
				}
				
                this.measureGraphic = null;
                this.measureGraphic2 = null;
                this.measureGraphicReturn = null;
                this.measureSegment = 1;			
				
			},
			
			_vertexMove: function(e) {
				console.log("Moving Vertex...");
                // get the graphic being drawn
                var gra = this.measureEditVertex.graphic;
				var vi = this.measureEditVertex.vertexinfo;
				var transform = e.transform;
			},
			
			_editVertex: function(e) {
				console.log("Editing Vertex...");
                // get the graphic being drawn
                var gra = this.measureEditVertex.graphic;
				var vi = this.measureEditVertex.vertexinfo;
				var transform = e.transform;
                // the geometry may be null as drawing is beginning
                if (gra) {
                    // get the last point in the drawn graphic
                    var stationaryPoint1 = null;
                    var stationaryPoint2 = null;
					var pl;
					var l;
                    if (gra.geometry.type === 'polyline') {
                        pl = Polyline(gra.geometry);
						l = pl.paths[0].length;
                    } else {
                        // must be a polygon
                        pl = Polygon(gra.geometry);
                        l = pl.rings[0].length;
                    }
					if (vi.isGhost) {
						stationaryPoint1 = pl.getPoint(0, vi.pointIndex -1);
						stationaryPoint2 = pl.getPoint(0, vi.pointIndex);
					} else {
						if (vi.pointIndex === 0) {
							stationaryPoint1 = pl.getPoint(0, vi.pointIndex + 1);
							if (gra.geometry.type === 'polygon') {
								stationaryPoint2 = pl.getPoint(0, l - 2);
							}
						} else if (vi.pointIndex === l -1) {
							stationaryPoint1 = pl.getPoint(0, vi.pointIndex -1);
						} else {
							// we are moving a vertex in the middle of the polyline and measuring 2 segments
							stationaryPoint1 = pl.getPoint(0, vi.pointIndex -1);
							stationaryPoint2 = pl.getPoint(0, vi.pointIndex +1);
						}
					}
					// calculate the first segment dimension
                    var segLength = this._calculateSegmentLength(stationaryPoint1, e.mapPoint);
                    var angle = this._calculateAngle(stationaryPoint1, e.mapPoint);
                    var midPT = this._calculateMidPoint(stationaryPoint1, e.mapPoint);
                    this.measureGraphic = this.editGraphic1;
                    this._addSegmentMeasure(midPT, angle, segLength);
					// if not moving an end vertex, calculate the second segment dimension
					if (stationaryPoint2) {
						segLength = this._calculateSegmentLength(stationaryPoint2, e.mapPoint);
						angle = this._calculateAngle(stationaryPoint2, e.mapPoint);
						midPT = this._calculateMidPoint(stationaryPoint2, e.mapPoint);
						this.measureGraphic2 = this.editGraphic2;
						this._addSegmentMeasure2(midPT, angle, segLength);
					}
				}
			},
			
			_vertexDelete: function(e) {
				// routine to delete the selected vertex
				var gra = e.graphic;
				var vi = e.vertexinfo;
				var a = 0;

				// remove text graphics
				for (var i = this.measureGraphicsLayer.graphics.length-1; i >= 0; i--) {
					var g = this.measureGraphicsLayer.graphics[i];
					if (g.attributes.id === this.editGraphicID && g.geometry.type === 'point') {
						this.measureGraphicsLayer.remove(g);
					}
				}
				
				// add new measures to the line 
				var pl;
				var l;
				if (gra.geometry.type === 'polyline') {
					pl = Polyline(gra.geometry);
					l = pl.paths[0].length;
				} else {
					// must be a polygon
					pl = Polygon(gra.geometry);
					l = pl.rings[0].length;
				}
				for (i = 1; i < l; i++) {
					var pt1 = pl.getPoint(0, i -1);
					var pt2 = pl.getPoint(0, i);
					
					// calculate the first segment dimension
                    var segLength = this._calculateSegmentLength(pt1, pt2);
                    var angle = this._calculateAngle(pt1, pt2);
                    var midPT = this._calculateMidPoint(pt1, pt2);
                    this.measureGraphic = null;
					this.measureSegment = i;
                    this._addSegmentMeasure(midPT, angle, segLength);
				}
				
				if (gra.geometry.type === 'polyline') {
					this._addLineMeasure(pl);
				} else {
					this._addPolygonMeasure(pl);
				}
								
			},

            _measureClickSegment: function(e) {
                // get the graphic being drawn
                var gra = this.drawBox.drawToolBar._graphic;
                // the geometry may be null as drawing is beginning
                if (gra) {
                    // get the last point in the drawn graphic
                    var firstPoint = null;
                    var lastPoint = null;
                    var l; // number of segments
                    if (gra.geometry.type === 'polyline') {
                        var pl = Polyline(gra.geometry);
                        l = pl.paths[0].length;
                        firstPoint = pl.getPoint(0, l - 2);
                        lastPoint = pl.getPoint(0, l - 1);
                    } else {
                        // must be a polygon
                        var poly = Polygon(gra.geometry);
                        l = poly.rings[0].length;
                        firstPoint = poly.getPoint(0, l - 2);
                        lastPoint = poly.getPoint(0, l - 1);
                    }
                    if (l > 1) {
                        var segLength = this._calculateSegmentLength(firstPoint, lastPoint);
                        var angle = this._calculateAngle(firstPoint, lastPoint);
                        var midPT = this._calculateMidPoint(firstPoint, lastPoint);
                        this._addClickMeasure(midPT, angle, segLength);
                    }
                }

            },
            _measureMouseDown: function(e) {
                // ts - start the measure of the graphic being drawn
                //console.log("Map measure mouse down");
                this.measureMouseDownHandler.remove();
                if (has('ipad') || has('iphone') || has('android')) {
                    this.measureMouseDragHandler = on(document, touch.move, lang.hitch(this, this._measureDrag));
                } else {
                    this.measureMouseDragHandler = on(this.map, "mouse-drag", lang.hitch(this, this._measureDrag));
                }
            },

            _measureDrag: function(e) {
                // get the graphic being drawn
                var gra = this.drawBox.drawToolBar._graphic;
                // the geometry may be null as drawing is beginning
                if (gra) {
                    // get the last point in the drawn graphic
                    var firstPoint = null;
                    var lastPoint = null;
                    var l; // number of segments
                    if (this.measureType === 'LINE') {
                        var pl = Polyline(gra.geometry);
                        firstPoint = pl.getPoint(0, 0);
                        var segLength = this._calculateSegmentLength(firstPoint, e.mapPoint);
                        var angle = this._calculateAngle(firstPoint, e.mapPoint);
                        var midPT = this._calculateMidPoint(firstPoint, e.mapPoint);
                        this._addSegmentMeasure(midPT, angle, segLength);
                    }
                    if (this.measureType === 'FREEHAND_POLYLINE') {
                        var pl = Polyline(gra.geometry);
                        var segLength = this._calculatePolylineLength(pl);
                        if (has('ipad') || has('iphone') || has('android')) {
                            // if mobile we want to offset the text so it can be seen.
                            var pt = new Point(e.mapPoint.x, e.mapPoint.y, this.map.spatialReference);
                            pt.y += this._calculateDistanceFromPixels(20);
                            this._addSegmentMeasure(pt, 0, segLength);
                        } else {
                            this._addSegmentMeasure(e.mapPoint, 0, segLength);
                        }
                    }
                    if (this.measureType === 'TRIANGLE') {
                        var pl = Polygon(gra.geometry);
                        firstPoint = pl.getPoint(0, 1);
                        lastPoint = pl.getPoint(0, 2);
                        if (firstPoint) { // this is for IE. It can't resolve the point when it begins drawing.
                            var segLength = this._calculateSegmentLength(firstPoint, lastPoint);
                            var angle = this._calculateAngle(firstPoint, lastPoint);
                            var midPT = this._calculateMidPoint(firstPoint, lastPoint);
                            this._addSegmentMeasure(midPT, angle, segLength);
                        }
                    }
                    if (this.measureType === 'EXTENT') {
                        var ext = gra._extent;
                        firstPoint = Point(ext.xmin, ext.ymax);
                        lastPoint = Point(ext.xmax, ext.ymax);
                        var segLength = this._calculateSegmentLength(firstPoint, lastPoint);
                        var angle = this._calculateAngle(firstPoint, lastPoint);
                        var midPT = this._calculateMidPoint(firstPoint, lastPoint);
                        this._addSegmentMeasure(midPT, angle, 'w: ' + segLength);
                        fPoint = Point(ext.xmin, ext.ymin);
                        lPoint = Point(ext.xmin, ext.ymax);
                        var segLength = this._calculateSegmentLength(fPoint, lPoint);
                        var angle = this._calculateAngle(fPoint, lPoint);
                        var midPT = this._calculateMidPoint(fPoint, lPoint);
                        this._addSegmentMeasure2(midPT, angle, 'h: ' + segLength);
                    }
                    if (this.measureType === 'CIRCLE') {
                        var ext = gra._extent;
                        var segLength = this._calculateSegmentLength(ext.getCenter(), e.mapPoint);
                        if (has('ipad') || has('iphone') || has('android')) {
                            // if mobile we want to offset the text so it can be seen.
                            var pt = new Point(e.mapPoint.x, e.mapPoint.y, this.map.spatialReference);
                            pt.y += this._calculateDistanceFromPixels(20);
                            this._addSegmentMeasure(pt, 0, 'r=' + segLength);
                        } else {
                            this._addSegmentMeasure(e.mapPoint, 0, 'r=' + segLength);
                        }
                    }
                    if (this.measureType === 'ELLIPSE') {
                        var ext = gra._extent;
                        firstPoint = Point(ext.xmin, ext.ymax);
                        lastPoint = Point(ext.xmax, ext.ymax);
                        var segLength = this._calculateSegmentLength(firstPoint, lastPoint);
                        var angle = this._calculateAngle(firstPoint, lastPoint);
                        var midPT = this._calculateMidPoint(firstPoint, lastPoint);
                        this._addSegmentMeasure(midPT, angle, 'w: ' + segLength);
                        var fPoint = Point(ext.xmin, ext.ymin);
                        var lPoint = Point(ext.xmin, ext.ymax);
                        var segLength = this._calculateSegmentLength(fPoint, lPoint);
                        var angle = this._calculateAngle(fPoint, lPoint);
                        var midPT = this._calculateMidPoint(fPoint, lPoint);
                        this._addSegmentMeasure2(midPT, angle, 'h: ' + segLength);
                    }
                    if (this.measureType == 'FREEHAND_POLYGON') {
                        var pl = new Polyline(gra.geometry.spatialReference);
                        var points = gra.geometry.rings[0];
                        points = points.slice(0, points.length - 1);
                        pl.addPath(points);
                        var segLength = this._calculatePolylineLength(pl);
                        if (has('ipad') || has('iphone') || has('android')) {
                            // if mobile we want to offset the text so it can be seen.
                            var pt = new Point(e.mapPoint.x, e.mapPoint.y, this.map.spatialReference);
                            pt.y += this._calculateDistanceFromPixels(20);
                            this._addSegmentMeasure(pt, 0, segLength);
                        } else {
                            this._addSegmentMeasure(e.mapPoint, 0, segLength);
                        }
                    }
                }
            },

            _calculateSegmentLength: function(pt1, pt2) {
                var pl = new Polyline(this.map.spatialReference);
                pl.addPath([pt1, pt2]);
                // we want the last point being drawn
                var unit = this.distanceUnitSelect.value;
				var gsUnit = this._getUnitByEsriUnit(unit);
				var geoLength = 0;
				if (this.useGeodesic) {
					geoLength = geometryEngine.geodesicLength(pl, gsUnit);
				} else {
					geoLength = geometryEngine.planarLength(pl, gsUnit);
				}
                var abbr = this._getDistanceUnitInfo(unit).label;
                var localeLength = jimuUtils.localizeNumber(geoLength.toFixed(1));
                var length = localeLength + " " + abbr;
                this.textSymChooser.inputText.value = length;
                this.textSymChooser.textPreview.innerHTML = length;
                return length;
            },

            _calculatePolylineLength: function(pl) {
                // we want the last point being drawn
                var unit = this.distanceUnitSelect.value;
				var gsUnit = this._getUnitByEsriUnit(unit);
				var geoLength = 0;
				if (this.useGeodesic) {
					geoLength = geometryEngine.geodesicLength(pl, gsUnit);
				} else {
					geoLength = geometryEngine.planarLength(pl, gsUnit);
				}
                var abbr = this._getDistanceUnitInfo(unit).label;
                // this is a placeholder for logic.  Need to add logic for actual map units either meters or feet
                var localeLength = jimuUtils.localizeNumber(geoLength.toFixed(1));
                var length = localeLength + " " + abbr;
                this.textSymChooser.inputText.value = length;
                return length;
            },

            _calculateAngle: function(pt1, pt2) {
                // some basic trig to calculate the angle for the text to be placed
                var y = pt2.y - pt1.y;
                var x = pt2.x - pt1.x;
                var r = y / x;
                var angle = Math.atan(r) * 180 / Math.PI * -1;
                return angle;
            },

            _calculateMidPoint: function(pt1, pt2) {
                var midX = (pt1.x + pt2.x) / 2;
                var midY = (pt1.y + pt2.y) / 2;
                var midPoint = new Point(midX, midY, this.map.spatialReference);
                return midPoint;
            },

            _calculateMidPointWithOffset: function(pt1, pt2) {
                // THIS DOESN'T WORK YET...  NEED TO GET BETTER FORMULA FOR CALCULATING OFFSET
                var midX = (pt1.x + pt2.x) / 2;
                var midY = (pt1.y + pt2.y) / 2;
                // offset the point from the line to do smooth tracking of the measurement
                var offset = this._calculateDistanceFromPixels(10); // convert 10 pixels into map units
                var dx = pt1.x - pt2.x;
                var slope = dx / (pt1.y - pt2.y);
                var x = (Math.sqrt(Math.abs(Math.pow(offset, 2) - Math.pow(dx, 2))) / slope) + midX;
                var y = (slope * (x - midX)) + midY;
                var midPoint = new Point(x, y, this.map.spatialReference);
                return midPoint;
            },

            _calculateDistanceFromPixels: function(pixels) {
                var screenPoint = this.map.toScreen(this.map.extent.getCenter());

                var upperLeftScreenPoint = new Point(screenPoint.x - pixels, screenPoint.y - pixels);
                var lowerRightScreenPoint = new Point(screenPoint.x + pixels, screenPoint.y + pixels);

                var upperLeftMapPoint = this.map.toMap(upperLeftScreenPoint);
                var lowerRightMapPoint = this.map.toMap(lowerRightScreenPoint);

                var ext = new Extent(upperLeftMapPoint.x, upperLeftMapPoint.y, lowerRightMapPoint.x, lowerRightMapPoint.y, this.map.spatialReference);
                return ext.getWidth();
            },

            _addSegmentMeasure: function(pt, angle, length) {
                var a = Font.STYLE_ITALIC;
                var b = Font.VARIANT_NORMAL;
                var c = Font.WEIGHT_BOLD;
                var symbolFont = new Font(this.textSymChooser.textFontSize.value + "px", a, b, c, "Courier");
                var fontColor = this.textSymChooser.textColor.color;
                var textSymbol = new TextSymbol(length, symbolFont, fontColor);
				var xOff = 0;
				var yOff = 0;
                if (angle >= 0 && angle < 45) {
                    xOff = 5;
                    yOff = 10;
                } else if (angle > 45) {
                    xOff = 10;
                    yOff = 5;
                } else if (angle > -45 && angle < 0) {
                    xOff = 5;
                    yOff = 13;
                } else {
                    xOff = -10;
                    yOff = 5;
                }
                textSymbol.setOffset(xOff, yOff);
                textSymbol.setAngle(angle);
                if (this.measureGraphic === null || this.measureGraphic._graphicsLayer === null) {
					var att = {id: this.editGraphicID, index: this.measureSegment};
                    this.measureGraphic = new Graphic(pt, textSymbol, att, null);
                    this.measureGraphicsLayer.add(this.measureGraphic);
                } else {
                    this.measureGraphic.setGeometry(pt);
                    this.measureGraphic.setSymbol(textSymbol);
					console.log("Moving Segment Measure...");
                }
            },

            _addClickMeasure: function(pt, angle, length) {
                var a = Font.STYLE_ITALIC;
                var b = Font.VARIANT_NORMAL;
                var c = Font.WEIGHT_BOLD;
                var symbolFont = new Font(this.textSymChooser.textFontSize.value + "px", a, b, c, "Courier");
                var fontColor = this.textSymChooser.textColor.color;
                var textSymbol = new TextSymbol(length, symbolFont, fontColor);
				var xOff = 0;
				var yOff = 0;
                if (angle >= 0 && angle < 45) {
                    xOff = 5;
                    yOff = 10;
                } else if (angle > 45) {
                    xOff = 10;
                    yOff = 5;
                } else if (angle > -45 && angle < 0) {
                    xOff = 5;
                    yOff = 13;
                } else {
                    xOff = -10;
                    yOff = 5;
                }
                textSymbol.setOffset(xOff, yOff);
                textSymbol.setAngle(angle);
				var att = {id: this.editGraphicID, index: 999};
                var gra = new Graphic(pt, textSymbol, att, null);
                this.measureGraphicsLayer.add(gra);
            },

            _addSegmentMeasure2: function(pt, angle, length) {
                var a = Font.STYLE_ITALIC;
                var b = Font.VARIANT_NORMAL;
                var c = Font.WEIGHT_BOLD;
                var symbolFont = new Font(this.textSymChooser.textFontSize.value + "px", a, b, c, "Courier");
                var fontColor = this.textSymChooser.textColor.color;
                var textSymbol = new TextSymbol(length, symbolFont, fontColor);
				var xOff = 0;
				var yOff = 0;
                if (angle >= 0 && angle < 45) {
                    xOff = 5;
                    yOff = 10;
                } else if (angle > 45) {
                    xOff = 10;
                    yOff = 5;
                } else if (angle > -45 && angle < 0) {
                    xOff = 5;
                    yOff = 13;
                } else {
                    xOff = -10;
                    yOff = 5;
                }
                textSymbol.setOffset(xOff, yOff);
                textSymbol.setAngle(angle);
                if (this.measureGraphic2 === null) {
					var att = {id: this.editGraphicID, index: this.measureSegment};
                    this.measureGraphic2 = new Graphic(pt, textSymbol, att, null);
                    this.measureGraphicsLayer.add(this.measureGraphic2);
                } else {
                    this.measureGraphic2.setGeometry(pt);
                    this.measureGraphic2.setSymbol(textSymbol);
                }
            },

            _clear: function() {
				
				// if the user was editing, let's turn editing off
				if (this.editingEnabled) {
					this.editToolbar.deactivate();
					this.editingEnabled = false;
				}
				
                this.measureGraphicsLayer.clear();
            },

            _addReturnMeasure: function(pt, angle, length) {
                var a = Font.STYLE_ITALIC;
                var b = Font.VARIANT_NORMAL;
                var c = Font.WEIGHT_BOLD;
                var symbolFont = new Font(this.textSymChooser.textFontSize.value + "px", a, b, c, "Courier");
                var fontColor = this.textSymChooser.textColor.color;
                var textSymbol = new TextSymbol(length, symbolFont, fontColor);
				var xOff = 0;
				var yOff = 0;
                if (angle >= 0 && angle < 45) {
                    xOff = 5;
                    yOff = 10;
                } else if (angle > 45) {
                    xOff = 10;
                    yOff = 5;
                } else if (angle > -45 && angle < 0) {
                    xOff = 5;
                    yOff = 13;
                } else {
                    xOff = -10;
                    yOff = 5;
                }
                textSymbol.setOffset(xOff, yOff);
                textSymbol.setAngle(angle);
                if (this.measureGraphicReturn === null) {
					var att = {id: this.editGraphicID, index: this.measureSegment + 1};
                    this.measureGraphicReturn = new Graphic(pt, textSymbol, att, null);
                    this.measureGraphicsLayer.add(this.measureGraphicReturn);
                } else {
					// need to always make the return segment the highest number
					this.measureGraphicReturn.attributes.index = this.measureSegment + 1;
                    this.measureGraphicReturn.setGeometry(pt);
                    this.measureGraphicReturn.setSymbol(textSymbol);
                }
            },

            _initUnitSelect: function() {
                this._initDefaultUnits();
                this._initConfigUnits();
                var a = this.configDistanceUnits;
                var b = this.defaultDistanceUnits;
                this.distanceUnits = a.length > 0 ? a : b;
                var c = this.configAreaUnits;
                var d = this.defaultAreaUnits;
                this.areaUnits = c.length > 0 ? c : d;
                array.forEach(this.distanceUnits, lang.hitch(this, function(unitInfo) {
                    var option = {
                        value: unitInfo.unit,
                        label: unitInfo.label
                    };
                    this.distanceUnitSelect.addOption(option);
                }));

                array.forEach(this.areaUnits, lang.hitch(this, function(unitInfo) {
                    var option = {
                        value: unitInfo.unit,
                        label: unitInfo.label
                    };
                    this.areaUnitSelect.addOption(option);
                }));
            },

            _initDefaultUnits: function() {
                this.defaultDistanceUnits = [{
                    unit: 'MILES',
                    label: this.nls.miles
                }, {
                    unit: 'KILOMETERS',
                    label: this.nls.kilometers
                }, {
                    unit: 'NAUTICAL_MILES',
                    label: this.nls.nauticalMiles
                }, {
                    unit: 'FEET',
                    label: this.nls.feet
                }, {
                    unit: 'METERS',
                    label: this.nls.meters
                }, {
                    unit: 'YARDS',
                    label: this.nls.yards
                }];

                this.defaultAreaUnits = [{
                    unit: 'SQUARE_MILES',
                    label: this.nls.squareMiles
                }, {
                    unit: 'SQUARE_KILOMETERS',
                    label: this.nls.squareKilometers
                }, {
                    unit: 'ACRES',
                    label: this.nls.acres
                }, {
                    unit: 'HECTARES',
                    label: this.nls.hectares
                }, {
                    unit: 'SQUARE_METERS',
                    label: this.nls.squareMeters
                }, {
                    unit: 'SQUARE_FEET',
                    label: this.nls.squareFeet
                }, {
                    unit: 'SQUARE_YARDS',
                    label: this.nls.squareYards
                }];
            },

            _initConfigUnits: function() {
                array.forEach(this.config.distanceUnits, lang.hitch(this, function(unitInfo) {
                    var unit = unitInfo.unit;
                    if (esriUnits[unit]) {
                        var defaultUnitInfo = this._getDefaultDistanceUnitInfo(unit);
                        unitInfo.label = defaultUnitInfo.label;
                        this.configDistanceUnits.push(unitInfo);
                    }
                }));

                array.forEach(this.config.areaUnits, lang.hitch(this, function(unitInfo) {
                    var unit = unitInfo.unit;
                    if (esriUnits[unit]) {
                        var defaultUnitInfo = this._getDefaultAreaUnitInfo(unit);
                        unitInfo.label = defaultUnitInfo.label;
                        this.configAreaUnits.push(unitInfo);
                    }
                }));
            },

            _getDefaultDistanceUnitInfo: function(unit) {
                for (var i = 0; i < this.defaultDistanceUnits.length; i++) {
                    var unitInfo = this.defaultDistanceUnits[i];
                    if (unitInfo.unit === unit) {
                        return unitInfo;
                    }
                }
                return null;
            },

            _getDefaultAreaUnitInfo: function(unit) {
                for (var i = 0; i < this.defaultAreaUnits.length; i++) {
                    var unitInfo = this.defaultAreaUnits[i];
                    if (unitInfo.unit === unit) {
                        return unitInfo;
                    }
                }
                return null;
            },

            _getDistanceUnitInfo: function(unit) {
                for (var i = 0; i < this.distanceUnits.length; i++) {
                    var unitInfo = this.distanceUnits[i];
                    if (unitInfo.unit === unit) {
                        return unitInfo;
                    }
                }
                return null;
            },

            _getAreaUnitInfo: function(unit) {
                for (var i = 0; i < this.areaUnits.length; i++) {
                    var unitInfo = this.areaUnits[i];
                    if (unitInfo.unit === unit) {
                        return unitInfo;
                    }
                }
                return null;
            },

            _setMeasureVisibility: function() {
                html.setStyle(this.measureSection, 'display', 'block');
                html.setStyle(this.areaMeasure, 'display', 'block');
                html.setStyle(this.distanceMeasure, 'display', 'block');
            },

            _getPointSymbol: function() {
                return this.pointSymChooser.getSymbol();
            },

            _getLineSymbol: function() {
				var sym = this.lineSymChooser.getSymbol();
				if (this.editingEnabled) {
					this._changeGraphicSymbol(sym);
				}
					
                return sym;
            },

            _getPolygonSymbol: function() {
				var sym = this.fillSymChooser.getSymbol();
				if (this.editingEnabled) {
					this._changeGraphicSymbol(sym);
				}
					
                return sym;
            },
			
			_changeGraphicSymbol: function(sym) {
				var gra = null;
				for (var i = 0; i < this.measureGraphicsLayer.graphics.length; i++) {
					var g = this.measureGraphicsLayer.graphics[i];
					var att = g.attributes;
					if (att.id === this.editToolbar._graphic.attributes.id && g.geometry.type !== 'point') {
						if (g.geometry.type === 'polyline') {
							var col = this.lineSymChooser.lineColor.color;
							var a = 1 - this.lineSymChooser.lineAlpha.opacitySlider.value / 100;
							var lc = new Color([col.r, col.g, col.b, a]);
							var ls = new SimpleLineSymbol(this.lineSymChooser.lineStylesSelect.value, lc, this.lineSymChooser.lineWidth.value);
							g.setSymbol(ls);
						} else {
							g.setSymbol(sym);
						}
					}
				}
			},

            _getTextSymbol: function() {
				var sym = this.textSymChooser.getSymbol();
				if (this.editingEnabled) {
					this._changeTextSymbol(this.editToolbar._graphic.attributes.id,sym);
				}
                return sym;
            },
			
			_changeTextSymbol: function(sym) {
				for (var i = 0; i < this.measureGraphicsLayer.graphics.length; i++) {
					var g = this.measureGraphicsLayer.graphics[i];
					var att = g.attributes;
					if (att.id === this.editToolbar._graphic.attributes.id && g.geometry.type === 'point') {
						var a = Font.STYLE_ITALIC;
						var b = Font.VARIANT_NORMAL;
						var c = Font.WEIGHT_BOLD;
						var symbolFont = new Font(this.textSymChooser.textFontSize.value + "px", a, b, c, "Courier");
						var fontColor = this.textSymChooser.textColor.color;
						var ts = new TextSymbol(g.symbol.text, symbolFont, fontColor);
						ts.setAngle(g.symbol.angle);
						ts.setOffset(g.symbol.xoffset, g.symbol.yoffset);
						g.setSymbol(ts);
					}
				}
			},

            _setDrawDefaultSymbols: function() {
                this.drawBox.setPointSymbol(this._getPointSymbol());
                this.drawBox.setLineSymbol(this._getLineSymbol());
                this.drawBox.setPolygonSymbol(this._getPolygonSymbol());
                this.drawBox.setTextSymbol(this._getTextSymbol());
            },

            onClose: function() {
                this.drawBox.deactivate();
                this.enableWebMapPopup();
            },

            _addLineMeasure: function(pl) {
				if (pl.paths[0].length < 3) {
					return;
				}
                var a = Font.STYLE_ITALIC;
                var b = Font.VARIANT_NORMAL;
                var c = Font.WEIGHT_BOLD;
                var symbolFont = new Font(this.textSymChooser.textFontSize.value + "px", a, b, c, "Courier");
                var fontColor = this.textSymChooser.textColor.color;
                var ext = pl.getExtent();
                var center = ext.getCenter();
                var unit = this.distanceUnitSelect.value;
				var gsUnit = this._getUnitByEsriUnit(unit);
				var geoLength = 0;
				if (this.useGeodesic) {
					geoLength = geometryEngine.geodesicLength(pl, gsUnit);
				} else {
					geoLength = geometryEngine.planarLength(pl, gsUnit);
				}
                var abbr = this._getDistanceUnitInfo(unit).label;
                var localeLength = jimuUtils.localizeNumber(geoLength.toFixed(1));
                var length = localeLength + " " + abbr;
                var textSymbol = new TextSymbol(length, symbolFont, fontColor);
				var att = {id: this.editGraphicID, index: 999};
                var labelGraphic = new Graphic(center, textSymbol, att, null);
               	this.measureGraphicsLayer.add(labelGraphic);
            },

            _addPolygonMeasure: function(pl) {
                var a = Font.STYLE_ITALIC;
                var b = Font.VARIANT_NORMAL;
                var c = Font.WEIGHT_BOLD;
                var symbolFont = new Font(this.textSymChooser.textFontSize.value + "px", a, b, c, "Courier");
                var fontColor = this.textSymChooser.textColor.color;
                var ext = pl.getExtent();
                var center = ext.getCenter();
                var areaUnit = this.areaUnitSelect.value;
                var areaAbbr = this._getAreaUnitInfo(areaUnit).label;
				var gsUnit = this._getUnitByEsriUnit(areaUnit);
				var geoArea = 0;
				if (this.useGeodesic) {
					geoArea = geometryEngine.geodesicArea(pl, gsUnit);
				} else {
					geoArea = geometryEngine.planarArea(pl, gsUnit);
				}
                var localeArea = jimuUtils.localizeNumber(geoArea.toFixed(1));
                var area = localeArea + " " + areaAbbr;

                var polyline = new Polyline(pl.spatialReference);
                var points = pl.rings[0];
                polyline.addPath(points);
                var lengthUnit = this.distanceUnitSelect.value;
                var lengthAbbr = this._getDistanceUnitInfo(lengthUnit).label;
				gsUnit = this._getUnitByEsriUnit(lengthUnit);
				var geoLength = 0;
				if (this.useGeodesic) {
					geoLength = geometryEngine.geodesicLength(polyline, gsUnit);
				} else {
					geoLength = geometryEngine.planarLength(polyline, gsUnit);
				}
                var localeLength = jimuUtils.localizeNumber(geoLength.toFixed(1));
                var length = localeLength + " " + lengthAbbr;
                var textSymbol = new TextSymbol(area, symbolFont, fontColor);
                textSymbol.setOffset(0, this.textSymChooser.textFontSize.value);
				var att = {id: this.editGraphicID, index: 999};
                var areaGraphic = new Graphic(center, textSymbol, att, null);
                this.measureGraphicsLayer.add(areaGraphic);
                var textLSymbol = new TextSymbol(length, symbolFont, fontColor);
                textLSymbol.setOffset(0, this.textSymChooser.textFontSize.value * -1);
	            var lengthGraphic = new Graphic(center, textLSymbol, att, null);
               	this.measureGraphicsLayer.add(lengthGraphic);
            },
	
			_getUnitByEsriUnit: function(unit){
				var gsUnit = -1;
				var esriUn = esriUnits[unit];
				switch(esriUn){
					case esriUnits.KILOMETERS:
						gsUnit = 9036;
						break;
					case esriUnits.MILES:
						gsUnit = 9035;
						break;
					case esriUnits.NAUTICAL_MILES:
						gsUnit = 9030;
						break;
					case esriUnits.METERS:
						gsUnit = 9001;
						break;
					case esriUnits.FEET:
						gsUnit = 9003;
						break;
					case esriUnits.YARDS:
						gsUnit = 9096;
						break;
					case esriUnits.SQUARE_KILOMETERS:
						gsUnit = 109414;
						break;
					case esriUnits.SQUARE_MILES:
						gsUnit = 109413;
						break;
					case esriUnits.ACRES:
						gsUnit = 109402;
						break;
					case esriUnits.HECTARES:
						gsUnit = 109401;
						break;
					case esriUnits.SQUARE_METERS:
						gsUnit = 109404;
						break;
					case esriUnits.SQUARE_FEET:
						gsUnit = 109405;
						break;
					case esriUnits.SQUARE_YARDS:
						gsUnit = 109442;
						break;
				}
				return gsUnit;
			},

            destroy: function() {
                if (this.drawBox) {
                    this.drawBox.destroy();
                    this.drawBox = null;
                }
                if (this.pointSymChooser) {
                    this.pointSymChooser.destroy();
                    this.pointSymChooser = null;
                }
                if (this.lineSymChooser) {
                    this.lineSymChooser.destroy();
                    this.lineSymChooser = null;
                }
                if (this.fillSymChooser) {
                    this.fillSymChooser.destroy();
                    this.fillSymChooser = null;
                }
                if (this.textSymChooser) {
                    this.textSymChooser.destroy();
                    this.textSymChooser = null;
                }
                this.inherited(arguments);
            },

            disableWebMapPopup: function() {
                if (this.map && this.map.webMapResponse) {
                    var handler = this.map.webMapResponse.clickEventHandle;
                    if (handler) {
                        handler.remove();
                        this.map.webMapResponse.clickEventHandle = null;
                    }
                }
            },

            enableWebMapPopup: function() {
                if (this.map && this.map.webMapResponse) {
                    var handler = this.map.webMapResponse.clickEventHandle;
                    var listener = this.map.webMapResponse.clickEventListener;
                    if (listener && !handler) {
                        this.map.webMapResponse.clickEventHandle = on(this.map,
                            'click',
                            lang.hitch(this.map, listener));
                    }
                }
            },

            startup: function() {
                this.inherited(arguments);
                this.viewStack.startup();
                this.viewStack.switchView(null);
                this.disableWebMapPopup();
            }
        });
    });