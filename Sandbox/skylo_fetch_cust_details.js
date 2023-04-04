/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
/*************************************************************
 * File Header
 * Script Type:
 * Script Name:[RS]skylo_fetch_cust_details.js
 * Auther Name: Nikita Mugalkhod(Yantra INC)
 *Modifier Name:
 * File Name:
 * Created On:
 *Description: Fetch the customer details from the NS APIs to gather the customer details.
 *********************************************************** */
define(['N/record', 'N/search', 'N/https', 'N/http', 'N/url', 'N/format'],
    function (record, search, https, http, url, format) {

        function _get(context) {
            try {

                log.debug({
                    title: "context",
                    details: context
                });
                log.debug('enter to the restlet')

                var integration_Name = "Skylo Integration"
                var custId = context.custId;
                log.debug("custId", custId);
                var getInternalId = getcustomerInternalId(custId);
                if (_logValidation(getInternalId)) {
                    log.debug("getInternalId", getInternalId);
                    var ip_apn_aaray = getIPapnlist(getInternalId);
                    var nonoip_apn_aaray = getNonIPapnlist(getInternalId);
                    log.debug('ip_apn_aaray', JSON.stringify(ip_apn_aaray));
                    log.debug('nonoip_apn_aaray', JSON.stringify(nonoip_apn_aaray));
                    var customerIdArr = getCustomerDetails(custId, ip_apn_aaray, nonoip_apn_aaray); //saved search function call 
                    log.debug('saved search function call', customerIdArr);

                    var jsonRequest = JSON.stringify({
                        "Customer": context
                    });
                    log.debug("jsonRequest", jsonRequest);

                    var cust_record_Arr = [];
                    // cust_record_Arr= cust_record_Arr.concat(customerIdArr);
                    //   cust_record_Arr.push(apn_aaray); 

                    cust_record_Arr = customerIdArr;
                    log.debug("cust_record_Arr", JSON.stringify(cust_record_Arr));
                    var recordType = "Customer";
                    var isInactive = false;
                    var jsonBody = {
                        "Customer": cust_record_Arr
                    };
                    log.debug("jsonBody", jsonBody);

                    var jsonRequest = JSON.stringify(jsonBody);
                    //log.debug("jsonRequest", jsonRequest);

                    if (_logValidation(cust_record_Arr)) {
                        var succ_status = 'Success';
                        var json_response = {
                            "success": 200,
                            "message": "Customer record fetched successfully",
                            "internalid": custId
                        };
                        var LogId = create_logs(JSON.stringify(json_response), jsonRequest, succ_status, getInternalId)
                        log.audit("in post method ", "LogId", LogId);
                        return {
                            "status": "Success",
                            "customers": cust_record_Arr,
                            "message": "record details fetched successfully"
                        }
                    } else {
                        var succ_status = 'Failed';
                        var json_response = {
                            "failed": 400,
                            "message": "Failed to fetch customer record",
                            "internalid": custId
                        };
                        var errorLogId = create_logs(JSON.stringify(json_response), jsonRequest, succ_status, getInternalId)
                        log.audit("in post method ", "errorLogId", errorLogId);
                        return {
                            "status": "Failure",
                            "record id": custId,
                            "message": "failed to fetch details of record"
                        }

                    }
                } else {
                    var succ_status = 'Failed';
                    var json_response = {
                        "failed": 400,
                        "message": "Customer ID is  not valid",
                        "internalid": custId
                    };
                    var errorLogId = create_logs(JSON.stringify(json_response), jsonRequest, succ_status, getInternalId)
                    log.audit("in post method ", "errorLogId", errorLogId);
                    return {
                        "status": "Failure",
                        "record id": custId,
                        "message": "Customer ID is not valid"
                    }
                }


            } catch (error) {
                log.debug("Error In SetConnection", error);
                var description = {
                    "message": error.message
                }
                var jsonBody = {
                    "Customer": cust_record_Arr
                };
                log.debug("jsonBody", jsonBody);

                var succ_status = 'Failed';
                var status_code = 400;
                var errorLogId = create_logs(JSON.stringify(description), JSON.stringify(jsonBody), succ_status, getInternalId)
                log.audit("in post method ", "errorLogId", errorLogId);
                return {
                    "message": error.message
                }
            }
        }
        //saved search create for email_id, mobile_no, lead_no .


        function getIPapnlist(cut_internal_id) {
            var apnarray = [];
            var final_apn_array = [];
            var customrecord_skylo_app_serv_short_nameSearchObj = search.create({
                type: "customrecord_skylo_app_serv_short_name",
                filters: [
                    ["custrecord_skylo_link_to_cust_record", "anyof", cut_internal_id],
                    "AND",
                    ["custrecord_skylo_apn_type", "anyof", "1"]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_skylo_apn_type",
                        label: "APN Type"
                    }),
                    search.createColumn({
                        name: "custrecord_skylo_apn",
                        label: "APN"
                    })
                ]
            });
            var searchResultCount = customrecord_skylo_app_serv_short_nameSearchObj.runPaged().count;
            log.debug("customrecord_skylo_app_serv_short_nameSearchObj result count", searchResultCount);
            customrecord_skylo_app_serv_short_nameSearchObj.run().each(function (result) {
                var apntype = result.getValue({
                    name: "custrecord_skylo_apn_type",
                    label: "APN Type"
                })
                var apn = result.getValue({
                    name: "custrecord_skylo_apn",
                    label: "APN"
                })

                apnarray.push(apn);

                log.audit("apnarray", JSON.stringify(apnarray));
                return true;
            });
            return apnarray;

        }

        function getNonIPapnlist(cut_internal_id) {
            var nonapnarray = [];
            var final_apn_array = [];
            var customrecord_skylo_app_serv_short_nameSearchObj = search.create({
                type: "customrecord_skylo_app_serv_short_name",
                filters: [
                    ["custrecord_skylo_link_to_cust_record", "anyof", cut_internal_id],
                    "AND",
                    ["custrecord_skylo_apn_type", "anyof", "2"]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_skylo_apn_type",
                        label: "APN Type"
                    }),
                    search.createColumn({
                        name: "custrecord_skylo_apn",
                        label: "APN"
                    })
                ]
            });
            var searchResultCount = customrecord_skylo_app_serv_short_nameSearchObj.runPaged().count;
            log.debug("customrecord_skylo_app_serv_short_nameSearchObj result count", searchResultCount);
            customrecord_skylo_app_serv_short_nameSearchObj.run().each(function (result) {
                var apntype = result.getValue({
                    name: "custrecord_skylo_apn_type",
                    label: "APN Type"
                })
                var apn = result.getValue({
                    name: "custrecord_skylo_apn",
                    label: "APN"
                })

                nonapnarray.push(apn);
                log.audit("nonapnarray", JSON.stringify(nonapnarray));
                return true;
            });
            return nonapnarray;

        }


        function getCustomerDetails(custId, ip_apn_aaray, nonoip_apn_aaray) {
            try {
                log.debug("getCustomerDetails", custId);
                var custName;
                var entityType;
                var entityType_id;
                var region;
                var serviceType;
                var authType;
                var internalId;
                var overrides = [];
                var customerSearchObj = search.create({
                    type: "customer",
                    filters: [
                        ["entityId", "is", custId],
                    ],
                    columns: [
                        search.createColumn({
                            name: "altname",
                            label: "Name"
                        }),
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
                            name: "custentity_skylo_entity_type",
                            label: "Entity Type"
                        }),

                        search.createColumn({
                            name: "companyname",
                            label: "Company Name"
                        }),
                        // search.createColumn({
                        //     name: "custentity_skylo_region",
                        //     label: "Region Of Services"
                        // }),
                        search.createColumn({
                            name: "custentity_skylo_regionofcoverage",
                            label: "Region Of Coverage"
                        }),


                        search.createColumn({
                            name: "custentity_skylo_available_ros",
                            label: "Available Ros"
                        }),
                        search.createColumn({
                            name: "custentity_skylo_service_type",
                            label: "Service Type"
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
                            name: "custentity_skylo_authentivcation_type",
                            label: "Authentication Type"
                        }),
                        search.createColumn({
                            name: "custentity_skylo_sec_cont_email",
                            label: "SECONDARY CONTACT EMAIL"
                        }),
                        search.createColumn({
                            name: "custentity_skylo_simproductid",
                            label: "Product Id"
                        }),
                        search.createColumn({
                            name: "custentity_skylo_simproduct",
                            label: "Product Name"
                        }),

                        search.createColumn({
                            name: "custentity_skylo_cust_smps_sim_pre_id",
                            label: "SMPS Sim Preparer ID"
                        }),

                    ]
                });
                var searchResultCount = customerSearchObj.runPaged().count;
                log.debug("customerSearchObj result count", searchResultCount);
                log.debug("customer search obj stringify", JSON.stringify(customerSearchObj));
                if (searchResultCount) {


                    customerSearchObj.run().each(function (result) {
                        var arrObj = [];
                        customer_id = result.getValue({
                            name: "entityid",
                            label: "ID"
                        });
                        log.debug('entityId', customer_id);
                        //return_valueArr.push(entityId);

                        custName = result.getValue({
                            name: "altname",
                            label: "Name"
                        });
                        log.debug('custName', custName);
                        var customerName = result.getValue({
                            name: "companyname",
                            label: "Company Name"
                        });
                        log.debug('companyname', customerName);

                        internalId = result.getValue({
                            name: "internalid",
                            label: "Internal ID"
                        });
                        entityType = result.getText({
                            name: "custentity_skylo_entity_type",
                            label: "Entity Type"
                        });

                        entityType_id = result.getValue({
                            name: "custentity_skylo_entity_type",
                            label: "Entity Type"
                        });

                        log.debug("entityType_id", entityType_id);

                        serviceType = result.getText({
                            name: "custentity_skylo_service_type",
                            label: "Service Type"
                        });
                        // region = result.getText({
                        //     name: "custentity_skylo_region",
                        //     label: "Region Of Services"
                        // });

                        region_coverage = result.getText({
                            name: "custentity_skylo_regionofcoverage",
                            label: "Region Of Coverage"
                        });

                        log.debug("region_coverage", JSON.stringify(region_coverage));
                        var regioncoveragearray;
                        if (_logValidation(region_coverage)) {
                            regioncoveragearray = region_coverage.split(',');
                        }
                        log.debug("regioncoveragearray", JSON.stringify(regioncoveragearray));
                        region_services = result.getText({
                            name: "custentity_skylo_available_ros",
                            label: "Available Ros"
                        });
                        log.debug("region_services", JSON.stringify(region_services));
                        var region_service_array;
                        if (_logValidation(region_services)) {
                            region_service_array = region_services.split(',');
                        }
                        log.debug("region_service_array", JSON.stringify(region_service_array));

                        plmn_mcc = result.getValue({
                            name: "custrecord_skylo_mcc_plmn_record",
                            join: "CUSTRECORD_SKYLO_LINKING_TO_CUST_PLMN",
                            label: "MCC"
                        });
                        plmn_mnc = result.getText({
                            name: "custrecord_skylo_mnc_plmn_record",
                            join: "CUSTRECORD_SKYLO_LINKING_TO_CUST_PLMN",
                            label: "MNC"
                        });
                        plmn_mnc_mcc = result.getText({
                            name: "custrecord_skylo_plmn_id_mcc_mnc_record",
                            join: "CUSTRECORD_SKYLO_LINKING_TO_CUST_PLMN",
                            label: "PLMN ID (MCCMNC)"
                        });
                        authType = result.getText({
                            name: "custentity_skylo_authentivcation_type",
                            label: "Authentication Type"
                        });
                        simprodcutid = result.getText({
                                name: "custentity_skylo_simproductid",
                                label: "Product Id"
                            }),
                            simproductname = result.getText({
                                name: "custentity_skylo_simproduct",
                                label: "Product Name"
                            })
                        var sim_prepare_id = result.getValue({
                            name: "custentity_skylo_cust_smps_sim_pre_id",
                            label: "SMPS Sim Preparer ID"
                        })
                        log.debug('entityType_id', JSON.stringify(entityType_id));

                        // for (r = 0; r < regionarrray.length; r++) {
                        //     var rocname = regionarrray[r];
                        //     log.debug('rocname', JSON.stringify(rocname));
                        //     var testarray = getroccode(rocname);
                        //     region_array.push(testarray);


                        // }
                        // log.debug('region_array', JSON.stringify(region_array));

                        var region_array = [];
                        if (regioncoveragearray) {
                            for (i = 0; i < regioncoveragearray.length; i++) {
                                var reg = regioncoveragearray[i];
                                var include_hyphen = reg.includes('-');
                                if (include_hyphen == true) {
                                    log.debug('reg', JSON.stringify(reg));
                                    reg = reg.split("-");
                                    log.debug('reg split', JSON.stringify(reg));
                                    reg = reg[0];
                                    log.debug('reg', JSON.stringify(reg));
                                    reg = reg.replace(/^\s+|\s+$/gm, '');
                                    region_array.push(reg);

                                }
                            }
                        }
                        if (region_service_array) {
                            for (i = 0; i < region_service_array.length; i++) {
                                var reg = region_service_array[i];
                                var include_hyphen = reg.includes('-');
                                if (include_hyphen == true) {
                                    log.debug('reg', JSON.stringify(reg));
                                    reg = reg.split("-");
                                    log.debug('reg split', JSON.stringify(reg));
                                    reg = reg[0];
                                    log.debug('reg', JSON.stringify(reg));
                                    reg = reg.replace(/^\s+|\s+$/gm, '');
                                    region_array.push(reg);
                                }

                            }
                        }
                        if (entityType_id == '1') {
                            var plmnIds = {

                                "mcc": plmn_mcc,
                                "mnc": plmn_mnc,
                                "mncLength": plmn_mnc.length
                            };
                            arrObj.push(plmnIds);
                            //     log.debug('arrObj', JSON.stringify(arrObj));
                            //get if object is avilable in array
                            var index = overrides.findIndex(function (obj) {
                                return obj.customer_id === customer_id;
                            });
                            //   log.debug('index', JSON.stringify(index));
                            //if not avilabel object in array create new object

                            //  log.debug('region_array', JSON.stringify(region_array));
                            if (index == -1) {
                                var obj1 = {};
                                obj1.customer_id = customer_id;
                                obj1.customerName = customerName;
                                obj1.entity_type = entityType;
                                obj1.regionCodes = region_array,
                                    obj1.service_type = [serviceType],
                                    obj1.deviceIdentifierRequired = false,
                                    obj1.imeiRequired = false,
                                    obj1.simProductId = null,
                                    obj1.simproductname = null,
                                    obj1.plmnIds = arrObj;
                                obj1.ipApnList = ip_apn_aaray,
                                    obj1.niddApnList = nonoip_apn_aaray,
                                    obj1.simPreparerPartnerId = null,
                                    obj1.authRoutingType = authType

                                overrides.push(obj1)
                            }
                            //if avilabel just push pricerec data in array of the object for the same item
                            else {
                                overrides[index].plmnIds.push(plmnIds);
                            }
                            log.debug('overrides 1st', JSON.stringify(overrides));
                        }
                        if (entityType_id == '2') {


                            var custStructure = {
                                "customer_id": customer_id,
                                "customerName": customerName,
                                "entity_type": entityType,
                                "regionCodes": region_array,
                                "serviceTypes": [serviceType],
                                "deviceIdentifierRequired": null,
                                "imeiRequired": null,
                                "simProductId": simprodcutid,
                                "simproductname": simproductname,
                                "plmnIds": null,
                                "ipApnList": null,
                                "niddApnList": null,
                                "simPreparerPartnerId": sim_prepare_id,
                                "authRoutingType": null
                            }

                            overrides.push(custStructure);
                        }
                        return true;
                    });
                }

                log.debug('overrides', JSON.stringify(overrides));
                return overrides
            } catch (err) {
                log.error("error occured in getCustomerDetails function", err.message);
            }
        }

        function getroccode(regionarray) {
            var roccode;
            log.debug('regionarray', JSON.stringify(regionarray));
            var customrecord_skylo_region_of_coverageSearchObj = search.create({
                type: "customrecord_skylo_region_of_coverage",
                filters: [
                    ["name", "is", regionarray]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_skylo_roc_rec_code",
                        label: "ROC Code"
                    })
                ]
            });
            var searchResultCount = customrecord_skylo_region_of_coverageSearchObj.runPaged().count;
            log.debug("customrecord_skylo_region_of_coverageSearchObj result count", searchResultCount);
            customrecord_skylo_region_of_coverageSearchObj.run().each(function (result) {
                roccode = result.getValue({
                    name: "custrecord_skylo_roc_rec_code",
                    label: "ROC Code"
                })
                return true;
            });

            return roccode;
        }

        function create_logs(json_response, json_request, succ_status, internalId) {
            var return_id = "";
            var cust_fetch_url = 'https://5434394.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=2334&deploy=1'
            try {
                var d_date = new Date();
                var recName = "Skylo_fetch_cust" + "_" + d_date;

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
                    value: succ_status,
                    ignoreFieldChange: false
                });

                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_integration_type',
                    value: 1,
                    ignoreFieldChange: false
                });

                o_logsOBJ.setValue({
                    fieldId: 'custrecord_skylo_il_json_request',
                    value: json_request,
                    ignoreFieldChange: false
                });

                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_customer',
                    value: internalId,
                    ignoreFieldChange: false
                });

                o_logsOBJ.setValue({
                    fieldId: 'custrecord_il_skylo_url',
                    value: cust_fetch_url,
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

        function getcustomerInternalId(custId) {
            var internalId;
            var customerSearchObj = search.create({
                type: "customer",
                filters: [
                    ["entityid", "is", custId]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }),

                ]
            });
            var searchResultCount = customerSearchObj.runPaged().count;
            log.debug("customerSearchObj result count", searchResultCount);
            customerSearchObj.run().each(function (result) {
                internalId = result.getValue({
                    name: "internalid",
                    label: "Internal ID"
                })
                return true;
            });
            log.debug('internalId', internalId);
            return internalId;
        }


        //validation function
        function _logValidation(value) {
            if (value != 'null' && value != null && value != '' && value != undefined && value != 'undefined' && value != 'NaN' && value != NaN) {
                return true;
            } else {
                return false;
            }
        }

        return {
            get: _get
        };
    });
