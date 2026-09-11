export default function Head() {
  return (
    <>
      <style>{`
        .event-header .event-title-context {
          font-size: 1.7rem !important;
          line-height: 1.05 !important;
        }
        .event-header .event-title-names {
          font-size: clamp(4.8rem, 11vw, 7.4rem) !important;
          line-height: 0.94 !important;
        }
        .event-header .event-date {
          font-size: 1.15rem !important;
        }

        @media (max-width: 600px) {
          .event-header .event-title-context {
            font-size: 1.42rem !important;
            line-height: 1.05 !important;
          }
          .event-header .event-title-names {
            font-size: clamp(4.4rem, 18vw, 6.2rem) !important;
            line-height: 0.92 !important;
          }
          .event-header .event-date {
            font-size: 1.05rem !important;
          }
        }
      `}</style>
    </>
  );
}
