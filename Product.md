# Lisbon weekend planner

## What the product is

Six friends (Lina, Jonas, Sara, Malik, Chloé and Tomás) are planning a long weekend in an Alfama apartment in Lisbon. Until now they used a group chat and a shared sheet. Decisions got buried in the chat, the sheet only held yes / no, and Lina, the organiser, kept everything else in her head.

This prototype replaces both. It is one mobile web page, shared by link, where the group:

- **Picks a weekend.** Everyone answers yes / no / partial for 6–9, 13–16 and 20–23 Nov. Anyone can propose a weekend, and Lina confirms it. Tapping a weekend previews it on the whole page, under a "Preview, not picked" banner.
- **Sees who's there when.** A Fri–Mon strip for each person shows their nights and their arrival and departure times. Someone has to check in on Friday between 15:00 and 22:00; the page shows who can and warns only if nobody can.
- **Sees what each person pays.** The apartment is €900 for 3 nights, so €300 a night, split between whoever stays that night. Each person enters their own travel cost. Budget warnings appear once a cost is entered.
- **Plans each day.** Each day lists who's there and who isn't. Ideas from the sheet get a day and a time of day, and each one shows who misses it.
- **Tracks open decisions.** Every decision has an owner. Settled decisions are locked, and only Lina can reopen them.

### Out of scope

Booking, payments, flight search, a backend and logins.

### How it works

- **No login.** Each visitor picks their name and can only edit their own answers, dates and travel cost.
- **No backend.** The whole plan is stored in the link, so sharing the link shares the plan. A copy is also kept in the browser.
- **Fixed details can't be edited:** €900, 3 nights, check-in 15:00–22:00.

### Data from the group

| | Lina | Jonas | Sara | Malik | Chloé | Tomás |
|---|---|---|---|---|---|---|
| Lives in | Berlin | Berlin | Amsterdam | Paris | Paris | Madrid |
| Budget | €450 | €400 | €320 | €500 | €380 | €350 |
| 6–9 Nov | yes | no | yes | no | yes | yes |
| 13–16 Nov | yes | partial | yes | yes | yes | yes |
| 20–23 Nov | yes | yes | yes | yes | no | yes |

- **Jonas, 13–16:** he is on call until Sat 12:00 Berlin time, so the earliest he can reach Lisbon is Sat 17:00. He stays 2 nights (Sat, Sun).
- **Tomás, 13–16:** two flight options.
  - Lands 22:45, so he reaches the apartment at 23:30.
  - Lands 21:05 for €50 more, so he reaches it at 21:50 and can do check-in.
  - Both arrival times include 45 minutes from the airport.
- **Ideas:**
  - Sintra day trip (Malik; full day, train about €5)
  - Pastéis de Belém (Chloé)
  - Free walking tour (Sara; Friday?)
  - Fado (Tomás; Saturday night)

### What each person pays

| Weekend | Who comes | Each pays for the apartment |
|---|---|---|
| 6–9 Nov | 4 (no Jonas, no Malik) | €225 |
| 13–16 Nov | 6 | €160, Jonas €100 |
| 20–23 Nov | 5 (no Chloé) | €180 |

## Where the build went wrong

The first version looked complete, but a lot of it was built on guesses. Four rounds of amendments were needed, and most of the fixes were about putting the group's real situation back in.

### 1. Data was invented instead of taken from the group

- I set the trip in Porto. It's Lisbon.
- I made up budgets, flight prices and personal constraints ("Sara flies home Sunday", "Malik can't make Friday"). None of them came from the chat or the sheet, and some contradicted it: the sheet has Malik saying yes to 13–16.
- I didn't ask for the sheet until the second round. The real budgets were different from the invented ones.

**Lesson:** a prototype built on made-up data shows the wrong problems. Ask for the source data first.

### 2. Group decisions were turned into defaults

- I treated the dates as fixed, when picking the weekend was the group's main open question.
- I picked a way to split the cost myself. Later I offered "equal or by nights", but the group's rule was simply €300 a night, shared by whoever stays that night.
- Any single person could settle a group choice on their own. There was no proposal, no confirmation, and no protection for decisions already confirmed.

