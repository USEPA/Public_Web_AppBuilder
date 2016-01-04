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
  'dojo/_base/array',
  'dojo/Deferred',
  'esri/request'
],
function(array, Deferred, esriRequest) {
  var mo = {};

  mo.promisifyGetValue = function(inputEditor){
    var oldGetValue = inputEditor.getValue;
    inputEditor.getValue = function(){
      var value = oldGetValue.apply(inputEditor);
      //for now, we use then to check whether the return value is a deferred object
      if(value !== null && value.then){
        return value;
      }else{
        var def = new Deferred();
        def.resolve(value);
        return def;
      }
    };
  };

  mo.allowShareResult = function(config){
    return array.some(config.outputParams, function(param){
      return param.dataType === 'GPRecordSet' ||
          (param.dataType === 'GPFeatureRecordSetLayer' &&
          param.defaultValue &&
          param.defaultValue.geometryType);
    });
  };

  mo.getServiceDescription = function(gpTaskUrl){
    var args = {
      url: gpTaskUrl,
      content: {f: "json"},
      handleAs:"json",
      callbackParamName: "callback"
    };

    var ret;

    return esriRequest(args).then(function(taskInfo){
      ret = taskInfo;
      return getGPServerDescription(gpTaskUrl).then(function(serverInfo){
        ret.serverInfo = serverInfo;
        ret.useResultMapServer = serverInfo.hasResultMapServer;

        return uploadSupported(serverInfo).then(function(uploadsInfo){
          ret.serverInfo.supportsUpload = uploadsInfo.supportsUpload;
          if("maxUploadFileSize" in uploadsInfo){
            ret.serverInfo.maxUploadFileSize = uploadsInfo.maxUploadFileSize;
          }
          return ret;
        });
      });
    });
  };

  function getGPServerDescription(gpTaskUrl){
    var args = {
      url: getGPServerUrl(gpTaskUrl),
      content: {f: "json"},
      handleAs:"json"
    };
    return esriRequest(args).then(function(serverDescription){
      var serverInfo = {};
      serverInfo.currentVersion = serverDescription.currentVersion || 0;
      serverInfo.url = args.url;
      serverInfo.hasResultMapServer =
          serverDescription.executionType === "esriExecutionTypeAsynchronous" &&
          ('resultMapServerName' in serverDescription) &&
          serverDescription.resultMapServerName !== '';
      return serverInfo;
    });
  }

  function getGPServerUrl(gpTaskUrl){
    var lastPathIndex = gpTaskUrl.search(/[\w]+[^\/]*$/g);
    return gpTaskUrl.substr(0, lastPathIndex);
  }

  function uploadSupported(serverInfo){
    if(serverInfo.currentVersion >= 10.1){
      //get upload info
      var args = {
        url: serverInfo.url + 'uploads/info',
        content: {f: "json"},
        handleAs:"json"
      };
      return esriRequest(args).then(function(uploadsInfo){
        return {
          supportsUpload: true,
          maxUploadFileSize: uploadsInfo.maxUploadFileSize
        };
      }, function(){
        return {
          supportsUpload: false
        };
      });
    }else{
      var retDef = new Deferred();
      retDef.resolve({supportsUpload:false});
      return retDef;
    }
  }

  return mo;
});
