

import { NewTransactionT } from "./addtr_defs.js"
import { SourceT } from '../../defs.js'
import { $NT } from "../../defs_client_symlink.js"
declare var $N: $NT;


export const ParseApple = async (sources:SourceT[]) => new Promise<NewTransactionT[]>(async (res, rej) => {

	const clipboardText = `

8:06
Done

-123


Bee's Marketplace
Pending - Colorado City
3 hours ago
$12.75
2%


Red Brick take N bake... $10.86
Pending - Colorado City
5 hours ago
2%
へ

Amazon Web Services
Card Number Used
Yesterday
$1.11
1%


InfluxData
Card Number Used
Yesterday
$0.05
1%

G
Google
Card Number Used
Yesterday
$22.72
1%

G
Google
Card Number Used
Yesterday
$17.88
1%

Beans
Brews
Beans & Brews Coffee...
Colorado City, AZ
Monday
$4.85
2%
＞

Essential Coffee
Colorado City, AZ
Monday
$5.75
2%


YouTube
Card Number Used
Monday
$5.42
1%


Hildale-Colorado Cit... $135.03
Card Number Used
Mondak
1%
	`


	//const clipboardText = await navigator.clipboard.readText();
	
	if (!clipboardText.includes('Done') || !clipboardText.includes('123')) { 
		rej('Clipboard text must contain both "Done" and "123"'); 
		return; 
	}

	const now = new Date();
	const relative_date = now.toISOString();
	const timezone_offset = -(now.getTimezoneOffset() / 60);
	console.log("relative_date", relative_date, "timezone_offset", timezone_offset);
	
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

