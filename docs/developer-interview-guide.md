# ChartTiles developer interview guide

## Outreach message

> Hi [Name], I saw your work on [App]. I’m building ChartTiles, an open-source
> project for working with NOAA chart data in web apps. I’d like to hear how
> your team gets chart data into the app and keeps it up to date. Would you
> have 30 minutes for a call in the next couple of weeks?
>
> Thanks,
>
> Ivan

## Interview · 30 minutes

Use this with someone who builds or maintains a marine web app. Ask about a
recent piece of work before showing ChartTiles. If they can walk you through
a ticket, a release, or their current setup, follow that example and use the
questions as prompts.

### Open · 2 minutes

> Thanks for making time. I’m working on ChartTiles, and I’d like to understand
> how your team handles chart data today. I’m especially interested in the last
> time you had to add, update, or troubleshoot it. Is it OK if I take notes?

### Walk through the last example · 13 minutes

1. What does your app do, and where does chart data fit into it?
2. Think of the last time you added, updated, or debugged chart data. What
   kicked that off? Can you walk me through what you did?
3. Where did the data come from? What did your team have to do between getting
   it and putting it in front of users?
4. Which part took the most time? Who got pulled in? What happened if the work
   was delayed?
5. How often does that come up? What have you already tried to make it easier?

If they’ve never added chart data, ask about the last time they considered it
and what made them defer it.

### Check the two hypotheses · 7 minutes

Use these as follow-ups after you’ve heard what they bring up on their own.

- **Feature identity.** Has anyone needed to save, share, or come back to a
  specific chart feature? Can you remember the last time? How did they find it
  again?
- **Verified updates.** Walk me through your last chart update. How did you
  know there was an update, check that it was usable, and decide to roll it
  out? What would you do if the new release had a problem?

If their biggest problem is getting an initial integration working or delivering
an offline package, ask them to walk through that work too.

### Ask about budget and a next step · 8 minutes

- What did that work cost in staff time or vendor spend, roughly?
- Has the team set aside time or money to fix it? Who decides whether that
  work gets funded?
- What would a small trial have to accomplish in your app for the team to
  keep using it?

If they’ve described a concrete problem, close with a specific next step.

> Would you be up for a short follow-up to try one chart task in your app? We
> could pick the task, agree on what would count as success, and include whoever
> owns that work.

## After the call

Log the date, role, current setup, specific incident, frequency, cost or staff
time, budget owner, and any agreed next step. Capture one short quote privately.
Keep names and contact details out of the [evidence log](implementation-plan.md#evidence-log).

After five developer interviews, use the examples to choose the pilot. If a
pilot team needs saved or shared feature references to keep working across zooms
and tiles, that points to Slice 2. If a team has a budgeted problem checking and
rolling out chart updates, that points to Slice 3. If neither surfaces, revisit
the buyer hypothesis before starting the next slice.
[Decision criteria](implementation-plan.md#choosing-between-slice-2-and-slice-3)
