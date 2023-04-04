/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search'],
    function (currentRecord, record, search) {

        function saveRecord(context) {
            var total_usage_amount = 0;
            var currentRecord = context.currentRecord;
            var linecount = currentRecord.getLineCount({
                sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn'
            });
            var usagecount = currentRecord.getLineCount({
                sublistId: 'recmachcustrecord_skylo_usage_linking'
            });

       

            for (j = 0; j < usagecount; j++) {
                var quantity = currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_skylo_usage_linking',
                    fieldId: 'custrecord_usage_qty',
                    line: j
                })

                var interval = currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_skylo_usage_linking',
                    fieldId: 'custrecord_skylo_interval',
                    line: j
                })
                var usage = parseFloat(parseFloat(quantity) * parseFloat(interval));
                log.debug('usage', usage);
                if (_logValidation(usage)) {

                    total_usage_amount = parseFloat(parseFloat(total_usage_amount) + parseFloat(usage));
                    log.debug('total_usage_values', total_usage_amount);
                }

            }
            if (_logValidation(total_usage_amount)) {
                var setusage = currentRecord.setValue('custentity_skylo_total_usage_qty', total_usage_amount);
                log.debug('setusage', setusage);
            }



            return true;
        }

        function fieldChanged(context) {

            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            var sublistFieldName = context.fieldId;
            var line = context.line;
            var fieldName = context.fieldId;

            var linecount = currentRecord.getLineCount({
                sublistId: 'recmachcustrecord_skylo_link_to_cust_record'
            });
            log.debug('linecount', linecount);
            var apncount = 0;
            if (sublistName === 'recmachcustrecord_skylo_link_to_cust_record' && fieldName == "custrecord_skylo_apn_type") {
                var sublist_name = currentRecord.getSublist({
                    sublistId: "recmachcustrecord_skylo_link_to_cust_record"

                });

                var APN_type = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custrecord_skylo_apn_type'
                })

                var shortnamecoloumn = sublist_name.getColumn({

                    fieldId: 'custrecord_skylo_short_name',

                });
                if (APN_type == '1') {

                    for (i = 0; i < linecount; i++) {
                        var apntype = currentRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_skylo_link_to_cust_record',
                            fieldId: 'custrecord_skylo_apn_type',
                            line: i
                        })
                        if (apntype == '1') {
                            apncount++;
                        }

                    }
                    log.debug('apncount', apncount);
                    if (apncount >= 1) {
                        alert("Apn Type IP should not be entered duplicate");
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: 'custrecord_skylo_apn_type',
                            value: '',
                            ignoreFieldChange: true,
                        });
                        return false;
                    } else {
                        shortnamecoloumn.isDisabled = true;
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: 'custrecord_skylo_short_name',
                            value: 'ip',
                            ignoreFieldChange: true,
                        });
                        return true;
                    }


                } else {
                    shortnamecoloumn.isDisabled = false;
                }

                return true;
            }

            if (sublistName === 'recmachcustrecord_skylo_linking_to_cust_plmn' && fieldName == "custrecord_skylo_mnc_plmn_record") {
                var mcc = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custrecord_skylo_mcc_plmn_record'
                })
                log.debug('mcc', mcc);
                var mnc = currentRecord.getCurrentSublistText({
                    sublistId: sublistName,
                    fieldId: 'custrecord_skylo_mnc_plmn_record'
                })
                log.debug('mnc', mnc);
                var plmncc = mcc.concat(mnc);
                log.debug('plmncc', plmncc);
                if (_logValidation(plmncc)) {
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: 'custrecord_skylo_plmn_id_mcc_mnc_record',
                        value: plmncc,
                        ignoreMandatoryFields: true
                    });
                }
                return true;
            }


            if (fieldName == 'custentity_skylo_imsi_type') {
                var imsitype = currentRecord.getValue('custentity_skylo_imsi_type');
                log.debug('*******imsitype *******', imsitype);
                if (_logValidation(imsitype)) {
                    var fieldLookUp = search.lookupFields({
                        type: 'customrecord_global_parameters',
                        id: 1,
                        columns: ['custrecord_gp_plmnid_count', 'custrecord_gp_plmnids_values']
                    });

                    var count = fieldLookUp.custrecord_gp_plmnid_count;
                    var plmnvalues = fieldLookUp.custrecord_gp_plmnids_values;
                    log.debug("fieldchange=>fieldLookUp", JSON.stringify(count));
                    log.debug("fieldchange=>plmnvalues", plmnvalues);
                    var valuearray = [];
                    if (plmnvalues) {
                        valuearray = plmnvalues.split(',');
                        log.debug("pageInit=>valuearray", valuearray);
                    }
                    log.debug('*******count *******', count);
                    if (imsitype == '1') {
                        var mcc = 901;

                        for (var i = 0; i < count; i++) {
                            var final_plmnvalue;
                            var plmncvalue = '';
                            var plmnvalue = Number(valuearray[i]);
                            if (_logValidation(plmnvalue)) {

                                plmnvalue = plmnvalue.toString().trim();
                                final_plmnvalue = getplmnid(plmnvalue);
                                log.debug('*******final_plmnvalue *******', final_plmnvalue);
                            }
                            currentRecord.selectNewLine({
                                sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn'
                            });
                            var mccval = currentRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn',
                                fieldId: 'custrecord_skylo_mcc_plmn_record',
                                value: mcc,

                            })

                            if (_logValidation(final_plmnvalue)) {
                                var plmnc = currentRecord.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn',
                                    fieldId: 'custrecord_skylo_mnc_plmn_record',
                                    value: final_plmnvalue,

                                })
                            }

                            if (final_plmnvalue) {
                                plmncvalue = mcc + plmnvalue;
                            } else {
                                plmncvalue = '';
                            }

                            log.debug('*******plmncvalue *******', plmncvalue);
                            var plmnc = currentRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn',
                                fieldId: 'custrecord_skylo_plmn_id_mcc_mnc_record',
                                value: plmncvalue,

                            })

                            currentRecord.commitLine({
                                sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn'
                            });

                        }
                    }
                    if (imsitype == '2' || imsitype == '') {

                        var count = currentRecord.getLineCount('recmachcustrecord_skylo_linking_to_cust_plmn');
                        log.debug('*******imsitype count*******', count);
                        for (var i = count - 1; i >= 0; i--) {
                            currentRecord.removeLine({
                                sublistId: 'recmachcustrecord_skylo_linking_to_cust_plmn',
                                line: i,
                                ignoreRecalc: true
                            });

                        }
                    }

                }
            }

            if (sublistName === 'recmachcustrecord_skylo_usage_linking' && fieldName == 'custrecord_skylo_interval') {
                var currIndex = currentRecord.getCurrentSublistIndex({
                    sublistId: sublistName
                });
                log.debug('currIndex', currIndex);
                var usage_slab = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custrecord_skylo_interval'
                })
                if (currIndex == 0) {
                    if(_logValidation(usage_slab))
                    {
                        var from = currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: 'custrecord_skylo_from_mb',
                            value: usage_slab,
                            ignoreMandatoryFields: true
                        })
                    }
                }
              
                if (currIndex > 0) {
                    
                    var tovalue = currentRecord.getSublistValue({
                        sublistId: sublistName,
                        fieldId: 'custrecord_skylo_to_mb',
                        line: currIndex - 1

                    })
                    log.debug('tovalue', tovalue);
                    if (_logValidation(tovalue)) {
                        var fromvalue = parseInt(tovalue) + parseInt(usage_slab);
                        var from = currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: 'custrecord_skylo_from_mb',
                            value: fromvalue,
                            ignoreMandatoryFields: true
                        })
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
            log.debug("customlist_skylo_mnc_listSearchObj result count", searchResultCount);
            customlist_skylo_mnc_listSearchObj.run().each(function (result) {
                plmn_int_id = result.getValue({
                    name: "internalid",
                    label: "Internal ID"
                });
                return true;
            });
            return plmn_int_id;
        }


        function validateLine(context) {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            log.debug('sublistName', JSON.stringify(sublistName));
            // if (sublistName === 'recmachcustrecord_skylo_linking_to_cust_plmn') {
            //     var mcc = currentRecord.getCurrentSublistValue({
            //         sublistId: sublistName,
            //         fieldId: 'custrecord_skylo_mcc_plmn_record'
            //     })
            //     log.debug('mcc', mcc);
            //     var mnc = currentRecord.getCurrentSublistText({
            //         sublistId: sublistName,
            //         fieldId: 'custrecord_skylo_mnc_plmn_record'
            //     })
            //     log.debug('mnc', mnc);
            //     var plmncc = mcc.concat(mnc);
            //     log.debug('plmncc', plmncc);
            //     if (_logValidation(plmncc)) {
            //         currentRecord.setCurrentSublistValue({
            //             sublistId: sublistName,
            //             fieldId: 'custrecord_skylo_plmn_id_mcc_mnc_record',
            //             value: plmncc
            //         });
            //     }
            //     return true;
            // }


            if (sublistName === 'recmachcustrecord_skylo_usage_linking') {

                var from_value = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custrecord_skylo_from_mb'
                })
                var to_value = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custrecord_skylo_to_mb'
                })

                var interval = currentRecord.getCurrentSublistText({
                    sublistId: sublistName,
                    fieldId: 'custrecord_skylo_interval'
                })

                var price = currentRecord.getCurrentSublistText({
                    sublistId: sublistName,
                    fieldId: 'custrecord_skylo_price'
                })

                if(!_logValidation(price))
                {
                    alert('Please Enter Price');
                    return false;
                }
                else
                {
                    if (_logValidation(to_value) && _logValidation(interval)) {
                        var quanatity =(parseFloat(to_value) - parseFloat(from_value)) / parseFloat(interval);
                        if (_logValidation(quanatity)) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: sublistName,
                                fieldId: 'custrecord_usage_qty',
                                value: quanatity //+ 1
                            });
                        }
                    }
    
                    return true;
                }

               
                return true;
            }

            // if (sublistName === 'recmachcustrecord_skylo_link_to_cust_record') {

            //     var sublist_name = currentRecord.getSublist({
            //         sublistId: "recmachcustrecord_skylo_link_to_cust_record"

            //     });

            //     var APN_type = currentRecord.getCurrentSublistValue({
            //         sublistId: sublistName,
            //         fieldId: 'custrecord_skylo_apn_type'
            //     })

            //     var shortnamecoloumn = sublist_name.getColumn({

            //         fieldId: 'custrecord_skylo_short_name',

            //     });
            //     if (APN_type == '1') {

            //         shortnamecoloumn.isDisabled = true;
            //         currentRecord.setCurrentSublistValue({
            //             sublistId: sublistName,
            //             fieldId: 'custrecord_skylo_short_name',
            //             value: 'IP'
            //         });

            //     } else {
            //         shortnamecoloumn.isDisabled = false;
            //     }

            //     return true;
            // }

            return true;
        }

        // function validateLine(context) {
        //     var currentRecord = context.currentRecord;
        //     var sublistName = context.sublistId;
        //     if (sublistName === 'partners')
        //         if (currentRecord.getCurrentSublistValue({
        //                 sublistId: sublistName,
        //                 fieldId: 'contribution'
        //             }) !== '100.0%')
        //             currentRecord.setCurrentSublistValue({
        //                 sublistId: sublistName,
        //                 fieldId: 'contribution',
        //                 value: '100.0%'
        //             });
        //     return true;
        // }


        function _logValidation(value) {
            if (value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
                return true;
            } else {
                return false;
            }
        }

        return {
            validateLine: validateLine,
            saveRecord: saveRecord,
            fieldChanged: fieldChanged
        }
    });
