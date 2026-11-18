# Campus Stores

Campus Stores is a Product Engineer work sample set at a fictional campus media equipment desk. Work through a club’s screening, from equipment pickup to a partial return and the next morning’s handover. Open **Candidate brief** in the app for the assignment.

> **Reviewers: start here.** My answer to the brief is in [Product review](#product-review-would-i-keep-this-product) below, and the prototype is the app itself. Open `index.html`, then use **Restart sample shift** and play the same three moments.

## Run the app

Open `index.html` in a modern browser. The app includes its scripts, styles, and icons and can run offline.

To serve it over local HTTP, run this from the repository folder and visit `http://localhost:8000`.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Each browser stores its own sample shift locally when browser storage is available. **Restart sample shift** restores the fictional starting records. The saved-shift format moved to `campus-stores.shift.v2`, so a shift saved by the original app starts fresh.

---

## Product review: would I keep this product?

**Yes, I'd keep it.** The data model is right: one slip per physical unit, every unit tracked by its own tag. The weak spot is what happens when a kit comes back in pieces. When that happens, the record stops matching the counter.

### One moment it handles well: the 3:45 pm pickup can't go out wrong

**The shift:** Kabir is at the counter at 3:45 pm and the film starts at four. On the original **New issue slip** form I tried issuing the Photo Circle's camera `CA-03` against `RQ-214`. The app refused: *"This equipment type is outside the approved request."* After issuing `AD-12`, I tried to add the second adapter, `AD-15`, to the same request, and it refused again: *"The approved quantity of this equipment type is already on loan."* The projector in the workshop, `PR-06`, and the microphone already on loan, `MI-09`, never appeared as options.

**Why it matters:** under time pressure the clerk can't hand over unapproved kit, a broken unit, or more than was approved. The rules are enforced at the moment a unit leaves the desk, not checked afterwards. **I kept all of these rules.** The new kit form still runs every one of them, and still writes one slip per unit.

### One moment I'd change: the partial return at 7:30 pm loses the adapter

**The shift:** At 7:30 pm Kabir brings back the projector and speaker and says *"Leela still has the adapter. She'll drop it off tomorrow at nine."* The original app gave me only two tools for that:

1. **Record return** on each slip, one click each with no confirmation. I closed `L-402` and `L-403`.
2. The adapter slip `L-404` stayed open, still saying *Kabir Sen · Due Fri 8 pm*. **The slip had no way to record that Leela has it now and has promised it for 9 am.** The only place for that fact was a free-text note in a separate **Desk book** tab.

That breaks the Saturday 9:00 am shift. The new clerk sees `L-404 · AD-12 · RQ-214 · Kabir Sen · Due Fri 8 pm`, with no item type, no overdue flag and no sign of Leela. To learn that `AD-12` is the adapter they have to check **Inventory**. To learn why a stranger is holding it they have to read the **Desk book**. Then **Record return** closes the slip in one click, with no check that the adapter in Leela's hand really is `AD-12`. Both adapters share shelf `C4`, so `AD-15` and `AD-12` are easy to confuse. **The record stopped matching reality at 7:30 pm, and the morning clerk had to rebuild it from three screens and memory.**

### The change: who has it is part of the loan, and returns are matched by tag

Two pieces work together:

1. **Check-in per request.** `Requests → RQ-214 → Check in returns` lists every unit still out on that request. The clerk must mark each one *Back at the desk* or *Still out*. For anything still out they record **who has it now** and **when it is promised**. That writes onto the slip itself (`holder`, `expected`, plus a short history). It also adds an automatic entry to the Desk book, so nobody has to type the handover note.
2. **Return by tag.** The Loan register now opens with *"Something handed back? Type the tag on the unit."* A correct tag shows the slip, the request, who has the unit, its due status and its history, then asks for one confirmation: *Confirm AD-12 is back · shelf C4*. A wrong tag (for example `AD-15`) closes nothing. It explains that `AD-15` should already be on shelf C4, and that the open adapter slip is `AD-12`, held by Leela Das.

Smaller changes in support of the same job:

- **Issue the whole kit in one pass.** The request page has **Issue kit**. It shows one line per approved item, preselects an available unit with its shelf, and defaults *Return by* to the approved time. One submit writes `L-402`, `L-403` and `L-404`. This replaces three trips through the old form while Kabir waits at 3:45. The register's **New issue slip** uses the same form.
- **The request page shows the state of its kit:** each approved item with its unit, slip, holder and status (*Not issued*, *Due Fri 8 pm*, *Overdue*, *Returned Fri 7:30 pm · Kabir Sen*). The list of requests shows a summary badge, such as *2 of 3 out* or *1 overdue*.
- **Desk time is real time.** Slips past their expected time show **Overdue** or **Due now**. The Loan register tab shows a count badge that turns red when anything is overdue.
- **Desk book opens with "Still out right now."** It is a live list of open slips with holder and status, above the messages.
- Register rows show the item type next to the tag (`AD-12 · USB-C → HDMI adapter`), and *originally due Fri 8 pm* when a promise was changed.
- Form errors now appear inside the form, not in the status bar at the bottom of the page.

### Walkthrough: the same job with the change

| Desk time | What I did | What the app shows |
|---|---|---|
| **Fri 3:45 pm** | `Requests → Courtyard screening → Issue kit`. All three lines are ticked with `PR-04 · shelf A2`, `SP-02 · shelf B1` and `AD-12 · shelf C4`; *PR-06 is in the workshop* is noted. Collected by **Kabir Sen**, return by **Fri 8 pm** (prefilled). **Issue ticked units.** | *Issued PR-04, SP-02, AD-12 to Kabir Sen on slips L-402–L-404. Due back Fri 8 pm.* One submit instead of three. |
| **Fri 7:30 pm** | `Check in returns`. PR-04 → *Back at the desk*; SP-02 → *Back at the desk*; AD-12 → *Still out*, **now with Leela Das**, **expected Sat 9 am**. **Save check-in.** | *2 returned · AD-12 still out with Leela Das.* Slip L-404 now reads *With Leela Das (collected by Kabir Sen) · Due Sat 9 am*. The Desk book gets an automatic check-in entry. |
| **Sat 9:00 am** | New clerk opens **Desk book**. *Still out right now* reads `AD-12 · USB-C → HDMI adapter · RQ-214 Film Society · With Leela Das · Due now`. | The clerk knows what to expect before Leela speaks. |
| | Leela hands over an adapter. **Loan register**, type the tag on its label. If they type **AD-15** by mistake: | *AD-15 has no open slip — it should already be on shelf C4. Open adapter slips: AD-12 on L-404, Leela Das (RQ-214).* Nothing is closed. |
| | Type **AD-12** → **Confirm AD-12 is back · shelf C4** (handed in by Leela Das, prefilled). | *AD-12 back on shelf C4. Slip L-404 closed. RQ-214 kit complete.* The Desk book logs it, and the request shows *All returned*. |

If the 7:30 pm clerk skips check-in and closes slips one by one the old way, nothing is lost. By morning `L-404` shows **Overdue · due Fri 8 pm**, the register badge turns red, and the request shows *1 overdue*. The gap is visible instead of silent.

### What I kept, and why

- **One slip per physical unit**, the approval and quantity rules, and keeping repair units out of the issue form. These already stop the expensive mistakes.
- **The Desk book** as the place where people talk to each other. Check-ins and returns now post to it automatically, but clerks can still leave free-text notes.
- The four-tab layout, the visual language, the offline single-file build, and local storage. The change fits into the existing screens rather than adding a new one.
- I left out barcode scanning, editing slips after the fact, and accounts. The tag box is where a scanner would plug in, but typing the tag already tests the behaviour that matters: matching the object in hand to a slip.

### One observation at a real counter that would tell me it helped

On the morning after a partial return, **watch the moment a late item is handed over.** Does the clerk close the right slip from the Loan register alone, without opening the Desk book, checking Inventory, or calling the previous shift? Count a "yes" when they get from *item in hand* to *correct slip closed* without leaving the register. Before the change, I'd expect almost every such return to involve at least one of those detours. If the change works, most won't, and the slips closed will match the tags on the returned units.

---

## Source

- `index.html` contains the desk layout, candidate brief, and bundled icons.
- `app.js` contains the sample records and interactions: kit issue, per-request check-in, return by tag, and due-time tracking.
- `styles.css` defines the desktop and mobile layouts.

Icon license notices are in [third-party/lucide-LICENSE.txt](third-party/lucide-LICENSE.txt).

## Submit your work

1. [Fork Campus Stores](https://github.com/virinchi-healthcare/campus-stores/fork) into your GitHub account. Complete the candidate brief and push your changes to your public fork. In your README, point reviewers to your work and explain the decision you made.
2. In your fork, open **Commits**, select the final commit you want reviewed, and copy the page URL. It should look like `https://github.com/YOUR-USERNAME/campus-stores/commit/COMMIT-SHA`.
3. [Submit your work through the Google Form](https://docs.google.com/forms/d/e/1FAIpQLScvzoh1R4WS-SkiwAVBQbMvniieJYSoOEfLMyVo5CyjOvYUgQ/viewform). Your **roll number**, **email ID**, and **final commit link from your public fork** are required. Enter your roll number and email ID in the form only.
