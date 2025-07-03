

import { NewTransactionT } from "./addtr_defs.js"
import { SourceT } from '../../defs.js'
import { $NT } from "../../defs_client_symlink.js"
declare var $N: $NT;


export const ParseAppleScreenShot = async (sources:SourceT[]) => new Promise<NewTransactionT[]>(async (res, rej) => {

	const clipboardImg = await navigator.clipboard.read();

	const imgclip = clipboardImg.find(item => item.types.includes('image/png'));

	if (!imgclip) {
		rej(); 
		return;
	}

	const blob = await imgclip.getType('image/png');

	const now = new Date();
	const timezone_offset = -(now.getTimezoneOffset() / 60);
	
	// Create ISO string in local time with timezone offset
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');
	const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

	
	const offset_sign = timezone_offset >= 0 ? '+' : '-';
	const offset_hours = String(Math.abs(Math.floor(timezone_offset))).padStart(2, '0');
	const offset_minutes = String(Math.abs((timezone_offset % 1) * 60)).padStart(2, '0');
	
	const localnow = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offset_sign}${offset_hours}:${offset_minutes}`;
	
	// Create FormData for multipart form submission
	const formData = new FormData();
	formData.append('image_screenshot', blob, 'image_screenshot.png');
	formData.append('localnow', localnow);

	const transactions:NewTransactionT[] = []
	const response = await fetch("/api/xen/finance/parse_apple_screenshot", {
		method: "POST",
		body: formData
	});
	
	if (!response.ok) {
		rej();
		return;
	}
	
	const data = await response.json();
	if (!data || data.length === 0) {
		rej();
		return;
	}


	for (let i = 0; i < data.length; i++) { 
		const nt = data[i];
		
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

