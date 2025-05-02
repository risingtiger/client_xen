
import { bool, num, str } from "./defs_server_symlink.js"
import { INSTANCE_T } from "./defs_client_symlink.js"



const INSTANCE_NAME = "xen";


const INSTANCE:INSTANCE_T = {

	INFO: {

		name: INSTANCE_NAME,
		firebase: {
			project: 'xenition',
			identity_platform_key: 'AIzaSyDfXcwqyiRGGO6pMBsG8CvNEtDIhdspKRI',
			dbversion: 9
		},
		localdb_objectstores: [ 
			{name: "areas"}, 
			{name: "cats"}, 
			{name: "sources"}, 
			{name: "tags"}, 
			{name: "payments"}, 
			{name: "transactions", indexes: ["cat", "source"]}, 
			{name: "quick_notes"}, 
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
			dependencies:[
				{type:"component", name: "btn"},
			],
			auth: [],
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
			localdb_preload: ['areas', 'cats', 'sources', 'tags', 'payments', 'transactions', 'monthsnapshots']
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
			localdb_preload: ['areas', 'cats', 'sources', 'tags','quick_notes']
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

