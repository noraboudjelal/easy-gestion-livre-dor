import IdleCover from "./IdleCover";
import FilPhotoCover from "./FilPhotoCover";

export default function LeFilEventLayout({ children }) {
  return (
    <>
      <FilPhotoCover />
      {children}
      <IdleCover timeoutMs={30000} />
    </>
  );
}
