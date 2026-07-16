/*
 * AliasChip / AliasAvatar — render a student's animal alias (coloured circle +
 * category icon + name). Students carry no real name, so this is how they show
 * up everywhere a teacher would previously have seen a name.
 */
import type { User } from "@/types";
import { getAnimal } from "@/data/animals";
import { getAnimalIcon, getAnimalColor } from "@/lib/icons";

export function AliasAvatar({
  user,
  size = 36,
}: {
  user: User;
  size?: number;
}) {
  const animal = getAnimal(user.animalId ?? "");
  const color = animal ? getAnimalColor(animal.id) : "#3d7a5e";
  const Icon = animal ? getAnimalIcon(animal.kind) : null;
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-cream"
      style={{ height: size, width: size, background: color }}
      title={user.name}
    >
      {Icon ? (
        <Icon style={{ height: size * 0.5, width: size * 0.5 }} aria-hidden strokeWidth={1.75} />
      ) : (
        <span className="text-xs font-bold">{user.name.slice(0, 1)}</span>
      )}
    </span>
  );
}

export function AliasChip({ user, size = 36 }: { user: User; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <AliasAvatar user={user} size={size} />
      <span className="font-semibold text-forest-900">{user.name}</span>
    </span>
  );
}
