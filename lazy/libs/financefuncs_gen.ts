


import { num } from "../../defs_server_symlink.js";
//import { AreaT, CatT, SourceT, TagT, PaymentT, TransactionT, CatCalcsT, CatCalcsTotalsT, SnapShotsT, MonthSnapShotT, AvgsSnapShotT, FilterT  } from '../../../defs.js'




function get_months(month_end:Date, count:num) : Date[] {

    const months:Date[] = []

    for (let i = 0; i < count; i++) {
        months.push(new Date(month_end))
        month_end.setUTCMonth(month_end.getUTCMonth() - 1)
    }

    months.reverse()

    return months
}




/*
function month_costs_total(area:AreaT, cats:CatT[]) : num {

    let costs_total = 0

    cats.filter(c=>c.area === area).forEach(cat => {
        costs_total += cat.subs?.reduce((a,b)=> a+b.costs!, 0) as number
    })

    return costs_total
}
*/




export { get_months }


