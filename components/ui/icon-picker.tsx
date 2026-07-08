'use client';

import React from 'react';
import {
  Folder,
  FolderOpen,
  Home,
  Heart,
  Star,
  Bookmark,
  Pin,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Grid,
  Settings,
  Trash2,
  Send,
  MousePointer,
  Copy,
  MessageCircle,
  CheckCircle,
  Bell,
  BellOff,
  Phone,
  PhoneOff,
  Flag,
  Lock,
  Unlock,
  User,
  Users,
  UserCircle,
  UserPlus,
  Moon,
  X,
  XCircle,
  PlusCircle,
  MinusCircle,
  Ban,
  Compass,
  Info,
  AlertCircle,
  HelpCircle,
  Type,
  Camera,
  Video,
  Image,
  BookOpen,
  Zap,
  ZapOff,
  AlarmClock,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Globe,
  MapPin,
  ShieldCheck,
  Bus,
  CreditCard,
  BarChart3,
  Layout,
  Mail,
  FileText,
  FilePlus,
  FileEdit,
  FileOutput,
  FileSearch,
  FileCheck,
  BarChart2,
  MonitorPlay,
  Store,
  Clock,
  Calendar,
  CalendarCheck,
  Megaphone,
  Puzzle,
  Gift,
  Percent,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Layers,
  Clipboard,
  Briefcase,
  Flame,
  Leaf,
  Crown,
  FlaskConical,
  Monitor,
  Smartphone,
  Timer,
  Search,
  Car,
  ShoppingBasket,
  Utensils,
  GraduationCap,
  Truck,
  Coffee,
  Play,
  Palette,
  Wrench,
  PenTool,
  Bike,
  Archive,
  Check,
  Target,
  Sparkles,
  Trophy,
  Music,
  Hash,
  AtSign,
  MapPinned,
  Package,
  Rocket,
  Lightbulb,
  Sun,
  Code,
  Globe2,
  Building,
  Mountain,
  Plane,
  Train,
  Ship,
  Waves,
  Dumbbell,
  Apple,
  Pizza,
  Sandwich,
  IceCream,
  Wine,
  Beer,
  Scissors,
  Shirt,
  Watch,
  Glasses,
  Headphones,
  Tv,
  Printer,
  Wifi,
  Battery,
  Plug,
  Key,
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Activity,
  Microscope,
  Stethoscope,
  Pill,
  Syringe,
  Baby,
  Dog,
  Cat,
  Bird,
  Fish,
  Flower,
  Trees,
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  Map,
  Navigation,
  Anchor,
  Tent,
  Hammer,
  Paintbrush,
  Film,
  Radio,
  Keyboard,
  Mouse,
  HardDrive,
  Cpu,
  Github,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  MessageSquare,
  AtSign as Email,
  Phone as PhoneFilled,
  Share2,
  Link,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  Maximize,
  Minimize,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Zap as Lightning,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const FOLDER_ICONS = [
  // Navigation & Places
  { name: 'Folder', value: 'folder', icon: Folder },
  { name: 'Folder Open', value: 'folder-open', icon: FolderOpen },
  { name: 'Home', value: 'home', icon: Home },
  { name: 'Globe', value: 'globe', icon: Globe },
  { name: 'Map Pin', value: 'map-pin', icon: MapPin },
  { name: 'Map', value: 'map', icon: Map },
  { name: 'Navigation', value: 'navigation', icon: Navigation },
  { name: 'Compass', value: 'compass', icon: Compass },
  { name: 'Building', value: 'building', icon: Building },
  { name: 'Mountain', value: 'mountain', icon: Mountain },

  // Actions & Status
  { name: 'Bookmark', value: 'bookmark', icon: Bookmark },
  { name: 'Star', value: 'star', icon: Star },
  { name: 'Heart', value: 'heart', icon: Heart },
  { name: 'Pin', value: 'pin', icon: Pin },
  { name: 'Flag', value: 'flag', icon: Flag },
  { name: 'Check Circle', value: 'check-circle', icon: CheckCircle },
  { name: 'Target', value: 'target', icon: Target },
  { name: 'Trophy', value: 'trophy', icon: Trophy },
  { name: 'Crown', value: 'crown', icon: Crown },
  { name: 'Sparkles', value: 'sparkles', icon: Sparkles },

  // People & Social
  { name: 'User', value: 'user', icon: User },
  { name: 'Users', value: 'users', icon: Users },
  { name: 'User Circle', value: 'user-circle', icon: UserCircle },
  { name: 'User Plus', value: 'user-plus', icon: UserPlus },
  { name: 'Smile', value: 'smile', icon: Smile },
  { name: 'Frown', value: 'frown', icon: Frown },
  { name: 'Thumbs Up', value: 'thumbs-up', icon: ThumbsUp },
  { name: 'Thumbs Down', value: 'thumbs-down', icon: ThumbsDown },

  // Communication
  { name: 'Message', value: 'message', icon: MessageCircle },
  { name: 'Message Square', value: 'message-square', icon: MessageSquare },
  { name: 'Mail', value: 'mail', icon: Mail },
  { name: 'Bell', value: 'bell', icon: Bell },
  { name: 'Bell Off', value: 'bell-off', icon: BellOff },
  { name: 'Phone', value: 'phone', icon: Phone },
  { name: 'Phone Off', value: 'phone-off', icon: PhoneOff },
  { name: 'Send', value: 'send', icon: Send },
  { name: 'Share', value: 'share', icon: Share2 },
  { name: 'Link', value: 'link', icon: Link },

  // Files & Documents
  { name: 'File Text', value: 'file-text', icon: FileText },
  { name: 'File Plus', value: 'file-plus', icon: FilePlus },
  { name: 'File Edit', value: 'file-edit', icon: FileEdit },
  { name: 'File Output', value: 'file-output', icon: FileOutput },
  { name: 'File Search', value: 'file-search', icon: FileSearch },
  { name: 'File Check', value: 'file-check', icon: FileCheck },
  { name: 'Clipboard', value: 'clipboard', icon: Clipboard },
  { name: 'Copy', value: 'copy', icon: Copy },
  { name: 'Archive', value: 'archive', icon: Archive },
  { name: 'Package', value: 'package', icon: Package },

  // Media & Content
  { name: 'Image', value: 'image', icon: Image },
  { name: 'Camera', value: 'camera', icon: Camera },
  { name: 'Video', value: 'video', icon: Video },
  { name: 'Play', value: 'play', icon: Play },
  { name: 'Music', value: 'music', icon: Music },
  { name: 'Headphones', value: 'headphones', icon: Headphones },
  { name: 'Radio', value: 'radio', icon: Radio },
  { name: 'Tv', value: 'tv', icon: Tv },
  { name: 'Film', value: 'film', icon: Film },
  { name: 'Mic', value: 'mic', icon: Mic },

  // Work & Productivity
  { name: 'Briefcase', value: 'briefcase', icon: Briefcase },
  { name: 'Book', value: 'book', icon: BookOpen },
  { name: 'Layers', value: 'layers', icon: Layers },
  { name: 'Layout', value: 'layout', icon: Layout },
  { name: 'Grid', value: 'grid', icon: Grid },
  { name: 'List', value: 'list', icon: FileText },
  { name: 'Calendar', value: 'calendar', icon: Calendar },
  { name: 'Calendar Check', value: 'calendar-check', icon: CalendarCheck },
  { name: 'Clock', value: 'clock', icon: Clock },
  { name: 'Alarm', value: 'alarm', icon: AlarmClock },

  // Charts & Analytics
  { name: 'Bar Chart', value: 'bar-chart', icon: BarChart3 },
  { name: 'Bar Chart 2', value: 'bar-chart-2', icon: BarChart2 },
  { name: 'Pie Chart', value: 'pie-chart', icon: PieChart },
  { name: 'Trending Up', value: 'trending-up', icon: TrendingUp },
  { name: 'Trending Down', value: 'trending-down', icon: TrendingDown },
  { name: 'Activity', value: 'activity', icon: Activity },

  // Commerce & Finance
  { name: 'Shopping Bag', value: 'shopping-bag', icon: ShoppingBag },
  { name: 'Shopping Cart', value: 'shopping-cart', icon: ShoppingCart },
  { name: 'Shopping Basket', value: 'shopping-basket', icon: ShoppingBasket },
  { name: 'Tag', value: 'tag', icon: Tag },
  { name: 'Percent', value: 'percent', icon: Percent },
  { name: 'Gift', value: 'gift', icon: Gift },
  { name: 'Wallet', value: 'wallet', icon: Wallet },
  { name: 'Dollar', value: 'dollar', icon: DollarSign },
  { name: 'Credit Card', value: 'credit-card', icon: CreditCard },
  { name: 'Store', value: 'store', icon: Store },

  // Tech & Devices
  { name: 'Monitor', value: 'monitor', icon: Monitor },
  { name: 'Smartphone', value: 'smartphone', icon: Smartphone },
  { name: 'Keyboard', value: 'keyboard', icon: Keyboard },
  { name: 'Hard Drive', value: 'hard-drive', icon: HardDrive },
  { name: 'Cpu', value: 'cpu', icon: Cpu },
  { name: 'Wifi', value: 'wifi', icon: Wifi },
  { name: 'Battery', value: 'battery', icon: Battery },
  { name: 'Printer', value: 'printer', icon: Printer },
  { name: 'Code', value: 'code', icon: Code },
  { name: 'Settings', value: 'settings', icon: Settings },

  // Tools & Actions
  { name: 'Wrench', value: 'wrench', icon: Wrench },
  { name: 'Hammer', value: 'hammer', icon: Hammer },
  { name: 'Paintbrush', value: 'paintbrush', icon: Paintbrush },
  { name: 'Palette', value: 'palette', icon: Palette },
  { name: 'Pen Tool', value: 'pen-tool', icon: PenTool },
  { name: 'Scissors', value: 'scissors', icon: Scissors },
  { name: 'Key', value: 'key', icon: Key },
  { name: 'Lock', value: 'lock', icon: Lock },
  { name: 'Unlock', value: 'unlock', icon: Unlock },
  { name: 'Shield', value: 'shield', icon: ShieldCheck },

  // Transport & Travel
  { name: 'Car', value: 'car', icon: Car },
  { name: 'Bus', value: 'bus', icon: Bus },
  { name: 'Truck', value: 'truck', icon: Truck },
  { name: 'Train', value: 'train', icon: Train },
  { name: 'Plane', value: 'plane', icon: Plane },
  { name: 'Ship', value: 'ship', icon: Ship },
  { name: 'Bike', value: 'bike', icon: Bike },
  { name: 'Anchor', value: 'anchor', icon: Anchor },
  { name: 'Rocket', value: 'rocket', icon: Rocket },
  { name: 'Tent', value: 'tent', icon: Tent },

  // Food & Drink
  { name: 'Coffee', value: 'coffee', icon: Coffee },
  { name: 'Utensils', value: 'utensils', icon: Utensils },
  { name: 'Apple', value: 'apple', icon: Apple },
  { name: 'Pizza', value: 'pizza', icon: Pizza },
  { name: 'Sandwich', value: 'sandwich', icon: Sandwich },
  { name: 'Ice Cream', value: 'ice-cream', icon: IceCream },
  { name: 'Wine', value: 'wine', icon: Wine },
  { name: 'Beer', value: 'beer', icon: Beer },

  // Nature & Weather
  { name: 'Leaf', value: 'leaf', icon: Leaf },
  { name: 'Flower', value: 'flower', icon: Flower },
  { name: 'Trees', value: 'trees', icon: Trees },
  { name: 'Sun', value: 'sun', icon: Sun },
  { name: 'Moon', value: 'moon', icon: Moon },
  { name: 'Cloud', value: 'cloud', icon: Cloud },
  { name: 'Rain', value: 'rain', icon: CloudRain },
  { name: 'Snow', value: 'snow', icon: Snowflake },
  { name: 'Wind', value: 'wind', icon: Wind },
  { name: 'Waves', value: 'waves', icon: Waves },

  // Health & Science
  { name: 'Flame', value: 'flame', icon: Flame },
  { name: 'Flask', value: 'flask', icon: FlaskConical },
  { name: 'Microscope', value: 'microscope', icon: Microscope },
  { name: 'Stethoscope', value: 'stethoscope', icon: Stethoscope },
  { name: 'Pill', value: 'pill', icon: Pill },
  { name: 'Dumbbell', value: 'dumbbell', icon: Dumbbell },
  { name: 'Timer', value: 'timer', icon: Timer },
  { name: 'Lightbulb', value: 'lightbulb', icon: Lightbulb },
  { name: 'Zap', value: 'zap', icon: Zap },
  { name: 'Megaphone', value: 'megaphone', icon: Megaphone },

  // Animals
  { name: 'Dog', value: 'dog', icon: Dog },
  { name: 'Cat', value: 'cat', icon: Cat },
  { name: 'Bird', value: 'bird', icon: Bird },
  { name: 'Fish', value: 'fish', icon: Fish },

  // Fashion
  { name: 'Shirt', value: 'shirt', icon: Shirt },
  { name: 'Watch', value: 'watch', icon: Watch },
  { name: 'Glasses', value: 'glasses', icon: Glasses },

  // Education
  { name: 'Graduation Cap', value: 'graduation-cap', icon: GraduationCap },
  { name: 'Puzzle', value: 'puzzle', icon: Puzzle },
  { name: 'Hash', value: 'hash', icon: Hash },
  { name: 'Type', value: 'type', icon: Type },
  { name: 'Search', value: 'search', icon: Search },
  { name: 'Download', value: 'download', icon: Download },
  { name: 'Upload', value: 'upload', icon: Upload },
];

const ICON_COMPONENTS: Record<string, React.ComponentType<any>> = Object.fromEntries(
  FOLDER_ICONS.map(i => [i.value, i.icon])
);

export function getIconComponent(iconName: string) {
  return ICON_COMPONENTS[iconName] || Folder;
}

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [search, setSearch] = React.useState('');

  const filtered = FOLDER_ICONS.filter(icon =>
    icon.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">{label}</label>
      )}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search icons..."
        className="w-full text-xs px-2 py-1.5 bg-stone-50 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 outline-none focus:border-stone-400 dark:focus:border-stone-500 placeholder:text-stone-400"
      />
      <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
        {filtered.map(icon => {
          const IconComponent = icon.icon;
          const isSelected = value === icon.value;
          return (
            <button
              key={icon.value}
              onClick={() => onChange(icon.value)}
              className={cn(
                'p-2 rounded-lg border transition-all hover:bg-stone-100 dark:hover:bg-stone-700',
                isSelected
                  ? 'border-stone-900 dark:border-stone-100 bg-stone-100 dark:bg-stone-700'
                  : 'border-stone-200 dark:border-stone-600'
              )}
              title={icon.name}
            >
              <IconComponent className="w-4 h-4 mx-auto text-stone-600 dark:text-stone-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
