define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dijit/_WidgetBase',
  'dojo/on',
  'jimu/LayerInfos/LayerInfos',
  './InfoWindowAction',
  'esri/graphicsUtils'
], function(
  declare, lang, _WidgetBase, on, LayerInfos, InfoWindowAction, graphicsUtils
) {

  return declare([_WidgetBase], {

    postCreate: function() {
      this.inherited(arguments);
      LayerInfos.getInstance(this.map, this.map.itemInfo)
        .then(lang.hitch(this, function(layerInfos) {
        this.layerInfos = layerInfos;
      }));

      this.ZoomToBtn = new InfoWindowAction({
        buttonInfo: {
          title: 'Zoom to',
          baseClass: "zoomTo",
          imgsrc: 'widgets/eSearch/images/i_zoomin.png'
        }
      });

      this.own(on(this.ZoomToBtn,
                  "buttonClick",
                  lang.hitch(this, this._onZoomToClick)));

      this.own(on(this.ZoomToBtn,
                  "selectionChange",
                  lang.hitch(this, this._onSelectionChange)));

      this.taxReportBtn = new InfoWindowAction({
        buttonInfo: {
          title: 'Tax Report',
          baseClass: "taxReport",
          imgsrc: 'widgets/eSearch/images/i_report_f.png'
        }
      });

      this.own(on(this.taxReportBtn,
                  "buttonClick",
                  lang.hitch(this, this._onTaxReportClick)));

      this.own(on(this.taxReportBtn,
                  "selectionChange",
                  lang.hitch(this, this._onSelectionChange)));

      this.taxDueBtn = new InfoWindowAction({
        buttonInfo: {
          title: 'Taxes Due',
          baseClass: "taxDue",
          imgsrc: 'widgets/eSearch/images/i_tax_f.png'
        }
      });

      this.own(on(this.taxDueBtn,
                  "buttonClick",
                  lang.hitch(this, this._ontaxDueClick)));

      this.own(on(this.taxDueBtn,
                  "selectionChange",
                  lang.hitch(this, this._onSelectionChange)));

      this.improvementBtn = new InfoWindowAction({
        buttonInfo: {
          title: 'Improvements',
          baseClass: "improvement",
          imgsrc: 'widgets/eSearch/images/i-home.png'
        }
      });

      this.own(on(this.improvementBtn,
                  "buttonClick",
                  lang.hitch(this, this._onImprovementClick)));

      this.own(on(this.improvementBtn,
                  "selectionChange",
                  lang.hitch(this, this._onSelectionChange)));

      this.parcelCoordBtn = new InfoWindowAction({
        buttonInfo: {
          title: 'Parcel Coordinates',
          baseClass: "parcelCoords",
          imgsrc: 'widgets/eSearch/images/i_parcel.png'
        }
      });

      this.own(on(this.parcelCoordBtn,
                  "buttonClick",
                  lang.hitch(this, this._onParcelCoordClick)));

      this.own(on(this.parcelCoordBtn,
                  "selectionChange",
                  lang.hitch(this, this._onSelectionChange)));
    },

    _onTaxReportClick: function(selectedFeature) {
      /*jshint unused: false*/
      var featureKey = selectedFeature.attributes.PPIN;
      if(!featureKey){
        if(selectedFeature.attributes.content &&
           selectedFeature.attributes.content.indexOf('<em>PPIN</em>: ') >= 0){
          var icontent = selectedFeature.attributes.content;
          featureKey = icontent.substring(15,icontent.indexOf('<br>'))
        }
      }
      this.parcelWidget._showTaxReport(featureKey);
    },

    _onImprovementClick: function(selectedFeature) {
      /*jshint unused: false*/
      var featureKey = selectedFeature.attributes.PPIN;
      if(!featureKey){
        if(selectedFeature.attributes.content &&
           selectedFeature.attributes.content.indexOf('<em>PPIN</em>: ') >= 0){
          var icontent = selectedFeature.attributes.content;
          featureKey = icontent.substring(15,icontent.indexOf('<br>'))
        }
      }
      this.parcelWidget._showImprovements(featureKey);
    },

    _ontaxDueClick: function(selectedFeature) {
      /*jshint unused: false*/
      var featureKey = selectedFeature.attributes.PPIN;
      if(!featureKey){
        if(selectedFeature.attributes.content &&
           selectedFeature.attributes.content.indexOf('<em>PPIN</em>: ') >= 0){
          var icontent = selectedFeature.attributes.content;
          featureKey = icontent.substring(15,icontent.indexOf('<br>'))
        }
      }
      this.parcelWidget._showTaxBill(featureKey);
    },

    _onParcelCoordClick: function(selectedFeature) {
      /*jshint unused: false*/
      var featureKey = selectedFeature.attributes.PPIN;
      if(!featureKey){
        if(selectedFeature.attributes.content &&
           selectedFeature.attributes.content.indexOf('<em>PPIN</em>: ') >= 0){
          var icontent = selectedFeature.attributes.content;
          featureKey = icontent.substring(15,icontent.indexOf('<br>'))
        }
      }
      this.parcelWidget._showParcelCoordReport(featureKey);
    },

    _onZoomToClick: function(selectedFeature) {
      /*jshint unused: false*/
      if (selectedFeature.geometry.type === 'point') {
        var maxZoom = this.map.getMaxZoom();
        this.map.centerAndZoom(selectedFeature.geometry, maxZoom - 1);
      } else {
        this.map.setExtent(graphicsUtils.graphicsExtent([selectedFeature]));
      }
    },

    _onSelectionChange: function(selectedFeature) {
      if(this.layerInfos &&
          selectedFeature._layer &&
          selectedFeature._layer.name === 'Search result: Parcels' ||
          (selectedFeature._layer.name === 'Identify Results' &&
           selectedFeature.attributes.content &&
           selectedFeature.attributes.content.indexOf('<em>PPIN</em>: ') >= 0)) {
        this.taxReportBtn.enableButtonNode();
        this.taxDueBtn.enableButtonNode();
        this.improvementBtn.enableButtonNode();
        this.taxDueBtn.enableButtonNode();
        this.parcelCoordBtn.enableButtonNode();
        this.ZoomToBtn.enableButtonNode();
      } else {
        this.taxReportBtn.disableButtonNode();
        this.taxDueBtn.disableButtonNode();
        this.improvementBtn.disableButtonNode();
        this.taxDueBtn.disableButtonNode();
        this.parcelCoordBtn.disableButtonNode();
        this.ZoomToBtn.disableButtonNode();
      }
    },

    destroy: function() {
      this.inherited(arguments);
      this.taxReportBtn.destroy();
      this.taxDueBtn.destroy();
      this.improvementBtn.destroy();
      this.parcelCoordBtn.destroy();
      this.ZoomToBtn.destroy();
    }

  });
});
