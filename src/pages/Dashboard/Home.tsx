import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import UserAvatar from "../../components/common/UserAvatar";
import { useAuth } from "../../context/AuthContext";
import {
  FiAward,
  FiCalendar,
  FiFileText,
  FiMail,
  FiMapPin,
  FiPhone,
  FiUser,
} from "react-icons/fi";

function AdminDashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics />

        <MonthlySalesChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>

      <div className="col-span-12">
        <StatisticsChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div>
    </div>
  );
}

const MetricRing = ({
  label,
  value,
  total,
  accent,
  soft,
}: {
  label: string;
  value: number;
  total: number;
  accent: string;
  soft: string;
}) => {
  const percent = Math.min(100, Math.round((value / total) * 100));

  return (
    <div className={`rounded-lg border border-gray-100 p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 ${soft}`}>
      <p className="mb-3 text-center text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full" style={{ background: `conic-gradient(${accent} ${percent}%, #e8ece9 0)` }}>
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-center dark:bg-gray-900">
          <span className="text-lg font-normal text-gray-800 dark:text-white">{value}</span>
          <span className="-mt-2 text-[10px] text-gray-500">gün</span>
        </div>
      </div>
    </div>
  );
};

function EmployeeDashboard() {
  const { user } = useAuth();
  const fullName = [user?.last_name, user?.first_name].filter(Boolean).join(" ") || "İstifadəçi";
  const roleLabel = user?.role_name || user?.role_code || "Əməkdaş";
  const bars = [74, 68, 42, 78, 55, 82, 64];
  const linePoints = "0,78 55,64 110,61 165,52 220,58 275,66 330,73 385,62 440,55 495,60 550,49";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-900 dark:text-white">Əməkdaş məlumatları</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard / Əməkdaş / Detallar</p>
        </div>
        <div className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 md:w-72">
          Axtarış
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <aside className="col-span-12 space-y-5 lg:col-span-4 xl:col-span-3">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-lg bg-emerald-400 p-4">
                <UserAvatar photo={user?.photo} name={fullName} size="lg" />
              </div>
              <h2 className="mt-4 text-base font-normal text-gray-900 dark:text-white">{fullName}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  ID-{user?.id || "000"}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Aktiv
                </span>
              </div>
            </div>

            <div className="mt-5 divide-y divide-gray-100 text-sm dark:divide-gray-800">
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-500">İş növü</span>
                <span className="text-gray-800 dark:text-gray-200">Tam ştat</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-500">İş modeli</span>
                <span className="text-gray-800 dark:text-gray-200">Hibrid</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-500">Qoşulma tarixi</span>
                <span className="text-gray-800 dark:text-gray-200">14 Fevral 2023</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-normal text-gray-900 dark:text-white">Şəxsi məlumat</h3>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <FiUser className="mt-0.5 text-emerald-600" />
                <div>
                  <p className="text-xs text-gray-500">Rol</p>
                  <p className="text-gray-800 dark:text-gray-200">{roleLabel}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <FiMail className="mt-0.5 text-emerald-600" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="break-all text-gray-800 dark:text-gray-200">{user?.email || "-"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <FiPhone className="mt-0.5 text-emerald-600" />
                <div>
                  <p className="text-xs text-gray-500">Telefon</p>
                  <p className="text-gray-800 dark:text-gray-200">{user?.phone || "-"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <FiMapPin className="mt-0.5 text-emerald-600" />
                <div>
                  <p className="text-xs text-gray-500">Departament</p>
                  <p className="text-gray-800 dark:text-gray-200">{user?.department_name || "-"}</p>
                </div>
              </div>
            </div>
          </section>
        </aside>

        <main className="col-span-12 space-y-5 lg:col-span-8 xl:col-span-9">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricRing label="Bütün icazələr" value={14} total={20} accent="#0f5132" soft="bg-emerald-50/70" />
            <MetricRing label="İllik icazə" value={10} total={20} accent="#38b99d" soft="bg-white" />
            <MetricRing label="Təsadüfi icazə" value={8} total={20} accent="#6fc7b9" soft="bg-white" />
            <MetricRing label="Xəstəlik icazəsi" value={3} total={10} accent="#2ba98f" soft="bg-white" />
          </div>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Performans icmalı</p>
                <h3 className="mt-1 text-2xl font-normal text-gray-900 dark:text-white">86.75%</h3>
              </div>
              <button className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Son il
              </button>
            </div>
            <div className="h-44 w-full">
              <svg viewBox="0 0 560 180" className="h-full w-full">
                <defs>
                  <linearGradient id="employeeLineFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#45b8a3" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#45b8a3" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[20, 55, 90, 125, 160].map((y) => (
                  <line key={y} x1="0" x2="560" y1={y} y2={y} stroke="#e7ece9" strokeWidth="1" />
                ))}
                <path d={`M${linePoints} L550,170 L0,170 Z`} fill="url(#employeeLineFill)" />
                <polyline points={linePoints} fill="none" stroke="#53756f" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Öyrənilən saatlar</p>
                  <h3 className="mt-1 text-2xl font-normal text-gray-900 dark:text-white">34.30</h3>
                </div>
                <button className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Bu həftə
                </button>
              </div>
              <div className="flex h-36 items-end gap-3">
                {bars.map((height, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-t-md ${index === 3 ? "bg-teal-800" : index === 2 || index > 4 ? "bg-lime-100" : "bg-emerald-400"}`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-gray-400">{index + 1}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 text-sm font-normal text-gray-900 dark:text-white">Sənədlər</h3>
              <div className="space-y-3">
                {["Performans qiymətləndirməsi.pdf", "Kurs qiymətləndirməsi.pdf", "CV.pdf", "Portfolio.pdf"].map((document) => (
                  <div key={document} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <FiFileText />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-gray-800 dark:text-gray-200">{document}</p>
                      <p className="text-xs text-gray-500">PDF</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-normal text-gray-900 dark:text-white">Daxili qeydlər</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-emerald-50/70 p-4 dark:bg-emerald-900/20">
                <div className="mb-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <FiAward />
                  <span className="text-sm">Performans rəyi</span>
                </div>
                <p className="text-xs leading-5 text-gray-600 dark:text-gray-300">
                  Son dövrdə tapşırıqların icrasında davamlılıq və keyfiyyət yüksəkdir.
                </p>
              </div>
              <div className="rounded-lg bg-lime-50/70 p-4 dark:bg-lime-900/20">
                <div className="mb-2 flex items-center gap-2 text-lime-700 dark:text-lime-300">
                  <FiCalendar />
                  <span className="text-sm">İşçi təşəkkürü</span>
                </div>
                <p className="text-xs leading-5 text-gray-600 dark:text-gray-300">
                  Komanda işi və vaxtında təhvilvermə göstəriciləri müsbətdir.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const roleCode = String(user?.role_code || "").toUpperCase();
  const roleName = String(user?.role_name || "").toLowerCase();
  const isAdmin = roleCode === "ADMIN";
  const isStudent =
    roleCode === "STUDENT" ||
    roleName.includes("tələbə") ||
    roleName.includes("student");

  return (
    <>
      <PageMeta
        title="Performix"
        description="AcadeMy Management System Dashboard"
      />
      {isAdmin || isStudent ? <AdminDashboard /> : <EmployeeDashboard />}
    </>
  );
}
