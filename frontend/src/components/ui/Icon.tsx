import {
  ArrowRight,
  AlertCircle,
  Bell,
  Calendar,
  Car,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  FileText,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Pen,
  Plus,
  RotateCcw,
  Settings,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';

// Icon mapping for centralized imports
const iconMap = {
  'arrow-right': ArrowRight,
  'alert-circle': AlertCircle,
  bell: Bell,
  calendar: Calendar,
  car: Car,
  check: Check,
  'check-circle': CheckCircle,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  clock: Clock,
  'credit-card': CreditCard,
  download: Download,
  'file-text': FileText,
  lock: Lock,
  'log-out': LogOut,
  mail: Mail,
  'map-pin': MapPin,
  menu: Menu,
  pen: Pen,
  plus: Plus,
  'rotate-ccw': RotateCcw,
  settings: Settings,
  user: User,
  x: X,
} as const;

export type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, className = '', strokeWidth = 2 }: IconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon map`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      className={className}
      strokeWidth={strokeWidth}
    />
  );
}

// Export specific icons for direct use where needed
export {
  ArrowRight,
  AlertCircle,
  Bell,
  Calendar,
  Car,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  FileText,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Pen,
  Plus,
  RotateCcw,
  Settings,
  User,
  X,
};

export type { LucideIcon };