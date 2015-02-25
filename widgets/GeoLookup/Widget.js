///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define(['dojo/_base/declare',
     'dijit/_WidgetsInTemplateMixin',
        'jimu/BaseWidget',
        'jimu/dijit/LoadingIndicator',
        'dojo/dom',
        'dojo/on',
        'dojo/_base/html',
        'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/string',
        'dojo/dom-class',
        'dojo/dom-construct',
        'dojox/data/CsvStore',
        'dojox/encoding/base64',
        'esri/graphic',
        'esri/Color',
        'esri/geometry/webMercatorUtils',
        'esri/layers/FeatureLayer',
        'esri/geometry/Multipoint',
        'esri/geometry/Point',
        'esri/InfoTemplate',
        'esri/tasks/QueryTask',
        'esri/tasks/query',
        'esri/SpatialReference',
        'esri/symbols/jsonUtils',
        'esri/renderers/UniqueValueRenderer',
        'jimu/dijit/Message',
        './layerQueryDetails'

],

    function (
        declare,
             _WidgetsInTemplateMixin,
        BaseWidget,
        LoadingIndicator,
        dom,
        on,
        html,
        lang,
        array,
        string,
        domClass,
        domConstruct,
        CsvStore,
        base64,
        Graphic,
        Color,
        webMercatorUtils,
        FeatureLayer,
        Multipoint,
        Point,
        InfoTemplate,
        QueryTask,
        Query,
        SpatialReference,
        symbolJsonUtils,
        UniqueValueRenderer,
        Message,
        layerQueryDetails
        ) {

        return declare([BaseWidget, _WidgetsInTemplateMixin], {

            baseClass: 'solutions-widget-geolookup',
            csvStore: null,
            layerLoaded: false,
            lookupLayersFieldNames: [],
            lookupLayersFields: [],
            combinedFields: [],
            latField: null,
            longField: null,
            renderer: null,
            srWebMerc: null,
            syncLayers: null,
            enrichResultsProg: {},
            enrichResultsText: {},
            postCreate: function () {
                this.inherited(arguments);

            },

            startup: function () {
                this.inherited(arguments);
                this.loading.show();
                html.place(html.toDom(this.nls.description), this.widgetDescription);
                this._buildRenderer();
                this._initalizeLookupLayers();
                var c = dom.byId(this.id);
                on(c, 'dragover', function (event) {
                    event.preventDefault();
                });

                on(c, 'dragenter', function (event) {
                    event.preventDefault();
                });

                on(c, 'drop', lang.hitch(this, this._handleCSVDrop));
                this.srWebMerc = new SpatialReference({ wkid: 102100 });
                array.forEach(this.config.enrichLayers, function (lay) {
                    var mapLay = this.map.getLayer(lay.id);
                    if (mapLay) {
                        var textID = lay.id;
                        var progID = lay.id + "_prog";
                        var row = domConstruct.toDom("<tr class='controls'>" +
                          "<td><div id='" + progID + "' class='status processing' /></td>" +
                          "<td><div id='" + textID + "' class='result-text' ></div>" +
                          "</td></tr>");

                        domConstruct.place(row, this.widgetsResultsTableBody);
                        this.enrichResultsProg[textID] = dojo.byId(progID);
                        this.enrichResultsText[textID] = dojo.byId(textID);
                        this.enrichResultsText[textID].innerHTML = string.substitute(this.nls.results.recordsEnriched,
                        {
                            0: 0,
                            1: 0,
                            2: mapLay.name
                        });
                    }
                }, this);

                this.loading.hide();
            },
            _buildRenderer: function () {

                this.symIn = symbolJsonUtils.fromJson(this.config.SymbolWithin);
                this.symOut = symbolJsonUtils.fromJson(this.config.SymbolOutside);
                this.renderer = new UniqueValueRenderer(this.symIn, this.config.valueIn);
                this.renderer.addValue(this.config.valueIn, this.symIn);
                this.renderer.addValue(this.config.valueOut, this.symOut);

            },
            _initalizeLookupLayers: function () {
                this.lookupLayersField = [];
                this.lookupLayersFieldNames = [];
                var mapLayer;
                var fieldNames;
                array.forEach(this.config.enrichLayers, function (configLayer) {

                    configLayer.mapLayer = this.map.getLayer(configLayer.id);
                    if (configLayer.mapLayer) {
                        fieldNames = array.map(configLayer.fields, function (field) {
                            return field.fieldName;
                        });
                        array.forEach(configLayer.mapLayer.fields, function (field) {
                            if (fieldNames.indexOf(field.name) >= 0) {
                                if (this.lookupLayersFieldNames.indexOf(field.name) < 0) {
                                    this.lookupLayersFieldNames.push(field.name);
                                    this.lookupLayersFields.push(field);

                                }
                            }
                        }, this);
                    }
                }, this);
            },
            fileSelected: function (evt) {
                this._processFiles(this.csvFileInput.files);
                this.inputForm.reset();
                //// Check for the various File API support.
                //if (window.FileReader) {
                //    // FileReader are supported.

                //    this._processFiles(this.csvFileInput.files);
                //} else {
                //    alert('FileReader are not supported in this browser.');
                //}
            },
            _handleCSVDrop: function (event) {
                event.preventDefault();
                var dataTransfer = event.dataTransfer;
                if (domClass.contains(this.showFileDialogBtn, 'jimu-state-disabled'))
                { return; }
                this._processFiles(dataTransfer.files);
            },
            _processFiles: function (files) {
                domClass.add(this.showFileDialogBtn, 'jimu-state-disabled')
                this._resetResults();
                if (files.length > 0) {
                    var file = files[0];
                    if (file.name.indexOf('.csv') !== -1) {
                        if (file) {
                            this.handleCSV(file);
                        } else {
                            Message({
                                message: 'File could not be processed.'
                            });
                        }
                    } else {
                        new Message({
                            message: 'Only comma delimited files (.csv) files are supported at this time.'
                        });
                    }
                }
            },
            showFileDialog: function () {
                if (domClass.contains(this.showFileDialogBtn, 'jimu-state-disabled'))
                { return;}
                this.csvFileInput.click();

            },
            handleCSV: function (file) {
              
                console.log('Reading CSV: ', file, ', ', file.name, ', ', file.type, ', ', file.size);
                var reader = new FileReader();
                reader.onload = lang.hitch(this, function () {
                    this._processCSVData(reader.result);
                });
                reader.readAsText(file);
            },

            _processCSVData: function (data) {
                var newLineIndex = data.indexOf('\n');
                var firstLine = lang.trim(data.substr(0, newLineIndex));
                var separator = this._getSeparator(firstLine);
                this.csvStore = new CsvStore({
                    data: data,
                    separator: separator
                });

                this.csvStore.fetch({
                    onComplete: lang.hitch(this, this._csvReadComplete),
                    onError: lang.hitch(this, function (error) {
                        domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled')
                        var msg = string.substitute(this.nls.error.fetchingCSV,
                              { 0: error.message });
                        Message({ message: msg });

                        console.error(msg, error);
                    })
                });
            },
            _csvReadComplete: function (items) {
                var recCount = items.length.toString();
                domClass.remove(this.results, "hide");
                this.resultsLoading.innerHTML = string.substitute(this.nls.results.csvLoaded,
                    {
                        0: recCount
                    });
                domClass.replace(this.resultsLoadingImage, "complete", "processing");

                var objectId = 0;
                var featureCollection = this._generateFeatureCollectionTemplateCSV(this.csvStore, items);
                var popupInfo = this._generateDefaultPopupInfo(featureCollection);
                var infoTemplate = new InfoTemplate(this._buildInfoTemplate(popupInfo));
                var latField, longField;

                this.latField = null;
                this.longField = null;
                array.some(this.csvFields, function (fieldName) {
                    var matchId;
                    matchId = array.indexOf(this.config.latFields,
                        fieldName.toLowerCase());
                    if (matchId !== -1) {
                        this.latField = fieldName;
                    }

                    matchId = array.indexOf(this.config.longFields,
                        fieldName.toLowerCase());
                    if (matchId !== -1) {
                        this.longField = fieldName;
                    }
                    if (this.latField && this.longField) {
                        return true;
                    }
                    return false;
                }, this);
                if (this.latField === null || this.longField === null) {
                    Message({
                        message: 'Location fields are invalid. Please check the .csv.'
                    });
                    return;
                }
                var errorCnt = 0;

                array.forEach(items, function (item, i) {

                    var attributes = {};

                    array.forEach(this.combinedFields, function (attr) {
                        var value = Number(this.csvStore.getValue(item, attr));
                        attributes[attr] = isNaN(value) ? this.csvStore.getValue(item, attr) : value;
                    }, this);

                    attributes.__OBJECTID = objectId;
                    objectId++;

                    var latitude = parseFloat(attributes[this.latField]);
                    var longitude = parseFloat(attributes[this.longField]);

                    if (isNaN(latitude) || isNaN(longitude)) {
                        errorCnt = errorCnt + 1;
                        this.enrichErrors.innerHTML = string.substitute(this.nls.results.recordsError,
                      {
                          0: errorCnt
                      });

                    }

                    var geometry = new Point(webMercatorUtils.lngLatToXY(longitude, latitude), this.srWebMerc);

                    var feature = {
                        'geometry': geometry.toJson(),
                        'attributes': attributes
                    };
                    featureCollection.featureSet.features.push(feature);
                    this.resultsPlotting.innerHTML = string.substitute(this.nls.results.recordsPlotted,
                      {
                          0: (i + 1).toString(),
                          1: recCount
                      });
                }, this);

                if (this.layerLoaded) {
                    this.map.removeLayer(this.featureLayer);
                }

                this.featureLayer = new FeatureLayer(featureCollection, {
                    infoTemplate: infoTemplate,
                    id: 'csvLayer',
                    name: 'CSV Layer'
                });
                this.featureLayer.setRenderer(this.renderer);
                domClass.replace(this.resultsPlottingImage, "complete", "processing");
                this._enrichData(this.featureLayer);
                this._zoomToData(this.featureLayer);

            },
            _enrichData: function (flayer) {
                this.syncLayers = [];
                array.forEach(this.config.enrichLayers, function (layer) {
                    var idx = 0;
                    var fields = array.map(layer.fields, function (field) { return field.fieldName; });
                    syncDet = new layerQueryDetails(
                        {
                            "layer": layer.mapLayer,
                            "numberOfRequest": flayer.graphics.length,
                            "totalRecords": flayer.graphics.length,
                            'fields': fields,
                            'intersectField': this.config.intersectField,
                            'valueIn': this.config.valueIn,
                            'valueOut': this.config.valueOut,
                            'valueInSym': this.symIn,
                            'valueOutSym': this.symOut
                        });
                    on(syncDet, "complete", lang.hitch(this, this._syncComplete));
                    on(syncDet, "requestComplete", lang.hitch(this, this._requestComplete));
                    this.syncLayers.push(syncDet);

                    this.queryCallback(flayer.graphics, idx, layer, fields, syncDet);

                }, this);
            },

            queryCallback: function (chunks, idx, layer, fields, syncDet) {
                var def;
                if (idx === 0) {

                    var query = new Query();
                    // query.outSpatialReference = { wkid: 102100 };
                    query.returnGeometry = true;
                    query.geometry = chunks[idx].geometry;
                    def = layer.mapLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW,
                                 lang.hitch(this, this.queryCallback(chunks, idx + 1, layer, fields, syncDet)),
                                 lang.hitch(this, this.queryErrorback()));
                    syncDet.addDeferred(def, chunks[idx]);
                } else {
                    return function (results) {
                        if (chunks.length > idx) {
                            var query = new Query();
                            // query.outSpatialReference = { wkid: 102100 };
                            query.returnGeometry = true;
                            query.geometry = chunks[idx].geometry;
                            def = layer.mapLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW,
                                lang.hitch(this, this.queryCallback(chunks, idx + 1, layer, fields, syncDet)),
                                lang.hitch(this, this.queryErrorback()));
                            syncDet.addDeferred(def, chunks[idx]);

                        }
                        return { 'results': results };
                    };
                }
            },
            queryErrorback: function () {
                return function (err) {

                    console.log(err);
                    return err;
                };
            },
            _syncComplete: function (args) {
                domClass.replace(this.enrichResultsProg[args.layerID], "complete", "processing");
                var stillProc = array.some(this.syncLayers, function (syncDet) {

                    return !syncDet.isComplete();
                }, this);
                if (stillProc){
                    return;
                }
                this.featureLayer.redraw();
                domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled')
            },
            _requestComplete: function (args) {
                this.enrichResultsText[args.layerID].innerHTML = string.substitute(this.nls.results.recordsEnriched,
                   {
                       0: args.currentNumber,
                       1: args.totalRecords,
                       2: args.name
                   });
            },

            _resetResults: function () {
                domClass.replace(this.resultsLoadingImage, "processing", "complete");
                domClass.replace(this.resultsPlottingImage, "processing", "complete");
                for (var key in this.enrichResultsProg) {
                    if (this.enrichResultsProg.hasOwnProperty(key)) {
                        domClass.replace(this.enrichResultsProg[key], "processing", "complete");
                    }
                }
                for (var key in this.enrichResultsProg) {
                    if (this.enrichResultsText.hasOwnProperty(key)) {
                        var mapLay = this.map.getLayer(key);
                     
                            this.enrichResultsText[key].innerHTML = string.substitute(this.nls.results.recordsEnriched,
                       {
                           0: 0,
                           1: 0,
                           2: mapLay.name
                       });
                        
                    }
                }

                this.resultsLoading.innerHTML = string.substitute(this.nls.results.csvLoaded,
                 {
                     0: 0
                 });


                this.enrichErrors.innerHTML = "";
                this.resultsPlotting.innerHTML = string.substitute(this.nls.results.recordsPlotted,
                     {
                         0: 0,
                         1: 0
                     });

            },
            _getSeparator: function (string) {
                var separators = [',', '      ', ';', '|'];
                var maxSeparatorLength = 0;
                var maxSeparatorValue = '';
                array.forEach(separators, function (separator) {
                    var length = string.split(separator).length;
                    if (length > maxSeparatorLength) {
                        maxSeparatorLength = length;
                        maxSeparatorValue = separator;
                    }
                });
                return maxSeparatorValue;
            },

            _generateFeatureCollectionTemplateCSV: function (store, items) {
                var featureCollection = {
                    'layerDefinition': null,
                    'featureSet': {
                        'features': [],
                        'geometryType': 'esriGeometryPoint',
                        'spatialReference': {
                            'wkid': 102100
                        }
                    },

                };

                featureCollection.layerDefinition = {
                    'geometryType': 'esriGeometryPoint',
                    'objectIdField': '__OBJECTID',
                    'type': 'Feature Layer',
                    'typeIdField': '',
                    'fields': [{
                        'name': '__OBJECTID',
                        'alias': '__OBJECTID',
                        'type': 'esriFieldTypeOID',
                        'editable': false,
                        'domain': null
                    }],
                    'types': [],
                    'capabilities': 'Query'
                };
                this.csvFields = store.getAttributes(items[0]);
                this.combinedFields = lang.clone(this.csvFields);
                this.combinedFields.push(this.config.intersectField);

                array.forEach(this.combinedFields, function (field) {

                    var value = store.getValue(items[0], field);
                    var parsedValue = Number(value);
                    if (isNaN(parsedValue) || field === this.config.intersectField) {
                        featureCollection.layerDefinition.fields.push({
                            'name': field,
                            'alias': field,
                            'type': 'esriFieldTypeString',
                            'editable': true,
                            'domain': null
                        });
                    } else {
                        featureCollection.layerDefinition.fields.push({
                            'name': field,
                            'alias': field,
                            'type': 'esriFieldTypeDouble',
                            'editable': true,
                            'domain': null
                        });
                    }
                }, this);
                this.combinedFields = this.combinedFields.concat(this.lookupLayersFieldNames);
                featureCollection.layerDefinition.fields = featureCollection.layerDefinition.fields.concat(this.lookupLayersFields);

                return featureCollection;
            },

            _generateDefaultPopupInfo: function (featureCollection) {
                var fields = featureCollection.layerDefinition.fields;
                var decimal = {
                    'esriFieldTypeDouble': 1,
                    'esriFieldTypeSingle': 1
                };
                var integer = {
                    'esriFieldTypeInteger': 1,
                    'esriFieldTypeSmallInteger': 1
                };
                var dt = {
                    'esriFieldTypeDate': 1
                };
                var displayField = null;
                var fieldInfos = array.map(fields,
                    lang.hitch(this, function (item) {
                        if (item.name.toUpperCase() === 'NAME') {
                            displayField = item.name;
                        }
                        var visible = (item.type !== 'esriFieldTypeOID' &&
                            item.type !== 'esriFieldTypeGlobalID' &&
                            item.type !== 'esriFieldTypeGeometry');
                        var format = null;
                        if (visible) {
                            var f = item.name.toLowerCase();
                            var hideFieldsStr =
                              ',stretched value,fnode_,tnode_,lpoly_,rpoly_,poly_,subclass,subclass_,rings_ok,rings_nok,';
                            if (hideFieldsStr.indexOf(',' + f + ',') > -1 ||
                                f.indexOf('objectid') > -1 ||
                                f.indexOf('_i') === f.length - 2) {
                                visible = false;
                            }
                            if (item.type in integer) {
                                format = {
                                    places: 0,
                                    digitSeparator: true
                                };
                            } else if (item.type in decimal) {
                                format = {
                                    places: 4,
                                    digitSeparator: true
                                };
                            } else if (item.type in dt) {
                                format = {
                                    dateFormat: 'shortDateShortTime'
                                };
                            }
                        }
                        return lang.mixin({}, {
                            fieldName: item.name,
                            label: item.alias,
                            isEditable: false,
                            tooltip: '',
                            visible: visible,
                            format: format,
                            stringFieldOption: 'textbox'
                        });
                    }));

                var popupInfo = {
                    title: displayField ? '{' + displayField + '}' : '',
                    fieldInfos: fieldInfos,
                    description: null,
                    showAttachments: false,
                    mediaInfos: []
                };
                return popupInfo;
            },

            _buildInfoTemplate: function (popupInfo) {
                var json = {
                    content: '<table>'
                };

                array.forEach(popupInfo.fieldInfos, function buildTemplate(field) {
                    if (field.visible) {
                        json.content += '<tr><td valign="top">' + field.label +
                            ': <\/td><td valign="top">${' + field.fieldName + '}<\/td><\/tr>';
                    }
                });
                json.content += '<\/table>';
                return json;
            },

            _zoomToData: function (featureLayer) {

                var multipoint = new Multipoint(this.map.spatialReference);
                array.forEach(featureLayer.graphics, function (graphic) {
                    var geometry = graphic.geometry;
                    if (geometry) {
                        multipoint.addPoint({
                            x: geometry.x,
                            y: geometry.y
                        });
                    }
                });
                featureLayer.name = 'CSV Layer';
                this.map.addLayer(this.featureLayer);
                this.layerLoaded = true;
                if (multipoint.points.length > 0) {
                    this.map.setExtent(multipoint.getExtent().expand(1.25), true);
                }
            },

        });
    });