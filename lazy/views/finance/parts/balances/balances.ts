
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
    prop: string;
}


type StateT = {
	checkingAccounts:AccountT[]
	creditCardAccounts:AccountT[]
	savingsAccounts:AccountT[]
	otherAssets:AccountT[]
	sourceBucketAccount: AccountT
    checkingTotal: string;
    creditCardTotal: string;
    savingsTotal: string;
	allLiquidAssets: number,
	allLiquidDebt: number,
	allAreasBucketInfo: AllAreasBucketInfoT
	net_taking_into_account_bucket_spending: number,
	unspoken_for: number
}


const ATTRIBUTES:AttributesT = { propa: "" }


class VPFinanceBalances extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES }
    m: ModelT = { prop: "" }
    s: StateT = {
		checkingAccounts: [],
		creditCardAccounts: [],
		savingsAccounts: [],
		otherAssets: [],
		sourceBucketAccount: { name: 'Bucket', balance: 0 },
		checkingTotal: "0",
		creditCardTotal: "0",
		savingsTotal: "0",
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




    Show(areas:AreaT[], cats:CatT[], transactions:TransactionT[], sources:SourceT[], ynab_accounts: any[]) {
        const checkingAccounts    = ynab_accounts.filter(acc             => acc.type === 'checking').map(acc   => this.processAccount(acc));
        const savingsAccounts     = ynab_accounts.filter(acc             => acc.type === 'savings').map(acc    => this.processAccount(acc));
		const otherAssets         = [] as AccountT[]
        const creditCardAccounts  = ynab_accounts.filter(acc             => acc.type === 'creditCard').map(acc => this.processAccount(acc));

		const visa36k             = sources.find(s                       =>s.name    === 'visa36k') as SourceT // cause ynab wont let me add it for some dumb reason
		creditCardAccounts.push({ name: 'Visa 36K', balance: visa36k.balance||0 })

		const invoicesAccount     = sources.find(s                       =>s.name    === 'invoices') as SourceT // 
		otherAssets.push({ name: 'Invoices', balance: invoicesAccount.balance||0 })

		let   sourceBucketAccount = savingsAccounts.find(s               =>s.name    === "Main Bucket Savings") as AccountT

        const checkingTotal       = checkingAccounts.reduce((sum, acc)   => sum + acc.balance, 0);
        const creditCardTotal     = creditCardAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const savingsTotal        = savingsAccounts.reduce((sum, acc)    => sum + acc.balance, 0);
		const otherAssetsTotal    = otherAssets.reduce((sum, acc)        => sum + acc.balance, 0);

		let   allLiquidAssets     = checkingTotal + savingsTotal + otherAssetsTotal
		let   allLiquidDebt       = creditCardTotal

		/*
		allLiquidAssets           = 10000
		allLiquidDebt             = 3000
		*/

		const allAreasBucketInfo  = this.getAllAreasAndCatBucketInfo(areas, cats, transactions);


		const net_taking_into_account_bucket_spending:number     = allLiquidAssets + allAreasBucketInfo.spentAgainstBucketsTotal - allLiquidDebt

		const unspoken_for        = allLiquidAssets - allLiquidDebt - allAreasBucketInfo.bucketsTotal + allAreasBucketInfo.spentAgainstBucketsTotal

        this.sc({
			checkingAccounts,
			creditCardAccounts,
			sourceBucketAccount,
			savingsAccounts,
			otherAssets,
            checkingTotal,
            creditCardTotal,
            savingsTotal,
			allLiquidAssets,
			allLiquidDebt,
			allAreasBucketInfo,
			net_taking_into_account_bucket_spending,
			unspoken_for
        });
    }




    processAccount(account: any): AccountT {
        return {
            name: account.name,
            balance: Math.abs(Number((account.balance / 1000).toFixed(0)))
        };
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

    sc(state_changes = {}) {   
        this.s = Object.assign(this.s, state_changes)
        render(this.template(this.s, this.m), this.shadow);   
    }

    template = (_s:StateT, _m:ModelT) => { return html`{--css--}{--html--}`; } 
}




customElements.define('vp-finance-balances', VPFinanceBalances);
