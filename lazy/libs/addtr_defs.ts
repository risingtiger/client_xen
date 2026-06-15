
import { str, bool, num } from "../../defs_server_symlink.js"
import { SheetsTransactionT } from "../../defs_instance_server_symlink.js"
import { AreaT, CatT, SourceT, TagT } from '../../defs.js'

export enum InputModeE { 
	initial = 'initial',
	saving = 'saving', 
	saved = 'saved', 
	skipped = 'skipped', 
	deleted = 'deleted', 
	cat = 'cat', 
	note = 'note', 
	tag = 'tag', 
	amount = 'amount', 
	merchant = 'merchant',
	date = 'date' 
}


export type RawNewTransactionT = {
    amount: number,
    merchant: string,
    ynab_id: string|null,
    notes: string
    tags: number[],
	date: number,
    source_id: string,
    preset_cat_name: string|null
}

export type NewTransactionT = {
    sheets_id: string|null,
	catref: CatT|null,
    notes: string
    amount: number,
    merchant: string,
    merchant_long: string,
	tags: TagT[],
    source: SourceT,
	date: number,
}

export type AttributesT = {
	propa: str,
}

export type SourceFilterModeT = 'hide_visafam' | 'show_all'

export type ModelT = {
	areas: AreaT[], 
	allcats: CatT[],
	cats: CatT[], 
	sources: SourceT[], 
	tags: TagT[],
	sheet_transactions: SheetsTransactionT[],
	allnewtransactions: NewTransactionT[],
	newtransactions: NewTransactionT[], 
}


export type StateT = {
	index: num,
	activetransactions: NewTransactionT[],
	infocus: NewTransactionT,
	infocusindex: num,
    inputmode: InputModeE,
	highlightcat: CatT|null,
	highlighttag: TagT|null,
	filteredcats: CatT[],
	filteredtags: TagT[],
	original_amount: num | null,
	sourcefiltermode: SourceFilterModeT,
}
