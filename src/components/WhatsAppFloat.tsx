import { useLocation } from "react-router-dom";
import { whatsappLink } from "@/data/properties";
import { trackWhatsAppClick } from "@/lib/analytics";

const WHATSAPP_URL = whatsappLink(
  "Olá! Vim pelo site e gostaria de mais informações sobre os imóveis.",
);
export default function WhatsAppFloat() {
  const { pathname } = useLocation();
  const hiddenOnAdmin = pathname.startsWith("/admin");

  if (hiddenOnAdmin) return null;

  return (
    <>
      <style>{`
        @keyframes wa-pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.55); }
          70% { box-shadow: 0 0 0 16px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
        .wa-float-wrap {
          position: fixed;
          right: max(16px, env(safe-area-inset-right));
          bottom: max(16px, env(safe-area-inset-bottom));
          z-index: 60;
          display: flex;
          max-width: calc(100vw - 32px);
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }
        .wa-float-button {
          width: 56px;
          height: 56px;
          animation: wa-pulse 2.2s infinite;
        }
        .wa-float-button:hover {
          animation: none;
        }
        @media (min-width: 640px) {
          .wa-float-wrap {
            right: max(28px, env(safe-area-inset-right));
            bottom: max(28px, env(safe-area-inset-bottom));
          }
          .wa-float-button {
            width: 60px;
            height: 60px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .wa-float-button {
            animation: none;
          }
        }
      `}</style>

      <div className="wa-float-wrap">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar com Ro Molina pelo WhatsApp"
          data-gtm-link="whatsapp_float"
          onClick={() => trackWhatsAppClick("floating_button")}
          className="wa-float-button flex shrink-0 items-center justify-center rounded-full bg-[#25D366] transition-transform duration-200 hover:scale-110"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            fill="#fff"
            aria-hidden="true"
          >
            <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16.003c0 2.352.617 4.642 1.79 6.655L2.667 29.333l6.878-1.764c1.94 1.06 4.13 1.618 6.458 1.618 7.366 0 13.333-5.97 13.333-13.334C29.336 8.637 23.369 2.667 16.003 2.667zm0 24.267c-2.067 0-4.094-.553-5.866-1.6l-.42-.248-4.082 1.048 1.073-3.962-.274-.432A10.59 10.59 0 0 1 5.335 16c0-5.88 4.785-10.667 10.667-10.667S26.67 10.12 26.67 16c0 5.882-4.787 10.667-10.667 10.667zm5.847-7.986c-.32-.16-1.893-.934-2.187-1.04-.293-.107-.507-.16-.72.16-.213.32-.827 1.04-1.014 1.254-.187.213-.373.24-.693.08-.32-.16-1.352-.498-2.574-1.587-.952-.848-1.594-1.895-1.78-2.215-.187-.32-.02-.493.14-.653.144-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.734-.987-2.374-.26-.624-.524-.539-.72-.549l-.613-.011a1.176 1.176 0 0 0-.854.4c-.293.32-1.12 1.094-1.12 2.667s1.147 3.094 1.307 3.307c.16.213 2.253 3.44 5.46 4.827.763.33 1.36.526 1.826.674.767.243 1.466.209 2.019.127.616-.092 1.893-.774 2.16-1.52.267-.747.267-1.387.187-1.52-.08-.133-.293-.213-.613-.373z" />
          </svg>
        </a>
      </div>
    </>
  );
}
