type Status =
  | "pendente"
  | "pago"
  | "em_andamento"
  | "pronto"
  | "entregue"
  | "cancelado";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; classes: string }> = {
  pendente: {
    label: "Pendente",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  pago: {
    label: "Pago",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  em_andamento: {
    label: "Em andamento",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  pronto: {
    label: "Pronto",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  entregue: {
    label: "Entregue",
    classes: "bg-gray-50 text-gray-600 border-gray-200",
  },
  cancelado: {
    label: "Cancelado",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes} ${className}`}
    >
      {config.label}
    </span>
  );
}
