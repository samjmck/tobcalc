# Degiro transactions export guide

*Note: screenshots are from degiro.fr, in French. Language cannot be changed for Belgian account holders on degiro.fr*

## Preamble: TOB handling with Degiro

If you opened your account:
* on [degiro.nl](https://www.degiro.nl) or [degiro.fr](https://www.degiro.fr), TOB **may** already be handled automatically by Degiro. If this is the case, you don't need to declare it by yourself.
* on any other Degiro website, TOB **may not** be handled automatically by Degiro.

### How do I know if Degiro is already declaring TOB for me?

#### Verify if TOB declaration is enabled

1. On the left bar, click on the `my account` logo and `fiscal information`

![Degiro My Account > Tax Information](../images/degiro-checktob-fiscal-menu.png)

2. Check the status of `manual management` switch for the TOB. If it is **`disabled`**, Degiro takes care of TOB for you

![Degiro TOB Management screen](../images/degiro-checktob-tob-management-status.png)


*Note: if you change this switch, it only applies starting from the 1st of the next month (as TOB is declared on a monthly or bimonthly basis)*

#### Verify if TOB was paid on your transactions

This can be seen in the `account` page:

1. On the left bar, click on `Mail` > `Account`

![Degiro account menu](../images/degiro-checktob-tob-account-menu.png)

2. On your account statement, you should have one line for TOB for each transaction executed. The `Belgian TOB` line should be immediately above the corresponding transaction (buy or sell).

![Degiro account TOB example](../images/degiro-checktob-tob-account-example.png)

The `amount` column on the `Belgian TOB` lines contains the amount of the TOB paid on the transaction.

## How to export transactions for `tobcalc` on Degiro

Once you are sure you need to declare the TOB yourself, follow these steps:

1. Login to your Degiro dashboard
2. On the left bar, click on `Mail` > `Transactions`

![Degiro transactions menu](../images/degiro-menu-transactions.png)

3. On the `Transactions` screen, select the start date of the TOB period (`from` field) and the end date of the TOB period (`to` field). Make sure the `aggregate orders` function is **disabled** as TOB declarations requires indicating the exact number of transactions done on the period.

![Degiro set transactions log dates](../images/degiro-transactions-set-dates.png)

4. Click on the `export` button

![Degiro transactions export button](../images/degiro-transactions-export-button.png)

5. Select `CSV` as export format on the export window

![Degiro transactions export button](../images/degiro-transactions-export-window.png)

6. The downloaded file is to be used as input to `tobcalc` with the `DEGIRO` broker selection