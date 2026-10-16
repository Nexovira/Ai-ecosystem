import React from 'react';
import {
  Globe,
  Smartphone,
  Layout,
  Palette,
  Cloud,
  Bot,
  Sparkles,
  Code,
  BarChart3,
  ShieldCheck,
  FileText,
  PenTool,
  Feather,
  Video,
  TrendingUp,
  Compass,
  Cpu,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Globe':
      return <Globe {...props} />;
    case 'Smartphone':
      return <Smartphone {...props} />;
    case 'Layout':
      return <Layout {...props} />;
    case 'Palette':
      return <Palette {...props} />;
    case 'Cloud':
      return <Cloud {...props} />;
    case 'Bot':
      return <Bot {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'Code':
      return <Code {...props} />;
    case 'BarChart3':
      return <BarChart3 {...props} />;
    case 'ShieldCheck':
      return <ShieldCheck {...props} />;
    case 'FileText':
      return <FileText {...props} />;
    case 'PenTool':
      return <PenTool {...props} />;
    case 'Feather':
      return <Feather {...props} />;
    case 'Video':
      return <Video {...props} />;
    case 'TrendingUp':
      return <TrendingUp {...props} />;
    case 'Compass':
      return <Compass {...props} />;
    case 'Cpu':
      return <Cpu {...props} />;
    default:
      return <HelpCircle {...props} />;
  }
};
