/**
 * @NApiVersion 2.x
 * @NScriptType restlet
 */
define(['N/search', 'N/https', 'N/http', 'N/record', 'N/error', './moment'], function (search, https, http, record, error, moment) {

    function SetConnection(requestParams) {
        try {

            var roc_code = requestParams.roccode;
            log.debug('roc_code', roc_code);
            var region_json = [];
            var flag_for_roscode = false;
            if (_logValidation(roc_code)) {

                var roclist = getrocdetails(roc_code);
                var rocintid = roclist[0].roc_id;
                //log.debug('rocintid', rocintid);
                var rosarray = getrosdetails(rocintid);

                // log.debug('roclist.length', roclist);
                if (roclist.length > 0) {
                    for (var i = 0; i < roclist.length; i++) {
                        var rocid = roclist[i].roc_id;
                        var rocCode = roclist[i].rocCode;
                        var rocName = roclist[i].rocName;
                        var rec = {
                            "rocCode": rocCode,
                            "rocName": rocName,
                            "rosList": rosarray
                        }
                        region_json.push(rec);
                        // log.debug('region_json with name', JSON.stringify(region_json));

                    }
                    var status_code = '200'
                    var jsonBody = roc_code;
                    var json_response = {
                        "status": "Success",
                        "Message": "Record Fetch Successfully",
                        "Response": JSON.stringify(region_json)
                    };
                    var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody)
                    return {
                        "status": "Success",
                        "rocList": region_json,
                        "Message": "Record Fetch Successfully"
                    }
                } else {
                    var status_code = 'Failed'
                    var jsonBody = roc_code;
                    var json_response = {
                        "status": "Failed",
                        "Message": "No Record Available for requested ROC or Roc code is Invalid"
                    };
                    var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody)
                    return {
                        "status": "Failed",
                        "Message": "No Record Available for requested ROC or Roc code is Invalid"
                    }
                }
            } else {
                var roclist = getallrocdetails();
                var rosarray = getallrosdetails();
                // log.debug('rosarray-------------', JSON.stringify(rosarray));
         log.debug(' roclist.length', JSON.stringify(roclist));
                if (roclist.length > 0) {
                    for (var i = 0; i < roclist.length; i++) {
                        var finalrosarray = [];
                        var rocid = roclist[i].roc_id;
                        var rocCode = roclist[i].rocCode;
                        var rocName = roclist[i].rocName;
                        var search_rec3;
                        log.debug('rocid-------------', JSON.stringify(rocid));

                       var getrosname = getros_name(rocid);
                        // search_rec3 = rosarray.filter(function (data) {
                        //     return (rocid === data.roc_id);

                        // });

                    //   log.debug('search_rec3-------------', JSON.stringify(search_rec3));
                    //     for (j = 0; j < search_rec3.length; j++) {
                    //         var rosCode = search_rec3[j].rosCode;
                    //         var rosName = search_rec3[j].rosName;
                    //         //  log.debug('rosCode-------------', JSON.stringify(rosCode));
                    //    //    log.debug('rosName-------------', JSON.stringify(rosName));
                    //         if (_logValidation(rosName)) {
                    //             var rec = {
                    //                 "rosCode": rosCode,
                    //                 "rosName": rosName
                    //             }
                    //         }
                    //         finalrosarray.push(rec);
                    //     }
                    //  log.debug('finalrosarray-------------', JSON.stringify(finalrosarray));
                        if (_logValidation(getrosname)) {
                            var rec = {
                                "rocCode": rocCode,
                                "rocName": rocName,
                                "rosList": getrosname
                            }
                            region_json.push(rec);
                        }

                        // log.debug('json-------------', JSON.stringify(json));

                    }
                    log.debug('region_json-------------', JSON.stringify(region_json));
                    var status_code = '200'
                    var jsonBody = roc_code;
                    var json_response = {
                        "status": "Success",
                        "Message": "Record Fetch Successfully",
                        "Response": JSON.stringify(region_json)
                    };
                    var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody)
                    return {
                        "status": "Success",
                        "rocList": region_json,
                        "Message": "Record Fetch Successfully"
                    }
                } else {
                    var status_code = 'Failed'
                    var jsonBody = roc_code;
                    var json_response = {
                        "status": "Failed",
                        "Message": "No Record Available"
                    };
                    var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody)
                    return {
                        "status": "Failed",
                        "Message": "No Record Available "
                    }
                }
            }


            if (_logValidation(region_json)) {
                return {
                    "status": "Success",
                    "rocList": region_json,
                    "message": "record details fetched successfully"
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

            var errorLogId = create_logs(JSON.stringify(json_response), status_code, jsonBody)
            log.audit("in post method ", "errorLogId", errorLogId);
            return {
                "status": "Failed",
                "error": exp.message
            }
            //return exp
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

    function getrocdetails(roccode) {
        var rocList = [];

        var customrecord_skylo_region_of_servicesSearchObj = search.create({
            type: "customrecord_skylo_region_of_coverage",
            filters: [
                ["custrecord_skylo_roc_rec_code", "is", roccode]
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
        //  log.debug("customrecord_skylo_region_of_servicesSearchObj result count", searchResultCount);
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
            log.debug("roc_name first", JSON.stringify(roc_name));
            var roc_id = result.getValue({
                name: "internalid",
                label: "Internal ID"
            })
            //   log.debug("roc_id", JSON.stringify(roc_id));


            if (roc_name) {
                roc_name = roc_name.toString();
                roc_name = roc_name.split("-");
                if (roc_name.length > 1) {
                    roc_name = roc_name[1].trim();
                } else {
                    roc_name = roc_name;
                }

            }

            //     roc_name = roc_name.toString();
            //     roc_name = roc_name.split("-");
            //  log.debug("roc_name----", JSON.stringify(roc_name));
            //     if(roc_name > 1)
            //     {
            //         roc_name = roc_name[1].trim();
            //     }
            //     else
            //     {
            //         roc_name = roc_name;
            //     }


            log.debug("roc_name--->>>-", JSON.stringify(roc_name));
            var rosList = {
                'roc_id': roc_id,
                "rocCode": roc_code,
                "rocName": roc_name,
            }
            rocList.push(rosList);
            log.debug("arocList00000", JSON.stringify(rocList));



            return true;
        });

        return rocList;

    }



    function getrosdetails(rocid) {
        var rocList = [];
        var overrides = [];
        var arrObj = [];
        // var filterArr = [];
        // filterArr.push(["custrecord_skylo_regionof_service","is",roccode]);
        var customrecord_skylo_region_of_servicesSearchObj = search.create({
            type: "customrecord_skylo_region_of_services",
            filters: [
                //["custrecord_skylo_regionof_service.name", "is", roccode]
              //  ["custrecord_skylo_regionof_service.internalid", "anyof", rocid]
              ["custrecord_skylo_regionof_coverage","anyof",rocid]
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
                // search.createColumn({
                //     name: "custrecord_skylo_roc_rec_code",
                //     join: "CUSTRECORD_SKYLO_REGIONOF_COVERAGE",
                //     label: "ROC Code"
                // }),
                // search.createColumn({
                //     name: "name",
                //     join: "CUSTRECORD_SKYLO_REGIONOF_COVERAGE",
                //     label: "Name"
                // }),
                // search.createColumn({
                //     name: "custrecord_skylo_regionof_coverage",
                //     sort: search.Sort.ASC,
                //     label: "Skylo Region Of coverage"
                // })
            ]
        });
        var searchResultCount = customrecord_skylo_region_of_servicesSearchObj.runPaged().count;
       // log.debug("customrecord_skylo_region_of_servicesSearchObj result count", searchResultCount);
        customrecord_skylo_region_of_servicesSearchObj.run().each(function (result) {

            // var roc_code = result.getValue({
            //     name: "custrecord_skylo_roc_rec_code",
            //     join: "CUSTRECORD_SKYLO_REGIONOF_COVERAGE",
            //     label: "ROC Code"
            // })
            // //  log.debug("roc_code", JSON.stringify(roc_code));
            // var roc_name = result.getValue({
            //     name: "name",
            //     join: "CUSTRECORD_SKYLO_REGIONOF_COVERAGE",
            //     label: "Name"
            // })
            // //    log.debug("roc_name", JSON.stringify(roc_name));
            // var roc_id = result.getValue({
            //     name: "custrecord_skylo_regionof_coverage",
            //     sort: search.Sort.ASC,
            //     label: "Skylo Region Of coverage"
            // })
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
            ros_name = ros_name.toString();
            ros_name = ros_name.split("-");
            if (ros_name.length > 1) {
                ros_name = ros_name[1].trim();
            } else {
                ros_name = ros_name;
            }

            // log.debug("ros_name--->>>-", JSON.stringify(ros_name));
            //   ros_name = ros_name.trim();
            var rosList = {
                // "roc_id": roc_id,
                "rosCode": ros_code,
                "rosName": ros_name,
            }
            overrides.push(rosList);


            //   log.debug("overrides", overrides);


            return true;
        });

        return overrides;

    }

    // function getallrosdetails(roccode) {
    //     var rocList = [];
    //     var overrides = [];

    //     // var filterArr = [];
    //     // filterArr.push(["custrecord_skylo_regionof_service","is",roccode]);
    //     var customrecord_skylo_region_of_servicesSearchObj = search.create({
    //         type: "customrecord_skylo_region_of_services",
    //         filters: [
    //             ["custrecord_skylo_regionof_service.name", "is", roccode]
    //         ],
    //         columns: [
    //             search.createColumn({
    //                 name: "name",
    //                 label: "Name"
    //             }),
    //             search.createColumn({
    //                 name: "custrecord_skylo_ros_code_rec",
    //                 label: "ROS Code"
    //             }),
    //             search.createColumn({
    //                 name: "custrecord_skylo_roc_rec_code",
    //                 join: "CUSTRECORD_SKYLO_REGIONOF_COVERAGE",
    //                 label: "ROC Code"
    //             }),
    //             search.createColumn({
    //                 name: "name",
    //                 join: "CUSTRECORD_SKYLO_REGIONOF_COVERAGE",
    //                 label: "Name"
    //             }),
    //             search.createColumn({
    //                 name: "custrecord_skylo_regionof_coverage",
    //                 sort: search.Sort.ASC,
    //                 label: "Skylo Region Of coverage"
    //             })
    //         ]
    //     });
    //     var searchResultCount = customrecord_skylo_region_of_servicesSearchObj.runPaged().count;
    //     log.debug("customrecord_skylo_region_of_servicesSearchObj result count", searchResultCount);
    //     customrecord_skylo_region_of_servicesSearchObj.run().each(function (result) {
    //         var arrObj = [];
    //         var roc_code = result.getValue({
    //             name: "custrecord_skylo_roc_rec_code",
    //             join: "CUSTRECORD_SKYLO_REGIONOF_COVERAGE",
    //             label: "ROC Code"
    //         })
    //       //  log.debug("roc_code", JSON.stringify(roc_code));
    //         var roc_name = result.getValue({
    //             name: "name",
    //             join: "CUSTRECORD_SKYLO_REGIONOF_COVERAGE",
    //             label: "Name"
    //         })
    //     //    log.debug("roc_name", JSON.stringify(roc_name));
    //         var roc_id = result.getValue({
    //             name: "custrecord_skylo_regionof_coverage",
    //             sort: search.Sort.ASC,
    //             label: "Skylo Region Of coverage"
    //         })
    //         var ros_name = result.getValue({
    //             name: "name",
    //             //  sort: search.Sort.ASC,
    //             label: "Name"
    //         });
    //         var ros_code = result.getValue({
    //             name: "custrecord_skylo_ros_code_rec",
    //             label: "ROS Code"
    //         });

    //       //  log.debug("roc_id", JSON.stringify(roc_id));
    //         var rosList = {
    //             "rosCode": ros_code,
    //             "rosName": ros_name,
    //         }
    //         arrObj.push(rosList);
    //         log.debug("arrObj result count", JSON.stringify(arrObj));

    //         log.debug("overrides", overrides);

    //         // var index = overrides.findIndex(function (obj) {
    //         //     return obj.rocid === roc_id;
    //         // });

    //         // log.debug("index", index);
    //      log.debug("overrides.indexOf(roc_code)", overrides.indexOf(roc_code));


    //      if (overrides.indexOf(roc_code) == -1)
    //         {
    //             var obj1 = {};
    //             obj1.roc_code = roc_code;
    //             obj1.roc_id = roc_id;
    //             obj1.roc_name = roc_name;
    //             obj1.reclist = arrObj;
    //             overrides.push(obj1)
    //         } 
    //         else {
    //             log.debug("else", 'else');
    //             overrides[index].rosList.push(rosList);
    //         }
    //     //  log.debug("overrides", JSON.stringify(overrides));
    //         return true;
    //     });

    //     return overrides;

    // }






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


            //  log.debug("roc_name", JSON.stringify(roc_name));


            if (roc_name) {
                roc_name = roc_name.toString();
                roc_name = roc_name.split("-");
                if (roc_name.length > 1) {
                    roc_name = roc_name[1].trim();
                } else {
                    roc_name = roc_name;
                }

            }
            // for (i = 0; i < region_array.length; i++) {
            //     var reg = region_array[i];

            //     var include_hyphen = reg.includes('-');
            //     log.debug("reg-----", JSON.stringify(reg));
            //     log.debug("include_hyphen", JSON.stringify(include_hyphen));
            //     if (include_hyphen == true) {
            //         log.debug('reg', JSON.stringify(reg));
            //         reg = reg.split("-");
            //         log.debug('reg split', JSON.stringify(reg));
            //       //  reg = reg[0];
            //         log.debug('reg', JSON.stringify(reg));
            //         reg = reg.replace(/^\s+|\s+$/gm, '');
            //         finalreg = reg;

            //     }
            // }
            //  log.debug("roc_name----", roc_name);

            // var include_hyphen = roc_name.includes('-');
            // log.debug("include_hyphen",include_hyphen);
            // if(include_hyphen == true)
            // {
            //     roc_name = roc_name.split("-");
            //     log.debug("roc_name",roc_name);
            //     roc_name = roc_name[0];
            //     log.debug("roc_name -0",roc_name);
            //     roc_name = roc_name.replace(/^\s+|\s+$/gm,'');

            // }


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
            log.debug("ros_name----", JSON.stringify(ros_name));
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


            //     log.debug("overrides", overrides);


            return true;
        });

        return overrides;

    }


    function create_logs(json_response, status_code, jsonBody) {
        var restleturl = 'https://5434394-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=2343&deploy=1&roccode=';
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



    return {
        get: SetConnection
    };
});
