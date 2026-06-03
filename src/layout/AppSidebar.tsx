import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import departmentService from "../services/departmentService";
import { general, task, monitoring, reports, NavItem, categoryItems } from "../utils/navigation";
import {
  ChevronDownIcon,
  HorizontaLDots,
} from "../icons";
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const roleCode = String(user?.role_code || '').toUpperCase();
  const roleName = String(user?.role_name || '').toLowerCase();
  const isAdmin = roleCode === 'ADMIN';
  const isStudent = roleCode === 'STUDENT' || roleName.includes('tələbə') || roleName.includes('student');
  const isTeacher = roleCode === 'TEACHER' || roleName.includes('müəllim') || roleName.includes('teacher');
  const canAccessTaskManager = !isStudent;
  const canSeeReportItems = canAccessTaskManager;
  const [hasMonitoringAccess, setHasMonitoringAccess] = useState(false);
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "general" | "task" | "monitoring" | "reports";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let matchedSubmenu: { type: "general" | "task" | "monitoring" | "reports"; index: number } | null = null;

    ["general", "task", "monitoring", "reports"].forEach((menuType) => {
      const items =
        menuType === "general"
          ? general
          : menuType === "task"
            ? task
            : menuType === "monitoring"
              ? monitoring
              : reports;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              matchedSubmenu = {
                type: menuType as "general" | "task" | "monitoring" | "reports",
                index,
              };
            }
          });
        }
      });
    });

    // Route dəyişəndə submenu avtomatik bağlanmasın.
    // Yalnız ilk açılışda aktiv route-a uyğun submenu açılır.
    if (matchedSubmenu) {
      setOpenSubmenu((prev) => prev || matchedSubmenu);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  useEffect(() => {
    let isMounted = true;

    const checkMonitoringAccess = async () => {
      if (!user?.id) {
        if (isMounted) setHasMonitoringAccess(false);
        return;
      }

      try {
        const res = await departmentService.getMonitoringAccess(user.id);
        const hasAccess = !!res?.data?.hasAccess;
        if (isMounted) {
          setHasMonitoringAccess(hasAccess);
        }
      } catch {
        if (isMounted) {
          setHasMonitoringAccess(false);
        }
      }
    };

    checkMonitoringAccess();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleSubmenuToggle = (index: number, menuType: "general" | "task" | "monitoring" | "reports") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    items: NavItem[],
    menuType: "general" | "task" | "monitoring" | "reports",
    indexOffset = 0
  ) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        const effectiveIndex = index + indexOffset;

        return (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(effectiveIndex, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === effectiveIndex
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === effectiveIndex
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text whitespace-nowrap">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === effectiveIndex
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text whitespace-nowrap">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${effectiveIndex}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === effectiveIndex
                    ? `${subMenuHeight[`${menuType}-${effectiveIndex}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      )})}
    </ul>
  );

  const generalMenuForRole = (() => {
    const scientificAndTeachingItems = general.filter((nav) =>
      [
        "Elmi tədqiqat fəaliyyətləri",
        "Tədris metodiki vəsaitlər"
      ].includes(nav.name)
    );

    if (isStudent) {
      return general.filter((nav) => nav.name === "Müəllim qiymətləndirilməsi");
    }

    if (isTeacher) {
      return general.filter((nav) =>
        [
          "Səriştə qiymətləndirməsi",
          "Elmi tədqiqat fəaliyyətləri",
          "Tədris metodiki vəsaitlər"
        ].includes(nav.name)
      );
    }

    if (isAdmin) {
      return [
        ...general.filter((nav) => nav.name === "Ümumi məlumatlar"),
        categoryItems
      ];
    }

    if (hasMonitoringAccess) {
      return scientificAndTeachingItems;
    }

    return [];
  })();

  const taskManagerItems = task.filter((nav) => nav.name === "Tapşırıq meneceri");
  const reportItems = task.filter((nav) => nav.name === "Sorğu nəticələri");

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-3 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.png"
                alt="Logo"
                width={200}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.png"
                alt="Logo"
                width={200}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              {generalMenuForRole.length > 0 && (
                <h2
                  className={`mb-4 text-xs  flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Məlumatların redaktəsi"
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
              )}
              {renderMenuItems(
                generalMenuForRole,
                "general"
              )}
            </div>
            {canAccessTaskManager && (
              <div>
                <h2
                  className={`mb-4 text-xs  flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Tapşırıqların idarə olunması"
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {taskManagerItems.length > 0 && renderMenuItems(taskManagerItems, "task", 0)}

                {canSeeReportItems && reportItems.length > 0 && (
                  <>
                    <h2
                      className={`mb-4 mt-4 text-xs  flex leading-[20px] text-gray-400 ${
                        !isExpanded && !isHovered
                          ? "lg:justify-center"
                          : "justify-start"
                      }`}
                    >
                      {isExpanded || isHovered || isMobileOpen ? (
                        "Hesabatlar"
                      ) : (
                        <HorizontaLDots className="size-6" />
                      )}
                    </h2>
                    {renderMenuItems(reportItems, "task", taskManagerItems.length)}
                  </>
                )}
              </div>
            )}
            {(isAdmin || hasMonitoringAccess) && (
              <div className="">
                <h2
                  className={`mb-4 text-xs  flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Monitorinq"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(monitoring, "monitoring")}
              </div>
            )}
            {isAdmin && (
              <div className="">
                <h2
                  className={`mb-4 text-xs  flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Hesabatlar"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(reports, "reports")}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
