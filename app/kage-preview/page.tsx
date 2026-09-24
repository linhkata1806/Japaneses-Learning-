"use client";

import { KageLandingPage } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";
import "./kage-preview.css";

export default function KagePreviewPage() {
  return (
    <main className="kage-preview">
      <div className="shader-frame">
        <KageLandingPage
          headingFont="onest"
          bodyFont="onest"
          headingWeight="400"
          bodyWeight="300"
          primaryColor="#e0231c"
          headingSize={46}
          bodySize={17}
          headingLetterSpacing={-0.012}
        />
      </div>
    </main>
  );
}
