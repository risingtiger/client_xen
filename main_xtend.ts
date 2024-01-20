

(window as any).__APPINSTANCE = {

    firebase: {
        project: 'purewatertech',
        identity_platform_key: 'AIzaSyCdBd4FDBCZbL03_M4k2mLPaIdkUo32giI'
    },

    indexeddb_collections: ["machines", "users"]

};




(window as any).__APPINSTANCE_VIEWS = [

    { path: "^index$", name: "index", dependencies:[], auth: [] },

    { path: "^machine\/([0-9A-Za-z_]+)$", name: "machine", 
        dependencies:[
            {what:"components", name: "machine_statuses"}, 
            {what:"components", name: "overlay"},
            {what:"components", name: "templateload"}
        ], 
        auth: ["admin", "store_manager", "scanner"] 
    },
    { path: "^machines$", name: "machines", 
        dependencies: [], 
        auth: ["admin", "store_manager", "scanner"] 
    },
    { path: "^machinetelemetry\/([0-9A-Za-z_]+)$", name: "machinetelemetry", 
        dependencies:[
            {what:"components", name: "graphing"}, 
            {what: "components", name: "overlay"},
            {what:"components", name: "templateload"}
        ], 
        auth: ["admin", "store_manager", "scanner"] 
    },
    { path: "^mcards$", name: "mcards", 
        dependencies:[
        ], 
        auth: [] 
    },
];




(window as any).__APPINSTANCE_COMPONENTS = [

    { name: "machine_statuses", dependencies:[] },
    { name: "machine_details", dependencies:[] },
    { name: "machine_edit", dependencies:[] },
    { name: "machine_map", dependencies:[] },

];




(window as any).__APPINSTANCE_THIRDPARTY = [


];




(window as any).__APPINSTANCE_LIBS = [


];




