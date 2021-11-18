/*
* ontology Embed Plugin
*
* @author Norbert Czirjak
* @version 1.0
*/
(function () {
    /**
    * Ajax methods for data loading.
    *
    * @class
    * @singleton
    */
    CKEDITOR.ajax = ( function() {
        function createXMLHttpRequest() {
            // In IE, using the native XMLHttpRequest for local files may throw
            // "Access is Denied" errors.
            if ( !CKEDITOR.env.ie || location.protocol != 'file:' ) {
                try {
                    return new XMLHttpRequest();
                } catch ( e ) {
                }
            }

            try {
                return new ActiveXObject( 'Msxml2.XMLHTTP' );
            } catch ( e ) {}
            try {
                return new ActiveXObject( 'Microsoft.XMLHTTP' );
            } catch ( e ) {}

            return null;
        }

        function checkStatus( xhr ) {
            // HTTP Status Codes:
            //	 2xx : Success
            //	 304 : Not Modified
            //	   0 : Returned when running locally (file://)
            //	1223 : IE may change 204 to 1223 (see http://dev.jquery.com/ticket/1450)

            return ( xhr.readyState == 4 && ( ( xhr.status >= 200 && xhr.status < 300 ) || xhr.status == 304 || xhr.status === 0 || xhr.status == 1223 ) );
        }

        function getResponseText( xhr ) {
            if ( checkStatus( xhr ) )
                return xhr.responseText;
            return null;
        }

        function getResponseXml( xhr ) {
            if ( checkStatus( xhr ) ) {
                var xml = xhr.responseXML;
                return new CKEDITOR.xml( xml && xml.firstChild ? xml : xhr.responseText );
            }
            return null;
        }

        function load( url, callback, getResponseFn ) {
            var async = !!callback;
            var xhr = createXMLHttpRequest();

            if ( !xhr )
                return null;

            xhr.open( 'GET', url, async );

            if ( async ) {
                // TODO: perform leak checks on this closure.
                xhr.onreadystatechange = function() {
                    if ( xhr.readyState == 4 ) {
                        callback( getResponseFn( xhr ) );
                        xhr = null;
                    }
                };
            }

            xhr.send( null );

            return async ? '' : getResponseFn( xhr );
        }

        function post( url, data, contentType, callback, getResponseFn ) {
            var xhr = createXMLHttpRequest();

            if ( !xhr )
                    return null;

            xhr.open( 'POST', url, true );

            xhr.onreadystatechange = function() {
                if ( xhr.readyState == 4 ) {
                    if ( callback ) {
                        callback( getResponseFn( xhr ) );
                    }
                    xhr = null;
                }
            };

            xhr.setRequestHeader( 'Content-type', contentType || 'application/x-www-form-urlencoded; charset=UTF-8' );

            xhr.send( data );
        }

        return {
            /**
             * Loads data from a URL as plain text.
             *
             *		// Load data synchronously.
             *		var data = CKEDITOR.ajax.load( 'somedata.txt' );
             *		alert( data );
             *
             *		// Load data asynchronously.
             *		var data = CKEDITOR.ajax.load( 'somedata.txt', function( data ) {
             *			alert( data );
             *		} );
             *
             * @param {String} url The URL from which the data is loaded.
             * @param {Function} [callback] A callback function to be called on
             * data load. If not provided, the data will be loaded
             * synchronously.
             * @returns {String} The loaded data. For asynchronous requests, an
             * empty string. For invalid requests, `null`.
             */
            load: function( url, callback ) {
                    return load( url, callback, getResponseText );
            },

            /**
             * Creates an asynchronous POST `XMLHttpRequest` of the given `url`, `data` and optional `contentType`.
             * Once the request is done, regardless if it is successful or not, the `callback` is called
             * with `XMLHttpRequest#responseText` or `null` as an argument.
             *
             *		CKEDITOR.ajax.post( 'url/post.php', 'foo=bar', null, function( data ) {
             *			console.log( data );
             *		} );
             *
             *		CKEDITOR.ajax.post( 'url/post.php', JSON.stringify( { foo: 'bar' } ), 'application/json', function( data ) {
             *			console.log( data );
             *		} );
             *
             * @since 4.4.0
             * @param {String} url The URL of the request.
             * @param {String/Object/Array} data Data passed to `XMLHttpRequest#send`.
             * @param {String} [contentType='application/x-www-form-urlencoded; charset=UTF-8'] The value of the `Content-type` header.
             * @param {Function} [callback] A callback executed asynchronously with `XMLHttpRequest#responseText` or `null` as an argument,
             * depending on the `status` of the request.
             */
            post: function( url, data, contentType, callback ) {
                    return post( url, data, contentType, callback, getResponseText );
            },

            /**
             * Loads data from a URL as XML.
             *
             *		// Load XML synchronously.
             *		var xml = CKEDITOR.ajax.loadXml( 'somedata.xml' );
             *		alert( xml.getInnerXml( '//' ) );
             *
             *		// Load XML asynchronously.
             *		var data = CKEDITOR.ajax.loadXml( 'somedata.xml', function( xml ) {
             *			alert( xml.getInnerXml( '//' ) );
             *		} );
             *
             * @param {String} url The URL from which the data is loaded.
             * @param {Function} [callback] A callback function to be called on
             * data load. If not provided, the data will be loaded synchronously.
             * @returns {CKEDITOR.xml} An XML object storing the loaded data. For asynchronous requests, an
             * empty string. For invalid requests, `null`.
             */
            loadXml: function( url, callback ) {
                    return load( url, callback, getResponseXml );
            }
        };
    } )();
    
    CKEDITOR.plugins.add('ontology', {
        icons: 'ontology',
        init: function (editor) {
            editor.addCommand( 'insertOntology', {
                exec: function( editor ) {
                    
                    let data = CKEDITOR.ajax.load( 'https://'+ window.location.host+'/browser/api/getMetadataGui/en?_format=json' );
                    let obj = JSON.parse(data);
                    let properties = obj.properties;

                    function createRows(obj){
                        var rows = '';
                        for (const [k, o] of Object.entries(obj)) {
                            for (var key in o) {
                                //property
                                rows += '<tr><td>'+key+'</td>';
                                //machine name
                                rows += '<td>'+o[key].basic_info.machine_name+'</td>';
                                //project
                                const project = o[key].project ? o[key].project : '-';                            
                                rows += '<td style="text-align: center;">'+project+'</td>';
                                //topcollection
                                const topCollection = o[key].topCollection ? o[key].topCollection : '-';                            
                                rows += '<td style="text-align: center;">'+topCollection+'</td>';
                                //collection
                                const collection = o[key].collection ? o[key].collection : '-';                            
                                rows += '<td style="text-align: center;">'+collection+'</td>';                                
                                //resource
                                const resource = o[key].resource ? o[key].resource : '-';
                                rows += '<td style="text-align: center;">'+resource+'</td>';
                            }
                        }
                        return rows;
                    }
                    
                    function createRowsPPPO(obj){
                        var rows = '';
                        for (const [k, o] of Object.entries(obj)) {
                            for (var key in o) {
                                //property
                                rows += '<tr><td>'+key+'</td>';
                                //machine name
                                rows += '<td>'+o[key].basic_info.machine_name+'</td>';
                                //publication
                                const publication = o[key].publication ? o[key].publication : '-';                            
                                rows += '<td style="text-align: center;">'+publication+'</td>';
                                //person
                                const person = o[key].person ? o[key].person : '-';                            
                                rows += '<td style="text-align: center;">'+person+'</td>';
                                //place
                                const place = o[key].place ? o[key].place : '-';                            
                                rows += '<td style="text-align: center;">'+place+'</td>'; 
                                //organisation
                                const organisation = o[key].organisation ? o[key].organisation : '-';                            
                                rows += '<td style="text-align: center;">'+organisation+'</td>'; 
                                
                            }
                        }
                        return rows;
                    }
                                        
                    editor.insertHtml( '<table class="metadata-table" style="max-width:99%;"><thead><tr class="table-firstrow"><th style="text-align: left;">PROPERTY</th> <th style="text-align: left;">MACHINE NAME</th> <th style="text-align: center;">PROJECT</th> <th style="text-align: center;">TOPCOLLECTION</th>  <th style="text-align: center;">COLLECTION</th> <th style="text-align: center;">RESOURCE</th></tr></thead><tbody style=" word-break: break-word;">'+
                    createRows(properties.basic) + '<tr class="table-row-acdhBlue"><td colspan="6" style="text-align">ACTORS INVOLVED</td></tr>' +
                    createRows(properties.actors_involved) + '<tr class="table-row-acdhBlue"><td colspan="6" style="text-align">COVERAGE</td></tr>' +
                    createRows(properties.coverage) + '<tr class="table-row-acdhBlue"><td colspan="6" style="text-align">RIGHTS & ACCESS</td></tr>' +
                    createRows(properties.right_access) + '<tr class="table-row-acdhBlue"><td colspan="6" style="text-align">DATES</td></tr>' +
                    createRows(properties.dates) + '<tr class="table-row-acdhBlue"><td colspan="6" style="text-align">RELATIONS TO OTHER PROJECTS, COLLECTIONS OR RESOURCES</td></tr>' +
                    createRows(properties.relations_other_projects) + '<tr class="table-row-acdhBlue"><td colspan="6" style="text-align">CURATION, AUTOMATIC</td></tr>' +
                    createRows(properties.curation) + '</tbody></table><br>' + '<table class="metadata-table"  style="max-width:99%;"><thead><tr class="table-firstrow"><th style="text-align: left;">PROPERTY</th> <th style="text-align: left;">MACHINE NAME</th> <th style="text-align: center;">PUBLICATION</th> <th style="text-align: center;">PERSON</th>  <th style="text-align: center;">PLACE</th> <th style="text-align: center;">ORGANISATION</th> </tr></thead><tbody style=" word-break: break-word;">'+
                    createRowsPPPO(properties.basic) + '<tr class="table-row-acdhBlue"><td colspan="6" style="text-align">ACTORS INVOLVED</td></tr>' +
                    createRowsPPPO(properties.actors_involved) + '<tr class="table-row-acdhBlue"><td colspan="6" style="text-align">COVERAGE</td></tr>' +
                    createRowsPPPO(properties.coverage) + '<tr class="table-row-acdhBlue"><td colspan="6" style="text-align">RIGHTS & ACCESS</td></tr>' +
                    createRowsPPPO(properties.right_access) + '<tr class="table-row-acdhBlue"><td colspan="6" style="text-align">DATES</td></tr>' +
                    createRowsPPPO(properties.dates) + '<tr class="table-row-acdhBlue"><td colspan="6" style="text-align">RELATIONS TO OTHER PROJECTS, COLLECTIONS OR RESOURCES</td></tr>' +
                    createRowsPPPO(properties.relations_other_projects) + '<tr class="table-row-acdhBlue"><td colspan="6" style="text-align">CURATION, AUTOMATIC</td></tr>' +
                    createRowsPPPO(properties.curation) + '</tbody></table>' );

                }
            });
            
            editor.ui.addButton( 'Ontology', {
                label: 'Insert Ontology',
                command: 'insertOntology',
                toolbar: 'insert'
            });
        }
    });
})();
