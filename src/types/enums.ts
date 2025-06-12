export type PriorityLevel =
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL"
    | "URGENT";

export type FileStatus =
    | "PROCESSING"
    | "UPLOADED"
    | "FAILED"
    | "DELETED"
    | "ARCHIVED";

export type FileVisibility =
    | "GLOBAL"
    | "DEPARTMENT"
    | "PROJECT"
    | "TASK"
    | "CONTENT"
    | "MESSAGE"
    | "PRIVATE";

export type FileTargetType =
    | "TASK"
    | "MESSAGE"
    | "CONTENT"
    | "NOTIFICATION";

export type ContentTargetType =
    | "PROJECT"
    | "DEPARTMENT"
    | "GLOBAL"
    | "PRIVATE"
    | "TASK"
    | "TASK1";

export type UserStatus =
    | "ACTIVE"
    | "INACTIVE"
    | "PENDING"
    | "BLOCKED"
    | "DELETED";

export type ProjectStatus =
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "ON_HOLD"
    | "CANCELLED";

export type RoleScope =
    | "GLOBAL"
    | "DEPARTMENT"
    | "PROJECT";

export type TaskStatus =
    | "TO_DO"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

export type MemberStatus =
    | "ACTIVE"
    | "INACTIVE"
    | "PENDING"
    | "BLOCKED"
    | "DELETED";

export type RoleDefault =
    | "MANAGER"
    | "HR"
    | "USER"
    | "MEMBER";
