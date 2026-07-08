/*
 * Sample people & organisation data: schools, users (admin/teacher/student),
 * classes and assignments. Student progress lives in progress.ts.
 */
import type { School, User, ClassGroup, Assignment } from "@/types";

export const schools: School[] = [
  {
    id: "school-srhs",
    name: "Sarah Redfern High School",
    location: "Minto, NSW",
    active: true,
    teacherIds: ["teacher-jones", "teacher-patel"],
    studentIds: ["stu-1", "stu-2", "stu-3", "stu-4", "stu-5", "stu-6"],
    subscriptionStatus: "active",
    lastActive: "2026-07-04",
  },
  {
    id: "school-coastal",
    name: "Coastal Ridge Public School",
    location: "Wollongong, NSW",
    active: true,
    teacherIds: ["teacher-nguyen"],
    studentIds: ["stu-7", "stu-8", "stu-9"],
    subscriptionStatus: "trial",
    lastActive: "2026-07-03",
  },
  {
    id: "school-outback",
    name: "Outback Rivers College",
    location: "Dubbo, NSW",
    active: false,
    teacherIds: [],
    studentIds: [],
    subscriptionStatus: "lapsed",
    lastActive: "2026-05-11",
  },
];

export const users: User[] = [
  {
    id: "admin-bloke",
    name: "Cameron Rodgers",
    email: "thebiologybloke@gmail.com",
    role: "admin",
    classIds: [],
    avatarUrl: "",
    createdAt: "2024-11-01",
  },
  {
    id: "teacher-jones",
    name: "Ms Jones",
    email: "jones@srhs.nsw.edu.au",
    role: "teacher",
    schoolId: "school-srhs",
    classIds: ["class-5j", "class-7science"],
    avatarUrl: "",
    createdAt: "2025-01-20",
  },
  {
    id: "teacher-patel",
    name: "Mr Patel",
    email: "patel@srhs.nsw.edu.au",
    role: "teacher",
    schoolId: "school-srhs",
    classIds: ["class-9bio"],
    avatarUrl: "",
    createdAt: "2025-02-05",
  },
  {
    id: "teacher-nguyen",
    name: "Ms Nguyen",
    email: "nguyen@coastalridge.nsw.edu.au",
    role: "teacher",
    schoolId: "school-coastal",
    classIds: ["class-6cr"],
    avatarUrl: "",
    createdAt: "2025-03-12",
  },
  // Students are nameless animal aliases (no PII). name = the animal display
  // name; animalId links to the catalogue. The real child is known only to the
  // teacher's printed explorer cards.
  { id: "stu-1", name: "Koala", animalId: "koala", email: "", role: "student", schoolId: "school-srhs", classIds: ["class-5j"], createdAt: "2025-02-01" },
  { id: "stu-2", name: "Tiger", animalId: "tiger", email: "", role: "student", schoolId: "school-srhs", classIds: ["class-5j"], createdAt: "2025-02-01" },
  { id: "stu-3", name: "Orangutan", animalId: "orangutan", email: "", role: "student", schoolId: "school-srhs", classIds: ["class-5j"], createdAt: "2025-02-01" },
  { id: "stu-4", name: "Wombat", animalId: "wombat", email: "", role: "student", schoolId: "school-srhs", classIds: ["class-5j"], createdAt: "2025-02-01" },
  { id: "stu-5", name: "Kookaburra", animalId: "kookaburra", email: "", role: "student", schoolId: "school-srhs", classIds: ["class-7science"], createdAt: "2025-02-01" },
  { id: "stu-6", name: "Crocodile", animalId: "crocodile", email: "", role: "student", schoolId: "school-srhs", classIds: ["class-9bio"], createdAt: "2025-02-01" },
  { id: "stu-7", name: "Dolphin", animalId: "dolphin", email: "", role: "student", schoolId: "school-coastal", classIds: ["class-6cr"], createdAt: "2025-03-15" },
  { id: "stu-8", name: "Echidna", animalId: "echidna", email: "", role: "student", schoolId: "school-coastal", classIds: ["class-6cr"], createdAt: "2025-03-15" },
  { id: "stu-9", name: "Platypus", animalId: "platypus", email: "", role: "student", schoolId: "school-coastal", classIds: ["class-6cr"], createdAt: "2025-03-15" },
];

export const classes: ClassGroup[] = [
  {
    id: "class-5j",
    name: "5J Science Explorers",
    yearGroup: "Year 5",
    teacherId: "teacher-jones",
    schoolId: "school-srhs",
    studentIds: ["stu-1", "stu-2", "stu-3", "stu-4"],
    assignedUnitIds: ["unit-survival"],
    classCode: "KOALA-5J",
  },
  {
    id: "class-7science",
    name: "7 Science Blue",
    yearGroup: "Year 7",
    teacherId: "teacher-jones",
    schoolId: "school-srhs",
    studentIds: ["stu-5"],
    assignedUnitIds: ["unit-wildsystems"],
    classCode: "TIGER-7B",
  },
  {
    id: "class-9bio",
    name: "9 Biology Elective",
    yearGroup: "Year 9",
    teacherId: "teacher-patel",
    schoolId: "school-srhs",
    studentIds: ["stu-6"],
    assignedUnitIds: ["unit-frontlines"],
    classCode: "ORANG-9E",
  },
  {
    id: "class-6cr",
    name: "6 Coastal Rangers",
    yearGroup: "Year 6",
    teacherId: "teacher-nguyen",
    schoolId: "school-coastal",
    studentIds: ["stu-7", "stu-8", "stu-9"],
    assignedUnitIds: ["unit-survival"],
    classCode: "REEF-6CR",
  },
];

export const assignments: Assignment[] = [
  {
    id: "assign-1",
    classId: "class-5j",
    unitId: "unit-survival",
    topicIds: ["topic-adaptations", "topic-foodwebs"],
    dueDate: "2026-07-18",
    adaptiveTasksEnabled: true,
    explorerPointsEnabled: true,
    assignedAt: "2026-07-01",
  },
  {
    id: "assign-2",
    classId: "class-7science",
    unitId: "unit-wildsystems",
    topicIds: ["topic-predators"],
    dueDate: "2026-07-20",
    adaptiveTasksEnabled: true,
    explorerPointsEnabled: true,
    assignedAt: "2026-07-02",
  },
  {
    id: "assign-3",
    classId: "class-6cr",
    unitId: "unit-survival",
    topicIds: ["topic-adaptations"],
    dueDate: "2026-07-22",
    adaptiveTasksEnabled: false,
    explorerPointsEnabled: true,
    assignedAt: "2026-07-03",
  },
];

// Which student is "logged in" for the student demo view.
export const DEMO_STUDENT_ID = "stu-1";
export const DEMO_TEACHER_ID = "teacher-jones";
export const DEMO_ADMIN_ID = "admin-bloke";
