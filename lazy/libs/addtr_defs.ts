
import { str, bool, num } from "../../defs_server_symlink.js"
import { YnabTransactionT } from "../../defs_instance_server_symlink.js"
import { AreaT, CatT, SourceT, TagT } from '../../defs.js'

export enum InputModeE { 
	saving = 'saving', 
	saved = 'saved', 
	skipped = 'skipped', 
	deleted = 'deleted', 
	cat = 'cat', 
	note = 'note', 
	tag = 'tag', 
	amount = 'amount', 
	merchant = 'merchant' 
}

export type QuickNoteT = {   amount: number, note: string, ts: number   }

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
    ynab_id: string|null,
	catref: CatT|null,
    notes: string
    amount: number,
    merchant: string,
	tags: TagT[],
    source: SourceT,
	date: number,
    //skipsave: boolean,
	//ignore: boolean,
    //preset_area_id: string|null,
    //preset_cat_name: string|null,
    //tags: number[],
}

export type AttributesT = {
    propa: str,
}

export type ModelT = {
	areas: AreaT[], 
	cats: CatT[], 
	sources: SourceT[], 
	tags: TagT[],
	quick_notes: QuickNoteT[], 
	ynab_transactions: YnabTransactionT[],
	newtransactions: NewTransactionT[], 
}


export type StateT = {
	index: num,
	activetransactions: NewTransactionT[],
	infocus: NewTransactionT,
	infocusindex: num,
    newcount: num,
    inputmode: InputModeE,
	highlightcat: CatT|null,
	highlighttag: TagT|null,
	filteredcats: CatT[],
	filteredtags: TagT[],
	original_amount: num | null
}


