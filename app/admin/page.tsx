"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Admin() {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    company: "",
    salary: "",
    location: "",
    description: "",
    eligibility: "",
    resume_tips: "",
    interview_tips: "",
    apply_link: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { error } = await supabase.from("jobs").insert([form]);

    if (error) {
      alert(error.message);
    } else {
      alert("Job added 🚀");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-3">
      <h1 className="text-xl font-bold mb-4">Add Job</h1>

      {Object.keys(form).map((key) => (
        <input
          key={key}
          name={key}
          placeholder={key}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      ))}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 w-full"
      >
        Add Job
      </button>
    </div>
  );
}