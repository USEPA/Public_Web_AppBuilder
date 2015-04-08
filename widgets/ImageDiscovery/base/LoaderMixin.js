define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "esri/request",
        "dojo/_base/xhr"
    ],
    function (declare, lang, esriRequest, xhr) {
        return declare([], {
            joinUrl: function (url, appendString) {
                if (!url) {
                    url = "";
                }
                if (!appendString) {
                    appendString = "";
                }
                var endingSlash = url.lastIndexOf("/") === url.length - 1;
                if (!endingSlash) {
                    url += "/";
                }
                //strip the starting slash off the appender
                if (appendString[0] === "/") {
                    appendString = appendString.substring(1);
                }
                return url + appendString;
            },
            /**
             * loads the url as JSON
             * @param {string} url  string to load JSON from
             * @param {function} callback function to pass the response to
             * @param {function} errback  function to pass the HTTP error to
             */
            loadJson: function (url, callback, errback) {
                if (url == null || url == "" || callback == null || !lang.isFunction(callback)) {
                    return;
                }
                var params = {
                    url: url,
                    handleAs: "json",
                    load: callback
                };
                if (errback != null && lang.isFunction(errback)) {
                    params.error = errback;
                }
                xhr.get(params);
            },
            /**
             *loads the url as JSONP
             * @param {string} url string to resource that returns JSONP
             * @param {Object} params  content object to send with request
             * @param {function} callback function to pass the response to
             * @param {function} errback  function to pass the HTTP error to
             * @param {string} callbackParam callback name parameter
             * @param options
             * @param headers
             */
            loadJsonP: function (url, params, callback, errback, callbackParam, options, headers) {
                if (!errback) {
                    errback = lang.hitch(this, function (error) {
                        var msg = "Could not resource : " + url + ". Please verify URL is accessible.";
                    });
                }
                if (!callbackParam) {
                    callbackParam = "callback";
                }
                var jsonpArgs = {
                    headers: headers || {},
                    callbackParamName: callbackParam,
                    content: params,
                    url: url
                };
                if (!options) {
                    options = {};
                }
                esriRequest(jsonpArgs, options).then(callback, errback);
            },
            loadJsonPFromForm: function (url, form, callback, errback, callbackParam) {
                if (!errback) {
                    errback = lang.hitch(this, function (error) {
                        var msg = "Could not resource : " + url + ". Please verify URL is accessible.";
                    });
                }
                if (!callbackParam) {
                    callbackParam = "callback";
                }
                var jsonpArgs = {
                    callbackParamName: callbackParam,
                    content: form,
                    url: url
                };
                esriRequest(jsonpArgs, {usePost: true}).then(callback, errback);
            }
        });
    });
