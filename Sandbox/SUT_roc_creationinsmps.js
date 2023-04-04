/**
 * @NApiVersion 2.x

 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
/*

Script Name: SUT_roc_creationinsmps.js
Script Type: Suitelet Script
Created Date: 14-02-2022
Created By: Samir PAtil.
Company : Yantra Inc.
Description: 
*************************************************************/
define(['N/currentRecord', 'N/format', 'N/https', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/task', 'N/log', 'N/http'],

    function (currentRecord, format, https, record, redirect, runtime, search, serverWidget, task, log, http) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */


        function onRequest(context) {
            var request = context.request;
            if (context.request.method === 'GET') // GET Method
            {
                try {


                    var form = serverWidget.createForm({
                        title: 'SMPS ROC SYNC'
                    });
                    //  form.clientScriptModulePath = './CL_YIL_Vendor_ledger.js';
                    var submit = form.addSubmitButton({
                        label: 'Submit ROC CHANGES'
                    });

                    var rocDate = form.addField({
                        id: 'custpage_date',
                        type: serverWidget.FieldType.DATE,
                        label: 'ROC Creation Date'

                    });
                    rocDate.defaultValue = new Date();
                    rocDate = rocDate.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.DISABLED
                    });
                    // var smpsstatus = form.addField({
                    //     id: 'custpage_status',
                    //     type: serverWidget.FieldType.TEXT,
                    //     //source: 'purchaseorder',
                    //     label: 'ROC SMPS STATUS',

                    // });
                    // smpsstatus = smpsstatus.updateDisplayType({
                    //     displayType: serverWidget.FieldDisplayType.DISABLED
                    // });
                    form.clientScriptFileId = 445612;
                    context.response.writePage(form);
                } catch (error) {
                    log.error('error', error.message);
                }
            } else if (context.request.method === 'POST') {
                try {
                    var region_json = [];
                    log.debug('Post Function', 'POST');
                    var roclist = getallrocdetails();
                    var rosarray = getallrosdetails();
                    if (roclist.length > 0) {
                        for (var i = 0; i < roclist.length; i++) {
                            var finalrosarray = [];
                            var rocid = roclist[i].roc_id;
                            var rocCode = roclist[i].rocCode;
                            var rocName = roclist[i].rocName;
                            var search_rec3;
                            var getrosname = getros_name(rocid);
                            // search_rec3 = rosarray.filter(function (data) {
                            //     return (rocid === data.roc_id);

                            // });
                            if (_logValidation(getrosname)) {
                                var rec = {
                                    "rocCode": rocCode,
                                    "rocName": rocName,
                                    "rosList": getrosname
                                }
                                region_json.push(rec);
                            }
                            // log.debug('search_rec3-------------', JSON.stringify(search_rec3));
                            // for (j = 0; j < search_rec3.length; j++) {
                            //     var rosCode = search_rec3[j].rosCode;
                            //     var rosName = search_rec3[j].rosName;
                            //     var rec = {
                            //         "rosCode": rosCode,
                            //         "rosName": rosName
                            //     }
                            //     finalrosarray.push(rec);
                            // }
                            // var rec = {
                            //     "rocCode": rocCode,
                            //     "rocName": rocName,
                            //     "rosList": finalrosarray
                            // }
                          //  region_json.push(rec);

                        }
                        log.debug('searchregion_json_rec3-------------', JSON.stringify(region_json));

                        if (region_json) {

                            var smps_roc_onbord_url = get_global_parameters();
                            var smps_headers = {
                                "Accept": "*/*",
                                'User-Agent': 'request',
                                "Content-Type": "application/json",
                                "Connection": "keep-alive",
                                "Accept": "application/json",
                                "X-ENTITY-ID": 'C0003178'
                            };

                            var json_body = {
                                'rocList': region_json
                            }
                            log.debug('json_body-------------', json_body);

                            log.debug('json_body-------------', JSON.stringify(json_body));
                            var smps_response = http.request({
                                method: http.Method.POST,
                                url: smps_roc_onbord_url,
                                body: JSON.stringify(json_body),
                                headers: smps_headers
                            });

                            if (_logValidation(smps_response)) {
                                var smps_response_body = smps_response.body; // see http.ClientResponse.body
                                var smps_response_code = smps_response.code; // see http.ClientResponse.code
                                var smps_response_headers = smps_response.headers; // see http.Clientresponse.headers

                                log.debug(" post ", "smps_response_code==" + smps_response_code);
                                log.debug(" post ", "smps_response_headers==" + JSON.stringify(smps_response_headers));
                                smps_response_body = JSON.parse(smps_response_body);
                                log.debug(" post ", "smps_response_body==" + JSON.stringify(smps_response_body));
                            }
                            var smps_status = smps_response_body.status;
                            var status_code = smps_response_body.statusCode;
                            var description='';
                            var smps_desc = smps_response_body.description;
                            var smps_error = smps_response_body.error;
                            if(_logValidation(smps_desc))
                            {
                                description=smps_desc;
                            }
                            if(_logValidation(smps_error))
                            {
                                description=smps_error;
                            }
                          
                           
                            log.debug("status_code", status_code);
                            log.debug("description", description);
                            log.debug("smps_error", smps_error);
                           var resultdesc = description;
                            json_response = {
                                "SMPS Staus": smps_status,
                                "SMPS Staus_code": status_code,
                                "Response": smps_response_body,
                                "message": description,
                                
                            };
                        
                            var intlogid = create_logs(JSON.stringify(json_response), status_code, JSON.stringify(json_body), smps_roc_onbord_url)
                            log.audit("in post method ", "smps intlogid", intlogid);
                        }

                     
                        redirect.toSuitelet({
                            scriptId: 'customscript_roc_smps_creation_sui',
                            deploymentId: 'customdeploy_roc_smps_creation_sui',
                            parameters:{'description':resultdesc.toString()},

                        })

                    }
                } catch (error) {
                    var status_code = 200;
                  
                    json_response = {
                        "message": error.message,
                    };
                
                    var intlogid = create_logs(JSON.stringify(json_response), status_code, JSON.stringify(json_body), smps_roc_onbord_url)
                    log.audit("in post method ", "smps intlogid", intlogid);
                    log.error('error', error.message);
                }


            }
        }


        function getros_name(rocid)
        {
            var overrides =[];
            var customrecord_skylo_region_of_servicesSearchObj = search.create({
                type: "customrecord_skylo_region_of_services",
                filters:
                [
                   ["custrecord_skylo_regionof_coverage","anyof",rocid]
                ],
                columns:
                [
                   search.createColumn({name: "name", label: "Name"}),
                   search.createColumn({name: "custrecord_skylo_ros_code_rec", label: "ROS Code"}),
                   search.createColumn({
                      name: "custrecord_skylo_regionof_coverage",
                      sort: search.Sort.ASC,
                      label: "Skylo Region Of coverage"
                   })
                ]
             });
             var searchResultCount = customrecord_skylo_region_of_servicesSearchObj.runPaged().count;
             log.debug("customrecord_skylo_region_of_servicesSearchObj result count",searchResultCount);
             customrecord_skylo_region_of_servicesSearchObj.run().each(function(result){
                var ros_name = result.getValue({
                    name: "name",
                    //  sort: search.Sort.ASC,
                    label: "Name"
                });
                var ros_code = result.getText({
                    name: "custrecord_skylo_ros_code_rec",
                    label: "ROS Code"
                });
    
                //  log.debug("roc_id", JSON.stringify(roc_id));
              //  log.debug("ros_name----", JSON.stringify(ros_name));
                ros_name = ros_name.toString();
                ros_name = ros_name.split("-");
    
                if (ros_name.length > 1) {
                    ros_name = ros_name[1].trim()
                } else {
                    ros_name = ros_name;
                }
                var rosList = {
                    "rosCode": ros_code,
                    "rosName": ros_name,
                }
                overrides.push(rosList);
    
                return true;
             });
             return overrides;
        }
    

        function getallrocdetails() {
            var rocList = [];

            var customrecord_skylo_region_of_servicesSearchObj = search.create({
                type: "customrecord_skylo_region_of_coverage",
                filters: [

                ],
                columns: [

                    search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC,
                        label: "Name"
                    }),
                    search.createColumn({
                        name: "custrecord_skylo_roc_rec_code",
                        label: "ROC Code"
                    }),
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    })
                ]
            });
            var searchResultCount = customrecord_skylo_region_of_servicesSearchObj.runPaged().count;
            // log.debug("customrecord_skylo_region_of_servicesSearchObj result count", searchResultCount);
            customrecord_skylo_region_of_servicesSearchObj.run().each(function (result) {

                var roc_code = result.getValue({
                    name: "custrecord_skylo_roc_rec_code",
                    label: "ROC Code"
                })
                ///  log.debug("roc_code", JSON.stringify(roc_code));
                var roc_name = result.getValue({
                    name: "name",
                    sort: search.Sort.ASC,
                    label: "Name"
                })

                if (roc_name) {
                    roc_name = roc_name.toString();
                    roc_name = roc_name.split("-");
                    if (roc_name.length > 1) {
                        roc_name = roc_name[1].trim();
                    } else {
                        roc_name = roc_name;
                    }

                }

                var roc_id = result.getValue({
                    name: "internalid",
                    label: "Internal ID"
                })
                //   log.debug("roc_id", JSON.stringify(roc_id));
                var rosList = {
                    'roc_id': roc_id,
                    "rocCode": roc_code,
                    "rocName": roc_name,
                }
                rocList.push(rosList);
                //  log.debug("arocList", JSON.stringify(rocList));
                return true;
            });

            return rocList;

        }



        function getallrosdetails() {
            var rocList = [];
            var overrides = [];
            var arrObj = [];
            // var filterArr = [];
            // filterArr.push(["custrecord_skylo_regionof_service","is",roccode]);
            var customrecord_skylo_region_of_servicesSearchObj = search.create({
                type: "customrecord_skylo_region_of_services",
                filters: [

                ],
                columns: [
                    search.createColumn({
                        name: "name",
                        label: "Name"
                    }),
                    search.createColumn({
                        name: "custrecord_skylo_ros_code_rec",
                        label: "ROS Code"
                    }),
                    search.createColumn({
                        name: "custrecord_skylo_roc_rec_code",
                        join: "CUSTRECORD_SKYLO_REGIONOF_COVERAGE",
                        label: "ROC Code"
                    }),
                    search.createColumn({
                        name: "name",
                        join: "CUSTRECORD_SKYLO_REGIONOF_COVERAGE",
                        label: "Name"
                    }),
                    search.createColumn({
                        name: "custrecord_skylo_regionof_coverage",
                        sort: search.Sort.ASC,
                        label: "Skylo Region Of coverage"
                    })
                ]
            });
            var searchResultCount = customrecord_skylo_region_of_servicesSearchObj.runPaged().count;
            //   log.debug("customrecord_skylo_region_of_servicesSearchObj result count", searchResultCount);
            customrecord_skylo_region_of_servicesSearchObj.run().each(function (result) {

                var roc_code = result.getValue({
                    name: "custrecord_skylo_roc_rec_code",
                    join: "CUSTRECORD_SKYLO_REGIONOF_COVERAGE",
                    label: "ROC Code"
                })
                //  log.debug("roc_code", JSON.stringify(roc_code));
                var roc_name = result.getValue({
                    name: "name",
                    join: "CUSTRECORD_SKYLO_REGIONOF_COVERAGE",
                    label: "Name"
                })
                //    log.debug("roc_name", JSON.stringify(roc_name));
                var roc_id = result.getValue({
                    name: "custrecord_skylo_regionof_coverage",
                    sort: search.Sort.ASC,
                    label: "Skylo Region Of coverage"
                })
                var ros_name = result.getValue({
                    name: "name",
                    //  sort: search.Sort.ASC,
                    label: "Name"
                });
                var ros_code = result.getText({
                    name: "custrecord_skylo_ros_code_rec",
                    label: "ROS Code"
                });

                //  log.debug("roc_id", JSON.stringify(roc_id));
                //   log.debug("ros_name----", JSON.stringify(ros_name));
                ros_name = ros_name.toString();
                ros_name = ros_name.split("-");

                if (ros_name.length > 1) {
                    ros_name = ros_name[1].trim()
                } else {
                    ros_name = ros_name;
                }

                // log.debug("ros_name--->>>-", JSON.stringify(ros_name));
                var rosList = {
                    "roc_id": roc_id,
                    "rosCode": ros_code,
                    "rosName": ros_name,
                }
                overrides.push(rosList);
                return true;
            });

            return overrides;

        }


        // -----------------------------Function Call Get Global Paramters-------------------------------//

        function get_global_parameters() {

            try {
                var smps_roc_onbord_url;
                var a_result = new Array();

                var a_filters_GP = new Array();
                a_filters_GP.push(search.createFilter({
                    name: 'name',
                    operator: search.Operator.IS,
                    values: 'Skylo Integration'
                }));

                var a_columns_GP = new Array();
                a_columns_GP.push(search.createColumn({
                    name: 'internalid'
                }));
                a_columns_GP.push(search.createColumn({
                    name: 'custrecord_gp_skylo_onboard_roc_url'
                }));


                var a_filters_GP = new Array();

                var a_search_results_GP_OBJ = search.create({
                    type: 'customrecord_global_parameters',
                    filters: a_filters_GP,
                    columns: a_columns_GP
                });


                var a_search_results_GP = a_search_results_GP_OBJ.run().getRange({
                    start: 0,
                    end: 1000
                });

                if (_logValidation(a_search_results_GP)) {
                    var smps_roc_onbord_url = a_search_results_GP[0].getValue({
                        name: 'custrecord_gp_skylo_onboard_roc_url'
                    });

                } //Search Results

                log.debug("var smps_roc_onbord_url", JSON.stringify(smps_roc_onbord_url));
                return smps_roc_onbord_url;

            } catch (ex) {

                log.debug('Error Rasied in Global Parameter', ex.message);
            }
        } //Global Parameters
      
        function create_logs(json_response, status_code, jsonBody, onbordrocurl) {

            var return_id = "";
            try {
                var d_date = new Date();
                var recName = "Skylo_smps_roc" + "_" + d_date;

                var o_logsOBJ = record.create({
                    type: 'customrecord_skylo_integration_logs',
                    isDynamic: true
                });

                o_logsOBJ.setValue({
                    fieldId: 'name',
                    value: recName
                });

                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_date',
                    value: d_date,
                    ignoreFieldChange: false
                });
                //time field pending.

                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_remarks',
                    value: json_response,
                    ignoreFieldChange: false
                });

                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_status',
                    value: status_code,
                    ignoreFieldChange: false
                });


                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_integration_type',
                    value: 6,
                    ignoreFieldChange: false
                });

                o_logsOBJ.setValue({
                    fieldId: 'custrecord_skylo_il_json_request',
                    value: jsonBody,
                    ignoreFieldChange: false
                });
                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_url',
                    value: onbordrocurl,
                    ignoreFieldChange: false
                });

                o_logsOBJ.setValue({
                    fieldId: 'custrecord_gp_url_method',
                    value: 'POST',
                    ignoreFieldChange: false
                });

                var i_int_log_recId = o_logsOBJ.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('******* Log Record ID  *******' + i_int_log_recId);
                return_id = i_int_log_recId;
            } catch (excdd) {
                log.debug('**** Exception Caught ***** ' + excdd);
            }

            return return_id;
        }

        function _logValidation(value) {
            if (value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
                return true;
            } else {
                return false;
            }
        }

        return {
            onRequest: onRequest
        };

    });
