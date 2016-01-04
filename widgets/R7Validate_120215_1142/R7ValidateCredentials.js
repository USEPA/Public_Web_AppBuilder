/*

This function is inserted into a WAB startup and provides the framework to authenticate
and allow the WAB to continue or bailout.

Wait for the API to be loaded then call validate credentials and wait via a pDeferred for either
success or cancel.

For a WAB do the following steps.

		1)  Extract the files from the R7Validate_MMDDYY.zip.		
        
        2)  Copy R7AuthMod.js and R7ValidateCredentials.js files to the WAB root folder.

        3)  In the WAB root folder open the index.html file and insert the following
		    references to the files extracted in Step 1. These are inserted into the Body
			section AFTER simpleloader.js and BEFORE init.js.

		    <script type="text/javascript" src="simpleLoader.js"></script>

            <!--The following two modules handle some simple authentication 
		        calling the EPA_OSC Token validation service. These modules expect
		        a valid token on startup - if the token is not present or valid
		        the flow redirects to the EPA OSC login with a call back url.-->

		    <script  type="text/javascript" src="R7AuthMod.js"></script>
		    <script type="text/javascript" src="R5ValidateCredentials.js"></script>

		    <script type="text/javascript" src="init.js"></script>

        4)  Add the jQuery library to the HEAD of the WAB index.html

			<script type="text/javascript" src="http://r7.ercloud.org/jsapis/jquery/jquery-1.11.3.min.js"></script>

        5)  Update R7ValidateCredentials.js to specify the EPAOSC Site ID as appropriate for this WAB.
		    The Site ID is the EPAOSC numeric identifier for each site. This value is used to compose a callback URL.


Date       Who               Description
====================================================================================
053015     DPlume           Initial implementation.  
060215     DPlume           Modified to adapt to R5Auth using URL String.
062415	   DPlume           Converted to ExtJs.
062915     DPlume           Updated instructions and filenames.
120215     DPlume           Copied from R5 version and adapted to R7.


*/

(function waitForAPI() {


    if (typeof require === 'undefined') {

        if (window.console) {
            console.log('Waiting for API to be loaded.');
        }
        setTimeout(waitForAPI, 100);
        return;
    }
    else {

        validateCredentials();
    }

    function validateCredentials() {
        require([
            'dojo/aspect',
            'dojo/Deferred',
            'jimu/utils'],

        function (aspect, Deferred, jimuUtils) {

            aspect.around(jimuUtils, 'createWebMap', function (originalMethod) {

                return function (portalUrl, itemId, mapDiv, options) {

                    var mapDeferred = new Deferred();
                    var authDefer = new Deferred();
                    var authResult = null;

                    // Set up the authorization deferrer:
                    authDefer.then(

                          //Callback after resolution of the deferrer.  authResult is a record.
                           function (authResult) {

                               //ServiceStatus < 0 indicates the call to the service is incomplete.  0 indicates Cancel, > 0 indicates the service has executed, See Result for success or failure)
                               //authResult =  { ServiceStatus: N, ServiceResult: "STRING", bIsAuth: Bool};

                               if (authResult.bIsAuth) {

                                   // Simply allow the WAB to start
                                   originalMethod.call(jimuUtils, portalUrl, itemId, mapDiv, options).then(function (deferred) {
                                       mapDeferred.resolve(deferred);
                                       return;
                                   });

                               }
                               else {
                                   try {

                                       //======================================================
                                       //Called on Error or Invalid token -- simply refer back to the
                                       //EPAOSC login.

                                       mapDeferred.reject();

                                       // ================================================================
                                       // WAB INSTALL:
                                       // Update the site ID here, it is used to build the call back URL
                                       // ================================================================
									   
                                       var sSiteId = "11265"
                                       var sLoginUrl = "https://www.epaosc.org/site/login.aspx?ReturnURL=/site/map_list.aspx/?site_id=" + sSiteId;
                                       //================================================================

									   //alert("Redirecting back to EPAOSC login.")
									   console.log("Redirecting back to: " + sLoginUrl)
                                       window.location.replace(sLoginUrl);

                                   }
                                   catch (ex) {
                                       alert("validateCredentials error: " + ex.message)
                                   }

                               }  // End authResult.bIsAuth		 
                           }

                      );  // End authDefer

                    // =================================================
                    // Call this with authDefer and wait for resolution	

                     $(document).ready(function () {

                    	r7AuthMod.Authenticate2(authDefer);

                    });

                    return mapDeferred;

                };
            });
        });

    }  // End Function validateCredentials

})();