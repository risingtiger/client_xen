

import { NewTransactionT } from "./addtr_defs.js"
import { SourceT } from '../../defs.js'
import { $NT } from "../../defs_client_symlink.js"
declare var $N: $NT;


export const ParseApple = async (sources:SourceT[]) => new Promise<NewTransactionT[]>(async (res, rej) => {

	const clipboardText = await navigator.clipboard.readText();
	
	if (!clipboardText.includes('Done') || !clipboardText.includes('123')) { 
		rej('Clipboard text must contain both "Done" and "123"'); 
		return; 
	}

	const now = new Date();
	const relative_date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
	const timezone_offset = -(now.getTimezoneOffset() / 60);
	
	const splitText = clipboardText.split("123");
	const apple_data_str = splitText[1];
	
	const body = {apple_data: apple_data_str, relative_date, timezone_offset}
	const httpopts = {method: "POST", body: JSON.stringify(body)}

	const transactions:NewTransactionT[] = []
	const r = await $N.FetchLassie("/api/xen/finance/ai/parse_apple", httpopts )
	if (!r.ok || ( r.data as any ).length === 0) {
		console.error("Error fetching data:");
		rej();
		return;
	}


	for (let i = 0; i < (r.data as any[]).length; i++) { 
		const nt = (r.data as any[])[i];
		
		const transaction:NewTransactionT = {
			amount: nt.amount,
			date: nt.date,
			catref: null,
			merchant: nt.merchant,
			merchant_long: nt.merchant,
			simplified_merchant: nt.merchant,
			notes: nt.notes || '',
			source: sources.find(s=>s.id==='7688adbc-13ef-469f-81d7-1e02098d2d06')!, 
			tags: [],
			sheets_id: null
		}
		
		transactions.push(transaction);
	}

	res(transactions)
})

