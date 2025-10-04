import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get all comments for a post
export async function GET(request: NextRequest, context: any) {
  try {
    // context.params can be a plain object or a Promise resolving to the params
    const rawParams = (context as any).params;
    const resolvedParams =
      rawParams && typeof rawParams.then === "function"
        ? await rawParams
        : rawParams;
    const { id: postId } = (resolvedParams as { id: string }) || {};

    if (!postId) {
      console.error(
        "POST /api/posts/[id]/comments called without postId. context:",
        context
      );
      return NextResponse.json(
        { error: "Post id (params.id) is required" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId: postId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new comment
export async function POST(request: NextRequest, context: any) {
  try {
    // context.params can be a plain object or a Promise resolving to the params
    const rawParams = (context as any).params;
    const resolvedParams =
      rawParams && typeof rawParams.then === "function"
        ? await rawParams
        : rawParams;
    const { id: postId } = (resolvedParams as { id: string }) || {};

    if (!postId) {
      return NextResponse.json(
        { error: "Post id is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Make sure we have the user ID from the session
    let userId = session.user.id;
    
    // If the session doesn't carry an id, try to resolve the user by email
    if (!userId && session.user.email) {
      console.log("Session doesn't have user ID, attempting to find user by email:", session.user.email);
      const userByEmail = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (!userByEmail) {
        console.error("User not found by email:", session.user.email);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      userId = userByEmail.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User id not available on session" },
        { status: 400 }
      );
    }

    console.log("Creating comment with userId:", userId, "and postId:", postId);

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: userId,
        postId: postId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log("Comment created successfully:", comment.id);

    return NextResponse.json({ comment });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    // More specific error logging
    if (error.code === 'P2002') {
      // Unique constraint violation
      return NextResponse.json({ error: "Duplicate entry error" }, { status: 400 });
    } else if (error.code === 'P2003') {
      // Foreign key constraint violation
      return NextResponse.json({ error: "Invalid reference error" }, { status: 400 });
    } else if (error.code === 'P2025') {
      // Record doesn't exist
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    
    // Return more specific error for debugging
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
