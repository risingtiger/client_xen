

import { $NT, CMechLoadedDataT, CMechLoadStateE } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { TransactionT, AreaT, CatT, SnapShotsT, SourceT, TagT, MonthSnapShotT } from '../../../../../defs.js'
import { snapshots } from '../../../../libs/financefuncs_snapshot.js'
import { knit_monthsnapshots, knit_transactions, knit_cats } from '../../../../libs/financefuncs_knit.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;




export type AttributesT = {
    propa: str,
}

type ModelT = {
	areas:AreaT[],
	cats:CatT[],
	transactions: TransactionT[],
	sources: SourceT[],
	tags: TagT[],
	monthsnapshots:MonthSnapShotT[]
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
    sum_quad1_2_3_4_avg: number;
    sum_quad1_2_budget: number;
    sum_quad1_2_3_budget: number;
    sum_quad1_2_3_4_budget: number;
}

type StateT = {
    propa: str;
    snapshots: SnapShotsT;
    current_month_snapshot_rows: CurrentMonthSnapshotT[];
	month_snapshots:any

}


const ATTRIBUTES:AttributesT = { propa: "" }




class VPFinanceSnapShot extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES }
	m:ModelT = {
		areas: [],
		cats: [],
		transactions: [],
		sources: [],
		tags: [],
		monthsnapshots: []
	}
	s:StateT = {
		propa: "",
		snapshots: { monthsref: [], avgsref: [] },
		current_month_snapshot_rows: [],
		month_snapshots: []
	} 

    shadow:ShadowRoot




	constructor() {   
		super(); 
		this.shadow = this.attachShadow({mode: 'open'});
	}




	async connectedCallback() {   
		await $N.CMech.ViewPartConnectedCallback(this)
		this.dispatchEvent(new Event('hydrated'));
	}




	async attributeChangedCallback(name:string, oldval:string|boolean|number, newval:string|boolean|number) {
		$N.CMech.AttributeChangedCallback(this, name, oldval, newval);
	}




	disconnectedCallback() {   
		$N.CMech.ViewPartDisconnectedCallback(this);   
	}




	kd = (loadeddata: CMechLoadedDataT) =>  {
		this.m.areas          = loadeddata.get("areas")! as AreaT[]
		this.m.cats           = knit_cats(this.m.areas, loadeddata.get('cats')!) as CatT[]
		this.m.sources        = loadeddata.get("sources") as SourceT[]
		this.m.monthsnapshots = knit_monthsnapshots(loadeddata.get("monthsnapshots")!, this.m.areas) as MonthSnapShotT[]
		this.m.tags           = $N.Utils.resolve_object_references(loadeddata.get("tags")!, loadeddata) as TagT[]
		this.m.transactions   = knit_transactions(this.m.cats, this.m.sources, this.m.tags, loadeddata.get("transactions")!) as TransactionT[]

        //this.s.snapshots = snapshots(this.m.areas, this.m.cats, this.m.transactions, this.m.monthsnapshots, months_minus_last_one);
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
            const areaAvg = this.s.snapshots.avgsref.find(avg => avg.arearef.name === areaName);
            const latestSnapshot = this.s.snapshots.monthsref
                .filter(ms => ms.arearef.name === areaName)
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
				const sum_quad1_2_3_4_avg = sum_quad1_2_3_avg + quad4_avg;
                const sum_quad1_2_budget = quad1_budget + quad2_budget;
                const sum_quad1_2_3_budget = sum_quad1_2_budget + quad3_budget;
				const sum_quad1_2_3_4_budget = sum_quad1_2_3_budget + quad4_budget;

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
					sum_quad1_2_3_4_avg,
                    sum_quad1_2_budget,
                    sum_quad1_2_3_budget,
					sum_quad1_2_3_4_budget
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
			sum_quad1_2_3_4_avg: acc.sum_quad1_2_3_4_avg + curr.sum_quad1_2_3_4_avg,
            sum_quad1_2_budget: acc.sum_quad1_2_budget + curr.sum_quad1_2_budget,
            sum_quad1_2_3_budget: acc.sum_quad1_2_3_budget + curr.sum_quad1_2_3_budget,
			sum_quad1_2_3_4_budget: acc.sum_quad1_2_3_4_budget + curr.sum_quad1_2_3_4_budget
        }));

        snapshotsForUI.push(grandTotals);
        this.s.current_month_snapshot_rows = snapshotsForUI;
    }




	showCurrentMonthSnapshot() {
		this.process_current_month_snapshot_for_ui()
		this.sc()
	}




	showMonthSnapshots() {
		 const m = this.s.snapshots.monthsref.sort((a, b) => {
			 const monthCompare = b.month.localeCompare(a.month);
			 if (monthCompare !== 0) return monthCompare;
			 
			 const areaOrder = {'fam': 0, 'pers': 1, 'rtm': 2};
			 return areaOrder[a.arearef.name] - areaOrder[b.arearef.name];
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
				 arearef: { name: 'Total' }, // Add area property to match structure
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

		const monthSnapshot = this.s.snapshots.monthsref.find(
			ms => ms.month === month && ms.arearef.id === areaId
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




	template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; } 

}


customElements.define('vp-finance-snapshot', VPFinanceSnapShot);



