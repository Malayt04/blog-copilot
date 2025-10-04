import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditPostForm } from "@/components/edit-post-form";

async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
        },
      },
    },
  });

  return post;
}

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const post = await getPost(params.id);

  if (!post) {
    notFound();
  }

  if (post.author.id !== session.user.id) {
    redirect("/");
  }

  return <EditPostForm post={post} />;
}
