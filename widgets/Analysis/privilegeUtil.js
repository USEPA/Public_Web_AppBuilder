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
  'dojo/_base/lang',
  'dojo/_base/array',
  'jimu/portalUtils',
  'jimu/portalUrlUtils',
  'esri/kernel'
], function(lang, array, portalUtils, portalUrlUtils, esriNs) {
  var mo = {};
  var ALLOWED_ROLES=[
    'org_admin',
    'account_admin',
    'org_publisher',
    'account_publisher'
  ];

  mo.loadPrivileges = function(portalUrl){
    this.userProfile = null;
    var portal = portalUtils.getPortal(portalUrl);

    if(portal.haveSignIn()){
      return this._loadUserInfo(portal);
    }else{
      return this._signIn(portal);
    }
  };

  mo._signIn = function(portal){
    return portal.loadSelfInfo().then(lang.hitch(this, function(info){
      var portalHost = portalUtils.getPortal(info.portalHostname);
      if(portalHost === null){
        return false;
      }else{
        return portalHost.signIn().then(lang.hitch(this, function(credential){
          return this._loadUserInfo(portalHost, credential);
        }));
      }
    }));
  };

  mo._registerOrgCredential = function(credential, orgPortalUrl){
    orgPortalUrl = portalUrlUtils.getStandardPortalUrl(orgPortalUrl);
    var c = lang.clone(credential.toJson());
    var restUrl = orgPortalUrl + '/sharing/rest';
    c.server = restUrl;
    c.resources = [restUrl];
    esriNs.id.registerToken(c);
  };

  mo._loadUserInfo = function(portal, credential){
    return portal.loadSelfInfo().then(lang.hitch(this, function(res){
      if(!res.urlKey){
        return false;
      }
      if(res && res.user){
        this.userProfile = {
          role:res.user.role || res.user.id,
          isCustomRole: ('roleId' in res.user),
          portalUrl: res.urlKey + '.' + res.customBaseUrl,
          privileges:{}
        };
        array.forEach(res.user.privileges,function(privilege){
          //privilege pattern: "premium:user:spatialanalysis"
          if(typeof privilege === 'string'){
            var values = privilege.split(':');
            if(values.length === 3){
              this.userProfile.privileges[values[2]] = true;
            }
          }
        },this);
        if(credential){
          this._registerOrgCredential(credential,this.userProfile.portalUrl);
        }
        return true;
      }else{
        return false;
      }
    }));
  };

  mo._privilegeLoaded = function(){
    return typeof this.userProfile !== 'undefined' &&
        this.userProfile !== null;
  };

  mo.getUserPortal = function(){
    if(this._privilegeLoaded()){
      return this.userProfile.portalUrl;
    }else{
      return null;
    }
  };

  mo.isAnalysisAvailable = function(){
    if(this._privilegeLoaded()){
      if(this.userProfile.isCustomRole){
        /*
          Custom role
          To use any of the analysis tool, you will need the following privileges:
          1. Create, update and delete content
          2. Publish hosted features
          3. Spatial Analysis
        */
        return this._hasPrivilege('createItem') &&
            this._hasPrivilege('publishFeatures') &&
            this._hasPrivilege('spatialanalysis');
      }else{//built-in role
        return (array.indexOf(ALLOWED_ROLES,this.userProfile.role) !== -1);
      }
    }else{
      return false;
    }
  };

  mo.hasPrivileges = function(privileges){
    if(lang.isArray(privileges)){
      return array.every(privileges, function(privilege){
        return this._hasPrivilege(privilege);
      },this);
    }else{
      return true;
    }
  };

  mo._hasPrivilege = function(privilege){
    if(this._privilegeLoaded()){
      return this.userProfile.privileges[privilege]===true;
    }else{
      return false;
    }
  };

  return mo;
});
