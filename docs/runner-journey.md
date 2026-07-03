# Runner Journey

## Purpose

The Runner Journey is the progression system for runners inside Platform Sports.

Users complete running challenges to unlock the next shirt level.

The objective is to reward consistency, progression and long-term engagement instead of isolated performances.

---

# Journey Levels

1. Yellow Shirt
2. Orange Shirt
3. Purple Shirt
4. Dark Blue Shirt

Each level must be fully completed before advancing to the next one.

---

# Yellow Shirt

## Challenge 1

### Run 5K under 35 minutes

Rule:

- Distance >= 5 km
- Moving time <= 35 minutes

Notes:

- Runs longer than 5 km also count.

---

## Challenge 2

### Complete a 10K run

Rule:

- Distance >= 10 km

Notes:

- Runs longer than 10 km also count.

---

## Challenge 3

### Run 50 km in 30 days

Rule:

- Sum of all running activities
- Rolling window of the last 30 days

---

## Challenge 4

### Run on 10 different days

Rule:

- Rolling window of the last 30 days
- Only runs >= 5 km count as an active running day

---

## Challenge 5

### Participate in 3 Run Club events

Rule:

- Manual validation by community administrator.

---

# Business Decisions

## 2026-07-03

Approved decisions:

- Runs longer than 5 km count for the 5K challenge.
- Runs longer than 10 km count for the 10K challenge.
- Rolling 30-day window is used for cumulative challenges.
- Active running days require a minimum distance of 5 km.
- Run Club events remain manual.

---

# Future Improvements

Ideas approved for future implementation:

- Store challenge evaluation evidence.
- Allow challenge reprocessing using historical Strava activities.
- Add challenge audit/debug mode.
- Display challenge evidence to users.
