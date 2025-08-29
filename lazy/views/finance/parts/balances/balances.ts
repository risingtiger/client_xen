
import { $NT, CMechLoadedDataT } from "../../../../../defs_client_symlink.js"
import { num } from "../../../../../defs_server_symlink.js"
import { AreaT, CatT, TransactionT, SourceT, FilterT } from "../../../../../defs_instance_server_symlink.js"
import { area_quad_bucket_totals, cat_buckets_info } from "../../../../libs/financefuncs_bucket.js"
import { filter_transactions } from "../../../../libs/financefuncs_sortfilter.js"
import { CatCalcs, CatCalcTotals  } from '../../../../libs/financefuncs_catcalcs.js'

declare var render: any;
declare var html: any;
declare var $N: $NT;


type AccountT = {
    name: string;
    balance: number;
}

type SourceExpT = SourceT & { deduced_balance: number }


type AllAreasBucketInfoT = {
	spentAgainstBucketsTotal: number;
	remaingAgainstBucketsTotal: number;
	bucketsTotal: number;
}

export type AttributesT = {
	area_id: string,
	burnrateleft:string
}

type AreaStatT = {
	arearef: AreaT,
	sumtotal_12combined: number,
	sumtotal_123combined: number
	burnrate: number,
	burnrateleft: number,
}


type AllAreaStatsT = { sumtotal_12combined: number, sumtotal_123combined: number, burnrate: number, burnrateleft: number }

