import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PendingEvaluations from "./pages/Evaluation/PendingEvaluations";
import EvaluationForm from "./pages/Evaluation/EvaluationForm";
import MyEvaluations from "./pages/Evaluation/MyEvaluations";
import MyActivities from "./pages/Evaluation/MyActivities";
import EmployeeGroupsList from "./pages/EmployeeGroups/EmployeeGroupsList";
import GroupMembers from "./pages/EmployeeGroups/GroupMembers";
import UserStatusList from "./pages/Users/UserStatusList";
import AllUsersList from "./pages/Users/AllUsersList";
import AccessRolesList from "./pages/AccessRoles/AccessRolesList";
import HelperToolsPage from "./pages/HelperTools/HelperToolsPage";
import SurveysPage from "./pages/Surveys/SurveysPage";
import SurveyQuestionBanksPage from "./pages/SurveyQuestions/SurveyQuestionBanksPage";
import TeachingSubjectsList from "./pages/TeachingSubjects/TeachingSubjectsList";
import DepartmentsList from "./pages/Departments/DepartmentsList";
import CommissionsList from "./pages/Commissions/CommissionsList";
import FacultiesList from "./pages/Faculties/FacultiesList";
import SpecialtiesList from "./pages/Specialties/SpecialtiesList";
import StudentGroupsList from "./pages/StudentGroups/StudentGroupsList";
import MyTeachers from "./pages/TeacherEvaluations/MyTeachers";
import CompletedTeacherSurveys from "./pages/TeacherEvaluations/CompletedTeacherSurveys";
import PendingTeacherSurveys from "./pages/TeacherEvaluations/PendingTeacherSurveys";
import TeacherSurveyResults from "./pages/TeacherEvaluations/TeacherSurveyResults";
import AllSurveyResultsPage from "./pages/AdminSurveyResults/AllSurveyResultsPage";
import SurveyTeacherResultsDetailPage from "./pages/AdminSurveyResults/SurveyTeacherResultsDetailPage";
import CategoryManagementPage from "./pages/Categories/CategoryManagementPage";
import ScientificReportsListPage from "./pages/TeacherScientificReports/ScientificReportsListPage";
import CreateScientificReportPage from "./pages/TeacherScientificReports/CreateScientificReportPage";
import ScientificReportsMonitoringPage from "./pages/AdminMonitoring/ScientificReportsMonitoringPage";
import BookAuthorshipListPage from "./pages/TeacherBookAuthorship/BookAuthorshipListPage";
import CreateBookAuthorshipPage from "./pages/TeacherBookAuthorship/CreateBookAuthorshipPage";
import BookAuthorshipMonitoringPage from "./pages/AdminMonitoring/BookAuthorshipMonitoringPage";
import ScientificPublicationsListPage from "./pages/TeacherScientificPublications/ScientificPublicationsListPage";
import CreateScientificPublicationPage from "./pages/TeacherScientificPublications/CreateScientificPublicationPage";
import ScientificPublicationsMonitoringPage from "./pages/AdminMonitoring/ScientificPublicationsMonitoringPage";
import ScientificProjectsListPage from "./pages/TeacherScientificProjects/ScientificProjectsListPage";
import CreateScientificProjectPage from "./pages/TeacherScientificProjects/CreateScientificProjectPage";
import ScientificProjectsMonitoringPage from "./pages/AdminMonitoring/ScientificProjectsMonitoringPage";
import TeachingProgramsListPage from "./pages/TeacherCourseProgramsMaterials/TeachingProgramsListPage";
import CreateTeachingProgramPage from "./pages/TeacherCourseProgramsMaterials/CreateTeachingProgramPage";
import TeachingProgramsMonitoringPage from "./pages/AdminMonitoring/TeachingProgramsMonitoringPage";
import TextbooksListPage from "./pages/TeacherCourseProgramsMaterials/TextbooksListPage";
import CreateTextbookPage from "./pages/TeacherCourseProgramsMaterials/CreateTextbookPage";
import TextbooksMonitoringPage from "./pages/AdminMonitoring/TextbooksMonitoringPage";
import CourseMaterialsListPage from "./pages/TeacherCourseProgramsMaterials/CourseMaterialsListPage";
import CreateCourseMaterialPage from "./pages/TeacherCourseProgramsMaterials/CreateCourseMaterialPage";
import CourseMaterialsMonitoringPage from "./pages/AdminMonitoring/CourseMaterialsMonitoringPage";
import MethodicalMaterialsListPage from "./pages/TeacherCourseProgramsMaterials/MethodicalMaterialsListPage";
import CreateMethodicalMaterialPage from "./pages/TeacherCourseProgramsMaterials/CreateMethodicalMaterialPage";
import MethodicalMaterialsMonitoringPage from "./pages/AdminMonitoring/MethodicalMaterialsMonitoringPage";
import TaskManagerPage from "./pages/Tasks/TaskManagerPage";
import GeneralReportPage from "./pages/Reports/GeneralReportPage";
import ActivityReportPage from "./pages/Reports/ActivityReportPage";
import SurveyReportPage from "./pages/Reports/SurveyReportPage";

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-6">Yuklenir...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<ProtectedRoute />}>
            {/* Dashboard Layout */}
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />

              {/* Evaluation Pages */}
              <Route path="/evaluation/pending" element={<PendingEvaluations />} />
              <Route path="/evaluation/submit/:userId/:ruleId" element={<EvaluationForm />} />
              <Route path="/evaluation/my" element={<MyEvaluations />} />
              <Route path="/evaluation/my-evaluations" element={<AllSurveyResultsPage />} />
              <Route path="/evaluation/my-evaluations/:surveyId" element={<SurveyTeacherResultsDetailPage />} />
              <Route path="/evaluation/my-activities" element={<MyActivities />} />
              <Route path="/useractivities" element={<MyActivities />} />

              {/* Task Manager */}
              <Route path="/tasks/create" element={<TaskManagerPage view="create" />} />
              <Route path="/tasks/ratings" element={<TaskManagerPage view="ratings" />} />
              <Route path="/tasks/taskDetails/:taskId" element={<TaskManagerPage view="detail" />} />
              <Route path="/tasks" element={<TaskManagerPage view="list" />} />
              <Route path="/tasks/stats" element={<TaskManagerPage view="stats" />} />

              {/* Employee Groups */}
              <Route path="/employee-groups" element={<EmployeeGroupsList />} />
              <Route path="/employee-groups/:id/members" element={<GroupMembers />} />

              {/* Users */}
              <Route path="/user-statuses" element={<UserStatusList />} />
              <Route path="/helper-tools" element={<HelperToolsPage />} />
              <Route path="/all-users" element={<AllUsersList />} />
              <Route path="/access-roles" element={<AccessRolesList />} />
              <Route path="/surveys" element={<SurveysPage />} />
              <Route path="/survey-question-banks" element={<SurveyQuestionBanksPage />} />
              <Route path="/teacher-evaluations/my-teachers" element={<MyTeachers />} />
              <Route path="/teacher-evaluations/completed" element={<CompletedTeacherSurveys />} />
              <Route path="/teacher-evaluations/pending" element={<PendingTeacherSurveys />} />
              <Route path="/teacher-surveys/results" element={<TeacherSurveyResults />} />
              <Route path="/teaching-subjects" element={<TeachingSubjectsList />} />
              <Route path="/departments" element={<DepartmentsList />} />
              <Route path="/commissions" element={<CommissionsList />} />
              <Route path="/faculties" element={<FacultiesList />} />
              <Route path="/specialties" element={<SpecialtiesList />} />
              <Route path="/student-groups" element={<StudentGroupsList />} />
              <Route path="/categories/:categoryKey" element={<CategoryManagementPage />} />
              <Route path="/userscientificreports" element={<ScientificReportsListPage />} />
              <Route path="/userscientificreports/new" element={<CreateScientificReportPage />} />
              <Route path="/userscientificreports/:id/edit" element={<CreateScientificReportPage />} />
              <Route path="/userbookauthorship" element={<BookAuthorshipListPage />} />
              <Route path="/userbookauthorship/new" element={<CreateBookAuthorshipPage />} />
              <Route path="/userbookauthorship/:id/edit" element={<CreateBookAuthorshipPage />} />
              <Route path="/userscientificpublications" element={<ScientificPublicationsListPage />} />
              <Route path="/userscientificpublications/new" element={<CreateScientificPublicationPage />} />
              <Route path="/userscientificpublications/:id/edit" element={<CreateScientificPublicationPage />} />
              <Route path="/userscientificprojects" element={<ScientificProjectsListPage />} />
              <Route path="/userscientificprojects/new" element={<CreateScientificProjectPage />} />
              <Route path="/userscientificprojects/:id/edit" element={<CreateScientificProjectPage />} />
              <Route path="/usercourseprograms" element={<TeachingProgramsListPage />} />
              <Route path="/usercourseprograms/new" element={<CreateTeachingProgramPage />} />
              <Route path="/usercourseprograms/:id/edit" element={<CreateTeachingProgramPage />} />
              <Route path="/usercoursebooks" element={<TextbooksListPage />} />
              <Route path="/usercoursebooks/new" element={<CreateTextbookPage />} />
              <Route path="/usercoursebooks/:id/edit" element={<CreateTextbookPage />} />
              <Route path="/usercoursematerials" element={<CourseMaterialsListPage />} />
              <Route path="/usercoursematerials/new" element={<CreateCourseMaterialPage />} />
              <Route path="/usercoursematerials/:id/edit" element={<CreateCourseMaterialPage />} />
              <Route path="/usercoursemethodicalmaterials" element={<MethodicalMaterialsListPage />} />
              <Route path="/usercoursemethodicalmaterials/new" element={<CreateMethodicalMaterialPage />} />
              <Route path="/usercoursemethodicalmaterials/:id/edit" element={<CreateMethodicalMaterialPage />} />
              <Route path="/monitoring/scientific-reports" element={<ScientificReportsMonitoringPage />} />
              <Route path="/monitoring/book-authorship" element={<BookAuthorshipMonitoringPage />} />
              <Route path="/monitoring/scientific-publications" element={<ScientificPublicationsMonitoringPage />} />
              <Route path="/monitoring/scientific-projects" element={<ScientificProjectsMonitoringPage />} />
              <Route path="/monitoring/teaching-programs" element={<TeachingProgramsMonitoringPage />} />
              <Route path="/monitoring/textbooks" element={<TextbooksMonitoringPage />} />
              <Route path="/monitoring/course-materials" element={<CourseMaterialsMonitoringPage />} />
              <Route path="/monitoring/methodical-materials" element={<MethodicalMaterialsMonitoringPage />} />
              <Route path="/reports/general" element={<GeneralReportPage />} />
              <Route path="/reports/activities" element={<ActivityReportPage />} />
              <Route path="/reports/surveys" element={<SurveyReportPage />} />

              {/* Others Page */}
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />

              {/* Forms */}
              <Route path="/form-elements" element={<FormElements />} />

              {/* Tables */}
              <Route path="/basic-tables" element={<BasicTables />} />

              {/* Ui Elements */}
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              {/* Charts */}
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />
            </Route>
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
