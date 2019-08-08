import _ from "lodash";

export class SplunkDataSource {
    //Base Constructor
    constructor(instanceSettings, $q, backendServer, templateServer) {
        this.type = instanceSettings.type;
        this.url = instanceSettings.url;
        this.name = instanceSettings.name;
        this.q = $q;
        this.backendServer = backendServer;
        this.templateServer = templateServer;
        this.withCredentials = instanceSettings.withCredentials;
        this.headers = {
            'Content-Type': 'application/json'
        };

        if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
            this.headers['Authorization'] = instanceSettings.basicAuth;
        }
    }

    /* 
        To interact with the rest of Grafana, the plugins module file can export 5 different components.
        - Datasource (required)
        - QueryCtrl (required)
        - ConfigCtrl (required)
        - AnnotationsQueryCtrl

        Datasource should contain the following functions:
        - query(options)
        - testDatasource()
        - annotationQuery(options)
        - metricFindQuery(options)
    */

    buildQueryParams(options) {
        //Removing placeholder targets
        options.targets = _.filter(options.targets, target => {
            return target.target !== 'select metric';
        });

        var targets = _.map(options.targets, target => {
            return {
                target: this.templateServer.replace(target.target, options.scopedVars, 'regex'),
                refId: target.refId,
                hide: target.hide,
                type: target.type || 'timeserie'
            };
        });

        options.targets = targets;
        return options;
    }


    query(options) {

    }

    testDatasource() {

    }

    annotationQuery(options) {

    }

    metricFindQuery(options) {

    }

}