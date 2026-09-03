"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

const departments = [
  "Engineering",
  "Customer Experience",
  "Sales",
  "Marketing",
];

export default function JobForm() {
  const [published, setPublished] = useState(false);

  return (
    <div className="job-form">
      <label>
        Job title
        <input placeholder="e.g. Senior Product Designer" />
      </label>

      <div className="form-grid">
        <label>
          Department
          <select defaultValue="">
            <option value="" disabled>
              Select department
            </option>
            {departments.map((department) => (
              <option key={department}>{department}</option>
            ))}
          </select>
          <ChevronDown size={16} />
        </label>
        <label>
          Location
          <input placeholder="e.g. Bengaluru · Hybrid" />
        </label>
      </div>

      <div className="form-grid">
        <label>
          Experience
          <input placeholder="e.g. 3–5 years" />
        </label>
        <label>
          Salary range
          <input placeholder="e.g. ₹8–12 LPA" />
        </label>
      </div>

      <label>
        What will this person do?
        <textarea
          placeholder="Describe the role, team, and outcomes..."
          rows={5}
        />
      </label>

      <label>
        Skills to verify
        <input placeholder="Add skills separated by commas" />
      </label>

      <div className="form-actions">
        <button className="outline-button">Save draft</button>
        <button className="primary-button" onClick={() => setPublished(true)}>
          {published ? (
            <>
              <Check size={16} /> Published
            </>
          ) : (
            "Publish job"
          )}
        </button>
      </div>

      {published && (
        <p className="form-success">
          <Check size={15} /> Job published and ready to receive applicants.
        </p>
      )}
    </div>
  );
}
