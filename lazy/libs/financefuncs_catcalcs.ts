

//import { num } from "../../../defs_server_symlink.js";
import { AreaT, CatT, TransactionT, CatCalcsT, CatCalcsTotalsT, FilterT  } from '../../defs_instance_server_symlink'
import { filter_transactions  } from '../libs/financefuncs_sortfilter.js'




function CatCalcs(transactions:TransactionT[], filter_area:AreaT, filter_cattags:number[], cats:CatT[], months:Date[]) : CatCalcsT[] {

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

        const catcalc:CatCalcsT = { catref:cat, subsref: [], sums: [], costs:0, goal:0, med:0, avg:0 }

        const filtered_sub_cats = cat.subsref!.filter((cat:CatT) => { 
            if (filter_cattags.length === 0) { return true }
            return cat.tags.some((t:number) => filter_cattags.includes(t))
        })

        for (const subcat of filtered_sub_cats) {


            const subcatcalc:CatCalcsT = { catref: subcat, subsref: null, sums: [], costs:subcat.costs_total!, goal:subcat.goal!, med:0, avg:0}

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

        catcalc.costs = catcalc.subsref!.reduce((acc:number, subcatcalc:CatCalcsT) => { return acc + subcatcalc.costs }, 0)
        catcalc.goal  = catcalc.subsref!.reduce((acc:number, subcatcalc:CatCalcsT) => { return acc + subcatcalc.goal }, 0)

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




function CatCalcTotalsOfFilter(transactions:TransactionT[], cats:CatT[], months:Date[], filter:FilterT) : CatCalcsTotalsT {

	const filtered_transactions = filter_transactions(transactions, filter);
	const catcalcs              = CatCalcs(filtered_transactions, filter.arearef!, filter.cattags, cats, months);
	return CatCalcTotals(catcalcs, filter.arearef!.unfixedcosts, filter.cattags[0])
}




function CatCalcTotalsOfCatTag(transactions:TransactionT[], cats:CatT[], months:Date[], filter_area:AreaT, filter_daterange:[Date, Date], cattag:number) : CatCalcsTotalsT {
	const filter:FilterT        = { arearef: filter_area, parentcatref: null, catref: null, sourceref: null, tagsref: null, daterange:filter_daterange, merchant: null, note: null, amountrange: null, cattags:[cattag] }
	const filtered_transactions = filter_transactions(transactions, filter);
	const catcalcs              = CatCalcs(filtered_transactions, filter_area, [ cattag ], cats, months);
	return CatCalcTotals(catcalcs, filter_area.unfixedcosts, cattag)

}




function CatCalcTotals(catcalcs:CatCalcsT[], unfixedcosts:number, cattag:number) : CatCalcsTotalsT {


	/*
    const catcalcs_f = catcalcs.filter((cc:CatCalcsT) => { 

        const a = cc.catref.arearef === filter_area

        const t = cc.catref.subsref!.some((subcat:CatT) => subcat.tags.some((t:number) => filter_cattags.includes(t)))

        return a && t
    })
	*/

	let allotment = 0;
	let allotment_left = 0;
	if (cattag === 1) {

		for(let i = 0; i < catcalcs.length; i++) {
			for(let ii = 0; ii < catcalcs[i].subsref!.length; ii++) {
				const sc = catcalcs[i].subsref![ii];
				const sum = sc.sums[sc.sums.length - 1];
				const l = sc.costs - sum;
				if (l > 0) allotment_left += l;
			}
		}
		allotment = catcalcs.reduce((acc:number, catcalc:CatCalcsT) => { return acc + catcalc.costs }, 0)

	} else if (cattag === 2) {
		allotment = unfixedcosts
		allotment_left = allotment - catcalcs.reduce((acc:number, catcalc:CatCalcsT) => { return acc + catcalc.sums[ catcalc.sums.length - 1] }, 0)
	} else {
		allotment = 0
		allotment_left = 0
	}

    const sums:number[] = catcalcs[0] ? catcalcs[0].sums.map(_ => { return 0 }) : []

    for (const catcalc of catcalcs) {
        for (let i = 0; i < catcalc.sums.length; i++) {
            sums[i] += catcalc.sums[i]
        }
    }


	const sums_except_last_month = sums.slice(0, sums.length - 1)
    const med = sums_except_last_month.slice().sort((a:number, b:number) => b - a)[Math.floor(sums_except_last_month.length / 2)]
    const avg = sums_except_last_month.reduce((acc:number, sum:number) => { return acc + sum }, 0) / sums_except_last_month.length

    return { sums, allotment, allotment_left, med, avg  }
}




function CatCalcTotalsCombined(catcalctotals:CatCalcsTotalsT[]) : CatCalcsTotalsT {

	const sums:number[] = catcalctotals[0].sums.map(_ => { return 0 })
	for (const cct of catcalctotals) {
		for (let i = 0; i < cct.sums.length; i++) {
			sums[i] += cct.sums[i]
		}
	}

	const allotment = catcalctotals.reduce((acc:number, cct:CatCalcsTotalsT) => { return acc + cct.allotment }, 0)
	const allotment_left = catcalctotals.reduce((acc:number, cct:CatCalcsTotalsT) => { return acc + cct.allotment_left }, 0)

	const sums_except_last_month = sums.slice(0, sums.length - 1)
	const med = sums_except_last_month.slice().sort((a:number, b:number) => b - a)[Math.floor(sums_except_last_month.length / 2)]
	const avg = sums_except_last_month.reduce((acc:number, sum:number) => { return acc + sum }, 0) / sums_except_last_month.length

	return { sums, allotment, allotment_left, med, avg  }
}


export { CatCalcs, CatCalcTotals, CatCalcTotalsOfFilter, CatCalcTotalsOfCatTag, CatCalcTotalsCombined }


