
import { str, GenericRowT } from "./defs_server_symlink.js";
import { INSTANCE_T } from "./defs_client_symlink.js"

import { $NT, LazyLoadFuncReturnT } from "./defs_client_symlink.js";


declare var $N: $NT;




const INSTANCE_LAZYLOAD_DATA_FUNCS = {

	home_main: (_pathparams:GenericRowT, _searchparams: URLSearchParams, _localdb_preload?:str[]) => new Promise<LazyLoadFuncReturnT>(async (res, _rej) => {
		const d = new Map<str,GenericRowT[]>()
		res({ d, refreshspecs:[]})
	}),




	finance_main: (_pathparams:GenericRowT, _searchparams: URLSearchParams, localdb_preload?:str[]) => new Promise<LazyLoadFuncReturnT>(async (res, rej) => {

		const d                        = new Map<str,GenericRowT[]>()
		let   r:any;

		try   { r = await $N.IDB.GetAll(["areas","cats","sources","tags", "payments", "transactions", "monthsnapshots"], localdb_preload); }
		catch { rej(); return; }

		d.set( "1:areas", r.get("areas")! )
		d.set( "1:cats", r.get("cats")! )
		d.set( "1:sources", r.get("sources")! )
		d.set( "1:tags", r.get("tags")! )
		d.set( "1:payments", r.get("payments")! )
		d.set( "1:transactions", r.get("transactions")! )
		d.set( "1:monthsnapshots", r.get("monthsnapshots")! )

		res({ d, refreshspecs:[]})
	}),




	addtr_main: (_pathparams:GenericRowT, _searchparams: URLSearchParams, localdb_preload?:str[]) => new Promise<LazyLoadFuncReturnT>(async (res, rej) => {

		let   m:any;
		const d = new Map<str,GenericRowT[]>()

		try   { m = await $N.IDB.GetAll(["areas","cats","sources","tags"], localdb_preload); } 
		catch { rej(); return; }

		d.set( "1:areas", m.get("areas")! )
		d.set( "1:cats", m.get("cats")! )
		d.set( "1:sources", m.get("sources")! )
		d.set( "1:tags", m.get("tags")! )

		res({ d, refreshspecs:[]})
	}),
}
