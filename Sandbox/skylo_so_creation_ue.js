/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(['N/record', 'N/ui/serverWidget', 'N/http', 'N/search', 'N/ui/message'], function (record, serverWidget, http, search, message) {


    function beforeLoad(context) {
        var currentrecord = context.newRecord;
        var custId = context.newRecord.getValue('entity');
        log.debug("custId ", custId);
        // if (context.type == context.UserEventType.CREATE) {
        //     var linecount =currentrecord.getLineCount({
        //         sublistId: 'item'
        //     });
        //     log.debug("linecount ", linecount);
        //     for (i = 0; i == linecount; i++) {
        //         currentrecord.seSublistValue({
        //             sublistId: 'item',
        //             fieldId: 'item',
        //             value: '1090',
        //             line:0
        //         });
        //         currentrecord.seSublistValue({
        //             sublistId: 'item',
        //             fieldId: 'rate',
        //             value: '0',
        //             line:0
        //         });
        //         currentrecord.seSublistValue({
        //             sublistId: 'item',
        //             fieldId: 'amount',
        //             value: '0',
        //             line:0
        //         });
        //     }
        // }

        if (context.type == context.UserEventType.VIEW) {

            var so_staus = context.newRecord.getValue('custbody_skylo_smps_response');
            var chk_so_staus = context.newRecord.getValue('custbody_skylo_smps_staus');
            var set_plmn_id = context.newRecord.getValue('custbody_skylo_plmn_salesorder');

            if (_logValidation(so_staus) && chk_so_staus == false) {
                context.form.addPageInitMessage({
                    type: message.Type.WARNING,
                    message: so_staus,
                    duration: 9000
                });
            }
        }
        var form = context.form;
        var plmnIdField = form.addField({
            id: 'custpage_plmn_ids',
            type: serverWidget.FieldType.SELECT,
            label: 'PLMN IDs'
        });
      
       plmnIdField.isMandatory = true;
        log.debug('beforeLoad', 'plmnIdField==' + plmnIdField);
        form.insertField({
            field: plmnIdField,
            nextfield: 'opportunity' //plmn id internal id.
        });
        if (custId) {
            var customerSearchObj = search.create({
                type: "customrecord_skylo_plmnid_record",
                filters: [
                    ["custrecord_skylo_linking_to_cust_plmn", "anyof", custId]
                ],
                columns: [

                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "custrecord_skylo_mcc_plmn_record",
                        label: "MCC"
                    }),
                    search.createColumn({
                        name: "custrecord_skylo_mnc_plmn_record",
                        label: "MNC"
                    }),
                    search.createColumn({
                        name: "custrecord_skylo_plmn_id_mcc_mnc_record",
                        label: "PLMN ID (MCCMNC)"
                    })

                ]
            });
            var searchResultCount = customerSearchObj.runPaged().count;
            log.debug("customerSearchObj result count", searchResultCount);
            log.debug("customer search obj stringify", JSON.stringify(customerSearchObj));

            plmnIdField.addSelectOption({
                value: '',
                text: ''
            });
            if (searchResultCount) {
                customerSearchObj.run().each(function (result) {
                    var internalId = result.getValue({
                        name: "internalid",
                        label: "Internal ID"
                    });

                    var plmn_mnc_mcc = result.getValue({
                        name: "custrecord_skylo_plmn_id_mcc_mnc_record",
                        label: "PLMN ID (MCCMNC)"
                    });;
                    plmnIdField.addSelectOption({
                        value: internalId,
                        text: plmn_mnc_mcc
                    });

                    return true;
                });
            }
        }

        return;
    }


    function afterSubmit(context) {
        try {
            log.debug("context.type ", context.type);
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {

                var so_record = context.newRecord;

                var record_ID = so_record.id;
                log.debug('so Record Id', record_ID);
                var today = new Date();
                var d_date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
                var json_response = '';
                var recName = "Skylo_SO" + "_" + d_date;
                var jsonBody = '';



                var so_object = record.load({
                    type: 'salesorder',
                    id: record_ID,
                    isDynmaic: true
                });
                var customer_id = so_object.getValue('entity');
                log.debug('customer_id', customer_id);
                if (_logValidation(customer_id)) {
                     var customerobj = record.load({
                         type: 'customer',
                         id: customer_id,
                         isDynmaic: true
                     });
					 
					 var simPrepaperCRMId = customerobj.getValue('custentity_skylo_cust_smps_sim_pre_id');
					 log.debug("simPrepaperCRMId",simPrepaperCRMId);

                    var customerCrmId = so_object.getValue('custbody_skylo_cust_name_rcd');
                    var product = so_object.getText('custbody_skylo_product_name');
                    var productId = so_object.getText('custbody_skylo_product_id');
                    var quantity = so_object.getValue('custbody_skylo_quantity');
                    var salesOrderId = so_object.getValue('tranid');
                   var simPreparedCrmId = so_object.getText('custbody_skylo_crm_sim_pre_id');
                   // var simPreparedCrmId = so_object.getText('custbody_skylo_so_smps_simpre_id');
					log.debug("simPreparedCrmId",simPreparedCrmId);
					
					//so_object.setValue('custbody_skylo_so_smps_simpre_id',simPrepaperCRMId);
					//log.debug("in so sim prep ID",simPrepaperCRMId);

                    var a_result_GP = get_global_parameters();
                    log.debug('Function Call', a_result_GP);
                    var so_creation_url = a_result_GP['so_creation_url'];
                    log.debug('so_creation_url' + so_creation_url);
                    if (_logValidation(so_creation_url)) {
                        var tokens = GetToken(a_result_GP);
                        log.debug("after tokens..", JSON.stringify(tokens));
                        log.debug('token', tokens.token);

                        var plmnid = so_object.getValue('custbody_skylo_plmn_salesorder');
                        log.debug('plmnid', plmnid);
                        var rec;
						if(_logValidation(plmnid))
						{
                        var customrecord_skylo_plmnid_recordSearchObj = search.create({
                            type: "customrecord_skylo_plmnid_record",
                            filters: [
                                ["custrecord_skylo_linking_to_cust_plmn", "anyof", customer_id],
                                "AND",
                                ["custrecord_skylo_plmn_id_mcc_mnc_record", "is", plmnid]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "custrecord_skylo_mcc_plmn_record",
                                    label: "MCC"
                                }),
                                search.createColumn({
                                    name: "custrecord_skylo_mnc_plmn_record",
                                    label: "MNC"
                                })
                            ]
                        });
                        var searchResultCount = customrecord_skylo_plmnid_recordSearchObj.runPaged().count;
                        log.debug("customrecord_skylo_plmnid_recordSearchObj result count", searchResultCount);
                        customrecord_skylo_plmnid_recordSearchObj.run().each(function (result) {
                            var mcc = result.getValue({
                                name: "custrecord_skylo_mcc_plmn_record",
                                label: "MCC"
                            });
                            var mnc = result.getText({
                                name: "custrecord_skylo_mnc_plmn_record",
                                label: "MNC"
                            })
                            var mncLength = mnc.length;
                            // log.debug("mcc", JSON.stringify(mcc));
                            // log.debug("mnc", JSON.stringify(mnc));
                            // log.debug("mncLength", mncLength);
                            rec = ({
                                'mcc': mcc,
                                'mnc': mnc,
                                'mncLength': mncLength
                            })
                            return true;
                        });

                        log.debug("rec", JSON.stringify(rec));
						}


                        var param = {
                            "customerCrmId": customerCrmId,
                            "plmnId": rec,
                            "product": product,
                            "productId": productId,
                            "quantity": quantity,
                            "salesOrderId": salesOrderId,
                            "simPreparedCrmId": simPreparedCrmId,
                           // "simPreparedCrmId": simPrepaperCRMId,
                            "transportKeyHss": "001",
                            "transportKeyOta": "001"
                        }
                        log.debug(" param ", "param==>" + JSON.stringify(param));


                        var sourl = so_creation_url + '?access_token=' + tokens.token;
                        log.debug(" afterSubmit ", "sourl==>" + JSON.stringify(sourl));
                        var headers = {
                            "Accept": "*/*",
                            'User-Agent': 'request',
                            "Content-Type": "application/json"
                        };
                        var response = http.request({
                            method: http.Method.POST,
                            url: sourl,
                            body: JSON.stringify(param),
                            headers: headers
                            // headers: {"Authorization": "oauth2 " ,"Content-Type": "application/json"}, 
                        });



                        var myresponse_body = response.body; // see http.ClientResponse.body
                        var myresponse_code = response.code; // see http.ClientResponse.code
                        var myresponse_headers = response.headers; // see http.Clientresponse.headers

                        log.debug(" afterSubmit ", "myresponse_code==" + myresponse_code);
                        log.debug(" afterSubmit ", "myresponse_headers==" + myresponse_headers);
                        myresponse_body = JSON.parse(myresponse_body);
                        log.debug(" afterSubmit ", "myresponse_body==" + JSON.stringify(myresponse_body));


                        if (myresponse_code == 200) {
                            var startimsi = myresponse_body.startImsi;
                            log.debug("startimsi", startimsi);
                            var endimsi = myresponse_body.endImsi;
                            var start_serial_number = myresponse_body.startSerialNumber;
                            var input_file_path = myresponse_body.inpFilePath;
                            var transportKeyHss = "001";
                            var transportKeyOta = "001";

                            var id = record.submitFields({
                                type: 'salesorder',
                                id: record_ID,
                                values: {
                                    'custbody_skylo_start_imsi': startimsi,
                                    'custbody_skylo_endimsi': endimsi,
                                    'custbody_skylo_start_serial_number': start_serial_number,
                                    'custbody_skylo_ipn_filepath': input_file_path,
                                    'custbody_skylo_transport_hss': transportKeyHss,
                                    'custbody_skylo_transport_key_ota': transportKeyOta,
                                    'custbody_skylo_smps_staus': true,
                                   // 'custbody_skylo_smps_staus': 'Success',
                                    'custbody_skylo_smps_response': '',
									'custbody_skylo_so_smps_simpre_id': simPrepaperCRMId
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });

                            var status_code = 200;
                            var succ_status = 'Success';
                            json_response = {
                                "success": 200,
                                "message": "Sales Order record created successfully",
                                "internalid": record_ID
                            };
                            var jsonBody = JSON.stringify(param);

                            var intlogid = create_logs(recName, record_ID, JSON.stringify(json_response), status_code, jsonBody, succ_status, sourl)
                            log.audit("intlogid", intlogid);
                        } else {
                            var statusCode = myresponse_code;
                            log.audit("statusCode", statusCode);
                            var description = myresponse_body.description;
                            log.audit("description", description);
                            var id = record.submitFields({
                                type: 'salesorder',
                                id: record_ID,
                                values: {
                                    'custbody_skylo_smps_staus': false,
                                    'custbody_skylo_smps_response': 'Statusode' + ' ' + myresponse_body.statusCode + '-' + description,
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });

                            var status_code = statusCode;
                            var succ_status = status_code;

                            json_response = {
                                "success": myresponse_body.statusCode,
                                "message": description,
                                "internalid": record_ID
                            };
                            var jsonBody = JSON.stringify(param);
                            log.audit("jsonBody else", jsonBody);
                            var err_intlogid = create_logs(recName, record_ID, JSON.stringify(json_response), statusCode, jsonBody, succ_status, sourl)
                            log.audit("err_intlogid", err_intlogid);

                        }

                        //return saveRec;
                    }

                }

            }

        } catch (ex) {

            var succ_status = 'Failed';
            json_response = {
                "success": 400,
                "message": ex.message,
                "internalid": record_ID
            };
            var json_body = JSON.stringify(param);
            var errorintlogid = create_logs(recName, record_ID, JSON.stringify(json_response), myresponse_code, json_body, succ_status, sourl)
            log.audit("errorintlogid", errorintlogid);
        }

    }



    function getCustomerDetails(custId) {
        log.debug("getCustomerDetails", custId);
        var arrObj = [];
        var overrides = [];
        var customerSearchObj = search.create({
            type: "customer",
            filters: [
                // ["datecreated", "within", startdate, enddate]
                ["entityId", "is", [custId]],
                // ["entityId", "is", "C0003174 Skylo _cust"]
            ],
            columns: [

                search.createColumn({
                    name: "entityid",
                    sort: search.Sort.ASC,
                    label: "ID"
                }),
                search.createColumn({
                    name: "internalid",
                    label: "Internal ID"
                }),


                search.createColumn({
                    name: "custrecord_skylo_mcc_plmn_record",
                    join: "CUSTRECORD_SKYLO_LINKING_TO_CUST_PLMN",
                    label: "MCC"
                }),
                search.createColumn({
                    name: "custrecord_skylo_mnc_plmn_record",
                    join: "CUSTRECORD_SKYLO_LINKING_TO_CUST_PLMN",
                    label: "MNC"
                }),
                search.createColumn({
                    name: "custrecord_skylo_plmn_id_mcc_mnc_record",
                    join: "CUSTRECORD_SKYLO_LINKING_TO_CUST_PLMN",
                    label: "PLMN ID (MCCMNC)"
                }),

                search.createColumn({
                    name: "custentity_skylo_simproductid",
                    label: "Product Id"
                }),
                search.createColumn({
                    name: "custentity_skylo_simproduct",
                    label: "Product Name"
                })
            ]
        });
        var searchResultCount = customerSearchObj.runPaged().count;
        log.debug("customerSearchObj result count", searchResultCount);
        log.debug("customer search obj stringify", JSON.stringify(customerSearchObj));
        if (searchResultCount) {
            customerSearchObj.run().each(function (result) {

                var customer_id = result.getValue({
                    name: "entityid",
                    label: "ID"
                });
                log.debug('entityId', customer_id);

                internalId = result.getValue({
                    name: "internalid",
                    label: "Internal ID"
                });

                var plmn_mcc = result.getValue({
                    name: "custrecord_skylo_mcc_plmn_record",
                    join: "CUSTRECORD_SKYLO_LINKING_TO_CUST_PLMN",
                    label: "MCC"
                });
                var plmn_mnc = result.getText({
                    name: "custrecord_skylo_mnc_plmn_record",
                    join: "CUSTRECORD_SKYLO_LINKING_TO_CUST_PLMN",
                    label: "MNC"
                });
                var plmn_mnc_mcc = result.getText({
                    name: "custrecord_skylo_plmn_id_mcc_mnc_record",
                    join: "CUSTRECORD_SKYLO_LINKING_TO_CUST_PLMN",
                    label: "PLMN ID (MCCMNC)"
                });
                var simprodcutid = result.getText({
                    name: "custentity_skylo_simproductid",
                    label: "Product Id"
                })
                var simproductname = result.getText({
                    name: "custentity_skylo_simproduct",
                    label: "Product Name"
                })
                var plmnIds = {
                    "mcc": plmn_mcc,
                    "mnc": plmn_mnc,
                    "mncLength": plmn_mnc.length
                };
                arrObj.push(plmnIds);
                return true;
            });
        }
        return arrObj
    }

    // -----------------------------Function Call Get Global Paramters-------------------------------//

    function get_global_parameters() {

        try {
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
                name: 'custrecord_gp_skylo_client_id'
            }));
            a_columns_GP.push(search.createColumn({
                name: 'custrecord_gp_skylo_access_token_url'
            }));
            a_columns_GP.push(search.createColumn({
                name: 'custrecord_gp_client_secret'
            }));


            a_columns_GP.push(search.createColumn({
                name: 'custrecord_gp_skylo_user_name'
            }));
            a_columns_GP.push(search.createColumn({
                name: 'custrecord_gp_skylo_password'
            }));

            a_columns_GP.push(search.createColumn({
                name: 'custrecord_gp_skylo_grant_type'
            }));


            a_columns_GP.push(search.createColumn({
                name: 'custrecord_gp_skylo_so_create_url'
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

                var user_name = a_search_results_GP[0].getValue({
                    name: 'custrecord_gp_skylo_user_name'
                });

                var password = a_search_results_GP[0].getValue({
                    name: 'custrecord_gp_skylo_password'
                });
                var client_id = a_search_results_GP[0].getValue({
                    name: 'custrecord_gp_skylo_client_id'
                });

                var access_token_url = a_search_results_GP[0].getValue({
                    name: 'custrecord_gp_skylo_access_token_url'
                });

                var client_secret = a_search_results_GP[0].getValue({
                    name: 'custrecord_gp_client_secret'
                });

                var so_creation_url = a_search_results_GP[0].getValue({
                    name: 'custrecord_gp_skylo_so_create_url'
                });

                var grant_type = a_search_results_GP[0].getValue({
                    name: 'custrecord_gp_skylo_grant_type'
                });



                a_result['user_name'] = user_name;
                a_result['password'] = password;
                a_result['client_id'] = client_id;
                a_result['access_token_url'] = access_token_url;
                a_result['client_secret'] = client_secret;
                a_result['so_creation_url'] = so_creation_url;
                a_result['grant_type'] = grant_type;


            } //Search Results

            log.debug("a_result", JSON.stringify(a_result));
            return a_result;

        } catch (ex) {

            log.debug('Error Rasied in Global Parameter', ex.message);
        }
    } //Global Parameters


    //------------------------------------End Global Paramter-----------------------------------//
    // -------------------------------Integration Logs Creation------------------------------------//

    function create_logs(recName, recId, json_response, myresponse_code, json_body, succ_status, sourl) {
        var return_id = "";
        try {
            var today = new Date();
            var d_date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
            var recName = "Skylo_SO" + "_" + d_date;

            var o_logsOBJ = record.create({
                type: 'customrecord_skylo_integration_logs',
                isDynamic: true
            });

            o_logsOBJ.setValue({
                fieldId: 'name',
                value: recName
            });
            log.debug("recName", JSON.stringify(recName));
            // o_logsOBJ.setValue({
            //     fieldId: 'custrecord_il_skylo_date',
            //     value: d_date,
            //     ignoreFieldChange: false
            // });
            // //time field pending.
            // log.debug("d_date", JSON.stringify(d_date));
            o_logsOBJ.setValue({
                fieldId: 'custrecord_il_skylo_remarks',
                value: json_response,
                ignoreFieldChange: false
            });

            o_logsOBJ.setValue({
                fieldId: 'custrecord_il_skylo_status',
                value: myresponse_code,
                ignoreFieldChange: false
            });

            o_logsOBJ.setValue({
                fieldId: 'custrecord_il_skylo_integration_type',
                value: 4,
                ignoreFieldChange: false
            });

            o_logsOBJ.setValue({
                fieldId: 'custrecord_skylo_il_json_request',
                value: json_body,
                ignoreFieldChange: false
            });


            o_logsOBJ.setValue({
                fieldId: 'custrecord_il_skylo_url',
                value: sourl,
                ignoreFieldChange: false
            });


            o_logsOBJ.setValue({
                fieldId: 'custrecord_il_skylo_transaction_type',
                value: 31,
                ignoreFieldChange: false
            });



            o_logsOBJ.setValue({
                fieldId: 'custrecord_il_skylo_sales_order',
                value: recId,
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

    //----------------------------------End Intergation Creation------------------------------------//

    function GetToken(a_result_GP) {
        try {

            var user_name = a_result_GP['user_name'];
            var password = a_result_GP['password'];
            var client_id = a_result_GP['client_id'];
            var access_token_url = a_result_GP['access_token_url'];
            var client_secret = a_result_GP['client_secret'];

            var grant_type = a_result_GP['grant_type'];
            url = access_token_url;
            var params = {
                'grant_type': grant_type,
                'client_id': client_id, //clientid,
                'client_secret': client_secret, //clientsecret,
                'username': user_name, //username,
                'password': password, //password + tokenSecret,
            };


            //Setting up Headers
            var headersArr = [];
            headersArr['Content-Type'] = 'application/x-www-form-urlencoded';
            var response = null;
            if (url) {

                response = http.post({
                    url: url,
                    body: params,
                    headers: headersArr
                });

                //  log.debug("after response..", JSON.stringify(response));

            }
            if (response) {
                if (response.body) {
                    var body = response.body;
                    var respBody = JSON.parse(body);
                    log.debug('respBody', respBody)
                    if (respBody.access_token) {
                        accessToken = respBody.access_token;
                        log.debug('accessToken', accessToken)
                    }
                }
            }
            return {
                'token': accessToken
            };
        } catch (ex) {
            log.error('error in token generation ', JSON.stringify(ex));

            return '';
        }
    }

    //---------------Validation Code ---------------//
    function _logValidation(value) {
        if (value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
            return true;
        } else {
            return false;
        }
    }

    //-----------------End Validation Code--------------//

    return {

        afterSubmit: afterSubmit,
        beforeLoad: beforeLoad
    };

});
