export default function Head() {
  return (
    <>
      <style>{`
        .event-header-card {
          min-height: 135px !important;
          height: 135px !important;
          padding: 7px 20px 3px !important;
        }
        .event-header {
          min-height: 0 !important;
          justify-content: center !important;
        }
        .event-header .event-title-context {
          font-size: .85rem !important;
          line-height: 1 !important;
          margin-bottom: 2px !important;
          letter-spacing: .12em !important;
        }
        .event-header .event-title-names {
          font-size: clamp(2rem, 4.2vw, 3rem) !important;
          line-height: .95 !important;
        }
        .event-header .event-date {
          font-size: .75rem !important;
        }
        .lehnova-welcome-message {
          margin: 5px auto 0 !important;
          font-size: clamp(.9rem, 2vw, 1.25rem) !important;
          line-height: 1.15 !important;
        }
        .event-nav {
          padding-top: 1px !important;
          margin-top: auto !important;
        }

        @media (max-width: 600px) {
          .event-header-card {
            min-height: 135px !important;
            height: 135px !important;
            padding: 6px 10px 3px !important;
          }
          .event-header .event-title-context {
            font-size: .8rem !important;
            margin-bottom: 2px !important;
          }
          .event-header .event-title-names {
            font-size: clamp(1.8rem, 8vw, 2.5rem) !important;
            line-height: .94 !important;
          }
          .event-header .event-date {
            font-size: .7rem !important;
          }
          .lehnova-welcome-message {
            margin-top: 4px !important;
            font-size: clamp(.85rem, 3.6vw, 1.1rem) !important;
          }
        }
      `}</style>
    </>
  );
}
