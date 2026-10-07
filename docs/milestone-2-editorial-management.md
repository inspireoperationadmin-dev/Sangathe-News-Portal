# Milestone 2 — Editorial Management

This milestone completes the Phase 1 newsroom, category and homepage management work. AI assistance and advertising remain excluded.

## Newsroom workflow

- Reporters save drafts and submit their own stories for review.
- Sub Editors start editing submitted stories, return them with a required explanation, or submit completed edits into a separate final-approval queue.
- News Editors and Administrators return, approve, schedule, publish, update, correct and archive stories.
- Invalid state changes are rejected by server actions, even when a request bypasses the user interface.
- The newsroom dashboard provides role-specific queue counts.
- Breaking, Developing and Exclusive editorial labels are controlled by News Editors and Administrators.
- Every save records a revision and an audit event. Corrections require a public correction note; returns require an internal revision note.

## Category management

- Administrators can create, edit, reorder and delete Tamil categories.
- A category can be assigned to a top-level parent to form a subcategory.
- Categories containing articles or child categories cannot be deleted.
- Slugs remain unique for Tamil content and are validated on the server.

## Homepage management

- News Editors and Administrators can choose one lead story and six ordered featured stories.
- Only published Tamil stories can be selected.
- Empty positions automatically fall back to the latest published stories.
- Editors can enable and order category sections. Each section shows its latest four published stories.
- Homepage changes are recorded in the audit log and immediately revalidate the public homepage.

## Acceptance checks

1. A reporter cannot approve or publish an article.
2. A return is rejected when it has no revision/return note.
3. A Sub Editor cannot edit published or archived content.
4. A News Editor cannot publish an unapproved existing article.
5. Only Administrators can manage categories.
6. Editors and Administrators can manage homepage placement.
7. Duplicate homepage article selections are rejected.
8. Deleting a non-empty category is rejected.
9. The homepage stays populated when no manual lead or featured story is selected.
