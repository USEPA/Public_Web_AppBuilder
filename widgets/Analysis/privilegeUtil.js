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
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/Deferred',
  'jimu/portalUtils',
  'jimu/portalUrlUtils',
  'jimu/Role',
  'esri/kernel',
  './PortalAnalysis'
], function(declare, lang, Deferred, portalUtils, portalUrlUtils, Role, esriNs, PortalAnalysis) {
  return declare([], {
    userRole: null,
    userPortalUrl: null,
    portalAnalysis: null,
    portalSelf: null,
    portalUrl: null,

    constructor: function(portalUrl){
      this.portalUrl = portalUrl;
    },

    _clearLoadedInfo: function(){
      this.userRole = null;
      this.userPortalUrl = null;
      this.portalAnalysis = null;
      this.portalSelf = null;
      this.portalUrl = null;
    },

    loadPrivileges: function(portalUrl){
      if(portalUrl && this.portalUrl !== portalUrl){
        this._clearLoadedInfo();
        this.portalUrl = portalUrl;
      }

      if(this._privilegeLoaded()){
        var def = new Deferred();
        def.resolve(true);
        return def;
      }

      var portal = portalUtils.getPortal(portalUrl);
      if(portal.haveSignIn()){
        return this._loadUserInfo(portal);
      }else{
        return this._signIn(portal);
      }
    },

    _signIn: function(portal){
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
    },

    _registerOrgCredential: function(credential, orgPortalUrl){
      orgPortalUrl = portalUrlUtils.getStandardPortalUrl(orgPortalUrl);
      var c = lang.clone(credential.toJson());
      var restUrl = orgPortalUrl + '/sharing/rest';
      c.server = restUrl;
      c.resources = [restUrl];
      esriNs.id.registerToken(c);
    },

    _loadUserInfo: function(portal, credential){
      return portal.loadSelfInfo().then(lang.hitch(this, function(res){
        if(res.urlKey){
          this.userPortalUrl = res.urlKey + '.' + res.customBaseUrl;
        }else{
          this.userPortalUrl = this.portalUrl;
        }
        if(res && res.user) {
          this.userRole = new Role({
            id: (res.user.roleId) ? res.user.roleId : res.user.role,
            role: res.user.role
          });
          if(res.user.privileges) {
            this.userRole.setPrivileges(res.user.privileges);
          }
          this.portalSelf = res;
          if(credential){
            this._registerOrgCredential(credential, this.userProfile.portalUrl);
          }
          this.portalAnalysis = new PortalAnalysis(this.userRole,
              this.portalSelf);
          return true;
        }else{
          return false;
        }
      }));
    },

    _privilegeLoaded: function(){
      return this.portalSelf !== null;
    },

    getUser: function(){
      if(this._privilegeLoaded()){
        return this.portalSelf.user;
      }else{
        return null;
      }
    },

    isAdmin: function(){
      if(this._privilegeLoaded()){
        return this.userRole.isAdmin();
      }else{
        return null;
      }
    },

    getUserPortal: function(){
      if(this._privilegeLoaded()){
        return this.userPortalUrl;
      }else{
        return null;
      }
    },

    isPortal: function(){
      return this.portalSelf !== null && this.portalSelf.isPortal === true;
    },

    //check to show analysis UX
    canPerformAnalysis: function(){
      return this.portalAnalysis.canPerformAnalysis();
    },

    hasPrivileges: function(privileges){
      return this.portalAnalysis.hasPrivileges(privileges);
    }
  });
});
