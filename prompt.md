
# Objective
- create a 'edit_cat' (edit category) web component within the 'lazy/views/finance/parts' folder.

## Mimic Edit Transaction
- mimic the 'edit_transaction' component. The following are aspects of the 'edit_transaction' that should be copied or mimic. 
    - mimic the file structure and files: for example the html file should be: 'lazy/views/finance/parts/edit_cat/edit_cat.html'
    - mimic the location (put the 'edit_cat' folder underneath the finance/parts folder)
    - mimic the UI and UX. Make sure it appears in a popup and is the layout is very similar to 'edit_transaction'.
    - utilze c-ol2 component for popup. utilize c-in2 component for getting user input. 
    - in the kd function (knit data function), pull from loadeddata the "1:cats"
    - mimic the prop_updated function of 'edit_transaction' for the logic in updating data from user action

## User UI and UX Criteria
- I want you to ONLY allow editing of children categories, NOT parent categories. 
- I want you to allow choosing a parent for a child category. 
- The tags property of categories is an array. It might be empty. If it contains elements the first element is ALWAYS the quadrant specification. It will be either 1, 2, 3 or 4. Give the user the option of setting it to 1, 2, 3 or 4.
- Give the user the option of changing the following properties o the cat object: budget (number), name (string with length limit of 16), parent (parent category reference), tags (array of numbers). 
- Only give the option of editing the first element of the tags array. 

## HTML Criteria
- Use the c-in2 component for all user choices
- Use the c-in2 component type of 'dselect' for the parent category and the quadrant choice.
- Use the c-in2 component type of 'number' for the budget choice

## Typescript logic Criteria
- when updating data within the prop_updated function, mostly update changed object and call LocalDBSync.Patch('cats/'...) to update the database (which will update local and remote).
- when updating tags call a custom API endpoint called '/api/xen/finance/update_category_tag'


## Keep in mind:
- Categories are multidimensional. That is, there are parent categores and then children categories of that parent. 
- defs.ts file contains definitions of most relavant object types. Read that file

