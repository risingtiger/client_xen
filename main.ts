
import { str, GenericRowT } from "./defs_server_symlink.js";
import { INSTANCE_T } from "./defs_client_symlink.js"

import { $NT } from "./defs_client_symlink.js";


declare var $N: $NT;




const INSTANCE_LAZYLOAD_DATA_FUNCS = {

	home_indexeddb: (_pathparams:GenericRowT, _searchparams: URLSearchParams) => new Promise<null|Map<str,GenericRowT[]>>(async (res, _rej) => {
		const a = new Map<str,GenericRowT[]>()
		res(a)	
	}),

	home_other: (_pathparams:GenericRowT, _old_searchparams: URLSearchParams, _new_searchparams: URLSearchParams) => new Promise<Map<str,GenericRowT[]>|null>(async (res, _rej) => {
		const a = new Map<str,GenericRowT[]>()
		res(a)
	}),




	finance_indexeddb: (_pathparams:GenericRowT, _searchparams: URLSearchParams) => new Promise<null|Map<str,GenericRowT[]>>(async (res, rej) => {

		const d = new Map<str,GenericRowT[]>()

		try   { 
			let m   = await $N.IDB.GetAll(["areas","cats","sources","tags", "payments", "transactions", "monthsnapshots"])
			d.set( "1:areas", m.get("areas")! )
			d.set( "1:cats", m.get("cats")! )
			d.set( "1:sources", m.get("sources")! )
			d.set( "1:tags", m.get("tags")! )
			d.set( "1:payments", m.get("payments")! )
			d.set( "1:transactions", m.get("transactions")! )
			d.set( "1:monthsnapshots", m.get("monthsnapshots")! )
		}
		catch { rej(); }

		res(d)

	}),

	finance_other: (_pathparams:GenericRowT, _old_searchparams: URLSearchParams, _new_searchparams: URLSearchParams) => new Promise<Map<str,GenericRowT[]>|null>(async (res, _rej) => {
		const a = new Map<str,GenericRowT[]>()
		res(a)
	}),




	addtr_indexeddb: (_pathparams:GenericRowT, _searchparams: URLSearchParams) => new Promise<null|Map<str,GenericRowT[]>>(async (res, rej) => {

		const d = new Map<str,GenericRowT[]>()

		try   { 
			let m   = await $N.IDB.GetAll(["areas","cats","sources","tags"])
			d.set( "1:areas", m.get("areas")! )
			d.set( "1:cats", m.get("cats")! )
			d.set( "1:sources", m.get("sources")! )
			d.set( "1:tags", m.get("tags")! )
		}
		catch { rej(); }

		res(d)
	}),

	addtr_other: (_pathparams:GenericRowT, _old_searchparams: URLSearchParams, _new_searchparams: URLSearchParams) => new Promise<Map<str,GenericRowT[]>|null>(async (res, _rej) => {
		const a = new Map<str,GenericRowT[]>()
		res(a)
		//TODO: I could be trying to get object stores that dont exist. A scenario is that a previous view could, by chance, have preloaded the object stores so in testing its all hunky dory and then shit itself in production. indexeddb_graball needs to be passed this views localdb_preload to check and make sure I don't shoot myself
	})
}
