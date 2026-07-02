import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runEmailVerification } from "@/lib/recruitment-trust";

export const dynamic = "force-dynamic";

const TEST_SUITE = [
  {
    name: "Genuine Google Recruiter",
    sender: "Google Careers <jobs@google.com>",
    subject: "Software Engineer SDE-I: Technical Interview Schedule",
    body: "Hi there, we would like to schedule a 45-minute technical round with our team. Please choose your slot on the calendar link.",
    expectedDecisions: ["Verified Recruitment Email", "Likely Recruitment Email"],
    isScam: false
  },
  {
    name: "Genuine HackerRank OA Invitation",
    sender: "HackerRank Notifications <noreply@hackerrank.com>",
    subject: "Deloitte Data Analyst Assessment Invitation",
    body: "Hi Candidate, you have been invited to complete the online assessment test for the Deloitte Data Analyst vacancy. You have 48 hours to complete.",
    expectedDecisions: ["Verified Recruitment Email", "Likely Recruitment Email"],
    isScam: false
  },
  {
    name: "Genuine Accenture Offer Letter",
    sender: "Accenture India Careers <onboarding@accenture.com>",
    subject: "Offer Letter & Join Date Confirmation",
    body: "Dear Candidate, we are pleased to extend an offer to join Accenture as an Associate Software Engineer. Please find your offer letter details CTC 6.5 LPA.",
    expectedDecisions: ["Verified Recruitment Email", "Likely Recruitment Email"],
    isScam: false
  },
  {
    name: "Consultancy spam / Newsletter",
    sender: "Career Growth Hub <newsletter@jobbooster.net>",
    subject: "Crack coding interviews inside 30 days - 50% discount",
    body: "Join our career acceleration class to boost your interview chances. Buy our checklist ebook guide for Rs 199 only.",
    expectedDecisions: ["Suspicious", "Potential Scam"],
    isScam: false
  },
  {
    name: "Accenture Fake Recruiter Payment Scam",
    sender: "Accenture Recruitment Board <accenturecareers@gmail.com>",
    subject: "Mandatory Payment of Registration Fee for Accenture Interview",
    body: "Dear Candidate, you have been shortlisted for the final HR round. To activate your gate pass, you must pay a refundable deposit of Rs. 499 via UPI.",
    expectedDecisions: ["Potential Scam"],
    isScam: true
  },
  {
    name: "Fee-based Job Scam",
    sender: "TCS HR Team <tcs-hiring@hotmail.com>",
    subject: "Letter of Selection: Pay Security Deposit to TCS",
    body: "Congratulations on selection! You must transfer Rs. 2500 security deposit for training kit distribution before we release your joining letter details.",
    expectedDecisions: ["Potential Scam"],
    isScam: true
  }
];

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const results = [];
    let correct = 0;
    let falsePositives = 0; // Genuine classified as scam/suspicious
    let falseNegatives = 0; // Scam/spam classified as verified/likely

    for (const testCase of TEST_SUITE) {
      const start = Date.now();
      const res = await runEmailVerification(
        user?.id || "guest-user",
        {
          sender: testCase.sender,
          subject: testCase.subject,
          body: testCase.body
        },
        supabase
      );
      const latencyMs = Date.now() - start;

      const matched = testCase.expectedDecisions.includes(res.decision);
      if (matched) {
        correct++;
      } else {
        const resultIsPositive = ["Verified Recruitment Email", "Likely Recruitment Email"].includes(res.decision);
        if (testCase.isScam && resultIsPositive) {
          falseNegatives++;
        } else if (!testCase.isScam && !resultIsPositive) {
          falsePositives++;
        }
      }

      results.push({
        testName: testCase.name,
        sender: testCase.sender,
        decision: res.decision,
        trustScore: res.trustScore,
        scamProbability: res.scamProbability,
        classification: res.classification,
        matched,
        latencyMs
      });
    }

    const accuracy = Math.round((correct / TEST_SUITE.length) * 100);
    const falsePositiveRate = Math.round((falsePositives / TEST_SUITE.length) * 100);
    const falseNegativeRate = Math.round((falseNegatives / TEST_SUITE.length) * 100);

    return NextResponse.json({
      success: true,
      accuracy,
      falsePositiveRate,
      falseNegativeRate,
      totalTested: TEST_SUITE.length,
      correct,
      results
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
