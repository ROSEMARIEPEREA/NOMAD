// Two schedule entries conflict if their [start, end) intervals overlap.
// Because all times are stored as UTC in the DB, this check is time-zone
// agnostic -- conversion only happens when DISPLAYING times to a user.
export function overlaps(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(startB) < new Date(endA);
}

export async function findConflicts(Schedule, userId, startTime, endTime, excludeId = null) {
  const existing = await Schedule.findAll({ where: { user_id: userId } });
  return existing.filter((entry) => {
    if (excludeId && entry.id === excludeId) return false;
    return overlaps(startTime, endTime, entry.start_time, entry.end_time);
  });
}
