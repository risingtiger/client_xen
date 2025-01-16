
//import { $NT } from "../../../../../defs_client_symlink.js"
import {  } from "../../../../../defs_server_symlink.js"
import { AreaT, CatT, TransactionT, SourceT } from "../../../../../defs.js"
import { area_quad_bucket_totals, cat_buckets_info } from "../../../../libs/financefuncs_bucket.js"

declare var render: any;
declare var html: any;
//declare var $N: $NT;


type AccountT = {
    name: string;
    balance: number;
}


type AllAreasBucketInfoT = {
	spentAgainstBucketsTotal: number;
	buckets: { name: string, amount:number}[]
}


type Model = {
    prop: string;
}


type State = {
	checkingAccounts:AccountT[]
	creditCardAccounts:AccountT[]
	savingsAccounts:AccountT[]
	sourceBucketAccount: AccountT
    checkingTotal: string;
    creditCardTotal: string;
    savingsTotal: string;
	allAreasBucketInfo: AllAreasBucketInfoT
	netTotal: number
}

class VPFinanceBalances extends HTMLElement {
    s: State
    m: Model
    shadow: ShadowRoot

    constructor() {   
        super(); 

        this.m = {
            prop: "",
        }

        this.s = {
			checkingAccounts: [],
			creditCardAccounts: [],
			savingsAccounts: [],
			sourceBucketAccount: { name: 'Bucket', balance: 0 },
            checkingTotal: "0",
            creditCardTotal: "0",
            savingsTotal: "0",
			allAreasBucketInfo: { spentAgainstBucketsTotal: 0, buckets: [] },
			netTotal: 0
        } 

        this.shadow = this.attachShadow({mode: 'open'});
    }

    async connectedCallback() {   
        this.sc()
        this.dispatchEvent(new Event('hydrated'))
    }

    Show(areas:AreaT[], cats:CatT[], transactions:TransactionT[], sources:SourceT[], ynab_accounts: any[]) {
        const checkingAccounts = ynab_accounts.filter(acc => acc.type === 'checking').map(acc => this.processAccount(acc));
        const savingsAccounts = ynab_accounts.filter(acc => acc.type === 'savings').map(acc => this.processAccount(acc));
        const creditCardAccounts = ynab_accounts.filter(acc => acc.type === 'creditCard').map(acc => this.processAccount(acc));

		const visa36k = sources.find(s=>s.name === 'visa36k') as SourceT // cause ynab wont let me add it for some dumb reason
		creditCardAccounts.push({ name: 'Visa 36K', balance: visa36k.balance||0 })

		let   sourceBucketAccount = savingsAccounts.find(s=>s.name === "Main Bucket Savings") as AccountT

        const checkingTotal = checkingAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const creditCardTotal = creditCardAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const savingsTotal = savingsAccounts.reduce((sum, acc) => sum + acc.balance, 0);

		const allAreasBucketInfo = this.getAllAreasAndCatBucketInfo(areas, cats, transactions);

		const netTotal:number = checkingTotal + allAreasBucketInfo.spentAgainstBucketsTotal - creditCardTotal

        this.sc({
			checkingAccounts,
			creditCardAccounts,
			sourceBucketAccount,
			savingsAccounts,
            checkingTotal,
            creditCardTotal,
            savingsTotal,
			allAreasBucketInfo,
			netTotal 
        });
    }

    processAccount(account: any): AccountT {
        return {
            name: account.name,
            balance: Math.abs(Number((account.balance / 1000).toFixed(0)))
        };
    }




    getAllAreasAndCatBucketInfo(areas:AreaT[], cats:CatT[], transactions:TransactionT[]): AllAreasBucketInfoT {
		let totalSpent = 0;
		let buckets:{name:string, amount:number}[] = [];

		areas.forEach(area => {
			const catBucketsInfo = cat_buckets_info(area, cats, transactions);
			const quad3Totals    = area_quad_bucket_totals(area, catBucketsInfo, 3)
			const quad4Totals    = area_quad_bucket_totals(area, catBucketsInfo, 4)
			totalSpent          += (quad3Totals.spent + quad4Totals.spent) 

			buckets.push({ name: area.name + 'quad3', amount: area.bucketquad3 })
			buckets.push({ name: area.name + 'quad4', amount: area.bucketquad4 })
		});

		return { spentAgainstBucketsTotal: totalSpent, buckets }
    }

    sc(state_changes = {}) {   
        this.s = Object.assign(this.s, state_changes)
        render(this.template(this.s, this.m), this.shadow);   
    }

    template = (_s:State, _m:Model) => { return html`{--css--}{--html--}`; } 
}

customElements.define('vp-finance-balances', VPFinanceBalances);
