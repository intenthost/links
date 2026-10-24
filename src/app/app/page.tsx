import { cookies } from "next/headers";
import { getAuthSession } from "@/lib/auth";
import {
  getRedirectWorkspace,
  validateWorkspaceSlug,
} from "@/server/actions/workspace/workspace";
import { warmDefaultWorkspaceRedirectCache } from "@/lib/middleware/get-default-workspace-redirect";
import {
  parseWorkspaceSlug,
  WORKSPACE_COOKIE_NAME,
} from "@/lib/workspace-cookie";
import { redirect } from "next/navigation";
import { db } from "@/server/db";

export default async function App() {
  const authResult = await getAuthSession();
  if (!authResult.success) {
    redirect(authResult.redirectTo);
  }

  const { session } = authResult;

  const cookieSlug = parseWorkspaceSlug(
    (await cookies()).get(WORKSPACE_COOKIE_NAME)?.value,
  );
  if (cookieSlug) {
    const validation = await validateWorkspaceSlug(session.user.id, cookieSlug);
    if (validation.success && validation.workspace) {
      redirect(`/${cookieSlug}`);
    }
  }

  let defaultWorkspace = await getRedirectWorkspace(session.user.id);

  if (!defaultWorkspace.success || !defaultWorkspace.workspace) {
    const baseSlug =
      (session.user.name || "intenthost")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "main";
    let candidateSlug = baseSlug;
    let count = 1;
    while (await db.workspace.findUnique({ where: { slug: candidateSlug } })) {
      candidateSlug = `${baseSlug}-${count++}`;
    }

    const created = await db.workspace.create({
      data: {
        name: session.user.name ? `${session.user.name}'s Workspace` : "Intent Host Workspace",
        slug: candidateSlug,
        userId: session.user.id,
        isDefault: true,
      },
    });

    defaultWorkspace = {
      success: true,
      workspace: {
        id: created.id,
        name: created.name,
        slug: created.slug,
        logo: created.logo,
      },
    };
  }

  await warmDefaultWorkspaceRedirectCache(
    session.user.id,
    defaultWorkspace.workspace.slug,
  );

  redirect(`/${defaultWorkspace.workspace.slug}`);
}
