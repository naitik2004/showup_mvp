export const SPORTS: Record<string, { icon: string; name: string }> = {
  badminton: { icon: "🏸", name: "Badminton" },
  football: { icon: "⚽", name: "Football" },
  basketball: { icon: "🏀", name: "Basketball" },
  tennis: { icon: "🎾", name: "Tennis" },
  cricket: { icon: "🏏", name: "Cricket" },
  table_tennis: { icon: "🏓", name: "Table tennis" },
  volleyball: { icon: "🏐", name: "Volleyball" },
};
export function sportNames(sports: string[] = []) {
  return sports
    .map((sport) =>
      SPORTS[sport]
        ? `${SPORTS[sport].icon} ${SPORTS[sport].name}`
        : sport.replaceAll("_", " "),
    )
    .join(" · ");
}
