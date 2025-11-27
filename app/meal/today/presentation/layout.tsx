export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full">
      {children}
      <style>{`
      .leaflet-control-container {
        display: none;;
      }
    `}</style>
    </div>
  );
}