define([
    "dojo/_base/declare" ,
    "../BaseDiscoveryMixin",
    "dojo/_base/lang",
    'dojo/_base/array'
],
    function (declare, BaseDiscoveryMixin, lang,array) {
        return declare([BaseDiscoveryMixin], {
            startDate: null,
            endDate: null,
            filteredArchiveSensorTypes: [],
            selectedIconPlatforms: [],
            cloudCover: null,
            constructor: function (params) {
                lang.mixin(this, params || {});
            },
            isFeatureFiltered: function (feature) {
                var featureCloudValue, featureDateValue;
                featureCloudValue = feature[this.COMMON_FIELDS.CLOUD_COVER_FIELD];
                featureDateValue = feature[this.COMMON_FIELDS.DATE_FIELD];
                if (this.cloudCover !== null && this.cloudCover !== 1) {
                    if (this._valueGreaterThanOrNull(featureCloudValue, this.cloudCover)) {
                        return true;
                    }
                }
                if (this.startDate) {
                    if (this._valueLessThanOrNull(featureDateValue, this.startDate)) {
                        return true;
                    }
                }
                if (this.endDate) {
                    if (this._valueGreaterThanOrNull(featureDateValue, this.endDate)) {
                        return true;
                    }
                }
                if (feature[this.COMMON_FIELDS.IS_ICON_RESULT]) {
                    if (!this.selectedIconPlatforms || array.indexOf(this.selectedIconPlatforms, feature.attributes.PlatformName) < 0) {
                        return true;
                    }
                }
                return false;
            },
            _valueLessThanOrNull: function (value, checkValue) {
                return ((!value && value !== 0) || value < checkValue);
            },
            _valueGreaterThanOrNull: function (value, checkValue) {
                return ((!value && value !== 0) || value > checkValue);
            }
        });
    });