import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

test('firestore.rules uses rules_version 2 and default-deny global safety net', () => {
  assert.match(rulesContent, /rules_version = '2';/);
  assert.match(rulesContent, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
});

test('firestore.rules covers all 21 collections from firebase-blueprint.json', () => {
  const blueprint = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'firebase-blueprint.json'), 'utf8'));
  const collections = Object.keys(blueprint.firestore).map((p) => p.split('/')[1]);
  for (const col of collections) {
    assert.ok(
      rulesContent.includes(`match /${col}/`),
      `Missing match block for collection: ${col}`
    );
  }
});

test('firestore.rules enforces PII isolation and strict owner list queries (Dirty Dozen #2, #3)', () => {
  // No blanket list on users or studentProfiles
  const usersBlock = rulesContent.match(/match \/users\/\{userId\}[\s\S]*?\n    \}/)?.[0] ?? '';
  assert.ok(!usersBlock.includes('allow list'), 'users collection must not allow list');
  assert.ok(usersBlock.includes('isOwner(userId)'), 'users get must check isOwner');

  // Every private collection allow list checks resource.data.userId == request.auth.uid
  const listRules = rulesContent.match(/allow list:[^\n]+/g) ?? [];
  const privateLists = listRules.filter((line) => !line.includes('isSignedIn();'));
  assert.ok(privateLists.length >= 15, 'All private collections must guard list queries');
  for (const line of privateLists) {
    assert.ok(
      line.includes('resource.data.userId == request.auth.uid'),
      `Insecure allow list rule: ${line}`
    );
  }
});

test('firestore.rules enforces email_verified, isValidId, request.time, and affectedKeys().hasOnly (Dirty Dozen #4–#12)', () => {
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesContent.includes("id.matches('^[a-zA-Z0-9_\\\\-]+$')"));
  assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
  assert.ok(rulesContent.includes('incoming().updatedAt == request.time'));
  assert.ok(rulesContent.includes('affectedKeys().hasOnly('));
  assert.ok(rulesContent.includes("existing().status != 'Completed'"));
});
