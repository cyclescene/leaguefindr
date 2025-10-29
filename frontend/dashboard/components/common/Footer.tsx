export function Footer() {
  return (
    <footer className="bg-brand-dark text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-center text-sm text-brand-light">
          leaguefindr.com © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
