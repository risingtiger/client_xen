
import { $NT } from "../../../../../defs_client_symlink.js"
import { str, num } from "../../../../../defs_server_symlink.js"
import {  } from "../../../../../defs_server_symlink.js"
import { AreaT, CatT, TransactionT, SourceT } from "../../../../../defs.js"
import { area_quad_bucket_totals, cat_buckets_info } from "../../../../libs/financefuncs_bucket.js"

declare var render: any;
declare var html: any;
declare var $N: $NT;


type AccountT = {
    name: string;
    balance: number;
}


type AllAreasBucketInfoT = {
	spentAgainstBucketsTotal: number;
	remaingAgainstBucketsTotal: number;
	bucketsTotal: number;
}

export type AttributesT = {
    propa: str,
}

type ModelT = {
    areas: AreaT[],
	cats: CatT[],
	transactions: TransactionT[],
	sources: SourceT[],
	balances: any[]
}


type StateT = {
	checkingAccounts:AccountT[]
	creditCardCycleAccounts:AccountT[]
	savingsAccounts:AccountT[]
	invoicesAccounts:AccountT[]
	sourceBucketAccount: AccountT
    checkingTotal: num;
    creditCardCycleTotal: number;
    savingsTotal: number;
	invoicesTotal: number,
	allLiquidAssets: number,
	allLiquidDebt: number,
	allAreasBucketInfo: AllAreasBucketInfoT
	net_taking_into_account_bucket_spending: number,
	unspoken_for: number
}


const ATTRIBUTES:AttributesT = { propa: "" }


class VPFinanceBalances extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES }
    m: ModelT = { areas: [], cats: [], transactions: [], sources: [], balances: [] }
    s: StateT = {
		checkingAccounts: [],
		creditCardCycleAccounts: [],
		savingsAccounts: [],
		invoicesAccounts: [],
		sourceBucketAccount: { name: 'Bucket', balance: 0 },
		checkingTotal: 0,
		creditCardCycleTotal: 0,
		savingsTotal: 0,
		invoicesTotal: 0,
		allLiquidAssets: 0,
		allLiquidDebt: 0,
		allAreasBucketInfo: { spentAgainstBucketsTotal: 0 , remaingAgainstBucketsTotal: 0, bucketsTotal: 0 },
		net_taking_into_account_bucket_spending: 0,
		unspoken_for: 0
	}
    shadow: ShadowRoot


	static get observedAttributes() { return Object.keys(ATTRIBUTES); }


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




	kd = () =>  {}



    sc(state_changes = {}) {   
        this.s = Object.assign(this.s, state_changes)
        render(this.template(this.s, this.m), this.shadow);   
    }




    Show(areas:AreaT[], cats:CatT[], transactions:TransactionT[], sources:SourceT[], balances: any[]) {

		this.m.areas        = areas
		this.m.cats         = cats
		this.m.transactions = transactions
		this.m.sources      = sources
		this.m.balances     = balances

		this.fleshit()
    }




    fleshit() {

		this.m.balances.forEach((b:any) => {
			const s = this.m.sources.find((s:SourceT) => s.id === b.id)!
			s.balance = b.balance
		})

        const checkingAccounts        = this.m.sources.filter(acc            => acc.type === 'checking')
        const savingsAccounts         = this.m.sources.filter(acc            => acc.type === 'savings')
        const creditCardCycleAccounts = this.m.sources.filter(acc            => acc.type === 'creditcardcycle')

		const invoicesAccounts        = this.m.sources.filter(acc            => acc.type === 'receivables')

		let   sourceBucketAccount     = savingsAccounts.find(s               => s.name   === "bucket") as AccountT

        const checkingTotal           = checkingAccounts.reduce((sum, acc)   => sum + acc.balance!, 0);
        const creditCardCycleTotal    = creditCardCycleAccounts.reduce((sum, acc) => sum + acc.balance!, 0);
        const savingsTotal            = savingsAccounts.reduce((sum, acc)    => sum + acc.balance!, 0);
		const invoicesTotal           = invoicesAccounts.reduce((sum, acc)   => sum + acc.balance!, 0);

		let   allLiquidAssets         = checkingTotal + savingsTotal + invoicesTotal
		let   allLiquidDebt           = creditCardCycleTotal

		/*
		allLiquidAssets           = 10000
		allLiquidDebt             = 3000
		*/

		const allAreasBucketInfo  = this.getAllAreasAndCatBucketInfo(this.m.areas, this.m.cats, this.m.transactions);

		const net_taking_into_account_bucket_spending:number     = allLiquidAssets + allAreasBucketInfo.spentAgainstBucketsTotal - allLiquidDebt

		const unspoken_for        = allLiquidAssets - allLiquidDebt - allAreasBucketInfo.bucketsTotal + allAreasBucketInfo.spentAgainstBucketsTotal

        this.sc({
			checkingAccounts,
			creditCardCycleAccounts,
			sourceBucketAccount,
			savingsAccounts,
			invoicesAccounts,
            checkingTotal,
            creditCardCycleTotal,
            savingsTotal,
			invoicesTotal,
			allLiquidAssets,
			allLiquidDebt,
			allAreasBucketInfo,
			net_taking_into_account_bucket_spending,
			unspoken_for
        });
    }




    getAllAreasAndCatBucketInfo(areas:AreaT[], cats:CatT[], transactions:TransactionT[]): AllAreasBucketInfoT {
		let spentAgainstBucketsTotal = 0;
		let remaingAgainstBucketsTotal = 0;
		let bucketsTotal = 0;

		areas.forEach(area => {
			const catBucketsInfo = cat_buckets_info(area, cats, transactions);
			const quad3Totals    = area_quad_bucket_totals(area, catBucketsInfo, 3)
			const quad4Totals    = area_quad_bucket_totals(area, catBucketsInfo, 4)

			spentAgainstBucketsTotal += (quad3Totals.spent + quad4Totals.spent)
			remaingAgainstBucketsTotal += (quad3Totals.remainder + quad4Totals.remainder)
			bucketsTotal += area.bucketquad3 + area.bucketquad4
		});

		return {
			spentAgainstBucketsTotal,
			remaingAgainstBucketsTotal,
			bucketsTotal
		}
    }




	set_source_amount(e:Event) {

		const target              = e.currentTarget as HTMLInputElement
		const id                  = target.dataset.id
		const balance             = target.dataset.balance
		
		const inputField          = document.createElement('input');
		inputField.type           = 'number';
		inputField.placeholder    = 'Enter balance';
		inputField.style.padding  = '4px';
		inputField.style.margin   = '2px';
		inputField.style.width    = '120px';
		inputField.style.fontSize = '14px';
		
		target.parentNode?.insertBefore(inputField, target.nextSibling);
		
		inputField.focus();

		inputField.addEventListener('keyup', async (e) => {
			e.stopPropagation();
			
			if (e.key === 'Enter') {
				const value = (e.target as HTMLInputElement).value;
				
				inputField.remove();

				const httpopts = { method: 'POST', body: JSON.stringify([{ id:id, balance: Number( value ) }]) }
				const r = await $N.FetchLassie('/api/xen/finance/set_source_balances', httpopts) as any
				if (!r.ok) { alert("couldnt get grabems. throwing up"); window.location.href = "/index.html"; return; }

				// this is a hack because CMech is not updating sub els on SSE events
				this.m.sources.find(s => s.id === id)!.balance = Number(value)

				this.fleshit()
			}
		})
	}




    template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; } 
}




customElements.define('vp-finance-balances', VPFinanceBalances);
