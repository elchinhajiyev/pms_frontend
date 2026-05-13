import { GrTask } from "react-icons/gr";
import { GiSkills } from "react-icons/gi";
import { RiQuillPenAiLine } from "react-icons/ri";
import { MdOutlineAssessment } from "react-icons/md";

import { LuBookOpenText } from "react-icons/lu";
import { MdOutlineCategory } from "react-icons/md";

// Assume these icons are imported from an icon library
import {
  GridIcon,
  PieChartIcon,
} from "../icons";

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};


export const general: NavItem[] = [
  // {
  //   icon: <GridIcon />,
  //   name: "Dashboard",
  //   subItems: [{ name: "Ecommerce", path: "/", pro: false }],
  // },
  // {
  //   icon: <CalenderIcon />,
  //   name: "Calendar",
  //   path: "/calendar",
  // },
    {
    name: "Səriştə qiymətləndirməsi",
    icon: <GiSkills />,
    subItems: [
      { name: "Sorğu nəticələrim", path: "/teacher-surveys/results", pro: false },
     
     
    ],
  },

      {
    name: "Elmi tədqiqat fəaliyyətləri",
    icon: <RiQuillPenAiLine />,
    subItems: [
      { name: "Elmi məruzələr", path: "/userscientificreports", pro: false },
      { name: "Kitab müəllifliyi", path: "/userbookauthorship", pro: false },
      { name: "Elmi nəşrlər", path: "/userscientificpublications", pro: false },
      { name: "Hirş indeksi", path: "/hindex", pro: false },
      { name: "Elmi tədqiqat layihələri", path: "/userscientificprojects", pro: false },
    ],
  },

        {
    name: "Tədris metodiki vəsaitlər",
    icon: <LuBookOpenText />,
    subItems: [
      { name: "Tədris proqramları", path: "/usercourseprograms", pro: false },
      { name: "Dərsliklər", path: "/usercoursebooks", pro: false },
      { name: "Dərs vəsaitləri", path: "/usercoursematerials", pro: false },
      { name: "Metodiki vəsaitlər", path: "/usercoursemethodicalmaterials", pro: false },

    ],
  },
  
  {
    name: "Ümumi məlumatlar",
    icon: <GridIcon />,
    subItems: [
      { name: "Departament", path: "/departments", pro: false },
       { name: "Fakültə", path: "/faculties", pro: false },
      { name: "İxtisas", path: "/specialties", pro: false },
      { name: "Tədris edilən fənlər", path: "/teaching-subjects", pro: false },
      { name: "Qruplar", path: "/student-groups", pro: false },
      { name: "İşçi qrupları", path: "/employee-groups", pro: false },
      { name: "Üzvlər", path: "/all-users", pro: false },
      { name: "Təhsil statusları", path: "/user-statuses", pro: false },
      { name: "Köməkçi alətlər", path: "/helper-tools", pro: false },
      { name: "İcazələr", path: "/access-roles", pro: false },
      { name: "Sorğular", path: "/surveys", pro: false },
      { name: "Ümumi fəaliyyətlər", path: "/evaluation/my-activities", pro: false },
     
     
    ],
  },

  {
    name: "Müəllim qiymətləndirilməsi",
    icon: <MdOutlineAssessment />,
    subItems: [
      { name: "Müəllimlərim", path: "/teacher-evaluations/my-teachers", pro: false },
      { name: "Qiymətləndirdiklərim", path: "/teacher-evaluations/completed", pro: false },
      { name: "Gözləyən sorğular", path: "/teacher-evaluations/pending", pro: false },
    ],
  },
];

export const categoryItems: NavItem = {
  name: "Kateqoriyalar",
  icon: <MdOutlineCategory />,
  subItems: [
    { name: "Elmi məruzələr", path: "/categories/scientific_reports", pro: false },
    { name: "Kitab müəllifliyi", path: "/categories/book_authorship", pro: false },
    { name: "Elmi nəşrlər", path: "/categories/scientific_publications", pro: false },
    { name: "Elmi tədqiqat layihələri", path: "/categories/scientific_projects", pro: false },
    { name: "Tədris proqramları", path: "/categories/course_programs", pro: false },
    { name: "Dərsliklər", path: "/categories/textbooks", pro: false },
    { name: "Dərs vəsaitləri", path: "/categories/course_materials", pro: false },
    { name: "Metodiki vəsaitlər", path: "/categories/methodical_materials", pro: false },
  ],
};

export const task: NavItem[] = [
  {
    name: "Tapşırıq meneceri",
    icon: <GrTask />,
    subItems: [
      { name: "Tapşırıq qiymətləndirmələri", path: "/tasks/ratings", pro: false },
      { name: "Tapşırıqlar", path: "/tasks", pro: false },
      { name: "Statistika", path: "/tasks/stats", pro: false },
    ],
  },
  {
    name: "Sorğu nəticələri",
    icon: <MdOutlineAssessment />,
    subItems: [
      { name: "Müəllim sorğu nəticələri", path: "/evaluation/my-evaluations", pro: false },
    ],
  },

];

export const monitoring: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Elmi fəaliyyətlər monitorinq",
    subItems: [
      { name: "Elmi məruzələr", path: "/monitoring/scientific-reports", pro: false },
      { name: "Kitab müəllifliyi", path: "/monitoring/book-authorship", pro: false },
      { name: "Elmi nəşrlər", path: "/monitoring/scientific-publications", pro: false },
      { name: "Elmi tədqiqat layihələri", path: "/monitoring/scientific-projects", pro: false },
    ],
  },
  {
    icon: <PieChartIcon />,
    name: "Tədris metodiki vəsaitlər",
    subItems: [
      { name: "Tədris proqramları", path: "/monitoring/teaching-programs", pro: false },
      { name: "Dərsliklər", path: "/monitoring/textbooks", pro: false },
      { name: "Dərs vəsaitləri", path: "/monitoring/course-materials", pro: false },
      { name: "Metodiki vəsaitlər", path: "/monitoring/methodical-materials", pro: false },
    ],
  },


//   {
//     icon: <BoxCubeIcon />,
//     name: "UI Elements",
//     subItems: [
//       { name: "Alerts", path: "/alerts", pro: false },
//       { name: "Avatar", path: "/avatars", pro: false },
//       { name: "Badge", path: "/badge", pro: false },
//       { name: "Buttons", path: "/buttons", pro: false },
//       { name: "Images", path: "/images", pro: false },
//       { name: "Videos", path: "/videos", pro: false },
//     ],
//   },
//   {
//     icon: <PlugInIcon />,
//     name: "Authentication",
//     subItems: [
//       { name: "Sign In", path: "/signin", pro: false },
//       { name: "Sign Up", path: "/signup", pro: false },
//     ],
//   },
];