interface Props {
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
}

export default function ProductStatusBadge({ status }: Props) {
  const styles =
    status === "ACTIVE"
      ? "bg-green-100 text-green-700"
      : status === "DRAFT"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-200 text-gray-600";

  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-1 rounded-full
        text-xs font-medium
        ${styles}
      `}
    >
      {status}
    </span>
  );
}
