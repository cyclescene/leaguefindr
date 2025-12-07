interface OrganizationInfoProps {
  name: string;
  email?: string;
  phone?: string;
  url?: string;
}

export function OrganizationInfo({
  name,
}: OrganizationInfoProps) {
  return (
    <>
      <div>
        <h1 className="text-3xl font-bold text-brand-dark mb-2">{name}</h1>
      </div>
    </>
  );
}
