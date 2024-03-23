

import { LazyLoadT } from "../definitions.js";


const INFO = {

    name: "xen",
    firebase: {
        project: 'xenition',
        identity_platform_key: 'AIzaSyDfXcwqyiRGGO6pMBsG8CvNEtDIhdspKRI'
    },

    indexeddb_collections: ["transactions"]
};




const LAZYLOADS:Array<LazyLoadT> = [


    // VIEWS

    {
        type: "view",
        urlmatch: "^home$",
        name: "home",
        instance: INFO.name,
        dependencies:[],
        auth: []
    },

    {
        type: "view",
        urlmatch: "^finance$",
        name: "finance",
        instance: INFO.name,
        dependencies:[
            {type:"component", name: "ol"},
        ],
        auth: []
    },

    {
        type: "view",
        urlmatch: "^addtr$",
        name: "addtr",
        instance: INFO.name,
        dependencies:[
        ],
        auth: []
    },

    {
        type: "view",
        urlmatch: "^flashcards$",
        name: "flashcards",
        instance: INFO.name,
        dependencies:[
        ],
        auth: []
    },



    // COMPONENTS

    {
        type: "component",
        urlmatch: null,
        name: "placeholder_component",
        instance: INFO.name,
        dependencies:[],
        auth: []
    },



    // THIRDPARTY


    // LIBS
];




const INSTANCE = { INFO, LAZYLOADS };

export default INSTANCE;
