


import { str, num } from "../../defs_server_symlink.js"
import { AreaT, CatT, TransactionT, SnapShotsT, MonthSnapShotT  } from '../../defs.js'




function monthsnapshot(area:AreaT, cats:CatT[], month_transactions:TransactionT[], month_name:str, previous_static_monthsnapshots:MonthSnapShotT[]) : MonthSnapShotT {

	const existing_snapshot = previous_static_monthsnapshots.find(s=> s.area === area && s.month === month_name)

	if (existing_snapshot) { return { ...existing_snapshot, issaved: true }; }


    const quad1_transactions = month_transactions.filter(t=> t.cat.tags.includes(1) )
	const quad2_transactions = month_transactions.filter(t=> t.cat.tags.includes(2) )
	const quad3_transactions = month_transactions.filter(t=> t.cat.tags.includes(3) )
	const quad4_transactions = month_transactions.filter(t=> t.cat.tags.includes(4) )

	let   quad1_budget       = get_buget_total_by_tag(1)
	let   quad2_budget       = get_buget_total_by_tag(2)
	let   quad3_budget       = get_buget_total_by_tag(3)
	let   quad4_budget       = get_buget_total_by_tag(4)

    return { 
		area,
		month: month_name,
		issaved: false,
		quad1_budget,
		quad2_budget,
		quad3_budget,
		quad4_budget,
		quad1_spent: Math.round(quad1_transactions.reduce((a,b)=> a+b.amount, 0)),
		quad2_spent: Math.round(quad2_transactions.reduce((a,b)=> a+b.amount, 0)),
		quad3_spent: Math.round(quad3_transactions.reduce((a,b)=> a+b.amount, 0)),
		quad4_spent: Math.round(quad4_transactions.reduce((a,b)=> a+b.amount, 0))
	}


	function get_buget_total_by_tag(tag:number) : number {
		let budget = 0

		cats.filter(c=>c.area === area).forEach(cat => {
			const filtered_subs_by_tag = cat.subs?.filter(cs=> cs.tags.includes(tag))!
			const x = filtered_subs_by_tag.reduce((a,b)=> a+b.budget!, 0)
			budget += x
		})
		return budget
	}
}




function snapshots(areas:AreaT[], cats:CatT[], transactions:TransactionT[], previous_static_monthsnapshots:MonthSnapShotT[], months_to_process:Date[]) : SnapShotsT {

	console.time('snapshots')
    const clonedate_start      = new Date(months_to_process[0])
    const clonedate_end        = new Date(months_to_process[months_to_process.length-1])
    const full_rangetimestart  = Math.floor(clonedate_start.getTime()/1000)
    const full_rangetimeend    = Math.floor(clonedate_end.setUTCMonth(clonedate_end.getUTCMonth() + 1)/1000)

    const scoped_full_rangetime_transactions = transactions.filter(t=> t.date >= full_rangetimestart && t.date < full_rangetimeend)

	const months_snapshot = areas.map(area => {

		const area_cats = cats.filter(cat => cat.area === area)

		const area_monthsnapshots     = months_to_process.map(month => {
			const clonedate           = new Date(month);
			const rangetimestart      = Math.floor(clonedate.getTime()/1000);
			const rangetimeend        = Math.floor(clonedate.setUTCMonth(clonedate.getUTCMonth() + 1)/1000);
			const scoped_transactions = scoped_full_rangetime_transactions.filter(t=> t.area === area && t.date >= rangetimestart && t.date < rangetimeend);
			const month_name          = month.toISOString().slice(0,7);
			const monthsnapshot_res   = monthsnapshot(area, area_cats, scoped_transactions, month_name, previous_static_monthsnapshots);

			return monthsnapshot_res;
		}) as MonthSnapShotT[]

		return area_monthsnapshots
	}).flat()

	const avgs = areas.map(area => {
		const area_snapshots = months_snapshot.filter(ms => ms.area === area)
		return {
			area,
			quad1_spent: Math.round(area_snapshots.reduce((acc, ms) => acc + ms.quad1_spent, 0) / area_snapshots.length),
			quad2_spent: Math.round(area_snapshots.reduce((acc, ms) => acc + ms.quad2_spent, 0) / area_snapshots.length),
			quad3_spent: Math.round(area_snapshots.reduce((acc, ms) => acc + ms.quad3_spent, 0) / area_snapshots.length),
			quad4_spent: Math.round(area_snapshots.reduce((acc, ms) => acc + ms.quad4_spent, 0) / area_snapshots.length)
		}
	})

	console.timeEnd('snapshots')

	return { months:months_snapshot, avgs }
}









export { snapshots, monthsnapshot }


