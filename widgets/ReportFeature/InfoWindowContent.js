///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
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
  'dojo/_base/array',
  'dojo/on',
  'dojo/dom-construct',
  'dojo/dom-class',
  'dojo/query',

  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',

  'esri/tasks/datareviewer/ReviewerAttributes',

  'dojo/text!./InfoWindowContent.html',

  'dojox/validate',
    'jimu/tokenUtils',
  'dojox/validate/check',
  'dojo/NodeList-dom'
], function(
  declare, array, on, domConstruct, domClass, query,
  _WidgetBase, _TemplatedMixin,
  ReviewerAttributes,
  template,
  validate, tokenUtils
) {
  return declare([_WidgetBase, _TemplatedMixin], {
    baseClass: 'drs-feature-info-window',
    templateString: template,
    infoTitle: null,
    // custom setters
    _setGraphicAttr: function(newGraphic) {
      this.setGraphic(newGraphic);
    },
    _setLayerNameAttr: function(layerName) {
      this.setLayerName(layerName);
    },
    _setNlsAttr: function(nls) {
      this.setLocalizedStrings(nls);
    },
    postCreate: function() {
      this.inherited(arguments);
      this._initEvents();
    },

    // wire up events
    _initEvents: function() {
      var _this = this;
      if (this.includeReportedBy === "logon" || this.includeReportedBy === "default"){
        this.showHideDynamicRows(false);
      }
      else{
        this.showHideDynamicRows(true);
      }

      this.own(on(this.formNode, 'submit', function(e) {
        e.preventDefault();
        _this._onFormSubmit();
      }));
    },
    showHideDynamicRows:function(bShowHide){
      var dynamicRows = query(".dynamicRow", this.formNode);
      //  var dynamicRows = query('.dynamicRow');
      if(dynamicRows !== undefined && dynamicRows !== null && dynamicRows.length > 0){
        for(var i = 0; i < dynamicRows.length; i++){
          if(bShowHide){
            dynamicRows[i].style.display = '';
          }else {
            dynamicRows[i].style.display = 'none';
          }
        }
      }
    },
    // clear form
    // Set layer name of selected feature.
    setLayerName: function(layerName) {
      this.formNode.reset();
      this.layerName = layerName;
      if (!this.reviewerAttributes) {
        this.reviewerAttributes = new ReviewerAttributes();
      }
      this.reviewerAttributes.resourceName = layerName;
      this.reviewerAttributes.severity = 5; // default
      this.reviewerAttributes.lifecycleStatus = 1; // default
      this.layerNode.innerHTML = this.layerName;
      this.statusNode.focus();
    },

    // TODO: remove, not used by this widget
    // get graphic to submit with report
    setGraphic: function(newGraphic) {
      this.graphic = newGraphic;
    },

    // set localized strings in form
    // and populate the status drop down options
    setLocalizedStrings: function(nls) {
      var infoWindowTitle = this.params.title;
      this.statusNode.options.length = 0;
      var html = '';
      this.nls = nls;
      if (infoWindowTitle === this.nls.select){
        for (var select in nls) {
          if (select.indexOf('selectReviewStatus') > -1) {
            html = html  + '<option>' + nls[select] + '</option>';
          }
        }
      }
      else{
        for (var draw in nls) {
          if (draw.indexOf('drawReviewStatus') > -1) {
            html = html  + '<option>' + nls[draw] + '</option>';
          }
        }
      }
      if (html) {
        domConstruct.place(html, this.statusNode, 'last');
      }
    },

    // On click of button set ReviewerAttribute properties
    // (including default reported by if needed)
    // and dispatch reportButtonClicked event
    _onFormSubmit: function() {
      if (this.isFormValid()) {
        if (this.includeReportedBy === "default") {
          this.reviewerAttributes.reviewTechnician = this.defaultUserName;
        }
        else if (this.includeReportedBy ===  "logon" ){
          var credential = tokenUtils.getPortalCredential(tokenUtils.getPortalUrl());
          this.reviewerAttributes.reviewTechnician = credential.userId;
        }
        else {
          if (0 < this.reportedByNode.value.length) {
            this.reviewerAttributes.reviewTechnician = this.reportedByNode.value;
          }
        }
        this.reviewerAttributes.notes = this.notesNode.value;
        this.reviewerAttributes.reviewStatus = this.statusNode.value;
        this.reviewerAttributes.severity = this.severityNode.value;
        this.emit('ReportSubmit', {}, [this.reviewerAttributes]);
      }
    },

    // make sure user supplied all required inputs
    // highlight invalid fields
    isFormValid: function() {
      var profile = {
        trim: [ 'notes', 'reviewTechnician' ],
        required: [ 'reviewStatus' ]
      };
      var results, hasMissing;
      if (this.includeReportedBy === "user") {
        profile.required.push('reviewTechnician');
      }
      results = validate.check(this.formNode, profile);
      hasMissing = results.hasMissing();
      query('input, select', this.formNode).removeClass('drs-input-err');
      if (hasMissing) {
        array.forEach(results.getMissing(), function(name) {
          domClass.add(this.formNode[name], 'drs-input-err');
        }, this);
      }
      return !hasMissing;
    }
  });
});