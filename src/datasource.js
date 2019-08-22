import _ from "lodash";

export class GenericDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.withCredentials = instanceSettings.withCredentials;
    this.headers = {
      'Content-Type': 'application/json'
    };
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }
  //TODO: Change the type of the column dynamically and add support for _si.
  createColumns(data, columns) {
    if (columns.length > 0) {
      return;
    }
    let field_names = data['data']['fields'];
    _.map(field_names, function (field_name) {
      if (field_name['name'] != '_si') {
        columns.push({
          "text": field_name['name'],
          "type": "string"
        });
      }
    });
  }

  createRows(data, rows, columns) {
    if (rows.length > 0) {
      return;
    }
    let field_values = data['data']['results'];
    _.map(field_values, function (row) {
      let temp_row = [];
      columns.forEach(column => {
        temp_row.push(row[column['text']]);
      });
      rows.push(temp_row);
    });
  }

  doRequest(options) {
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;
    //console.log("Printing options before request");
    //console.log(options);
    return this.backendSrv.datasourceRequest(options);
  }




  query(options) {
    var query = this.buildQueryParameters(options);
    query.targets = query.targets.filter(t => !t.hide && typeof t.target !== "undefined");


    let instance_url = this.url;
    let instance_headers = this.headers;
    let instance_creds = this.withCredentials;
    let backendSrv = this.backendSrv;
    let createColumns = this.createColumns;
    let createRows = this.createRows;
    let q = this.q;
    let emptyResponse = q.when({
      data: []
    });
    //console.log(query);
    // return this.q.when({
    //   data: []
    // });
    let sample_response = [{
      "columns": [{
          "text": "_bkt",
          "type": "string"
        },
        {
          "text": "_cd",
          "type": "string"
        },
        {
          "text": "_indextime",
          "type": "string"
        }
      ],
      "rows": [
        ["_internal~37~A8020F36-8E84-49A0-96CF-7E56BA3C3F67",
          "37:359031",
          "1566442948"
        ],
        ["_internal~37~A8020F36-8E84-49A0-96CF-7E56BA3C3F67",
          "37:359023",
          "1566442948"
        ],
        ["_internal~37~A8020F36-8E84-49A0-96CF-7E56BA3C3F67",
          "37:359015",
          "1566442948"
        ]
      ],
      "type": "table"
    }];
    var sampleResponse = this.q.when({
      data: sample_response
    });


    if (query.targets.length <= 0) {
      return emptyResponse;
    }
    //return sampleResponse;

    let targetQuery = encodeURI(query.targets[0]['target']);

    var get_sid_options = {
      url: instance_url + '/services/search/jobs?output_mode=json',
      method: 'POST',
      data: 'search=' + targetQuery,
      headers: instance_headers,
      withCredentials: instance_creds
    };
    let isDone = false,
      isFailed = false,
      isZombie = false;
    let foundData = false;
    let retryCount = 0;
    let columns = [];
    let rows = [];
    let tableResponse = [];

    return backendSrv.datasourceRequest(get_sid_options).then(function (data) {
      let sid = data['data']['sid'];
      console.log("SID: ", sid);
      console.log("returning sample response");
      let get_results_status_options = {
        url: instance_url + '/services/search/jobs/' + sid + '?output_mode=json',
        method: 'GET',
        headers: instance_headers,
        withCredentials: instance_creds
      }
      let get_results_options = {
        url: instance_url + '/services/search/jobs/' + sid + '/results?output_mode=json',
        method: 'GET',
        headers: instance_headers,
        withCredentials: instance_creds
      }
      let isDone = false,
        isFailed = false,
        isZombie = false;
      let foundData = false;
      let retryCount = 0;
      let columns = [];
      let rows = [];
      let tableResponse = [];


      while (isDone != true && isFailed != true && isZombie != true && retryCount < 100 && foundData != true) {
        backendSrv.datasourceRequest(get_results_status_options).then(function (data) {
          isDone = data['data']['entry'][0]['content']['isDone'];
          isFailed = data['data']['entry'][0]['content']['isFailed'];
          isZombie = data['data']['entry'][0]['content']['isZombie'];
          if (isDone === true && foundData !== true) {
            foundData = true;
            console.log("Found data but returning sample response");
            return sampleResponse;
            // return backendSrv.datasourceRequest(get_results_options).then(function (data) {
            //   foundData = true;
            //   if (columns.length == 0 && rows.length == 0) {
            //     createColumns(data, columns);
            //     createRows(data, rows, columns);
            //     let rowColsTypeCombined = {
            //       "columns": columns,
            //       "rows": rows,
            //       "type": "table"
            //     }
            //     tableResponse.push(rowColsTypeCombined);
            //     console.log(tableResponse);
            //     return q.when(tableResponse);
            //   }
            // })
          }
        })
        else {
          return q.
        }
        retryCount++;
      }
    });
  }







  // backendSrv.datasourceRequest(get_sid_options).then(function (data) {
  //   let sid = data['data']['sid'];
  //   console.log("SID: ", sid);
  //   let get_results_status_options = {
  //     url: instance_url + '/services/search/jobs/' + sid + '?output_mode=json',
  //     method: 'GET',
  //     headers: instance_headers,
  //     withCredentials: instance_creds
  //   }
  //   let get_results_options = {
  //     url: instance_url + '/services/search/jobs/' + sid + '/results?output_mode=json',
  //     method: 'GET',
  //     headers: instance_headers,
  //     withCredentials: instance_creds
  //   }
  //   while (isDone != true && isFailed != true && isZombie != true && retryCount < 100 && foundData != true) {
  //     console.log("Retry Count: ", retryCount);
  //     return backendSrv.datasourceRequest(get_results_status_options).then(function (data) {
  //       isDone = data['data']['entry'][0]['content']['isDone'];
  //       isFailed = data['data']['entry'][0]['content']['isFailed'];
  //       isZombie = data['data']['entry'][0]['content']['isZombie'];
  //       console.log("isDone status: ", isDone);
  //       console.log("isFailed status: ", isFailed);
  //       console.log("isZombie status: ", isZombie);
  //     }).then(function (data) {
  //       console.log(data);
  //       console.log("isDone Final status: ", isDone);
  //       console.log("isFailed Final status: ", isFailed);
  //       console.log("isZombie Final status: ", isZombie);
  //       console.log("foundData Final status: ", foundData);
  //       if (isDone === true && foundData !== true) {
  //         foundData = true;
  //         console.log("returning sampleResponse")
  //         return sampleResponse;
  //       } else if (isFailed === true && isZombie === true) {
  //         console.log("Failed or Zombied");
  //         return emptyResponse;
  //       }
  //       if (isDone === true) {
  //         console.log("already found data.")
  //         return sampleResponse;
  //       }
  //       return emptyResponse;
  //     }).catch(function (error) {
  //       console.log("error LOL");
  //     });
  //     retryCount++;
  //   }
  // })


  // return emptyResponse;


  // backendSrv.datasourceRequest(get_sid_options).then(function (data) {
  //     let sid = data['data']['sid'];
  //     console.log(sid);
  //     let get_results_status_options = {
  //       url: instance_url + '/services/search/jobs/' + sid + '?output_mode=json',
  //       method: 'GET',
  //       headers: instance_headers,
  //       withCredentials: instance_creds
  //     }
  //     let get_results_options = {
  //       url: instance_url + '/services/search/jobs/' + sid + '/results?output_mode=json',
  //       method: 'GET',
  //       headers: instance_headers,
  //       withCredentials: instance_creds
  //     }

  //     while (isDone != true && isFailed != true && isZombie != true && retryCount < 100 && foundData != true) {
  //       backendSrv.datasourceRequest(get_results_status_options).then(function (data) {
  //         isDone = data['data']['entry'][0]['content']['isDone'];
  //         isFailed = data['data']['entry'][0]['content']['isFailed'];
  //         isZombie = data['data']['entry'][0]['content']['isZombie'];
  //       }).then(function (data) {
  //         if (isDone === true && foundData === false) {
  //           //return sampleResponse;
  //           let results = backendSrv.datasourceRequest(get_results_options);
  //           results.then(function (data) {
  //             foundData = true;
  //             if (columns.length == 0 && rows.length == 0) {
  //               createColumns(data, columns);
  //               createRows(data, rows, columns);
  //               let rowColsTypeCombined = {
  //                 "columns": columns,
  //                 "rows": rows,
  //                 "type": "table"
  //               }
  //               tableResponse.push(rowColsTypeCombined);
  //               console.log(tableResponse);
  //             }
  //             return q.when({
  //               data: tableResponse
  //             });
  //           });
  //           //return results;
  //         } else if (isFailed === true || isZombie === true) {
  //           console.log("Failed or Zombied!");
  //           //return emptyResponse;
  //         }
  //       }, function (error) {
  //         console.log("Error fetching data");
  //         //return emptyResponse;
  //       });
  //       retryCount++;
  //     }
  //   },
  //   function (error) {
  //     console.log("Facing errors!");
  //     return emptyResponse;
  //   });
  //return emptyResponse;
































  // return backendSrv.datasourceRequest(get_sid_options).then(function (data) {
  //     let sid = data['data']['sid'];
  //     console.log(sid);
  //     let get_results_status_options = {
  //       url: instance_url + '/services/search/jobs/' + sid + '?output_mode=json',
  //       method: 'GET',
  //       headers: instance_headers,
  //       withCredentials: instance_creds
  //     }
  //     let get_results_options = {
  //       url: instance_url + '/services/search/jobs/' + sid + '/results?output_mode=json',
  //       method: 'GET',
  //       headers: instance_headers,
  //       withCredentials: instance_creds
  //     }
  //     let isDone = false,
  //       isFailed = false,
  //       isZombie = false;
  //     let foundData = false;
  //     let retryCount = 0;
  //     let columns = [];
  //     let rows = [];
  //     let tableResponse = [];
  //     return new Promise(function (resolve, reject) {
  //       (function waitForisDone() {
  //         backendSrv.datasourceRequest(get_results_status_options).then(function (data) {
  //           isDone = data['data']['entry'][0]['content']['isDone'];
  //           isFailed = data['data']['entry'][0]['content']['isFailed'];
  //           isZombie = data['data']['entry'][0]['content']['isZombie'];
  //         })
  //         if (isDone != true && isFailed != true && isZombie != true && retryCount < 100 && foundData != true) {
  //           setTimeout(waitForisDone, 30);
  //         } else {
  //           if (isDone === true && foundData === false) {
  //             backendSrv.datasourceRequest(get_results_options).then(function (data) {
  //               foundData = true;
  //               if (columns.length == 0 && rows.length == 0) {
  //                 createColumns(data, columns);
  //                 createRows(data, rows, columns);
  //                 let rowColsTypeCombined = {
  //                   "columns": columns,
  //                   "rows": rows,
  //                   "type": "table"
  //                 }
  //                 tableResponse.push(rowColsTypeCombined);
  //                 console.log(tableResponse);
  //               }
  //               return q.when({
  //                 data: tableResponse
  //               });
  //             })
  //           }
  //         }
  //       })();
  //     });
  //     while (isDone != true && isFailed != true && isZombie != true && retryCount < 100 && foundData != true) {
  //       backendSrv.datasourceRequest(get_results_status_options).then(function (data) {
  //           isDone = data['data']['entry'][0]['content']['isDone'];
  //           isFailed = data['data']['entry'][0]['content']['isFailed'];
  //           isZombie = data['data']['entry'][0]['content']['isZombie'];
  //         },
  //         function (error) {
  //           console.log("Error fetching data!");
  //           //return emptyResponse;
  //         }).then(function (data) {
  //         if (isDone === true && foundData === false) {
  //           //return sampleResponse;
  //           let results = backendSrv.datasourceRequest(get_results_options);
  //           return results.then(function (data) {
  //             foundData = true;
  //             if (columns.length == 0 && rows.length == 0) {
  //               createColumns(data, columns);
  //               createRows(data, rows, columns);
  //               let rowColsTypeCombined = {
  //                 "columns": columns,
  //                 "rows": rows,
  //                 "type": "table"
  //               }
  //               tableResponse.push(rowColsTypeCombined);
  //               console.log(tableResponse);
  //             }
  //             return q.when({
  //               data: tableResponse
  //             });
  //           }, function (error) {
  //             console.log("Error while fetching data");
  //             //return emptyResponse;
  //           });
  //           //return results;
  //         } else if (isFailed === true || isZombie === true) {
  //           console.log("Failed or Zombied!");
  //           //return emptyResponse;
  //         }
  //       }, function (error) {
  //         console.log("Error fetching data");
  //         //return emptyResponse;
  //       });
  //       retryCount++;
  //     }
  //   },
  //   function (error) {
  //     console.log("Facing errors!");
  //     return emptyResponse;
  //   });
  // //return emptyResponse;

  testDatasource() {
    return this.doRequest({
      url: this.url + '/servicesNS/admin',
      method: 'GET',
    }).then(response => {
      if (response.status === 200) {
        console.log(response);
        return {
          status: "success",
          message: "Data source is working",
          title: "Success"
        };
      }
    });
  }
  /* 
   testDatasource() {
    return this.doRequest({
      url: this.url + '/servicesNS/admin/search/saved/searches/?output_mode=json',
      method: 'GET',
    }).then(response => {
      if (response.status === 200) {
        console.log(response);
        return {
          status: "success",
          message: "Data source is working",
          title: "Success"
        };
      }
    });
  }
  */

  annotationQuery(options) {
    var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
    var annotationQuery = {
      range: options.range,
      annotation: {
        name: options.annotation.name,
        datasource: options.annotation.datasource,
        enable: options.annotation.enable,
        iconColor: options.annotation.iconColor,
        query: query
      },
      rangeRaw: options.rangeRaw
    };

    return this.doRequest({
      url: this.url + '/annotations',
      method: 'POST',
      data: annotationQuery
    }).then(result => {
      return result.data;
    });
  }

  metricFindQuery(query) {
    var interpolated = {
      target: this.templateSrv.replace(query, null, 'regex')
    };

    console.log("Printing interpolated!");
    console.log(interpolated);

    return this.doRequest({
      url: this.url + '/search',
      data: interpolated,
      method: 'POST',
    }).then(this.mapToTextValue);
  }

  mapToTextValue(result) {
    return _.map(result.data, (d, i) => {
      if (d && d.text && d.value) {
        return {
          text: d.text,
          value: d.value
        };
      } else if (_.isObject(d)) {
        return {
          text: d,
          value: i
        };
      }
      return {
        text: d,
        value: d
      };
    });
  }



  /*
    buildQueryParameters(options) {
    //remove placeholder targets
    console.log("printing OPTIONS");
    console.log(options);
    options.targets = _.filter(options.targets, target => {
      return target.target !== 'select metric';
    });

    var targets = _.map(options.targets, target => {
      return {
        target: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
        refId: target.refId,
        hide: target.hide,
        type: target.type || 'timeserie'
      };
    });

    options.targets = targets;

    return options;
  }
  */

  buildQueryParameters(options) {
    //remove placeholder targets
    options.targets = _.filter(options.targets, target => {
      return target.target !== 'select metric';
    });

    var targets = _.map(options.targets, target => {
      return {
        target: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
        refId: target.refId,
        hide: target.hide,
        type: target.type || 'timeserie'
      };
    });

    options.targets = targets;

    return options;
  }

  getTagKeys(options) {
    return new Promise((resolve, reject) => {
      this.doRequest({
        url: this.url + '/tag-keys',
        method: 'POST',
        data: options
      }).then(result => {
        return resolve(result.data);
      });
    });
  }

  getTagValues(options) {
    return new Promise((resolve, reject) => {
      this.doRequest({
        url: this.url + '/tag-values',
        method: 'POST',
        data: options
      }).then(result => {
        return resolve(result.data);
      });
    });
  }

}
