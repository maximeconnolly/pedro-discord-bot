/**
 * Given local challenge rows and the remote list from CTFd, classify each remote
 * challenge as "new", "changed", or "unchanged", and decide if the solved state
 * needs to flip. Pure function so it can be unit-tested without Discord or DB.
 *
 * @param {Array} localRows - Rows from `challenges` table for a CTF
 * @param {Array} remoteList - [{ id, name, category, value }]
 * @param {Set<number>} solvedIds - Set of CTFd challenge ids solved by our team
 * @returns {{ toCreate, toUpdate, toMarkSolved, unchanged }}
 */
export function diffChallenges(localRows, remoteList, solvedIds) {
  const localById = new Map(localRows.map((r) => [r.ctfd_challenge_id, r]));

  const toCreate = [];
  const toUpdate = [];
  const toMarkSolved = [];
  let unchanged = 0;

  for (const remote of remoteList) {
    const local = localById.get(remote.id);
    const solved = solvedIds.has(remote.id);

    if (!local) {
      toCreate.push({ remote, solved });
      continue;
    }

    const fieldsChanged =
      local.name !== remote.name ||
      (local.category ?? null) !== (remote.category ?? null) ||
      (local.points ?? null) !== (remote.value ?? null);
    const solvedChanged = local.solved !== solved;

    if (fieldsChanged) {
      toUpdate.push({ local, remote, solved });
    } else if (solvedChanged) {
      toMarkSolved.push({ local, remote, solved });
    } else {
      unchanged += 1;
    }
  }

  return { toCreate, toUpdate, toMarkSolved, unchanged };
}
