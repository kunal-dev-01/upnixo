import { Credits, Dashboard, Users } from "@/svg/Auth";
import { Settings } from "@/svg/Common";
import { WebHook } from "@/svg/Extra";
import { Payment, Projects, Support } from "@/svg/More";

export const DASHBOARD_LINKS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <Dashboard className="w-5 h-5" />,
  },
  {
    name: "Clients",
    href: "/clients",
    icon: <Users className="w-6.5 h-6.5" />,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: <Projects className="w-6.5 h-6.5" />,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: <Payment className="w-6 h-6" />,
  },
  {
    name: "Subscriptions",
    href: "/subscriptions",
    icon: <Credits className="w-6 h-6" />,
  },
  {
    name: "Webhooks",
    href: "/webhooks",
    icon: <WebHook className="w-6 h-6" />,
  },
  { name: "Support", href: "/support", icon: <Support className="w-6 h-6" /> },
  {
    name: "Account",
    href: "/account",
    icon: <Settings className="w-6.5 h-6.5" />,
  },
];
