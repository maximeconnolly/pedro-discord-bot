import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffChallenges } from '../src/services/ctfd/challenges.js';

test('classifies new challenges', () => {
  const local = [];
  const remote = [{ id: 1, name: 'A', category: 'web', value: 100 }];
  const { toCreate, toUpdate, toMarkSolved, unchanged } = diffChallenges(local, remote, new Set());
  assert.equal(toCreate.length, 1);
  assert.equal(toCreate[0].solved, false);
  assert.equal(toUpdate.length, 0);
  assert.equal(toMarkSolved.length, 0);
  assert.equal(unchanged, 0);
});

test('marks newly-created challenges solved if in solved set', () => {
  const local = [];
  const remote = [{ id: 7, name: 'A', category: 'pwn', value: 250 }];
  const { toCreate } = diffChallenges(local, remote, new Set([7]));
  assert.equal(toCreate[0].solved, true);
});

test('detects field changes', () => {
  const local = [
    { ctfd_challenge_id: 1, name: 'A', category: 'web', points: 100, solved: false },
  ];
  const remote = [{ id: 1, name: 'A', category: 'web', value: 200 }];
  const { toUpdate, unchanged } = diffChallenges(local, remote, new Set());
  assert.equal(toUpdate.length, 1);
  assert.equal(unchanged, 0);
});

test('detects solved flip without other changes', () => {
  const local = [
    { ctfd_challenge_id: 1, name: 'A', category: 'web', points: 100, solved: false },
  ];
  const remote = [{ id: 1, name: 'A', category: 'web', value: 100 }];
  const { toMarkSolved, toUpdate, unchanged } = diffChallenges(local, remote, new Set([1]));
  assert.equal(toMarkSolved.length, 1);
  assert.equal(toUpdate.length, 0);
  assert.equal(unchanged, 0);
});

test('counts unchanged correctly', () => {
  const local = [
    { ctfd_challenge_id: 1, name: 'A', category: 'web', points: 100, solved: true },
  ];
  const remote = [{ id: 1, name: 'A', category: 'web', value: 100 }];
  const { unchanged, toUpdate, toMarkSolved } = diffChallenges(local, remote, new Set([1]));
  assert.equal(unchanged, 1);
  assert.equal(toUpdate.length, 0);
  assert.equal(toMarkSolved.length, 0);
});

test('ignores remotely-missing local challenges', () => {
  const local = [
    { ctfd_challenge_id: 99, name: 'Ghost', category: 'misc', points: 50, solved: false },
  ];
  const remote = [{ id: 1, name: 'A', category: 'web', value: 100 }];
  const result = diffChallenges(local, remote, new Set());
  assert.equal(result.toCreate.length, 1);
  assert.equal(result.toUpdate.length, 0);
  assert.equal(result.unchanged, 0);
});
