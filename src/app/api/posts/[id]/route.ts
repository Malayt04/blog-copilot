import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const serverKey = request.headers.get("x-copilot-server-key");
    const expectedKey = process.env.COPILOTKIT_SERVER_KEY;
    let session = null;
    if (!serverKey || serverKey !== expectedKey) {
      session = await getServerSession(authOptions);

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const title = body.title?.toString().trim();
    const content = body.content?.toString().trim();

    // Allow partial updates: at least one of title or content must be provided
    if ((!title || title.length === 0) && (!content || content.length === 0)) {
      return NextResponse.json(
        { error: "Provide at least a title or content to update" },
        { status: 400 }
      );
    }

    let { id } = params;
    if (/^\d+$/.test(id)) {
      const idx = Math.max(1, parseInt(id, 10));
      const found = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, authorId: true },
        take: 1,
        skip: idx - 1,
      });
      if (!found || found.length === 0) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      id = found[0].id;
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // If no server key was provided we require the session owner to be the author
    if (!serverKey || serverKey !== expectedKey) {
      type AuthUser = { id?: string } & Record<string, unknown>;
      const userId = (session?.user as AuthUser)?.id as string | undefined;

      if (post.authorId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updateData: Partial<{ title: string; content: string }> = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // allow privileged server calls
    const serverKey = request.headers.get("x-copilot-server-key");
    const expectedKey = process.env.COPILOTKIT_SERVER_KEY;
    let session = null;
    if (!serverKey || serverKey !== expectedKey) {
      session = await getServerSession(authOptions);

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let { id } = params;
    if (/^\d+$/.test(id)) {
      const idx = Math.max(1, parseInt(id, 10));
      const found = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, authorId: true },
        take: 1,
        skip: idx - 1,
      });
      if (!found || found.length === 0) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      id = found[0].id;
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!serverKey || serverKey !== expectedKey) {
      type AuthUser = { id?: string } & Record<string, unknown>;
      const userId = (session?.user as AuthUser)?.id as string | undefined;

      if (post.authorId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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
      if (error.code === "P2003") {
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

// Get a single post by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let { id } = params;
    if (/^\d+$/.test(id)) {
      const idx = Math.max(1, parseInt(id, 10));
      const found = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true },
        take: 1,
        skip: idx - 1,
      });
      if (!found || found.length === 0) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      id = found[0].id;
    }

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
