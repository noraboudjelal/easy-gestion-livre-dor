import IdleCover from "./IdleCover";

export default function LeFilEventLayout({ children }) {
  return (
    <>
      {children}
      <IdleCover timeoutMs={30000} />
    </>
  );
}
