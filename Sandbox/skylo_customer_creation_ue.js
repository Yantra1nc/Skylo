/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(['N/record', 'N/ui/serverWidget', 'N/http', 'N/search', 'N/currentRecord','N/https'],
 function (record, serverWidget, http, search, currentRecord,https) {

  function beforeLoad(context) {
    var currentRecord = context.newRecord;
    var recordid = currentRecord.id;
    var recordtype = currentRecord.type;
    var form = context.form;


    if (context.type == context.UserEventType.EDIT) {
      //  var plmncount = currentRecord.getLineCount('recmachcustrecord_skylo_linking_to_cust_plmn');
      // log.debug('*******plmncount *******', plmncount);
      // if (_logValidation(imsitype) && plmncount == '0') {
      //     var fieldLookUp = search.lookupFields({
      //         type: 'customrecord_global_parameters',
      //         id: 1,
      //         columns: ['custrecord_gp_plmnid_count']
      //     });
      //     var count = fieldLookUp.custrecord_gp_plmnid_count;
      //     log.debug("beforeload edit=>fieldLookUp", JSON.stringify(count));
      //     var lines = createplmnidlines(imsitype,count);
      // }
      var cust_status = currentRecord.getValue('custentity_skylo_customer_status');
      var smps_chk = currentRecord.getValue('custentity_cust_smps_chk');
      //  log.debug("cust_status", cust_status);
      var a_result_GP = get_global_parameters();
      var apn_url = a_result_GP['apn_url'];
      var smps_cust_cretionurl = a_result_GP['smps_cust_create_url'];
      //  log.debug('apn_url', apn_url);
      var tokens = GetToken(a_result_GP);
      //  log.debug("beforeload tokens..", JSON.stringify(tokens.token));



      //   if zero (then no empty) the disable else if one then(empty)
      // var headers = {
      //     "Accept": "*/*",
      //     'User-Agent': 'request',
      //     //"Connection": "keep-alive",
      //     "Content-Type": "application/json"
      //     //"APIKEY": "{{APIKEY}}" ,
      //     //"entityId": "{{ENTITY-ID}}"
      // };

      // var jsonbody = {
      //     "appShortName": "nidd_billrun",
      //     "apnType": "NIDD",
      //     "customerCrmId": "104",
      //     "customerShortName": "lab7"
      // };
      // log.debug(" jsonbody ", jsonbody);
      // var apnURLNew = 'http://sim-api.dev.skylo.tech/sim-api/support/customer/create-apn';

      // var apn_url = apnURLNew + '?access_token=' + tokens.token;

      // log.debug("apn_url", apn_url);

      // /*var response = http.request({
      //             method: http.Method.POST,
      //             url: 'http://sim-api.dev.skylo.tech/sim-api/support/customer/create-apn?access_token='+ tokens.token,
      //             body: jsonbody,
      // 			headers: headers
      //         });
      // 		*/

      // var response = http.post({
      //     url: 'http://sim-api.dev.skylo.tech/sim-api/support/customer/create-apn?access_token='+ tokens.token,
      //     body: JSON.stringify(jsonbody),
      //     headers: headers
      // });

      // //log.debug("response",response);

      // var myresponse_body = response.body; // see http.ClientResponse.body
      // var myresponse_code = response.code; // see http.ClientResponse.code
      // var myresponse_headers = response.headers; // see http.Clientresponse.headers
      // log.debug(" before ", "myresponse_code==" + myresponse_code);
      // log.debug(" before ", "myresponse_body==" + myresponse_body);
      // log.debug(" before ", "myresponse_headers==" + myresponse_headers);
      var apntype = 1;
      var nonipapntype = 2;


      if (cust_status == '2' || cust_status == '3' || cust_status == '4' && smps_chk == true) {
        var ipcount = getcountipapn(recordid);
        var nonipcount = getcountnonipapn(recordid)
       // log.debug('ipcount----', ipcount);
      //  log.debug('nonipcount-----', nonipcount);
        var apn_button = form.addButton({
          id: 'custpage_ipapn',
          label: 'Generate IP APN',
          functionName: 'clickOnAPN("' + recordid + '", "' + tokens.token + '", "' + apntype + '", "' + apn_url + '", "' + smps_cust_cretionurl + '")'

        });
        if (ipcount == '0') {
          // apn_button.isDisabled = true;
          apn_button.isHidden = true;
        } else {
          apn_button.isHidden = false;
          // apn_button.isDisabled = false;
        }

        var nonip_apn_button = form.addButton({
          id: 'custpage_nonipapn',
          label: 'Generate NON IP APN',
          functionName: 'clickOnAPN("' + recordid + '", "' + tokens.token + '", "' + nonipapntype + '", "' + apn_url + '", "' + smps_cust_cretionurl + '")'
        });

        if (nonipcount == '0') {
          //nonip_apn_button.isDisabled = true;
          nonip_apn_button.isHidden = true;
        } else {
          // nonip_apn_button.isDisabled = false;
          nonip_apn_button.isHidden = false;
        }
      }
      form.clientScriptFileId = 437907;

    //  log.debug("status set..");
    //  log.debug("here..");

    }

    if (context.type == context.UserEventType.CREATE) {
      var fieldLookUp = search.lookupFields({
        type: 'customrecord_global_parameters',
        id: 1,
        columns: ['custrecord_gp_plmnid_count', 'custrecord_gp_plmnids_values']
      });
      var imsitype = currentRecord.getValue('custentity_skylo_imsi_type');
      var count = fieldLookUp.custrecord_gp_plmnid_count;
      var plmnvalues = fieldLookUp.custrecord_gp_plmnids_values;
    //  log.debug("beforeload=>fieldLookUp", JSON.stringify(count));
    //  log.debug("beforeload=>plmnvalues", plmnvalues);
      var valuearray = [];
      valuearray = plmnvalues.split(',');
      //   log.debug("beforeload=>valuearray", valuearray);
      if (imsitype) {
        var mcc = 901;
        var mnc_1 = 80;
        if (imsitype == '1') {
          var mcc = '901';
          for (var i = 0; i < count; i++) {
            var plmnc = '';
            var plmnvalue = Number(valuearray[i]);
            plmnvalue = plmnvalue.toString().trim();
            var final_plmnvalue = getplmnid(plmnvalue);

         //   log.debug('*******final_plmnvalue *******', final_plmnvalue);
            var mcc_0 = currentRecord.setSublistValue({
              sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn',
              fieldId: 'custrecord_skylo_mcc_plmn_record',
              value: mcc,
              line: i
            })

            currentRecord.setSublistValue({
              sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn',
              fieldId: 'custrecord_skylo_mnc_plmn_record',
              value: final_plmnvalue,
              line: i
            });
            if (final_plmnvalue) {
              plmnc = mcc.concat(plmnvalue);
            } else {
              plmnc = '';
            }


            currentRecord.setSublistValue({
              sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn',
              fieldId: 'custrecord_skylo_plmn_id_mcc_mnc_record',
              value: plmnc,
              line: i
            });


          }
        }
      }

    }

  }

  function getplmnid(plmnvalue) {
    plmnvalue = plmnvalue.trim();
    var plmn_int_id;
    var customlist_skylo_mnc_listSearchObj = search.create({
      type: "customlist_skylo_mnc_list",
      filters: [
        ["name", "is", plmnvalue]
      ],
      columns: [
        search.createColumn({
          name: "internalid",
          label: "Internal ID"
        })
      ]
    });
    var searchResultCount = customlist_skylo_mnc_listSearchObj.runPaged().count;
    //   log.debug("customlist_skylo_mnc_listSearchObj result count", searchResultCount);
    customlist_skylo_mnc_listSearchObj.run().each(function (result) {
      plmn_int_id = result.getValue({
        name: "internalid",
        label: "Internal ID"
      });
      return true;
    });
    return plmn_int_id;
  }


  function getcountipapn(custid) {
    var ip_count = 0;
    var customerSearchObj = search.create({
      type: "customer",
      filters: [
        ["internalid", "anyof", custid],
        "AND",
        ["custrecord_skylo_link_to_cust_record.custrecord_skylo_apn_type", "anyof", "1"],
        "AND",
        ["custrecord_skylo_link_to_cust_record.custrecord_skylo_apn", "isempty", ""]
      ],
      columns: [
        search.createColumn({
          name: "internalid",
          join: "CUSTRECORD_SKYLO_LINK_TO_CUST_RECORD",
          summary: "COUNT",
          sort: search.Sort.ASC,
          label: "Internal ID"
        })
      ]
    });
    var searchResultCount = customerSearchObj.runPaged().count;
    //  log.debug("customerSearchObj result count", searchResultCount);
    customerSearchObj.run().each(function (result) {
      ip_count = result.getValue(({
        name: "internalid",
        join: "CUSTRECORD_SKYLO_LINK_TO_CUST_RECORD",
        summary: "COUNT",
        sort: search.Sort.ASC,
        label: "Internal ID"
      }));
      return true;
    });
   // log.debug("ip_count", ip_count);
    return ip_count;

  }

  function getcountnonipapn(custid) {
    var non_ip_count = 0;
    var customerSearchObj = search.create({
      type: "customer",
      filters: [
        ["internalid", "anyof", custid],
        "AND",
        ["custrecord_skylo_link_to_cust_record.custrecord_skylo_apn_type", "anyof", "2"],
        "AND",
        ["custrecord_skylo_link_to_cust_record.custrecord_skylo_apn", "isempty", ""]
      ],
      columns: [
        search.createColumn({
          name: "internalid",
          join: "CUSTRECORD_SKYLO_LINK_TO_CUST_RECORD",
          summary: "COUNT",
          sort: search.Sort.ASC,
          label: "Internal ID"
        })
      ]
    });
    var searchResultCount = customerSearchObj.runPaged().count;
    //  log.debug("customerSearchObj result count", searchResultCount);
    customerSearchObj.run().each(function (result) {
      non_ip_count = result.getValue(({
        name: "internalid",
        join: "CUSTRECORD_SKYLO_LINK_TO_CUST_RECORD",
        summary: "COUNT",
        sort: search.Sort.ASC,
        label: "Internal ID"
      }));
      return true;
    });
   // log.debug("non_ip_count", non_ip_count);
    return non_ip_count;

  }



  function afterSubmit(context) {
    try {
     // log.debug("context.type ", context.type);
      if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
        var customerObj_1 = context.newRecord;
        var record_ID = customerObj_1.id;
        //     log.debug('Customer Record Id', record_ID);
        var json_response = '';
        var today = new Date();
        var d_date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
        var recName = "Skylo_cust" + "_" + d_date;
        var jsonBody = '';
        var regionarrray;
        var regionofservicearrray;
        var smps_status = '';
        var smps_message = '';
        var action = '';
        var cidvalues = '';
        var cid;
        var Url_Method;
        var region_array = [];
        var ipapnarray = [];
        var nonipapnarray = [];
        var plmnidarray = [];
        var data_tiers = [];
        var roaming_fee = [];
        var mmrcarray = [];
        var overrides = [];
        var ex_override = [];
        var arrObj = [];



        // function for add infinite value to last row of plmnid custom record on customer master 
        var plmnfun = updateplmnidvalue(record_ID);
        // load the customer code start 
        if (context.type == context.UserEventType.EDIT) {
          var customerObj = record.load({
            type: 'customer',
            id: record_ID,
            isDynamic: false
          });
          //serach to get only customer entity id like C000ABC code start
          var cust_id = getcustid(record_ID);
          //   log.debug('cust_id', cust_id);
          // -------------Customer Get Data Start----------------------- //
          var customerType = customerObj.getValue('custentity_vlpl_customertype');
          //  log.debug('Customer Record Type', customerType);
          var inactive_check = customerObj.getValue('isinactive');
          //   log.debug('Inactive CheckBox', inactive_check);
          var customerID = customerObj.getValue('entityid');
          //   log.debug('Customer Record ID', customerID);
          var companyName = customerObj.getValue('companyname');
          // log.debug('Customer Record Company', companyName);
          var customer_status = customerObj.getValue('entitystatus');
          //   log.debug('Customer Record Status', customer_status);
          var firstname = customerObj.getValue('firstname');
          var lastname = customerObj.getValue('lastname');
          var email = customerObj.getValue('email');
          // log.debug('Customer Record Email', email);
          var phone = customerObj.getValue('phone');
          //  log.debug('Customer Record Phone', phone);
          var cust_status = customerObj.getValue('custentity_skylo_customer_status');
          var ftp_folder_name = customerObj.getValue('custentitycustentity_skylo_ftpfoldername');
          var ftp_folder_path = customerObj.getValue('custentity_skylo_ftp_root_path');

          var entitytype = customerObj.getValue('custentity_skylo_entity_type');
          // log.debug("tokens", JSON.stringify(tokens));
          var entitytype_text = customerObj.getText('custentity_skylo_entity_type');
          var sim_prepare_id = customerObj.getValue('custentity_skylo_cust_smps_sim_pre_id');
          var simprodcutid = customerObj.getValue('custentity_skylo_simproductid');
          var simproductname = customerObj.getValue('custentity_skylo_simproduct');
          var authType = customerObj.getText('custentity_skylo_authentivcation_type');
          var servicetype = customerObj.getText('custentity_skylo_service_type');
          //    var region = customerObj.getText('custentity_skylo_region');
          var region_coverage = customerObj.getText('custentity_skylo_regionofcoverage');
        //  log.debug("region_coverage", JSON.stringify(region_coverage));
          var avalable_ros = customerObj.getText('custentity_skylo_add_available_ros');
         // log.debug("avalable_ros", JSON.stringify(avalable_ros));
          if (avalable_ros == true || avalable_ros == 'T') {
            var region_service = customerObj.getText('custentity_skylo_available_ros');
          //  log.debug("region_service", JSON.stringify(region_service));
          }

          var cdr_dir = customerObj.getText('custentity_skylo_ftp_directory_for_cdr');
          var cdr_path = customerObj.getText('custentity_skylo_ftp_root_path');
          var smps_chk = customerObj.getValue('custentity_cust_smps_chk');
          var billrun_chk = customerObj.getValue('custentity_cust_billrun_chk');
          var billrun_id = customerObj.getValue('custentity_skylo_billrun_customer_id');
      log.debug('smps_chk', smps_chk);
          //GET PLMNID FROM CUSTOMER RECORD CODE START //
          var plmnidcount = customerObj.getLineCount({
            sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn'
          });
          //log.debug("plmnidcount", plmnidcount);

          var apncount = customerObj.getLineCount({
            sublistId: 'recmachcustrecord_skylo_link_to_cust_record'
          });
        //  log.debug("apncount", apncount);
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
           // log.debug('plmnidarray', JSON.stringify(plmnidarray));

          }
          //GET PLMNID FROM CUSTOMER RECORD CODE END //

          //GET APN  FROM CUSTOMER RECORD CODE START //
          for (var apn = 0; apn < apncount; apn++) {
            var apntype = customerObj.getSublistValue({
              sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
              fieldId: 'custrecord_skylo_apn_type',
              line: apn
            });
            // log.debug('apntype', apntype);
            var smps_apn = customerObj.getSublistValue({
              sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
              fieldId: 'custrecord_skylo_apn',
              line: apn
            });
            // log.debug('smps_apn', smps_apn);
            if (apntype == '1') {
              ipapnarray.push(smps_apn)
            }
            if (apntype == '2') {
              nonipapnarray.push(smps_apn)
            }
          //  log.debug('ipapnarray', JSON.stringify(ipapnarray));
           // log.debug('nonipapnarray', JSON.stringify(nonipapnarray));

          }
          //GET APN  FROM CUSTOMER RECORD CODE END //
          //GET & CREATE REGIONCODE ARRAY CODE START//
          if (_logValidation(region_coverage)) {
            region_coverage = region_coverage.toString();
            regionarrray = region_coverage.split(',');

          }
         // log.debug('regionarrray', JSON.stringify(regionarrray));
          if (regionarrray) {
            for (i = 0; i < regionarrray.length; i++) {
              var reg = regionarrray[i];
              var include_hyphen = reg.includes('-');
              if (include_hyphen == true) {
                //  log.debug('reg', JSON.stringify(reg));
                reg = reg.split("-");
                // log.debug('reg split', JSON.stringify(reg));
                reg = reg[0];
                // log.debug('reg', JSON.stringify(reg));
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
           // log.debug('regionofservicearrray', JSON.stringify(regionofservicearrray));
            if (regionofservicearrray) {
              for (i = 0; i < regionofservicearrray.length; i++) {
                var reg = regionofservicearrray[i];
                var include_hyphen = reg.includes('-');
                if (include_hyphen == true) {
                  //  log.debug('reg', JSON.stringify(reg));
                  reg = reg.split("-");
                  // log.debug('reg split', JSON.stringify(reg));
                  reg = reg[0];
                  // log.debug('reg', JSON.stringify(reg));
                  reg = reg.replace(/^\s+|\s+$/gm, '');
                  region_array.push(reg);
                }

              }
            }
          }
         // log.debug('region_array', JSON.stringify(region_array));
          //GET & CREATE REGIONCODE ARRAY CODE END//
          /////// code for get API url from global paramaeter record code start //////////
          var a_result_GP = get_global_parameters();
         // log.debug('Function Call', a_result_GP);
          var cust_creation_url = a_result_GP['cust_creation_url'];
          log.debug('cust_creation_url', cust_creation_url);
          var smps_cid_url = a_result_GP['smps_cid_url'];
          log.debug('smps_cid_url' + smps_cid_url);
          var cust_update_url = a_result_GP['billrun_custupdate_url'];
          log.debug('cust_update_url', cust_update_url);
          var smps_cust_create_url = a_result_GP['smps_cust_create_url'];
          log.debug('smps_cust_create_url', smps_cust_create_url);
          /////// code for get API url from global paramaeter record code start //////////
          var tokens = GetToken(a_result_GP);
          log.debug("tokens", JSON.stringify(tokens));

          /// Headers required for API start /////
          /* SMPS API HEADER */
          var smps_headers = {
            "Accept": "*/*",
            'User-Agent': 'request',
            "Content-Type": "application/json",
            "Connection": "keep-alive",
            "Accept": "application/json",
          };
          /* SMPS API HEADER */

          var headers = {
            "Accept": "*/*",
            "Connection": "keep-alive",
            "Content-Type": "application/json"
          };
          /* FETCH CID API HEADER */
          var cid_headers = {
            "Accept": "*/*",
            'User-Agent': 'request',
            "Content-Type": "application/json",
          };
          /* FETCH CID API HEADER */
          if (context.type == context.UserEventType.EDIT) {
            if (entitytype == 2) //If entitytype is sim preparer. create cutomer in SMPS and get smi prepare id code
            {

              var action = 'Created';
              var get_simPrepId = getSimPreparerId(cust_id, record_ID, ftp_folder_name, ftp_folder_path, a_result_GP, tokens.token);
            //  log.debug("get_simPrepId", get_simPrepId);
              var smps_json = {
                "customers": [{
                  "firstname": companyName,
                  "customer_id": cust_id,
                  "entity_type": entitytype_text,
                  "regionCodes": region_array,
                  "service_type": [servicetype],
                  "deviceIdentifierRequired": false,
                  "imeiRequired": false,
                  "simProductId": simprodcutid,
                  "simproductname": simproductname,
                  "plmnIds": plmnidarray,
                  "cdr_dir": cdr_dir,
                  "cdr_path": cdr_path,
                  "ipApnList": ipapnarray,
                  "niddApnList": nonipapnarray,
                  "simPreparerPartnerId": sim_prepare_id,
                  "authRoutingType": authType
                }]
              }
           //   log.debug("smps_json for sim prepare", JSON.stringify(smps_json));
              var headers = {
                "Accept": "*/*",
                'User-Agent': 'request',
                "Content-Type": "application/json",

              };
              var smps_response = http.request({
                method: http.Method.POST,
                url: smps_cust_create_url,
                body: JSON.stringify(smps_json),
                headers: headers
              });

              var smps_response_body = smps_response.body; // see http.ClientResponse.body
              var smps_response_code = smps_response.code; // see http.ClientResponse.code
              var smps_response_headers = smps_response.headers; // see http.Clientresponse.headers

              log.debug(" afterSubmit ", "smps_response_code or sim prepare==" + smps_response_code);
              log.debug(" afterSubmit ", "smps_response_headers or sim prepare==" + JSON.stringify(smps_response_headers));
              smps_response_body = JSON.parse(smps_response_body);
              log.debug(" afterSubmit ", "smps_response_body==" + JSON.stringify(smps_response_body));

              if (_logValidation(smps_response_body)) {
                smps_status = smps_response_body.status;
                smps_message = smps_response_body.message;
                log.debug(" afterSubmit ", "smps_status==" + smps_status);
                log.debug(" afterSubmit ", "smps_message==" + smps_message);
                if (smps_response_code == 200) {
                  if (smps_status == 'FAILURE') {
                    message = "Customer record " + action + " FAILURE in SMPS";
                  } else {
                    message = "Customer record " + action + " successfully in SMPS";
                    var id = record.submitFields({
                      type: 'customer',
                      id: record_ID,
                      values: {

                        'custentity_cust_smps_chk': true
                      },
                      options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                      }
                    });
                  }
                  var status_code = smps_response_code;
                  json_response = {
                    "SMPS Staus": smps_status,
                    "success": smps_message,
                    "message": message,
                    "internalid": record_ID
                  };
                  var jsonBody = JSON.stringify(smps_json);

                  recName = "Skylo_cust_smps_" + d_date;
                  Url_Method = 'POST';
                  var simprepare_intlogid = create_logs(recName, d_date, JSON.stringify(json_response), status_code, jsonBody, smps_cust_create_url, record_ID, Url_Method)
                  log.debug(" afterSubmit simprepare_intlogid", simprepare_intlogid);
                }
              }

            } else if (entitytype == 1) // if  entity type is customer then create/update customer in bill run,smps,and get CID cutomer id ,billrun id ,
            {
              var so_count = getsocount(record_ID);
             // log.debug('so_count', so_count);
              var defaultaddress = ' ';
              var billfromdate = customerObj.getValue('custentity_skylo_billing_start_date');
              var qota_enforce_level = customerObj.getText('custentity_skylo_quota_enforcement_level');
              var agg_server_add = customerObj.getValue('custentity_skylo_ftp_service_for_cdr');
              var mmrc = customerObj.getValue('custentity_skylo_mmrc_field');
              var invoice_frequency = customerObj.getText('custentity_skylo_invoice_frequency');
              var activation_charges = customerObj.getValue('custentity_skylo_activation_charges');
              var defaultaddress = customerObj.getValue('defaultaddress');

              //get counts of custom record which stamp on customer master start
              var datetireCount = customerObj.getLineCount({
                sublistId: 'recmachcustrecord_skylo_linking_customer_record'
              });
             // log.debug('datetireCount', datetireCount);
              var romingcount = customerObj.getLineCount({
                sublistId: 'recmachcustrecord_skylo_linking_cusstomer_recor'
              });
             // log.debug('romingcount', romingcount);

              var usagecount = customerObj.getLineCount({
                sublistId: 'recmachcustrecord_skylo_usage_linking'
              });
             // log.debug('usagecount', usagecount);
              var mmrcCount = customerObj.getLineCount({
                sublistId: 'recmachcustrecord_skylo_mmrc_cust_record'
              });
             // log.debug("mmrcCount", mmrcCount);
              //get counts of custom record which stamp on customer master End
              // GET ACCESS CHARGES  CODE START//
              for (dt = 0; dt < datetireCount; dt++) {
                var dtire_qota = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_linking_customer_record',
                  fieldId: 'custrecord_skylo_pooled_data_credit', //qota 
                  line: dt
                });

                var accessUnitText = customerObj.getSublistText({
                  sublistId: 'recmachcustrecord_skylo_linking_customer_record',
                  fieldId: 'custrecord_skylo_unit_of_measure', //qota 
                  line: dt
                });
             //   log.debug("accessUnitText", accessUnitText);

                if (accessUnitText == "KB")
                  var dtire_qotaBytes = dtire_qota * 1024;
                else if (accessUnitText == "MB")
                  var dtire_qotaBytes = dtire_qota * 1024 * 1024;
                else if (accessUnitText == "GB")
                  var dtire_qotaBytes = dtire_qota * 1024 * 1024 * 1024;

              //  log.debug("dtire_qota changed", dtire_qotaBytes);
                var dtire_subs_num = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_linking_customer_record',
                  fieldId: 'custrecord_skylo_access_fee_slab', //subs_num 
                  line: dt
                });
                var dtire_price = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_linking_customer_record',
                  fieldId: 'custrecord_skylo_access_fee_field', //price 
                  line: dt
                });
                var rec = {
                  "subs_num": dtire_subs_num,
                  "quota": dtire_qotaBytes,
                  "price": dtire_price
                }
                data_tiers.push(rec);
              }
              //log.debug('data_tiers', JSON.stringify(data_tiers));
              // GET ACCESS CHARGES  CODE END//

              // GET ROMING CHARGES  CODE START//
              for (rmc = 0; rmc < romingcount; rmc++) {
                var waiver_cycles = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_linking_cusstomer_recor',
                  fieldId: 'custrecord_skylo_roaming_waving_time', //waiver_cycles 
                  line: rmc
                });
                var rom_subs_num = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_linking_cusstomer_recor',
                  fieldId: 'custrecord_skylo_roaming_charge_slab', //subs_num 
                  line: rmc
                });
                var rom_price = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_linking_cusstomer_recor',
                  fieldId: 'custrecord_skylo_roaming_charges', //price 
                  line: rmc
                });
                var rec = {
                  "subs_num": rom_subs_num,
                  "price": rom_price,
                  "waiver_cycles": waiver_cycles
                }
                roaming_fee.push(rec);
              }

             // log.debug('roaming_fee', JSON.stringify(roaming_fee));
              // GET ROMING CHARGES  CODE END//
              // GET MMRC CHARGES  CODE START//
              for (mmrc = 0; mmrc < mmrcCount; mmrc++) {
                var mmrc_offset_months = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_mmrc_cust_record',
                  fieldId: 'custrecord_skylo_mmrc_offset_rcd', //mmrc offset months
                  line: mmrc
                });
                var from_mmrc = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_mmrc_cust_record',
                  fieldId: 'custrecord_skylo_mmrc_record', //from 
                  line: mmrc
                });
                var to_mmrc = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_mmrc_cust_record',
                  fieldId: 'custrecord_skylo_to_record', //to 
                  line: mmrc
                });

                var price_mmrc = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_mmrc_cust_record',
                  fieldId: 'custrecord_skylo_price_record', //price 
                  line: mmrc
                });
                var rec = {
                  //"mmrc_offset_months": mmrc_offset_months,
                  "price": price_mmrc,
                  "from": from_mmrc,
                  "to": to_mmrc,
                }
                mmrcarray.push(rec);
              }
              if (mmrcCount > 0) {
               // log.debug('mmrcarray', JSON.stringify(mmrcarray));
                var rec = {
                  "type": "service",
                  "key": "MMRC_SERVICE",
                  "value": {
                    "price": mmrcarray
                  },
                }
                overrides.push(rec);
               // log.debug('mmrc_charges', JSON.stringify(overrides));
              }
              // GET MMRC CHARGES  CODE END//
              // GET ACTIVATION CHARGES  CODE START//
              if (activation_charges) {
                var obj = {
                  "type": "service",
                  "key": "ACTIVATION_FEE",
                  "ItemName": "00200",
                  "value": {
                    "price": [{
                      "price": activation_charges,
                      "from": 0,
                      "to": 1
                    }]
                  }
                }
                overrides.push(obj);
              }
              // GET ACTIVATION CHARGES  CODE END//

              // GET USAGE COUNT  CODE START//
              for (usc = 0; usc < usagecount; usc++) {
                // obj = {};
                arrObj = [];
                var item_id = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_usage_linking',
                  fieldId: 'custrecord_skylo_item_record', //item_name 
                  line: usc
                });
                var item_name = customerObj.getSublistText({

                  sublistId: 'recmachcustrecord_skylo_usage_linking',
                  fieldId: 'custrecord_skylo_item_record', //item_name 
                  line: usc
                });
                var usage_charge_tier = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_usage_linking',
                  fieldId: 'custrecord_skylo_usage_charge_tier', //usage charge tier  
                  line: usc
                });

                var unitsText = customerObj.getSublistText({
                  sublistId: 'recmachcustrecord_skylo_usage_linking',
                  fieldId: 'custrecord_skylo_units_usage_record', //interval 
                  line: usc
                });
               // log.debug("unitsText", unitsText);

                var from_kb = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_usage_linking',
                  fieldId: 'custrecord_skylo_from_mb', //from_kb 
                  line: usc
                });

                var interval = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_usage_linking',
                  fieldId: 'custrecord_skylo_interval', //interval 
                  line: usc
                });
                var value = from_kb - interval;
                if (unitsText == "KB")
                  var from_kbbytes = value * 1024;
                else if (unitsText == "MB")
                  var from_kbbytes = value * 1024 * 1024;
                else if (unitsText == "GB")
                  var from_kbbytes = value * 1024 * 1024 * 1024;

                log.debug("from_kbbytes", from_kbbytes);

                var to_kb = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_usage_linking',
                  fieldId: 'custrecord_skylo_to_mb', //to_kb 
                  line: usc
                });

               // log.debug("to_kb", to_kb);
                var to_kbbytes;
                if (to_kb != 9223372036854775807) {
                  if (unitsText == "KB")
                    to_kbbytes = to_kb * 1024;
                  else if (unitsText == "MB")
                    to_kbbytes = to_kb * 1024 * 1024;
                  else if (unitsText == "GB")
                    to_kbbytes = to_kb * 1024 * 1024 * 1024;
                  //log.debug("to_kbbytes in if", to_kbbytes);
                } else if (to_kb == 9223372036854775807) {
                //  log.debug("here in else..", to_kb);
                  var maxValue = "9223372036854775807";
                  to_kbbytes = maxValue;
                //  log.debug("to_kbbytes in else max val", maxValue);
                //  log.debug("to_kbbytes in else", to_kbbytes);
                }

                if (unitsText == "KB")
                  var intervalbytes = interval * 1024;
                else if (unitsText == "MB")
                  var intervalbytes = interval * 1024 * 1024;
                else if (unitsText == "GB")
                  var intervalbytes = interval * 1024 * 1024 * 1024;
                log.debug("intervalbytes", intervalbytes);

                var units = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_usage_linking',
                  fieldId: 'custrecord_skylo_units_usage_record', //interval 
                  line: usc
                });

                var item_price = customerObj.getSublistValue({
                  sublistId: 'recmachcustrecord_skylo_usage_linking',
                  fieldId: 'custrecord_skylo_price', //price 
                  line: usc
                });
                //   log.debug('item_id', item_id);
                //  log.debug('item_name', item_name);
                var pricerec = {
                  "from": from_kbbytes,
                  // "to": parseInt(to_kbbytes),
                  "to": to_kbbytes,
                  "interval": parseInt(intervalbytes),
                  "price": item_price,
                  "uom_display": {
                    "range": "kb1024",
                    "interval": "kb1024"
                  }
                };
                arrObj.push(pricerec);
                //get if object is avilable in array
                var index = ex_override.findIndex(function (obj) {
                  return obj.ItemName === item_name;
                });

                //if not avilabel object in array create new object
                if (index == -1) {
                  var obj1 = {};
                  obj1.type = 'service';
                  obj1.key = 'EXCEEDING_DATA';
                  obj1.ItemName = item_name;
                  obj1.value = {
                    "rates": {
                      "GENERAL_DATA_USAGE": {
                        "data": {
                          "BASE": {
                            rate: arrObj
                          }
                        }
                      }
                    }
                  }
                  ex_override.push(obj1)
                }
                //if avilabel just push pricerec data in array of the object for the same item
                else {
                  ex_override[index].value.rates.GENERAL_DATA_USAGE.data.BASE.rate.push(pricerec);
                }
                //}
              }
             // log.debug('ex_override', JSON.stringify(ex_override));
              // log.debug('price', JSON.stringify(price));
              var finalarray = overrides.concat(ex_override);
             // log.debug('finalarray', JSON.stringify(finalarray));
              // GET USAGE COUNT  CODE END//

              // JSON FOR BILL RUN CUSTOMER START 
              var param = {
                'firstname': companyName,
                'lastname': ' ',
                "customer_id": cust_id, //customerID,
                "invoice_frequency": invoice_frequency, //"Monthly",
                "aggregated_cdr_server_address": agg_server_add,
                //  "aggregated_cdr_path" : "/shared_data",
                "quota_enforecement": qota_enforce_level,
                "from": billfromdate,
                'email': ' ', //email,
                "country": ' ', //bill_cust_country,
                "salutation": "",
                "address": defaultaddress,
                "zip_code": ' ', //bill_cust_zip,
                "billingaddress_defaultbilling": ' ', //customer_billing_address,
                // "entityType": entitytype,
                "shippingaddress_country": ' ', //ship_cust_country,
                "regions": region_array,
                "service_type": servicetype,
                "data_tiers": data_tiers,
                "roaming_fee": roaming_fee,
                "overrides": finalarray
              }
              log.debug(" param ", "param==>" + JSON.stringify(param));
              // JSON FOR BILL RUN CUSTOMER END 
              // JSON FOR SMPS CUSTOMER END 
              var smps_json = {
                "customers": [{
                  "customer_id": cust_id,
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
              log.debug(" smps_json custoemr", JSON.stringify(smps_json));
              // JSON FOR SMPS CUSTOMER END 

              // if customer status in onbaording create bill run,SMPS,API called 
              if (cust_status == '2') {

                action = 'Created';
                // Url for bill run customer creation
                if (billrun_chk == false && !_logValidation(billrun_id)) { // condition that check is customer already creates in billrun or not 
                  var billrun_customerurl = cust_creation_url + JSON.stringify(param) + '&access_token=' + tokens.token;
                  var billrun_cust_create_response = https.request({
                    method: https.Method.GET,
                    url: billrun_customerurl,
                    body: '',

                  });
                }
                // Url for SMPS custoemr creation 
                if (smps_chk == false) { //condition that check if customer created in SMPS or not 
                  var smps_cust_create_response = http.request({
                    method: http.Method.POST,
                    url: smps_cust_create_url,
                    body: JSON.stringify(smps_json),
                    headers: smps_headers
                  });
                }

                //Url for Fetch CID customer ,this api work only when customer status is onbaording

              }



              if (cust_status == '2' || cust_status == '4' || cust_status == '3') {

                if (smps_chk == true) { //condition that check if customer created in SMPS or not 
                    var smps_cust_create_response = http.request({
                      method: http.Method.POST,
                      url: smps_cust_create_url,
                      body: JSON.stringify(smps_json),
                      headers: smps_headers
                    });
                  }
                if (so_count != 0) {
                  var cidurl = smps_cid_url + cust_id;
                  log.debug("smps_cid_url ", cidurl);
                  var cid_response = http.get({
                    url: cidurl,
                    body: ' ',
                    headers: cid_headers
                  });
                }
              }

              //billrun customer updation and cid api code start
              if (_logValidation(billfromdate) && cust_status == '4' && billrun_chk == true) {
                action = 'Updated';
                var update_param = {
                  "aid": billrun_id,
                  "type": "account",
                  "effective_date": new Date()
                }
                // JSON for customer updation in bill run //
                var cust_update_param = {
                  "from": billfromdate,
                  'firstname': companyName,
                  "service_type": servicetype,
                  "regions": region_array,
                  "quota_enforecement": qota_enforce_level,
                }
                log.debug(" cust_update_param ", JSON.stringify(cust_update_param));
                // URL for customer updation api in bill run //
                var billrun_custupdateurl = cust_update_url + JSON.stringify(update_param) + '&update=' + JSON.stringify(cust_update_param) + '&access_token=' + tokens.token;
                log.debug(" afterSubmit ", "custupdateurl==>" + JSON.stringify(billrun_custupdateurl));
                var update_response = https.request({
                  method: https.Method.GET,
                  url: billrun_custupdateurl,
                  body: '',
                });
              }
              //billrun customer updation and cid api code end

              //Code for all responses and setting the values to customer, Code start 
              //response from fetch cid api response and set cide values to field 
              if (_logValidation(cid_response)) {
                var cid_response_body = cid_response.body; // see http.ClientResponse.body
                var cid_response_code = cid_response.code; // see http.ClientResponse.code
                var cid_response_headers = cid_response.headers; // see http.Clientresponse.headers
                log.debug(" cid_response_body ", JSON.stringify(cid_response_body));
                log.debug(" cid_response_code ", "cid_response_code==" + JSON.stringify(cid_response_code));
                log.debug(" cid_response_headers ", cid_response_headers);

                cid_response_body = JSON.parse(cid_response_body);
                log.debug("cid_response_body", cid_response_body);
                if (_logValidation(cid_response_body)) {
                  cid = cid_response_body.customerIds;
                  log.debug("cid ", cid);
                  if (cid) {
                    for (i = 0; i < cid.length; i++) {
                      var cid_number = cid[i];
                      log.debug("cid_number ", cid_number);
                      cidvalues = cidvalues.concat(cid_number + ',');
                    }
                    log.debug("cidvalues ", cidvalues);
                    if (_logValidation(cidvalues)) {
                      cidvalues = cidvalues.slice(0, -1);
                      if (cidvalues) {
                        var id = record.submitFields({
                          type: 'customer',
                          id: record_ID,
                          values: {
                            'custentity_skylo_smps_cust_id': cidvalues
                          },
                          options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                          }
                        });
                      }
                    }

                    recName = "Skylo_cust_cid" + "_" + d_date;

                    json_response = {
                      "CID Response Code": cid_response_code,
                      "message": 'Fetch CID Api execute successfully',
                      "cid": cid,
                      "Response": cid_response_body,
                    };
                    Url_Method = 'GET';
                    var jsonBody = cust_id; //JSON.stringify(smps_json);
                    var intlogid = create_logs(recName, d_date, JSON.stringify(json_response), status_code, jsonBody, smps_cid_url, record_ID, Url_Method)
                    log.audit("in CID intlogid", intlogid);
                  }
                }
                //fetch customer id response end
              }

              // response from bill run for create customer  and set bill run id and bill run check box 
              if (_logValidation(billrun_cust_create_response)) {
                var myresponse_body = billrun_cust_create_response.body; // see http.ClientResponse.body
                var myresponse_code = billrun_cust_create_response.code; // see http.ClientResponse.code
                var myresponse_headers = billrun_cust_create_response.headers; // see http.Clientresponse.headers
                log.debug(" afterSubmit ", "myresponse_code==" + myresponse_code);
                log.debug(" afterSubmit ", "myresponse_headers==" + JSON.stringify(myresponse_headers));
                myresponse_body = JSON.parse(myresponse_body);
                log.debug(" afterSubmit ", "myresponse_body==" + JSON.stringify(myresponse_body));
                if (_logValidation(myresponse_body)) {
                  var aid = myresponse_body.entity.aid; //bill run generated unique id which return from bill run 
                  log.debug("aid", aid);
                  if (aid) {
                    var id = record.submitFields({
                      type: 'customer',
                      id: record_ID,
                      values: {
                        'custentity_cust_billrun_chk': true,
                        'custentity_skylo_billrun_customer_id': aid,
                        'custentity_skylo_billrun_response': myresponse_body,
                      },
                      options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                      }
                    });
                  }
                }

                if (myresponse_code) {
                  var status_code = myresponse_code;
                  recName = "Skylo_cust_billrun" + "_" + d_date;
                  json_response = {
                    "success": myresponse_code,
                    "Response": myresponse_body,
                    "message": "Customer record " + action + " successfully in Bill Run",
                    "internalid": record_ID
                  };
                  var jsonBody = JSON.stringify(param);
                  Url_Method = 'GET';
                  var intlogid = create_logs(recName, d_date, JSON.stringify(json_response), status_code, jsonBody, cust_creation_url, record_ID, Url_Method)
                  log.audit("in post method billrun intlogid", intlogid);
                }

              }
              // Get SMPS resonse ,crete integraation logs and set true the smps check box 
              log.debug("smps_cust_create_response", smps_cust_create_response);
              if (_logValidation(smps_cust_create_response)) {
                var smps_response_body = smps_cust_create_response.body; // see http.ClientResponse.body
                var smps_response_code = smps_cust_create_response.code; // see http.ClientResponse.code
                var smps_response_headers = smps_cust_create_response.headers; // see http.Clientresponse.headers
                log.debug(" afterSubmit ", "smps_response_code==" + smps_response_code);
                log.debug(" afterSubmit ", "smps_response_headers==" + JSON.stringify(smps_response_headers));
                smps_response_body = JSON.parse(smps_response_body);
                log.debug(" afterSubmit ", "smps_response_body==" + JSON.stringify(smps_response_body));
                smps_status = smps_response_body.status;
                smps_message = smps_response_body.message;
                log.debug(" afterSubmit ", "smps_status==" + smps_status);
                log.debug(" afterSubmit ", "smps_message==" + smps_message);
                if (smps_response_code) {
                  var message = '';
                  var status_code = 200;
                  recName = "Skylo_cust_smps" + "_" + d_date;
                  if (smps_status == 'FAILURE') {
                    message = "Customer record " + action + " FAILURE in SMPS";
                  } else {
                    message = "Customer record " + action + " successfully in SMPS";
                  }
                  json_response = {
                    "SMPS Staus": smps_status,
                    "Response": smps_message,
                    "message": message,
                    "internalid": record_ID
                  };
                  var jsonBody = JSON.stringify(smps_json);
                  Url_Method = 'POST';
                  var intlogid = create_logs(recName, d_date, JSON.stringify(json_response), status_code, jsonBody, smps_cust_create_url, record_ID, Url_Method)
                //  log.audit("in post method ", "smps intlogid", intlogid);
                  if (smps_response_code == 200 && smps_status != 'FAILURE') {
                    var id = record.submitFields({
                      type: 'customer',
                      id: record_ID,
                      values: {

                        'custentity_cust_smps_chk': true
                      },
                      options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                      }
                    });

                  }
                }


              }

              if (_logValidation(update_response)) {
                var update_response_body = update_response.body; // see http.ClientResponse.body
                var update_response_code = update_response.code; // see http.ClientResponse.code
                var update_response_headers = update_response.headers; // see http.Clientresponse.headers

                //    log.debug(" afterSubmit ", "myresponse_code==" + myresponse_code);
                log.debug(" afterSubmit ", "update_response_headers==" + JSON.stringify(update_response_headers));
                update_response_body = JSON.parse(update_response_body);
                log.debug(" afterSubmit ", "update_response_body==" + JSON.stringify(update_response_body));
                var status_code = update_response_code;
                recName = "Skylo_cust_billrun" + "_" + d_date;
                json_response = {
                  "success": update_response_code,
                  "Response": update_response_body,
                  "internalid": record_ID
                };
                var jsonBody = JSON.stringify(cust_update_param);
                Url_Method = 'GET';
                var intlogid = create_logs(recName, d_date, JSON.stringify(json_response), status_code, jsonBody, cust_update_url, record_ID, Url_Method)
                log.audit("in post method billrun intlogid", intlogid);
              }
              //Code for all responses and setting the values to customer, Code End 
            } //end of else 
          }
          /// Headers required for API end1 /////
          // -------------Customer Get Data End----------------------- //
        }
      }
      //serach to get only customer entity id like C000ABC code end
      //-------------------End of JSON and ASIM Connection of Customer Stamp------------------//

    } catch (ex) {

      log.debug('Error Rasied in After Submit', ex.message);
      log.debug({
        title: "Exception Messege",
        details: ex.id
      });
      log.debug({
        title: "Exception Messege",
        details: ex.message
      });
      var status_code = 400
      var json_response = {
        "status": "Failed",
        "error": ex.message
      };
      var jsonBody = '';
      Url_Method = '';
      customerurl = '';
      var errorLogId = create_logs(recName, d_date, JSON.stringify(json_response), status_code, jsonBody, customerurl, record_ID, Url_Method)
      log.audit("in post method ", "errorLogId", errorLogId);
    }

  }


  function getsocount(custid) {
    var so_count;
    var salesorderSearchObj = search.create({
      type: "salesorder",
      filters: [
        ["type", "anyof", "SalesOrd"],
        "AND",
        ["customer.internalid", "anyof", custid]
      ],
      columns: [
        search.createColumn({
          name: "internalid",
          summary: "COUNT",
          label: "Internal ID"
        })
      ]
    });
    var searchResultCount = salesorderSearchObj.runPaged().count;
    log.debug("salesorderSearchObj result count", searchResultCount);
    salesorderSearchObj.run().each(function (result) {
      so_count = result.getValue({
        name: "internalid",
        summary: "COUNT",
        label: "Internal ID"
      });
      return true;
    });

    return so_count;
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
    log.debug("customerSearchObj result count", searchResultCount);
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

  function updateplmnidvalue(record_ID) {


    var fieldLookUp = search.lookupFields({
      type: 'customrecord_global_parameters',
      id: 1,
      columns: ['custrecord_gp_usage_tier_maxvalue']
    });

    var maxvalue = fieldLookUp.custrecord_gp_usage_tier_maxvalue;

    log.debug(" updateplmnidvalue maxvalue", maxvalue);
    var customer_Obj = record.load({
      type: 'customer',
      id: record_ID,
      isDynamic: false
    });

    //   log.debug(" afterSubmit ", "Record Load Customer==" + customerObj);

    var usagecount = customer_Obj.getLineCount({
      sublistId: 'recmachcustrecord_skylo_usage_linking'
    });
    if (_logValidation(usagecount)) {
      var count = usagecount - 1;
      log.debug('usagecount>>>>>>>>>>>>>>>', count);

      log.debug('usagecount----------', usagecount);
      customer_Obj.setSublistValue({
        sublistId: 'recmachcustrecord_skylo_usage_linking',
        fieldId: 'custrecord_skylo_to_mb',
        value: maxvalue,
        line: count
      });
      // customerObj.commitLine({
      //     sublistId: 'recmachcustrecord_skylo_usage_linking',

      // });
      log.debug('countarray----------', 'plmnd');
      var custint = customer_Obj.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
      });
      log.audit("custint", custint);
    }
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
        name: 'custrecord_gp_skylo_customer_creation_ur'
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
        name: 'custrecord_gp_skylo_apn_create_url'
      }));

      a_columns_GP.push(search.createColumn({
        name: 'custrecord_gp_skylo_onboard_url'
      }));
      a_columns_GP.push(search.createColumn({
        name: 'custrecord_gp_skylo_so_update_ur'
      }));
      a_columns_GP.push(search.createColumn({
        name: 'custrecord_gp_skylo_cid_url'
      }));

      a_columns_GP.push(search.createColumn({
        name: 'custrecord_gp_smps_cust_creation_url'
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

        var cust_creation_url = a_search_results_GP[0].getValue({
          name: 'custrecord_gp_skylo_customer_creation_ur'
        });

        var grant_type = a_search_results_GP[0].getValue({
          name: 'custrecord_gp_skylo_grant_type'
        });
        var apn_url = a_search_results_GP[0].getValue({
          name: 'custrecord_gp_skylo_apn_create_url'
        });

        var onboard_sim_prep_url = a_search_results_GP[0].getValue({
          name: 'custrecord_gp_skylo_onboard_url'
        });
        var billrun_custupdate_url = a_search_results_GP[0].getValue({
          name: 'custrecord_gp_skylo_so_update_ur'
        });

        var cid_url = a_search_results_GP[0].getValue({
          name: 'custrecord_gp_skylo_cid_url'
        });

        var smps_cust_create_url = a_search_results_GP[0].getValue({
          name: 'custrecord_gp_smps_cust_creation_url'
        });


        a_result['user_name'] = user_name;
        a_result['password'] = password;
        a_result['client_id'] = client_id;
        a_result['access_token_url'] = access_token_url;
        a_result['client_secret'] = client_secret;
        a_result['cust_creation_url'] = cust_creation_url;
        a_result['grant_type'] = grant_type;
        a_result['apn_url'] = apn_url;
        a_result['onboard_sim_prep_url'] = onboard_sim_prep_url;
        a_result['billrun_custupdate_url'] = billrun_custupdate_url;
        a_result['smps_cid_url'] = cid_url;
        a_result['smps_cust_create_url'] = smps_cust_create_url;

      } //Search Results

      log.debug("a_result", JSON.stringify(a_result));
      return a_result;

    } catch (ex) {

      log.debug('Error Rasied in Global Parameter', ex.message);
    }
  } //Global Parameters


  //------------------------------------End Global Paramter-----------------------------------//


  // -------------------------------Integration Logs Creation------------------------------------//

  function create_logs(recName, d_date, json_response, status_code, json_request, custUrl, cust_internalid, Url_Method) {
    var return_id = "";
    try {
      var d_date = new Date();
      // var  

      log.debug('*******cust_internalid *******' + cust_internalid);
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
        value: 1,
        ignoreFieldChange: false
      });

      o_logsOBJ.setValue({
        fieldId: 'custrecord_skylo_il_json_request',
        value: json_request,
        ignoreFieldChange: false
      });

      o_logsOBJ.setValue({
        fieldId: 'custrecord_il_skylo_url',
        value: custUrl,
        ignoreFieldChange: false
      });

      log.debug('*******custUrl *******' + custUrl);
      o_logsOBJ.setValue({
        fieldId: 'custrecord_il_skylo_customer',
        value: cust_internalid,
        ignoreFieldChange: false
      });

      o_logsOBJ.setValue({
        fieldId: 'custrecord_gp_url_method',
        value: Url_Method,
        ignoreFieldChange: false
      });

      log.debug('******* cust_internalid  *******', cust_internalid);
      log.debug('******* Log Record ID  *******', i_int_log_recId);


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

  function getSimPreparerId(custID, recordId, ftpFolderName, ftpRootPath, a_result_GP, token) {
    var onboard_sim_prep_url = a_result_GP['onboard_sim_prep_url'];
    log.debug('onboard_sim_prep_url', onboard_sim_prep_url);

    var onboard_sim_prep_url = onboard_sim_prep_url + '?access_token=' + token;
    var skylo_onboard_url = onboard_sim_prep_url;
    log.debug(" afterSubmit ", "skylo_onboard_url==>" + JSON.stringify(skylo_onboard_url));

    var headers = {
      "Accept": "*/*",
      'User-Agent': 'request',
      "Content-Type": "application/json"
    };

    jsonbody = {
      "ftpFolderName": ftpFolderName,
      "ftpRootPath": ftpRootPath,
      "simPreparerCrmId": custID
    };

    var response = http.post({
      url: skylo_onboard_url,
      body: JSON.stringify(jsonbody),
      headers: headers
    });

    var myresponse_body = response.body; // see http.ClientResponse.body
    var myresponse_code = response.code; // see http.ClientResponse.code
    log.debug('response code' + myresponse_code);
    myresponse_body = JSON.parse(myresponse_body);
    var response_simPrepID = myresponse_body.partnerId;
    log.debug("response_simPrepID", response_simPrepID);

    if (response_simPrepID) {
      var id = record.submitFields({
        type: 'customer',
        id: recordId,
        values: {
          'custentity_skylo_cust_smps_sim_pre_id': response_simPrepID,
        },
        options: {
          enableSourcing: false,
          ignoreMandatoryFields: true
        }
      });
      var status_code = myresponse_code;
      json_response = {
        "SMPS Staus": myresponse_code,
        "message": response_simPrepID + '--->' + 'Sim Prepare Id Generated Successfully',
        "Response": JSON.stringify(myresponse_body),
        "internalid": recordId
      };

      var d_date = new Date();
      Url_Method = 'POST';
      recName = "Skylo_cust_simprpID_" + d_date;
      var intlogid = create_logs(recName, d_date, JSON.stringify(json_response), status_code, JSON.stringify(jsonbody), onboard_sim_prep_url, recordId, Url_Method)
      log.debug("getSimPreparerId", intlogid);
    }
    log.debug("id", id);



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
        response = https.post({
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
    beforeLoad: beforeLoad,
    afterSubmit: afterSubmit
  };

});
