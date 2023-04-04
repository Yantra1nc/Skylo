/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/**
 * Function to be executed after page is initialized.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
 *
 * @since 2015.2
 */
define(['N/record', 'N/search', 'N/currentRecord', 'N/http'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function (record, search, currentRecord, http) {

        function pageInit(context) {

        }

        function clickOnAPN(recId, tokens, ueapntype, apn_url, smps_cust_cretionurl) {
            try {

                // alert(smps_cust_cretionurl);
                // alert('Token:' + JSON.stringify(tokens));
                // alert('ueapntype:' + JSON.stringify(ueapntype));
                var currec = currentRecord.get();
                if (ueapntype == '1') {
                    alert("IP APN CREATION IS IN PROGRESS,PLEASE DO NOT REFRESH THE PAGE");

                }
                if (ueapntype == '2') {
                    alert("NON IP APN CREATION IS IN PROGRESS,PLEASE DO NOT REFRESH THE PAGE");

                }
                var rec = currentRecord.get();
                var customerObj = record.load({
                    type: 'customer',
                    id: recId,
                    isDynmaic: false
                });

                var cust_id = getcustid(recId);
                var crm_id = customerObj.getValue('custentity_skylo_billrun_customer_id');
                  // alert(cust_id);
                var jsonbody;

                var apnrecordcount = customerObj.getLineCount({
                    sublistId: 'recmachcustrecord_skylo_link_to_cust_record'
                });

                var apnURLNew = apn_url; //'http://sim-api.dev.skylo.tech/sim-api/support/customer/create-apn';
                var skylo_apn_url = apnURLNew + '?access_token=' + tokens;

                if (apnrecordcount > 0) {
                    for (i = 0; i < apnrecordcount; i++) {
                        var today = new Date();
                        var d_date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
                        var recName = "Skylo_apn" + "_" + d_date;
                        var apn_type = '';
                        var response_apn = '';
                        var apn_type_value = customerObj.getSublistValue({

                            sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
                            fieldId: 'custrecord_skylo_apn_type', //qota 
                            line: i
                        });
                        apn_type = customerObj.getSublistText({

                            sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
                            fieldId: 'custrecord_skylo_apn_type', //qota 
                            line: i
                        });
                        //  alert('apn_type:--------------->' + apn_type);

                        var cust_short_name = customerObj.getSublistValue({

                            sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
                            fieldId: 'custrecord_skylo_cust_short_name', //qota 
                            line: i
                        });
                        //  alert('cust_short_name:--------------->' + cust_short_name);


                        var app_short_name = customerObj.getSublistValue({

                            sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
                            fieldId: 'custrecord_skylo_short_name', //qota 
                            line: i
                        });
                        //   alert('app_short_name:--------------->' + app_short_name);

                      

                        // alert('response_apn_ns:--------------->' + response_apn_ns);

                        if (apn_type_value == '2') {
                            apn_type = 'NIDD';
                        }

                        jsonbody = {
                            "appShortName": app_short_name,
                            "apnType": apn_type,
                            "customerCrmId": cust_id, //crm_id,
                            "customerShortName": cust_short_name
                        };
                        // for IP APN CREATION

                        if (ueapntype == '1' && apn_type_value == '1') {
                            var response_apn_ns = customerObj.getSublistValue({

                                sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
                                fieldId: 'custrecord_skylo_apn', //qota 
                                line: i
                            });
                            if (!_logValidation(response_apn_ns)) {
                                // alert(i);

                                // var apnURLNew = 'http://sim-api.dev.skylo.tech/sim-api/support/customer/create-apn';
                                // var apn_url = apnURLNew + '?access_token=' + tokens;
                                var headers = {
                                    "Accept": "*/*",
                                    'User-Agent': 'request',
                                    "Content-Type": "application/json"
                                };
                                var response = http.post({
                                    url: skylo_apn_url,
                                    body: JSON.stringify(jsonbody),
                                    headers: headers
                                });

                                //  alert('response' + response);
                                var myresponse_body = response.body; // see http.ClientResponse.body
                                //   alert('response body without parse ' + myresponse_body);
                                var myresponse_code = response.code; // see http.ClientResponse.code
                                //   alert('response code' + myresponse_code);
                                myresponse_body = JSON.parse(myresponse_body);
                                //   alert('response body' + myresponse_body);
                                var response_apn = myresponse_body.apn;
                                //  alert('response_apn' + response_apn);
                                var description = myresponse_body.description;
                                //  alert('description' + description);

                                var apninternalid = customerObj.getSublistValue({

                                    sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
                                    fieldId: 'id', //qota 
                                    line: i
                                });

                                //  alert('apninternalid' + apninternalid);
                                if (_logValidation(response_apn)) {
                                   

                                    var id = record.submitFields({
                                        type: 'customrecord_skylo_app_serv_short_name',
                                        id: apninternalid,
                                        values: {
                                            'custrecord_skylo_apn': response_apn,
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });


                                    var Url_Method = 'POST';
                                    var intlogid = create_logs(recName, recId, JSON.stringify(json_response), myresponse_code, json_body, skylo_apn_url)
                                    var succ_status = 'Success';
                                    json_response = {
                                        "success": 200,
                                        "message": "IP APN created successfully",
                                        "CustomerID": cust_id,
                                        "APN": response_apn
                                    };
                                    var json_body = JSON.stringify(jsonbody);
                                  //  var updatecust = update_cust_smps(recId, smps_cust_cretionurl,cust_id);
                                    alert('IP APN created successfully');
                                } else {
                                    alert(description);
                                    var succ_status = 'Failed';
                                    json_response = {
                                        "success": 200,
                                        "Response": description,
                                        "CustomerID": cust_id,

                                    };
                                    var json_body = JSON.stringify(jsonbody);
                                    var Url_Method = 'POST';
                                    var intlogid = create_logs(recName, recId, JSON.stringify(json_response), myresponse_code, json_body, skylo_apn_url, Url_Method)
                                    log.audit("APN", intlogid);
                                    return false;
                                }

                            }
                        }

                        // FOR NON IP APN CREATION
                        else if (ueapntype == '2' && apn_type_value == '2') {
                          //  alert(ueapntype);
                            var response_apn_ns = customerObj.getSublistValue({

                                sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
                                fieldId: 'custrecord_skylo_apn', //qota 
                                line: i
                            });
                        //    alert(response_apn_ns);
                            if (!_logValidation(response_apn_ns)) {

                                var headers = {
                                    "Accept": "*/*",
                                    'User-Agent': 'request',
                                    "Content-Type": "application/json"
                                };
                                var response = http.post({
                                    url: skylo_apn_url,
                                    body: JSON.stringify(jsonbody),
                                    headers: headers
                                });

                                //   alert('response' + response);
                                var myresponse_body = response.body; // see http.ClientResponse.body
                                //   alert('response body without parse ' + myresponse_body);
                                var myresponse_code = response.code; // see http.ClientResponse.code
                                //   alert('response code' + myresponse_code);
                                myresponse_body = JSON.parse(myresponse_body);
                                //   alert('response body' + myresponse_body);
                                var response_apn = myresponse_body.apn;
                                //    alert('response_apn' + response_apn);
                                var description = myresponse_body.description;
                                //   alert('description' + description);
                                var apninternalid = customerObj.getSublistValue({

                                    sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
                                    fieldId: 'id', //qota 
                                    line: i
                                });

                                //alert('apninternalid' + apninternalid);
                                if (_logValidation(response_apn)) {
                                    
                                    var Url_Method = 'POST';
                                   
                                    var succ_status = 'Success';
                                    var json_response = {
                                        "success": 200,
                                        "message": "NON IP APN created successfully",
                                        "CustomerID": cust_id
                                    };
                                    var json_body = JSON.stringify(jsonbody);
                                    var intlogid = create_logs(recName, recId, JSON.stringify(json_response), myresponse_code, json_body, skylo_apn_url,Url_Method)
                                //  var updatecust = update_cust_smps(recId, smps_cust_cretionurl,cust_id);
                                  //  alert('non ip intlogid'+intlogid);
                                    alert("NON IP APN created successfully");
                                    var id = record.submitFields({
                                        type: 'customrecord_skylo_app_serv_short_name',
                                        id: apninternalid,
                                        values: {
                                            'custrecord_skylo_apn': response_apn,
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                  

                                } else {
                                    alert(description);
                                    var succ_status = 'Failed';
                                    json_response = {
                                        "success": 200,
                                        "message": description,
                                        "CustomerID": cust_id
                                    };
                                    var json_body = JSON.stringify(jsonbody);
                                    var Url_Method = 'POST';

                                    var intlogid = create_logs(recName, recId, JSON.stringify(json_response), myresponse_code, json_body, skylo_apn_url, Url_Method)

                                    return false;
                                }
                            }
                        }

                    }
                }

                var formid = record.submitFields({
                    type: 'customer',
                    id: recId,
                    values: {
                        'customform': 263,
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });



                //  var recordId = customerObj.save({
                //      enableSourcing: true,
                //      ignoreMandatoryFields: true
                //  });

                var updatecust = update_cust_smps(recId, smps_cust_cretionurl,cust_id);
                window.location.reload();
                return true;

            } catch (ex) {
                alert('ERROR----' + ex.message);
                var Url_Method = 'POST';
                var succ_status = 'Failed';
                json_response = {
                    "success": 400,
                    "message": ex.message,
                    "CustomerID": cust_id
                };
                var json_body = JSON.stringify(jsonbody);
                var Url_Method = '';
                var intlogid = create_logs(recName, recId, JSON.stringify(json_response), myresponse_code, json_body, skylo_apn_url, Url_Method)
                log.audit("APN", intlogid);
            }
        }


        function update_cust_smps(custid, smps_cust_create_url, cust_id) {
            try {
                //update smps customer  code start 
                var plmnidarray = [];
                var ipapnarray = [];
                var nonipapnarray = [];
                var region_array = [];
                var regionarrray;
                var regionofservicearrray;
                var smps_headers = {
                    "Accept": "*/*",
                    'User-Agent': 'request',
                    "Content-Type": "application/json",
                    "Connection": "keep-alive",
                    "Accept": "application/json",
                };
                var customerObj = record.load({
                    type: 'customer',
                    id: custid,
                    isDynamic: false
                });

                var entitytype_text = customerObj.getText('custentity_skylo_entity_type');
                var simprodcutid = customerObj.getValue('custentity_skylo_simproductid');
                var simproductname = customerObj.getValue('custentity_skylo_simproduct');
                var sim_prepare_id = customerObj.getValue('custentity_skylo_cust_smps_sim_pre_id');
                var smps_chk = customerObj.getValue('custentity_cust_smps_chk');
                var region_coverage = customerObj.getText('custentity_skylo_regionofcoverage');
                var avalable_ros = customerObj.getText('custentity_skylo_add_available_ros');
                var authType = customerObj.getText('custentity_skylo_authentivcation_type');
                var servicetype = customerObj.getText('custentity_skylo_service_type');
                if (avalable_ros == true || avalable_ros == 'T') {
                    var region_service = customerObj.getText('custentity_skylo_available_ros');
                }
                var plmnidcount = customerObj.getLineCount({
                    sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn'
                });
                var apncount = customerObj.getLineCount({
                    sublistId: 'recmachcustrecord_skylo_link_to_cust_record'
                });

                for (var plmn = 0; plmn < plmnidcount; plmn++) {
                    var mcc = customerObj.getSublistValue({
                        sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn',
                        fieldId: 'custrecord_skylo_mcc_plmn_record', //qota 
                        line: plmn
                    });

                    var mnc = customerObj.getSublistText({
                        sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn',
                        fieldId: 'custrecord_skylo_mnc_plmn_record', //qota 
                        line: plmn
                    });
                    var mccmnc = customerObj.getSublistValue({

                        sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn',
                        fieldId: 'custrecord_skylo_plmn_id_mcc_mnc_record', //qota 
                        line: plmn
                    });
                    if (_logValidation(mcc) && _logValidation(mnc)) {
                        plmnidarray.push({
                            'mcc': mcc,
                            'mnc': mnc,
                            'mnclength': mnc.length
                        })
                    }
                    log.debug('plmnidarray', JSON.stringify(plmnidarray));

                }
                //GET PLMNID FROM CUSTOMER RECORD CODE END //

                //GET APN  FROM CUSTOMER RECORD CODE START //

                for (var apn = 0; apn < apncount; apn++) {
                    var apntype = customerObj.getSublistValue({
                        sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
                        fieldId: 'custrecord_skylo_apn_type',
                        line: apn
                    });

                    var smps_apn = customerObj.getSublistValue({
                        sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
                        fieldId: 'custrecord_skylo_apn',
                        line: apn
                    });

                    if (apntype == '1') {
                        ipapnarray.push(smps_apn)
                    }
                    if (apntype == '2') {
                        nonipapnarray.push(smps_apn)
                    }


                }
                //GET APN  FROM CUSTOMER RECORD CODE END //
                //GET & CREATE REGIONCODE ARRAY CODE START//
                if (_logValidation(region_coverage)) {
                    region_coverage = region_coverage.toString();
                    regionarrray = region_coverage.split(',');

                }

                if (regionarrray) {
                    for (i = 0; i < regionarrray.length; i++) {
                        var reg = regionarrray[i];
                        var include_hyphen = reg.includes('-');
                        if (include_hyphen == true) {
                            reg = reg.split("-");
                            reg = reg[0];
                            reg = reg.replace(/^\s+|\s+$/gm, '');
                            region_array.push(reg);
                        }

                    }
                }


                if (avalable_ros == true || avalable_ros == 'T') {
                    if (_logValidation(region_service)) {
                        region_service = region_service.toString();
                        regionofservicearrray = region_service.split(',');

                    }

                    if (regionofservicearrray) {
                        for (i = 0; i < regionofservicearrray.length; i++) {
                            var reg = regionofservicearrray[i];
                            var include_hyphen = reg.includes('-');
                            if (include_hyphen == true) {
                                reg = reg.split("-");
                                reg = reg[0];
                                reg = reg.replace(/^\s+|\s+$/gm, '');
                                region_array.push(reg);
                            }

                        }
                    }
                }
               //  alert('nonipapnarray'+JSON.stringify(nonipapnarray));

                var smps_json = {
                    "customers": [{
                        "customer_id": cust_id,//entityid
                        "entity_type": entitytype_text,
                        "regionCodes": region_array,
                        "service_type": [servicetype],
                        "deviceIdentifierRequired": false,
                        "imeiRequired": false,
                        "simProductId": simprodcutid,
                        "simproductname": simproductname,
                        "plmnIds": plmnidarray,
                        "ipApnList": ipapnarray,
                        "niddApnList": nonipapnarray,
                        "simPreparerPartnerId": sim_prepare_id,
                        "authRoutingType": authType
                    }]
                }
                //   alert(JSON.stringify(smps_json));
                var smps_cust_create_response = http.request({
                    method: http.Method.POST,
                    url: smps_cust_create_url,
                    body: JSON.stringify(smps_json),
                    headers: smps_headers
                });

                if (_logValidation(smps_cust_create_response)) {
                    var smps_response_body = smps_cust_create_response.body; // see http.ClientResponse.body
                    var smps_response_code = smps_cust_create_response.code; // see http.ClientResponse.code
                    var smps_response_headers = smps_cust_create_response.headers; // see http.Clientresponse.headers
                    smps_response_body = JSON.parse(smps_response_body);
                    smps_status = smps_response_body.status;
                    smps_message = smps_response_body.message;
                    if (smps_response_code) {
                        var message = '';
                        var status_code = smps_response_code;
                        var today = new Date();
                        var d_date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
                        recName = "Skylo_cust_smps" + "_" + d_date;
                        if (smps_status == 'FAILURE') {
                            message = "Customer record Updation FAILURE in SMPS";
                        } else {
                            message = "Customer record Updated successfully in SMPS";
                        }
                        json_response = {
                            "SMPS Staus": smps_status,
                            "Response": smps_message,
                            "message": message,
                            "CustomerID": cust_id,
                        };
                        var jsonBody = JSON.stringify(smps_json);
                        Url_Method = 'POST';
                        var intlogid = create_logs(recName, custid, JSON.stringify(json_response), status_code, jsonBody, smps_cust_create_url, Url_Method)
                     //   alert('cust intlogid'+intlogid);
                    }


                }
            } catch (ex) {
                alert(ex.message);
            }
            // update smps cutsomer code end 

        }


        function getcustid(record_ID) {
            var cust_id;
            var customerSearchObj = search.create({
                type: "customer",
                filters: [
                    ["internalid", "anyof", record_ID]
                ],
                columns: [
                    search.createColumn({
                        name: "entityid",
                        sort: search.Sort.ASC,
                        label: "ID"
                    }),

                ]
            });
            var searchResultCount = customerSearchObj.runPaged().count;
         
            customerSearchObj.run().each(function (result) {
                cust_id = result.getValue({
                    name: "entityid",
                    sort: search.Sort.ASC,
                    label: "ID"
                })
                return true;
            });
            return cust_id;
        }

        function _logValidation(value) {
            if (value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
                return true;
            } else {
                return false;
            }
        }

        function create_logs(recName, recId, json_response, myresponse_code, json_body, skylo_apn_url, Url_Method) {
            // alert('in create intlog')
            var return_id = "";
            try {
                var d_date = new Date();
                // var recName = "Skylo_cust_apn" + "_" + d_date;

                var o_logsOBJ = record.create({
                    type: 'customrecord_skylo_integration_logs',
                    isDynamic: true
                });

                o_logsOBJ.setValue({
                    fieldId: 'name',
                    value: recName
                });
                //    alert('1')
                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_date',
                    value: d_date,
                    ignoreFieldChange: false
                });
                //time field pending.
                //    alert('2')
                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_remarks',
                    value: json_response,
                    ignoreFieldChange: false
                });
                //   alert('3')
                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_status',
                    value: myresponse_code,
                    ignoreFieldChange: false
                });
                //   alert('4')
                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_integration_type',
                    value: 1,
                    ignoreFieldChange: false
                });
                //   alert('5')
                o_logsOBJ.setValue({
                    fieldId: 'custrecord_skylo_il_json_request',
                    value: json_body,
                    ignoreFieldChange: false
                });

                //   alert('6')
                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_url',
                    value: skylo_apn_url,
                    ignoreFieldChange: false
                });
                //  alert('7')

                o_logsOBJ.setValue({
                    fieldId: 'custrecord_gp_url_method',
                    value: 'POST',
                    ignoreFieldChange: false
                });

                //   alert('8')
                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_customer',
                    value: recId,
                    ignoreFieldChange: false
                });
                //   alert('9')
                var i_int_log_recId = o_logsOBJ.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                //  log.debug('******* Log Record ID  *******' + i_int_log_recId);
                //   alert(i_int_log_recId)
                return_id = i_int_log_recId;
            } catch (excdd) {
                alert(excdd.message)
            }

            return return_id;
        }


        return {
            pageInit: pageInit,
            clickOnAPN: clickOnAPN
        };

    });
