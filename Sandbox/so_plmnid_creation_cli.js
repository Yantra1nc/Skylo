/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/search'],
    function (currentRecord, record, search) {

        // function pageInit(context) {
        //     var records = context.currentRecord;
        //     var lineNum = records .selectLine({
        //         sublistId: 'item',
        //         line: 0
        //     });
        //     records.setCurrentSublistValue({
        //         sublistId: 'item',
        //         fieldId: 'item',
        //         value: '1090',
        //         ignoreFieldChange: true
        //     });
        //     alert('item');
        //     records.setCurrentSublistValue({
        //         sublistId: 'item',
        //         fieldId: 'rate',
        //         value: '0',
        //         ignoreFieldChange: true
        //     });
        //     records.setCurrentSublistValue({
        //         sublistId: 'item',
        //         fieldId: 'amount',
        //         value: '0',
        //         ignoreFieldChange: true
        //     });
        //     records.commitLine({
        //         sublistId: 'item'
        //     });
        // }

        function fieldChanged(context) {
            var currentRecord = context.currentRecord;
            var fieldName = context.fieldId;
            //   alert("fieldName"+fieldName);

            if (fieldName == 'entity') {
                var plmnid_field = currentRecord.getField({
                    fieldId: 'custpage_plmn_ids'
                });
                var custId = currentRecord.getValue('entity');

                if (custId) {
                    var lineNum = currentRecord.selectLine({
                        sublistId: 'item',
                        line: 0
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: '1090',
                        ignoreFieldChange: true
                    });
                    alert('item');
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: '0',
                        ignoreFieldChange: true
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: '0',
                        ignoreFieldChange: true
                    });

                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        value: '-7',
                        ignoreFieldChange: true
                    });
                    currentRecord.commitLine({
                        sublistId: 'item'
                    });
                }

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

                plmnid_field.removeSelectOption({
                    value: null
                });
                plmnid_field.insertSelectOption({
                    value: '',
                    text: ''
                });
                if (searchResultCount) {
                    customerSearchObj.run().each(function (result) {

                        var internalId = result.getValue({
                            name: "internalid",
                            label: "Internal ID"
                        });

                        plmn_mcc = result.getText({
                            name: "custrecord_skylo_mcc_plmn_record",
                            label: "MCC"
                        });
                        plmn_mnc = result.getText({
                            name: "custrecord_skylo_mnc_plmn_record",
                            label: "MNC"
                        });
                        plmn_mnc_mcc = result.getValue({
                            name: "custrecord_skylo_plmn_id_mcc_mnc_record",
                            label: "PLMN ID (MCCMNC)"
                        });;
                        plmnid_field.insertSelectOption({
                            value: internalId,
                            text: plmn_mnc_mcc
                        });

                        return true;
                    });
                }

                return true;
            }
            if (fieldName == 'custpage_plmn_ids') {
                var plmnid = currentRecord.getValue('custpage_plmn_ids');
                var plmnidname = currentRecord.getText('custpage_plmn_ids');
                // alert(plmnid);
                // alert(plmnidname);
                currentRecord.setValue({
                    fieldId: 'custbody_skylo_plmn_salesorder',
                    value: plmnidname
                });
            }
            return true;
        }




        function _logValidation(value) {
            if (value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
                return true;
            } else {
                return false;
            }
        }

        return {

            fieldChanged: fieldChanged
        }
    });
