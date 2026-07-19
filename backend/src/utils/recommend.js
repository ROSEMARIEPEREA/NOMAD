import { DateTime } from "luxon";
import { overlaps } from "./conflict.js";

const BUSINESS_START_HOUR = 8; // 8am local time
const BUSINESS_END_HOUR = 18; // 6pm local time
const SLOT_STEP_MINUTES = 30;

/**
 * Recommends meeting slots where ALL given users are simultaneously free,
 * checked against each user's OWN local business hours (not a shared
 * arbitrary window) -- this is what makes it a time-zone-aware
 * recommendation rather than a naive shared calendar lookup.
 *
 * @param {Array<{id:number, time_zone:string, schedules:Array}>} users
 * @param {number} durationMinutes
 * @param {number} searchDays - how many days ahead to search
 * @param {number} maxResults - how many candidate slots to return
 */
export function recommendSlots(users, durationMinutes, searchDays = 7, maxResults = 3) {
  const now = DateTime.utc().plus({ hours: 1 }).set({ minute: 0, second: 0, millisecond: 0 });
  const results = [];

  for (let step = 0; step < (searchDays * 24 * 60) / SLOT_STEP_MINUTES && results.length < maxResults; step++) {
    const candidateStart = now.plus({ minutes: step * SLOT_STEP_MINUTES });
    const candidateEnd = candidateStart.plus({ minutes: durationMinutes });

    const allUsersFree = users.every((user) => {
      // Check the candidate falls within THIS user's own local business hours
      const localStart = candidateStart.setZone(user.time_zone);
      const localEnd = candidateEnd.setZone(user.time_zone);
      const withinBusinessHours =
        localStart.hour >= BUSINESS_START_HOUR &&
        localEnd.hour <= BUSINESS_END_HOUR &&
        localStart.hasSame(localEnd, "day") &&
        localStart.weekday <= 5; // Mon-Fri

      if (!withinBusinessHours) return false;

      // Check no conflict with this user's existing schedule
      const hasConflict = user.schedules.some((s) =>
        overlaps(candidateStart.toISO(), candidateEnd.toISO(), s.start_time, s.end_time)
      );
      return !hasConflict;
    });

    if (allUsersFree) {
      results.push({
        start_time: candidateStart.toUTC().toISO(),
        end_time: candidateEnd.toUTC().toISO(),
        per_user_local: Object.fromEntries(
          users.map((u) => [
            u.id,
            candidateStart.setZone(u.time_zone).toFormat("ccc, LLL d, h:mm a"),
          ])
        ),
      });
    }
  }

  return results;
}
