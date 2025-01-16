


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

        if (filter.area && transaction.area !== filter.area) { return false }
        if (filter.cat && transaction.cat !== filter.cat) { return false }
        if (filter.cattags && filter.cattags.length && !transaction.cat.tags.some((t:number) => filter.cattags.includes(t))) { return false }
        if (filter.parentcat && transaction.cat.parent !== filter.parentcat) { return false }
        if (filter.source && transaction.source !== filter.source) { return false }
        if (filter.tags && !filter.tags.every(tag=> transaction.tags.find(t_tag=> t_tag === tag))) { return false }
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
            return sort_direction === "asc" ? a.cat.name.localeCompare(b.cat.name) : b.cat.name.localeCompare(a.cat.name)
        }

        if (sort_by === "merchant") {
            return sort_direction === "asc" ? a.merchant.localeCompare(b.merchant) : b.merchant.localeCompare(a.merchant)
        }

        if (sort_by === "source") {
            return sort_direction === "asc" ? a.source.name.localeCompare(b.source.name) : b.source.name.localeCompare(a.source.name)
        }

        if (sort_by === "notes") {
            return sort_direction === "asc" ? a.notes.localeCompare(b.notes) : b.notes.localeCompare(a.notes)
        }

        if (sort_by === "tags") {
            return sort_direction === "asc" ? a.tags.join().localeCompare(b.tags.join()) : b.tags.join().localeCompare(a.tags.join())
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


