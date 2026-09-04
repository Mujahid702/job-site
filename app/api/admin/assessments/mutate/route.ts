import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

    const adminEmail = authResult.user?.email || "Admin";
    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;

    if (!action || !payload) {
      return NextResponse.json({ success: false, message: "Missing action or payload parameters" }, { status: 400 });
    }

    const supabase = await createClient();
    let beforeState: any = null;
    let afterState: any = null;
    let detailsString = "";

    // 2. Route by action
    switch (action) {
      // --- Category ---
      case "create_category": {
        const { name, slug, description } = payload;
        const { data, error } = await supabase
          .from("assessment_categories")
          .insert({ name, slug, description })
          .select()
          .single();
        if (error) throw error;
        afterState = data;
        detailsString = `Created Category: ${name} (${slug})`;
        break;
      }
      case "edit_category": {
        const { id, name, slug, description } = payload;
        // Fetch before state
        const { data: before } = await supabase.from("assessment_categories").select("*").eq("id", id).maybeSingle();
        beforeState = before;

        const { data, error } = await supabase
          .from("assessment_categories")
          .update({ name, slug, description })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        afterState = data;
        detailsString = `Updated Category: ${name} (${slug})`;
        break;
      }
      case "delete_category": {
        const { id } = payload;
        const { data: before } = await supabase.from("assessment_categories").select("*").eq("id", id).maybeSingle();
        beforeState = before;

        const { error } = await supabase.from("assessment_categories").delete().eq("id", id);
        if (error) throw error;
        detailsString = `Deleted Category ID: ${id}`;
        break;
      }

      // --- Topic ---
      case "create_topic": {
        const { category_slug, name, slug, difficulty, estimated_time_minutes, prerequisite_topics, skill_tags } = payload;
        const { data, error } = await supabase
          .from("assessment_topics")
          .insert({
            category_slug,
            name,
            slug,
            difficulty: difficulty || "Medium",
            estimated_time_minutes: estimated_time_minutes || 30,
            prerequisite_topics: prerequisite_topics || [],
            skill_tags: skill_tags || []
          })
          .select()
          .single();
        if (error) throw error;
        afterState = data;
        detailsString = `Created Topic: ${name} (${slug}) under ${category_slug}`;
        break;
      }
      case "edit_topic": {
        const { id, category_slug, name, slug, difficulty, estimated_time_minutes, prerequisite_topics, skill_tags } = payload;
        const { data: before } = await supabase.from("assessment_topics").select("*").eq("id", id).maybeSingle();
        beforeState = before;

        const { data, error } = await supabase
          .from("assessment_topics")
          .update({
            category_slug,
            name,
            slug,
            difficulty,
            estimated_time_minutes,
            prerequisite_topics,
            skill_tags
          })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        afterState = data;
        detailsString = `Updated Topic: ${name} (${slug})`;
        break;
      }
      case "delete_topic": {
        const { id } = payload;
        const { data: before } = await supabase.from("assessment_topics").select("*").eq("id", id).maybeSingle();
        beforeState = before;

        const { error } = await supabase.from("assessment_topics").delete().eq("id", id);
        if (error) throw error;
        detailsString = `Deleted Topic ID: ${id}`;
        break;
      }

      // --- Question Bank (MCQ, Coding, SQL) ---
      case "create_question": {
        const {
          topic_id,
          question_text,
          correct_answer_text,
          explanation,
          difficulty,
          marks,
          negative_marks,
          type,
          is_published,
          // MCQ options
          options,
          // Coding Problems
          starter_codes,
          sample_test_cases,
          time_limit_ms,
          memory_limit_mb,
          constraints,
          input_format,
          output_format,
          // SQL Problems
          sql_schema_seed,
          correct_query
        } = payload;

        // A. Insert base question
        const { data: q, error: qErr } = await supabase
          .from("assessment_questions")
          .insert({
            topic_id,
            question_text,
            correct_answer_text: correct_answer_text || "",
            explanation,
            difficulty: difficulty || "Medium",
            marks: marks || 4,
            negative_marks: negative_marks || 1.0,
            type: type || "MCQ",
            is_published: is_published !== false
          })
          .select()
          .single();

        if (qErr || !q) throw qErr || new Error("Failed to insert base question");

        // B. Insert Type-specific details
        if (type === "MCQ" && options && Array.isArray(options)) {
          const formattedOptions = options.map((opt: any) => ({
            question_id: q.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct === true
          }));
          const { error: optErr } = await supabase.from("assessment_options").insert(formattedOptions);
          if (optErr) throw optErr;
        } else if (type === "Coding") {
          const { error: cpErr } = await supabase
            .from("coding_problems")
            .insert({
              question_id: q.id,
              starter_codes: starter_codes || {},
              sample_test_cases: sample_test_cases || [],
              time_limit_ms: time_limit_ms || 5000,
              memory_limit_mb: memory_limit_mb || 256,
              constraints,
              input_format,
              output_format
            });
          if (cpErr) throw cpErr;
        } else if (type === "SQL") {
          const { error: sqlErr } = await supabase
            .from("sql_problems")
            .insert({
              question_id: q.id,
              sql_schema_seed,
              correct_query: correct_query || ""
            });
          if (sqlErr) throw sqlErr;
        }

        afterState = q;
        detailsString = `Created ${type} Question ID: ${q.id}`;
        break;
      }

      case "edit_question": {
        const {
          id,
          topic_id,
          question_text,
          correct_answer_text,
          explanation,
          difficulty,
          marks,
          negative_marks,
          is_published,
          // MCQ options
          options,
          // Coding Problems
          starter_codes,
          sample_test_cases,
          time_limit_ms,
          memory_limit_mb,
          constraints,
          input_format,
          output_format,
          // SQL Problems
          sql_schema_seed,
          correct_query
        } = payload;

        const { data: before } = await supabase.from("assessment_questions").select("*").eq("id", id).maybeSingle();
        beforeState = before;

        // A. Update base question
        const { data: q, error: qErr } = await supabase
          .from("assessment_questions")
          .update({
            topic_id,
            question_text,
            correct_answer_text: correct_answer_text || "",
            explanation,
            difficulty,
            marks,
            negative_marks,
            is_published
          })
          .eq("id", id)
          .select()
          .single();

        if (qErr || !q) throw qErr || new Error("Failed to update base question");

        // B. Update Type-specific details
        if (q.type === "MCQ" && options && Array.isArray(options)) {
          // Delete old options and insert new
          await supabase.from("assessment_options").delete().eq("question_id", id);
          const formattedOptions = options.map((opt: any) => ({
            question_id: id,
            option_text: opt.option_text,
            is_correct: opt.is_correct === true
          }));
          const { error: optErr } = await supabase.from("assessment_options").insert(formattedOptions);
          if (optErr) throw optErr;
        } else if (q.type === "Coding") {
          const { error: cpErr } = await supabase
            .from("coding_problems")
            .upsert({
              question_id: id,
              starter_codes: starter_codes || {},
              sample_test_cases: sample_test_cases || [],
              time_limit_ms: time_limit_ms || 5000,
              memory_limit_mb: memory_limit_mb || 256,
              constraints,
              input_format,
              output_format
            });
          if (cpErr) throw cpErr;
        } else if (q.type === "SQL") {
          const { error: sqlErr } = await supabase
            .from("sql_problems")
            .upsert({
              question_id: id,
              sql_schema_seed,
              correct_query: correct_query || ""
            });
          if (sqlErr) throw sqlErr;
        }

        afterState = q;
        detailsString = `Updated Question ID: ${id}`;
        break;
      }

      case "delete_question": {
        const { id } = payload;
        const { data: before } = await supabase.from("assessment_questions").select("*").eq("id", id).maybeSingle();
        beforeState = before;

        const { error } = await supabase.from("assessment_questions").delete().eq("id", id);
        if (error) throw error;
        detailsString = `Deleted Question ID: ${id}`;
        break;
      }

      // --- Templates & Exams Builder ---
      case "create_template": {
        const {
          title,
          description,
          duration_minutes,
          passing_percentage,
          randomize_questions,
          shuffle_options,
          visibility,
          attempt_limit,
          is_published,
          // Company details (Optional)
          company_name,
          target_role,
          // Questions lists
          question_ids
        } = payload;

        // A. Insert base template
        const { data: tmpl, error: tmplErr } = await supabase
          .from("assessment_templates")
          .insert({
            title,
            description,
            duration_minutes: duration_minutes || 45,
            passing_percentage: passing_percentage || 60,
            randomize_questions: randomize_questions === true,
            shuffle_options: shuffle_options === true,
            visibility: visibility || "Free",
            attempt_limit: attempt_limit || 3,
            is_published: is_published !== false
          })
          .select()
          .single();

        if (tmplErr || !tmpl) throw tmplErr || new Error("Failed to insert template");

        // B. Insert Company extensions if provided
        if (company_name && target_role) {
          const { error: compErr } = await supabase
            .from("company_assessment_templates")
            .insert({
              template_id: tmpl.id,
              company_name,
              target_role
            });
          if (compErr) throw compErr;
        }

        // C. Link questions inside template
        if (question_ids && Array.isArray(question_ids)) {
          const junctions = question_ids.map((qId: string) => ({
            template_id: tmpl.id,
            question_id: qId,
            points: 4 // default points per question
          }));
          const { error: juncErr } = await supabase.from("assessment_template_questions").insert(junctions);
          if (juncErr) throw juncErr;
        }

        afterState = tmpl;
        detailsString = `Created template: ${title} (${tmpl.id})`;
        break;
      }

      case "edit_template": {
        const {
          id,
          title,
          description,
          duration_minutes,
          passing_percentage,
          randomize_questions,
          shuffle_options,
          visibility,
          attempt_limit,
          is_published,
          // Company details
          company_name,
          target_role,
          // Questions
          question_ids
        } = payload;

        const { data: before } = await supabase.from("assessment_templates").select("*").eq("id", id).maybeSingle();
        beforeState = before;

        // A. Update base template
        const { data: tmpl, error: tmplErr } = await supabase
          .from("assessment_templates")
          .update({
            title,
            description,
            duration_minutes,
            passing_percentage,
            randomize_questions,
            shuffle_options,
            visibility,
            attempt_limit,
            is_published
          })
          .eq("id", id)
          .select()
          .single();

        if (tmplErr || !tmpl) throw tmplErr || new Error("Failed to update template");

        // B. Update Company details
        if (company_name && target_role) {
          const { error: compErr } = await supabase
            .from("company_assessment_templates")
            .upsert({
              template_id: id,
              company_name,
              target_role
            });
          if (compErr) throw compErr;
        } else {
          // Remove company extension if deleted
          await supabase.from("company_assessment_templates").delete().eq("template_id", id);
        }

        // C. Update questions list
        await supabase.from("assessment_template_questions").delete().eq("template_id", id);
        if (question_ids && Array.isArray(question_ids)) {
          const junctions = question_ids.map((qId: string) => ({
            template_id: id,
            question_id: qId,
            points: 4
          }));
          const { error: juncErr } = await supabase.from("assessment_template_questions").insert(junctions);
          if (juncErr) throw juncErr;
        }

        afterState = tmpl;
        detailsString = `Updated template: ${title} (${id})`;
        break;
      }

      case "delete_template": {
        const { id } = payload;
        const { data: before } = await supabase.from("assessment_templates").select("*").eq("id", id).maybeSingle();
        beforeState = before;

        const { error } = await supabase.from("assessment_templates").delete().eq("id", id);
        if (error) throw error;
        detailsString = `Deleted Template ID: ${id}`;
        break;
      }

      default:
        return NextResponse.json({ success: false, message: `Unsupported mutation action '${action}'` }, { status: 400 });
    }

    // 3. Log mutation in admin_audit_logs table
    const ipAddr = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgentStr = req.headers.get("user-agent") || "API Client";

    await supabase.from("admin_audit_logs").insert({
      admin_name: adminEmail,
      action: action,
      details: detailsString,
      before_state: beforeState,
      after_state: afterState,
      ip: ipAddr,
      device: userAgentStr
    });

    return NextResponse.json({
      success: true,
      message: "Operation completed and logged successfully",
      data: afterState
    });

  } catch (err: any) {
    console.error("[Admin Assessment Mutate POST] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to mutate assessment state" }, { status: 550 });
  }
}
