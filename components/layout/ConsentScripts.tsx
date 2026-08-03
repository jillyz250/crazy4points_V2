"use client";

/**
 * Consent-gated tracker loader (strict / GDPR "opt-in" model).
 *
 * Google Analytics is loaded in app/layout.tsx but starts in Google Consent
 * Mode with everything DENIED by default (see the "consent-default" script in
 * the layout), so until the visitor accepts, GA4 runs in its limited, cookieless
 * state — which is exactly what the privacy + cookie policies promise.
 *
 * The Meta (Facebook) Pixel is stricter still: its script is NOT fetched from
 * Facebook at all until the visitor explicitly accepts. This component:
 *   - on mount, reads the saved choice and, if "accepted", grants Google
 *     consent + injects the pixel;
 *   - listens for the banner's accept/decline events so a fresh choice takes
 *     effect immediately, without a page reload.
 *
 * Nothing here fires for a visitor who has not accepted. Declining (or simply
 * not choosing) leaves the pixel unloaded and Google in cookieless mode.
 */

import { useEffect } from "react";

const PIXEL_ID = "1576322157284881";

type W = Window & {
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
  __c4pPixelLoaded?: boolean;
};

function grantGoogleConsent() {
  const w = window as W;
  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
    });
  }
}

function denyGoogleConsent() {
  const w = window as W;
  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  }
}

function loadMetaPixel() {
  const w = window as W;
  if (w.__c4pPixelLoaded) return;
  w.__c4pPixelLoaded = true;

  // Inject the standard Meta Pixel bootstrap as a script element. Kept as a
  // string (not inline TS) because it's a minified vendor snippet with
  // self-referential assignments the type checker can't model. This only ever
  // runs after explicit consent, so Facebook's fbevents.js is never fetched
  // for a visitor who hasn't accepted.
  const s = document.createElement("script");
  s.id = "meta-pixel";
  s.textContent = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${PIXEL_ID}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(s);
}

export default function ConsentScripts() {
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("c4p_cookie_consent");
    } catch {
      /* private mode / storage disabled — treat as no consent */
    }

    // Returning accepted visitor: Google consent default is ALREADY granted by
    // the GA script (it reads the same localStorage), so we don't re-push a
    // gtag update here — that avoids any ordering race with the GA script. We
    // only need to load the Meta pixel, which the layout never loads on its own.
    if (stored === "accepted") {
      loadMetaPixel();
    }

    const onAccept = () => {
      grantGoogleConsent();
      loadMetaPixel();
    };
    const onDecline = () => {
      denyGoogleConsent();
      // Pixel is never loaded on decline; nothing to tear down.
    };

    window.addEventListener("c4p-consent-accepted", onAccept);
    window.addEventListener("c4p-consent-declined", onDecline);
    return () => {
      window.removeEventListener("c4p-consent-accepted", onAccept);
      window.removeEventListener("c4p-consent-declined", onDecline);
    };
  }, []);

  return null;
}
