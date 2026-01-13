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
        display: none;
      }
        .page-title h1 {
          font-size: 50px;
        }
          .page-title p {
            font-size: 30px;
          }
            .py-8.bg-black.text-white {
            padding: 0;
            }
    `}</style>
    </div>
  );
}