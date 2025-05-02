

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
    arearef: AreaT,
    bucket: number|null,
    budget: number|null,
    name: string,
    parentref: CatT|null,
    subsref: CatT[]|null,
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


export type TransactionT = {
    id: string,
    amount: number,
    arearef: AreaT,
    catref: CatT,
    merchant: string,
    ts: number,
    date: number,
    notes: string,
    sourceref: SourceT,
    tagsref: TagT[]
}

export type CatCalcsT = {
    catref:  CatT,
    subsref: CatCalcsT[]|null,
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
    arearef: AreaT,
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
	monthsref: MonthSnapShotT[],
	avgsref: AvgsSnapShotT[],
}

export type AvgsSnapShotT = {
    arearef: AreaT,
	quad1_spent: number,
	quad2_spent: number,
	quad3_spent: number,
	quad4_spent: number
}

export type FilterT = {
    arearef: AreaT|null,
    parentcatref: CatT|null,
    catref: CatT|null,
    cattags: number[],
    sourceref: SourceT|null,
    tagsref: TagT[]|null,
    daterange: [Date, Date]|null,
    merchant: string|null,
    note: string|null,
    amountrange: [number, number]|null,
}

export type PaymentT = {
    id: string,
    payee: string,
    type: "carloan"|"cylecredit"|"debtpay"|"rent"|"subcription"|"utilities",
    catref: CatT|null,
    recurence: "yearly"|"monthly"|"weekly"|"daily"|"once",
    day: number,
    amount: number,
    varies: boolean,
    is_auto: boolean,
    payment_sourceref: SourceT|null,
    breakdown: Array<string>,
    notes: string
}


export type CatBucketsInfoT = {
	catref: CatT,
	spent: number,
	remainder: number
}


export type AreaQuadBucketTotalsT = {
	spent: number,
	remainder: number,
	assigned: number,
	unassigned: number
}

