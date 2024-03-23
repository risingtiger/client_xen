
type AreaT = {
    id: string,
    name: string,
    longname: string,
    ts: number
}

type CatT = {
    id: string,
    area: AreaT,
    bucket: { diffs: number[], val: number },
    budget: number|null,
    name: string,
    parent: CatT|null,
    subs: CatT[]|null,
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
    id: string,
    amount: number,
    long_desc: string,
    short_desc: string,
    cat?: CatT,
    sourcename:string,
    source?: SourceT,
    note: string
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
    cat: CatT,
    subs: CatCalcsT[]|null,
    sums: Array<number>
}

type GroupCalcsT = {
    name: string,
    parentcats: string[],
    subcats: string[],
    sums: Array<number>
}

type FilterT = {
    area: AreaT|null,
    parentcat: CatT|null,
    cat: CatT|null,
    source: SourceT|null,
    tags: TagT[]|null,
    daterange: [Date, Date]|null,
    merchant: string|null,
    note: string|null,
    amountrange: [number, number]|null,
}





export { AreaT, CatT, TagT, SourceT, RawTransactionT, TransactionT, CatCalcsT, GroupCalcsT, FilterT }
