

import { $NT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { TransactionT, AreaT, CatT, SnapShotsT, MonthSnapShotT } from '../../../../../defs.js'
import { snapshots } from '../../../../libs/financefuncs_snapshot.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;




type Model = {
	prop:string
}

interface CurrentMonthSnapshotT {
    areaName: string;
    quad1_avg: number;
    quad2_avg: number;
    quad3_avg: number;
    quad4_avg: number;
    quad1_budget: number;
    quad2_budget: number;
    quad3_budget: number;
    quad4_budget: number;
    sum_quad1_2_avg: number;
    sum_quad1_2_3_avg: number;
    sum_quad1_2_budget: number;
    sum_quad1_2_3_budget: number;
}

type State = {
    propa: str;
    snapshots: SnapShotsT;
    current_month_snapshot_rows: CurrentMonthSnapshotT[];
	month_snapshots:any

}




class VPFinanceSnapShot extends HTMLElement {

    s:State
    m:Model
    shadow:ShadowRoot




	constructor() {   
		super(); 

		this.m = {
			prop: "",
		}

		this.s = {
			propa: "",
			snapshots: { months: [], avgs: [] },
			current_month_snapshot_rows: [],
			month_snapshots: []
		} 

		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {   
		this.sc()
		this.dispatchEvent(new Event('hydrated'))
	}




	FleshItOut(areas:AreaT[], cats:CatT[], transactions:TransactionT[], previous_static_monthsnapshots:MonthSnapShotT[], months_to_process:Date[]) {

		const months_minus_last_one = months_to_process.slice(0, months_to_process.length - 1)
        this.s.snapshots = snapshots(areas, cats, transactions, previous_static_monthsnapshots, months_minus_last_one);

		this.showCurrentMonthSnapshot()
		this.showMonthSnapshots()
		
	}




    private process_current_month_snapshot_for_ui() {

        const areasToShow = ['fam', 'pers', 'rtm'];
        const snapshotsForUI: CurrentMonthSnapshotT[] = [];

        areasToShow.forEach(areaName => {
            const areaAvg = this.s.snapshots.avgs.find(avg => avg.area.name === areaName);
            const latestSnapshot = this.s.snapshots.months
                .filter(ms => ms.area.name === areaName)
                .sort((a, b) => b.month.localeCompare(a.month))[0];

            if (areaAvg && latestSnapshot) {
                const quad1_avg = areaAvg.quad1_spent;
                const quad2_avg = areaAvg.quad2_spent;
                const quad3_avg = areaAvg.quad3_spent;
                const quad4_avg = areaAvg.quad4_spent;

                const quad1_budget = latestSnapshot.quad1_budget;
                const quad2_budget = latestSnapshot.quad2_budget;
                const quad3_budget = latestSnapshot.quad3_budget;
                const quad4_budget = latestSnapshot.quad4_budget;

                const sum_quad1_2_avg = quad1_avg + quad2_avg;
                const sum_quad1_2_3_avg = sum_quad1_2_avg + quad3_avg;
                const sum_quad1_2_budget = quad1_budget + quad2_budget;
                const sum_quad1_2_3_budget = sum_quad1_2_budget + quad3_budget;

                snapshotsForUI.push({
                    areaName,
                    quad1_avg,
                    quad2_avg,
                    quad3_avg,
                    quad4_avg,
                    quad1_budget,
                    quad2_budget,
                    quad3_budget,
                    quad4_budget,
                    sum_quad1_2_avg,
                    sum_quad1_2_3_avg,
                    sum_quad1_2_budget,
                    sum_quad1_2_3_budget
                });
            }
        });

        // Add grand totals
        const grandTotals = snapshotsForUI.reduce((acc, curr) => ({
            areaName: 'Total',
            quad1_avg: acc.quad1_avg + curr.quad1_avg,
            quad2_avg: acc.quad2_avg + curr.quad2_avg,
            quad3_avg: acc.quad3_avg + curr.quad3_avg,
            quad4_avg: acc.quad4_avg + curr.quad4_avg,
            quad1_budget: acc.quad1_budget + curr.quad1_budget,
            quad2_budget: acc.quad2_budget + curr.quad2_budget,
            quad3_budget: acc.quad3_budget + curr.quad3_budget,
            quad4_budget: acc.quad4_budget + curr.quad4_budget,
            sum_quad1_2_avg: acc.sum_quad1_2_avg + curr.sum_quad1_2_avg,
            sum_quad1_2_3_avg: acc.sum_quad1_2_3_avg + curr.sum_quad1_2_3_avg,
            sum_quad1_2_budget: acc.sum_quad1_2_budget + curr.sum_quad1_2_budget,
            sum_quad1_2_3_budget: acc.sum_quad1_2_3_budget + curr.sum_quad1_2_3_budget
        }));

        snapshotsForUI.push(grandTotals);
        this.s.current_month_snapshot_rows = snapshotsForUI;
    }




	showCurrentMonthSnapshot() {
		this.process_current_month_snapshot_for_ui()
		this.sc()
	}




	showMonthSnapshots() {
		 const m = this.s.snapshots.months.sort((a, b) => {
			 const monthCompare = b.month.localeCompare(a.month);
			 if (monthCompare !== 0) return monthCompare;
			 
			 const areaOrder = {'fam': 0, 'pers': 1, 'rtm': 2};
			 return areaOrder[a.area.name] - areaOrder[b.area.name];
		 });

		 // Get unique months
		 const uniqueMonths = [...new Set(m.map(item => item.month))];

		 // Create combined array with totals inline
		 const combinedArray:any[] = [];
		 uniqueMonths.forEach(month => {
			 const monthEntries = m.filter(item => item.month === month);
			 // Add individual entries for the month
			 monthEntries.forEach((entry:any) => combinedArray.push(entry));
			 
			 // Calculate and add total for this month
			 const monthTotal = {
				 month,
				 isTotal: true, // Add a flag to identify total rows
				 area: { name: 'Total' }, // Add area property to match structure
				 quad1_spent: monthEntries.reduce((sum, item) => sum + item.quad1_spent, 0),
				 quad2_spent: monthEntries.reduce((sum, item) => sum + item.quad2_spent, 0),
				 quad3_spent: monthEntries.reduce((sum, item) => sum + item.quad3_spent, 0),
				 quad4_spent: monthEntries.reduce((sum, item) => sum + item.quad4_spent, 0),
				 quad1_budget: monthEntries.reduce((sum, item) => sum + item.quad1_budget, 0),
				 quad2_budget: monthEntries.reduce((sum, item) => sum + item.quad2_budget, 0),
				 quad3_budget: monthEntries.reduce((sum, item) => sum + item.quad3_budget, 0),
				 quad4_budget: monthEntries.reduce((sum, item) => sum + item.quad4_budget, 0)
			 };
			 combinedArray.push(monthTotal);
		 });

		this.s.month_snapshots = combinedArray;	

		this.sc()
	}




	async save_monthsnapshot(e:Event) {
		const el = e.currentTarget as HTMLElement;
		const month = el.dataset.month;
		const areaId = el.dataset.areaid;

		const monthSnapshot = this.s.snapshots.months.find(
			ms => ms.month === month && ms.area.id === areaId
		);

		const payload = { monthSnapshot };

		await $N.FetchLassie("/api/xen/finance/add_monthsnapshot", {
			method: "POST", 
			body: JSON.stringify(payload),
			headers: { 'Content-Type': 'application/json' }
		});

		monthSnapshot!.issaved = true;
		this.sc();
	}




	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:State, _m:Model) => { return html`{--css--}{--html--}`; } 

}


customElements.define('vp-finance-snapshot', VPFinanceSnapShot);



