export default function Head() {
  return (
    <>
      <style>{`
        .event-header .event-title-names {
          font-size: clamp(4.4rem, 10vw, 7rem) !important;
          line-height: 0.95 !important;
        }

        @media (max-width: 600px) {
          .event-header .event-title-names {
            font-size: clamp(4rem, 16vw, 5.8rem) !important;
            line-height: 0.94 !important;
          }
        }
      `}</style>
    </>
  );
}
