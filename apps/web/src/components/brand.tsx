import { ChartNoAxesCombined } from 'lucide-react';

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-icon">
        <ChartNoAxesCombined size={23} strokeWidth={2.2} />
      </span>
      <span>
        finance<span className="brand-pro">pro</span>
      </span>
    </span>
  );
}
