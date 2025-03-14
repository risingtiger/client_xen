
import { bool, num, str } from "./defs_server_symlink.js"
import { INSTANCE_T } from "./defs_client_symlink.js"



const INSTANCE_NAME = "xen";


const INSTANCE:INSTANCE_T = {

	INFO: {

		name: INSTANCE_NAME,
		firebase: {
			project: 'xenition',
			identity_platform_key: 'AIzaSyDfXcwqyiRGGO6pMBsG8CvNEtDIhdspKRI',
			dbversion: 1
		},

		datasync_collections: [ 
			{name: "areas"}, 
			{name: "cats"}, 
			{name: "sources"}, 
			{name: "tags"}, 
			{name: "payments"}, 
			{name: "transactions"}, 
			{name: "monthsnapshots"} 
		],
	},




	LAZYLOADS: [

		// VIEWS

		{
			type: "view",
			urlmatch: "home",
			name: "home",
			is_instance: true,
			dependencies:[],
			auth: [],
			loadspecs: [ 
				//{ name:'raw_areas', path: "areas" },
				{ name:'raw_cats', path: "transactions" },
			]
		},

		{
			type: "view",
			urlmatch: "^finance$",
			name: "finance",
			is_instance: true,
			dependencies:[
				{type:"component", name: "ol"},
				{type:"component", name: "reveal"},
				{type:"component", name: "form"},
				{type:"component", name: "in"},
				{type:"component", name: "btn"},
				{type:"component", name: "toast"},
			],
			auth: [],
			loadspecs: [ 
				{ name:'areas', path: "areas" },
				{ name:'cats', path: "cats" },
				{ name:'sources', path: "sources" },
				{ name:'tags', path: "tags" },
				{ name:'payments', path: "payments" },
				{ name:'transactions', path: "transactions" },
				{ name:'monthsnapshots', path: "monthsnapshots" },
			]
		},

		{
			type: "view",
			urlmatch: "^addtr$",
			name: "addtr",
			is_instance: true,
			dependencies:[
				{type:"component", name: "btn"},
			],
			auth: ["admin"],
			loadspecs: [ 
				{ name:'raw_areas', path: "areas" },
				{ name:'raw_cats', path: "cats" },
				{ name:'raw_sources', path: "sources" },
				{ name:'tags', path: "tags" },
				{ name:'quick_notes', path: "quick_notes" }
			]
		},


		// COMPONENTS

		{
			type: "component",
			name: "placeholder_component",
			is_instance: true,
			dependencies:[],
			auth: []
		},



		// THIRDPARTY


		// LIBS
	]
}




export default INSTANCE;

