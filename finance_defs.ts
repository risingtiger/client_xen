
type AreaT = {
    id: string,
    bucket: number,
    name: string,
    longname: string,
    ynab_savings: number,
    ts: number
}

type CatT = {
    id: string,
    area: AreaT,
    budget: number|null,
    name: string,
    parent: CatT|null,
    subs: CatT[]|null,
    tags: number[],
    ts: number,
    transfer_state: 0|1|2
}

type TagT = {
    id: string,
    ts: number,
    name: string
}

type SourceT = {
    id: string,
    ts: number,
    name: string
}

type RawTransactionT = {
    skipsave: boolean,
    amount: number,
    ynab_id: string|null,
    cat_id: string|null,
    merchant: string,
    notes: string
    source_id: string,
    tags: number[],
    ts: number,
}

type TransactionT = {
    id: string,
    amount: number,
    area: AreaT,
    cat: CatT,
    merchant: string,
    ts: number,
    notes: string,
    source: SourceT,
    tags: TagT[]
}

type CatCalcsT = {
    cat:  CatT,
    subs: CatCalcsT[]|null,
    sums: Array<number>,
    budget: number,
    med:  number,
    avg:  number,
}

type TotalsT = {
    sums: Array<number>,
    budget: number,
    med: number,
    avg: number,
}

type SummaryT = {
    bucket: number,
    bucket_budget_diff: number,
    bucket_sum_diff: number,
    savings: number
}

type FilterT = {
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






export { AreaT, CatT, TagT, SourceT, RawTransactionT, TransactionT, CatCalcsT, TotalsT, SummaryT, FilterT }
