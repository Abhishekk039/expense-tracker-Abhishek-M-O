# Expense Tracker

Expense Tracker is a responsive personal finance dashboard for recording income and expenses, monitoring spending, and understanding monthly cash flow at a glance. It combines a polished lavender dashboard interface with practical transaction management, local data persistence, budget tracking, and interactive monthly and daily expense charts.

The application runs entirely in the browser, so transactions are stored locally using `localStorage` and remain available when the user returns to the page. No backend or account setup is required.

## Features

* Dashboard overview with total income, total expenses, and current balance
* Add, edit, and delete income or expense transactions
* Expense and income categories with quick-entry controls
* Search, type filtering, category filtering, and transaction sorting
* Monthly budget progress and spending status
* Month selector with monthly income, expense, and net savings totals
* Interactive year-level expense chart
* Select a month to view day-by-day expenses against the daily budget
* Scrollable daily chart for months with many days
* Category-based expense breakdown for the selected month
* CSV export for transaction records
* Client-side validation, confirmation dialogs, and toast notifications
* Responsive layout for desktop, tablet, and mobile screens
* Local Storage persistence with no server-side database

## Technologies

* HTML5
* CSS3 with responsive layouts and custom dashboard styling
* Vanilla JavaScript (ES6+)
* Browser Local Storage API

## Usage

1. Choose **Income** or **Expense**.
2. Enter an amount, category, date, and optional description.
3. Select **Add Transaction** to update the dashboard.
4. Use the month chart to open the day-wise expense and budget view.
5. Use the filters, search field, or CSV export action to manage your records.

## How to Run

1. Clone the repository.
2. Open the project folder.
3. Open `index.html` in a browser.

Alternatively, use VS Code Live Server.

## Project Structure

```
index.html   # Application structure and dashboard markup
style.css    # Theme, layout, responsive styles, and chart visuals
script.js    # Transaction logic, persistence, calculations, and interactions
favicon.svg  # Browser tab icon
README.md    # Project documentation
```
