import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Toggle like on a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    // Check if user already liked the post
    type AuthUser = { id?: string } & Record<string, unknown>;
    // session is guaranteed present here (checked above) so extract a non-null userId
    const userId = (session.user as AuthUser).id as string;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      // Unlike: delete the like
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      return NextResponse.json({
        liked: false,
        message: "Post unliked successfully",
      });
    } else {
      // Like: create a new like
      await prisma.like.create({
        data: {
          userId: userId,
          postId: postId,
        },
      });

      return NextResponse.json({
        liked: true,
        message: "Post liked successfully",
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get like count for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const likeCount = await prisma.like.count({
      where: {
        postId: postId,
      },
    });

    // Check if current user liked the post (if authenticated)
    let isLikedByCurrentUser = false;
    const session = await getServerSession(authOptions);

    if (session) {
      type AuthUser = { id?: string } & Record<string, unknown>;
      const userId = (session.user as AuthUser).id as string;

      const userLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: userId,
            postId: postId,
          },
        },
      });

      isLikedByCurrentUser = !!userLike;
    }

    return NextResponse.json({
      likeCount,
      isLikedByCurrentUser,
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
