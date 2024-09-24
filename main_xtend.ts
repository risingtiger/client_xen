
import { IndexedDBStoreMetaT } from "../definitions.js";


import { LazyLoadT } from "../definitions.js";


const INFO:{name:str, firebase:any, indexeddb_stores:IndexedDBStoreMetaT[]} = {

    name: "xen",
    firebase: {
        project: 'xenition',
        identity_platform_key: 'AIzaSyDfXcwqyiRGGO6pMBsG8CvNEtDIhdspKRI',
        dbversion: 1
    },

    indexeddb_stores: [
		{ name: "areas", url:"areas"},
		{ name: "cats", url:"cats"},
		{ name: "sources", url:"sources"},
		{ name: "tags", url:"tags"},
		{ name: "payments", url:"payments"},
		{ name: "transactions", url:"transactions"},
		{ name: "monthsnapshots", url:"monthsnapshots"},
	]
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
            {type:"component", name: "reveal"},
            {type:"component", name: "form"},
            {type:"component", name: "in"},
            {type:"component", name: "btn"},
            {type:"component", name: "toast"},
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
        auth: ["admin"]
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
