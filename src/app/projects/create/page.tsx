import type { Metadata } from "next";
import CreateProjectForm from "@/components/project/create-form";

export const metadata: Metadata = {
  title: "Create Project",
  description: "Post a new collaboration project and find your dream team.",
};

export default function CreateProjectPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-3">
        Create a <span className="gradient-text">Project</span>
      </h1>
      <p className="text-gray-400 mb-10">
        Describe your project and let AI help you find the perfect collaborators.
      </p>

      <CreateProjectForm />
    </div>
  );
}
