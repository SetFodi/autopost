'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireAdmin } from '@/lib/admin/auth'
import {
  deleteSubmissionPermanently,
  type DeleteSubmissionActionState,
} from '@/lib/admin/delete-submission'

const deleteSubmissionSchema = z.object({
  id: z.string().uuid(),
  confirmation: z
    .string()
    .trim()
    .regex(/^AP-[A-F0-9]{10}$/),
})

export async function deleteSubmissionAction(
  _previousState: DeleteSubmissionActionState,
  formData: FormData,
): Promise<DeleteSubmissionActionState> {
  await requireAdmin()

  const parsed = deleteSubmissionSchema.safeParse({
    id: formData.get('id'),
    confirmation: formData.get('confirmation'),
  })

  if (!parsed.success) {
    return {
      kind: 'error',
      message: 'დასადასტურებლად ზუსტად შეიყვანეთ განაცხადის საჯარო კოდი.',
      storageRemoved: false,
    }
  }

  const result = await deleteSubmissionPermanently(parsed.data)

  if (!result.ok) {
    const messages: Record<typeof result.stage, string> = {
      configuration:
        'წაშლა დროებით მიუწვდომელია კონფიგურაციის გამო. არაფერი წაშლილა.',
      lookup:
        'წაშლისთვის საჭირო მონაცემები ვერ შემოწმდა. არაფერი წაშლილა; სცადეთ თავიდან.',
      confirmation:
        'საჯარო კოდი არ ემთხვევა. არაფერი წაშლილა; გადაამოწმეთ კოდი.',
      storage:
        'ფოტოების წაშლა ვერ დასრულდა. მონაცემთა ჩანაწერი შენარჩუნებულია; სცადეთ თავიდან.',
      database:
        'ფოტოები წაიშალა, მაგრამ მონაცემთა ჩანაწერის წაშლა ვერ დადასტურდა. კვლავ სცადეთ — განმეორება უსაფრთხოა.',
    }

    return {
      kind: 'error',
      message: messages[result.stage],
      storageRemoved: result.storageRemoved,
    }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/${parsed.data.id}`)
  redirect('/admin')
}
