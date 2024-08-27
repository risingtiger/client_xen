

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

type SourceT = {
    id: string,
    ts: number,
    name: string
}

type TagT = {
    id: string,
    area: AreaT,
    name: string
    ts: number,
}

type RawTransactionT = {
    skipsave: boolean,
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

type MonthSnapShotT = {
    area: AreaT,
    month: string,
    bucket: number,
    budget: number,
    savings: number
}
type MonthSnapShotExT = MonthSnapShotT & {
    total: number,
    quad4total: number,
    quad123total: number,
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

type PaymentT = {
    id: string,
    payee: string,
    type: "creditcard"|"creditline"|"carloan"|"bill",
    cat: CatT|null,
    recurence: "yearly"|"monthly"|"weekly"|"daily"|"once",
    day: number,
    amount: number,
    varies: boolean,
    is_auto: boolean,
    payment_source: SourceT|null,
    breakdown: Array<string>,
    notes: string
}





export { AreaT, CatT, SourceT, TagT, RawTransactionT, TransactionT, CatCalcsT, TotalsT, MonthSnapShotT, MonthSnapShotExT, FilterT, PaymentT }
