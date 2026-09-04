import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { AIQuestionGeneratorService } from "@/lib/services/aiQuestionGenerator";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Authenticate and authorize admin
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: "Forbidden. Admin role required." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { topicId, topicName, categorySlug, difficulty, type } = body;

    if (!topicId || !topicName || !categorySlug || !difficulty || !type) {
      return NextResponse.json(
        { success: false, message: "Missing required generation parameters (topicId, topicName, categorySlug, difficulty, type)" },
        { status: 400 }
      );
    }

    // 2. Trigger generation and validation service
    const genResult = await AIQuestionGeneratorService.generate(
      topicId,
      topicName,
      categorySlug,
      difficulty,
      type
    );

    return NextResponse.json({
      success: genResult.success,
      questionId: genResult.questionId,
      validation: genResult.validation
    });

  } catch (err: any) {
    console.error("[Admin AI Generate POST] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to generate AI question" },
      { status: 550 }
    );
  }
}
