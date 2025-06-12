import React, { useEffect } from 'react';
import TaskDetail from './TaskDetail.tsx';
import type { TaskResponse } from '../../types/task.ts';

interface TaskDetailModalProps {
  taskId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (task: TaskResponse) => void;
  onDelete?: (taskId: number) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  // Close modal when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !taskId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Content */}
          <div className="overflow-y-auto max-h-[90vh]">
            <TaskDetail
              taskId={taskId}
              onClose={onClose}
              onUpdate={onUpdate}
              onDelete={onDelete}
              className="shadow-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal; 