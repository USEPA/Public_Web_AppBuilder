define([
        "dojo/_base/declare",
        "dojo/text!./template/ImageryDownloadTemplate.html",
        "dojo/topic",
        "dojo/_base/json",
        "dojo/_base/array",
        "dojo/_base/lang",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        'dijit/_WidgetsInTemplateMixin',
        "./ImageryDownloadListWidget",
        "dijit/form/Button",
        "dojo/Deferred",
        "../../../BaseDiscoveryMixin",
        "dojo/dom-class"
    ],
    function (declare, template, topic, json, array, lang, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, ImageryDownloadListWidget, Button, Deferred, BaseDiscoveryMixin, domClass) {
        return declare(
            [ _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, BaseDiscoveryMixin],
            {
                downloadLimitExceedServerDetailString: "The requested number of download images exceeds the limit.",
                bytesInMB: 1048576,
                templateString: template,

                actionButtonLabel: "Generate",
                constructor: function (params) {
                    lang.mixin(this,params || {});
                    this.imageryExportDownloadWindowTitle =  this.nls.yourFilesHaveBeenPrepared;
                    this.pendingDownloadRequests = 0;
                    this.currentDownloadResponses = [];
                    this.hasDownloadItems = false;
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this._createDownloadListWidget();
                },
                _createDownloadListWidget: function () {
                    this.downloadListWidget = new ImageryDownloadListWidget({
                        nls: this.nls
                    });
                    this.downloadListWidget.placeAt(this.downloadListWidgetContainer);
                },
                clearDownloadList: function(){
                    this.downloadListWidget.clearDownloadList();
                },
                populateDownloadLinks: function (features) {
                    var def = new Deferred();
                    this.handleGenerateDownloadLinks(features).then(lang.hitch(this, function (responses) {
                        if (!responses) {
                            def.resolve(false);
                        }
                        domClass.add(this.downloadListThrobber, "hidden");
                        domClass.remove(this.downloadListWidgetContainer, "hidden");
                        this.downloadListWidget.setDownloadList(responses);
                        def.resolve(true);
                    }));
                    return def;
                },
                /**
                 * handles the bulk of the imagery export
                 */
                handleGenerateDownloadLinks: function (features) {
                    var def = new Deferred(), downloadResponses = {},objectIdArray, key, i, currentFeature, currentServiceLabel,currentServiceConfiguration, currentDownloadItemObj,serviceUrlToObjectIds = {}, pendingDownloadCount = 0, currentServiceObjIdField, currentObjectId;
                    domClass.add(this.downloadListWidgetContainer, "hidden");
                    domClass.remove(this.downloadListThrobber, "hidden");
                    //group by service
                    for (i = 0; i < features.length; i++) {
                        currentFeature = features[i];
                        currentServiceConfiguration = currentFeature[this.COMMON_FIELDS.SERVICE_FIELD];
                        currentServiceLabel = currentServiceConfiguration.label;

                        if (!serviceUrlToObjectIds[currentServiceConfiguration.url]) {
                            objectIdArray= [];
                            serviceUrlToObjectIds[currentServiceConfiguration.url] = {objectIds:objectIdArray,serviceLabel:currentServiceLabel};
                            pendingDownloadCount++;
                        }
                        objectIdArray = serviceUrlToObjectIds[currentServiceConfiguration.url].objectIds;
                        currentServiceObjIdField = currentServiceConfiguration.__fieldConfiguration.objectIdFieldName;
                        currentObjectId = currentFeature.attributes[currentServiceObjIdField];
                        objectIdArray.push(currentObjectId);
                    }
                    if (!pendingDownloadCount) {
                        def.resolve(null);
                        return def;
                    }
                    for (key in serviceUrlToObjectIds) {
                        if (serviceUrlToObjectIds.hasOwnProperty(key)) {
                            currentDownloadItemObj =      serviceUrlToObjectIds[key];
                            this.loadJsonP(this.joinUrl(currentServiceConfiguration.url, "download"), {f: "json", rasterIds: currentDownloadItemObj.objectIds.join(",")}, lang.hitch(this, function (serviceUrl, serviceLabel,response) {
                                pendingDownloadCount--;
                                downloadResponses[serviceLabel] = this._processDownloadResponse(response, serviceUrl,serviceLabel);
                                if (pendingDownloadCount < 1) {
                                    def.resolve(downloadResponses);
                                }
                            }, key,currentDownloadItemObj.serviceLabel), lang.hitch(this, function (err) {
                                if (err && err.message) {
                                    this.showError(err.message);
                                }
                                else {
                                    this.showError(this.nls.errorDownloadingFile);
                                }
                                pendingDownloadCount--;
                                if (pendingDownloadCount < 1) {
                                    def.resolve(downloadResponses);
                                }
                            }));
                        }
                    }
                    return def;
                },
                _processDownloadResponse: function (downloadResponse, serviceUrl,serviceLabel) {
                    var i, currentDownloadItem, rasterIdToDownloadObjects = {};
                    if (downloadResponse && downloadResponse.rasterFiles) {
                        for (i = 0; i < downloadResponse.rasterFiles.length; i++) {
                            currentDownloadItem = downloadResponse.rasterFiles[i];
                            //todo: why is raster ids an array
                            if (currentDownloadItem && currentDownloadItem.rasterIds && currentDownloadItem.rasterIds.length > 0) {
                                if (!rasterIdToDownloadObjects[currentDownloadItem.rasterIds[0]]) {
                                    rasterIdToDownloadObjects[currentDownloadItem.rasterIds[0]] = [];
                                }
                                var fileName = this.getFileNameFromAtEndOfPath(currentDownloadItem.id);
                                var downloadUrl = this.joinUrl(serviceUrl, ("file?id=" + currentDownloadItem.id));
                                var currentRasterFileRasterId = currentDownloadItem.rasterIds[0];
                                var addDownloadItem = {
                                    id: currentDownloadItem.id,
                                    url: (downloadUrl + "&rasterId=" + currentRasterFileRasterId),
                                    label: fileName,
                                    serviceName: serviceLabel
                                };
                                if (currentDownloadItem.size || currentDownloadItem.size === 0) {
                                    addDownloadItem.size = this.humanFileSize(currentDownloadItem.size);
                                }
                                else {
                                    addDownloadItem.size = "? MB"
                                }
                                rasterIdToDownloadObjects[currentDownloadItem.rasterIds[0]].push(addDownloadItem);
                            }
                        }
                    }
                    return rasterIdToDownloadObjects;
                }
            });
    });