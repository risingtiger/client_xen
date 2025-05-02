

import { CatT, TagT } from "../../defs.js"
import { InputModeE, ModelT, StateT } from "./addtr_defs.js"


import { $NT } from "../../defs_client_symlink.js"
declare var $N: $NT;


export const ParseApple = async () => new Promise<void>(async (res, _rej) => {

	const clipboardText = await navigator.clipboard.readText();
	
	const body = {apple_data: clipboardText}
	const httpopts = {method: "POST", body: JSON.stringify(body)}

	const r = await $N.FetchLassie("/api/xen/finance/ai/parse_apple", httpopts ) as any
	if (r.ok && !r.ok) {   return;   }


	/*
date,merchant,amount
2025-05-02,Espresso Creek,5.15
2025-05-02,Amazon Web Services,1.11
2025-05-01,Bee's Marketplace,26.20
2025-05-01,Etsy,59.00
2025-05-01,Parallels,4.43
2025-05-01,Google,23.44
2025-05-01,Basic American Supply,14.11
	*/

	//amount,date (as UTC timestamp in seconds),merchant,notes (always ''),preset_area_id (always null),preset_cat_name (always null),source_id (always '7688adbc-13ef-469f-81d7-1e02098d2d06'),tags (always []),ynab_id (always null)


	res()
})








