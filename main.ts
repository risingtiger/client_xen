
import { INSTANCE_T } from "../defs_client.js";


const INSTANCE_NAME = "xen";


const INSTANCE: INSTANCE_T = {

	INFO: {

		name: INSTANCE_NAME,
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
	},




	LAZYLOADS: [

		// VIEWS

		{
			type: "view",
			urlmatch: "^home$",
			name: "home",
			is_instance: true,
			dependencies:[],
			auth: []
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
			auth: []
		},

		{
			type: "view",
			urlmatch: "^addtr$",
			name: "addtr",
			is_instance: true,
			dependencies:[
			],
			auth: ["admin"]
		},

		{
			type: "view",
			urlmatch: "^flashcards$",
			name: "flashcards",
			is_instance: true,
			dependencies:[
			],
			auth: []
		},



		// COMPONENTS

		{
			type: "component",
			urlmatch: null,
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

