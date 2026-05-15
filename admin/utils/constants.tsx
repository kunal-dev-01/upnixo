import { Credits, Dashboard } from "@/svg/Auth";
import { Settings } from "@/svg/Common";
import { Projects, Support } from "@/svg/More";

export const DASHBOARD_LINKS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <Dashboard className="w-5 h-5" />,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: <Projects className="w-6.5 h-6.5" />,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: <Credits className="w-6 h-6" />,
  },
  { name: "Support", href: "/support", icon: <Support className="w-6 h-6" /> },
  {
    name: "Account",
    href: "/account",
    icon: <Settings className="w-6.5 h-6.5" />,
  },
];