**Lesson:** the product is about decisions, so the prototype has to show who proposed what, who confirmed it, and what is still open.

### 3. The rules didn't match how people actually travel

- Late arrivals were flagged as errors. Only one person needs to make check-in.
- Arrival was the moment a flight landed. Getting from the airport takes 45 minutes.
- Jonas "arrived" at Sat 12:00, which is when his on-call shift ends in Berlin, not when he reaches Lisbon.
- Times were in whole hours, so Tomás's 21:05 flight didn't fit.
- Nights were worked out from arrival times. A late arrival changed what people paid, and missing times had to be guessed as "staying all 3 nights".

**Lesson:** nights decide the cost. Arrival times only matter for check-in and for which plans someone misses.

### 4. "Unknown" was shown as a fact

- Everyone started with a made-up arrival of Fri 15:00, though nobody had told us their times.
- Checkout was shown as 11:00, when nobody knew the real time.
- Ideas had no time of day, so the app couldn't show that Tomás and Jonas miss the Friday walking tour.

**Lesson:** say "not set" or "not confirmed" until it is.

### 5. Details that should be fixed or structured weren't

- The apartment price could be edited.
- A vote was stored as a line of text, not as yes / no per person.
- People who couldn't come were still counted as missing ideas.

### 6. The build was never looked at on a phone

The build and code checks always passed, and the cost rules were checked with scripts. But the page was never viewed at 375px, because the browser needed for screenshots can't run on the development machine. **The mobile layout is still not verified.**

### 7. My clarifying questions steered the answers

Each round started with up to three questions. Each question came with a "recommended" answer, and those recommendations carried my assumptions: fixed dates, a default split, everyone arriving Fri 15:00. Most were accepted and then had to be undone in a later amendment.

## Amendments

### Amendment 1: match the chat and sheet

1. City is Lisbon (Alfama apartment).
2. Dates are undecided: show the three weekends with yes / no / partial per person, and let the group pick one.
3. Budgets come from the sheet. Travel costs start empty and each person fills in their own. Budget warnings show only once a cost is entered.
4. Times are in 15-minute steps. Tomás picks between his two flights.
5. Only one person has to make check-in. Late arrivals are not an error.
6. The split rule is a group decision. Add the question "Does Jonas pay for 2 nights?".
7. Ideas come from the sheet with who added them, and each idea shows who misses it.
8. Seed the real open decisions.
9. Invalid times are not saved.
10. The link carries the plan, plus a copy in the browser.

### Amendment 2: fixes

1. Ideas get a time of day (morning, afternoon, evening or full day).
2. Arrival is landing plus 45 minutes. Jonas can't arrive before Sat 17:00.
3. Only Tomás's times come from the chat. Everyone else's start as "not set".
4. Votes are yes / no per person, and each decision shows who hasn't answered.
5. The weekend and the split rule are proposals that Lina confirms.
6. Owners: Tomás (his flight, booking fado), Malik (Sintra), Jonas (his 2 nights), Lina the rest.
7. Checkout reads "11:00, not confirmed".
8. A clear banner shows when a weekend is only being previewed.
9. Tomás's +€50 flight adds to his costs.

### Amendment 3: nights, absences, locked details

1. Everyone stays 3 nights by default and Jonas stays 2 on 13–16. €300 a night is split between whoever stays. Arrival times don't change nights. The split rule choice and the Jonas vote were removed.
2. Constraints apply per weekend. Anyone who can't come isn't there, pays nothing, and doesn't count for check-in or ideas.
3. Fixed details and confirmed decisions are locked. Only Lina can reopen a decision.
4. Tomás is unchanged: arriving at 21:50 counts for check-in.

## Still open

- **Mobile layout:** check it at 375px in a real browser.
- **Editing at the same time:** two people editing separately don't merge; the last shared link wins. A real version needs a shared backend.
- **Unconfirmed assumptions:**
  - Mon 18:00 is the latest departure.
  - 11:00 is the checkout time.
  - The times of day for the ideas.
  - 45 minutes from the airport.
- **Continuous stays:** a stay has to be one block of nights, so nobody can skip a night in the middle.
