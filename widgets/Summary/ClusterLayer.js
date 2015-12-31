define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/Color',
    'esri/layers/GraphicsLayer',
    'esri/graphic',
    'esri/geometry/Extent',
    'esri/geometry/Point',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/Font',
    'esri/symbols/TextSymbol'
  ],

  function(declare, array, Color, GraphicsLayer, Graphic,
    Extent, Point, SimpleMarkerSymbol, SimpleLineSymbol, Font, TextSymbol) {
    var clusterLayer = declare('ClusterLayer', [GraphicsLayer], {

      constructor: function(options) {

        //basic esri.layers.GraphicsLayer option(s)
        this.name = options.id;

        this.displayOnPan = options.displayOnPan || false;

        //set the map
        this._map = options.map;

        this.clusterSize = options.clusterSize || 100;

        this.color = options.color || '#ff0000';

        this.countField = options.countField;

        //holds all the features for this cluster layer
        this._features = [];

        //set incoming features
        try {
          this.setFeatures(options.features);
        } catch (ex) {
          console.log(ex);
        }

        //following the basics of creating a custom layer
        this.loaded = true;
        this.onLoad(this);
      },

      //set features
      setFeatures: function(features) {
        if (this._map.infoWindow.isShowing) {
          this._map.infoWindow.hide();
        }
        this._features = features;
        this._clusterFeatures();
      },

      //set color
      setColor: function(color) {
        this.color = color;
        this._clusterFeatures();
      },

      // cluster features
      _clusterFeatures: function() {

        this.clear();
        var features = this._features;
        if (features.length > 0) {

          var clusterSize = this.clusterSize;
          var clusterGraphics = [];

          var sr = this._map.spatialReference;
          var mapExt = this._map.extent;
          var o = new Point(mapExt.xmin, mapExt.ymax, sr);

          var rows = Math.ceil(this._map.height / clusterSize);
          var cols = Math.ceil(this._map.width / clusterSize);
          var distX = mapExt.getWidth() / this._map.width * clusterSize;
          var distY = mapExt.getHeight() / this._map.height * clusterSize;

          for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
              var x1 = o.x + (distX * c);
              var y2 = o.y - (distY * r);
              var x2 = x1 + distX;
              var y1 = y2 - distY;

              var ext = new Extent(x1, y1, x2, y2, sr);

              var cGraphics = [];
              for (var i in features) {
                var feature = features[i];
                if (ext.contains(feature.geometry)) {
                  cGraphics.push(feature);
                }
              }
              if (cGraphics.length > 0) {
                var cPt = this._getClusterCenter(cGraphics);
                clusterGraphics.push({
                  center: cPt,
                  graphics: cGraphics
                });
              }
            }
          }

          //add cluster to map
          for (var g in clusterGraphics) {
            var clusterGraphic = clusterGraphics[g];
            var count = this._getClusterCount(clusterGraphic);
            // count = clusterGraphic.graphics.length; // web map template version
            var data = clusterGraphic.graphics;
            var label = count.toString();
            var size = label.length * 19;
            var symColor = this._getSymbolColor();
            var cls = new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL, new Color(0, 0, 0, 0), 0);
            var csym = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,
              size * 1.6, cls, new Color([symColor[0], symColor[1], symColor[2], 0.4]));
            var csym2 = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,
              size, cls, new Color([symColor[0], symColor[1], symColor[2], 0.8]));
            var fnt = new Font();
            fnt.family = "Arial";
            fnt.size = "12px";
            var symText = new TextSymbol(label, fnt, "#ffffff");
            symText.setOffset(0, -4);

            var attr = {
              Count: count,
              Data: data
            };
            if (count > 1) {
              this.add(new Graphic(clusterGraphic.center, csym, attr));
              this.add(new Graphic(clusterGraphic.center, csym2, attr));
              this.add(new Graphic(clusterGraphic.center, symText, attr));
            } else {
              var pt = clusterGraphic.graphics[0].geometry;
              this.add(new Graphic(pt, csym2, attr));
              this.add(new Graphic(pt, symText, attr));
            }

          }

        }

      },

      _getSymbolColor: function() {
        var symColor = Color.fromString(this.color);
        var darkColor = Color.fromString("#000000");
        var newColor = Color.blendColors(symColor, darkColor, 0.1);
        return newColor.toRgb();
      },

      _getClusterCount: function(clusterGraphic) {
        var count = 0;
        for (var i = 0; i < clusterGraphic.graphics.length; i++) {
          var g = clusterGraphic.graphics[i];
          if (this.countField && g.attributes[this.countField]) {
            count += g.attributes[this.countField];
          } else {
            count += 1;
          }
        }
        return count;
      },

      _getClusterCenter: function(graphics) {
        var xSum = 0;
        var ySum = 0;
        var count = graphics.length;
        array.forEach(graphics, function(graphic) {
          xSum += graphic.geometry.x;
          ySum += graphic.geometry.y;
        }, this);
        var cPt = new Point(xSum / count, ySum / count, graphics[0].geometry.spatialReference);
        return cPt;
      }
    });
    return clusterLayer;
  });
