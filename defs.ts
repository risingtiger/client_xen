

import { bool, num, str } from "./defs_server_symlink.js"



export type AreaT = {
    id: string,
	bucketquad3: number,
	bucketquad3_ref_ts: number,
	bucketquad4: number,
	bucketquad4_ref_ts: number,
    name: string,
    longname: string,
    ts: number
}

export type CatT = {
    id: string,
    area: AreaT,
    bucket: number|null,
    budget: number|null,
    name: string,
    parent: CatT|null,
    subs: CatT[]|null,
    tags: number[],
    ts: number,
    transfer_state: 0|1|2
}

export type SourceT = {
    id: string,
    ts: number,
    name: string
	balance: number|null
}

export type TagT = {
    id: string,
    name: string,
	sort: number,
    ts: number,
}

export type RawTransactionT = {
    skipsave: boolean,
	ignore: boolean,
    preset_area_id: string|null,
    preset_cat_name: string|null,
    ynab_id: string|null,
    amount: number,
    cat_id: string|null,
    cat_name: string|null,
    tag_ids: string[],
    tag_names: string[],
    merchant: string,
    notes: string
    source_id: string,
    tags: number[],
    ts: number,
}

export type TransactionT = {
    id: string,
    amount: number,
    area: AreaT,
    cat: CatT,
    merchant: string,
    ts: number,
    date: number,
    notes: string,
    source: SourceT,
    tags: TagT[]
}

export type CatCalcsT = {
    cat:  CatT,
    subs: CatCalcsT[]|null,
    sums: Array<number>,
    budget: number,
    med:  number,
    avg:  number,
}
export type CatCalcsTotalsT = {
    sums: Array<number>,
    budget: number,
    med: number,
    avg: number,
}

export type MonthSnapShotT = {
    area: AreaT,
    month: string,
	issaved:bool,
	quad1_budget: number,
	quad2_budget: number,
	quad3_budget: number,
	quad4_budget: number,
	quad1_spent: number,
	quad2_spent: number,
	quad3_spent: number,
	quad4_spent: number
}

export type SnapShotsT = {
	months: MonthSnapShotT[],
	avgs: AvgsSnapShotT[],
}

export type AvgsSnapShotT = {
    area: AreaT,
	quad1_spent: number,
	quad2_spent: number,
	quad3_spent: number,
	quad4_spent: number
}

export type FilterT = {
    area: AreaT|null,
    parentcat: CatT|null,
    cat: CatT|null,
    cattags: number[],
    source: SourceT|null,
    tags: TagT[]|null,
    daterange: [Date, Date]|null,
    merchant: string|null,
    note: string|null,
    amountrange: [number, number]|null,
}

export type PaymentT = {
    id: string,
    payee: string,
    type: "carloan"|"cylecredit"|"debtpay"|"rent"|"subcription"|"utilities",
    cat: CatT|null,
    recurence: "yearly"|"monthly"|"weekly"|"daily"|"once",
    day: number,
    amount: number,
    varies: boolean,
    is_auto: boolean,
    source: SourceT|null,
    breakdown: Array<string>,
    notes: string
}


export type CatBucketsInfoT = {
	cat: CatT,
	spent: number,
	remainder: number
}


export type AreaQuadBucketTotalsT = {
	spent: number,
	remainder: number,
	assigned: number,
	unassigned: number
}

