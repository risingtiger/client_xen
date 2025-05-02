

//import { num } from "../../../defs_server_symlink.js";
import { AreaT, CatT, TransactionT, CatCalcsT, CatCalcsTotalsT, FilterT  } from '../../defs.js'




function catcalcs(transactions:TransactionT[], filter_area:AreaT, filter_cattags:number[], cats:CatT[], months:Date[]) : CatCalcsT[] {

    const all_catcalcs:CatCalcsT[] = []

    const months_ts = months.map((month:Date) => {
        const start = Math.floor(month.getTime() / 1000)
        const end_d = new Date(month)
        end_d.setUTCMonth(end_d.getUTCMonth() + 1)
        const end = Math.floor(end_d.getTime() / 1000) - 1
        return { start, end }
    })

    const filteredcats = cats.filter((cat:CatT) => { 

        if (cat.arearef !== filter_area) { return false }

        const isofarea = cat.arearef === filter_area

        if (filter_cattags.length === 0) return isofarea

        const has_filter_a_cattag = cat.subsref?.some((subcat:CatT) => {
            return subcat.tags.some((t:number) => { 
                return filter_cattags.includes(t) 
            })
        })

        return (has_filter_a_cattag)
    })

    for (const cat of filteredcats) {

        const catcalc:CatCalcsT = { catref:cat, subsref: [], sums: [], budget:0, med:0, avg:0 }

        const filtered_sub_cats = cat.subsref!.filter((cat:CatT) => { 
            if (filter_cattags.length === 0) { return true }
            return cat.tags.some((t:number) => filter_cattags.includes(t))
        })

        for (const subcat of filtered_sub_cats) {


            const subcatcalc:CatCalcsT = { catref: subcat, subsref: null, sums: [], budget:subcat.budget!, med:0, avg:0}

            for (let m = 0; m < months_ts.length; m++) {

                const month_ts = months_ts[m]

                const filtered_transactions = transactions.filter(transaction => {
                    return (transaction.catref === subcat && transaction.date > month_ts.start && transaction.date < month_ts.end) 
                })

                const sum = filtered_transactions.reduce((acc:number, transaction:TransactionT) => { return acc + transaction.amount }, 0)
    
                subcatcalc.sums.push(sum)
            }

			const sums_except_last_month = subcatcalc.sums.slice(0, subcatcalc.sums.length - 1)
            const sorted_sums_desc       = sums_except_last_month.slice().sort((a:number, b:number) => b - a)
            subcatcalc.med               = sorted_sums_desc[Math.floor(sorted_sums_desc.length / 2)]
            subcatcalc.avg               = sums_except_last_month.reduce((acc:number, sum:number) => { return acc + sum }, 0) / sums_except_last_month.length

            catcalc.subsref!.push(subcatcalc)
        }

        catcalc.budget = catcalc.subsref!.reduce((acc:number, subcatcalc:CatCalcsT) => { return acc + subcatcalc.budget }, 0)

        all_catcalcs.push(catcalc)
    }

    for(const catcalc of all_catcalcs) {

        const sums:number[] = []

        for (let i = 0; i < months_ts.length; i++) {
            let sum = 0
            for (const subcatcalc of catcalc.subsref!) {
                sum += subcatcalc.sums[i]
            }
            sums.push(sum)
        }

        catcalc.sums = sums


		const sums_except_last_month = catcalc.sums.slice(0, catcalc.sums.length - 1)
        const sorted_sums_desc       = sums_except_last_month.slice().sort((a:number, b:number) => b - a)
        catcalc.med                  = sorted_sums_desc[Math.floor(sorted_sums_desc.length / 2)]
        catcalc.avg                  = sums_except_last_month.reduce((acc:number, sum:number) => { return acc + sum }, 0) / sums_except_last_month.length
    }

    return all_catcalcs
}




function catcalc_totals(catcalcs:CatCalcsT[], filter:FilterT) : CatCalcsTotalsT {

    const catcalcs_f = catcalcs.filter((cc:CatCalcsT) => { 
        const a = cc.catref.arearef === filter.arearef

        const t = cc.catref.subsref!.some((subcat:CatT) => subcat.tags.some((t:number) => filter.cattags.includes(t)))

        return a && t
    })

    let budget = catcalcs_f.reduce((acc:number, catcalc:CatCalcsT) => { return acc + catcalc.budget }, 0)

    const sums:number[] = catcalcs_f[0] ? catcalcs[0].sums.map(_ => { return 0 }) : []

    for (const catcalc of catcalcs_f) {
        for (let i = 0; i < catcalc.sums.length; i++) {
            sums[i] += catcalc.sums[i]
        }
    }


	const sums_except_last_month = sums.slice(0, sums.length - 1)
    const med = sums_except_last_month.slice().sort((a:number, b:number) => b - a)[Math.floor(sums_except_last_month.length / 2)]
    const avg = sums_except_last_month.reduce((acc:number, sum:number) => { return acc + sum }, 0) / sums_except_last_month.length

    return { sums, budget, med, avg }
}


export { catcalcs, catcalc_totals }


