import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useLocation } from "react-router-dom";
import { whatsappLink } from "@/data/properties";

const WHATSAPP_URL = whatsappLink(
  "Olá! Vim pelo site e gostaria de mais informações sobre os imóveis.",
);
const NOTIFICATION_TEXT = "Fale comigo! 👋";
const FIRST_DELAY = 3000;
const REPEAT_INTERVAL = 18000;
const VISIBLE_DURATION = 5000;

export default function WhatsAppFloat() {
  const { pathname } = useLocation();
  const hiddenOnAdmin = pathname.startsWith("/admin");
  const [hovered, setHovered] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (dismissed || hiddenOnAdmin) return;

    const runNotification = () => {
      setShowNotification(true);
      setIsTyping(true);
      setTypedText("");

      let characterIndex = 0;
      const typeNextCharacter = () => {
        characterIndex += 1;
        setTypedText(NOTIFICATION_TEXT.slice(0, characterIndex));

        if (characterIndex < NOTIFICATION_TEXT.length) {
          typingRef.current = setTimeout(typeNextCharacter, 55);
          return;
        }

        setIsTyping(false);
        hideRef.current = setTimeout(() => {
          setShowNotification(false);
          setTypedText("");
        }, VISIBLE_DURATION);
      };

      typingRef.current = setTimeout(typeNextCharacter, 55);
    };

    const firstTimer = setTimeout(runNotification, FIRST_DELAY);
    const repeatTimer = setInterval(runNotification, REPEAT_INTERVAL);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(repeatTimer);
      if (typingRef.current) clearTimeout(typingRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
    };
  }, [dismissed, hiddenOnAdmin]);

  if (hiddenOnAdmin) return null;

  const handleDismiss = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDismissed(true);
    setShowNotification(false);
    if (typingRef.current) clearTimeout(typingRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);
  };

  return (
    <>
      <style>{`
        @keyframes wa-pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.55); }
          70% { box-shadow: 0 0 0 16px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
        @keyframes wa-bubble-in {
          from { opacity: 0; transform: translateY(12px) scale(0.88); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wa-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
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
        .wa-notification {
          animation: wa-bubble-in 0.35s cubic-bezier(.34, 1.56, .64, 1) forwards;
        }
        .wa-cursor {
          display: inline-block;
          width: 2px;
          height: 14px;
          margin-left: 2px;
          border-radius: 1px;
          background: rgba(255, 255, 255, 0.85);
          vertical-align: middle;
          animation: wa-blink 0.7s step-end infinite;
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
          .wa-float-button,
          .wa-notification,
          .wa-cursor {
            animation: none;
          }
        }
      `}</style>

      <div className="wa-float-wrap">
        {showNotification && (
          <div
            className="wa-notification relative box-border w-auto max-w-[min(230px,calc(100vw-32px))] select-none rounded-[16px_16px_4px_16px] bg-[#128C7E] py-2.5 pl-3.5 pr-9 text-sm font-medium leading-snug tracking-[0.01em] text-white shadow-[0_6px_24px_rgba(0,0,0,0.22)]"
            role="status"
            aria-live="polite"
          >
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.04em] opacity-80">
              <svg width="12" height="12" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
                <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16.003c0 2.352.617 4.642 1.79 6.655L2.667 29.333l6.878-1.764c1.94 1.06 4.13 1.618 6.458 1.618 7.366 0 13.333-5.97 13.333-13.334C29.336 8.637 23.369 2.667 16.003 2.667z" />
              </svg>
              Ro Molina Imóveis
            </div>

            <span className="block text-[#e8fdd8]">
              {typedText}
              {isTyping && <span className="wa-cursor" />}
            </span>

            {!isTyping && (
              <span className="mt-1 block text-right text-[11px] opacity-65">
                agora ✓✓
              </span>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Fechar aviso do WhatsApp"
              className="absolute right-2 top-1.5 border-0 bg-transparent px-1 py-0.5 text-sm leading-none text-white/70 transition-colors hover:text-white"
            >
              ×
            </button>

            <span
              className="absolute -bottom-2 right-3.5 h-0 w-0 border-l-[8px] border-t-[8px] border-l-transparent border-t-[#128C7E]"
              aria-hidden="true"
            />
          </div>
        )}

        {!showNotification && hovered && (
          <div className="wa-notification pointer-events-none whitespace-nowrap rounded-full bg-[#25D366] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(37,211,102,0.35)]">
            Fale comigo!
          </div>
        )}

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar com Ro Molina pelo WhatsApp"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`wa-float-button flex shrink-0 items-center justify-center rounded-full bg-[#25D366] transition-transform duration-200 ${
            hovered ? "scale-110" : "scale-100"
          }`}
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
