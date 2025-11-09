interface OrganizationInfoProps {
  name: string;
  email?: string;
  phone?: string;
  url?: string;
}

export function OrganizationInfo({
  name,
  email,
  phone,
  url,
}: OrganizationInfoProps) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-dark mb-2">{name}</h1>
        <p className="text-neutral-600">Organization Dashboard</p>
      </div>

      {email && (
        <p className="text-neutral-600 mb-2">
          <strong>Email:</strong> {email}
        </p>
      )}
      {phone && (
        <p className="text-neutral-600 mb-2">
          <strong>Phone:</strong> {phone}
        </p>
      )}
      {url && (
        <p className="text-neutral-600 mb-8">
          <strong>Website:</strong>{" "}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-dark hover:underline"
          >
            {url}
          </a>
        </p>
      )}
    </>
  );
}
