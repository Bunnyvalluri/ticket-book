// Stub pages — will be fully implemented

export const makeAdminPage = (title, emoji) => {
  const Page = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-black" style={{ color: '#f0f0f8' }}>{emoji} {title}</h1>
      <div className="card p-8 text-center">
        <div className="text-5xl mb-4">{emoji}</div>
        <p style={{ color: '#606080' }}>
          {title} management is being built. Full CRUD UI coming soon.
        </p>
      </div>
    </div>
  );
  Page.displayName = title;
  return Page;
};
