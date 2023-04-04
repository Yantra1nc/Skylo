/**
 * @NApiVersion 2.x
 * @NScriptType restlet
 */
define(['N/search', 'N/https', 'N/http', 'N/record', 'N/error', './moment', 'N/format'], function (search, https, http, record, error, moment, format) {

    function SetConnection(requestParams) {
        try {

            var custId = requestParams.customer_id;
            var billrun_invoice_id = requestParams.billrun_invoice_id;
            var billrun_invoice_date = requestParams.invoice_date;
			if(billrun_invoice_date)
			{
			var billrun_inv_dateArr = billrun_invoice_date.split("T");
			log.debug("billrun_inv_dateArr",billrun_inv_dateArr[0]);
			var billrun_in_year = billrun_inv_dateArr[0].substring(0,4);
			log.debug("billrun_invoice year",billrun_in_year);
			var billrun_in_mon = billrun_inv_dateArr[0].substring(6,7);
			log.debug("billrun_invoice month",billrun_in_mon);
			var billrun_in_date = billrun_inv_dateArr[0].substring(9,11);
			log.debug("billrun_in_date",billrun_in_date);
			//log.debug("billrun_invoice_date",billrun_invoice_date);
			var newbillrunDate = billrun_in_mon+'/'+billrun_in_date+'/'+billrun_in_year;
			log.debug("newbillrunDate",newbillrunDate);
			var format_newbillrunDate = format.parse({
				value: newbillrunDate, 
				type: format.Type.DATE
			});
			log.debug("format_newbillrunDate",format_newbillrunDate);
			}
            var itemObj = requestParams.items;
            log.debug('custId', custId);
            log.debug('itemObj', JSON.stringify(itemObj));
            var json_response = '';
            var jsonBody = '';
            var internalId;
            var sub;
            var invoice_rec_id;
            var pricedetailsarray;
            var usage_charges_amount = 0;
            var accessPrice;
            var roamingPrice;
            var interconnect_item_price;
            var interconnect_nonrecitem_price;
            var invid;
            var item_total_amount = 0;
            var final_mmrc_amomunt = 0;
            var mmrc_charges = 0;
            var final_json = [];
            var mmrc_offset_rate = 0;
            var usageSlabArr = [];
            var usageUnitsArr = [];
            var usageCombinedArr = [];
            var usageToArr = [];
            var usageFromArr = [];
            var usageFromCustArr = [];
            var usageSlab;
            var usageUnitCust;
            var accessPooledData;
			var usageFrom;
			var usageTo;
            if (_logValidation(custId)) {
                var item_valid_array = item_validation(itemObj, requestParams);
                var flag_item = item_valid_array[0].item_flag;
                log.debug("flag_item", flag_item);

                if (flag_item == true) {
                    return {
                        "status": "Failed",
                        "Message": "Item Fields should not be Empty"
                    }
                } else {
                    item_total_amount = item_valid_array[0].item_total_amount;
                    log.debug("item_total_amount 1st", item_total_amount);
                    mmrc_charges = item_valid_array[0].mmrc_charges;
                    log.debug("mmrc_charges 1st", mmrc_charges);
                    pricedetailsarray = getpricedetailarray(itemObj);
                    log.debug('pricedetailsarray---->', JSON.stringify(pricedetailsarray))
                    if (pricedetailsarray) {
                        usage_charges_amount = gettotalusageamount(pricedetailsarray);
                        log.debug('usage_charges_amount---->', JSON.stringify(usage_charges_amount))
                        item_total_amount = parseFloat(parseFloat(item_total_amount) + parseFloat(usage_charges_amount)).toFixed(2);
                        log.debug('usage_item_total_amount---->', JSON.stringify(item_total_amount))
                    }

                    for (var lc = 0; lc < itemObj.length; lc++) {
                        var itemId = checkForItem(itemObj[lc].item_name);
                        var description = itemId[0].desc;
                        var itemInternalId = itemId[0].internalid;
                        var item_unit = itemId[0].item_unit;
                        var hsn = itemId[0].hsn;
                        var item_price = parseFloat(itemObj[lc].price).toFixed(2);
                        if (isNaN(item_price)) {
                            item_price = 0;
                        }
                        if (description != 'MMRC Offset') {
                            final_json.push({
                                "itemInternalId": itemInternalId,
                                "item_name": itemObj[lc].item_name,
                                "description": description,
                                "quantity": itemObj[lc].quantity,
                                "unit": itemObj[lc].unit,
                                "price": item_price,
                                "hsn": hsn
                            })
                        } else if (description == 'MMRC Offset') {
                            mmrc_offset_rate = item_price;
                            log.debug("mmrc_offset_rate 1st", mmrc_offset_rate);

                            var calc_mmrc_amomunt = parseFloat(parseFloat(item_total_amount) + parseFloat(mmrc_offset_rate)).toFixed(2);
                            if (isNaN(calc_mmrc_amomunt)) {
                                calc_mmrc_amomunt = 0;
                            }
                            log.debug("calc_mmrc_amomunt", calc_mmrc_amomunt);
                            final_mmrc_amomunt = parseFloat(parseFloat(calc_mmrc_amomunt) + parseFloat(mmrc_charges)).toFixed(2);
                            if (isNaN(final_mmrc_amomunt)) {
                                final_mmrc_amomunt = 0;
                            }

                            log.debug("final_mmrc_amomunt", final_mmrc_amomunt);

                        }

                    }
                }

                // customer search code start
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
                        search.createColumn({
                            name: "subsidiary",
                            label: "Primary Subsidiary"
                        }),

                        search.createColumn({
                            name: "custentity_skylo_interconnect_charge",
                            label: "Interconnect Charge (Recurring)"
                        }),
                        search.createColumn({
                            name: "custentity_skylo_interconnect_charge_no",
                            label: "Interconnect Charge (Non - Recurring)"
                        }),
                        search.createColumn({
                            name: "custrecord_skylo_access_fee_field",
                            join: "CUSTRECORD_SKYLO_LINKING_CUSTOMER_RECORD",
                            label: "Access Charges (Per Slab)"
                        }),
                        search.createColumn({
                            name: "custrecord_skylo_roaming_charges",
                            join: "CUSTRECORD_SKYLO_LINKING_CUSSTOMER_RECOR",
                            label: "Roaming Charges (Per Slab)"
                        })

                    ]
                });
                var searchResultCount = customerSearchObj.runPaged().count;
                customerSearchObj.run().each(function (result) {
                    internalId = result.getValue({
                        name: "internalid",
                        label: "Internal ID"
                    });
                    //  log.debug("internalId", internalId);
                    sub = result.getValue({
                        name: "subsidiary",
                        label: "Primary Subsidiary"
                    });
                    accessPrice = result.getValue({
                        name: "custrecord_skylo_access_fee_field",
                        join: "CUSTRECORD_SKYLO_LINKING_CUSTOMER_RECORD",
                        label: "Access Charges (Per Slab)"
                    });

                    roamingPrice = result.getValue({
                        name: "custrecord_skylo_roaming_charges",
                        join: "CUSTRECORD_SKYLO_LINKING_CUSSTOMER_RECOR",
                        label: "Roaming Charges (Per Slab)"
                    });

                    interconnect_item_price = result.getValue({
                        name: "custentity_skylo_interconnect_charge",
                        label: "Interconnect Charge (Recurring)"
                    });
                    interconnect_nonrecitem_price = result.getValue({
                        name: "custentity_skylo_interconnect_charge_no",
                        label: "Interconnect Charge (Non - Recurring)"
                    });

                    return true;
                });
                log.debug("internalId", internalId);

                if (_logValidation(internalId)) {
					
					var custRec = record.load({
                        type: search.Type.CUSTOMER,
                        id: internalId,
                        isDynamic: true
                    });

                    var araccount = custRec.getValue({
                        fieldId: 'receivablesaccount'
                    });
                    var cust_billing_start_date = custRec.getValue({
                        fieldId: 'custentity_skylo_billing_start_date'
                    });
                    var cust_activation_charges = custRec.getValue({
                        fieldId: 'custentity_skylo_activation_charges'
                    });
                    var cust_mmrc = custRec.getValue({
                        fieldId: 'custentity_skylo_mmrc_field'
                    });
                    var cust_mmrc_offset_months = custRec.getValue({
                        fieldId: 'custentity_skylo_mmrc_offset_time'
                    });
					
					var currency = custRec.getText({
                        fieldId: 'currency'
                    });
					
					var terms = custRec.getValue({
						fieldId: 'terms'
					});
					

                    //  log.debug("araccount", araccount);
                    var linecount = custRec.getLineCount({
                        sublistId: 'recmachcustrecord_skylo_usage_linking'
                    });
                    var mmrccount = custRec.getLineCount({
                        sublistId: 'recmachcustrecord_skylo_mmrc_cust_record'
                    });
                    log.debug("cust_mmrc_offset_months", cust_mmrc_offset_months);
                    // usage tiers code start for pdf
                    var usage_data = getdatausagetiers(internalId);
					var accessPooledData = getpooldatacredit(internalId);
                    log.debug("accessPooledData", accessPooledData); 
                    for (var us = 0; us < usage_data.length; us++) {
                        usageSlab = usage_data[us].usageslab;
                        usageSlabArr.push(usageSlab);
                        usageUnitCust = usage_data[us].usage_units;
                        usageUnitsArr.push(usageUnitCust);
                        var combinedSlabUnit = usageSlab + usageUnitCust;
                        usageCombinedArr.push(combinedSlabUnit);
						usageFrom = usage_data[us].custfrom;
						var firstTierFrom = 0;
						if(usageFrom != 0)
						{
						log.debug("not 0..");
						var new_usageFrom = usageFrom - usageSlab;
						log.debug("new_usageFrom",new_usageFrom);
						var combinedFrom = firstTierFrom + new_usageFrom;
						usageFromArr.push(combinedFrom);  
						}
						else if(usageFrom == 0)
						{
							log.debug("0..");
							usageFromArr.push(0);
						}
						usageFromCustArr.push(usageFrom);
						log.debug("usageFromCustArr new array",usageFromCustArr);
						log.debug("new From array",usageFromArr);
						//usageFromArr.push(usageFrom);       //customer from values
						usageTo = usage_data[us].custto;
						usageToArr.push(usageTo);
                    }
					
					log.debug("usage to values before",usageToArr);
					log.debug("usage from values before",usageFromArr);
					log.debug("usage interval values before",usageSlabArr);
					
                    // usage tiers code end for pdf

                    //convresion code for unit in usage tiers start
					//var count = 1;
					if(_logValidation(pricedetailsarray))
					{
						var tirearraay = [];
                        var qtyarray = [];
                        var count = 1;
                        var item_quantity_test = '';
						var quantity = 0;
                        var tirevalue = ''
                        var json_rate ='';
                        var json_amount ='';
                        var jsonunit = '';
                        var usageitemdesc = '';
						if(currency == "US Dollar")
							var currSymbol = "$";
                            log.debug("pricedetailsarray.length", pricedetailsarray.length);
                            var test = pricedetailsarray.length-1;
                            log.debug('test',test);
						var flg = 0;
                    for (var pr = 0; pr < pricedetailsarray.length; pr++) {
						var item_quantity = pricedetailsarray[pr].item_quantity;
                        var price = parseFloat(pricedetailsarray[pr].price).toFixed(2);
                        var to = pricedetailsarray[pr].to;
						log.debug("To in for json value",to);
                        var json_interval = pricedetailsarray[pr].json_interval;
						log.debug("json interval",json_interval);
                        var json_from = pricedetailsarray[pr].json_from;
                       // var convertedjson_to = to * 1024 * 1024;
					   
					   log.debug("json_from",json_from);
					   
					   if (usageUnitCust == "KB")
                            var convertedjson_to = to * 1024;
                        else if (usageUnitCust == "MB")
                            var convertedjson_to = to * 1024 * 1024;
                        else if (usageUnitCust == "GB")
                            var convertedjson_to = to * 1024 * 1024 * 1024;
						
						log.debug("converted json to calc", convertedjson_to);
						log.debug("usage To value", usageTo);
						
						//add reverse calculation
						if (usageUnitCust == "KB")
                            var convertedjson_to1 = parseFloat(convertedjson_to) / parseFloat(1024);
                        else if (usageUnitCust == "MB")
                            var convertedjson_to1 = parseFloat(convertedjson_to) / parseFloat(1024) / parseFloat(1024);
                        else if (usageUnitCust == "GB")
                            var convertedjson_to1 = parseFloat(convertedjson_to) / parseFloat(1024) / parseFloat(1024) / parseFloat(1024);

                        log.debug("converted json to reverse calc", convertedjson_to1);
                        log.debug("converted usage To Arr [pr]", usageToArr[pr]);
						
						
						if(convertedjson_to1 == usageToArr[pr])
						{
							log.debug("invoice can be created because data is matched..");
							//log.debug("usageToArr[pr] in if",usageToArr[pr]);
							flg =1;
							/*return {
									"status": "Success",
									"Message": "Invoice can be created"
							       }
								   */
								
						}
						 else
						{
							log.debug("didn't match to..");
							flg = 0;
							//return;
							/* throw error.create({
                            name: 'Data mismatch',
                            message: 'Customer data and invoice payload data should match'
                        }); */
							return {
									"status": "Failed",
									"Message": "Customer data and invoice payload data should match"
							       }
								   
						}
						
						/* json_from = convertedjson_to1;   //assigning prev to value to from value.
						log.debug("json from after",json_from); */
					   /* if(json_from != 0)
					   {
					   json_from = json_from - usageSlabArr[pr];
					   log.debug("json_from",json_from);
					   }
					   else if(json_from == 0)
					   {
						   json_from = 0;
					   } */
					   if (usageUnitCust == "KB")
                            var convertedjson_from = json_from * 1024;
                        else if (usageUnitCust == "MB")
                            var convertedjson_from = json_from * 1024 * 1024;
                        else if (usageUnitCust == "GB")
                            var convertedjson_from = json_from * 1024 * 1024 * 1024;
						
						log.debug("json converted from",convertedjson_from);
						
						//add reverse calculation
						if (usageUnitCust == "KB")
                            var convertedjson_from1 = parseFloat(convertedjson_from)/ parseFloat(1024);
                        else if (usageUnitCust == "MB")
                            var convertedjson_from1 = parseFloat(convertedjson_from) /parseFloat(1024) / parseFloat(1024);
                        else if (usageUnitCust == "GB")
                            var convertedjson_from1 = parseFloat(convertedjson_from) / parseFloat(1024) / parseFloat(1024) / parseFloat(1024);

                        log.debug("converted json from reverse calc", convertedjson_from1);
                        log.debug("converted json from usageFromArr[pr]", usageFromArr[pr]);
						
						//var convertedjson_from2 = convertedjson_from1 + parseInt(
						
						if(convertedjson_from1 == usageFromArr[pr])
						{
							log.debug("invoice can be created because data is matched..");
							flg =1;
							/* return {
									"status": "Success",
									"Message": "Invoice can be created"
							       } */
						}
						else
						{
						log.debug("didn't match from..");
							flg = 0;
							 return {
									"status": "Failed",
									"Message": "Customer data and invoice payload data should match"
							       } 
						}
						
                         
                     
                        
						/* else
						{
							throw error.create({
                            name: 'Data mismatch',
                            message: 'Customer data and invoice payload data should match'
                        });
							
						//} 
						*/

                        if (usageUnitCust == "KB")
                            var converted_interval = json_interval * 1024;
                        else if (usageUnitCust == "MB")
                            var converted_interval = json_interval * 1024 * 1024;
                        else if (usageUnitCust == "GB")
                            var converted_interval = json_interval * 1024 * 1024 * 1024;
						
						log.debug("converted interval",converted_interval);
						
						//add reverse calculation
						if (usageUnitCust == "KB")
                            var converted_interval1 = parseFloat(converted_interval) / parseFloat(1024);
                        else if (usageUnitCust == "MB")
                            var converted_interval1 = parseFloat(converted_interval) /parseFloat(1024) / parseFloat(1024);
                        else if (usageUnitCust == "GB")
                            var converted_interval1 = parseFloat(converted_interval) / parseFloat(1024) / parseFloat(1024) / parseFloat(1024);

                        log.debug("converted json interval reverse calc", converted_interval1);
						
						if(converted_interval1 == usageSlabArr[pr])
						{
							log.debug("invoice can be created because data is matched..");
							flg =1;
							/* return {
									"status": "Success",
									"Message": "Invoice can be created"
							       } */
						}
						else
						{
						log.debug("didn't match interval..");
							flg = 0;
							 return {
									"status": "Failed",
									"Message": "Customer data and invoice payload data should match"
							       } 
						}
						
						var newfromJsonValues = convertedjson_from1 +parseInt(usageSlab);
						log.debug("newfromJsonValues",newfromJsonValues);
						
						var json_unit = pricedetailsarray[pr].json_unit;
                        var usage_qty_amount = parseFloat(pricedetailsarray[pr].usage_qty_amount).toFixed(2);
                        usageitemdesc += 'Net Usage Charge Tier'+' ' + count + ',';
						quantity = quantity + item_quantity;

                            item_quantity_test += item_quantity + ',';
                            if(pr!=test)
                            {
                                tirevalue += 'Tier' + ' ' + count + '-' + newfromJsonValues + usageUnitCust + ' ' + 'to' + ' ' + convertedjson_to1  +usageUnitCust + ','; // tirearraay=tirearraay.tostring();
                            }
                            if(pr==test)
                            {
                                tirevalue += 'Tier' + ' ' + count + '-' + newfromJsonValues + usageUnitCust + ' ' +'and above'+ ',';
                            }
                           
                            json_rate += currSymbol+ price + '#';
                            json_amount += currSymbol+ usage_qty_amount + '#';
                            jsonunit += json_unit + ',';

						//else
						/*{
							throw error.create({
                            name: 'Data mismatch',
                            message: 'Customer data and invoice payload data should match'
                        });
							/* return {
									"status": "Failed",
									"Message": "Customer data and invoice payload data should match"
							       } */
						//}
						count++;
						
						log.debug("total qty",quantity);
						
						var usageUnit = '';
						for(var us=0;us<usageCombinedArr.length;us++)
						{
							var usage_combined = usageCombinedArr[us];
							log.debug('us combined',usage_combined);
							usageUnit += usage_combined + ',';
						}
					
                        
				}
				if(flg ==1)
					{
						var obj_invoice = record.create({
                        type: record.Type.INVOICE,
                        isDynamic: true
                    });

                    obj_invoice.setValue({
                        fieldId: "customform",
                        value: 238,
                        ignoreFieldChange: true
                    });

                    obj_invoice.setValue({
                        fieldId: "entity",
                        value: internalId,
                        ignoreFieldChange: true
                    });

                    obj_invoice.setValue({
                        fieldId: "custbody_skylo_billrun_inv_id",
                        value: billrun_invoice_id,
                        ignoreFieldChange: true
                    });
					if(billrun_invoice_date)
					{
					obj_invoice.setValue({
                        fieldId: "trandate",
                        value: format_newbillrunDate,
                        ignoreFieldChange: true
                    });
					}
					/* else
					{
						obj_invoice.setValue({
                        fieldId: "trandate",
                        value: billrun_invoice_id,
                        ignoreFieldChange: true
                    });
					} */
					
					
                    obj_invoice.setValue({
                        fieldId: "subsidiary",
                        value: sub,
                        ignoreFieldChange: true
                    });

                    obj_invoice.setValue({
                        fieldId: "account",
                        value: araccount,
                        ignoreFieldChange: true,
                        enableSourcing: false
                    });
					
					for (var lc = 0; lc < itemObj.length; lc++) {
                        if (_logValidation(itemObj[lc].item_name)) {
                            var itemId = checkForItem(itemObj[lc].item_name);
                            var itemInternalId = itemId[0].internalid;
                            var item_unit = itemId[0].item_unit;
                            var hsn = itemId[0].hsn;
                            var description = itemId[0].desc;
                            // log.debug("description", description);
                            if (description == 'Activation Charges' || description == 'Access Charges' || description == 'Roaming Charges' || description == 'MMRC Charges' || description == 'Interconnect Charge (Recurring)' || description == 'Interconnect Charge (Non - Recurring)' || description == 'MMRC Offset') {
                                log.debug("other chrges", 'other chrges');
                                var item_price = parseFloat(itemObj[lc].price).toFixed(2);
                                log.debug("item_price", item_price);


                                obj_invoice.selectLine({
                                    sublistId: 'item',
                                    line: lc
                                });

                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    value: itemInternalId

                                })

                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    value: itemObj[lc].quantity

                                });

                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'unit',
                                    value: itemObj[lc].unit

                                });

                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    value: item_price //parseFloat(itemObj[lc].price)
                                });

                                obj_invoice.commitLine({
                                    sublistId: 'item'
                                });



                            } else if (description == 'Usage Charges') {
                                log.debug("usage charger", 'usage charger');

                                // usage_charges_amount = gettotalusageamount(pricedetailsarray);
                                // log.debug('usage_charges_amount---->', JSON.stringify(usage_charges_amount))
                                obj_invoice.selectLine({
                                    sublistId: 'item',
                                    line: lc
                                });

                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    value: itemInternalId

                                });

                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    value: 1 //itemObj[lc].quantity

                                });

                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'unit',
                                    value: item_unit

                                })

                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    value: 1 //parseFloat(itemObj[lc].price)
                                })

                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    value: parseFloat(usage_charges_amount)
                                })
                                obj_invoice.commitLine({
                                    sublistId: 'item'
                                });


                            }

                            if (description == 'MMRC Offset') {
                                var mmrc_offset_rate = parseFloat(itemObj[lc].price);
                                var calc_mmrc_amomunt = parseFloat(parseFloat(item_total_amount) + parseFloat(mmrc_offset_rate)).toFixed(2);
                                if (isNaN(calc_mmrc_amomunt)) {
                                    calc_mmrc_amomunt = 0;
                                }
                                log.debug("calc_mmrc_amomunt", calc_mmrc_amomunt);
                                final_mmrc_amomunt = parseFloat(parseFloat(calc_mmrc_amomunt) + parseFloat(mmrc_charges)).toFixed(2);
                                if (isNaN(final_mmrc_amomunt)) {
                                    final_mmrc_amomunt = 0;
                                }
                                item_price = final_mmrc_amomunt;
                                log.debug("final_mmrc_amomunt", final_mmrc_amomunt);
                            }

                        }
                    }
                    //end code foradding items in invoice

                    //start code to set usage charges custom record in invoice
                    var count = 1;

                    if (_logValidation(pricedetailsarray)) {
                        for (var pr = 0; pr < pricedetailsarray.length; pr++) {
                            //  log.debug("pricedetailsarray[pr].json_unit ", pricedetailsarray[pr].json_unit);
                            obj_invoice.selectLine({
                                sublistId: 'recmachcustrecord_skylo_linking_invoice',
                                line: pr
                            });

                            if (_logValidation(pricedetailsarray[pr].itemInternalId)) {
                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_skylo_linking_invoice',
                                    fieldId: 'custrecord_skylo_item_record',
                                    value: pricedetailsarray[pr].itemInternalId
                                })
                            }

                            obj_invoice.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_skylo_linking_invoice',
                                fieldId: 'custrecord_skylo_usage_charge_tier',
                                value: count
                            })
                            if (_logValidation(pricedetailsarray[pr].json_from)) {
                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_skylo_linking_invoice',
                                    fieldId: 'custrecord_skylo_from_mb',
                                    value: pricedetailsarray[pr].json_from

                                })
                            }

                            if (_logValidation(pricedetailsarray[pr].to)) {
                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_skylo_linking_invoice',
                                    fieldId: 'custrecord_skylo_to_mb',
                                    value: pricedetailsarray[pr].to

                                })
                            }
                            if (_logValidation(pricedetailsarray[pr].json_interval)) {
                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_skylo_linking_invoice',
                                    fieldId: 'custrecord_skylo_interval',
                                    value: pricedetailsarray[pr].json_interval

                                })
                            }
                            var uspcase_unit = pricedetailsarray[pr].json_unit;
                            uspcase_unit = uspcase_unit.toUpperCase();
                            if (_logValidation(pricedetailsarray[pr].json_unit)) {
                                obj_invoice.setCurrentSublistText({
                                    sublistId: 'recmachcustrecord_skylo_linking_invoice',
                                    fieldId: 'custrecord_skylo_units_usage_record',
                                    text:uspcase_unit //[pr].json_unit

                                })
                            }


                            var usage_qty = pricedetailsarray[pr].item_quantity;

                            if (pricedetailsarray[pr].item_quantity == 0 || pricedetailsarray[pr].item_quantity == null) {
                                usage_qty = 0;
                                log.debug("usage_qty", usage_qty);
                            }

                            if (_logValidation(pricedetailsarray[pr].item_quantity)) {
                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_skylo_linking_invoice',
                                    fieldId: 'custrecord_usage_qty',
                                    value: usage_qty

                                })
                            }
                            if (_logValidation(pricedetailsarray[pr].price)) {
                                obj_invoice.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_skylo_linking_invoice',
                                    fieldId: 'custrecord_skylo_price',
                                    value: pricedetailsarray[pr].price

                                })
                            }

                            obj_invoice.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_skylo_linking_invoice',
                                fieldId: 'custrecord_skylo_cust_rcrd',
                                value: internalId

                            })

                            obj_invoice.commitLine({
                                sublistId: 'recmachcustrecord_skylo_linking_invoice'
                            });
                            count++;
                        }

                    }


                    //end code to set usage charges custom record in invoice
                    if (_logValidation(final_mmrc_amomunt)) {
                        obj_invoice.setValue('subtotal', final_mmrc_amomunt);
                        // obj_invoice.setValue('amount', final_mmrc_amomunt);
                        obj_invoice.setValue('amountremaining', final_mmrc_amomunt);
                        // obj_invoice.setValue('amountremainingtotalbox', final_mmrc_amomunt);


                    }
					if (_logValidation(item_quantity_test)) {
                            item_quantity_test = item_quantity_test.slice(0, -1);
                        }
                        if (_logValidation(tirevalue)) {
                            tirevalue = tirevalue.slice(0, -1);
                        }
                        if (_logValidation(json_rate)) {
                            json_rate = json_rate.slice(0, -1);
                        }
                        if (_logValidation(json_amount)) {
                            json_amount = json_amount.slice(0, -1);
                        }
                        if (_logValidation(jsonunit)) {
                            jsonunit = jsonunit.slice(0, -1);
                        }
                        if (_logValidation(usageitemdesc)) {
                            usageitemdesc = usageitemdesc.slice(0, -1);
                        }
						
						if (_logValidation(usageUnit)) {
                            usageUnit = usageUnit.slice(0, -1);
                        }
                      
                        log.debug("JSON.stringify(qtyarray)", JSON.stringify(qtyarray));
						
					
					obj_invoice.setValue('custbody_usage_qty', item_quantity_test)
                        obj_invoice.setValue('custbody_usage_tires', tirevalue);
                        obj_invoice.setValue('custbody_usage_rate', json_rate);
                        obj_invoice.setValue('custbody_usage_units', usageUnit);
                        obj_invoice.setValue('custbody_usage_amount', json_amount);
                        obj_invoice.setValue('custbody_usage_item', usageitemdesc);  
                        obj_invoice.setValue('custbody_total_quantity', quantity);  
                        obj_invoice.setValue('custbody_unit', usageSlab+usageUnitCust);  
                        obj_invoice.setValue('custbody_pooled_data', accessPooledData);  
                        obj_invoice.setValue('terms', terms);  
						
						var adjustedUsageQuantity = (quantity * usageSlab) + parseInt(accessPooledData);
						log.debug("adjustedUsageQuantity",adjustedUsageQuantity);
						if(isNaN(adjustedUsageQuantity))
                        {
                            adjustedUsageQuantity = 0;
                        }
						obj_invoice.setValue('custbody_adjusted_qty', adjustedUsageQuantity);
                    
                    invoice_rec_id = obj_invoice.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug("invoice_rec_id", invoice_rec_id);
                    if (_logValidation(invoice_rec_id)) {
                        var id = record.submitFields({
                            type: 'invoice',
                            id: invoice_rec_id,
                            values: {
                                'custbody_skylo_created_by_billrun': true,
                                'subtotal': final_mmrc_amomunt,
                                // 'amount': final_mmrc_amomunt,
                                // 'amountremaining': final_mmrc_amomunt,
                                // 'amountremainingtotalbox': final_mmrc_amomunt,


                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }

                        })
                        var status_code = 'Success';

                        var searchLookFromIN = search.lookupFields({
                            type: 'invoice',
                            id: invoice_rec_id,
                            columns: ['tranid']

                        });

                        var inv_doc_number = searchLookFromIN.tranid;
                        log.debug("inv_doc_number", inv_doc_number);
                        // var invrec = record.load({
                        //     type: 'invoice',
                        //     id: invoice_rec_id,
                        //     isDynamic: true
                        // });

                        // var inv_doc_number = invrec.getValue('tranid');
                        json_response = {
                            "success": 200,
                            "message": "Invoice record created successfully in NS",
                            "netsuite_invoice_id": inv_doc_number
                        };
                        var jsonBody = JSON.stringify(requestParams);
                        var int_LogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invoice_rec_id, internalId)
                        log.audit("in post method ", "int_LogId", int_LogId);
                        return {
                            "status": 'Success',
                            "message": "Invoice record created successfully in NS",
                            "netsuite_invoice_id": inv_doc_number
                        }
                    }

						/* return {
									"status": "Success",
									"Message": "Data matched..invoice can be created"
							} */
					}
			 }
				 else
				{
					return {
									"status": "Failed",
									"Message": "Customer data and invoice payload data should match"
							}
				} 
                    //convresion code for unit in usage tiers end
                    // access pool data credit start  for pdf
                     
                    // access pool data credit end for odf
					
					/* //conversion added for pooled data
					if (usageUnitCust == "KB")
                            var converted_accessPooledData = accessPooledData * 1024;
                        else if (usageUnitCust == "MB")
                            var converted_accessPooledData = accessPooledData * 1024 * 1024;
                        else if (usageUnitCust == "GB")
                            var converted_accessPooledData = accessPooledData * 1024 * 1024 * 1024;
						
						 */
						

                } else {
                    return {
                        "status": "Failed",
                        "message": "Customer ID is not present in Netsuite"
                    }
                }

            } else {
                var status_code = 'Failed'
                var jsonBody = JSON.stringify(requestParams);
                var json_response = {
                    "status": "Failed",
                    "Message": "Customer ID is missing"
                };
                var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invoice_rec_id, internalId)
                return {
                    "status": "Failed",
                    "message": "Customer ID is missing"
                }
            }



        } catch (exp) {
            log.debug({
                title: "Exception Messege",
                details: exp.id
            });
            log.debug({
                title: "Exception Messege",
                details: exp.message
            });

            var status_code = 200
            var json_response = {
                "status": "Failed",
                "error": exp.message
            };
            var jsonBody = JSON.stringify(requestParams)

            var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invoice_rec_id)
            log.audit("in post method ", "errorLogId", errorLogId);
            return {
                "status": "Failed",
                "error": exp.message
            }
            //return exp
        }
    }



    function getdatausagetiers(internalId) {
        var usage_arr = [];
        var customrecord_skylo_usage_recordSearchObj = search.create({
            type: "customrecord_skylo_usage_record",
            filters: [
                ["custrecord_skylo_usage_linking", "anyof", internalId],
                "AND",
                ["isinactive", "is", "F"]
            ],
            columns: [
                search.createColumn({
                    name: "custrecord_skylo_interval",
                    label: "Usage Charge Slab"
                }),
                search.createColumn({
                    name: "custrecord_skylo_units_usage_record",
                    label: "Units"
                }),
				search.createColumn({name: "custrecord_skylo_from_mb", label: "From"}),
				search.createColumn({name: "custrecord_skylo_to_mb", label: "To"}),
            ],
        });
        var searchResultCount = customrecord_skylo_usage_recordSearchObj.runPaged().count;
        log.debug("customrecord_skylo_usage_recordSearchObj result count", searchResultCount);
        customrecord_skylo_usage_recordSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results
            var usageslab = result.getValue('custrecord_skylo_interval');
            log.debug("usageslab", usageslab);
            var usage_units = result.getText('custrecord_skylo_units_usage_record');
            log.debug("usage_units", usage_units);
            var custFrom = result.getValue('custrecord_skylo_from_mb');
            log.debug("custFrom",custFrom); 
			var custTo = result.getValue('custrecord_skylo_to_mb');
			log.debug("custTo",custTo); 
            var rec = {
                "usageslab": usageslab,
                "usage_units": usage_units,
				"custfrom": custFrom,
				"custto": custTo
            };
            usage_arr.push(rec);
            return true;
        });
        return usage_arr;
    }

    function getpooldatacredit(internalId) {
        var access_pooled_data;
        var customrecord_skylo_access_feeSearchObj = search.create({
            type: "customrecord_skylo_access_fee",
            filters: [
                ["custrecord_skylo_linking_customer_record", "anyof", internalId],
                "AND",
                ["isinactive", "is", "F"]
            ],
            columns: [
                search.createColumn({
                    name: "custrecord_skylo_pooled_data_credit",
                    label: "Pooled Data Credit"
                })
            ]
        });
        var searchResultCount = customrecord_skylo_access_feeSearchObj.runPaged().count;
        customrecord_skylo_access_feeSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results
            access_pooled_data = result.getValue('custrecord_skylo_pooled_data_credit');
            log.debug("access_pooled_data", access_pooled_data);
            /* var rec = {
                "access_pooled_data": access_pooled_data
            };
           // access_arr.push(rec); */
            return true;
        });
        return access_pooled_data;

    }


    function itemchargesvalidation(itemObj, requestParams, internalId, cust_activation_charges, accessPrice, roamingPrice) {
        var act_flag = false;
        var invid;
        for (var i = 0; i < itemObj.length; i++) {

            var description = itemObj[i].description;
            var item_name = itemObj[i].item_name;
            log.debug('description---->', JSON.stringify(description))
            var message;

            if (_logValidation(item_name)) {
                if (description == 'Activation Charges') {
                    var activation_price = itemObj[i].price;
                    if (parseFloat(cust_activation_charges) != parseFloat(activation_price)) {
                        act_flag = true;
                        var status_code = 'Failed'
                        var jsonBody = JSON.stringify(requestParams);
                        var json_response = {
                            Status: 'Price mismatch',
                            message: 'Activation Charges Price should match'
                        };
                        var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invid, internalId)
                        log.audit("item_validation errorLogId", errorLogId);

                        throw error.create({
                            name: 'Price mismatch',
                            message: 'Activation Charges Price should match'
                        });

                    }
                }
                if (description == 'Access Charges') {
                    var access_price = itemObj[i].price;
                    if (parseFloat(accessPrice) != parseFloat(access_price)) {
                        act_flag = true;
                        var status_code = 'Failed'
                        var jsonBody = JSON.stringify(requestParams);
                        var json_response = {
                            Status: 'Price mismatch',
                            message: 'Access Charges Price should match'
                        };
                        var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invid, internalId)
                        log.audit("item_validation errorLogId", errorLogId);

                        throw error.create({
                            name: 'Price mismatch',
                            message: 'Access Charges Price should match'
                        });
                    }
                }

                if (description == 'Roaming Charges') {
                    var roaming_price = itemObj[i].price;
                    if (parseFloat(roamingPrice) != parseFloat(roaming_price)) {
                        act_flag = true;
                        var status_code = 'Failed'
                        var jsonBody = JSON.stringify(requestParams);
                        var json_response = {
                            Status: 'Price mismatch',
                            message: 'Roaming Charges Price should  match'
                        };
                        var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invid, internalId)
                        log.audit("item_validation errorLogId", errorLogId);

                        throw error.create({
                            name: 'Price mismatch',
                            message: 'Roaming Charges Price should match'
                        });
                    }
                }

                if (description == 'Interconnect Charge (Recurring)') {
                    var interconnect_rec_charge = itemObj[i].price;
                    if (parseFloat(interconnect_item_price) != parseFloat(interconnect_rec_charge)) {
                        act_flag = true;
                        var status_code = 'Failed'
                        var jsonBody = JSON.stringify(requestParams);
                        var json_response = {
                            Status: 'Price mismatch',
                            message: 'Interconnect Charge(Recurring) Price should  match'
                        };
                        var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invid, internalId)
                        log.audit("item_validation errorLogId", errorLogId);

                        throw error.create({
                            name: 'Price mismatch',
                            message: 'Interconnect Charge(Recurring) Price should match'
                        });
                    }
                }

                if (description == 'Interconnect Charge (Non - Recurring)') {
                    var interconnect_nonrec_charge = itemObj[i].price;
                    if (parseFloat(interconnect_nonrecitem_price) != parseFloat(interconnect_nonrec_charge)) {
                        act_flag = true;
                        var status_code = 'Failed'
                        var jsonBody = JSON.stringify(requestParams);
                        var json_response = {
                            Status: 'Price mismatch',
                            message: 'Interconnect Charge(Non-Recurring) Price should  match'
                        };
                        var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invid, internalId)
                        log.audit("item_validation errorLogId", errorLogId);

                        throw error.create({
                            name: 'Price mismatch',
                            message: 'Interconnect Charge(Non-Recurring) Price should match'
                        });
                    }
                }
            }
        }
        return act_flag;
    }


    function item_validation(itemObj, requestParams) {
        var item_flag = false;
        var invid;
        var internalId;
        var validation_array = [];
        var item_amomunt = 0;
        var mmrcprice = 0;

        for (var i = 0; i < itemObj.length; i++) {
            var item_name = itemObj[i].item_name;
            var item_quantity = itemObj[i].quantity;
            var item_price = Math.abs(itemObj[i].price);
            log.debug("validation item_name first", item_name);
            if (_logValidation(item_name)) {
                var itemId = checkForItem(item_name);
                var description = itemId[0].desc;
                log.debug("description", description);
                if (description != 'Usage Charges' && description != 'MMRC Offset') {
                    // log.debug("item_quantity", item_quantity);
                    log.debug("item_price", item_price);
                    if (description == 'MMRC Charges') {
                        mmrcprice = parseFloat(item_price).toFixed(2);
                        // log.debug("mmrcprice", mmrcprice);
                    }
                    if (_logValidation(item_quantity) && _logValidation(item_price) && description != 'MMRC Charges' && description != 'Interconnect Charge (Recurring)' && description != 'Interconnect Charge (Non - Recurring)') {
                        var total = parseFloat(parseFloat(item_quantity) * parseFloat(item_price)).toFixed(2);
                        log.debug("total", total);
                        if (total) {
                            item_amomunt = parseFloat(parseFloat(item_amomunt) + parseFloat(total)).toFixed(2);
                            log.debug("item_amomunt", item_amomunt);
                        }


                    } else if (!_logValidation(item_quantity) && item_price == '' || item_price == null) {
                        var status_code = 'Failed'
                        var jsonBody = JSON.stringify(requestParams);
                        var json_response = {
                            "Message": "Item Fields should not be Empty"
                        };
                        var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invid, internalId)
                        log.audit("item_validation try errorLogId----->", errorLogId);
                        item_flag = true;

                    }

                }
            } else {
                log.debug("validation item_name", item_name);
                var status_code = 'Failed'
                var jsonBody = JSON.stringify(requestParams);
                var json_response = {
                    "Message": "Item Fields should not be Empty"
                };
                var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invid, internalId)
                log.audit("catch item_validation errorLogId", errorLogId);
                item_flag = true;

            }

        }

        if (isNaN((item_amomunt))) {
            item_amomunt = 0;
        }
        // if (isNaN((mmrcprice)) ) {
        //     mmrcprice = 0;
        // }
        validation_array.push({
            'item_flag': item_flag,
            'item_total_amount': item_amomunt,
            'mmrc_charges': mmrcprice

        });
        log.audit("item_validation validation_array", JSON.stringify(validation_array));
        return validation_array;

    }


    function usage_item_validation(itemObj, requestParams, internalId) {
        var item_flag = false;
        var invid;
        for (var i = 0; i < itemObj.length; i++) {
            var item_name = itemObj[i].item_name;
            var message = '';
            if (_logValidation(item_name)) {
                var itemId = checkForItem(item_name);
                var description = itemId[0].desc;
                log.audit("usage_item_validation description", description);
                if (description == 'Usage Charges') {
                    var pricedetaillength = itemObj[i].pricedetails.length;
                    var pricedetails = itemObj[i].pricedetails;
                    for (var pr = 0; pr < pricedetaillength; pr++) {
                        var item_quantity = pricedetails[pr].quantity;
                        var price = pricedetails[pr].price;
                        //  log.audit("item_quantity", item_quantity);
                        // log.audit("price", price);
                        if ((item_quantity) == 0) {
                            // log.audit("first if", 'in first if ');
                            item_flag = false;
                            //log.audit("first if flag ", item_flag);
                        }

                        if ((price) == 0) {
                            //  log.audit("first if", 'in first if ');
                            item_flag = true;
                            message = "Price Should not be Zero";
                            //  log.audit("first price if flag ", item_flag);
                        }

                        //    if (item_quantity == null || item_quantity == '' || price == null || price == '') {
                        //         // log.audit("usage_item_validation if", 'second if');
                        //         // var status_code = 'Failed'
                        //         // var jsonBody = JSON.stringify(requestParams);
                        //         // var json_response = {
                        //         //     "Message": "Usage Charges Fields should not be Empty"
                        //         // };
                        //         // var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invid, internalId)
                        //         // log.audit("usage_item_validation errorLogId", errorLogId);
                        //        // item_flag = true;
                        //         // break;
                        //     }

                        if ((item_quantity == null)) {
                            log.audit("usage_item_validation if", '2 if');
                            item_flag = true;
                            message = "Quantity Should not be empty";
                            break;
                        }
                        if ((item_quantity === " ")) {
                            log.audit("usage_item_validation if", '3 if');
                            item_flag = true;
                            message = "Quantity Should not be empty";
                            break;
                        }
                        if ((item_quantity === "")) {
                            log.audit("usage_item_validation if", '4 if');
                            item_flag = true;
                            message = "Quantity Should not be empty";
                            break;
                        }

                        if (!_logValidation(price)) {
                            log.audit("usage_item_validation if", '5 if');
                            item_flag = true;
                            message = "Price Should not be empty";
                            break;
                        }

                    }

                }
            } else {
                var status_code = 'Failed'
                var jsonBody = JSON.stringify(requestParams);
                var json_response = {
                    "Message": "Item Fields should not be Empty"
                };
                var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invid, internalId)
                log.audit("item_validation errorLogId", errorLogId);
                item_flag = true;
            }

        }
        log.audit("usage_item_validation item_flag", item_flag);
        if (item_flag == true) {
            var status_code = 'Failed'
            var jsonBody = JSON.stringify(requestParams);
            var json_response = {
                "Message": message
            };
            var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody, invid, internalId)
            log.audit("item_validation errorLogId", errorLogId);

        }
        return item_flag;

    }


    function getpricedetailarray(itemObj) {
        for (var i = 0; i < itemObj.length; i++) {
            // log.debug('itemObj.length---->', itemObj.length)
            var description = itemObj[i].description;
            var item_name = itemObj[i].item_name;
            var total_usage_amount = 0;
            var usage_qty_amount = 0;
            if (_logValidation(item_name)) {
                //  log.debug('description---->', JSON.stringify(description))
                if (description == 'Usage Charges') {
                    var pricedetaillength = itemObj[i].pricedetails.length;
                    // log.debug('pricedetaillength---->', pricedetaillength)

                    var pricedetails = itemObj[i].pricedetails;
                    var pricedetailsarray = [];
                    //  log.debug('pricedetails---->', JSON.stringify(pricedetails))
                    if (_logValidation(item_name)) {
                        var itemId = checkForItem(item_name);
                        log.debug('itemId', itemId)

                        var itemInternalId = itemId[0].internalid;
                        //  log.debug('itemInternalId---->', JSON.stringify(itemInternalId))
                        for (var pr = 0; pr < pricedetaillength; pr++) {
                            var item_quantity = pricedetails[pr].quantity;
                            var json_interval = pricedetails[pr].interval;
                            /* if(usageUnitCust == "KB")
                            	var converted_interval = json_interval * 1024;
                            else if(usageUnitCust == "MB")
                            	var converted_interval = json_interval * 1024 * 1024;
                            else if(usageUnitCust == "GB")
                            	var converted_interval = json_interval * 1024 * 1024 * 1024;
                             */
                            //var converted_interval = json_interval *1024 * 1024;
                            //log.debug("converted_interval",converted_interval);
                            var json_from = pricedetails[pr].from;
                            var price = pricedetails[pr].price;
                            var to = pricedetails[pr].to;

                            var json_unit = pricedetails[pr].unit;
                            var final_qty = parseFloat(to) / parseFloat(json_interval);
                            var usage = parseFloat(parseFloat(item_quantity) * parseFloat(json_interval));
                            total_usage_amount = parseFloat(parseFloat(total_usage_amount) + parseFloat(usage));
                            usage_qty_amount = parseFloat(parseFloat(item_quantity) * parseFloat(price));
                            var rec = {
                                "itemInternalId": itemInternalId,
                                "item_quantity": item_quantity,
                                "final_qty": final_qty,
                                "price": price,
                                "to": to,
                                "total_usage_amount": total_usage_amount,
                                "json_interval": json_interval,
                                "json_unit": json_unit,
                                "json_from": json_from,
                                "usage_qty_amount": usage_qty_amount
                            }


                            pricedetailsarray.push(rec);
                        }

                    }
                }
            }

        }

        log.debug('pricedetailsarray---->', JSON.stringify(pricedetailsarray))
        return pricedetailsarray;
    }

    function gettotalusageamount(pricedetailsarray) {
        //  log.debug('pricedetailsarray.length---->', JSON.stringify(pricedetailsarray.length))
        var flag = false;
        var total_usage_amount = 0;
        if (_logValidation(pricedetailsarray)) {
            for (prarr = 0; prarr < pricedetailsarray.length; prarr++) {
                var json_quantity = pricedetailsarray[prarr].item_quantity; //qty 
                var json_price = pricedetailsarray[prarr].price; // rate 
                log.debug('json_quantity---->', json_quantity);
                log.debug('json_price---->', json_price)
                //   log.debug('usage_slab_qty---->', usagechargearay[prarr].usage_slab_qty)
                // if (json_quantity > usagechargearay[prarr].usage_slab_qty) {
                //     flag = true;
                //     throw error.create({
                //         name: 'MISSING_REQ_ARG',
                //         message: 'Usage Quantity should match '
                //     });
                // }
                //  else {
                if (isNaN(json_quantity)) {
                    json_quantity = 0;
                }
                if (isNaN(json_price)) {
                    json_price = 0;
                }
                if (_logValidation(json_quantity) && _logValidation(json_price)) {
                    var total_amount = parseFloat(json_quantity) * parseFloat(json_price);

                    log.debug('total_amount', JSON.stringify(total_amount))
                    if (isNaN(total_amount)) {
                        total_amount = 0;
                    }

                    total_usage_amount = parseFloat(parseFloat(total_usage_amount) + parseFloat(total_amount)).toFixed(2);
                }

            }
        }
        log.debug('total_usage_amount---->', JSON.stringify(total_usage_amount))
        return total_usage_amount;

    }

    // function get_usage_final_amount(itemObj) {
    //     for (var i = 0; i < itemObj.length; i++) {
    //         // log.debug('itemObj.length---->', itemObj.length)
    //         var description = itemObj[i].description;
    //         var item_name = itemObj[i].item_name;
    //         var total_usage_amount = 0;
    //         if (_logValidation(item_name)) {
    //             //  log.debug('description---->', JSON.stringify(description))
    //             if (description == 'Usage Charges') {

    //                 var pricedetaillength = itemObj[i].pricedetails.length;
    //              log.debug('pricedetaillength---->', pricedetaillength)
    //                 var pricedetails = itemObj[i].pricedetails;
    //                 log.debug('pricedetails---->', JSON.stringify(pricedetails))
    //                 for (var pr = 0; pr < pricedetaillength; pr++) {
    //                     var json_quantity = pricedetails[pr].quantity;
    //                         var json_price = pricedetails[pr].price;
    //                         if (isNaN(json_quantity)) {
    //                             json_quantity = 0;
    //                         }
    //                         if (isNaN(json_price)) {
    //                             json_price = 0;
    //                         }
    //                         var total_amount = parseFloat(json_quantity) * parseFloat(json_price);
    //                         if (isNaN(total_amount)) {
    //                             total_amount = 0;
    //                         }
    //                         total_usage_amount = parseFloat(parseFloat(total_usage_amount) + parseFloat(total_amount)).toFixed(2);

    //                 }

    //             }
    //         }

    //     }

    //     log.debug('total_usage_amount---->', JSON.stringify(total_usage_amount))
    //     return total_usage_amount;
    // }


    // function gettotalusageamount(itemObj, description) {

    //     var flag = false;
    //     var total_usage_amount = 0;
    //     for (var i = 0; i < itemObj.length; i++) {
    //         var item_name = itemObj[i].item_name;
    //         log.debug('gettotalusageamount---->', JSON.stringify(item_name))
    //         log.debug('gettotalusageamount---->', JSON.stringify(description))
    //         if (_logValidation(item_name)) {
    //             if (description == 'Usage Charges') {
    //                 var pricedetaillength = itemObj[i].pricedetails.length;
    //                 log.debug('pricedetaillength---->', JSON.stringify(pricedetaillength))
    //                 var pricedetails = itemObj[i].pricedetails;

    //                 if (_logValidation(pricedetaillength)) {
    //                     for (var pr = 0; pr < pricedetaillength; pr++) {
    //                         var json_quantity = pricedetails[pr].quantity;
    //                         var json_price = pricedetails[pr].price;
    //                         if (isNaN()) {json_quantity
    //                             json_quantity = 0;
    //                         }
    //                         if (isNaN(json_price)) {
    //                             json_price = 0;
    //                         }
    //                         var total_amount = parseFloat(json_quantity) * parseFloat(json_price);
    //                         if (isNaN(total_amount)) {
    //                             total_amount = 0;
    //                         }
    //                         total_usage_amount = parseFloat(parseFloat(total_usage_amount) + parseFloat(total_amount)).toFixed(2);
    //                     }
    //                 }

    //             }
    //         }
    //     }
    //     // if (_logValidation(pricedetailsarray)) {
    //     //     for (prarr = 0; prarr < pricedetailsarray.length; prarr++) {
    //     //         var json_quantity = pricedetailsarray[prarr].item_quantity; //qty 
    //     //         var json_price = pricedetailsarray[prarr].price; // rate 
    //     //         // log.debug('json_quantity---->', json_quantity)
    //     //         //   log.debug('usage_slab_qty---->', usagechargearay[prarr].usage_slab_qty)
    //     //         // if (json_quantity > usagechargearay[prarr].usage_slab_qty) {
    //     //         //     flag = true;
    //     //         //     throw error.create({
    //     //         //         name: 'MISSING_REQ_ARG',
    //     //         //         message: 'Usage Quantity should match '
    //     //         //     });
    //     //         // }
    //     //         //  else {
    //     //         if (isNaN(json_quantity)) {
    //     //             json_quantity = 0;
    //     //         }
    //     //         if (isNaN(json_price)) {
    //     //             json_price = 0;
    //     //         }
    //     //         var total_amount = parseFloat(json_quantity) * parseFloat(json_price);

    //     //         //   log.debug('total_amount', JSON.stringify(total_amount))
    //     //         if (isNaN(total_amount)) {
    //     //             total_amount = 0;
    //     //         }

    //     //         total_usage_amount = parseFloat(parseFloat(total_usage_amount) + parseFloat(total_amount)).toFixed(2);
    //     //         // }

    //     //     }
    //     // }
    //     log.debug('total_usage_amount---->', JSON.stringify(total_usage_amount))
    //     return total_usage_amount;

    // }


    function create_logs(json_response, status_code, jsonBody, invid, customerid) {
        var restleturl = 'https://5434394-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=2334&deploy=1';
        var return_id = "";
        try {
            var d_date = new Date();
            var recName = "Skylo_inv" + "_" + d_date;

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
                fieldId: 'custrecord_il_skylo_transaction_type',
                value: 7,
                ignoreFieldChange: false
            });


            o_logsOBJ.setValue({
                fieldId: 'custrecord_il_skylo_integration_type',
                value: 2,
                ignoreFieldChange: false
            });

            o_logsOBJ.setValue({
                fieldId: 'custrecord_skylo_il_json_request',
                value: jsonBody,
                ignoreFieldChange: false
            });
            o_logsOBJ.setValue({
                fieldId: 'custrecord_il_skylo_url',
                value: restleturl,
                ignoreFieldChange: false
            });

            o_logsOBJ.setValue({
                fieldId: 'custrecord_il_skylo_transaction',
                value: invid,
                ignoreFieldChange: false
            });

            o_logsOBJ.setValue({
                fieldId: 'custrecord_il_skylo_customer',
                value: customerid,
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
        if (value != 'null' && value != null && value != null && value != '' && value != undefined && value != undefined && value != 'undefined' && value != 'undefined' && value != 'NaN' && value != NaN) {
            return true;
        } else {
            return false;
        }
    }

    function checkForItem(itemname) {
        log.debug("in function..");
        var internalId;
        var hsn;
        var desc;
        var internalIdArray = new Array();
        var itemSearchObj = search.create({
            type: "item",
            filters: [
                ["name", "is", itemname]
            ],
            columns: [
                search.createColumn({
                    name: "internalid",
                    label: "Internal ID"
                }),
                search.createColumn({
                    name: "custitem_iit_item_hsn_sac",
                    label: "HSN/SAC "
                }),
                search.createColumn({
                    name: "displayname",
                    label: "Description"
                }),
                search.createColumn({
                    name: "memberbaseunit",
                    label: "Member Base Unit"
                }),
            ]
        });
        var searchResultCount = itemSearchObj.runPaged().count;
        log.debug("itemSearchObj result count", searchResultCount);
        itemSearchObj.run().each(function (result) {

            internalId = result.getValue({
                name: "internalid",
                label: "Internal ID"
            });
            hsn = result.getValue({
                name: "custitem_iit_item_hsn_sac",
                label: "HSN/SAC"
            });
            desc = result.getValue({
                name: "displayname",
                label: "Description"
            });

            unit = result.getValue({
                name: "memberbaseunit",
                label: "Member Base Unit"
            });
            log.debug('internalId', internalId);
            var rec = {
                "internalid": internalId,
                "hsn": hsn,
                "desc": desc,
                "item_unit": unit
            };
            internalIdArray.push(rec);
            // .run().each has a limit of 4,000 results
            return true;
        });

        return internalIdArray
    }

    return {
        post: SetConnection
    };
});
