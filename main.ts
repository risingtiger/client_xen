
import { str, GenericRowT } from "./defs_server_symlink.js";
import { INSTANCE_T } from "./defs_client_symlink.js"

import { $NT, LazyLoadFuncReturnT } from "./defs_client_symlink.js";


declare var $N: $NT;




const INSTANCE_LAZYLOAD_DATA_FUNCS = {

	home_main: (_pathparams:GenericRowT, _searchparams: GenericRowT, _localdb_preload:str[]|null, _fetchlassieopts:GenericRowT) => new Promise<LazyLoadFuncReturnT>(async (res, _rej) => {
		const d = new Map<str,GenericRowT[]>()
		res({ d, refreshspecs:[]})
	}),




	finance_main: (_pathparams:GenericRowT, _searchparams: GenericRowT, localdb_preload:str[]|null, _fetchlassieopts:GenericRowT) => new Promise<LazyLoadFuncReturnT>(async (res, rej) => {

		let   r:any;
		const d                        = new Map<str,GenericRowT[]>()
		const promises:Promise<any>[] = []

		const ri:any = $N.IDB.GetAll(["areas","cats","sources","tags", "payments", "transactions", "monthsnapshots"], localdb_preload); 
		promises.push(ri)
		try   { r = await Promise.all(promises); }
		catch { rej(); return; }

		d.set( "1:areas", r[0].get("areas")! )
		d.set( "1:cats", r[0].get("cats")! )
		d.set( "1:sources", r[0].get("sources")! )
		d.set( "1:tags", r[0].get("tags")! )
		d.set( "1:payments", r[0].get("payments")! )
		d.set( "1:transactions", r[0].get("transactions")! )
		d.set( "1:monthsnapshots", r[0].get("monthsnapshots")! )

		res({ d, refreshspecs:[]})
	}),




	addtr_main: (_pathparams:GenericRowT, _searchparams: GenericRowT, _localdb_preload:str[]|null, fetchlassieopts:GenericRowT) => new Promise<LazyLoadFuncReturnT>(async (res, rej) => {

		const d = new Map<str,GenericRowT[]>()
		const promises:Promise<any>[] = []

		const paths = ["areas", "cats", "sources", "tags"]
		const httpopts = { method: "POST", body: JSON.stringify({ paths }) }
		const rp:any = $N.FetchLassie('/api/firestore_retrieve', httpopts, fetchlassieopts) 
		const rt:any = $N.FetchLassie('/api/xen/finance/sheets/get_transactions', {}) 
		promises.push(rp, rt)
		const r = await Promise.all(promises)
		if (!r[0].ok || !r[1].ok) {   rej(); return;   }

		d.set( "2:areas", r[0].data[0])
		d.set( "2:cats", r[0].data[1])
		d.set( "2:sources", r[0].data[2])
		d.set( "2:tags", r[0].data[3])
		d.set( "2:sheet_transactions", r[1].data)

		res({ d, refreshspecs:[]})
	}),
}
