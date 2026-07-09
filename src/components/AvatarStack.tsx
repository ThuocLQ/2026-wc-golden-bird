type AvatarPerson = {
  id?: string;
  userId?: string;
  displayName: string;
};

export function AvatarStack({ people, max = 5 }: { people: AvatarPerson[]; max?: number }) {
  const visible = people.slice(0, max);
  const remaining = people.length - visible.length;

  if (people.length === 0) {
    return <span className="avatar-empty">Chưa có ai</span>;
  }

  return (
    <div className="avatar-stack" aria-label={people.map((person) => person.displayName).join(", ")}>
      {visible.map((person) => (
        <span className="avatar-dot" key={person.id ?? person.userId ?? person.displayName} title={person.displayName}>
          {initials(person.displayName)}
        </span>
      ))}
      {remaining > 0 && <span className="avatar-more">+{remaining}</span>}
    </div>
  );
}

export function AvatarName({ name }: { name: string }) {
  return (
    <span className="avatar-name">
      <span className="avatar-dot" title={name}>
        {initials(name)}
      </span>
      <strong>{name}</strong>
    </span>
  );
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}
