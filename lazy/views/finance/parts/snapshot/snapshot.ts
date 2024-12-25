

import { $NT } from "../../../../../defs_client_symlink.js"
import { str } from "../../../../../defs_server_symlink.js"
import { TransactionT, AreaT, CatT, SnapShotsT, MonthSnapShotT } from '../../../../../defs.js'
import { snapshots } from '../../../../libs/financefuncs/snapshot.js'

declare var Lit_Render: any;
declare var Lit_Html: any;
declare var $N: $NT;




type Model = {
	prop:string
}

interface SnapshotForUI {
    areaName: string;
    quad1_spent: number;
    quad2_spent: number;
    quad3_spent: number;
    quad4_spent: number;
    quad1_budget: number;
    quad2_budget: number;
    quad3_budget: number;
    quad4_budget: number;
    sum_quad1_2_spent: number;
    sum_quad1_2_3_spent: number;
    sum_quad1_2_budget: number;
    sum_quad1_2_3_budget: number;
}

type State = {
    propa: str;
    snapshots: SnapShotsT;
    snapshots_for_ui: SnapshotForUI[];
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
			snapshots_for_ui: []
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
        this.process_snapshots_for_ui();
		this.sc();
	}




    private process_snapshots_for_ui() {

        const areasToShow = ['fam', 'pers', 'rtm'];
        const snapshotsForUI: SnapshotForUI[] = [];

        areasToShow.forEach(areaName => {
            const areaAvg = this.s.snapshots.avgs.find(avg => avg.area.name === areaName);
            const latestSnapshot = this.s.snapshots.months
                .filter(ms => ms.area.name === areaName)
                .sort((a, b) => b.month.localeCompare(a.month))[0];

            if (areaAvg && latestSnapshot) {
                const quad1_spent = areaAvg.quad1_spent;
                const quad2_spent = areaAvg.quad2_spent;
                const quad3_spent = areaAvg.quad3_spent;
                const quad4_spent = areaAvg.quad4_spent;

                const quad1_budget = latestSnapshot.quad1_budget;
                const quad2_budget = latestSnapshot.quad2_budget;
                const quad3_budget = latestSnapshot.quad3_budget;
                const quad4_budget = latestSnapshot.quad4_budget;

                const sum_quad1_2_spent = quad1_spent + quad2_spent;
                const sum_quad1_2_3_spent = sum_quad1_2_spent + quad3_spent;
                const sum_quad1_2_budget = quad1_budget + quad2_budget;
                const sum_quad1_2_3_budget = sum_quad1_2_budget + quad3_budget;

                snapshotsForUI.push({
                    areaName,
                    quad1_spent,
                    quad2_spent,
                    quad3_spent,
                    quad4_spent,
                    quad1_budget,
                    quad2_budget,
                    quad3_budget,
                    quad4_budget,
                    sum_quad1_2_spent,
                    sum_quad1_2_3_spent,
                    sum_quad1_2_budget,
                    sum_quad1_2_3_budget
                });
            }
        });

        // Add grand totals
        const grandTotals = snapshotsForUI.reduce((acc, curr) => ({
            areaName: 'Total',
            quad1_spent: acc.quad1_spent + curr.quad1_spent,
            quad2_spent: acc.quad2_spent + curr.quad2_spent,
            quad3_spent: acc.quad3_spent + curr.quad3_spent,
            quad4_spent: acc.quad4_spent + curr.quad4_spent,
            quad1_budget: acc.quad1_budget + curr.quad1_budget,
            quad2_budget: acc.quad2_budget + curr.quad2_budget,
            quad3_budget: acc.quad3_budget + curr.quad3_budget,
            quad4_budget: acc.quad4_budget + curr.quad4_budget,
            sum_quad1_2_spent: acc.sum_quad1_2_spent + curr.sum_quad1_2_spent,
            sum_quad1_2_3_spent: acc.sum_quad1_2_3_spent + curr.sum_quad1_2_3_spent,
            sum_quad1_2_budget: acc.sum_quad1_2_budget + curr.sum_quad1_2_budget,
            sum_quad1_2_3_budget: acc.sum_quad1_2_3_budget + curr.sum_quad1_2_3_budget
        }));

        snapshotsForUI.push(grandTotals);
        this.s.snapshots_for_ui = snapshotsForUI;
    }




	save_monthsnapshot(e:Event) {

		const el = e.currentTarget as HTMLElement
	}




	sc(state_changes = {}) {   
		this.s = Object.assign(this.s, state_changes)
		Lit_Render(this.template(this.s, this.m), this.shadow);   
	}




	template = (_s:State, _m:Model) => { return Lit_Html`{--css--}{--html--}`; } 

}


customElements.define('vp-finance-snapshot', VPFinanceSnapShot);



