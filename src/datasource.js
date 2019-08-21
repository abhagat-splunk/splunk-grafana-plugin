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

  doRequest(options) {
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;
    //console.log("Printing options before request");
    //console.log(options);
    return this.backendSrv.datasourceRequest(options);
  }

  query(options) {
    var query = this.buildQueryParameters(options);
    query.targets = query.targets.filter(t => !t.hide);

    if (query.targets.length <= 0) {
      return this.q.when({
        data: []
      });
    }

    // if (this.templateSrv.getAdhocFilters) {
    //   query.adhocFilters = this.templateSrv.getAdhocFilters(this.name);
    // } else {
    //   query.adhocFilters = [];
    // }
    // console.log(query.targets.length);
    console.log("Printing OPTIONS");
    console.log(options);
    let instance_url = this.url;
    let instance_headers = this.headers;
    let instance_creds = this.withCredentials;
    let backendSrv = this.backendSrv;
    var get_sid_options = {
      url: instance_url + '/services/search/jobs?output_mode=json',
      method: 'POST',
      data: 'search=search%20index=_internal%20%7C%20head%203',
      headers: instance_headers,
      withCredentials: instance_creds
    };

    console.log("printing tryout");
    backendSrv.datasourceRequest(get_sid_options).then(function (data) {
        console.log("Successful working - got the SID!");
        let sid = data['data']['sid'];
        console.log(sid);
        let get_results_status_options = {
          url: instance_url + '/services/search/jobs/' + sid + '?output_mode=json',
          method: 'GET',
          headers: instance_headers,
          withCredentials: instance_creds
        }
        let get_results_options = {
          url: instance_url + '/services/search/jobs/' + sid + '/results?output_mode=json_cols',
          method: 'GET',
          headers: instance_headers,
          withCredentials: instance_creds
        }
        let isDone = false,
          isFailed = false,
          isZombie = false;
        let retryCount = 0;
        while (isDone != true) {
          console.log("Going inside noobs!");
          setTimeout(backendSrv.datasourceRequest(get_results_status_options).then(function (data) {
              isDone = data['data']['entry'][0]['content']['isDone'];
              isFailed = data['data']['entry'][0]['content']['isFailed'];
              isZombie = data['data']['entry'][0]['content']['isZombie'];
              console.log("isDone Status" + isDone);
              console.log("isFailed Status" + isFailed);
              console.log("isZombie Status" + isZombie);
              if (isDone === true) {
                console.log("SID is done. Now fetch the data.");
                backendSrv.datasourceRequest(get_results_options).then(function (data) {
                    console.log("Found the data!");
                    console.log(data);
                    return;
                  }),
                  function (error) {
                    console.log("Error fetching the data!");
                    return;
                  }
              }
              if (isFailed === true || isZombie === true) {
                console.log("Failed or Zombied!");
              }
            },
            function (error) {
              console.log("Error fetching data!");
            }), 100000);
          retryCount++;
        }


        // backendSrv.datasourceRequest(get_results_options).then(function (data) {
        //   console.log("Found data!");
        //   console.log(data);
        // }, function (error) {
        //   console.log("Error fetching data.");
        // })
      },
      function (error) {
        console.log("Facing errors!");
      })

    // console.log(logging_tryout);


    return this.doRequest({
      url: this.url + '/query',
      data: query,
      method: 'POST'
    });
  }
  /*
    query(options) {
    var query = this.buildQueryParameters(options);
    query.targets = query.targets.filter(t => !t.hide);

    if (query.targets.length <= 0) {
      return this.q.when({
        data: []
      });
    }

    if (this.templateSrv.getAdhocFilters) {
      query.adhocFilters = this.templateSrv.getAdhocFilters(this.name);
    } else {
      query.adhocFilters = [];
    }
    console.log(query.targets.length);
    console.log("Printing QUERY");
    console.log(query);
    return this.doRequest({
      url: this.url + '/query',
      data: query,
      method: 'POST'
    }); 

  */

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
