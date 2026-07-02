import { NextResponse } from "next/server";
import { verifyDeveloperKey } from "@/lib/developer-auth";
import { calculatePlacementProbability } from "@/lib/ai/placement-probability";

export const dynamic = "force-dynamic";

/**
 * POST /api/developer/predict-placement
 * Authorizes with developer API key, returning predictive metrics and explanations.
 */
export async function POST(request: Request) {
  try {
    // 1. Verify developer authentication
    const auth = await verifyDeveloperKey(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.errorMsg || "Forbidden." },
        { status: 401 }
      );
    }

    // 2. Parse payload body
    const body = await request.json().catch(() => ({}));
    const { atsScore, mockInterviewsAvg, projectsCount, applicationsCount } = body;

    if (
      typeof atsScore !== "number" ||
      typeof mockInterviewsAvg !== "number" ||
      typeof projectsCount !== "number" ||
      typeof applicationsCount !== "number"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid parameters. All params must be numerical numbers." },
        { status: 400 }
      );
    }

    // 3. Compute placement likelihood statistics using existing probability algorithms
    const probability = calculatePlacementProbability({
      atsScore,
      mockInterviewsAvg,
      projectsCount,
      applicationsCount
    });

    return NextResponse.json({
      success: true,
      data: {
        placementProbability: probability.score,
        confidenceInterval: {
          lower: probability.bounds.lower,
          upper: probability.bounds.upper
        },
        readinessTimelineDays: probability.readinessTimelineDays,
        explainableDetails: {
          atsContribution: `${Math.round(atsScore * 0.35)}% probability weighting`,
          interviewContribution: `${Math.round(mockInterviewsAvg * 0.35)}% probability weighting`,
          rationale: "Likelihood score utilizes multiple criteria regression across resume quality, mock communications, and active tracker applications volumes."
        }
      }
    });

  } catch (err: any) {
    console.error("Developer Placement predict API error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
