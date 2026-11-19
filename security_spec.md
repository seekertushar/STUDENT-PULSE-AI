# StudentPulse AI Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict Owner Isolation**: Every private student record (`users`, `studentProfiles`, `careerGoals`, `studentSkills`, `academicRecords`, `assessments`, `projects`, `certifications`, `activities`, `interviews`, `interviewFeedback`, `recommendations`, `learningRoadmaps`, `actionPlans`, `actionPlanTasks`, `progressRecords`, `studentAchievements`, `learningStreaks`, `notifications`) MUST contain `userId == request.auth.uid` and can only be read, queried, updated, or deleted by its verified owner.
2. **No Cross-Student PII Leaks**: `users/{userId}` and `studentProfiles/{userId}` forbid blanket reads (`allow read: if isSignedIn()` is banned) and forbid any list queries across accounts.
3. **Immutable Ownership & Creation Timestamps**: `userId` and `createdAt` can never change on update. `createdAt == request.time` on create; `updatedAt == request.time` on update.
4. **Reference Data Protection**: `careerRequirements` and `achievements` are read-only reference datasets for authenticated users; client writes are denied.
5. **Path Variable Hardening & Volumetric Caps**: Every single-document operation enforces `isValidId(docId)` (`^[a-zA-Z0-9_\-]+$`, `<= 128` chars), strict `hasOnly`/`hasAll` key checks, bounded string sizes, and bounded array sizes.
6. **Verified Email Mandate**: Write operations require `request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Identity Spoofing on Create**: User A writes to `/studentSkills/skill_1` with `{ userId: "user_B", ... }`.
2. **Cross-User PII Read**: User A attempts `get` on `/studentProfiles/user_B`.
3. **Blanket List Scraping**: User A runs an unfiltered `list` query on `/studentSkills` attempting to read User B's records.
4. **Shadow Ghost Field Injection**: User A creates `/projects/proj_1` with extra field `isAdmin: true`.
5. **Immutable Owner Tampering**: User A updates `/studentSkills/skill_1` changing `userId` to `"user_B"`.
6. **Backdated Timestamp Spoofing**: User A creates `/academicRecords/rec_1` with client-supplied past timestamp instead of `request.time`.
7. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to write `/studentProfiles/user_A`.
8. **ID Poisoning**: User A writes to `/projects/../../evil$id` or a 200-character document ID.
9. **String Exhaustion (Denial of Wallet)**: User A writes a 50,000-character string into `Project.description`.
10. **Array Exhaustion**: User A writes 50 items into `Project.technologies` (limit 20).
11. **Reference Catalog Tampering**: User A attempts to overwrite `/careerRequirements/java-developer`.
12. **Terminal State Violation / Value Poisoning**: User A updates `/actionPlanTasks/task_1` with numeric `title: 12345` or invalid `status: "Hacked"`.
