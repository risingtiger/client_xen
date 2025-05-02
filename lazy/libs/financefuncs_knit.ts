


//import { num } from "../../../defs_server_symlink.js";
import { AreaT, CatT, SourceT, TagT, PaymentT, TransactionT, MonthSnapShotT  } from '../../defs.js'
import { GenericRowT } from '../../defs_client_symlink.js'




function knit_all(raw_areas:any, raw_cats:any, raw_sources:any, raw_tags:any, raw_payments:any, raw_transactions:any, raw_monthsnapshots:any) : 
{ 
    areas: AreaT[], 
    cats: CatT[], 
    sources: SourceT[], 
    tags: TagT[],
	payments: PaymentT[],
    transactions: TransactionT[], 
    previous_static_monthsnapshots: MonthSnapShotT[]
} {

    const areas = knit_areas(raw_areas)

    const cats = knit_cats(raw_areas, raw_cats)

    const sources = knit_sources(raw_sources)

    const tags = knit_tags(raw_tags)

	const payments = knit_payments(sources, raw_payments)

    const transactions = knit_transactions(cats, sources, tags, raw_transactions)

    const previous_static_monthsnapshots = knit_monthsnapshots(raw_monthsnapshots, areas)

    return { areas, cats, sources, tags, payments, transactions, previous_static_monthsnapshots }
}




function knit_areas(raw_areas:any) : AreaT[] {
    return raw_areas
}




function knit_cats(areas:AreaT[], raw_cats:any) : CatT[] {

    const cats = raw_cats.filter((raw_cat:any) => raw_cat.area !== null && raw_cat.parent == null).map((raw_cat:any) => {
        return {
            id: raw_cat.id,
            arearef: areas.find((area:AreaT) => area.id === raw_cat.area.__path[1]),
            bucket: raw_cat.bucket,
            budget: raw_cat.budget,
            name: raw_cat.name,
            parentref:null,
            tags: raw_cat.tags,
            subsref: [],
            ts: raw_cat.date,
            transfer_state: 0
        } as CatT
    })

    cats.forEach((cat:CatT) => {
        cat.subsref = raw_cats.filter((raw_cat:any) => raw_cat.parent !== null && raw_cat.parent.__path[1] === cat.id).map((raw_cat:any) => {
            return {
                id: raw_cat.id,
                arearef: null,
                bucket: raw_cat.bucket,
                budget: raw_cat.budget,
                name: raw_cat.name,
                parentref: cat,
                tags: raw_cat.tags,
                subsref: null,
                ts: raw_cat.date,
                transfer_state: 0
            } 
        })

        cat.subsref!.sort((a:CatT, b:CatT) => a.name.localeCompare(b.name))
    })

    cats.sort((a:CatT, b:CatT) => a.arearef.name.localeCompare(b.arearef.name) || a.name.localeCompare(b.name))

    return cats 
}




function knit_sources(raw_sources:any) : SourceT[] {
    return raw_sources.map((raw_source:any) => { return { id: raw_source.id, ts: raw_source.date, name: raw_source.name, balance: raw_source.balance } })
}




function knit_tags(raw_tags:any) : TagT[] {
    return raw_tags.map((raw_tag:any) => { 
        return { id: raw_tag.id, ts: raw_tag.date, name: raw_tag.name, sort: raw_tag.sort } 
    }).sort((a:TagT, b:TagT) => a.sort - b.sort)
}




function knit_payments(sources:SourceT[], raw_payments:any[]) : PaymentT[] {

    const processed_payments = raw_payments.map((rp:any) => { 

        rp.source = sources.find((s:SourceT) => {
			if (rp.payment_source === null) return false;
			return rp.payment_source._path.segments[1] === s.id
		})
		rp.cat = null; // not dealing with this yet

		return rp
    })

	return processed_payments
}



function knit_transactions(cats:CatT[], sources:SourceT[], tags:TagT[], raw_transactions:any) : TransactionT[]  {

    const transactions:TransactionT[] = raw_transactions.map((raw_transaction:any) => {

        let trcat:CatT|null = null
        let trarea:AreaT|null = null
        for (const cat of cats) {
            const subcat_match = cat.subsref?.find((subcat:CatT) => subcat.id === raw_transaction.cat.__path[1])
            if (subcat_match) { 
                trcat = subcat_match 
                trarea = cat.arearef!
                break
            }
        }

        const trsource = sources.find((source:SourceT) => source.id === raw_transaction.source.__path[1])

        const trtags = raw_transaction.tags.map((t:any) => tags.find((tag:TagT) => tag.id === t._path.segments[1]) as TagT)

        return {
            id: raw_transaction.id,
            amount: raw_transaction.amount,
            arearef: trarea,
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




function knit_monthsnapshots(raw_monthsnapshots:any, areas: AreaT[]) : MonthSnapShotT[] {

    return raw_monthsnapshots.map((raw_monthsnapshot:any) => { 
		let arearef = areas.find((area:AreaT) => area.id === raw_monthsnapshot.area.__path[1]) as AreaT

		return { 
			arearef,
			month: raw_monthsnapshot.month,
			issaved: false,
			bucket: raw_monthsnapshot.bucket,
			savings: raw_monthsnapshot.savings,
			quad1_budget: raw_monthsnapshot.quad1_budget || 0,
			quad2_budget: raw_monthsnapshot.quad2_budget || 0,
			quad3_budget: raw_monthsnapshot.quad3_budget || 0,
			quad4_budget: raw_monthsnapshot.quad4_budget || 0,
			quad1_spent: raw_monthsnapshot.quad1_spent || 0,
			quad2_spent: raw_monthsnapshot.quad2_spent || 0,
			quad3_spent: raw_monthsnapshot.quad3_spent || 0,
			quad4_spent: raw_monthsnapshot.quad4_spent || 0
		} as MonthSnapShotT
    })
}








export { knit_all, knit_areas, knit_cats, knit_tags, knit_sources, knit_transactions, knit_monthsnapshots, knit_payments }


