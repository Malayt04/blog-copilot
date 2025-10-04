import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreatePostForm } from "@/components/create-post-form";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const post = await prisma.post.findUnique({
    where: {
      id: params.id,
      authorId: session.user.id, // Ensure user can only edit their own posts
    },
  });

  if (!post) {
    redirect("/"); // Redirect if post doesn't exist or user doesn't have permission
  }

  // Pass the post data to the form
  return <CreatePostForm initialPost={post} />;
}