

import { NewTransactionT } from "./addtr_defs.js"
import { SourceT } from '../../defs.js'
import { $NT } from "../../defs_client_symlink.js"
declare var $N: $NT;


export const ParseApple = async (sources:SourceT[]) => new Promise<NewTransactionT[]>(async (res, rej) => {


	const clipboardImg = await navigator.clipboard.read();

	const imgclip = clipboardImg.find(item => item.types.includes('image/png'));

	if (!imgclip) {
		rej('Clipboard text must contain both "Done" and "123"'); 
		return;
	}

	const blob = await imgclip.getType('image/png');
	
	// Create image element to get dimensions and compress
	const img = new Image();
	const imgUrl = URL.createObjectURL(blob);
	
	await new Promise((resolve, reject) => {
		img.onload = resolve;
		img.onerror = reject;
		img.src = imgUrl;
	});
	
	// Create canvas to resize/compress image
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d')!;
	
	// Calculate new dimensions (max width/height of 800px to reduce size)
	const maxSize = 800;
	let { width, height } = img;
	
	if (width > height) {
		if (width > maxSize) {
			height = (height * maxSize) / width;
			width = maxSize;
		}
	} else {
		if (height > maxSize) {
			width = (width * maxSize) / height;
			height = maxSize;
		}
	}
	
	canvas.width = width;
	canvas.height = height;
	
	// Draw and compress image
	ctx.drawImage(img, 0, 0, width, height);
	
	// Convert to base64 with compression (0.7 quality for JPEG-like compression)
	const base64Image = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
	
	// Clean up
	URL.revokeObjectURL(imgUrl);

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
	
	
	const body = {localnow, timezone_offset, image: base64Image}
	const httpopts = {method: "POST", body: JSON.stringify(body)}

	const transactions:NewTransactionT[] = []
	const r = await $N.FetchLassie("/api/xen/finance/ai/parse_apple", httpopts )
	if (!r.ok || ( r.data as any ).length === 0) {
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

