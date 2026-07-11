# AutoPost data-deletion SOP

Use this procedure for a customer deletion request or another approved reason
to remove a completed submission. The operation is irreversible. AutoPost does
not automatically delete completed submissions on a guessed schedule; the
operator must adopt and document a fixed period before enabling one.

## 1. Verify the request

1. Pause fulfillment and do not send or publish any additional material.
2. Ask for the public submission reference (for example `AP-1234567890`).
3. Verify control of the phone/WhatsApp channel recorded on the submission. Do
   not ask the requester to resend vehicle photos as identity evidence.
4. If the reference and channel do not match, stop and resolve the mismatch
   before opening the delete control.

Record only the minimum operational evidence required by the operator's policy.
Do not copy the phone number, photos, or free-text form contents into an
unprotected deletion log.

## 2. Remove separately managed deliverables

If a private Drive/preview folder was created, remove that folder and any copies
managed outside AutoPost. The application can delete only its Supabase source
objects and database records; a saved delivery URL cannot delete an external
provider's files.

## 3. Delete in AutoPost

1. Sign in with the exact email configured as `ADMIN_EMAIL`.
2. Find the submission and open its protected detail page.
3. In **Danger zone**, choose **წაშლის დაწყება**.
4. Read the irreversible-deletion notice and type the exact public reference.
5. Choose **შეუქცევადად წაშლა** once. Wait for completion; do not close the
   page while the button says that deletion is in progress.

The server authenticates and allow-lists the admin again for this mutation. It
loads the reference and tracked paths from the database, removes the private
Storage objects through the Storage API, and only then issues the database
delete. The database statement atomically removes the submission and cascaded
file rows. Linked analytics events contain no customer form values and become
unlinked through `ON DELETE SET NULL`.

## 4. Handle a partial failure

- **Photo/Storage failure:** the database has not been changed. Retry from the
  same dialog. If it repeats, check Supabase Storage status/logs and bucket
  permissions before retrying; do not delete the database row manually.
- **Photos deleted, database deletion unconfirmed:** retry from the same dialog.
  The server first checks whether the row is already gone; a retry is safe
  because deleting an already-absent Storage object is idempotent. Do not
  re-upload the customer's photos.
- **Configuration unavailable:** verify the server-only Supabase secret and
  project URL in the deployment environment. No deletion has started.
- **Submission not found:** search by the exact reference. It may already have
  been deleted by another authorized request; do not recreate it.

Never delete rows directly from `storage.objects`. Supabase Storage metadata and
the underlying object store must be changed through the Storage API together.

## 5. Verify completion

After AutoPost returns to the admin list:

1. Search for the public reference and confirm no result appears.
2. Reopen the old `/admin/{submission-id}` URL and confirm it returns the
   not-found state.
3. In Supabase Storage, confirm the submission's
   `submissions/{submission-id}/` prefix contains no objects.
4. Confirm any external Drive/preview folder was removed.
5. Reply through the verified channel that deletion is complete. Do not include
   internal IDs, secret URLs, or screenshots of other submissions.
