


//import { num } from "../../../defs_server_symlink.js";
import { TransactionT, FilterT  } from '../..//defs.js'




function filter_transactions(transactions:TransactionT[], filter:FilterT) : TransactionT[] {

    const daterange = { begin: 0, end: 0 }

    if (filter.daterange) {
        const end_of_last_month = new Date(filter.daterange[1])

        end_of_last_month.setUTCMonth( end_of_last_month.getUTCMonth() + 1 )

        const end_of_last_month_ts = end_of_last_month.getTime() - 1000

        daterange.begin = Math.floor(filter.daterange[0].getTime() / 1000)
        daterange.end = Math.floor(end_of_last_month_ts / 1000)
    }

    return transactions.filter((transaction:TransactionT) => {

        if (filter.arearef && transaction.arearef !== filter.arearef) { return false }
        if (filter.catref && transaction.catref !== filter.catref) { return false }
        if (filter.cattags && filter.cattags.length && !transaction.catref.tags.some((t:number) => filter.cattags.includes(t))) { return false }
        if (filter.parentcatref && transaction.catref.parentref !== filter.parentcatref) { return false }
        if (filter.sourceref && transaction.sourceref !== filter.sourceref) { return false }
        if (filter.tagsref && !filter.tagsref.every(tag=> transaction.tagsref.find(t_tag=> t_tag === tag))) { return false }
        if (filter.daterange && (transaction.date < daterange.begin || transaction.date > daterange.end)) { return false }
        if (filter.merchant && !transaction.merchant.toLowerCase().includes(filter.merchant)) { return false }
        if (filter.note && !transaction.notes.toLowerCase().includes(filter.note)) { return false }
        if (filter.amountrange && (transaction.amount < filter.amountrange[0] || transaction.amount > filter.amountrange[1])) { return false }

        return true
    })
}




function sort_transactions(transactions:TransactionT[], sort_by:string, sort_direction:string) : TransactionT[] {

    return transactions.sort((a:TransactionT, b:TransactionT) => {

        if (sort_by === "amount") {
            return sort_direction === "asc" ? a.amount - b.amount : b.amount - a.amount
        }

        if (sort_by === "cat") {
            return sort_direction === "asc" ? a.catref.name.localeCompare(b.catref.name) : b.catref.name.localeCompare(a.catref.name)
        }

        if (sort_by === "merchant") {
            return sort_direction === "asc" ? a.merchant.localeCompare(b.merchant) : b.merchant.localeCompare(a.merchant)
        }

        if (sort_by === "source") {
            return sort_direction === "asc" ? a.sourceref.name.localeCompare(b.sourceref.name) : b.sourceref.name.localeCompare(a.sourceref.name)
        }

        if (sort_by === "notes") {
            return sort_direction === "asc" ? a.notes.localeCompare(b.notes) : b.notes.localeCompare(a.notes)
        }

        if (sort_by === "tags") {
            return sort_direction === "asc" ? a.tagsref.join().localeCompare(b.tagsref.join()) : b.tagsref.join().localeCompare(a.tagsref.join())
        }

        if (sort_by === "date") {
            return sort_direction === "asc" ? a.date - b.date : b.date - a.date
        }

        return 0
    })
}




function current_month_of_filtered_transactions(filtered_transactions:TransactionT[], month:Date) : TransactionT[] {

    const m = new Date(month)

    const month_start_ts = m.getTime() / 1000

    const month_end_ts = m.setUTCMonth(m.getUTCMonth() + 1) / 1000 - 1

    const daterange = { begin: Math.floor(month_start_ts), end: Math.floor(month_end_ts) }

    return filtered_transactions.filter((transaction:TransactionT) => {
        return transaction.date >= daterange.begin && transaction.date < daterange.end
    }) 
}




export { filter_transactions, sort_transactions, current_month_of_filtered_transactions }


