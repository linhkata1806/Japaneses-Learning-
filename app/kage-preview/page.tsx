import "./kage-preview.css";

export default function KagePreviewPage() {
  return (
    <main className="kage-preview">
      <iframe
        className="shader-frame"
        src="/landing-pages/kage.html"
        title="Manabi — học JLPT N5 đến N1"
        loading="eager"
        sandbox="allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
      />
    </main>
  );
}
