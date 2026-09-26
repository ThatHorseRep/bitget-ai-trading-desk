declare module "lucide-react" {
  import * as React from "react";

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  export const Play: LucideIcon;
  export const Pause: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Volume2: LucideIcon;
  export const VolumeX: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Maximize2: LucideIcon;
  export const Minimize2: LucideIcon;
  export const Sliders: LucideIcon;
  export const Terminal: LucideIcon;
  export const Activity: LucideIcon;
  export const AlertTriangle: LucideIcon;
}