type ModelT = {
    areas: AreaT[],
    area: AreaT,
	cats: CatT[],
	sources: SourceT[],
	transactions: TransactionT[],
	sources_creditcardcycle: SourceExpT[],
	sources_savings: SourceExpT[],
	sources_checking: SourceExpT[],
	sources_receivables: SourceExpT[],
	balances: {id:string, balance:number}[]
	available_this_month: number,
	burnrateleft:number,
	assets:number,
	creditcardcyclebalance:number,
	area_stats: AreaStatT[],
	allarea_stats: AllAreaStatsT
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


const ATTRIBUTES:AttributesT = { area_id: "", burnrateleft:"" }


class VPFinanceBalances extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES }
    m: ModelT = {
		available_this_month: 0,
		areas: [],
		area:{} as AreaT,
		cats:[],
		transactions: [],
		burnrateleft:0,
		sources: [],
		sources_creditcardcycle:[],
		sources_savings:[],
		sources_checking:[],
		sources_receivables:[],
		balances:[],
		assets: 0,
		creditcardcyclebalance: 0,
		area_stats: [],
		allarea_stats: { sumtotal_12combined: 0, sumtotal_123combined: 0, burnrate: 0, burnrateleft: 0 }
    }
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

		const balances = await $N.FetchLassie("/api/xen/finance/sheets/get_balances")
		if (!balances.ok) {   alert ("could not get balances"); return; }

		this.m.balances = balances.data as {balance:number, id:string}[]

		await $N.CMech.ViewPartConnectedCallback(this)
		this.dispatchEvent(new Event('hydrated'));
    }




	async attributeChangedCallback(name:string, oldval:string|boolean|number, newval:string|boolean|number) {
		await $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
		this.parsevalues()
		this.sc();
	}




	disconnectedCallback() {   
		$N.CMech.ViewPartDisconnectedCallback(this);   
	}




	kd = (loadeddata: CMechLoadedDataT, _loadstate:string) =>  {
		this.m.areas        = loadeddata.get("1:areas")! as AreaT[]
		this.m.sources      = loadeddata.get("1:sources") as SourceT[]
		this.m.transactions = loadeddata.get("1:transactions") as TransactionT[]
		this.m.cats         = loadeddata.get("1:cats") as CatT[]

		this.parsevalues()
	}




	parsevalues = () => {

		const add_live_balance = (sources: SourceT[]): SourceExpT[] => {
			return sources.map(s => {
				const bal = this.m.balances.find(b => b.id === s.id)
				if (!bal) {
					return {...s, deduced_balance: s.balance || 0}
				}
				return {...s, deduced_balance: bal.balance}
			})
		}

		const thismonth     = new Date()
		thismonth.setUTCDate(1)
		thismonth.setUTCHours(0, 0, 0, 0)

		const daterange_thismonth = [new Date(thismonth), new Date(thismonth)]

		const filter_template:FilterT = { arearef: null, parentcatref: null, catref: null, sourceref: null, tagsref: null, daterange: null, merchant: null, note: null, amountrange: null, cattags: [] };

		this.m.area_stats = []
		this.m.allarea_stats = { sumtotal_12combined: 0, sumtotal_123combined: 0, burnrate: 0, burnrateleft: 0 }

		this.m.areas.forEach(area => {
			const filter_area:FilterT = { ...filter_template, daterange: [daterange_thismonth[0], daterange_thismonth[1]], arearef: area }
			const filtered_transactions = filter_transactions(this.m.transactions, filter_area)
			// Compute combined stats for cattags [1,2]
			const catcalcs12 = CatCalcs(filtered_transactions, area, [1,2], this.m.cats, [daterange_thismonth[0], daterange_thismonth[0]])
			const totals12 = CatCalcTotals(catcalcs12, area, [1,2])
			const sumtotal_12combined = totals12.sums[totals12.sums.length - 1]
			const burnrate = area.unfixedcosts + totals12.costs
			const burnrateleft = burnrate - sumtotal_12combined
			// Compute combined stats for cattags [1,2,3]
			const catcalcs123 = CatCalcs(filtered_transactions, area, [1,2,3], this.m.cats, [daterange_thismonth[0], daterange_thismonth[0]])
			const totals123 = CatCalcTotals(catcalcs123, area, [1,2,3])
			const sumtotal_123combined = totals123.sums[totals123.sums.length - 1]
			this.m.area_stats.push({
				arearef: area,
				sumtotal_12combined: Math.round(sumtotal_12combined),
				burnrate: Math.round(burnrate),
				burnrateleft: Math.round(burnrateleft),
				sumtotal_123combined: Math.round(sumtotal_123combined)
			})

			// accumulate totals for all areas
			this.m.allarea_stats.sumtotal_12combined += Math.round(sumtotal_12combined)
			this.m.allarea_stats.sumtotal_123combined += Math.round(sumtotal_123combined)
			this.m.allarea_stats.burnrate += Math.round(burnrate)
			this.m.allarea_stats.burnrateleft += Math.round(burnrateleft)
		})

		// area is being ignored for now. I'll circle back to it
		this.m.area  = this.m.areas.find((a:AreaT)=>a.id===this.a.area_id) as AreaT


		this.m.sources_creditcardcycle = add_live_balance(this.m.sources.filter(s => s.type === 'creditcardcycle'))
		this.m.sources_savings = add_live_balance(this.m.sources.filter(s => s.type === 'savings'))
		this.m.sources_checking = add_live_balance(this.m.sources.filter(s => s.type === 'checking'))
		this.m.sources_receivables = add_live_balance(this.m.sources.filter(s => s.type === 'receivables'))

		this.m.assets = this.m.sources_checking.reduce((acc, s)    => acc + s.deduced_balance, 0) + 
						this.m.sources_savings.reduce((acc, s)     => acc + s.deduced_balance, 0) + 
						this.m.sources_receivables.reduce((acc, s) => acc + s.deduced_balance, 0)

		this.m.burnrateleft         = Number(this.a.burnrateleft)
		this.m.creditcardcyclebalance = this.m.sources_creditcardcycle.reduce((acc, s) => acc + s.deduced_balance, 0)
		this.m.available_this_month = this.m.assets - this.m.creditcardcyclebalance - this.m.burnrateleft

	}



    sc(state_changes = {}) {   
        this.s = Object.assign(this.s, state_changes)
        render(this.template(this.s, this.m), this.shadow);   
    }




    fleshit() {

		// this.m.balances.forEach((b:any) => {
		// 	const s = this.m.sources.find((s:SourceT) => s.id === b.id)!
		// 	s.balance = b.balance
		// })
		//
		//       const checkingAccounts        = this.m.sources.filter(acc            => acc.type === 'checking')
		//       const savingsAccounts         = this.m.sources.filter(acc            => acc.type === 'savings')
		//       const creditCardCycleAccounts = this.m.sources.filter(acc            => acc.type === 'creditcardcycle')
		//
		// const invoicesAccounts        = this.m.sources.filter(acc            => acc.type === 'receivables')
		//
		// let   sourceBucketAccount     = savingsAccounts.find(s               => s.name   === "bucket") as AccountT
		//
		//       const checkingTotal           = checkingAccounts.reduce((sum, acc)   => sum + acc.balance!, 0);
		//       const creditCardCycleTotal    = creditCardCycleAccounts.reduce((sum, acc) => sum + acc.balance!, 0);
		//       const savingsTotal            = savingsAccounts.reduce((sum, acc)    => sum + acc.balance!, 0);
		// const invoicesTotal           = invoicesAccounts.reduce((sum, acc)   => sum + acc.balance!, 0);
		//
		// let   allLiquidAssets         = checkingTotal + savingsTotal + invoicesTotal
		// let   allLiquidDebt           = creditCardCycleTotal
		//
		// /*
		// allLiquidAssets           = 10000
		// allLiquidDebt             = 3000
		// */
		//
		// const allAreasBucketInfo  = this.getAllAreasAndCatBucketInfo(this.m.areas, this.m.cats, this.m.transactions);
		//
		// const net_taking_into_account_bucket_spending:number     = allLiquidAssets + allAreasBucketInfo.spentAgainstBucketsTotal - allLiquidDebt
		//
		// const unspoken_for        = allLiquidAssets - allLiquidDebt - allAreasBucketInfo.bucketsTotal + allAreasBucketInfo.spentAgainstBucketsTotal
		//
		//       this.sc({
		// 	checkingAccounts,
		// 	creditCardCycleAccounts,
		// 	sourceBucketAccount,
		// 	savingsAccounts,
		// 	invoicesAccounts,
		//           checkingTotal,
		//           creditCardCycleTotal,
		//           savingsTotal,
		// 	invoicesTotal,
		// 	allLiquidAssets,
		// 	allLiquidDebt,
		// 	allAreasBucketInfo,
		// 	net_taking_into_account_bucket_spending,
		// 	unspoken_for
		//       });
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
