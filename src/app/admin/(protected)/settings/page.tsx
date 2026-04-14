import { requireAdmin } from "@/lib/auth";
import { ChecklistTemplateEditor } from "@/components/admin/checklist-template-editor";
import { BlogProfileEditor } from "@/components/admin/blog-profile-editor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Настройки</h1>

      <section className="border border-border rounded-xl p-6">
        <h2 className="text-base font-semibold mb-1">Профиль блога</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Название, описание, аватар и ссылки блога. Используются на главной
          странице, в мета-тегах и RSS.
        </p>
        <BlogProfileEditor />
      </section>

      <section className="border border-border rounded-xl p-6">
        <h2 className="text-base font-semibold mb-1">Чеклист ревью</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Пункты шаблона копируются в каждое новое назначение на ревью. Ревьюер
          отмечает их в процессе работы.
        </p>
        <ChecklistTemplateEditor />
      </section>
    </div>
  );
}
