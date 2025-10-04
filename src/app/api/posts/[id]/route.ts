import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    type AuthUser = { id?: string } & Record<string, unknown>;
    const userId = (session?.user as AuthUser)?.id as string | undefined;

    if (post.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
      },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    type AuthUser = { id?: string } & Record<string, unknown>;
    const userId = (session?.user as AuthUser)?.id as string | undefined;

    if (post.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    
    // Handle Prisma-specific errors (like foreign key constraint violations)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2003: Foreign key constraint error
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: "Cannot delete post due to existing related records" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
