"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function deletePost(id: string) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify that the post belongs to the user
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== session.user.id) {
      throw new Error("Forbidden");
    }

    await prisma.post.delete({
      where: { id },
    });

    revalidatePath('/my-posts');
    revalidatePath('/');
    
    // Return success to allow client-side handling
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}