
/*

Entry point for EPA authentication -- This authenticator looks to see if caller
is already authenticated using the EPAOSC_Token given in the QueryString part
of the URL.  If the token is not valid or does not exist then redirect back
to the EPAOSC login page.  If it is valid then simply allow the deferred to 
resolve OK


Date       Who               Description
====================================================================================
053015     DPlume           Initial implementation.  
060215     DPlume           Added code to process GetString session id
062415	   DPlume           Converted to ExtJs
062915     DPlume           Cleanup and add comments
120215     DPlume           Copied from R5 and adapted to R7

*/


var r7AuthMod = (function () {

    //Public Methods:
    return {

        Authenticate2: function (pDeferred) {

            try {

                var $j = jQuery.noConflict();
                var sValidTokenUrl = "https://www.epaosc.org/svc/auth/ValidateToken.ashx?EPAOSC_Token=";

                // Get the querystring Parameters.  Remove the ?
                var params = parseQueryString(location.search.replace("?", ""));

                //                   ServiceStatus < 0 indicates the call to the service is incomplete.  0 indicates Cancel, > 0 indicates the service has executed, See Result for success or failure)         
                var _sAuthResult = { ServiceStatus: -1, ServiceResult: "NOTOPEN", bIsAuth: false };

                if (typeof params.EPAOSC_Token != 'undefined')
                {
                    
                    sValidTokenUrl += params.EPAOSC_Token;
                    var $j = jQuery.noConflict();

                    //Call the EPAOSC Token Validation Service:

                    $j.ajax({
                        type: "GET",
                        url: sValidTokenUrl,
                        error: function (o) {

                            //Create and Show the authentication form.
                            //alert("Error calling token validation service, Token: " + sEpaToken);
							
							console.log("EPAOSC TOKEN: " + params.EPAOSC_Token + "ERROR Calling Authenticate Service");

                            _sAuthResult = { ServiceStatus: -1, ServiceResult: "ERROR1", bIsAuth: false };
                            pDeferred.resolve(_sAuthResult);

                        },
                        success: function (jData) {

                            var sResult = JSON.stringify(jData)

                            if ((sResult.toLowerCase().indexOf("true") > -1)) {

                                
                                _sAuthResult = { ServiceStatus: 1, ServiceResult: "OK", bIsAuth: true };
                                pDeferred.resolve(_sAuthResult);
								
								console.log("EPAOSC TOKEN: " + params.EPAOSC_Token + "OK");
                            }
                            else {

                                
								console.log("EPAOSC TOKEN: " + params.EPAOSC_Token + "NOT VALID, redirect");
								
                                _sAuthResult = { ServiceStatus: -1, ServiceResult: "NOTVALID", bIsAuth: false };
                                pDeferred.resolve(_sAuthResult);

                            }

                        } //End Success

                    });  // End Ajax


                } //End if undefined
                else
                {
                    _sAuthResult = { ServiceStatus: -1, ServiceResult: "NOTOKEN", bIsAuth: false };
                    pDeferred.resolve(_sAuthResult);
					
					console.log("NO EPAOSC TOKEN");

                }// End if else undefined

            }
            catch (ex) {

				console.log("Program ERROR: " + ex.message);
				
                _sAuthResult = { ServiceStatus: -1, ServiceResult: "ERROR2", bIsAuth: false };
                pDeferred.resolve(_sAuthResult);

            }

        } // End Authenticate

    }; // End Return Public Methods

    function parseQueryString(queryString) {

        var params = {}, queries, temp, i, l;

        try {
            //http://www.joezimjs.com/javascript/3-ways-to-parse-a-query-string-in-a-url/

            // Split into key/value pairs
            queries = queryString.split("&");

            // Convert the array of strings into an object
            for (i = 0, l = queries.length; i < l; i++) {
                temp = queries[i].split('=');
                params[temp[0]] = temp[1];
            }

            return params;
        }
        catch (ex) {
            return params;
        }

    }; //End parseQueryString


})();  // End Module

