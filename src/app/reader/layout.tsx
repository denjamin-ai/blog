import { requireUser } from "@/lib/auth";

export default async function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("reader");
  return <>{children}</>;
}
