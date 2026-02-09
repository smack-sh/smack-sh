// app/components/desktop-builder/ProjectList.tsx
import React, { useState, useEffect } from 'react';
import { getAllProjects, DesktopProject, deleteProject, exportProjectAsZip } from '~/lib/desktop-builder/manager';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<DesktopProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const fetchedProjects = await getAllProjects();
      setProjects(fetchedProjects);
    } catch (error: any) {
      toast.error(`Failed to load projects: ${error.message}`);
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
        toast.success('Project deleted successfully!');
        fetchProjects(); // Refresh the list
      } catch (error: any) {
        toast.error(`Failed to delete project: ${error.message}`);
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleExportProject = async (id: string) => {
    try {
      await exportProjectAsZip(id);
      toast.success('Project exported successfully!');
    } catch (error: any) {
      toast.error(`Failed to export project: ${error.message}`);
      console.error('Failed to export project:', error);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading projects...</div>;
  }

  if (projects.length === 0) {
    return <div className="p-4 text-center">No desktop projects generated yet.</div>;
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Generated Desktop Apps</h3>
      <ul className="space-y-4">
        {projects.map((project) => (
          <li key={project.id} className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <p className="text-lg font-medium">{project.name}</p>
              <p className="text-sm text-gray-400">Template: {project.templateName}</p>
              <p className="text-sm text-gray-400">Target: {project.buildTarget}</p>
              <p className="text-xs text-gray-500">Created: {new Date(project.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-2 mt-3 md:mt-0">
              <button
                onClick={() => handleExportProject(project.id)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Download
              </button>
              <button
                onClick={() => handleDeleteProject(project.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
