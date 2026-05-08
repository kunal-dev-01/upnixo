import { Dashboard } from "@/svg/Auth";
import { Settings } from "@/svg/Common";
import { Books, Payment, Support } from "@/svg/More";

export const NAV_LINKS = [
  { name: "Showcase", href: "/showcase" },
  { name: "Services", href: "/services" },
  { name: "How it works", href: "/how-it-works" },
  { name: "Pricing", href: "/pricing" },
];

export const FOOTER_LINKS = [
  { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms of Service", href: "/terms-of-service" },
];

export const DASHBOARD_LINKS = [
  { name: 'Dashboard', href:'/dashboard', icon: <Dashboard className='w-5 h-5' /> },
  { name: 'Projects', href: '/projects', icon: <Books className='w-6 h-6' /> },
  { name: 'Payments', href: '/payments', icon: <Payment className='w-6 h-6' /> },
  { name: 'Support', href: '/support', icon: <Support className='w-6 h-6' /> },
  { name: 'Account', href:'/account', icon: <Settings className='w-6.5 h-6.5' /> }
];
