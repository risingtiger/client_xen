


//import { num } from "../../../defs_server_symlink.js";
import { TransactionT, AreaT, CatT, SourceT, TagT, PaymentT  } from '../../defs_instance_server_symlink.js'




export default {

	knit_areas(raw_areas:any) : AreaT[] {
		return raw_areas
	},




	knit_cats(raw_cats:any, areas:AreaT[], raw_payments:any[]) : CatT[] {

		const cats = raw_cats.filter((raw_cat:any) => raw_cat.area !== null && raw_cat.parent == null).map((raw_cat:any) => {
			return {
				id: raw_cat.id,
				arearef: areas.find((area:any) => area.id === raw_cat.area.__path[1]),
				bucket: null,
				costs: null,
				costs_from_payments:null,
				costs_total:null,
				goal:null,
				name: raw_cat.name,
				parentref:null,
				tags: raw_cat.tags,
				subsref: [],
				ts: raw_cat.ts,
				transfer_state: 0
			} as CatT
		})

		cats.forEach((cat:CatT) => {
			cat.subsref = raw_cats.filter((raw_cat:any) => raw_cat.parent !== null && raw_cat.parent.__path[1] === cat.id).map((raw_cat:any) => {
				const payments_costs = raw_payments.filter((p:any)=>p.cat && p.cat.__path[1] === raw_cat.id).reduce((acc:number, p:any) => acc + p.amount, 0)
				return {
					id: raw_cat.id,
					arearef: null,
					bucket: raw_cat.bucket,
					costs: raw_cat.costs,
					costs_from_payments:payments_costs,
					costs_total: raw_cat.costs + payments_costs,
					goal: raw_cat.goal,
					name: raw_cat.name,
					parentref: cat,
					tags: raw_cat.tags,
					subsref: null,
					ts: raw_cat.date,
					transfer_state: 0
				} as CatT
			})

			cat.subsref!.sort((a:CatT, b:CatT) => a.name.localeCompare(b.name))
		})

		cats.sort((a:CatT, b:CatT) => a.arearef!.name.localeCompare(b.arearef!.name) || a.name.localeCompare(b.name))

		return cats 
	},




	knit_sources(raw_sources:any, areas:AreaT[]) : SourceT[] {
		return raw_sources.map((raw_source:any) => { 

			return {
				id: raw_source.id,
				arearef: areas.find((area:any) => area.id === raw_source.area.__path[1]),
				balance: raw_source.balance || null,
				ts: raw_source.ts,
				name: raw_source.name,
				longname: raw_source.longname,
				description: raw_source.description,
				type: raw_source.type
			} as SourceT
		})
	},




	knit_tags(raw_tags:any, areas:AreaT[]) : TagT[] {
		return raw_tags.filter((raw_tag:any) => raw_tag.area !== null).map((raw_tag:any) => { 

			const arearef = areas.find((area:AreaT) => area.id === raw_tag.area.__path[1])
			return { id: raw_tag.id, arearef, ts: raw_tag.ts, name: raw_tag.name, sort: raw_tag.sort } 
		}).sort((a:TagT, b:TagT) => a.sort - b.sort)
	},




	knit_payments(raw_payments:any[], sources:SourceT[], cats:CatT[]) : PaymentT[] {

		raw_payments.forEach((rp:any) => { 
			rp.sourceref = sources.find((s:any) => s.id === (rp.source ? rp.source.__path[1] : '') ) || null
			rp.catref    = cats.find((c:any) => c.id === ( rp.cat ? rp.cat.__path[1] : '') ) || null
		})

		return raw_payments as PaymentT[]
	},




	knit_transactions(raw_transactions:any, cats:CatT[], sources:SourceT[], tags:TagT[]) : TransactionT[] {

		const transactions:TransactionT[] = raw_transactions.map((raw_transaction:any) => {

			let trcat:CatT|null = null
			for (const cat of cats) {
				const subcat_match = cat.subsref?.find((subcat:CatT) => subcat.id === raw_transaction.cat.__path[1])
				if (subcat_match) { 
					trcat = subcat_match 
					break
				}
			}

			const trsource = sources.find((source:SourceT) => source.id === raw_transaction.source.__path[1])

			const trtags:TagT[] = []
			if (raw_transaction.tags && raw_transaction.tags.length) {
				for (const t of raw_transaction.tags) {
					const tagfind = tags.find((tag:TagT) => tag.id === t.__path[1])
					if (tagfind) {
						trtags.push(tagfind)
					}
				}
			}


			return {
				id: raw_transaction.id,
				amount: raw_transaction.amount,
				catref: trcat,
				merchant: raw_transaction.merchant,
				date: raw_transaction.date,
				ts: raw_transaction.ts,
				notes: raw_transaction.notes,
				sourceref: trsource,
				tagsref: trtags
			} as TransactionT
		})

		return transactions
	}
}






